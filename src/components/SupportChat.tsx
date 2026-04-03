import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, X, MessageCircle, User, Loader2, Trash2 } from 'lucide-react';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { sendMessage, clearChatHistory } from '../services/firebaseService';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'agent';
  time: string;
  timestamp?: any;
}

export default function SupportChat({ isOpen, onClose, userData }: { isOpen: boolean, onClose: () => void, userData?: any }) {
  const [chatHistory, setChatHistory] = useState<Message[]>([]);
  const [chatMessage, setChatMessage] = useState("");
  const [isUserTyping, setIsUserTyping] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Fetch chat history from server
  useEffect(() => {
    if (!userData?.id || !isOpen) return;
    
    const path = `users/${userData.id}/chat`;
    const q = query(collection(db, path), orderBy('timestamp', 'asc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messages: Message[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        let timeString = "";
        if (data.timestamp) {
          const date = data.timestamp.toDate();
          timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
        messages.push({
          id: doc.id,
          text: data.text,
          sender: data.sender,
          time: timeString,
          timestamp: data.timestamp
        });
      });
      setChatHistory(messages);
    }, (error) => {
      console.error("Failed to fetch chat:", error);
    });

    return () => unsubscribe();
  }, [userData?.id, isOpen]);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim() || !userData?.id) return;

    const text = chatMessage.trim();
    setChatMessage("");
    setChatError(null);

    try {
      await sendMessage(userData.id, text, 'user');
      
      // Simulate agent response
      setTimeout(async () => {
        await sendMessage(userData.id, "ধন্যবাদ আপনার মেসেজের জন্য। আমাদের একজন এজেন্ট শীঘ্রই আপনার সাথে যোগাযোগ করবে। (Thank you for your message. An agent will contact you shortly.)", 'agent');
      }, 2000);
      
    } catch (err) {
      setChatError(err instanceof Error ? err.message : "মেসেজ পাঠানো সম্ভব হয়নি।");
    }
  };

  const clearChat = async () => {
    if (window.confirm("আপনি কি নিশ্চিত যে আপনি চ্যাট হিস্ট্রি মুছে ফেলতে চান?")) {
      if (userData?.id) {
        await clearChatHistory(userData.id);
      }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex flex-col max-w-md mx-auto"
        >
          {/* Header */}
          <div className="bg-teal-900 p-4 flex items-center justify-between border-b border-teal-800">
            <div className="flex items-center gap-2">
              <button 
                onClick={onClose}
                className="p-2 text-white hover:bg-teal-800 rounded-full transition-colors"
              >
                <X size={24} />
              </button>
              <button 
                onClick={clearChat}
                className="p-2 text-teal-400 hover:bg-teal-800 rounded-full transition-colors"
                title="Clear Chat"
              >
                <Trash2 size={20} />
              </button>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <h3 className="text-white font-bold text-sm">সাপোর্ট চ্যাট (Support)</h3>
                <div className="flex items-center justify-end gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                  <span className="text-teal-300 text-[10px] uppercase tracking-widest">অনলাইন</span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-full bg-teal-800 flex items-center justify-center border border-teal-700">
                <MessageCircle className="text-teal-400" size={20} />
              </div>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#0a2a22]">
            {chatHistory.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-4 px-8">
                <div className="w-16 h-16 rounded-full bg-teal-900/50 flex items-center justify-center border border-teal-800">
                  <MessageCircle className="text-teal-500 opacity-50" size={32} />
                </div>
                <p className="text-teal-400 text-sm">অ্যাডমিনের সাথে কথা বলতে নিচে মেসেজ লিখুন। আমরা সাধারণত কয়েক মিনিটের মধ্যে উত্তর দিই।</p>
              </div>
            )}
            
            {chatHistory.map((msg) => (
              <div 
                key={msg.id} 
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex gap-2 max-w-[85%] ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-[10px] font-bold ${msg.sender === 'user' ? 'bg-yellow-500 text-black' : 'bg-teal-700 text-white'}`}>
                    {msg.sender === 'user' ? <User size={14} /> : 'A'}
                  </div>
                  <div className="flex flex-col">
                    <div className={`p-3 rounded-2xl text-sm shadow-sm ${
                      msg.sender === 'user' 
                        ? 'bg-yellow-500 text-black rounded-tr-none' 
                        : 'bg-teal-800 text-white rounded-tl-none border border-teal-700'
                    }`}>
                      {msg.text}
                    </div>
                    <span className={`text-[9px] mt-1 opacity-50 ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}>
                      {msg.time}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            
            {isUserTyping && (
              <div className="flex justify-end">
                <div className="bg-yellow-500/20 text-yellow-500 text-[10px] px-2 py-1 rounded-full animate-pulse">
                  আপনি লিখছেন...
                </div>
              </div>
            )}
            
            {chatError && (
              <div className="p-2 bg-red-900/30 border border-red-800 rounded-lg text-red-400 text-xs text-center">
                {chatError}
              </div>
            )}
            
            <div ref={chatEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 bg-teal-950 border-t border-teal-800">
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <input
                type="text"
                value={chatMessage}
                onChange={(e) => {
                  setChatMessage(e.target.value);
                  setIsUserTyping(e.target.value.length > 0);
                }}
                placeholder="মেসেজ লিখুন..."
                className="flex-1 bg-teal-900 border border-teal-700 rounded-full px-4 py-2 text-white text-sm focus:outline-none focus:border-yellow-500 transition-colors"
              />
              <button
                type="submit"
                disabled={!chatMessage.trim()}
                className="w-10 h-10 rounded-full bg-yellow-500 text-black flex items-center justify-center disabled:opacity-50 disabled:bg-teal-800 disabled:text-teal-600 transition-all active:scale-95"
              >
                <Send size={18} />
              </button>
            </form>
            <p className="text-[10px] text-teal-500 mt-2 text-center">
              টেলিগ্রামের মাধ্যমে সরাসরি যোগাযোগ করুন: <a href="https://t.me/spin71bet_official" target="_blank" rel="noreferrer" className="text-yellow-500 underline">@spin71bet_official</a>
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
