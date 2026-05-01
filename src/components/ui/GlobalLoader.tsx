import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2, Crown, Sparkles, Shield, Zap, TrendingUp, Trophy } from 'lucide-react';

interface GlobalLoaderProps {
  message?: string;
  subMessage?: string;
  type?: 'initial' | 'data' | 'transition';
}

export default function GlobalLoader({ 
  message = "লোড হচ্ছে...", 
  subMessage = "আপনার অভিজ্ঞতা প্রস্তুত করা হচ্ছে", 
  type = 'initial' 
}: GlobalLoaderProps) {
  const [progress, setProgress] = useState(0);
  const [statusIndex, setStatusIndex] = useState(0);

  const statuses = [
    "সার্ভারের সাথে সংযোগ করা হচ্ছে...",
    "নিরাপত্তা যাচাই করা হচ্ছে...",
    "ডাটাবেস লোড হচ্ছে...",
    "গ্রাফিক্স অপ্টিমাইজ করা হচ্ছে...",
    "সবকিছু প্রস্তুত!"
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) return 100;
        const inc = Math.random() * 15;
        return Math.min(prev + inc, 100);
      });
    }, 400);

    const statusTimer = setInterval(() => {
      setStatusIndex(prev => (prev + 1) % statuses.length);
    }, 1200);

    return () => {
      clearInterval(timer);
      clearInterval(statusTimer);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[2000] bg-[#050505] flex flex-col items-center justify-center p-6 text-center overflow-hidden">
      {/* Dynamic Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-teal-500/5 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-yellow-500/5 rounded-full blur-[100px] animate-bounce" style={{ animationDuration: '4s' }}></div>
        
        {/* Animated Grid */}
        <div 
          className="absolute inset-0 opacity-[0.03]" 
          style={{ 
            backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', 
            backgroundSize: '40px 40px' 
          }}
        ></div>
      </div>

      <div className="relative z-10 flex flex-col items-center">
        {/* Animated Logo Container */}
        <div className="relative mb-12 group">
          <motion.div
            animate={{ 
              rotate: [0, 360],
              scale: [1, 1.2, 1]
            }}
            transition={{ 
              rotate: { duration: 25, repeat: Infinity, ease: "linear" },
              scale: { duration: 5, repeat: Infinity, ease: "easeInOut" }
            }}
            className="absolute -inset-24 border border-teal-500/10 rounded-full"
          ></motion.div>
          
          <motion.div
            animate={{ 
              rotate: [360, 0],
              scale: [1, 1.1, 1]
            }}
            transition={{ 
              rotate: { duration: 20, repeat: Infinity, ease: "linear" },
              scale: { duration: 4, repeat: Infinity, ease: "easeInOut" }
            }}
            className="absolute -inset-16 border-2 border-dashed border-yellow-500/5 rounded-full"
          ></motion.div>

          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-40 h-40 rounded-[3rem] bg-gradient-to-br from-gray-900 to-black border-2 border-yellow-500/40 flex items-center justify-center shadow-[0_0_80px_rgba(234,179,8,0.3)] relative overflow-hidden"
          >
            {/* Shimmer on Box */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent -translate-x-full animate-[shimmer_3s_infinite]"></div>
            
            <div className="relative z-10">
              <Crown size={64} className="text-yellow-500 drop-shadow-[0_0_20px_rgba(234,179,8,0.6)]" />
              <motion.div
                animate={{ opacity: [0, 1, 0], scale: [0.5, 1.5, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute -top-6 -right-6"
              >
                <Sparkles size={28} className="text-yellow-200 fill-yellow-200" />
              </motion.div>
            </div>
          </motion.div>
          
          {/* Outer Orbiting Items */}
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              animate={{ rotate: 360 }}
              transition={{ duration: 10 + i * 5, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 pointer-events-none"
            >
              <motion.div 
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute top-0 left-1/2 -ml-2 w-4 h-4 bg-yellow-500/20 blur-sm rounded-full"
              />
            </motion.div>
          ))}
        </div>

        {/* Text Area */}
        <div className="flex flex-col items-center mb-8">
          <motion.h2 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-3xl font-black text-white mb-2 tracking-tighter uppercase italic"
          >
            {message}
          </motion.h2>
          <motion.p 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-yellow-500/60 text-xs font-bold uppercase tracking-[0.4em]"
          >
            {subMessage}
          </motion.p>
        </div>

        {/* Progress Bar Container */}
        <div className="w-64">
          <div className="flex justify-between items-end mb-2 px-1">
            <AnimatePresence mode="wait">
              <motion.span 
                key={statusIndex}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="text-[10px] text-white/40 font-bold uppercase tracking-widest"
              >
                {statuses[statusIndex]}
              </motion.span>
            </AnimatePresence>
            <span className="text-[10px] text-yellow-500 font-mono font-black">{Math.round(progress)}%</span>
          </div>
          
          <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5 p-[1px]">
            <motion.div 
              className="h-full bg-gradient-to-r from-yellow-600 via-yellow-400 to-yellow-200 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ type: "spring", bounce: 0, duration: 0.5 }}
            />
          </div>
        </div>

        {/* Dynamic Badges */}
        <div className="mt-16 flex gap-8 items-center opacity-40">
          <div className="flex flex-col items-center gap-1">
            <Shield size={16} className="text-teal-400" />
            <span className="text-[8px] font-black text-white uppercase tracking-tighter">SECURE</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <Zap size={16} className="text-yellow-400" />
            <span className="text-[8px] font-black text-white uppercase tracking-tighter">FAST</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <Trophy size={16} className="text-red-400" />
            <span className="text-[8px] font-black text-white uppercase tracking-tighter">WINNER</span>
          </div>
        </div>
      </div>
      
      {/* Decorative Gradient Overlays */}
      <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-[#050505] to-transparent"></div>
      <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-[#050505] to-transparent"></div>

      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}
