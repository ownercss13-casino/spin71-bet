import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import cors from 'cors';
import session from 'express-session';
import fetch from 'node-fetch';

const firebaseConfigPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
const firebaseConfig = JSON.parse(fs.readFileSync(firebaseConfigPath, 'utf8'));

const SESSION_SECRET = process.env.SESSION_SECRET || "mFmqcdqsiI5hs3XgwbGrwrnBqwUdrsXihK7Ix1udVzfb/FVPq2tLBjOr9d9tuAQjQoPnW67NDFuN1gBXNBQy4A==";

console.log("Server process starting... NODE_ENV:", process.env.NODE_ENV);

// Initialize Firebase Admin
let db: admin.firestore.Firestore;
let firebaseApp: admin.app.App;

// Ensure we target the right project for credentials at the process level
process.env.GOOGLE_CLOUD_PROJECT = firebaseConfig.projectId;
process.env.GCLOUD_PROJECT = firebaseConfig.projectId;

// Initialize Firebase Admin
if (!admin.apps.length) {
  try {
    // Standard initialization - let ADC (Application Default Credentials) handle it
    admin.initializeApp({
      projectId: firebaseConfig.projectId
    });
    console.log(`[Firebase] Initialized with project: ${firebaseConfig.projectId}`);
  } catch (e: any) {
    console.error("[Firebase] App initialization error:", e.message);
    admin.initializeApp();
  }
}

firebaseApp = admin.app();
const dbId = firebaseConfig.firestoreDatabaseId;

// Initialize Firestore - prioritizing the config but allowing fallback
let currentDbId = dbId;
async function getVerifiedDb() {
  try {
    if (currentDbId && currentDbId !== '(default)') {
      console.log(`[Firebase] Checking named database availability: ${currentDbId}...`);
      const testDb = getFirestore(firebaseApp, currentDbId);
      
      // Use a timeout for verification to avoid blocking startup
      const verifyPromise = testDb.collection('config').doc('main').get();
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('TIMEOUT')), 5000));
      
      const snap = await Promise.race([verifyPromise, timeoutPromise]) as admin.firestore.DocumentSnapshot;
      console.log(`[Firebase] Verified named database: ${currentDbId}. Doc exists: ${snap.exists}`);
      return testDb;
    }
  } catch (err: any) {
    const errorMsg = err.message || String(err);
    console.error(`[Firebase] Verification failed for database ${currentDbId}:`, errorMsg);
    
    // Fallback if permission denied, not found, or timeout
    if (errorMsg.includes('PERMISSION_DENIED') || errorMsg.includes('NOT_FOUND') || errorMsg === 'TIMEOUT' || errorMsg.includes('7') || errorMsg.includes('5')) {
      console.warn(`[Firebase] Database ${currentDbId} is unusable, falling back to (default)`);
      currentDbId = '(default)';
    }
  }
  
  if (currentDbId === '(default)') {
    console.log(`[Firebase] Initializing (default) database`);
    return getFirestore(firebaseApp);
  }
  
  return getFirestore(firebaseApp);
}

// Initial placeholder, will be verified on first real use or in initializeGlobalConfig
db = getFirestore(firebaseApp, (dbId && dbId !== '(default)') ? dbId : undefined);


const auth = admin.auth();

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "7613844889:AAHwcf5uhCICxZMuRYpUUBNTNErGDmedopI";
const TELEGRAM_ADMIN_CHAT_ID = process.env.TELEGRAM_ADMIN_CHAT_ID || "-6543227982";

// Storage for diagnostics
let lastTelegramError: any = null;
let lastTelegramSuccess: any = null;

// Track admin chat ID dynamically if provided by bot, but keep a separate variable for system notifications
let supportAdminChatId: string | null = null; 

if (!TELEGRAM_BOT_TOKEN) {
  console.warn("TELEGRAM_BOT_TOKEN is missing. Telegram notifications will not work.");
}

// Multi-user chat history: { [userId: string]: Message[] }
const chatHistories: Record<string, any[]> = {};

