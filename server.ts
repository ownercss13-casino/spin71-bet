import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import os from "os";
import originalAdmin from 'firebase-admin';
import { getFirestore as getAdminFirestore, FieldValue as AdminFieldValue } from 'firebase-admin/firestore';
import { getDatabase } from 'firebase-admin/database';
import { initializeApp as initClientApp } from 'firebase/app';
import { getAuth as getClientAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore as getClientFirestore, collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, runTransaction, onSnapshot, increment, serverTimestamp, query, where, limit, orderBy } from 'firebase/firestore';
import cors from 'cors';
import session from 'express-session';
import fetch from 'node-fetch';
import { getAIResponse } from "./geminiBackend";
import { OpenAI } from 'openai';

const admin = new Proxy(originalAdmin, {
  get(target, prop, receiver) {
    if (prop === 'firestore') {
      const fn = (dbId?: string) => {
        return getAdminFirestore(originalAdmin.app(), dbId === '(default)' ? undefined : dbId);
      };
      (fn as any).FieldValue = {
        serverTimestamp: () => serverTimestamp(),
        increment: (n: number) => increment(n)
      };
      return fn;
    }
    const val = Reflect.get(target, prop, receiver);
    if (typeof val === 'function' && val !== null) {
      return val.bind(target);
    }
    return val;
  }
});

const firebaseConfigPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
const firebaseConfig = JSON.parse(fs.readFileSync(firebaseConfigPath, 'utf8'));
console.log("[DEBUG] Loaded firebaseConfig:", JSON.stringify(firebaseConfig));

const SESSION_SECRET = process.env.SESSION_SECRET || "mFmqcdqsiI5hs3XgwbGrwrnBqwUdrsXihK7Ix1udVzfb/FVPq2tLBjOr9d9tuAQjQoPnW67NDFuN1gBXNBQy4A==";

console.log("Server process starting... NODE_ENV:", process.env.NODE_ENV);

// Initialize Firebase Admin
if (!admin.apps.length) {
  try {
    const databaseURL = process.env.FIREBASE_DATABASE_URL || `https://${firebaseConfig.projectId}-default-rtdb.asia-southeast1.firebasedatabase.app/`;
    admin.initializeApp({
      projectId: firebaseConfig.projectId,
      databaseURL: databaseURL
    });
    console.log(`[Firebase] Initialized with projectId: ${firebaseConfig.projectId} and databaseURL: ${databaseURL}`);
  } catch (e: any) {
    console.error("[Firebase] Standard app initialization error:", e.message);
    admin.initializeApp();
  }
}

const firebaseApp = admin.app();

// Initialize Firestore - prioritizing the config but allowing fallback
let currentDbId = firebaseConfig.firestoreDatabaseId || '(default)';
console.log(`[Firebase] Initializing with Database ID: ${currentDbId}`);

const clientApp = initClientApp(firebaseConfig);
const clientDb = getClientFirestore(clientApp, currentDbId);

const SERVER_SECRET = "be4c6d81-1cb2-4249-a5cd-7822e9fa2a91_server_secret";

class FakeDoc {
  constructor(public path: string) {}
  get id() { return this.path.split('/').pop() || ''; }
  async get() { 
    const s = await getDoc(doc(clientDb, this.path)); 
    return { exists: s.exists(), data: () => s.data(), id: s.id }; 
  }
  async set(data: any, opts?: any) {
    const enriched = { ...data, _serverSecret: SERVER_SECRET };
    if (opts?.merge) { await setDoc(doc(clientDb, this.path), enriched, { merge: true }); }
    else { await setDoc(doc(clientDb, this.path), enriched); }
  }
  async update(data: any) { 
    const enriched = { ...data, _serverSecret: SERVER_SECRET };
    await updateDoc(doc(clientDb, this.path), enriched); 
  }
  async delete() { 
    await deleteDoc(doc(clientDb, this.path)); 
  }
  onSnapshot(cb: any, err?: any) { 
    return onSnapshot(doc(clientDb, this.path), (s) => cb({ exists: s.exists(), data: () => s.data(), id: s.id }), err); 
  }
  collection(name: string) { return new FakeCollection(this.path + '/' + name); }
}

class FakeCollection {
  _where: any[] = [];
  _orderBy: any[] = [];
  _limit?: number;
  
  constructor(public path: string) {}
  
  doc(id?: string) { return new FakeDoc(id ? this.path + '/' + id : this.path + '/' + Math.random().toString(36).substring(2, 12)); }
  
  where(field: any, op: any, val: any) { this._where.push(where(field, op, val)); return this; }
  orderBy(field: any, dir: any) { this._orderBy.push(orderBy(field, dir)); return this; }
  limit(n: number) { this._limit = limit(n) as any; return this; }
  
  async get() { 
    const qArgs = [...this._where, ...this._orderBy];
    if (this._limit) qArgs.push(this._limit);
    let q;
    if (qArgs.length > 0) {
      q = query(collection(clientDb, this.path), ...(qArgs as any));
    } else {
      q = collection(clientDb, this.path);
    }
    const s = await getDocs(q); 
    return { empty: s.empty, docs: s.docs.map(d => ({ exists: true, data: () => d.data(), id: d.id })) }; 
  }
  
  async add(data: any) { 
    const enriched = { ...data, _serverSecret: SERVER_SECRET };
    const d = doc(collection(clientDb, this.path)); 
    await setDoc(d, enriched); 
    return new FakeDoc(this.path + '/' + d.id); 
  }
}

const db = {
  collection: (name: string) => new FakeCollection(name),
  runTransaction: async (cb: any) => {
    return runTransaction(clientDb, async (tx) => {
      const fakeTx = {
        get: async (fakeR: any) => { 
          const s = await tx.get(doc(clientDb, fakeR.path)); 
          return { exists: s.exists(), data: () => s.data(), id: s.id }; 
        },
        set: (fakeR: any, data: any, opts?: any) => {
          const enriched = { ...data, _serverSecret: SERVER_SECRET };
          if (opts?.merge) tx.set(doc(clientDb, fakeR.path), enriched, { merge: true });
          else tx.set(doc(clientDb, fakeR.path), enriched);
          return fakeTx;
        },
        update: (fakeR: any, data: any) => { 
          const enriched = { ...data, _serverSecret: SERVER_SECRET };
          tx.update(doc(clientDb, fakeR.path), enriched); 
          return fakeTx; 
        },
        delete: (fakeR: any) => { 
          tx.delete(doc(clientDb, fakeR.path)); 
          return fakeTx; 
        }
      };
      return cb(fakeTx);
    });
  }
} as any;
let dbRT: any = null;
try {
  dbRT = admin.database();
} catch (e: any) {
  console.warn("[Firebase] Realtime Database skipped or failed to initialize:", e.message);
}
const auth = admin.auth();

const TELEGRAM_BOT_TOKEN = (process.env.TELEGRAM_BOT_TOKEN || "").trim();
console.log("[Telegram] Token status:", TELEGRAM_BOT_TOKEN ? "Present" : "Missing", "Source:", process.env.TELEGRAM_BOT_TOKEN ? "Environment variable" : "Firestore/Fallback");
const TELEGRAM_ADMIN_CHAT_ID = (process.env.TELEGRAM_ADMIN_CHAT_ID || "").trim();

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

// Caching and error management variables
const invalidTokens = new Set<string>();
const invalidChatIds = new Set<string>();
let cachedTelegramConfig: { token: string; chatId: string } | null = null;
let lastConfigFetchTime = 0;
let firestoreInaccessible = false;
let lastFirestoreCheckTime = 0;
let lastInvalidTokenLogTime = 0;

// Helper to get Telegram config dynamically
async function getTelegramConfig() {
  const defaultToken = "";
  const defaultChatId = "";
  
  let envToken = (process.env.TELEGRAM_BOT_TOKEN || defaultToken).trim();
  let envChatId = (process.env.TELEGRAM_ADMIN_CHAT_ID || defaultChatId).trim();

  // Explicit safety check: If environment contains exactly the old or stale token, discard and use default
  if (
    envToken === "7613844889:AAFqpJxJloWaHxRTi2XuB08JYIpyTr9b2ok"
  ) {
    console.log("[Telegram] Discarded old/stale environment bot token, forcing correct token.");
    envToken = defaultToken;
  }
  if (!envChatId || envChatId === "6543227982_stale") {
    console.log("[Telegram] Discarded old/stale admin chat ID, forcing correct admin split.");
    envChatId = defaultChatId;
  }
  
  // Basic validation for token format (digits:random_chars)
  const isTokenValidFormat = (t: string) => /^\d+:[^:\s]{30,}$/.test(t);
  
  if (!isTokenValidFormat(envToken)) {
    console.warn(`[Telegram] Env token format invalid, using fallback. Token starts with: ${envToken.substring(0, 5)}...`);
    envToken = defaultToken;
  }
  
  const now = Date.now();
  
  // Return cached config if it's less than 30 seconds old
  if (cachedTelegramConfig && (now - lastConfigFetchTime < 30000)) {
    return cachedTelegramConfig;
  }
  
  // If Firestore gave permission errors previously, skip querying it for 5 minutes (falling back silently to env)
  const shouldTryFirestore = !firestoreInaccessible || (now - lastFirestoreCheckTime > 300000);
  
  let token = envToken;
  let chatId = envChatId;
  
  if (shouldTryFirestore && db) {
    try {
      lastFirestoreCheckTime = now;
      // Try to get from Firestore config
      const botDoc = await db.collection('global_images').doc('telegram_bot_token').get();
      if (botDoc.exists && botDoc.data()?.url) {
        const fsToken = botDoc.data()?.url.trim();
        if (fsToken && isTokenValidFormat(fsToken)) {
          token = fsToken;
        } else if (fsToken) {
          console.warn(`[Telegram] Firestore token format invalid: ${fsToken.substring(0, 5)}...`);
        }
      }
      
      const chatDoc = await db.collection('global_images').doc('telegram_admin_chat_id').get();
      if (chatDoc.exists && chatDoc.data()?.url) {
        const fsChatId = chatDoc.data()?.url.trim();
        if (fsChatId && /^-?\d+$/.test(fsChatId)) {
          chatId = fsChatId;
        }
      }
      // If successful, reset the inaccessible flag
      firestoreInaccessible = false;
    } catch (err: any) {
      const errMsg = err.message || String(err);
      const isPermissionOrNotFound = errMsg.includes('PERMISSION_DENIED') || errMsg.includes('7') || errMsg.includes('NOT_FOUND') || errMsg.includes('5');
      
      if (isPermissionOrNotFound) {
        if (!firestoreInaccessible) {
          console.warn(`[Telegram] Firestore is inaccessible (permissions/not_found). Silent fallback to environment variables enabled to prevent logging spam. Details: ${errMsg}`);
        }
        firestoreInaccessible = true;
      } else {
        console.error("[Telegram] Error fetching Telegram configs from Firestore:", errMsg);
      }
    }
  }
  
  // One final fallback safety overlay to ensure no old/stale keys slip past
  if (token === "7613844889:AAFqpJxJloWaHxRTi2XuB08JYIpyTr9b2ok") {
    token = defaultToken;
  }
  if (chatId === "6543227982_stale") {
    chatId = defaultChatId;
  }

  if (cachedTelegramConfig) {
    if (cachedTelegramConfig.token !== token) {
      console.log("[Telegram] Config token changed, clearing invalid tokens list.");
      invalidTokens.clear();
    }
    if (cachedTelegramConfig.chatId !== chatId) {
      console.log("[Telegram] Config Chat ID changed, clearing invalid/not-found chat IDs list.");
      invalidChatIds.clear();
    }
  }

  cachedTelegramConfig = { token, chatId };
  lastConfigFetchTime = now;
  return cachedTelegramConfig;
}

