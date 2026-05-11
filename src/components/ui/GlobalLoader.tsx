import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Crown, SkipForward } from 'lucide-react';

interface GlobalLoaderProps {
  message?: string;
  subMessage?: string;
  type?: 'initial' | 'data' | 'transition';
  onSkip?: () => void;
}

export default function GlobalLoader({ 
  message = "SPIN71BET", 
  subMessage = "PREPARING YOUR PREMIUM EXPERIENCE", 
  type = 'initial',
  onSkip
}: GlobalLoaderProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) return 100;
        const inc = Math.random() * 8;
        return Math.min(prev + inc, 100);
      });
    }, 150);

    return () => {
      clearInterval(timer);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[2000] bg-gradient-to-b from-[#25ab5e] to-[#0c6b32] flex flex-col items-center justify-between p-6 text-center overflow-hidden">
      {/* Background Decor */}
      <div 
        className="absolute inset-0 opacity-10 pointer-events-none" 
        style={{ 
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', 
          backgroundSize: '20px 20px' 
        }}
      ></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-400/20 rounded-full blur-[80px] pointer-events-none"></div>

      {/* Top Header */}
      <div className="w-full flex justify-between items-start relative z-20 mt-4">
        <div className="flex-1 flex justify-center relative">
          <div className="relative">
            <h1 className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-yellow-600 drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)] tracking-tighter italic">
              {message}
            </h1>
            <div className="absolute -top-3 -left-4 bg-red-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded shadow-lg transform -rotate-12">REAL</div>
          </div>
        </div>
        
        {/* Skip Button */}
        {onSkip && (
          <button 
            onClick={onSkip}
            className="absolute right-0 top-0 bg-black/40 hover:bg-black/60 text-white/90 text-[10px] font-bold px-4 py-1.5 rounded-full border border-white/10 transition-colors z-50 flex items-center gap-1 backdrop-blur-md"
          >
            SKIP
          </button>
        )}
      </div>

      {/* Center Artwork - Logo Placeholder */}
      <div className="relative z-10 flex-1 flex items-center justify-center w-full">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", bounce: 0.5 }}
          className="relative w-64 h-64 flex items-center justify-center"
        >
          {/* PLACEHOLDER FOR LOGO - User should upload logo.png to public/ folder */}
          <img src="/logo.png" alt="SPIN71.bet Logo" className="w-full h-auto" onError={(e) => {
             e.currentTarget.style.display = 'none';
             // Fallback text if image not found
             const fallback = document.createElement('div');
             fallback.className = "text-4xl font-black text-yellow-300";
             fallback.innerText = "SPIN71.BET";
             e.currentTarget.parentNode?.appendChild(fallback);
          }} />
        </motion.div>
      </div>

      {/* Loading Progress Section */}
      <div className="w-full max-w-xs relative z-20 pb-8">
        {/* Slider Thumb */}
        <div className="relative h-1 bg-yellow-500/20 rounded-full mb-4">
          <motion.div 
            className="absolute top-0 left-0 h-full bg-yellow-400 rounded-full"
            style={{ width: `${progress}%` }}
          />
          <motion.div 
            className="absolute top-1/2 -mt-2.5 w-5 h-5 bg-yellow-400 rounded-full border-2 border-white shadow-[0_0_10px_rgba(250,204,21,0.5)]"
            style={{ left: `calc(${progress}% - 10px)` }}
          />
        </div>

        <div className="flex flex-col items-center gap-1">
          <div className="flex items-center gap-2">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-yellow-400 animate-spin">
              <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
            </svg>
            <span className="text-yellow-400/90 text-[10px] font-bold tracking-[0.2em]">লোডিং হচ্ছে... (LOADING...)</span>
          </div>
          <span className="text-teal-900/60 font-black text-[9px] uppercase tracking-widest bg-black/20 px-3 py-1 rounded-full text-center mt-1 text-white/50">{subMessage}</span>
        </div>
      </div>
    </div>
  );
}

