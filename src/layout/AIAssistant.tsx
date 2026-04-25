import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bot, Send, X, Sparkles, MessageCircle, User, Loader2, Zap, Brain, Info, History } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  time: string;
}

export default function AIAssistant({ 
  isOpen, 
  onClose, 
  userData 
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  userData?: any 
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{
        id: '1',
        text: `হ্যালো ${userData?.username || 'প্লেয়ার'}! আমি আপনার Spin71 AI অ্যাসিস্ট্যান্ট। আমি আপনাকে গেমের নিয়ম, ডিপোজিট বা যে কোনো সমস্যায় সাহায্য করতে পারি। আপনি কি আজ কোনো লাকি প্রেডিকশন চান?`,
        sender: 'ai',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    }
    scrollToBottom();
  }, [isOpen, messages.length]);

  useEffect(scrollToBottom, [messages]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userText = input.trim();
    setInput("");
    
    const userMsg: Message = {
      id: Date.now().toString(),
      text: userText,
      sender: 'user',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: userText,
        config: {
          systemInstruction: `You are the Official AI Assistant of SPIN71 BET Casino. 
          Your name is SPIN71 AI.
          User Info: ${JSON.stringify(userData || {})}
          Status: Online.
          Current Time: ${new Date().toLocaleString()}
          
          Guidelines:
          1. Always reply in Bengali.
          2. Be professional, friendly, and helpful.
          3. If the user asks for predictions, give them "Smart Tips" based on probability (e.g., "Aviator-এ ২.০x এ ক্যাশআউট করা নিরাপদ হতে পারে"). 
          4. Encourage responsible gaming.
          5. If asked about deposits, mention Nagad and Bkash are the fastest.
          6. Keep responses concise and engaging.
          7. Use emojis to make the chat lively.`,
        },
      });

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: response.text || "দুঃখিত, আমি এই মুহূর্তে উত্তর দিতে পারছি না।",
        sender: 'ai',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      console.error("AI Error:", error);
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: "আমার সার্ভারে সংযোগ করতে সমস্যা হচ্ছে। অনুগ্রহ করে কিছুক্ষণ পর চেষ্টা করুন।",
        sender: 'ai',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const suggestions = [
    "আজকের লাকি গেম কোনটি?",
    "ডিপোজিট করার নিয়ম কী?",
    "এভিয়েটর গেমের টিপস দিন",
    "আমার ব্যালেন্স কত?"
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[250]"
          />

          {/* Assistant Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed bottom-4 right-4 left-4 md:left-auto md:right-6 md:bottom-6 w-auto md:w-[400px] h-[600px] max-h-[85vh] bg-[#0c1a1a] border border-teal-500/30 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-[260] flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-teal-900 to-[#0c1a1a] p-4 flex items-center justify-between border-b border-teal-500/20">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-teal-500/20 flex items-center justify-center border border-teal-400">
                    <Bot className="text-teal-400" size={24} />
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-[#0c1a1a]"></div>
                </div>
                <div>
                  <h3 className="text-white font-black text-sm uppercase tracking-tighter italic">Spin71 AI Assistant</h3>
                  <p className="text-teal-400 text-[10px] uppercase font-bold flex items-center gap-1">
                    <Zap size={10} className="fill-teal-400" /> কৃত্তিম বুদ্ধিমত্তা সচল
                  </p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 text-teal-500 hover:bg-teal-500/10 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Chat Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
              {messages.map((msg) => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={msg.id}
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex gap-2 max-w-[85%] ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center ${msg.sender === 'user' ? 'bg-yellow-500 text-black' : 'bg-teal-700 text-white'}`}>
                      {msg.sender === 'user' ? <User size={14} /> : <Bot size={14} />}
                    </div>
                    <div className="flex flex-col">
                      <div className={`p-3 rounded-2xl text-sm leading-relaxed ${
                        msg.sender === 'user' 
                          ? 'bg-yellow-500 text-black rounded-tr-none' 
                          : 'bg-[#152e2e] text-white rounded-tl-none border border-teal-500/20'
                      }`}>
                        {msg.text}
                      </div>
                      <span className={`text-[9px] mt-1 opacity-50 text-[var(--text-muted)] ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}>
                        {msg.time}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="flex gap-2">
                    <div className="w-8 h-8 rounded-full bg-teal-700 text-white flex items-center justify-center">
                      <Bot size={14} />
                    </div>
                    <div className="bg-[#152e2e] p-3 rounded-2xl rounded-tl-none border border-teal-500/20">
                      <Loader2 size={16} className="text-teal-400 animate-spin" />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Suggestions Bar */}
            <div className="px-4 pb-2">
              <div className="flex gap-2 overflow-x-auto no-scrollbar py-2">
                {suggestions.map((sh, idx) => (
                  <button 
                    key={idx}
                    onClick={() => {
                      setInput(sh);
                    }}
                    className="shrink-0 px-3 py-1.5 bg-[#152e2e] border border-teal-500/10 rounded-full text-[10px] text-teal-400 hover:bg-teal-500/10 transition-colors"
                  >
                    {sh}
                  </button>
                ))}
              </div>
            </div>

            {/* Input Footer */}
            <div className="p-4 bg-teal-950/50 border-t border-teal-500/10">
              <form onSubmit={handleSend} className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="AI-কে কিছু জিজ্ঞাসা করুন..."
                  className="flex-1 bg-[#0c1a1a] border border-teal-500/30 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-teal-400 transition-all placeholder:text-teal-900"
                />
                <button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className="w-10 h-10 rounded-xl bg-teal-500 text-black flex items-center justify-center disabled:opacity-30 transition-all hover:scale-105 active:scale-95"
                >
                  <Send size={18} />
                </button>
              </form>
              <p className="text-[9px] text-center text-teal-700 mt-2">
                Spin71 AI ভুল করতে পারে। লজিক যাচাই করে খেলুন।
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
