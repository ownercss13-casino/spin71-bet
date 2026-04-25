import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Globe, Send, X, MessageSquare, User, ShieldCheck, Zap, Heart, MessageCircle } from 'lucide-react';

interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  text: string;
  time: string;
  isVIP?: boolean;
}

export default function GlobalChat({ 
  isOpen, 
  onClose, 
  userData 
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  userData?: any 
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    // Initial mock messages
    setMessages([
      { id: '1', userId: '101', username: 'Robin***', text: 'Aviator-এ ১০x পেলাম! ধন্যবাদ SPIN71', time: '10:05 AM', isVIP: true },
      { id: '2', userId: '102', username: 'Ashik***', text: 'ভাই বিডি পেমেন্ট কতক্ষণ লাগে?', time: '10:06 AM' },
      { id: '3', userId: '103', username: 'Admin', text: 'বিকাশ পেমেন্ট ৫-১০ মিনিট লাগে।', time: '10:07 AM', isVIP: true },
    ]);
  }, []);

  useEffect(scrollToBottom, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      userId: userData?.id || 'guest',
      username: (userData?.username || 'Guest').substring(0, 5) + '***',
      text: input.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isVIP: userData?.vipLevel > 0
    };

    setMessages(prev => [...prev, newMessage]);
    setInput("");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[200]"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 w-full md:w-80 h-full bg-[#061a1a] border-l border-teal-500/20 shadow-2xl z-[210] flex flex-col"
          >
            {/* Header */}
            <div className="p-4 bg-teal-950 border-b border-teal-500/20 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe className="text-teal-400 animate-pulse" size={20} />
                <h3 className="text-white font-black italic uppercase tracking-tighter">Global Chat</h3>
              </div>
              <button onClick={onClose} className="text-teal-500 p-1 hover:text-white">
                <X size={20} />
              </button>
            </div>

            {/* Online Status Bar */}
            <div className="px-4 py-2 bg-teal-900/30 flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-[10px] text-teal-300 font-bold uppercase">৮৪২ জন অনলাইনে আছেন</span>
            </div>

            {/* Chat List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
              {messages.map((msg) => (
                <motion.div 
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  key={msg.id}
                  className={`flex flex-col gap-1 ${msg.userId === userData?.id ? 'items-end' : 'items-start'}`}
                >
                  <div className="flex items-center gap-1.5 px-1">
                    <span className={`text-[10px] font-black ${msg.username === 'Admin' ? 'text-yellow-400' : 'text-teal-400'}`}>
                      {msg.username}
                    </span>
                    {msg.isVIP && <div className="w-3 h-3 bg-yellow-500 rounded-full flex items-center justify-center text-[7px] text-black"><Heart size={6} fill="black" /></div>}
                  </div>
                  <div className={`px-3 py-2 rounded-2xl max-w-[90%] text-xs shadow-sm ${
                    msg.userId === userData?.id 
                      ? 'bg-teal-600 text-white rounded-tr-none' 
                      : 'bg-[#152e2e] text-teal-100 rounded-tl-none border border-teal-500/10'
                  }`}>
                    {msg.text}
                  </div>
                  <span className="text-[8px] text-teal-800 px-1">{msg.time}</span>
                </motion.div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Reactions */}
            <div className="px-4 py-2 flex gap-2 overflow-x-auto no-scrollbar">
              {['🔥', '🚀', '😍', '💸', 'GG', 'Thanks!'].map((emoji) => (
                <button 
                  key={emoji}
                  onClick={() => {
                    setInput(input + emoji);
                  }}
                  className="shrink-0 w-8 h-8 rounded-lg bg-teal-900/50 flex items-center justify-center text-sm hover:bg-teal-500/20 transition-colors"
                >
                  {emoji}
                </button>
              ))}
            </div>

            {/* Input */}
            <div className="p-4 bg-teal-950/80 border-t border-teal-500/10">
              <form onSubmit={handleSend} className="flex gap-2">
                <input 
                  type="text" 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="সবাইকে কিছু বলুন..."
                  className="flex-1 bg-[#0c1a1a] border border-teal-500/30 rounded-xl px-4 py-2.5 text-white text-xs focus:outline-none focus:border-teal-400 transition-all placeholder:text-teal-900"
                />
                <button 
                  type="submit"
                  disabled={!input.trim()}
                  className="w-10 h-10 rounded-xl bg-teal-500 text-black flex items-center justify-center disabled:opacity-30 transition-all active:scale-95"
                >
                  <Send size={16} />
                </button>
              </form>
              <div className="mt-2 flex items-center justify-center gap-1">
                <ShieldCheck size={10} className="text-teal-700" />
                <span className="text-[8px] text-teal-700 uppercase font-black">নিরাপদ ও সুশৃঙ্খল চ্যাট বজায় রাখুন</span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
