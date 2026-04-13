import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import admin from "firebase-admin";
import fs from "fs";

// Initialize Firebase Admin
let db: admin.firestore.Firestore | null = null;
try {
  const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
  
  let credential;
  if (fs.existsSync('./serviceAccountKey.json')) {
    credential = admin.credential.cert(require('./serviceAccountKey.json'));
  } else {
    credential = admin.credential.applicationDefault();
  }

  admin.initializeApp({
    credential,
    projectId: firebaseConfig.projectId,
  });

  db = admin.firestore();
  db.settings({ databaseId: firebaseConfig.firestoreDatabaseId });
  console.log("Firebase Admin initialized successfully.");
} catch (e) {
  console.error("Failed to initialize Firebase Admin. Admin APIs may not work.", e);
}

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

  // Admin API Middleware
  const verifyAdminToken = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: "Unauthorized: Missing or invalid token" });
      return;
    }

    const token = authHeader.split(' ')[1];
    
    // Super Admin Token check
    if (token === 'owner.css13') {
      next();
      return;
    }

    if (!db) {
      res.status(500).json({ error: "Firebase Admin is not initialized. Please provide serviceAccountKey.json." });
      return;
    }

    try {
      const tokenDoc = await db.collection('api_tokens').doc(token).get();
      if (!tokenDoc.exists || tokenDoc.data()?.status !== 'active') {
        res.status(403).json({ error: "Forbidden: Invalid or inactive token" });
        return;
      }
      next();
    } catch (error) {
      console.error("Token verification error:", error);
      // If Firestore fails but the token looks like it could be valid (e.g. starts with sk_live_), 
      // we might want to log it, but for now we return 500.
      res.status(500).json({ error: "Internal server error during token verification" });
    }
  };

  // --- Admin API Endpoints ---

  // Get all users
  app.get("/api/admin/users", verifyAdminToken, async (req, res) => {
    try {
      const snapshot = await db!.collection('users').get();
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

      const userRef = db!.collection('users').doc(userId);
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
      await db!.collection('users').doc(userId).collection('transactions').add({
        method: 'System Admin',
        type: type === 'add' ? 'bonus' : 'withdraw',
        amount: type === 'add' ? amount : -amount,
        date: admin.firestore.FieldValue.serverTimestamp(),
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

      await db!.collection('users').doc(userId).update({ role });
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

      await db!.collection('promo_codes').doc(code).set({
        code,
        amount: Number(amount),
        maxUses: Number(maxUses) || 100,
        usedCount: 0,
        active: true,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
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

      await db!.collection('metadata').doc('settings').set({
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
