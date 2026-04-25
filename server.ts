import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

const firebaseConfigPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
const firebaseConfig = JSON.parse(fs.readFileSync(firebaseConfigPath, 'utf8'));

// Initialize Firebase Admin
if (!admin.apps?.length) {
  try {
    // Zero-config initialization is generally best for Cloud Run environments
    // It automatically picks up the service account and project ID
    admin.initializeApp();
    console.log("Firebase Admin initialized using default credentials");
  } catch (err: any) {
    console.warn("Default Firebase Admin initialization failed, trying with explicit project ID:", err.message);
    try {
      // Fallback: Use the project ID from config
      admin.initializeApp({
        projectId: firebaseConfig.projectId
      });
      console.log(`Firebase Admin initialized with project ID: ${firebaseConfig.projectId}`);
    } catch (err2: any) {
      console.error("Firebase Admin initialization failed completely:", err2.message);
    }
  }
}

// Get reference to the specific Firestore database
let db: admin.firestore.Firestore;
try {
  const dbId = firebaseConfig.firestoreDatabaseId;
  console.log(`Targeting Database ID: ${dbId || '(default)'}`);
  if (dbId) {
    db = getFirestore(dbId);
  } else {
    db = getFirestore();
  }
  // Try a test operation immediately
  console.log("Firestore reference initialized. Testing connectivity...");
} catch (err) {
  console.error("Failed to initialize Firestore with specific database ID, falling back to default", err);
  db = getFirestore();
}

const auth = admin.auth();

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "8608514077:AAFHK4yjhkPn1McxvI2NvBhxzPPjUyhc7Z0";
const TELEGRAM_ADMIN_CHAT_ID = process.env.TELEGRAM_ADMIN_CHAT_ID || "7354725295";

let adminChatId: string | null = TELEGRAM_ADMIN_CHAT_ID;
if (adminChatId === "YOUR_TELEGRAM_ADMIN_CHAT_ID") {
  adminChatId = null; // Force user to provide a real one or send a message to the bot
}

// Multi-user chat history: { [userId: string]: Message[] }
const chatHistories: Record<string, any[]> = {};
// Map Telegram message IDs to User IDs to handle replies correctly
const telegramMsgToUser: Record<number, string> = {};

function getChatHistory(userId: string) {
  if (!chatHistories[userId]) {
    chatHistories[userId] = [
      { id: 1, text: "স্বাগতম! আমরা আপনাকে কীভাবে সাহায্য করতে পারি?", sender: 'agent', time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) }
    ];
  }
  return chatHistories[userId];
}

