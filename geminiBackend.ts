import { GoogleGenAI } from "@google/genai";

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

export const getAIResponse = async (message: string, userData?: any, type: 'support' | 'assistant' = 'support') => {
  if (!ai) {
    throw new Error("AI service is not configured on this server. Please check your GEMINI_API_KEY.");
  }

  const systemInstruction = type === 'assistant' 
    ? `You are the Official AI Assistant of SPIN71 BET Casino. 
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
    : `You are the AI Support Bot for Spin71 Casino. 
User Info: ${JSON.stringify(userData || {})}
Help users with their queries about games, deposits, and withdrawals.
Always reply in Bengali. Be friendly and encouraging.
Our official Telegram is @spin71bet_official.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash", 
      contents: message,
      config: {
        systemInstruction: systemInstruction,
      },
    });
    return response.text;
  } catch (error) {
    console.error("AI Support Error:", error);
    throw error;
  }
};