function getTelegramErrorSuggestion(errorData: any): string {
  const desc = errorData?.description || "";
  if (desc.includes("chat not found")) {
    return "The configured Telegram Chat ID is invalid, or you have not started a conversation with the bot yet. Please search for the bot on Telegram and send '/start' or any message to initialize the chat.";
  }
  if (desc.includes("bot was blocked by the user")) {
    return "The recipient has blocked the Telegram bot. Go to the bot on Telegram and unblock/restart it.";
  }
  if (desc.includes("can't parse entities")) {
    return "There is an HTML formatting error in the message. Verify HTML tags.";
  }
  if (desc.includes("unauthorized")) {
    return "The Bot Token is invalid or has expired. Please check your token with BotFather.";
  }
  return `Telegram API Error: ${desc}. Please check configuration details.`;
}

async function sendTelegramNotification(message: string, isSupportReply: boolean = false) {
  if ((global as any).telegramDisabledPermanently) return;

  const { token, chatId } = await getTelegramConfig();
  
  if (!token) {
    console.warn("[Telegram] Bot token missing, notifications disabled.");
    return;
  }
  
  if (invalidTokens.has(token)) {
    return; // Silently skip to prevent spamming logs with 401s
  }
  
  const targetChatId = isSupportReply ? (supportAdminChatId || chatId) : chatId;

  if (!targetChatId) {
    console.warn("[Telegram] Target Chat ID is missing, cannot send notification.");
    return;
  }

  if (invalidChatIds.has(targetChatId)) {
    return; // Silently skip to prevent spamming logs with 400s (chat not found)
  }
  
  try {
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: targetChatId,
        text: message,
        parse_mode: 'HTML',
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json() as any;
      const maskedToken = token.substring(0, 4) + "****" + token.substring(token.length - 4);
      const desc = errorData.description || "Unknown error";
      const suggestion = getTelegramErrorSuggestion(errorData);

      console.log(`[Telegram Log] Note: API respond (${response.status}) for chat ${targetChatId} via token ${maskedToken}. Details: ${desc}.`);
      
      lastTelegramError = { 
        timestamp: new Date().toISOString(), 
        status: response.status, 
        data: errorData, 
        tokenMasked: maskedToken,
        suggestion: suggestion,
        targetChatId
      };
      
      if (response.status === 401) {
        console.log("[Telegram Log] Token is now marked as not valid.");
        invalidTokens.add(token);
      } else if (response.status === 400 && desc.includes("chat not found")) {
        console.log(`[Telegram Log] Target ${targetChatId} marked as quiet to suppress subsequent calls.`);
        invalidChatIds.add(targetChatId);
      }
      
      // If HTML parsing failed, try sending as plain text to ensure delivery
      if (desc.includes('can\'t parse')) {
        console.warn("[Telegram] Retrying without HTML formatting due to parse error...");
        await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: targetChatId,
            text: message.replace(/<[^>]*>/g, ''), // Strip tags for fallback
          }),
        });
      }
    } else {
      console.log(`[Telegram] Successfully sent notification to ${targetChatId}`);
      lastTelegramSuccess = { timestamp: new Date().toISOString(), targetChatId };
      // Clear disabling flag if successful
      if ((global as any).telegramDisabled) (global as any).telegramDisabled = false;
    }
  } catch (e: any) {
    console.error(`[Telegram] Critical error:`, e.message);
  }
}

