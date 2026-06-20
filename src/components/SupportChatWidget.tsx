import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MessageSquare, 
  Send, 
  X, 
  Minimize2, 
  Maximize2, 
  Headset, 
  CheckCircle2, 
  Smile, 
  Paperclip,
  Image as ImageIcon,
  Loader2,
  Clock,
  ShieldCheck,
  Dot
} from 'lucide-react';

interface Message {
  id: string;
  sender: 'user' | 'agent';
  text: string;
  timestamp: string;
  status: 'sent' | 'read';
}

export default function SupportChatWidget({ userData }: { userData: any }) {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(1);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'agent',
      text: `স্বাগতম ${userData?.username || 'User'}! আমি SPIN71 সাপোর্ট এজেন্ট। আপনাকে কীভাবে সাহায্য করতে পারি?`,
      timestamp: new Date().toISOString(),
      status: 'read'
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0);
    }
  }, [isOpen]);

  const handleSend = () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Math.random().toString(36).substr(2, 9),
      sender: 'user',
      text: inputValue,
      timestamp: new Date().toISOString(),
      status: 'sent'
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    
    // Simulate agent typing
    setTimeout(() => {
      setIsTyping(true);
      setTimeout(() => {
        const agentResponse: Message = {
          id: Math.random().toString(36).substr(2, 9),
          sender: 'agent',
          text: "আপনার মেসেজটি আমাদের সাপোর্ট টিমের কাছে পৌঁছেছে। অনুগ্রহ করে লাইনে থাকুন, একজন এজেন্ট আপনার সাথে শীঘ্রই যুক্ত হবেন।",
          timestamp: new Date().toISOString(),
          status: 'read'
        };
        setIsTyping(false);
        setMessages(prev => [...prev, agentResponse]);
        if (!isOpen) {
          setUnreadCount(prev => prev + 1);
        }
      }, 2000);
    }, 1000);
  };

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <motion.button
          initial={{ scale: 0, rotate: -45 }}
          animate={{ scale: 1, rotate: 0 }}
          onClick={() => setIsOpen(true)}
          className="fixed bottom-24 right-6 z-[200] w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white shadow-2xl shadow-blue-500/40 border-2 border-white/20 active:scale-95 transition-all"
        >
          <MessageSquare size={24} className="drop-shadow-lg" />
          {unreadCount > 0 && (
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-black italic">
              {unreadCount}
            </div>
          )}
        </motion.button>
      )}

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.8 }}
            className="fixed bottom-6 right-6 z-[300] w-[calc(100vw-48px)] max-w-[380px] h-[550px] bg-white rounded-[40px] shadow-[0_32px_64px_rgba(0,0,0,0.2)] flex flex-col overflow-hidden border border-gray-100"
          >
            {/* Header */}
            <div className="bg-gray-900 p-6 flex items-center justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
              <div className="flex items-center gap-4 relative z-10">
                <div className="relative">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center border-2 border-blue-500 shadow-lg">
                    <Headset size={24} className="text-blue-500" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-gray-900 shadow-sm flex items-center justify-center">
                    <Dot className="text-white animate-pulse" size={12} />
                  </div>
                </div>
                <div>
                  <h4 className="text-white font-black italic text-lg tracking-tighter leading-none">লাইভ সাপোর্ট</h4>
                  <div className="flex items-center gap-1.5 mt-1">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                    <p className="text-[10px] text-green-400 font-black uppercase tracking-widest">অনলাইন (Online)</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 relative z-10">
                <button onClick={() => setIsOpen(false)} className="p-2.5 bg-white/10 rounded-xl text-white hover:bg-red-500 transition-all">
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Safety Bar */}
            <div className="bg-yellow-50 px-6 py-2 border-b border-yellow-100 flex items-center justify-center gap-2">
              <ShieldCheck size={12} className="text-yellow-600" />
              <span className="text-[9px] font-black text-yellow-700 uppercase tracking-widest italic">End-to-End Encrypted Support</span>
            </div>

            {/* Messages Area */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50 scroll-smooth">
              <div className="text-center pb-4">
                <span className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] bg-white px-4 py-1.5 rounded-full border border-gray-100">Today</span>
              </div>

              {messages.map((msg) => (
                <div key={msg.id} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className={`max-w-[85%] px-5 py-4 rounded-[24px] text-sm font-medium shadow-sm ${
                    msg.sender === 'user' 
                      ? 'bg-blue-600 text-white rounded-tr-none shadow-blue-500/10' 
                      : 'bg-white text-gray-800 rounded-tl-none border border-gray-100'
                  }`}>
                    {msg.text}
                  </div>
                  <div className="flex items-center gap-2 mt-1.5 px-1">
                    <span className="text-[9px] font-bold text-gray-400">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    {msg.sender === 'user' && (
                       <CheckCircle2 size={10} className={msg.status === 'read' ? 'text-blue-500' : 'text-gray-300'} />
                    )}
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex items-start gap-4">
                  <div className="bg-white border border-gray-100 px-5 py-3 rounded-2xl rounded-tl-none">
                    <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="p-6 bg-white border-t border-gray-100 pb-8">
              <div className="flex items-center gap-3 bg-gray-50 p-2 rounded-[32px] border border-gray-100 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/5 transition-all">
                <button className="p-2 text-gray-400 hover:text-blue-500 transition-colors">
                  <Smile size={20} />
                </button>
                <input 
                  type="text" 
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="আপনার মেসেজ লিখুন..."
                  className="flex-1 bg-transparent text-sm font-medium text-gray-900 focus:outline-none placeholder:text-gray-400"
                />
                <button className="p-2 text-gray-400 hover:text-blue-500 transition-colors">
                  <Paperclip size={20} />
                </button>
                <button 
                  onClick={handleSend}
                  disabled={!inputValue.trim()}
                  className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20 disabled:opacity-50 transition-all active:scale-90"
                >
                  <Send size={18} />
                </button>
              </div>
              <div className="flex justify-center mt-4">
                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">SPIN71 AI Verified Assistant</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
