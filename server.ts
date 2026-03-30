import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "8657727956:AAGjuy8q4KCG00Is62-qsuD7W_XW5rIEjNw";
let adminChatId: string | null = process.env.TELEGRAM_ADMIN_CHAT_ID || "7354725295";

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

  app.get("/api/transactions", (req, res) => {
    res.json([
      { id: 'TRX-98234', type: 'deposit', amount: '+ ৳ 5,000', date: '2026-03-28 14:30', status: 'সফল', statusColor: 'text-green-400' },
      { id: 'TRX-98233', type: 'withdraw', amount: '- ৳ 12,000', date: '2026-03-27 09:15', status: 'সফল', statusColor: 'text-green-400' },
      { id: 'TRX-98232', type: 'bet', amount: '- ৳ 500', date: '2026-03-26 22:45', status: 'সম্পন্ন', statusColor: 'text-teal-300' },
      { id: 'TRX-98231', type: 'bonus', amount: '+ ৳ 1,000', date: '2026-03-25 10:00', status: 'সফল', statusColor: 'text-green-400' },
      { id: 'TRX-98230', type: 'deposit', amount: '+ ৳ 10,000', date: '2026-03-24 18:20', status: 'ব্যর্থ', statusColor: 'text-red-400' },
    ]);
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
