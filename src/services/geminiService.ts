import { GoogleGenAI, FunctionDeclaration, Type } from "@google/genai";
import { db, auth } from "../firebase";
import { doc, updateDoc, increment, collection, query, where, getDocs, setDoc, serverTimestamp, deleteDoc, orderBy } from "firebase/firestore";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Function Declarations for Gemini
const updateBalanceFn: FunctionDeclaration = {
  name: "update_user_balance",
  description: "Update a user's balance by adding or subtracting an amount.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      username: {
        type: Type.STRING,
        description: "The username of the player.",
      },
      amount: {
        type: Type.NUMBER,
        description: "The amount to add (positive) or subtract (negative).",
      },
    },
    required: ["username", "amount"],
  },
};

const createPromoFn: FunctionDeclaration = {
  name: "create_promo_code",
  description: "Create a new promotional code for players to claim bonus.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      code: {
        type: Type.STRING,
        description: "The promo code string (e.g., WELCOME100).",
      },
      amount: {
        type: Type.NUMBER,
        description: "The bonus amount players will receive.",
      },
      maxUses: {
        type: Type.NUMBER,
        description: "Maximum number of times this code can be used (0 for unlimited).",
      },
      turnover: {
        type: Type.NUMBER,
        description: "Turnover multiplier (default is 5).",
      },
    },
    required: ["code", "amount"],
  },
};

const getUserInfoFn: FunctionDeclaration = {
  name: "get_user_info",
  description: "Get information about a user by their username.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      username: {
        type: Type.STRING,
        description: "The username to look up.",
      },
    },
    required: ["username"],
  },
};

const manageGameFn: FunctionDeclaration = {
  name: "manage_game",
  description: "Add, update or delete a game in the casino.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      action: {
        type: Type.STRING,
        enum: ["add", "update", "delete"],
        description: "The action to perform.",
      },
      gameId: {
        type: Type.STRING,
        description: "The unique ID of the game (e.g., 'aviator').",
      },
      name: {
        type: Type.STRING,
        description: "The display name of the game.",
      },
      logo: {
        type: Type.STRING,
        description: "The URL of the game logo image.",
      },
      url: {
        type: Type.STRING,
        description: "The URL to launch the game.",
      },
      provider: {
        type: Type.STRING,
        description: "The game provider name.",
      },
    },
    required: ["action", "gameId"],
  },
};

const updateAppSettingsFn: FunctionDeclaration = {
  name: "update_app_settings",
  description: "Update global application settings like casino name, social links, etc.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      casinoName: { type: Type.STRING },
      telegramLink: { type: Type.STRING },
      whatsappLink: { type: Type.STRING },
      facebookLink: { type: Type.STRING },
      supportEmail: { type: Type.STRING },
      minDeposit: { type: Type.NUMBER },
      minWithdraw: { type: Type.NUMBER },
      welcomeBonus: { type: Type.NUMBER },
      noticeText: { type: Type.STRING },
    },
  },
};

const fetchExternalApiFn: FunctionDeclaration = {
  name: "fetch_external_api",
  description: "Fetch data from an external web service API.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      url: {
        type: Type.STRING,
        description: "The full URL of the API endpoint.",
      },
      method: {
        type: Type.STRING,
        enum: ["GET", "POST"],
        description: "HTTP method to use.",
      },
      body: {
        type: Type.STRING,
        description: "JSON string of the request body (for POST).",
      },
    },
    required: ["url"],
  },
};

const createSystemAlertFn: FunctionDeclaration = {
  name: "create_system_alert",
  description: "Create a system alert for admins to see on the dashboard.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING },
      message: { type: Type.STRING },
      type: {
        type: Type.STRING,
        enum: ["info", "warning", "error", "success"],
      },
    },
    required: ["title", "message"],
  },
};

const getAppStatsFn: FunctionDeclaration = {
  name: "get_app_stats",
  description: "Get high-level statistics about the application (total users, transactions, etc.).",
  parameters: {
    type: Type.OBJECT,
    properties: {},
  },
};

const manageApiTokensFn: FunctionDeclaration = {
  name: "manage_api_tokens",
  description: "Create or delete API tokens for external integrations.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      action: {
        type: Type.STRING,
        enum: ["create", "delete"],
      },
      name: {
        type: Type.STRING,
        description: "The name/label for the token.",
      },
      tokenId: {
        type: Type.STRING,
        description: "The ID of the token to delete.",
      },
    },
    required: ["action"],
  },
};