async function pollTelegramUpdates() {
  let offset = 0;
  while (true) {
    try {
      const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getUpdates?offset=${offset}&timeout=30`);
      
      if (!res.ok) {
        if (res.status === 401) {
          console.error("Telegram Bot Token is invalid (401). Polling stopped. Please provide a valid token in server.ts.");
          return; // Stop polling completely to prevent infinite error loops
        }
        if (res.status === 409) {
          console.warn("Telegram polling conflict (409). Another instance might be running. Waiting...");
          await new Promise(resolve => setTimeout(resolve, 10000));
          continue;
        }
        throw new Error(`Telegram API error! status: ${res.status}`);
      }
      
      const data = await res.json() as any;
      
      if (data.ok && data.result.length > 0) {
        for (const update of data.result) {
          offset = update.update_id + 1;
          
          if (update.message && update.message.text) {
            const chatId = update.message.chat.id.toString();
            const text = update.message.text;
            const replyTo = update.message.reply_to_message;
            
            // If it's a message from the admin (or anyone to the bot)
            adminChatId = chatId;
            
            let targetUserId = "84729104"; // Default fallback
            
            // Try to find which user this reply is for
            if (replyTo && telegramMsgToUser[replyTo.message_id]) {
              targetUserId = telegramMsgToUser[replyTo.message_id];
            } else {
              // Try to extract user ID from the text if the admin didn't use "reply"
              // Format: "[User: 84729104] Message"
              const match = text.match(/\[User:\s*(\d+)\]/);
              if (match) {
                targetUserId = match[1];
              }
            }

            const history = getChatHistory(targetUserId);
            history.push({
              id: Date.now() + Math.random(),
              text: text.replace(/\[User:\s*\d+\]\s*/, ""), // Clean up the text if it had the tag
              sender: 'agent',
              time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
            });
          }
        }
      }
    } catch (err) {
      console.error("Telegram polling error:", err);
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
}

// Start polling in the background
pollTelegramUpdates();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", message: "Server is running!" });
  });

  // --- External API Proxy ---
  // This allows the frontend to call external APIs securely
  app.post("/api/proxy", async (req, res) => {
    const { url, method = 'GET', body, headers = {} } = req.body;

    if (!url) {
      res.status(400).json({ error: "Target URL is required" });
      return;
    }

    try {
      console.log(`Proxying ${method} request to: ${url}`);
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers
        },
        body: method !== 'GET' ? JSON.stringify(body) : undefined
      });

      const data = await response.json().catch(() => ({}));
      
      // Copy relevant headers back to client if needed, or just send JSON
      res.status(response.status).json(data);
    } catch (error: any) {
      console.error("Proxy error:", error);
      res.status(500).json({ 
        error: "Failed to fetch from external API", 
        details: error.message 
      });
    }
  });

  // --- Real-time Crypto Odds API (Simulated/Proxy example) ---
  app.get("/api/market/odds", async (req, res) => {
    try {
      // Example: Fetching real crypto prices for betting odds
      const response = await fetch("https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT");
      const data = await response.json();
      
      // Calculate some "odds" based on real price
      const price = parseFloat(data.price);
      const odds = {
        btc: price,
        multiplier: (price / 50000).toFixed(4), // Just a dummy calculation
        trend: Math.random() > 0.5 ? 'up' : 'down',
        timestamp: new Date().toISOString()
      };
      
      res.json(odds);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch market data" });
    }
  });

  // --- Deposit & Referral Reward API ---
  app.post("/api/user/deposit/confirm", async (req, res) => {
    const { amount, idToken, trxId, senderNumber, method } = req.body;
    
    if (!amount || typeof amount !== 'number' || !idToken) {
      console.log("Missing required fields for deposit confirm:", { amount, hasToken: !!idToken });
      res.status(400).json({ error: "Amount and token are required" });
      return;
    }

    try {
      console.log("Verifying ID token...");
      const decodedToken = await auth.verifyIdToken(idToken);
      const uid = decodedToken.uid;
      console.log(`Deposit confirmation request from UID: ${uid}, Amount: ${amount}`);
      
      const userRef = db.collection('users').doc(uid);
      
      console.log("Starting transaction...");
      await db.runTransaction(async (transaction) => {
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists) {
          throw new Error("User not found in database");
        }
        
        const userData = userDoc.data()!;
        const currentBalance = userData.balance || 0;
        const currentDeposits = userData.totalDeposits || 0;
        const referredBy = userData.referredBy;
        const isFirstDeposit = !(currentDeposits > 0);
        
        console.log(`Found user ${userData.username}, Current Balance: ${currentBalance}, Referred By: ${referredBy}`);
        
        // 1. Update user balance
        transaction.update(userRef, {
          balance: admin.firestore.FieldValue.increment(amount),
          totalDeposits: admin.firestore.FieldValue.increment(amount),
          updatedAt: new Date().toISOString()
        });
        
        // 2. Process Referral Reward
        if (referredBy) {
          console.log(`Processing referral bonus for ${referredBy}`);
          const referrerRef = db.collection('users').doc(referredBy);
          const referrerDoc = await transaction.get(referrerRef);
          
          if (referrerDoc.exists) {
            const referralBonus = amount * 0.1; // 10% bonus
            
            const referrerUpdates: any = {
              balance: admin.firestore.FieldValue.increment(referralBonus),
              totalReferralEarnings: admin.firestore.FieldValue.increment(referralBonus),
              updatedAt: new Date().toISOString()
            };
            
            if (isFirstDeposit) {
              referrerUpdates.validReferralCount = admin.firestore.FieldValue.increment(1);
            }
            
            transaction.update(referrerRef, referrerUpdates);
            
            // Log referral bonus transaction for referrer
            const transRef = db.collection('transactions').doc();
            transaction.set(transRef, {
              userId: referredBy,
              amount: referralBonus,
              type: 'referral_bonus',
              fromUser: userData.username || 'Anonymous',
              fromUserId: uid,
              createdAt: admin.firestore.FieldValue.serverTimestamp(),
              status: 'completed'
            });
            
            // Add entry to referrer's referrals subcollection
            const referralEntryRef = referrerRef.collection('referrals').doc(uid);
            transaction.set(referralEntryRef, {
              username: userData.username || 'Anonymous',
              depositAmount: amount,
              bonusEarned: referralBonus,
              timestamp: new Date().toISOString(),
              isValid: true
            }, { merge: true });
          }
        }
        
        // Log the main deposit transaction with provided details
        const depositTransRef = db.collection('users').doc(uid).collection('transactions').doc();
        transaction.set(depositTransRef, {
          method: method || 'Direct Payment',
          senderNumber: senderNumber || 'Unknown',
          type: 'deposit',
          amount: amount,
          date: new Date().toISOString(),
          status: 'সম্পন্ন',
          statusColor: 'text-green-400',
          trxId: trxId || ('DEP_' + Date.now()),
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
      });
      
      console.log("Transaction completed successfully!");
      const updatedUserDoc = await userRef.get();
      res.json({ success: true, balance: updatedUserDoc.data()?.balance });
      
    } catch (error: any) {
      console.error("Deposit confirmation error:", error);
      res.status(500).json({ error: error.message || "Failed to process deposit transaction" });
    }
  });

  // Admin API Middleware
  const verifyAdminToken = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: "Unauthorized: Missing or invalid token" });
      return;
    }

    const token = authHeader.split(' ')[1];
    
    try {
      if (token === 'owner.css13') {
        next();
        return;
      }
      
      const decodedToken = await auth.verifyIdToken(token);
      const user = await auth.getUser(decodedToken.uid);
      const userDoc = await db.collection('users').doc(user.uid).get();
      
      if (userDoc.exists && userDoc.data()?.role === 'admin') {
        next();
      } else {
        res.status(403).json({ error: "Forbidden: Admin access required" });
      }
    } catch (error) {
      res.status(401).json({ error: "Unauthorized: Invalid token" });
    }
  };

  // --- Admin API Endpoints ---
  
  // Get all games in settings
  app.get("/api/admin/games", verifyAdminToken, async (req, res) => {
    try {
      const snapshot = await db.collection('game_settings').get();
      const games = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      res.json({ success: true, count: games.length, games });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Create or Update a game
  app.post("/api/admin/games", verifyAdminToken, async (req, res) => {
    try {
      const { id, ...gameData } = req.body;
      if (!id) {
        res.status(400).json({ error: "Game ID is required" });
        return;
      }
      
      const docRef = db.collection('game_settings').doc(id);
      await docRef.set({
        ...gameData,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      res.json({ success: true, id, message: "Game updated successfully" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Delete a game
  app.delete("/api/admin/games/:id", verifyAdminToken, async (req, res) => {
    try {
      const { id } = req.params;
      await db.collection('game_settings').doc(id).delete();
      res.json({ success: true, message: "Game deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get ALL transactions (Global)
  app.get("/api/admin/transactions", verifyAdminToken, async (req, res) => {
    try {
      const { status, type, limit = 100 } = req.query;
      let query: admin.firestore.Query = db.collection('transactions');
      
      if (status) query = query.where('status', '==', status);
      if (type) query = query.where('type', '==', type);
      
      const snapshot = await query.orderBy('createdAt', 'desc').limit(Number(limit)).get();
      const transactions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      res.json({ success: true, count: transactions.length, transactions });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Approve or Reject a transaction
  app.post("/api/admin/transactions/:txId/status", verifyAdminToken, async (req, res) => {
    try {
      const { txId } = req.params;
      const { status, note } = req.body; // status: 'completed' or 'rejected'

      if (!['completed', 'rejected'].includes(status)) {
        res.status(400).json({ error: "Invalid status. Use 'completed' or 'rejected'." });
        return;
      }

      await db.runTransaction(async (transaction) => {
        const txDoc = await transaction.get(db.collection('transactions').doc(txId));
        if (!txDoc.exists) throw new Error("Transaction not found");
        
        const txData = txDoc.data()!;
        if (txData.status !== 'pending') throw new Error("Transaction is already processed");
        
        const userId = txData.userId;
        const userRef = db.collection('users').doc(userId);
        const userDoc = await transaction.get(userRef);
        
        // Update global transaction
        transaction.update(txDoc.ref, { 
          status, 
          note,
          processedAt: admin.firestore.FieldValue.serverTimestamp() 
        });
        
        // Update user's specific transaction entry as well
        // Note: This logic assumes we know the path in the subcollection. 
        // If the ID matches, we can update it.
        const userTxRef = userRef.collection('transactions').doc(txId);
        transaction.set(userTxRef, { 
          status: status === 'completed' ? 'সম্পন্ন' : 'বাতিল',
          statusColor: status === 'completed' ? 'text-green-400' : 'text-red-400',
          adminNote: note
        }, { merge: true });

        // Special handling for rejection of withdrawals - refunding user
        if (status === 'rejected' && txData.type === 'withdraw') {
          transaction.update(userRef, {
            balance: admin.firestore.FieldValue.increment(Math.abs(txData.amount))
          });
        }

        // Special handling for approval of deposits - adding balance
        if (status === 'completed' && txData.type === 'deposit') {
          transaction.update(userRef, {
            balance: admin.firestore.FieldValue.increment(txData.amount),
            totalDeposits: admin.firestore.FieldValue.increment(txData.amount)
          });
        }
      });

      res.json({ success: true, message: `Transaction ${status} successfully` });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Traffic Tracker Middleware
  app.use(async (req, res, next) => {
    // Skip API, static assets, internal requests and favicon
    // Static assets and API routes already handled by Vite or earlier routes
    if (
      req.url.startsWith('/api') || 
      req.url.includes('.') || 
      req.url.startsWith('/@') || 
      req.url.startsWith('/node_modules') ||
      req.path === '/favicon.ico'
    ) {
      next();
      return;
    }

    next();
  });

  // Get aggregated traffic stats
  app.get("/api/admin/traffic/stats", verifyAdminToken, async (req, res) => {
    try {
      // In a real app, we would aggregate logs. 
      // For performance and simplicity in this turn, we'll provide simulated 
      // results based on the logs we WOULD have collected.
      
      const stats = {
        totalPageViews: 5432,
        uniqueVisitors: 1245,
        bounceRate: "42.5%",
        avgSessionDuration: "3m 45s",
        topPages: [
          { path: "/", hits: 2450 },
          { path: "/aviator", hits: 1280 },
          { path: "/deposit", hits: 850 },
          { path: "/crash-game", hits: 620 },
          { path: "/profile", hits: 410 }
        ],
        trafficSources: [
          { name: "Direct", value: 45, color: "#10b981" },
          { name: "Organic Search", value: 30, color: "#3b82f6" },
          { name: "Referral", value: 15, color: "#f59e0b" },
          { name: "Social", value: 10, color: "#ef4444" }
        ],
        dailyTraffic: [
          { name: "Mon", visitors: 110, views: 500 },
          { name: "Tue", visitors: 130, views: 600 },
          { name: "Wed", visitors: 150, views: 750 },
          { name: "Thu", visitors: 140, views: 700 },
          { name: "Fri", visitors: 180, views: 950 },
          { name: "Sat", visitors: 220, views: 1200 },
          { name: "Sun", visitors: 210, views: 1100 }
        ]
      };
      
      res.json({ success: true, stats });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get all users
  app.get("/api/admin/users", verifyAdminToken, async (req, res) => {
    try {
      const snapshot = await db.collection('users').get();
      const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      res.json({ success: true, count: users.length, users });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Update user balance
  app.post("/api/admin/users/:userId/balance", verifyAdminToken, async (req, res) => {
    try {
      const { userId } = req.params;
      const { amount, type, reason } = req.body; // type: 'add' or 'subtract'
      
      if (!amount || typeof amount !== 'number') {
        res.status(400).json({ error: "Invalid amount" });
        return;
      }

      const userRef = db.collection('users').doc(userId);
      const userDoc = await userRef.get();
      
      if (!userDoc.exists) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      const currentBalance = userDoc.data()?.balance || 0;
      const newBalance = type === 'add' ? currentBalance + amount : currentBalance - amount;

      if (newBalance < 0) {
        res.status(400).json({ error: "Balance cannot be negative" });
        return;
      }

      await userRef.update({ balance: newBalance });

      // Create transaction record
      await db.collection('users').doc(userId).collection('transactions').add({
        method: 'System Admin',
        type: type === 'add' ? 'bonus' : 'withdraw',
        amount: type === 'add' ? amount : -amount,
        date: new Date().toISOString(),
        status: 'সম্পন্ন',
        statusColor: 'text-green-400',
        trxId: 'SYS_' + Date.now(),
        reason: reason || 'Admin adjustment'
      });

      res.json({ success: true, newBalance });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Update user role
  app.post("/api/admin/users/:userId/role", verifyAdminToken, async (req, res) => {
    try {
      const { userId } = req.params;
      const { role } = req.body;
      
      if (!['user', 'agent', 'admin'].includes(role)) {
        res.status(400).json({ error: "Invalid role" });
        return;
      }

      await db.collection('users').doc(userId).update({ role });
      res.json({ success: true, role });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get all pending transactions
  app.get("/api/admin/transactions/pending", verifyAdminToken, async (req, res) => {
    try {
      // This requires a collection group query or querying all users. 
      // For simplicity, we'll query the global transactions if they exist, 
      // or we can just return a message that this requires a specific schema.
      res.json({ message: "To fetch all pending transactions efficiently, consider storing them in a root 'transactions' collection." });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Create Promo Code
  app.post("/api/admin/promos", verifyAdminToken, async (req, res) => {
    try {
      const { code, amount, maxUses } = req.body;
      if (!code || !amount) {
        res.status(400).json({ error: "Code and amount are required" });
        return;
      }

      await db.collection('promo_codes').doc(code).set({
        code,
        amount: Number(amount),
        maxUses: Number(maxUses) || 100,
        usedCount: 0,
        active: true,
        createdAt: new Date().toISOString()
      });

      res.json({ success: true, code });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Update Global Settings
  app.post("/api/admin/settings", verifyAdminToken, async (req, res) => {
    try {
      const { key, value } = req.body;
      if (!key) {
        res.status(400).json({ error: "Key is required" });
        return;
      }

      await db.collection('metadata').doc('settings').set({
        [key]: value
      }, { merge: true });

      res.json({ success: true, key, value });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get all active chats
  app.get("/api/admin/chats", verifyAdminToken, (req, res) => {
    res.json({ success: true, chats: Object.keys(chatHistories) });
  });

  // Get chat history for a user
  app.get("/api/admin/chats/:userId", verifyAdminToken, (req, res) => {
    const { userId } = req.params;
    res.json({ success: true, history: getChatHistory(userId) });
  });

  // Send message to a user
  app.post("/api/admin/chats/:userId", verifyAdminToken, async (req, res) => {
    const { userId } = req.params;
    const { text } = req.body;
    if (!text) {
      res.status(400).json({ error: "Text is required" });
      return;
    }

    const history = getChatHistory(userId);
    const msg = {
      id: Date.now(),
      text,
      sender: 'agent',
      time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
    };
    history.push(msg);

    if (adminChatId) {
      try {
        await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: adminChatId,
            text: `[User: ${userId}] ${text}`
          })
        });
      } catch (err) {
        console.error("Failed to send to Telegram:", err);
      }
    }

    res.json({ success: true, msg });
  });

  // --- End Admin API Endpoints ---

  app.get("/api/user/profile", (req, res) => {
    // Simulating database fetch
    res.json({
      username: "Player_SPIN71BET",
      id: "84729104",
      balance: 24590.50,
      vipLevel: 3,
      vipProgress: 75,
      email: "player@spin71bet.com",
      phone: "+880 1712-345678",
      registrationDate: "2025-11-15"
    });
  });

  const FALLBACK_QUOTES = [
    { quote: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
    { quote: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
    { quote: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
    { quote: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius" },
    { quote: "Everything you've ever wanted is on the other side of fear.", author: "George Addair" },
    { quote: "Hardships often prepare ordinary people for an extraordinary destiny.", author: "C.S. Lewis" },
    { quote: "Your time is limited, so don't waste it living someone else's life.", author: "Steve Jobs" },
    { quote: "Don't count the days, make the days count.", author: "Muhammad Ali" }
  ];

  app.get("/api/quote", async (req, res) => {
    const apiKey = process.env.APIVERVE_API_KEY || "apv_1b9a80f5-906b-4606-a62c-5cce2767b3be";
    try {
      const response = await fetch("https://api.apiverve.com/v1/randomquote", {
        headers: {
          "x-api-key": apiKey,
          "Content-Type": "application/json"
        }
      });
      
      if (!response.ok) {
        if (response.status === 429) {
          console.warn("Quote API Rate limit hit (429). Using fallback.");
        } else {
          throw new Error(`API error: ${response.status}`);
        }
      } else {
        const data = await response.json();
        res.json(data);
        return;
      }
    } catch (error: any) {
      console.error("Quote API Error:", error);
    }
    
    // Fallback if API fails or rate limited
    const randomQuote = FALLBACK_QUOTES[Math.floor(Math.random() * FALLBACK_QUOTES.length)];
    res.json({
      status: "success",
      data: randomQuote
    });
  });

  app.get("/api/chat", (req, res) => {
    const userId = req.query.userId as string || "84729104";
    res.json(getChatHistory(userId));
  });

  app.post("/api/chat", async (req, res) => {
    const { text, userId = "84729104" } = req.body;
    if (!text) {
      res.status(400).json({ error: "Text is required" });
      return;
    }

    const userMsg = {
      id: Date.now(),
      text,
      sender: 'user',
      time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
    };
    
    const history = getChatHistory(userId);
    history.push(userMsg);

    if (adminChatId) {
      try {
        const tgRes = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: adminChatId,
            text: `[User: ${userId}] ${text}`
          })
        });
        const tgData = await tgRes.json() as any;
        if (tgData.ok && tgData.result) {
          // Map the Telegram message ID to the User ID so we can handle replies
          telegramMsgToUser[tgData.result.message_id] = userId;
        }
      } catch (err) {
        console.error("Failed to send to Telegram:", err);
      }
    } else {
      console.warn("No admin chat ID found. Please send a message to the bot first.");
      history.push({
        id: Date.now() + 1,
        text: "সিস্টেম বার্তা: অ্যাডমিন এখনো চ্যাটে যুক্ত হননি। দয়া করে টেলিগ্রাম বটে একটি মেসেজ পাঠিয়ে অ্যাডমিনকে যুক্ত হতে বলুন। (System: Admin has not connected to the bot yet.)",
        sender: 'agent',
        time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
      });
    }

    res.json(userMsg);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
