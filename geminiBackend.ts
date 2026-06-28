import { GoogleGenAI } from "@google/genai";
import { OpenAI } from "openai";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.warn("[geminiBackend] GEMINI_API_KEY is missing in process.env!");
}

const ai = GEMINI_API_KEY ? new GoogleGenAI({ 
  apiKey: GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
}) : null;

// Initialize OpenAI client with key provided by environment
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const openaiClient = new OpenAI({
  apiKey: OPENAI_API_KEY || "missing_key"
});

export const getAIResponse = async (message: string, userData?: any, type: 'support' | 'assistant' = 'support') => {
  const systemInstruction = type === 'assistant' 
    ? `You are the Official AI Assistant of SPIN71 BET✨ Casino. 
Your name is SPIN71 AI.
User Info: ${JSON.stringify(userData || {})}
Status: Online.
Current Time: ${new Date().toLocaleString()}

Guidelines:
1. Always reply in Bengali.
2. Be professional, friendly, and helpful.
3. If the user asks for predictions, give them "Smart Tips" based on probability (e.g., "Rocket-এ ২.০x এ ক্যাশআউট করা নিরাপদ হতে পারে"). 
4. Encourage responsible gaming.
5. If asked about deposits, mention Nagad and Bkash are the fastest.
6. Keep responses concise and engaging.
7. Use emojis to make the chat lively.`
    : `You are the AI Support Bot for SPIN71 BET✨ Casino. 
User Info: ${JSON.stringify(userData || {})}
Help users with their queries about games, deposits, and withdrawals.
Always reply in Bengali. Be friendly and encouraging.
Our official Telegram is @Spin71bot.`;

  try {
    let retries = 0;
    const maxRetries = 3;
    
    while (true) {
      try {
        if (!ai) {
          throw new Error("Gemini AI is not configured.");
        }
        const response = await ai.models.generateContent({
          model: "gemini-3.5-flash", 
          contents: message,
          config: {
            systemInstruction: systemInstruction,
          },
        });
        return response.text;
      } catch (error: any) {
        const isRateLimit = error.message && (error.message.includes("429") || error.status === 429 || error.message.includes("RESOURCE_EXHAUSTED") || error.status === "RESOURCE_EXHAUSTED");
        
        if (isRateLimit) {
          console.warn(`[geminiBackend] Rate limit hit (429) on Gemini API. Attempting OpenAI/ChatGPT fallback...`);
          try {
            const openaiResponse = await openaiClient.chat.completions.create({
              model: "gpt-4o-mini",
              messages: [
                { role: "system", content: systemInstruction },
                { role: "user", content: message }
              ]
            });
            const text = openaiResponse.choices[0]?.message?.content;
            if (text) {
              console.log("[geminiBackend] Successfully generated fallback response using OpenAI (gpt-4o-mini).");
              return text;
            }
          } catch (openaiErr: any) {
            console.error("[geminiBackend] OpenAI fallback attempt failed:", openaiErr.message || openaiErr);
          }

          if (retries < maxRetries) {
            retries++;
            const delay = Math.pow(2, retries) * 3000; // 6s, 12s, 24s
            console.warn(`[geminiBackend] Retrying Gemini after delay of ${delay}ms... (Attempt ${retries}/${maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
        }
        throw error;
      }
    }
  } catch (error: any) {
    console.warn("[geminiBackend] Gemini API failed. Attempting final OpenAI fallback...", error.message || error);
    try {
      const openaiResponse = await openaiClient.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemInstruction },
          { role: "user", content: message }
        ]
      });
      const text = openaiResponse.choices[0]?.message?.content;
      if (text) {
        return text;
      }
    } catch (openaiErr: any) {
      console.error("[geminiBackend] Final OpenAI fallback failed as well:", openaiErr.message || openaiErr);
    }
    console.error("AI Support Error (fallback triggered):", error);
    return "সম্মানিত গ্রাহক, বর্তমানে আমাদের এআই (AI) সিস্টেম অত্যন্ত ব্যস্ত আছে। তবে আপনার একাউন্ট ব্যালেন্স ও ট্রানজেকশন সম্পূর্ণ নিরাপদ রয়েছে। যেকোনো জরুরি প্রশ্ন বা জমা/উত্তোলনের জন্য দয়া করে আমাদের লাইভ কাস্টমার সাপোর্ট বা অফিশিয়াল টেলিগ্রাম @Spin71bot এ যোগাযোগ করুন। ধন্যবাদ!";
  }
};
