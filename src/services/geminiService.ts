import { GoogleGenerativeAI } from '@google/generative-ai'

const apiKey = import.meta.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY

const genAI = new GoogleGenerativeAI(apiKey!)

export const geminiService = {
  async generateBet(amount: number): Promise<string> {
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-pro' })
      const prompt = `Generate a random bet result for an amount of $${amount}. Should the bet win or lose? What is the multiplier? Respond in one sentence.`
      
      const result = await model.generateContent(prompt)
      const response = result.response
      const text = response.text()
      
      return text
    } catch (error) {
      throw new Error('Failed to generate bet result')
    }
  },

  async analyzeGame(gameData: any): Promise<string> {
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-pro' })
      const prompt = `Analyze this game data and provide insights: ${JSON.stringify(gameData)}`
      
      const result = await model.generateContent(prompt)
      const response = result.response
      const text = response.text()
      
      return text
    } catch (error) {
      throw new Error('Failed to analyze game')
    }
  },
}