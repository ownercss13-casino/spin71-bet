import { GoogleGenAI } from "@google/genai";

export async function generateAviatorLogos() {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const model = 'gemini-2.5-flash-image';
  
  const prompts = [
    "A professional gaming logo for 'Aviator', featuring a sleek red propeller plane, bold yellow typography, dark background, high quality, vector style.",
    "A minimalist modern logo for 'Aviator' game, red stylized airplane icon, gold accents, luxury betting app style, white background.",
    "A dynamic 3D logo for 'Aviator', a red jet taking off, glowing trails, metallic finish, 'AVIATOR' text in bold futuristic font."
  ];

  const results = [];
  for (const prompt of prompts) {
    const response = await ai.models.generateContent({
      model: model,
      contents: { parts: [{ text: prompt }] },
      config: {
        imageConfig: { aspectRatio: "1:1" }
      }
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        results.push(`data:image/png;base64,${part.inlineData.data}`);
      }
    }
  }
  return results;
}