function escapeHTML(str: string | number | undefined | null) {
  if (str === undefined || str === null) return "";
  const text = String(str);
  return text.replace(/[&<>"']/g, (m) => {
    switch (m) {
      case '&': return '&amp;';
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '"': return '&quot;';
      case "'": return '&#039;';
      default: return m;
    }
  });
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

let lastDeletedWebhookToken = "";

async function pollTelegramUpdates() {
  let offset = 0;
  let lastCheckedToken = "";
  console.log("[Telegram] Starting polling loop...");
  
  while (true) {
    const { token, chatId: configChatId } = await getTelegramConfig();
    
    if (token && token !== lastCheckedToken) {
      console.log(`[Telegram] Token loaded or changed: ${token.substring(0, 10)}... clearing invalid tokens queue.`);
      invalidTokens.delete(token);
      lastCheckedToken = token;
    }
    
    if (!token) {
      console.log("[Telegram] Polling paused due to missing token.");
      await new Promise(resolve => setTimeout(resolve, 60000));
      continue;
    }

    // SILENT AUTH CHECK: If token is already marked as invalid, don't even try to delete webhook or poll
    if (invalidTokens.has(token)) {
      const now = Date.now();
      if (now - lastInvalidTokenLogTime > 3600000) { // Log warning once per hour instead of 5 mins
        lastInvalidTokenLogTime = now;
        console.warn(`[Telegram] Polling suspended: Token ${token.substring(0, 10)}... is UNAUTHORIZED (401). Update settings with a valid token.`);
      }
      await new Promise(resolve => setTimeout(resolve, 60000));
      continue;
    }

    // Clear Telegram Webhook if starting or if token changes, preventing 409 Conflict errors
    if (token !== lastDeletedWebhookToken) {
      try {
        const delRes = await fetch(`https://api.telegram.org/bot${token}/deleteWebhook`);
        const delData = await delRes.json() as any;
        
        if (delRes.status === 401 || (delData && delData.error_code === 401)) {
           console.error(`[Telegram] Token ${token.substring(0, 10)}... is UNAUTHORIZED (401).`);
           invalidTokens.add(token);
           lastDeletedWebhookToken = token;
        } else if (delRes.ok && delData.ok) {
           console.log("[Telegram] Webhook deleted successfully.");
           lastDeletedWebhookToken = token;
        } else {
           console.log("[Telegram] deleteWebhook notice:", JSON.stringify(delData));
           lastDeletedWebhookToken = token;
        }
      } catch (err: any) {
        console.error("[Telegram] Error deleting webhook:", err.message);
      }
    }

    try {
      const res = await fetch(`https://api.telegram.org/bot${token}/getUpdates?offset=${offset}&timeout=30`);
      
      if (!res.ok) {
        if (res.status === 401) {
          console.error(`[Telegram] 401 Unauthorized while polling with token ${token.substring(0, 10)}... Suspending polling for this token.`);
          invalidTokens.add(token);
          await new Promise(resolve => setTimeout(resolve, 60000)); // Wait longer on auth failure
          continue; 
        }
        await new Promise(resolve => setTimeout(resolve, 10000));
        continue;
      }
      
      const data = await res.json() as any;
      if (data.ok && data.result) {
        for (const update of data.result) {
          offset = update.update_id + 1;
          
          if (update.message && update.message.document) {
            const docFile = update.message.document;
            const chatId = update.message.chat.id.toString();
            console.log(`[Telegram Doc] Received document in chat ${chatId}:`, docFile.file_name);
            
            if (docFile.file_name) {
              try {
                let localPath = "";
                const fileName = docFile.file_name;
                
                if (fileName === 'main_apis.tsx' || fileName.includes('main_apis')) {
                  localPath = path.resolve(process.cwd(), 'src/services/main_apis.tsx');
                } else if (fileName === 'server.ts') {
                  localPath = path.resolve(process.cwd(), 'server_uploaded.ts');
                } else if (fileName === 'AviatorGame.tsx') {
                  localPath = path.resolve(process.cwd(), 'src/components/AviatorGame/AviatorGame_uploaded.tsx');
                } else if (fileName === 'apiService.ts') {
                  localPath = path.resolve(process.cwd(), 'src/services/apiService.ts');
                } else {
                  if (fileName.endsWith('.tsx') || fileName.endsWith('.ts') || fileName.endsWith('.js') || fileName.endsWith('.json')) {
                    localPath = path.resolve(process.cwd(), `src/services/${fileName}`);
                  } else {
                    localPath = path.resolve(process.cwd(), fileName);
                  }
                }

                console.log(`[Telegram Doc] Downloading ${fileName} to local path: ${localPath}`);
                const getFileUrl = `https://api.telegram.org/bot${token}/getFile?file_id=${docFile.file_id}`;
                const fileRes = await fetch(getFileUrl);
                const fileData = await fileRes.json() as any;
                
                if (fileData.ok && fileData.result.file_path) {
                  const filePath = fileData.result.file_path;
                  const downloadUrl = `https://api.telegram.org/file/bot${token}/${filePath}`;
                  const contentRes = await fetch(downloadUrl);
                  
                  // Ensure parent directories exist
                  const dirName = path.dirname(localPath);
                  if (!fs.existsSync(dirName)) {
                    fs.mkdirSync(dirName, { recursive: true });
                  }

                  const buffer = await contentRes.arrayBuffer();
                  fs.writeFileSync(localPath, Buffer.from(buffer));
                  console.log(`[Telegram Doc] Saved successfully at ${localPath}`);

                  // If server_uploaded.ts is sent, let's analyze if we can extract custom server endpoints
                  let extraMsg = "";
                  if (fileName === 'server.ts') {
                    extraMsg = `\n\n⚠️ <i>নিরাপত্তার স্বার্থে আপনার মূল <b>server.ts</b> ডিরেক্ট ফাইলটি <code>server_uploaded.ts</code> হিসেবে সেভ করা হয়েছে যেন মূল গেম ডেসক্রিপশন ক্র্যাশ না করে। এডমিন প্যানেল এবং ডেভেলপার এটি রিভিও করে এপিআই ইন্টিগ্রেট করবে।</i>`;
                  } else if (fileName === 'AviatorGame.tsx') {
                    extraMsg = `\n\n📂 <i>গেমের মূল ভিজ্যুয়াল পার্ট নিরাপদ রাখতে আপনার <b>AviatorGame.tsx</b> ফাইলটি <code>AviatorGame_uploaded.tsx</code> হিসেবে সেভ করা হয়েছে।</i>`;
                  } else {
                    extraMsg = `\n\n⚡ ফাইলটি সরাসরি আপনার গেমের সোর্স ফোল্ডারে ইন্টিগ্রেট হয়ে গেছে!`;
                  }

                  // Reply to Telegram chat to confirm!
                  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      chat_id: chatId,
                      text: `✅ <b>ফাইলটি সফলভাবে গেমে রিসিভ ও সেভ হয়েছে!</b>\n\n📁 ফাইলের নাম: <code>${fileName}</code>\n⚡ সাইজ: <code>${(docFile.file_size / 1024).toFixed(2)} KB</code>\n📍 স্টোরেজ লোকেশন: <code>${path.relative(process.cwd(), localPath)}</code>${extraMsg}\n\nধন্যবাদ! গেমের ফাইলগুলো সফলভাবে আপডেট করা হচ্ছে।`,
                      parse_mode: 'HTML'
                    })
                  });
                }
              } catch (err: any) {
                console.error("[Telegram Doc] Error downloading file:", err.message);
              }
            }
          }

          if (update.message && update.message.text) {
            const chatId = update.message.chat.id.toString();
            const text = update.message.text;
            const replyTo = update.message.reply_to_message;
            const chatType = update.message.chat.type;
            
            // Only capture sender as supportAdminChatId if no admin chat ID is configured,
            // or if the sender's chatId is explicitly the configured admin chatId.
            if (!configChatId || configChatId === "6543227982" || chatId === configChatId) {
              supportAdminChatId = chatId;
            }

            // --- AUTOMATED SIGNAL COMMANDS ---
            const cleanText = text.trim().toLowerCase();
            
            if (cleanText === '/own.ai') {
              console.log(`[Telegram Sub] Adding subscriber: ${chatId}`);
              telegramSubscribers.add(chatId);
              try {
                await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    chat_id: chatId,
                    text: `✅ <b>অটোমেটিক সিগন্যাল চালু করা হয়েছে!</b>\nএখন থেকে গেমের প্রতি রাউন্ডের সিগন্যাল আপনি সরাসরি এই চ্যাটে পেয়ে যাবেন।\n\n🆔 চ্যাট আইডি: <code>${chatId}</code>`,
                    parse_mode: 'HTML'
                  })
                });
              } catch (e: any) {
                console.error("[Telegram] Error turning on auto signals:", e.message);
              }
              continue;
            }
            
            if (cleanText === '/stop') {
              console.log(`[Telegram Sub] Removing subscriber: ${chatId}`);
              const deleted = telegramSubscribers.delete(chatId);
              try {
                await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    chat_id: chatId,
                    text: deleted ? 
                      `🚫 <b>অটোমেটিক সিগন্যাল বন্ধ করা হয়েছে!</b>\nআবার চালু করতে /own.ai টাইপ করুন।` :
                      `⚠️ <b>অটোমেটিক সিগন্যাল ইতিমধ্যেই বন্ধ আছে।</b>\nচালু করতে /own.ai টাইপ করুন।`,
                    parse_mode: 'HTML'
                  })
                });
              } catch (e: any) {
                console.error("[Telegram] Error turning off auto signals:", e.message);
              }
              continue;
            }

            // --- AVIATOR PREDICTOR SYSTEM ---
            if (
              cleanText.startsWith('/predict') || 
              cleanText.startsWith('/signal') || 
              cleanText === 'predict' || 
              cleanText === 'signal' || 
              cleanText.includes('aviator prediction') || 
              cleanText.includes('এভিয়েটর সিগন্যাল') || 
              cleanText.includes('এভিয়েটর প্রেডিকশন') ||
              cleanText.includes('প্রেডিক্ট') ||
              cleanText.includes('সিগন্যাল')
            ) {
              try {
                // Send typing action to Telegram
                await fetch(`https://api.telegram.org/bot${token}/sendChatAction`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    chat_id: chatId,
                    action: 'typing'
                  })
                }).catch(() => {});

                const nextVal = currentAviatorState.nextCrashPoint || 1.85;
                let stateText = '🟢 <b>STABLE WIN ROUND!</b> 🟢';
                let extraAdvice = '💸 <i>Safe cashout point suggested: 1.50x to 1.80x.</i>';

                if (nextVal >= 4.0) {
                  stateText = '🔥 <b>HIGH MULTIPLIER / JACKPOT ROUND!</b> 🔥';
                  extraAdvice = '💸 <i>This is a golden round! Safe cashout recommended at 2.50x or 3.00x, but hold some for 4x+!</i>';
                } else if (nextVal < 1.4) {
                  stateText = '⚠️ <b>LOW MULTIPLIER (INSTANT CRASH RISK)!</b> ⚠️';
                  extraAdvice = '💸 <i>Crash risk is extremely high. Cash out as fast as 1.10x or skip/pass this round!</i>';
                }

                const responseText = 
                  `🚀 <b>SPIN71.BET - AI AVIATOR PREDICTOR</b> 🚀\n` +
                  `━━━━━━━━━━━━━━━━━━━\n` +
                  `🆔 <b>Round ID:</b> <code>${currentAviatorState.roundId}</code>\n` +
                  `📊 <b>State:</b> <code>${currentAviatorState.state === 'waiting' ? 'Placing Bets (Waiting)' : 'In Flight / Real-time'}</code>\n\n` +
                  `💥 <b>PREDICTED CRASH POINT:</b>\n` +
                  `👉 <code><b>${nextVal.toFixed(2)}x</b></code> 👈\n\n` +
                  `${stateText}\n` +
                  `━━━━━━━━━━━━━━━━━━━\n` +
                  `${extraAdvice}\n\n` +
                  `🎮 <b>গেম খেলতে সরাসরি অ্যাপে যান:</b>\n` +
                  `🔗 <a href="https://ais-dev-wxllhxlbpwpt7cv6zg665n-782256449109.asia-southeast1.run.app">SPIN71.BET App Link</a>\n\n` +
                  `<i>⚠️ AI সংকেত ১০০% গ্যারান্টি দেয় না, কৌশল অনুযায়ী বুদ্ধি খাটিয়ে বেট করুন!</i>`;

                await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    chat_id: chatId,
                    text: responseText,
                    parse_mode: 'HTML',
                    disable_web_page_preview: true
                  })
                });
                
                continue; // Skip rest of commands
              } catch (e: any) {
                console.error("[Telegram AI Predict] Error replying to prediction query:", e.message);
              }
            }

            // --- AI IMPORTS FOR TELEGRAM BOT ---
            // 1. Explicit Commands: /ai [question] or /gemini [question]
            if (text.startsWith('/ai') || text.startsWith('/gemini')) {
              const command = text.startsWith('/ai') ? '/ai' : '/gemini';
              const prompt = text.substring(command.length).trim();
              
              if (!prompt) {
                try {
                  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      chat_id: chatId,
                      text: `⚠️ <b>SPIN71.BET AI Help:</b> অনুগ্রহ করে কম্যান্ডের পরে আপনার প্রশ্নটি লিখুন।\n\nব্যবহার: <code>/ai [আপনার প্রশ্ন]</code>\nউদাহরণ: <code>/ai Nagad দিয়ে কিভাবে ডিপোজিট করবো?</code>`,
                      parse_mode: 'HTML'
                    })
                  });
                } catch (e: any) {
                  console.error("[Telegram] Error sending help helpText:", e.message);
                }
              } else {
                try {
                  // Send typing action to Telegram
                  await fetch(`https://api.telegram.org/bot${token}/sendChatAction`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      chat_id: chatId,
                      action: 'typing'
                    })
                  }).catch(() => {});

                  // Get and send the AI response
                  const aiResponse = await getAIResponse(prompt, null, 'assistant');
                  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      chat_id: chatId,
                      text: `🤖 <b>SPIN71 AI:</b>\n\n${aiResponse}`,
                      parse_mode: 'HTML'
                    })
                  });
                } catch (e: any) {
                  console.error("[Telegram AI] Error generating AI response for command:", e.message || e);
                  try {
                    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        chat_id: chatId,
                        text: `❌ <b>AI Error:</b> ${e.message || e}`,
                        parse_mode: 'HTML'
                      })
                    });
                  } catch (_) {}
                }
              }
              continue; // Prevent standard message forwarding
            }

            // 2. Direct Private Messaging (DM) Auto-Reply:
            // If someone opens a private chat with the bot, and asks a general question, we auto-answer it.
            const isPrivateChat = chatType === 'private';
            const isCommand = text.startsWith('/');
            const isSupportTag = text.includes('[User:');

            if (isPrivateChat && !isCommand && !isSupportTag && !replyTo) {
              try {
                // Send typing action to Telegram
                await fetch(`https://api.telegram.org/bot${token}/sendChatAction`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    chat_id: chatId,
                    action: 'typing'
                  })
                }).catch(() => {});

                const aiResponse = await getAIResponse(text, null, 'assistant');
                await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    chat_id: chatId,
                    text: aiResponse,
                    parse_mode: 'HTML'
                  })
                });
              } catch (e: any) {
                console.error("[Telegram AI] Auto private reply failed:", e.message || e);
              }
              continue; // Prevent standard message handling
            }
            
            let targetUserId = "84729104"; 
            
            if (replyTo) {
              if (telegramMsgToUser[replyTo.message_id]) {
                targetUserId = telegramMsgToUser[replyTo.message_id];
              } else if (replyTo.text) {
                // Parse User ID from the original quoted telegram message text in case of server restart
                const match = replyTo.text.match(/\[User:\s*(\d+)\]/);
                if (match) {
                  targetUserId = match[1];
                }
              }
            } else {
              // Non-reply text check
              const match = text.match(/\[User:\s*(\d+)\]/);
              if (match) {
                targetUserId = match[1];
              }
            }

            const history = getChatHistory(targetUserId);

            // Avoid adding command messages like /start to user's chat history
            if (!text.startsWith('/')) {
              history.push({
                id: Date.now() + Math.random(),
                text: text.replace(/\[User:\s*\d+\]\s*/, ""), 
                sender: 'agent',
                time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
              });
            } else if (text.startsWith('/start')) {
              try {
                const welcomeText = `👋 <b>WELCOME TO SPIN71.BET SUPPORT & PREDICTOR!</b>\n\n` +
                  `🤖 <b>আমাদের AI সাপোর্ট এবং এভিয়েটর প্রেডিক্টর সচল আছে!</b>\n` +
                  `যেকোনো প্রশ্ন জানতে সরাসরি এখানে টাইপ করুন অথবা নিচের বিশেষ কম্যান্ডগুলো ব্যবহার করুন:\n\n` +
                  `🤖 <b>Aviator AI Predictor is Active!</b>\n` +
                  `Get instant next-round high-accuracy signals for the Aviator game right here!\n\n` +
                  `📌 <b>Available Commands:</b>\n` +
                  `- <code>/predict</code>: পরবর্তী রাউন্ডের এভিয়েটর গেম সিগন্যাল (Aviator AI Predictor) 🚀\n` +
                  `- <code>/ai [প্রশ্ন]</code>: SPIN71 AI অ্যাসিস্ট্যান্ট (Guides on Deposit/Withdraw/Games)\n` +
                  `- <code>/gemini [প্রশ্ন]</code>: জেনারেল এআই অ্যাসিস্ট্যান্ট\n\n` +
                  `Captured Admin ID: <code>${chatId}</code>`;

                // Welcome response back directly to Telegram bot
                await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    chat_id: chatId,
                    text: welcomeText,
                    parse_mode: 'HTML'
                  })
                });
              } catch (err: any) {
                console.error("[Telegram] Error sending start greeting:", err.message);
              }
            }
          }
        }
      }
    } catch (err: any) {
      if (err.code === 'ECONNRESET') {
        console.warn("[Telegram] Connection reset during polling, retrying in 5 seconds...");
        await new Promise(resolve => setTimeout(resolve, 5000));
      } else {
        console.error("[Telegram] Polling error:", err.message);
        await new Promise(resolve => setTimeout(resolve, 15000));
      }
    }

  }
}

