import { GoogleGenAI, FunctionDeclaration, Type } from "@google/genai";
import { db, auth } from "../firebase";
import { doc, updateDoc, increment, collection, query, where, getDocs, setDoc, serverTimestamp } from "firebase/firestore";

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

// Implementation of functions
const functions: Record<string, Function> = {
  update_user_balance: async ({ username, amount }: { username: string, amount: number }) => {
    const q = query(collection(db, "users"), where("username", "==", username));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return { error: `User '${username}' not found.` };
    
    const userDoc = snapshot.docs[0];
    await updateDoc(userDoc.ref, { balance: increment(amount) });
    return { success: true, message: `Updated balance for ${username} by ${amount}. New balance: ${userDoc.data().balance + amount}` };
  },
  
  create_promo_code: async ({ code, amount, maxUses = 0 }: { code: string, amount: number, maxUses?: number }) => {
    const promoRef = doc(db, "promo_codes", code.toUpperCase());
    await setDoc(promoRef, {
      amount,
      maxUses,
      usedCount: 0,
      isActive: true,
      turnoverMultiplier: 5,
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
  }
};

export const processAdminCommand = async (prompt: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        systemInstruction: `You are the AI Admin Assistant for Spin71 Casino. 
        You have the power to manage users, balances, and promo codes.
        Always be professional and helpful. 
        If a command requires a function call, use it. 
        If you perform an action, confirm it to the admin in Bengali.`,
        tools: [{ functionDeclarations: [updateBalanceFn, createPromoFn, getUserInfoFn] }],
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
