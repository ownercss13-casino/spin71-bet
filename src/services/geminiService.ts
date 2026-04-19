import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

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
        Our official Telegram is @spin71bet_official.`,
      },
    });
    return response.text;
  } catch (error) {
    console.error("AI Support Error:", error);
    return "দুঃখিত, আমি এখন উত্তর দিতে পারছি না। অনুগ্রহ করে কিছুক্ষণ পর চেষ্টা করুন।";
  }
};

export const processAdminCommand = async (prompt: string) => {
  return "অ্যাডমিন কমান্ড এই মুহূর্তে নিষ্ক্রিয় রয়েছে (Firebase Disconnected).";
};