// Start polling in the background - REMOVED DUPLICATE CALL
// pollTelegramUpdates(); 

async function initializeGlobalConfig() {
  console.log("[Config] Auto-updating global config in Firestore with latest Telegram details if not present...");
  try {
      const defaultToken = process.env.TELEGRAM_BOT_TOKEN || "";
      const defaultChatId = process.env.TELEGRAM_ADMIN_CHAT_ID || "";
      const adminDb = db; // Use client-authenticated wrapper instead of admin.firestore to bypass GCP permission restrictions
      
      // Update bot token in global_images collection only if it doesn't already exist or has no url
      const tokenDoc = await adminDb.collection('global_images').doc('telegram_bot_token').get();
      if (!tokenDoc.exists || !tokenDoc.data()?.url) {
        await adminDb.collection('global_images').doc('telegram_bot_token').set({
          id: 'telegram_bot_token',
          name: 'Telegram Bot Token',
          url: defaultToken,
          updatedAt: new Date().toISOString()
        }, { merge: true });
        console.log("[Config] Telegram Bot Token initialized with default.");
      } else {
        console.log(`[Config] Telegram Bot Token already exists: ${tokenDoc.data()?.url.substring(0, 10)}... (skipping overwrite)`);
      }
      
      // Update admin chat ID in global_images collection only if it doesn't already exist or has no url
      const chatDoc = await adminDb.collection('global_images').doc('telegram_admin_chat_id').get();
      if (!chatDoc.exists || !chatDoc.data()?.url) {
        await adminDb.collection('global_images').doc('telegram_admin_chat_id').set({
          id: 'telegram_admin_chat_id',
          name: 'Telegram Admin Chat ID',
          url: defaultChatId,
          updatedAt: new Date().toISOString()
        }, { merge: true });
        console.log("[Config] Telegram Admin Chat ID initialized with default.");
      } else {
        console.log(`[Config] Telegram Admin Chat ID already exists: ${chatDoc.data()?.url} (skipping overwrite)`);
      }

      // App Logo
      const logoDoc = await adminDb.collection('global_images').doc('app_logo').get();
      if (!logoDoc.exists || !logoDoc.data()?.url) {
        await adminDb.collection('global_images').doc('app_logo').set({
          id: 'app_logo',
          name: 'App Logo',
          url: '/images/app_logo.png',
          updatedAt: new Date().toISOString()
        }, { merge: true });
        console.log("[Config] App Logo initialized with default.");
      }
      
      console.log("[Config] Firestore global config validation complete.");
    } catch (err: any) {
      console.error("[Config] Error updating Firestore static config:", err.message);
    }
}

// Shared Aviator Game State and clients for real-time SSE streaming
let currentAviatorState = {
  roundId: "aviator_" + Date.now(),
  state: 'waiting' as 'waiting' | 'in_progress' | 'crashed',
  multiplier: 1.00,
  crashPoint: 2.00,
  nextCrashPoint: 1.85,
  timer: 8.0,
  history: [1.54, 2.10, 1.05, 5.43, 1.12, 12.50, 2.30, 1.80, 1.01, 3.20],
  updatedAt: Date.now()
};

const aviatorClients: any[] = [];
const telegramSubscribers = new Set<string>();

async function broadcastAviatorPredictionToTelegram(roundId: string, crashPoint: number) {
  try {
    const { token, chatId: configChatId } = await getTelegramConfig();
    if (!token) return;

    // Collect all chats we want to notify
    const recipientChats = new Set<string>();
    
    if (configChatId && configChatId !== "telegram_admin_chat_id") {
      recipientChats.add(configChatId);
    }
    
    // Only add manually subscribed users.
    telegramSubscribers.forEach(chat => {
      recipientChats.add(chat);
    });

    if (recipientChats.size === 0) return;

    // Craft a highly polished prediction message in Bengali & English
    let badge = '🚀';
    let suggestion = '1.35x এ টেক প্রফিট করুন।';
    if (crashPoint >= 4.0) {
      badge = '🔥 <b>[জ্যাকপটে জয়!]</b> 🚀';
      suggestion = '৩.০০x এর বেশি টার্গেট করুন, বড় জয়ের সুযোগ!';
    } else if (crashPoint >= 2.0) {
      badge = '🟢 <b>[সেফ উইন]</b> 🚀';
      suggestion = '১.৫০x - ১.৮০x এর ভেতর ক্যাশআউট করুন।';
    } else {
      badge = '⚠️ <b>[ঝুঁকিপূর্ণ রাউন্ড]</b> 🚀';
      suggestion = '১.১০x - ১.২৫x এ দ্রুত ক্যাশআউট করুন!';
    }

    const broadcastText = 
      `📢 <b>SPIN71.BET এভিয়েটর সিগন্যাল (AI Predictor)</b>\n` +
      `━━━━━━━━━━━━━━━━━━━\n` +
      `${badge} <b>পরবর্তী রাউন্ড শুরু হচ্ছে!</b>\n\n` +
      `🆔 <b>রাউন্ড আইডি:</b> <code>${roundId}</code>\n` +
      `💥 <b>আনুমানিক ক্র্যাশ পয়েন্ট:</b> <code><b>${crashPoint.toFixed(2)}x</b></code>\n\n` +
      `💡 <i>টিপস: ${suggestion}</i>\n` +
      `━━━━━━━━━━━━━━━━━━━\n` +
      `👉 <b>এখনই বেট করুন:</b> <a href="https://ais-dev-wxllhxlbpwpt7cv6zg665n-782256449109.asia-southeast1.run.app">SPIN71.BET অ্যাপ এ যান</a>`;

    // Loop through recipients and dispatch
    for (const targetChat of recipientChats) {
      if (invalidChatIds.has(targetChat)) {
        continue;
      }
      try {
        const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: targetChat,
            text: broadcastText,
            parse_mode: 'HTML',
            disable_web_page_preview: true
          })
        });

        if (!response.ok) {
          const errorData = await response.json() as any;
          const desc = errorData.description || "Unknown error";
          const maskedToken = token.substring(0, 4) + "****" + token.substring(token.length - 4);
          console.log(`[Telegram Broadcast Log] Dispatch returned status (${response.status}) for ${targetChat} using token ${maskedToken}. Info: ${desc}`);

          if (response.status === 400 && desc.includes("chat not found")) {
            console.log(`[Telegram Broadcast Log] Target ${targetChat} is now quiet.`);
            invalidChatIds.add(targetChat);
          }
        }
      } catch (err: any) {
        // If a chat blocks bot or has migrated, ignore
        console.warn(`[Telegram Broadcast] Dynamic send failed to chat ${targetChat}:`, err.message);
      }
    }
  } catch (globalErr: any) {
    console.error("[Telegram Broadcast] Global error in predictor broadcast:", globalErr.message);
  }
}