const getSystemErrorsFn: FunctionDeclaration = {
  name: "get_system_errors",
  description: "Fetch recent system errors logged by the application.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      limit: {
        type: Type.NUMBER,
        description: "Number of recent errors to fetch (default 10).",
      },
      onlyUnresolved: {
        type: Type.BOOLEAN,
        description: "Whether to fetch only unresolved errors.",
      },
    },
  },
};

const fixSystemErrorFn: FunctionDeclaration = {
  name: "fix_system_error",
  description: "Mark a system error as resolved or perform a fix action.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      errorId: {
        type: Type.STRING,
        description: "The ID of the error log document.",
      },
      action: {
        type: Type.STRING,
        enum: ["resolve", "delete", "reset_user_data"],
        description: "The fix action to perform.",
      },
      targetId: {
        type: Type.STRING,
        description: "Optional target ID (e.g., userId) if action is reset_user_data.",
      },
    },
    required: ["errorId", "action"],
  },
};

// Implementation of functions
const functions: Record<string, Function> = {
  get_system_errors: async ({ limit = 10, onlyUnresolved = true }: any) => {
    let q = query(collection(db, 'system_errors'), orderBy('timestamp', 'desc'));
    if (onlyUnresolved) {
      q = query(collection(db, 'system_errors'), where('resolved', '==', false), orderBy('timestamp', 'desc'));
    }
    const snap = await getDocs(q);
    return snap.docs.slice(0, limit).map(d => ({ id: d.id, ...d.data() }));
  },
  fix_system_error: async ({ errorId, action, targetId }: any) => {
    if (action === 'resolve') {
      await updateDoc(doc(db, 'system_errors', errorId), { resolved: true });
      return { success: true, message: "Error marked as resolved." };
    } else if (action === 'delete') {
      await deleteDoc(doc(db, 'system_errors', errorId));
      return { success: true, message: "Error log deleted." };
    } else if (action === 'reset_user_data' && targetId) {
      await updateDoc(doc(db, 'users', targetId), { 
        balance: 0, 
        lastSpin: null,
        totalBets: 0,
        totalWins: 0
      });
      await updateDoc(doc(db, 'system_errors', errorId), { resolved: true });
      return { success: true, message: `User data reset and error resolved for ${targetId}.` };
    }
    return { error: "Invalid action or missing targetId." };
  },
  manage_api_tokens: async ({ action, name, tokenId }: any) => {
    if (action === 'create') {
      const tokenRef = doc(collection(db, 'api_tokens'));
      const token = Math.random().toString(36).substr(2, 32).toUpperCase();
      await setDoc(tokenRef, {
        name,
        token,
        createdAt: serverTimestamp(),
        isActive: true
      });
      return { success: true, message: `Token '${name}' created.`, token };
    } else {
      await deleteDoc(doc(db, 'api_tokens', tokenId));
      return { success: true, message: `Token deleted.` };
    }
  },
  get_app_stats: async () => {
    const usersSnap = await getDocs(collection(db, "users"));
    const trxSnap = await getDocs(collection(db, "transactions"));
    const promosSnap = await getDocs(collection(db, "promo_codes"));
    
    return {
      totalUsers: usersSnap.size,
      totalTransactions: trxSnap.size,
      activePromos: promosSnap.size,
      timestamp: new Date().toISOString()
    };
  },
  update_user_balance: async ({ username, amount }: { username: string, amount: number }) => {
    const q = query(collection(db, "users"), where("username", "==", username));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return { error: `User '${username}' not found.` };
    
    const userDoc = snapshot.docs[0];
    await updateDoc(userDoc.ref, { balance: increment(amount) });
    return { success: true, message: `Updated balance for ${username} by ${amount}.` };
  },
  
  create_promo_code: async ({ code, amount, maxUses = 0, turnover = 5 }: { code: string, amount: number, maxUses?: number, turnover?: number }) => {
    const promoRef = doc(db, "promo_codes", code.toUpperCase());
    await setDoc(promoRef, {
      amount,
      maxUses,
      usedCount: 0,
      isActive: true,
      turnoverMultiplier: turnover,
      createdAt: serverTimestamp()
    });
    return { success: true, message: `Created promo code ${code.toUpperCase()} with amount ${amount}.` };
  },
  
  get_user_info: async ({ username }: { username: string }) => {
    const q = query(collection(db, "users"), where("username", "==", username));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return { error: `User '${username}' not found.` };
    
    const data = snapshot.docs[0].data();
    return { 
      username: data.username, 
      balance: data.balance, 
      role: data.role, 
      id: snapshot.docs[0].id 
    };
  },

  manage_game: async ({ action, gameId, name, logo, url, provider }: any) => {
    if (action === 'delete') {
      await deleteDoc(doc(db, 'global_config', 'game_names', gameId));
      return { success: true, message: `Game ${gameId} deleted.` };
    }
    
    const batch = [];
    if (name) batch.push(updateDoc(doc(db, 'global_config', 'game_names'), { [gameId]: name }));
    if (logo) batch.push(updateDoc(doc(db, 'global_config', 'game_logos'), { [gameId]: logo }));
    if (url) batch.push(updateDoc(doc(db, 'global_config', 'game_urls'), { [gameId]: url }));
    if (provider) batch.push(updateDoc(doc(db, 'global_config', 'game_options'), { [gameId]: provider }));
    
    await Promise.all(batch);
    return { success: true, message: `Game ${gameId} ${action === 'add' ? 'added' : 'updated'}.` };
  },

  update_app_settings: async (settings: any) => {
    const settingsRef = doc(db, 'global_config', 'app_settings');
    await updateDoc(settingsRef, settings);
    return { success: true, message: "App settings updated successfully." };
  },

  fetch_external_api: async ({ url, method = "GET", body }: any) => {
    try {
      const options: any = { method };
      if (body && method === "POST") {
        options.headers = { "Content-Type": "application/json" };
        options.body = body;
      }
      const response = await fetch(url, options);
      const data = await response.json();
      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  create_system_alert: async ({ title, message, type = "info" }: any) => {
    const alertRef = doc(collection(db, 'system_alerts'));
    await setDoc(alertRef, {
      title,
      message,
      type,
      read: false,
      timestamp: serverTimestamp()
    });
    return { success: true, message: "System alert created." };
  }
};

export const processAdminCommand = async (prompt: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        systemInstruction: `You are the Super AI Admin Assistant for Spin71 Casino. 
        You have FULL CONTROL over the application data, games, settings, and users.
        
        CAPABILITIES:
        1. Manage Users: Update balance, change roles, get info.
        2. Manage Games: Add, update, or delete games (logos, URLs, names).
        3. App Settings: Control casino name, social links, min/max limits, and notice text.
        4. External API: You can call external web services to fetch data or trigger actions.
        5. System Alerts: Create alerts for other admins.
        6. Automatic Fixes: If an admin reports a problem, use your tools to check settings, reset values, or analyze system error logs.
        7. Error Monitoring: You can fetch recent system errors and mark them as resolved after fixing the underlying data issue.
        
        Always be professional and helpful. 
        If a command requires multiple function calls, use them in sequence. 
        If you perform an action, confirm it to the admin in Bengali.
        You can also explain technical details if asked.`,
        tools: [{ 
          functionDeclarations: [
            updateBalanceFn, 
            createPromoFn, 
            getUserInfoFn, 
            manageGameFn, 
            updateAppSettingsFn, 
            fetchExternalApiFn, 
            createSystemAlertFn,
            getAppStatsFn,
            manageApiTokensFn,
            getSystemErrorsFn,
            fixSystemErrorFn
          ] 
        }],
      },
    });

    const functionCalls = response.functionCalls;
    if (functionCalls) {
      const results = [];
      for (const call of functionCalls) {
        const fn = functions[call.name];
        if (fn) {
          const result = await fn(call.args);
          results.push({ name: call.name, result });
        }
      }
      
      // Send results back to model for final response
      const finalResponse = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          { role: 'user', parts: [{ text: prompt }] },
          { role: 'model', parts: [{ text: response.text || "Processing..." }] },
          ...results.map(r => ({
            role: 'user',
            parts: [{ text: `Function ${r.name} returned: ${JSON.stringify(r.result)}` }]
          }))
        ],
        config: {
          systemInstruction: "Now explain what you did to the admin in Bengali."
        }
      });
      
      return finalResponse.text;
    }

    return response.text;
  } catch (error) {
    console.error("AI Error:", error);
    return "দুঃখিত, কমান্ডটি প্রসেস করতে সমস্যা হয়েছে।";
  }
};

export const getAIResponse = async (message: string, userData?: any) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: message,
      config: {
        systemInstruction: `You are the AI Support Bot for Spin71 Casino. 
        User Info: ${JSON.stringify(userData || {})}
        Help users with their queries about games, deposits, and withdrawals.
        Always reply in Bengali. Be friendly and encouraging.
        If they ask about their balance, tell them they can see it at the top of the screen.
        Our official Telegram is @spin71bet_official.`,
      },
    });
    return response.text;
  } catch (error) {
    console.error("AI Support Error:", error);
    return "দুঃখিত, আমি এখন উত্তর দিতে পারছি না। অনুগ্রহ করে কিছুক্ষণ পর চেষ্টা করুন।";
  }
};
