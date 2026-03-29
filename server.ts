import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "8657727956:AAGjuy8q4KCG00Is62-qsuD7W_XW5rIEjNw";
let adminChatId: string | null = "7354725295";

const chatHistory: any[] = [
  { id: 1, text: "স্বাগতম! আমরা আপনাকে কীভাবে সাহায্য করতে পারি?", sender: 'agent', time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) }
];

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
            adminChatId = update.message.chat.id.toString();
            
            chatHistory.push({
              id: Date.now() + Math.random(),
              text: update.message.text,
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
      vipProgress: 75
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
    res.json(chatHistory);
  });

  app.post("/api/chat", async (req, res) => {
    const { text } = req.body;
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
    chatHistory.push(userMsg);

    if (adminChatId) {
      try {
        await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: adminChatId,
            text: `User: ${text}`
          })
        });
      } catch (err) {
        console.error("Failed to send to Telegram:", err);
      }
    } else {
      console.warn("No admin chat ID found. Please send a message to the bot first.");
      chatHistory.push({
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