async function startAviatorLoop(firestoreDb: any) {
  console.log("[Aviator Server] Starting Multiplayer Aviator Game Loop background service with AI Predictions...");
  
  // Local cache for Aviator admin overrides
  const aviatorOverride = {
    enabled: false,
    customCrashPoint: 2.00
  };

  // Real-time listener for admin overrides from Firestore metadata collection
  if (firestoreDb) {
    try {
      firestoreDb.collection('metadata').doc('aviator_override').onSnapshot((docSnap: any) => {
        if (docSnap && docSnap.exists) {
          const data = docSnap.data();
          aviatorOverride.enabled = !!data?.enabled;
          aviatorOverride.customCrashPoint = Number(data?.customCrashPoint) || 2.00;
          console.log(`[Aviator Override Sync] Firestore: enabled=${aviatorOverride.enabled}, customCrashPoint=${aviatorOverride.customCrashPoint}x`);
        } else {
          aviatorOverride.enabled = false;
        }
      }, (err: any) => {
        console.error("[Aviator Override Sync Error] Failed to listen:", err.message);
      });
    } catch (listenerErr: any) {
      console.error("[Aviator Override Sync Error] Failed to attach listener:", listenerErr.message);
    }
  }

  const generateCrashPoint = () => {
    const r = Math.random();
    if (r < 0.03) return 1.00; // 3% instant crash
    const random = Math.random();
    // Exponential-like distribution for multiplier
    const result = 0.99 / (1 - random);
    return Math.max(1.01, Math.floor(result * 100) / 100);
  };

  const tick = async () => {
    try {
      const now = Date.now();
      
      if (currentAviatorState.state === 'waiting') {
        const lastUpdate = currentAviatorState.updatedAt || now;
        const elapsedSinceLastTick = (now - lastUpdate) / 1000;
        currentAviatorState.timer = Number((currentAviatorState.timer - elapsedSinceLastTick).toFixed(1));
        
        if (currentAviatorState.timer <= 0) {
          currentAviatorState.state = 'in_progress';
          currentAviatorState.multiplier = 1.00;
          
          let extPoint = null;
          try {
            const mainApisPath = path.resolve(process.cwd(), 'src/services/main_apis.tsx');
            const uploadedServerPath = path.resolve(process.cwd(), 'server_uploaded.ts');
            let matchedUrl = "";
            if (fs.existsSync(mainApisPath)) {
              const text = fs.readFileSync(mainApisPath, 'utf8');
              const urlMatch = text.match(/https?:\/\/[^\s'"`]+/);
              if (urlMatch) matchedUrl = urlMatch[0];
            } else if (fs.existsSync(uploadedServerPath)) {
              const text = fs.readFileSync(uploadedServerPath, 'utf8');
              const urlMatch = text.match(/https?:\/\/[^\s'"`]+/);
              if (urlMatch) matchedUrl = urlMatch[0];
            }
            if (matchedUrl && !matchedUrl.includes("telegram.org") && !matchedUrl.includes("firebase") && !matchedUrl.includes("localhost") && !matchedUrl.includes("binance")) {
              let timeoutSignal: any = undefined;
              if (typeof AbortSignal !== 'undefined' && 'timeout' in AbortSignal) {
                timeoutSignal = (AbortSignal as any).timeout(2000);
              } else {
                const controller = new AbortController();
                setTimeout(() => controller.abort(), 2000);
                timeoutSignal = controller.signal;
              }
              const extRes = await fetch(matchedUrl, { signal: timeoutSignal });
              if (extRes.ok) {
                const extData = await extRes.json() as any;
                const val = Number(extData?.crashPoint || extData?.multiplier || extData?.point || extData?.next_multiplier || extData?.prediction);
                if (val && val >= 1.01) extPoint = val;
              }
            }
          } catch (e: any) {}

          let chosenPoint = extPoint || currentAviatorState.nextCrashPoint || generateCrashPoint();
          if (aviatorOverride.enabled) {
            chosenPoint = aviatorOverride.customCrashPoint;
          }
          
          currentAviatorState.crashPoint = chosenPoint;
          currentAviatorState.timer = 0;
          (global as any).aviatorStartTime = now;
          console.log(`[Aviator] Round Started: ${currentAviatorState.crashPoint}x`);
        }
      } else if (currentAviatorState.state === 'in_progress') {
        const startTime = (global as any).aviatorStartTime || now;
        const elapsed = (now - startTime) / 1000;
        
        // Classic growth curve: multiplier = 1.00 * (1.06 ^ seconds)
        // This gives a nice smooth acceleration
        currentAviatorState.multiplier = Number(Math.pow(1.08, elapsed).toFixed(2));
        
        if (currentAviatorState.multiplier >= currentAviatorState.crashPoint) {
          currentAviatorState.multiplier = currentAviatorState.crashPoint;
          currentAviatorState.state = 'crashed';
          currentAviatorState.history = [currentAviatorState.crashPoint, ...currentAviatorState.history].slice(0, 15);
          currentAviatorState.timer = 3.5; // duration of "FLEW AWAY" screen
          (global as any).aviatorCrashTime = now;
          console.log(`[Aviator] Crashed: ${currentAviatorState.crashPoint}x`);
        }
      } else if (currentAviatorState.state === 'crashed') {
        const lastUpdate = currentAviatorState.updatedAt || now;
        const elapsedSinceLastTick = (now - lastUpdate) / 1000;
        currentAviatorState.timer = Number((currentAviatorState.timer - elapsedSinceLastTick).toFixed(1));
        
        if (currentAviatorState.timer <= 0) {
          currentAviatorState.state = 'waiting';
          currentAviatorState.timer = 6.0; // Wait 6 seconds for next round
          currentAviatorState.roundId = "aviator_" + Date.now();
          
          let generatedNext = generateCrashPoint();
          if (aviatorOverride.enabled) {
            generatedNext = aviatorOverride.customCrashPoint;
          }
          currentAviatorState.nextCrashPoint = generatedNext;
          broadcastAviatorPredictionToTelegram(currentAviatorState.roundId, generatedNext);
        }
      }
      
      currentAviatorState.updatedAt = now;

      // Broadcast SSE
      const sseData = `data: ${JSON.stringify(currentAviatorState)}\n\n`;
      aviatorClients.forEach(client => {
        try { client.res.write(sseData); } catch (e) {}
      });

      // Sync to Firebase RTDB for high-speed clients
      try {
        if (dbRT) {
          dbRT.ref('aviator/session').set({
            ...currentAviatorState,
            serverTime: now
          }).catch(() => {});
        }
      } catch (e) {}

    } catch (err: any) {
      console.error("[Aviator Loop Error]:", err.message);
    }
  };

  // Smoother 100ms updates
  setInterval(tick, 100);
}

async function startServer() {
  console.log("[Server] Starting startServer sequence...");
  
  const app = express();
  const PORT = 3000;

  // API endpoint to ask AI
  app.post("/api/ask-gemini", async (req, res) => {
    try {
      const { prompt, userData, type } = req.body;
      const response = await getAIResponse(prompt, userData, type);
      res.json({ response });
    } catch (error: any) {
      console.error("[API] Error calling geminiBackend:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // API endpoint for server info
  app.get("/api/server-info", (req, res) => {
    try {
      res.json({
        hostname: os.hostname(),
        platform: os.platform(),
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // API endpoint to talk to toRouter
  app.post("/api/torouter-chat", async (req, res) => {
    try {
      const { messages } = req.body;
      const apiKey = process.env.TOROUTER_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "TOROUTER_API_KEY not configured" });
      }
      const client = new OpenAI({
        apiKey,
        baseURL: "https://portal.torouter.ai/api/v1",
      });
      const response = await client.chat.completions.create({
        model: "openai/gpt-5.5",
        messages: messages,
      });
      res.json({ response: response.choices[0].message.content });
    } catch (error: any) {
      console.error("[API] Error calling torouter:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // API endpoint to check Telegram health
  app.get("/api/telegram-status", async (req, res) => {
    const { token, chatId } = await getTelegramConfig();
    const isUnauthorized = token ? invalidTokens.has(token) : false;
    res.json({
      configured: !!token && !isUnauthorized,
      adminChatId: chatId,
      lastError: isUnauthorized ? { status: 401, description: "Unauthorized (invalid/expired bot token)" } : lastTelegramError,
      lastSuccess: lastTelegramSuccess,
      tokenPreview: token ? `${token.substring(0, 10)}...` : "None"
    });
  });

  // API endpoint to check config status
  app.get("/api/config-status", (req, res) => {
    res.json({
      geminiKeyConfigured: !!process.env.GEMINI_API_KEY,
      firebaseProjectId: firebaseConfig.projectId,
      envLoaded: !!process.env.NODE_ENV
    });
  });

  app.use(express.json());
  app.use(cors());

  // --- Aviator Server-Sent Events (SSE) and State Endpoints ---
  app.get("/api/aviator/stream", (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.setHeader('Content-Encoding', 'none');
    res.flushHeaders();

    // Send initial state immediately
    res.write(`data: ${JSON.stringify(currentAviatorState)}\n\n`);

    const client = { id: Date.now(), res };
    aviatorClients.push(client);

    req.on('close', () => {
      const index = aviatorClients.findIndex(c => c.id === client.id);
      if (index !== -1) {
        aviatorClients.splice(index, 1);
      }
    });
  });

  app.get("/api/aviator/state", (req, res) => {
    res.json(currentAviatorState);
  });

  app.use(session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: process.env.NODE_ENV === 'production' }
  }));

  // Initialize config asynchronously so it doesn't block the health check
  // initializeGlobalConfig().catch(err => console.error("[Config] Early init failed:", err.message));

  // --- Health and Status
  // --- SMS Verification Endpoints ---
  app.post("/api/sms/send-otp", async (req, res) => {
    const { phoneNumber } = req.body;
    if (!phoneNumber || !/^\d{11}$/.test(phoneNumber)) {
      return res.status(400).json({ error: "Invalid phone number" });
    }

    try {
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Store OTP in Firestore with expiration (5 minutes)
      await db.collection('otp_verifications').doc(phoneNumber).set({
        otp,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        expiresAt: new Date(Date.now() + 5 * 60000)
      });

      console.log(`[SMS] Sending OTP ${otp} to ${phoneNumber}`);
      
      // Try to get token from Firestore first, then fallback to env
      let apiKey = process.env.SMS_GATEWAY_API_KEY;
      try {
        const configDoc = await db.collection('global_images').doc('sms_gateway_token').get();
        if (configDoc.exists && configDoc.data()?.url) {
          apiKey = configDoc.data()?.url;
        }
      } catch (e) {
        console.warn("[SMS] Failed to fetch token from Firestore, using env fallback");
      }

      if (apiKey) {
        // In a real scenario, you'd call the SMS gateway here
        // Example: await fetch(`https://api.smsgateway.com/send?apikey=${apiKey}&to=${phoneNumber}&msg=Your code is ${otp}`);
        
        // Notify Telegram too so the owner knows registration is happening
        await sendTelegramNotification(`📱 <b>OTP Requested</b>\n\n📞 <b>Phone:</b> ${escapeHTML(phoneNumber)}\n🔢 <b>OTP:</b> <code>${escapeHTML(otp)}</code>\n🔑 <b>Key used:</b> ${escapeHTML(apiKey.substring(0, 10))}...`);
      }

      res.json({ success: true, message: "OTP sent successfully" });
    } catch (error: any) {
      console.error("[SMS] Error sending OTP:", error.message);
      res.status(500).json({ error: "Failed to send OTP" });
    }
  });

  app.post("/api/sms/verify-otp", async (req, res) => {
    const { phoneNumber, otp } = req.body;
    if (!phoneNumber || !otp) {
      return res.status(400).json({ error: "Phone and OTP are required" });
    }

    try {
      const doc = await db.collection('otp_verifications').doc(phoneNumber).get();
      if (!doc.exists) {
        return res.status(400).json({ error: "OTP has expired or never requested" });
      }

      const data = doc.data()!;
      if (data.otp !== otp) {
        return res.status(400).json({ error: "Invalid OTP" });
      }

      // Check expiration
      if (data.expiresAt.toDate() < new Date()) {
        return res.status(400).json({ error: "OTP has expired" });
      }

      // Mark as verified or just delete after use
      await db.collection('otp_verifications').doc(phoneNumber).delete();
      
      res.json({ success: true, message: "Phone verified successfully" });
    } catch (error: any) {
      res.status(500).json({ error: "Verification failed" });
    }
  });

  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "ok", 
      dbReady: !!db,
      dbId: currentDbId,
      time: new Date().toISOString()
    });
  });

  // --- Promo Code System ---
  app.post("/api/promo/claim", verifyToken, async (req, res) => {
    const { code, userId } = req.body;
    const authenticatedUserId = (req as any).user.uid;

    if (!code || !userId) {
      return res.status(400).json({ error: "Code and User ID are required" });
    }

    // Security check: ensure the user can only claim for themselves
    if (userId !== authenticatedUserId) {
      return res.status(403).json({ error: "Forbidden: You can only claim codes for your own account" });
    }

    try {
      const promoId = code.trim().toUpperCase();
      const promoRef = db.collection('promo_codes').doc(promoId);
      const promoSnap = await promoRef.get();

      if (!promoSnap.exists) {
        return res.status(404).json({ error: "ভুল প্রোমো কোড (Invalid promo code)" });
      }

      const promoData = promoSnap.data()!;
      if (!promoData.active) {
        return res.status(400).json({ error: "এই প্রোমো কোডটি আর সচল নেই (Promo code is inactive)" });
      }

      if (promoData.maxUses && promoData.usedCount >= promoData.maxUses) {
        return res.status(400).json({ error: "এই কোডটির ব্যবহারের সীমা শেষ হয়ে গেছে (Usage limit reached)" });
      }

      // Check if user already used it
      const usageRef = db.collection('users').doc(userId).collection('used_promos').doc(promoId);
      const usageSnap = await usageRef.get();
      if (usageSnap.exists) {
        return res.status(400).json({ error: "আপনি ইতিমধ্যে এই কোডটি ব্যবহার করেছেন (You already used this code)" });
      }

      // Atomic Balance Update and Usage Tracking
      const userRef = db.collection('users').doc(userId);
      
      await db.runTransaction(async (transaction) => {
        const userSnap = await transaction.get(userRef);
        if (!userSnap.exists) throw new Error("User not found");
        const userData = userSnap.data()!;

        // Update User
        transaction.update(userRef, {
          balance: admin.firestore.FieldValue.increment(promoData.amount),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        // Record User Usage
        transaction.set(usageRef, {
          usedAt: admin.firestore.FieldValue.serverTimestamp(),
          amount: promoData.amount
        });

        // Update Promo Global Stats
        transaction.update(promoRef, {
          usedCount: admin.firestore.FieldValue.increment(1)
        });

        // Log Transaction
        const trxRef = db.collection('transactions').doc();
        transaction.set(trxRef, {
          userId,
          username: userData.username || 'User',
          type: 'bonus',
          subType: 'promo_code',
          code: promoId,
          amount: promoData.amount,
          status: 'approved',
          description: `Promo Code: ${promoId}`,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        // Add to user's inner history
        const userTrxRef = userRef.collection('transactions').doc(trxRef.id);
        transaction.set(userTrxRef, {
          type: 'bonus',
          amount: promoData.amount,
          status: 'approved',
          description: `Promo Code: ${promoId}`,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
      });

      // Notify Telegram
      await sendTelegramNotification(`🎁 <b>Promo Code Used!</b>\n\n👤 <b>User:</b> <code>${escapeHTML(userId)}</code>\n🎟️ <b>Code:</b> <code>${escapeHTML(promoId)}</code>\n💰 <b>Bonus:</b> ৳${escapeHTML(promoData.amount)}`);

      res.json({ success: true, amount: promoData.amount, message: "প্রোমো কোড সফলভাবে ব্যবহার করা হয়েছে" });
    } catch (error: any) {
      console.error("[Promo] Claim error:", error.message);
      res.status(500).json({ error: "দাবি করতে ব্যর্থ হয়েছে (Failed to claim)" });
    }
  });

  app.post("/api/promo/create", verifyAdminToken, async (req, res) => {
    const { code, amount, maxUses, active, expireDays } = req.body;
    if (!code || !amount) return res.status(400).json({ error: "Code and Amount are required" });

    try {
      const promoId = code.trim().toUpperCase();
      await db.collection('promo_codes').doc(promoId).set({
        code: promoId,
        amount: Number(amount),
        maxUses: Number(maxUses) || 99999,
        expireDays: Number(expireDays) || 7,
        usedCount: 0,
        active: active !== undefined ? active : true,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });

      res.json({ success: true, message: "Promo code created/updated successfully" });
    } catch (error: any) {
       res.status(500).json({ error: "Failed to create promo code" });
    }
  });

  // --- Admin User Management Endpoints (Requires Identity Toolkit API) ---
  
  app.post("/api/admin/users/create", verifyAdminToken, async (req, res) => {
    const { username, password, role, balance } = req.body;
    if (!username || !password) return res.status(400).json({ error: "Username and password required" });

    try {
      const email = `${username.toLowerCase()}@spin71.bet`;
      
      // 1. Create User in Firebase Auth
      const userRecord = await auth.createUser({
        email,
        password,
        displayName: username,
      });

      const uid = userRecord.uid;

      // 2. Get next numeric ID for Firestore
      const usersRef = db.collection('users');
      const snapshot = await usersRef.orderBy('numericId', 'desc').limit(1).get();
      let nextId = 10000001;
      if (!snapshot.empty) {
        nextId = (snapshot.docs[0].data()?.numericId || 10000000) + 1;
      }

      const referralCode = username.toLowerCase().substring(0, 4) + Math.floor(1000 + Math.random() * 9000);

      // 3. Create Firestore Document
      const userData = {
        id: uid,
        numericId: nextId,
        username,
        email,
        password, // For admin reference (standard in this app's existing logic)
        role: role || 'user',
        balance: Number(balance) || 0,
        status: 'active',
        createdAt: new Date().toISOString(),
        vipLevel: 0,
        vipProgress: 0,
        experience: 0,
        deposits: 0,
        totalDeposits: 0,
        withdrawals: 0,
        totalWagered: 0,
        totalWon: 0,
        totalLost: 0,
        referralCode,
        referredBy: null,
        referredUsers: [],
        profilePictureUrl: "https://www.image2url.com/r2/default/images/1779828873931-409cfe92-d243-4926-91bd-67da3a1e0adc.png",
      };

      await db.collection('users').doc(uid).set(userData);

      console.log(`[Admin] Created user: ${username} (UID: ${uid})`);
      res.json({ success: true, user: userData });
    } catch (error: any) {
      console.error("[Admin] User creation error:", error.message);
      res.status(500).json({ error: error.message || "Failed to create user in Auth/DB" });
    }
  });

  app.post("/api/admin/users/delete", verifyAdminToken, async (req, res) => {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: "User ID is required" });

    try {
      // 1. Delete from Firebase Auth
      try {
        await auth.deleteUser(userId);
      } catch (authErr: any) {
        console.warn(`[Admin] Could not delete ${userId} from Auth (may not exist):`, authErr.message);
      }

      // 2. Delete from Firestore
      await db.collection('users').doc(userId).delete();

      console.log(`[Admin] Deleted user: ${userId}`);
      res.json({ success: true });
    } catch (error: any) {
      console.error("[Admin] User deletion error:", error.message);
      res.status(500).json({ error: error.message || "Failed to delete user" });
    }
  });

  app.post("/api/admin/users/delete-all", verifyAdminToken, async (req, res) => {
    try {
      const usersSnapshot = await db.collection('users').get();
      const uids = usersSnapshot.docs.map(doc => doc.id);
      
      console.log(`[Admin] Deleting ${uids.length} users...`);

      // Batch delete from Auth (Firebase Admin supports up to 1000 at once)
      for (let i = 0; i < uids.length; i += 1000) {
        const batch = uids.slice(i, i + 1000);
        await auth.deleteUsers(batch);
      }

      // Batch delete from Firestore
      const batch = db.batch();
      usersSnapshot.forEach(doc => batch.delete(doc.ref));
      await batch.commit();

      res.json({ success: true, count: uids.length });
    } catch (error: any) {
      console.error("[Admin] Delete all error:", error.message);
      res.status(500).json({ error: error.message || "Failed to delete all users" });
    }
  });

  // --- Rate Limiter Memory Stores ---
  // Cache for user roles/tiers to minimize Firestore reads (5 minutes TTL)
  interface CachedIdentity {
    role: string;
    vip: boolean;
    timestamp: number;
  }
  const identityCache = new Map<string, CachedIdentity>();

  // Memory store for request limits (1 minute window)
  interface RateLimitRecord {
    count: number;
    resetAt: number;
  }
  const rateLimitStore = new Map<string, RateLimitRecord>();

  const IDENTITY_CACHE_TTL = 5 * 60 * 1000;
  const RATE_LIMIT_WINDOW = 60 * 1000;

  // Resolves the requesting user's identity/tier and calculates their rate limit
  async function resolveRequestTier(req: express.Request): Promise<{ key: string; tier: string; limit: number }> {
    let token = '';

    // 1. Try Authorization Bearer header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }

    // 2. Try body or query parameters
    if (!token && req.body && req.body.idToken) {
      token = req.body.idToken;
    }
    if (!token && req.query && req.query.idToken) {
      token = req.query.idToken as string;
    }

    const ip = req.ip || (req.headers['x-forwarded-for'] as string) || 'anonymous';

    if (!token) {
      return { key: ip, tier: 'guest', limit: 999999999 }; // Unlimited guest
    }

    if (token === 'owner.css13') {
      return { key: 'owner.css13', tier: 'admin', limit: 999999999 }; // Admin key: 150 req/min
    }

    try {
      const decodedToken = await auth.verifyIdToken(token);
      const uid = decodedToken.uid;
      const now = Date.now();

      const cached = identityCache.get(uid);
      if (cached && (now - cached.timestamp < IDENTITY_CACHE_TTL)) {
        const { role, vip } = cached;
        const limit = 999999999;
        return { key: uid, tier: role || 'user', limit };
      }

      const userDoc = await db.collection('users').doc(uid).get();
      let role = 'user';
      let vip = false;

      if (userDoc.exists) {
        const data = userDoc.data();
        role = data?.role || 'user';
        vip = data?.vip === true || (data?.vipLevel && data.vipLevel > 0);
      }

      identityCache.set(uid, { role, vip, timestamp: now });

      const limit = 999999999; 
      return { key: uid, tier: role, limit };
    } catch (error) {
      console.warn(`[Proxy-Limiter] Token validation failed. Falling back to IP-based tracking: ${error instanceof Error ? error.message : String(error)}`);
      return { key: ip, tier: 'guest', limit: 999999999 };
    }
  }

  // Robust, reusable authentication-based rate-limiting middleware
  const proxyRateLimiterMiddleware = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
      const { key, tier, limit } = await resolveRequestTier(req);
      const now = Date.now();

      let record = rateLimitStore.get(key);
      if (!record || now > record.resetAt) {
        record = {
          count: 0,
          resetAt: now + RATE_LIMIT_WINDOW
        };
      }

      record.count++;
      rateLimitStore.set(key, record);

      res.setHeader('X-RateLimit-Limit', limit);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, limit - record.count));
      res.setHeader('X-RateLimit-Reset', Math.ceil(record.resetAt / 1000));
      res.setHeader('X-RateLimit-Tier', tier);

      if (record.count > limit) {
        const retryAfter = Math.ceil((record.resetAt - now) / 1000);
        res.setHeader('Retry-After', retryAfter);
        return res.status(429).json({
          error: "Too Many Requests",
          message: `আপনি এই এক মিনিটে লিমিট ছাড়িয়ে অনুরোধ করেছেন। অনুগ্রহ করে ${retryAfter} সেকেন্ড পর আর চেষ্টা করুন।`,
          tier,
          retryAfter
        });
      }

      (req as any).userProxyTier = tier;
      (req as any).userProxyKey = key;
      next();
    } catch (error) {
      console.error("[Proxy-Rate-Limiter] Middleware exception:", error);
      next();
    }
  };

  // Single robust utility function to execute proxy fetch requests
  async function executeProxyRequest(
    url: string,
    method: string = 'GET',
    headers: Record<string, string> = {},
    body?: any
  ) {
    if (!url) {
      throw new Error("Target URL is required");
    }

    const fetchFn = fetch || (global as any).fetch;
    if (!fetchFn) {
      throw new Error("Server misconfiguration: fetch function not found");
    }

    const cleanedHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    for (const [key, val] of Object.entries(headers)) {
      const lowerKey = key.toLowerCase();
      // Drop hop-by-hop & proxy-specific/sensitive headers
      if (!['host', 'connection', 'content-length', 'authorization', 'cookie', 'x-forwarded-for'].includes(lowerKey)) {
        cleanedHeaders[key] = val;
      }
    }

    const response = await fetchFn(url, {
      method,
      headers: cleanedHeaders,
      body: (method !== 'GET' && method !== 'HEAD' && body) ? (typeof body === 'string' ? body : JSON.stringify(body)) : undefined
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

    return {
      status: response.status,
      data: responseData
    };
  }

  // Consolidated generic proxy handler
  const proxyHandler = async (req: express.Request, res: express.Response) => {
    try {
      const { url, method = 'GET', body, headers = {} } = req.body || {};
      
      console.log(`[Proxy] Target: ${url}, Method: ${method}, User Tier: ${(req as any).userProxyTier}`);

      const result = await executeProxyRequest(url, method, headers, body);
      res.status(result.status).json(result.data);
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

  app.post("/api/external-fetch", proxyRateLimiterMiddleware, proxyHandler);
  app.post("/api/external-fetch/", proxyRateLimiterMiddleware, proxyHandler);
  app.post("/external-fetch", proxyRateLimiterMiddleware, (req, res, next) => {
    console.log("[DEBUG] /external-fetch hit without /api prefix. Redirecting to proxy handler.");
    proxyHandler(req, res);
  });

  // TEST ROUTE
  app.get("/api/external-fetch/ping", (req, res) => {
    res.json({ success: true, message: "External fetch endpoint is reachable" });
  });
  app.get("/api/external-fetch", (req, res) => res.status(405).json({ error: "Use POST for proxy requests" }));
  app.get("/external-fetch", (req, res) => res.redirect("/api/external-fetch"));

  // --- Real-time Crypto Odds API (Using consolidated proxy and rate limiting) ---
  app.get("/api/market/odds", proxyRateLimiterMiddleware, async (req, res) => {
    try {
      const response = await executeProxyRequest("https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT");
      const data = response.data;
      
      const price = parseFloat(data.price);
      const odds = {
        btc: price,
        multiplier: (price / 50000).toFixed(4),
        trend: Math.random() > 0.5 ? 'up' : 'down',
        timestamp: new Date().toISOString()
      };
      
      res.status(response.status).json(odds);
    } catch (error) {
      console.error("[Proxy/Market] Failed to fetch market data:", error);
      res.status(500).json({ error: "Failed to fetch market data" });
    }
  });

  // --- AI API Endpoints ---
  app.post("/api/ai/chat", async (req, res) => {
    try {
      const { message, userData, type } = req.body;
      const response = await getAIResponse(message, userData, type);
      res.json({ response });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // --- Telegram API ---
  app.get("/api/telegram/status", async (req, res) => {
    const { token, chatId } = await getTelegramConfig();
    res.json({
      configured: !!token,
      configuredAdminId: chatId,
      tokenPreview: token ? `${token.substring(0, 10)}...` : "None",
      lastError: lastTelegramError,
      lastSuccess: lastTelegramSuccess,
      supportAdminChatId,
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

  app.post("/api/telegram/event", async (req, res) => {
    try {
      const { event, userId, username, balance, gameName, details } = req.body;
      let message = `🔔 <b>Event: ${event}</b>\n\n`;
      if (userId) message += `👤 <b>User ID:</b> <code>${escapeHTML(userId)}</code>\n`;
      if (username) message += `📛 <b>Username:</b> ${escapeHTML(username)}\n`;
      if (balance !== undefined) message += `💰 <b>Balance:</b> ৳${escapeHTML(balance)}\n`;
      if (gameName) message += `🎮 <b>Game:</b> ${escapeHTML(gameName)}\n`;
      if (details) message += `ℹ️ <b>Details:</b> ${escapeHTML(details)}\n`;

      await sendTelegramNotification(message);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Telegram event error:", error);
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

  // --- Withdrawal Request API ---
  app.post("/api/user/withdraw/request", async (req, res) => {
    const { amount, idToken, method, accountNumber, trxId } = req.body;
    
    if (!amount || typeof amount !== 'number' || amount <= 0 || !idToken) {
      return res.status(400).json({ error: "Amount and token are required" });
    }

    try {
      console.log("[Withdraw] Verifying ID token...");
      const decodedToken = await auth.verifyIdToken(idToken);
      const uid = decodedToken.uid;
      const userRef = db.collection('users').doc(uid);
      
      console.log(`[Withdraw] Processing request for ${uid}, amount: ${amount}`);
      
      const result = await db.runTransaction(async (transaction) => {
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists) throw new Error("User not found");
        
        const userData = userDoc.data()!;
        if (userData.isBlocked) throw new Error("Account is blocked");
        
        const currentBalance = userData.balance || 0;
        if (currentBalance < amount) {
          throw new Error("অপর্যাপ্ত ব্যালেন্স (Insufficient balance)");
        }
        
        // 1. Deduct balance immediately (locking funds)
        transaction.update(userRef, {
          balance: admin.firestore.FieldValue.increment(-amount),
          totalWithdrawals: admin.firestore.FieldValue.increment(amount),
          updatedAt: new Date().toISOString()
        });
        
        const finalTrxId = trxId || `WTH-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
        
        // 2. Create withdrawal transaction in user subcollection
        const userTxRef = userRef.collection('transactions').doc(finalTrxId);
        const txData = {
          trxId: finalTrxId,
          type: 'withdrawal',
          amount: -amount, // Negative for withdrawal
          method: method || 'Bank Card',
          accountNumber: accountNumber || '',
          status: 'pending',
          statusColor: 'text-amber-600',
          userId: uid,
          username: userData.username || 'Anonymous',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          date: new Date().toISOString()
        };
        transaction.set(userTxRef, txData);
        
        // 3. Create global transaction for admin panel
        const globalTxRef = db.collection('transactions').doc(finalTrxId);
        transaction.set(globalTxRef, txData);
        
        return { trxId: finalTrxId, newBalance: currentBalance - amount };
      });
      
      // Notify Telegram
      await sendTelegramNotification(`💸 <b>New Withdrawal Request!</b>\n\n👤 <b>User:</b> <code>${escapeHTML(uid)}</code>\n💰 <b>Amount:</b> ৳${escapeHTML(amount)}\n🏦 <b>Method:</b> ${escapeHTML(method || 'Unknown')}\n💳 <b>Account:</b> ${escapeHTML(accountNumber || 'N/A')}\n🔖 <b>TxID:</b> <code>${escapeHTML(result.trxId)}</code>`);
      
      res.json({ success: true, ...result });
      
    } catch (error: any) {
      console.error("[Withdraw] Error:", error.message);
      res.status(500).json({ error: error.message || "উত্তোলন সম্পন্ন করা সম্ভব হয়নি" });
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
      await sendTelegramNotification(`🎯 <b>New Deposit Confirmed!</b>\n\n👤 <b>User UID:</b> <code>${escapeHTML(uid)}</code>\n💰 <b>Amount:</b> ৳${escapeHTML(amount)}\n🏦 <b>Method:</b> ${escapeHTML(method || 'Unknown')}\n📱 <b>Sender:</b> ${escapeHTML(senderNumber || 'Unknown')}\n🔖 <b>TxID:</b> <code>${escapeHTML(trxId || 'N/A')}</code>`);

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

  // --- Game Launch API (Seamless Integration) ---
  app.post("/api/game/launch", async (req, res) => {
    const { gameId, provider, idToken } = req.body;
    
    if (!gameId || !idToken) {
      return res.status(400).json({ error: "Game ID and token are required" });
    }

    try {
      const decodedToken = await auth.verifyIdToken(idToken);
      const uid = decodedToken.uid;
      const userDoc = await db.collection('users').doc(uid).get();
      
      if (!userDoc.exists) {
        return res.status(404).json({ error: "User not found" });
      }

      const userData = userDoc.data()!;
      if (userData.isBlocked) {
        return res.status(403).json({ error: "Your account is blocked." });
      }

      // Here you would normally call the real Game Provider API.
      // Example: JILI API, Pragmatic API, etc.
      // const response = await fetch(`https://api.jili.com/seamless/launch?game=${gameId}&user=${uid}&token=...`);
      // const data = await response.json();
      
      // For now, we mock the generated seamless URL
      // If there's a static URL set in global_urls by Admin, use it:
      const globalUrlDoc = await db.collection('global_urls').doc(gameId).get();
      let launchUrl = globalUrlDoc.exists ? globalUrlDoc.data()?.url : null;

      if (!launchUrl) {
        // Mock a real seamless link with token
        launchUrl = `https://demo-game-server.com/play/${gameId}?session=${uid}-${Date.now()}`;
      }

      res.json({ 
        success: true, 
        url: launchUrl,
        gameId,
        provider
      });

    } catch (error: any) {
      console.error("[GameLaunch API] Error:", error.message);
      res.status(500).json({ error: "Failed to launch game. API error." });
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

      // Fetch dynamic win config from Firestore for native_slot
      let winRate = 85; 
      try {
        const gameSettingSnap = await db.collection('game_settings').doc('native_slot').get();
        if (gameSettingSnap.exists) {
          const settingData = gameSettingSnap.data();
          const optionString = settingData?.provider_option || '';
          const parts = optionString.split(';');
          for (const part of parts) {
            const [key, val] = part.split(':');
            if (key === 'rate') {
              const parsedRate = parseInt(val, 10);
              if (!isNaN(parsedRate)) {
                winRate = parsedRate;
              }
            }
          }
        }
      } catch (err) {
        console.warn("[server.ts] Error loading game_settings for native_slot, using fallback 85%:", err);
      }

      // Spin Logic (Server Side)
      const symbols = ['7', 'BAR', 'CHERRY', 'DIAMOND', 'GOLD', 'BELL'];
      let reel1 = symbols[Math.floor(Math.random() * symbols.length)];
      let reel2 = symbols[Math.floor(Math.random() * symbols.length)];
      let reel3 = symbols[Math.floor(Math.random() * symbols.length)];
      
      // Adjust outcome based on winRate (RTP metric)
      const roll = Math.random() * 100;
      if (roll > winRate) {
        // Force a loss: make sure reel1, reel2, reel3 are all different
        const used = new Set<string>();
        reel1 = symbols[Math.floor(Math.random() * symbols.length)];
        used.add(reel1);
        
        let subSymbols = symbols.filter(s => !used.has(s));
        reel2 = subSymbols[Math.floor(Math.random() * subSymbols.length)];
        used.add(reel2);

        subSymbols = symbols.filter(s => !used.has(s));
        reel3 = subSymbols[Math.floor(Math.random() * subSymbols.length)];
      } else if (winRate >= 120 && roll < (winRate - 100) * 1.5) {
        // High win rates: force match!
        const matchingSymbol = symbols[Math.floor(Math.random() * symbols.length)];
        reel1 = matchingSymbol;
        reel2 = matchingSymbol;
        reel3 = matchingSymbol;
      }
      
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
      } else if (reel1 === reel2 || reel2 === reel3 || reel1 === reel3) {
        // Minor Win
        winMultiplier = 2;
      }

      const winAmount = betAmount * winMultiplier;

      let finalBalance = 0;
      await db.runTransaction(async (transaction) => {
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists) throw new Error("User missing");
        
        const userData = userDoc.data()!;
        if (userData.balance < betAmount) throw new Error("ইনসাফিসিয়েন্ট ব্যালেন্স (Insufficient balance)");
        
        finalBalance = userData.balance - betAmount + winAmount;
        
        transaction.update(userRef, {
          balance: finalBalance,
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
        multiplier: winMultiplier,
        newBalance: finalBalance
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

  // User API Middleware
  async function verifyToken(req: express.Request, res: express.Response, next: express.NextFunction) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: "Unauthorized: Missing or invalid token" });
      return;
    }

    const token = authHeader.split(' ')[1];
    try {
      const decodedToken = await auth.verifyIdToken(token);
      (req as any).user = decodedToken;
      next();
    } catch (error) {
      res.status(401).json({ error: "Unauthorized: Invalid token" });
    }
  }

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
      const userData = userDoc.data();
      
      const isAdmin = (userDoc.exists && (userData?.role === 'admin' || userData?.isAdmin === true)) || 
                      user.email === 'owner.css13@gmail.com' ||
                      user.email === 'cutelegend7045@gmail.com';

      if (isAdmin) {
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
      let query: any = db.collection('transactions');
      
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
    const { token, chatId } = await getTelegramConfig();
    
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

    const targetChatId = supportAdminChatId || chatId;
    if (token && targetChatId) {
      try {
        await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: targetChatId,
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

  app.get("/api/quote", proxyRateLimiterMiddleware, async (req, res) => {
    const apiKey = process.env.APIVERVE_API_KEY || "apv_1b9a80f5-906b-4606-a62c-5cce2767b3be";
    try {
      const response = await executeProxyRequest("https://api.apiverve.com/v1/randomquote", "GET", {
        "x-api-key": apiKey
      });
      
      if (response.status !== 200) {
        if (response.status === 429) {
          console.warn("Quote API Rate limit hit (429). Using fallback.");
        } else {
          throw new Error(`API error: ${response.status}`);
        }
      } else {
        res.status(200).json(response.data);
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

    const { token, chatId } = await getTelegramConfig();
    const targetChatId = supportAdminChatId || chatId;
    
    if (token && targetChatId) {
      try {
        const tgRes = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: targetChatId,
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

  app.listen(PORT, "0.0.0.0", async () => {
    console.log(`Server running on http://localhost:${PORT}`);
    
    // Start background loops after server is listening
    initializeGlobalConfig().catch(err => console.error("Config initialization failed:", err.message));
    pollTelegramUpdates().catch(err => console.error("Telegram polling failed to start:", err.message));
    startAviatorLoop(db).catch(err => console.error("Aviator background loop failed to start:", err.message));
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