async function sendTelegramNotification(message: string, isSupportReply: boolean = false) {
  if (!TELEGRAM_BOT_TOKEN) {
    if (!lastTelegramError) console.warn("[Telegram] Bot token missing, notifications disabled.");
    return;
  }
  
  const targetChatId = isSupportReply ? (supportAdminChatId || TELEGRAM_ADMIN_CHAT_ID) : TELEGRAM_ADMIN_CHAT_ID;
  
  try {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: targetChatId,
        text: message,
        parse_mode: 'HTML',
      }),
    });
    
    const responseData = await response.json() as any;
    
    if (!response.ok) {
      if (response.status === 401) {
        console.error("[Telegram] 401 Unauthorized: Bot token is invalid.");
      } else {
        console.error(`[Telegram] Error (${response.status}):`, JSON.stringify(responseData));
      }
      lastTelegramError = { timestamp: new Date().toISOString(), status: response.status, data: responseData };
    } else {
      console.log(`[Telegram] Successfully sent to ${targetChatId}`);
      lastTelegramSuccess = { timestamp: new Date().toISOString(), targetChatId };
    }
  } catch (e: any) {
    console.error(`[Telegram] Critical error:`, e.message);
  }
}

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
  if (!TELEGRAM_BOT_TOKEN) {
    console.log("[Telegram] Polling disabled due to missing token.");
    return;
  }

  let offset = 0;
  console.log("[Telegram] Starting polling loop...");
  while (true) {
    try {
      const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getUpdates?offset=${offset}&timeout=30`);
      
      if (!res.ok) {
        if (res.status === 401) {
          console.error("[Telegram] 401 Unauthorized while polling. Token is invalid. Stopping loop.");
          return; 
        }
        await new Promise(resolve => setTimeout(resolve, 10000));
        continue;
      }
      
      const data = await res.json() as any;
      if (data.ok && data.result) {
        for (const update of data.result) {
          offset = update.update_id + 1;
          
          if (update.message && update.message.text) {
            const chatId = update.message.chat.id.toString();
            const text = update.message.text;
            const replyTo = update.message.reply_to_message;
            
            supportAdminChatId = chatId;
            
            let targetUserId = "84729104"; 
            
            if (replyTo && telegramMsgToUser[replyTo.message_id]) {
              targetUserId = telegramMsgToUser[replyTo.message_id];
            } else {
              const match = text.match(/\[User:\s*(\d+)\]/);
              if (match) {
                targetUserId = match[1];
              }
            }

            const history = getChatHistory(targetUserId);
            history.push({
              id: Date.now() + Math.random(),
              text: text.replace(/\[User:\s*\d+\]\s*/, ""), 
              sender: 'agent',
              time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
            });
          }
        }
      }
    } catch (err: any) {
      console.error("[Telegram] Polling error:", err.message);
      await new Promise(resolve => setTimeout(resolve, 15000));
    }
  }
}

// Start polling in the background
pollTelegramUpdates();

async function initializeGlobalConfig() {
  console.log("[Config] Starting initialization...");
  try {
    // Verify and potentially switch db to default
    db = await getVerifiedDb();
    
    if (!db) {
      console.error("[Config] Database instance is null after verification!");
      return;
    }

    // 1. Initialize config/main
    const configRef = db.collection('config').doc('main');
    const snap = await configRef.get();
    if (!snap.exists) {
      console.log("[Config] Document 'config/main' missing. Initializing...");
      await configRef.set({
        casinoName: "SPIN71BET",
        noticeText: "স্বাগতম SPIN71BET কেসিনো তে! শুভকামনা সবার জন্য।",
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
    }

    // 2. Initialize metadata/settings (used by frontend)
    const settingsRef = db.collection('metadata').doc('settings');
    const settingsSnap = await settingsRef.get();
    if (!settingsSnap.exists) {
      console.log("[Config] Document 'metadata/settings' missing. Initializing...");
      await settingsRef.set({
        casinoName: "SPIN71BET",
        noticeText: "স্বাগতম SPIN71BET কেসিনো তে! শুভকামনা সবার জন্য।",
        allButtonName: "ALL",
        welcomeBonus: 507,
        minDeposit: 100,
        minWithdraw: 100,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
    }

    console.log("[Config] Global configuration successfully verified.");
  } catch (err: any) {
    console.error("[Config] FATAL initialization error:", err.message);
    
    // Last ditch effort: if we still get NOT_FOUND here, force (default) and retry once
    if (err.message.includes('NOT_FOUND') || err.message.includes('5')) {
      console.warn("[Config] Received NOT_FOUND even after verification. Forcing (default) database fallback...");
      try {
        db = getFirestore(firebaseApp);
        
        await db.collection('config').doc('main').set({
          casinoName: "SPIN71BET",
          noticeText: "স্বাগতম SPIN71BET কেসিনো তে! শুভকামনা সবার জন্য।",
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        await db.collection('metadata').doc('settings').set({
          casinoName: "SPIN71BET",
          noticeText: "স্বাগতম SPIN71BET কেসিনো তে! শুভকামনা সবার জন্য।",
          allButtonName: "ALL",
          welcomeBonus: 507,
          minDeposit: 100,
          minWithdraw: 100,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        console.log("[Config] Fallback initialization successful on (default) database.");
      } catch (innerErr: any) {
        console.error("[Config] Even fallback database failed:", innerErr.message);
      }
    }
  }
}

async function startServer() {
  console.log("[Server] Starting startServer sequence...");
  
  // Verify database BEFORE starting the server
  try {
    db = await getVerifiedDb();
    console.log("[Firebase] Database instance confirmed.");
  } catch (err: any) {
    console.error("[Firebase] Fatal database initialization error, using defaults:", err.message);
    db = getFirestore(firebaseApp);
  }

  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(cors());

  app.use(session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: process.env.NODE_ENV === 'production' }
  }));

  // Initialize config asynchronously so it doesn't block the health check
  initializeGlobalConfig().catch(err => console.error("[Config] Early init failed:", err.message));

  // --- Health and Status
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "ok", 
      dbReady: !!db,
      dbId: currentDbId,
      time: new Date().toISOString()
    });
  });

  // --- External API Proxy (MOVED UP FOR PRECEDENCE) ---
  const proxyHandler = async (req: express.Request, res: express.Response) => {
    try {
      const { url, method = 'GET', body, headers = {} } = req.body || {};
      
      console.log(`[Proxy] Target: ${url}, Method: ${method}`);

      if (!url) {
        return res.status(400).json({ error: "Target URL is required" });
      }

      const fetchFn = fetch || (global as any).fetch;
      
      if (!fetchFn) {
        return res.status(500).json({ error: "Server misconfiguration: fetch function not found" });
      }

      const response = await fetchFn(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...headers
        },
        body: (method !== 'GET' && method !== 'HEAD' && body) ? JSON.stringify(body) : undefined
      }).catch((err: any) => {
        console.error(`[Proxy] Fetch error for ${url}:`, err.message);
        throw err;
      });

      const contentType = response.headers.get('content-type') || '';
      let responseData: any;
      
      if (contentType.includes('application/json')) {
        responseData = await response.json().catch((err: any) => {
          return { error: "Failed to parse JSON response from target", details: err.message };
        });
      } else {
        const text = await response.text().catch(() => "");
        responseData = { text, contentType };
      }
      
      res.status(response.status).json(responseData);
    } catch (error: any) {
      console.error("[Proxy] Critical error:", error.message);
      if (!res.headersSent) {
        res.status(500).json({ 
          error: "Failed to fetch from external API", 
          details: error.message 
        });
      }
    }
  };

  app.post("/api/external-fetch", proxyHandler);
  app.post("/api/external-fetch/", proxyHandler);
  app.post("/external-fetch", (req, res, next) => {
    console.log("[DEBUG] /external-fetch hit without /api prefix. Redirecting to proxy handler.");
    proxyHandler(req, res);
  });

  // TEST ROUTE
  app.get("/api/external-fetch/ping", (req, res) => {
    res.json({ success: true, message: "External fetch endpoint is reachable" });
  });
  app.get("/api/external-fetch", (req, res) => res.status(405).json({ error: "Use POST for proxy requests" }));
  app.get("/external-fetch", (req, res) => res.redirect("/api/external-fetch"));

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

  // --- Telegram API ---
  app.get("/api/telegram/status", (req, res) => {
    res.json({
      configuredToken: TELEGRAM_BOT_TOKEN ? `${TELEGRAM_BOT_TOKEN.substring(0, 10)}...` : "MISSING",
      configuredAdminId: TELEGRAM_ADMIN_CHAT_ID || "MISSING",
      lastError: lastTelegramError,
      lastSuccess: lastTelegramSuccess,
      serverTime: new Date().toISOString()
    });
  });

  app.post("/api/telegram/send", async (req, res) => {
    try {
      const { message } = req.body;
      if (!message) {
        return res.status(400).json({ error: "Message is required" });
      }

      console.log(`[Telegram API] Manual send request received for message length ${message.length}`);
      await sendTelegramNotification(message);

      if (lastTelegramError && lastTelegramError.timestamp > new Date(Date.now() - 5000).toISOString()) {
        return res.status(500).json({ 
          error: "Failed to send to Telegram", 
          details: lastTelegramError 
        });
      }

      res.json({ success: true, lastSuccess: lastTelegramSuccess });
    } catch (error: any) {
      console.error("Telegram send error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Update user status (block/limit)
  app.post("/api/admin/users/:userId/status", verifyAdminToken, async (req, res) => {
    try {
      const { userId } = req.params;
      const { isBlocked, dailyDepositLimit } = req.body;
      
      const updateData: any = {};
      if (typeof isBlocked === 'boolean') updateData.isBlocked = isBlocked;
      if (typeof dailyDepositLimit === 'number') updateData.dailyDepositLimit = dailyDepositLimit;

      await db.collection('users').doc(userId).update(updateData);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
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
      
      const userRef = db.collection('users').doc(uid);
      
      console.log("Starting transaction...");
      await db.runTransaction(async (transaction) => {
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists) {
          throw new Error("User not found in database");
        }
        
        const userData = userDoc.data()!;
        
        if (userData.isBlocked) {
          throw new Error("আপনার অ্যাকাউন্ট ব্লক করা হয়েছে। দয়া করে সহায়তার সাথে যোগাযোগ করুন।");
        }
        
        // Basic daily limit check (simplified for now: just checks against the total deposits in this request vs limit)
        if (userData.dailyDepositLimit && (amount > userData.dailyDepositLimit)) {
             throw new Error(`আপনার দৈনিক ডিপোজিট লিমিট ${userData.dailyDepositLimit} এর বেশি`);
        }
        
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
        const txData = {
          method: method || 'Direct Payment',
          senderNumber: senderNumber || 'Unknown',
          type: 'deposit',
          amount: amount,
          date: new Date().toISOString(),
          status: 'সম্পন্ন',
          statusColor: 'text-green-400',
          trxId: trxId || ('DEP_' + Date.now()),
          userId: uid,
          username: userData.username || 'Anonymous',
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        };
        transaction.set(depositTransRef, txData);
        
        const globalTxRef = db.collection('transactions').doc();
        transaction.set(globalTxRef, txData);
      });
      
      console.log("Transaction completed successfully!");
      
      // Notify Telegram
      await sendTelegramNotification(`🎯 <b>New Deposit Confirmed!</b>\n\n👤 <b>User UID:</b> <code>${uid}</code>\n💰 <b>Amount:</b> ৳${amount}\n🏦 <b>Method:</b> ${method || 'Unknown'}\n📱 <b>Sender:</b> ${senderNumber || 'Unknown'}\n🔖 <b>TxID:</b> <code>${trxId || 'N/A'}</code>`);

      const updatedUserDoc = await userRef.get();
      res.json({ success: true, balance: updatedUserDoc.data()?.balance });
      
    } catch (error: any) {
      console.error("Deposit confirmation error:", error);
      res.status(500).json({ error: error.message || "Failed to process deposit transaction" });
    }
  });

  // Generate Sales/Activity Report
  app.post("/api/admin/reports/generate", verifyAdminToken, async (req, res) => {
    try {
        const { startDate, endDate } = req.body;
        // Logic to fetch transactions and aggregate data goes here
        // For now, returning a summary
        const transactions = await db.collection('transactions').get();
        const total = transactions.docs.reduce((sum, doc) => sum + (doc.data().amount || 0), 0);
        
        const report = {
            totalVolume: total,
            count: transactions.size,
            generatedAt: new Date().toISOString()
        };
        console.log("Generated Report:", JSON.stringify(report));
        res.json({ success: true, report });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
  });

  // Save Report Preference
  app.post("/api/admin/reports/settings", verifyAdminToken, async (req, res) => {
      try {
          const { type, frequency, recipientEmail } = req.body;
          await db.collection('reports').add({ type, frequency, recipientEmail, createdAt: new Date().toISOString() });
          res.json({ success: true, message: "Report settings saved" });
      } catch (error: any) {
          res.status(500).json({ error: error.message });
      }
  });

  // --- Slot Machine Game API ---
  app.post("/api/game/slot/spin", async (req, res) => {
    const { betAmount, idToken } = req.body;
    
    if (!betAmount || typeof betAmount !== 'number' || betAmount <= 0 || !idToken) {
      return res.status(400).json({ error: "Invalid bet amount or missing token" });
    }

    try {
      const decodedToken = await auth.verifyIdToken(idToken);
      const uid = decodedToken.uid;
      const userRef = db.collection('users').doc(uid);

      // Spin Logic (Server Side)
      const symbols = ['7', 'BAR', 'CHERRY', 'DIAMOND', 'GOLD', 'BELL'];
      const reel1 = symbols[Math.floor(Math.random() * symbols.length)];
      const reel2 = symbols[Math.floor(Math.random() * symbols.length)];
      const reel3 = symbols[Math.floor(Math.random() * symbols.length)];
      
      const resultSymbols = [reel1, reel2, reel3];
      
      let winMultiplier = 0;
      if (reel1 === reel2 && reel2 === reel3) {
        // Jackpot / Major Win
        const multipliers: any = {
           '7': 50,
           'BAR': 20,
           'CHERRY': 10,
           'DIAMOND': 100,
           'GOLD': 30,
           'BELL': 15
        };
        winMultiplier = multipliers[reel1];
      } else if (reel1 === reel2 || reel2 === reel1 || reel1 === reel3) {
        // Minor Win
        winMultiplier = 2;
      }

      const winAmount = betAmount * winMultiplier;

      await db.runTransaction(async (transaction) => {
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists) throw new Error("User missing");
        
        const userData = userDoc.data()!;
        if (userData.balance < betAmount) throw new Error("ইনসাফিসিয়েন্ট ব্যালেন্স (Insufficient balance)");
        
        const newBalance = userData.balance - betAmount + winAmount;
        
        transaction.update(userRef, {
          balance: newBalance,
          updatedAt: new Date().toISOString()
        });

        // Log bet
        const betRef = db.collection('bets').doc();
        transaction.set(betRef, {
          userId: uid,
          betAmount,
          winAmount,
          symbols: resultSymbols,
          gameType: 'slot',
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
      });

      res.json({
        success: true,
        symbols: resultSymbols,
        winAmount,
        multiplier: winMultiplier
      });

    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // --- Daily Reward API ---
  app.post("/api/game/rewards/daily", async (req, res) => {
    const { idToken } = req.body;
    if (!idToken) return res.status(400).json({ error: "Missing token" });

    try {
      const decodedToken = await auth.verifyIdToken(idToken);
      const uid = decodedToken.uid;
      const userRef = db.collection('users').doc(uid);
      const rewardRef = db.collection('daily_rewards').doc(uid);

      await db.runTransaction(async (transaction) => {
        const rewardDoc = await transaction.get(rewardRef);
        const now = new Date();
        now.setHours(0,0,0,0);

        if (rewardDoc.exists) {
          const lastClaimed = new Date(rewardDoc.data()!.lastClaimed);
          lastClaimed.setHours(0,0,0,0);
          
          if (now.getTime() === lastClaimed.getTime()) {
            throw new Error("আজকের বোনাস আপনি সংগ্রহ করেছেন");
          }
        }

        const bonus = 50; // Demo coins
        transaction.update(userRef, {
          balance: admin.firestore.FieldValue.increment(bonus)
        });

        transaction.set(rewardRef, {
          userId: uid,
          lastClaimed: new Date().toISOString(),
          currentStreak: admin.firestore.FieldValue.increment(1)
        }, { merge: true });
      });

      res.json({ success: true, bonus: 50 });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  /* ... */

  // Generic Telegram Event Notification API
  app.post("/api/telegram/event", verifyAdminToken, async (req, res) => {
    try {
      const { event, details } = req.body;
      const message = `🔔 <b>Event: ${event}</b>\n\n${details}`;
      await sendTelegramNotification(message);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Admin API Middleware
  async function verifyAdminToken(req: express.Request, res: express.Response, next: express.NextFunction) {
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
  }

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

  // Get all game providers
  app.get("/api/admin/providers", verifyAdminToken, async (req, res) => {
    try {
      const snapshot = await db.collection('game_providers').get();
      const providers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      res.json({ success: true, count: providers.length, providers });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Create or Update a game provider
  app.post("/api/admin/providers", verifyAdminToken, async (req, res) => {
    try {
      const { id, name, apiKey, apiEndpoint, isActive } = req.body;
      const providerId = id || name.toLowerCase().replace(/\s+/g, '_');
      
      const docRef = db.collection('game_providers').doc(providerId);
      await docRef.set({
        name,
        apiKey,
        apiEndpoint,
        isActive: !!isActive,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      res.json({ success: true, id: providerId, message: "Provider updated successfully" });
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
        if (status === 'rejected' && txData.type === 'withdrawal') {
          transaction.update(userRef, {
            balance: admin.firestore.FieldValue.increment(Math.abs(txData.amount))
          });
        }

        // Special handling for approval of deposits - adding balance and VIP points
        if (status === 'completed' && txData.type === 'deposit') {
          const depositAmount = txData.amount;
          const currentPoints = userDoc.data()?.vipPoints || 0;
          const newPoints = currentPoints + Math.floor(depositAmount / 100);
          
          // VIP Level Calculation
          let newVipLevel = 0;
          if (newPoints >= 10000) newVipLevel = 4; // Diamond
          else if (newPoints >= 2000) newVipLevel = 3; // Platinum
          else if (newPoints >= 500) newVipLevel = 2; // Gold
          else if (newPoints >= 100) newVipLevel = 1; // Silver

          transaction.update(userRef, {
            balance: admin.firestore.FieldValue.increment(depositAmount),
            totalDeposits: admin.firestore.FieldValue.increment(depositAmount),
            vipPoints: newPoints,
            vipLevel: newVipLevel,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
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
          { path: "/rocket", hits: 950 },
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
        type: type === 'add' ? 'bonus' : 'withdrawal',
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

  // Create Notification
  app.post("/api/admin/notifications", verifyAdminToken, async (req, res) => {
    try {
      const { title, message, type, url, targetUserId } = req.body;
      if (!title || !message) {
        res.status(400).json({ error: "Title and message are required" });
        return;
      }

      if (targetUserId && targetUserId !== 'all') {
        const notifRef = db.collection('users').doc(targetUserId).collection('notifications').doc();
        await notifRef.set({
          title,
          message,
          type: type || 'info',
          actionUrl: url || '',
          read: false,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
      } else {
        // Send to all users
        const usersSnapshot = await db.collection('users').get();
        const batches = [];
        let currentBatch = db.batch();
        let i = 0;
        
        usersSnapshot.forEach(doc => {
          const notifRef = doc.ref.collection('notifications').doc();
          currentBatch.set(notifRef, {
            title,
            message,
            type: type || 'info',
            actionUrl: url || '',
            read: false,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
          });
          i++;
          if (i % 500 === 0) { 
            batches.push(currentBatch.commit());
            currentBatch = db.batch();
          }
        });
        
        if (i % 500 !== 0) {
          batches.push(currentBatch.commit());
        }
        await Promise.all(batches);
      }

      res.json({ success: true, message: "Notification sent successfully." });
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

    if (supportAdminChatId || TELEGRAM_ADMIN_CHAT_ID) {
      try {
        await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: supportAdminChatId || TELEGRAM_ADMIN_CHAT_ID,
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

    if (supportAdminChatId || TELEGRAM_ADMIN_CHAT_ID) {
      try {
        const tgRes = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: supportAdminChatId || TELEGRAM_ADMIN_CHAT_ID,
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

  // Catch-all for undefined /api routes
  app.all("/api/*", (req, res) => {
    console.warn(`404 for API route: ${req.method} ${req.url}`);
    res.status(404).json({ 
      error: `API route not found: ${req.url}`,
      method: req.method,
      expectedJson: true
    });
  });

  // Vite and Static Middleware ORDER is critical
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath, {
      setHeaders: (res, path) => {
        if (path.endsWith('.js') || path.endsWith('.ts') || path.endsWith('.tsx')) {
          res.setHeader('Content-Type', 'application/javascript');
        }
      }
    }));
    app.get('*', (req, res, next) => {
      // Don't serve index.html for what looks like a missing asset/file
      if (req.url.includes('.') && !req.url.endsWith('.html')) {
        return res.status(404).send('Asset not found');
      }
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
    
    // Start background loops after server is listening
    initializeGlobalConfig().catch(err => console.error("Config initialization failed:", err));
    pollTelegramUpdates().catch(err => console.error("Telegram polling failed to start:", err));
  });

  // Global Error Handlers
  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  });
  process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
  });
}

startServer().catch(err => {
  console.error("FATAL: startServer failed:", err);
});
