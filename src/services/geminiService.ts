export const getAIResponse = async (message: string, userData?: any, type: 'support' | 'assistant' = 'support') => {
  try {
    const response = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, userData, type }),
    });
    
    if (!response.ok) throw new Error("Failed to fetch AI response");
    
    const data = await response.json();
    return data.response;
  } catch (error) {
    console.error("AI Support Error:", error);
    return "দুঃখিত, আমি এখন উত্তর দিতে পারছি না। অনুগ্রহ করে কিছুক্ষণ পর চেষ্টা করুন।";
  }
};
