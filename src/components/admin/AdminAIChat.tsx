import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bot, Send, X, Loader2, Sparkles, Terminal } from 'lucide-react';
import { processAdminCommand } from '../../services/geminiService';

interface Message {
  text: string;
  sender: 'user' | 'ai';
}

export default function AdminAIChat({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const [messages, setMessages] = useState<Message[]>([
    { text: "হ্যালো অ্যাডমিন! আমি আপনার AI অ্যাসিস্ট্যান্ট। আমি আপনাকে ইউজার ম্যানেজমেন্ট, ব্যালেন্স আপডেট এবং প্রোমো কোড তৈরিতে সাহায্য করতে পারি। আপনি কি করতে চান?", sender: 'ai' }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    setInput("");
    setMessages(prev => [...prev, { text: userMsg, sender: 'user' }]);
    setIsLoading(true);

    try {
      const response = await processAdminCommand(userMsg);
      setMessages(prev => [...prev, { text: response || "আমি দুঃখিত, আমি বুঝতে পারিনি।", sender: 'ai' }]);
    } catch (error) {
      setMessages(prev => [...prev, { text: "দুঃখিত, সার্ভারে সমস্যা হয়েছে।", sender: 'ai' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="w-full max-w-lg bg-[#0f172a] border border-teal-500/30 rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[600px]"
          >
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-teal-900 to-blue-900 border-b border-teal-500/20 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-500/20 flex items-center justify-center text-teal-400 border border-teal-500/30">
                  <Bot size={24} />
                </div>
                <div>
                  <h3 className="text-white font-bold">AI Admin Assistant</h3>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                    <span className="text-teal-400 text-[10px] uppercase font-bold tracking-widest">Ready to Control</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 text-teal-500 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-4 rounded-2xl text-sm ${
                    msg.sender === 'user' 
                      ? 'bg-teal-600 text-white rounded-tr-none' 
                      : 'bg-gray-800 text-teal-100 rounded-tl-none border border-teal-900/50'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-800 p-4 rounded-2xl rounded-tl-none border border-teal-900/50 flex items-center gap-2">
                    <Loader2 size={16} className="animate-spin text-teal-500" />
                    <span className="text-teal-400 text-xs italic">AI প্রসেস করছে...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-4 bg-gray-900/50 border-t border-teal-500/10">
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <input 
                    type="text" 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="e.g. 'Update balance of user123 by 500'"
                    className="w-full bg-gray-800 border border-teal-900/50 rounded-2xl px-4 py-3 text-white text-sm focus:outline-none focus:border-teal-500 transition-colors"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-teal-700">
                    <Terminal size={16} />
                  </div>
                </div>
                <button 
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className="w-12 h-12 rounded-2xl bg-teal-500 text-black flex items-center justify-center hover:bg-teal-400 transition-all active:scale-95 disabled:opacity-50"
                >
                  <Send size={20} />
                </button>
              </div>
              <div className="mt-3 flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                <button 
                  onClick={() => setInput("ইউজার 'user123' এর ব্যালেন্স ৫০০ বাড়িয়ে দাও")}
                  className="shrink-0 px-3 py-1.5 bg-teal-900/30 border border-teal-500/20 rounded-lg text-[10px] text-teal-400 hover:bg-teal-900/50 transition-colors"
                >
                  <Sparkles size={10} className="inline mr-1" /> ব্যালেন্স আপডেট
                </button>
                <button 
                  onClick={() => setInput("নতুন প্রোমো কোড 'AI100' তৈরি করো ১০০ টাকার জন্য")}
                  className="shrink-0 px-3 py-1.5 bg-teal-900/30 border border-teal-500/20 rounded-lg text-[10px] text-teal-400 hover:bg-teal-900/50 transition-colors"
                >
                  <Sparkles size={10} className="inline mr-1" /> প্রোমো কোড
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
