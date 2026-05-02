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

      {/* Center Artwork */}
      <div className="relative z-10 flex-1 flex items-center justify-center w-full">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", bounce: 0.5 }}
          className="relative w-64 h-64"
        >
          {/* Circular Orbit Lines */}
          <div className="absolute inset-0 border border-white/20 rounded-full"></div>
          <div className="absolute inset-4 border border-white/10 rounded-full"></div>
          
          {/* Floating Orange Circle */}
          <motion.div 
            animate={{ y: [-10, 10, -10] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-8 -left-4 w-6 h-6 bg-yellow-400 rounded-full border-2 border-yellow-200 shadow-[0_0_15px_rgba(250,204,21,0.5)]"
          ></motion.div>

          {/* Floating Coin Right */}
          <motion.div 
            animate={{ y: [10, -10, 10] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-16 -right-6 w-14 h-14 bg-gradient-to-br from-yellow-300 to-yellow-600 rounded-full border-2 border-yellow-200 shadow-xl flex items-center justify-center transform rotate-12"
          >
            <div className="w-8 h-8 rounded-full border-2 border-yellow-200/50 flex items-center justify-center">
              <span className="text-yellow-100 font-bold text-xs">ক</span>
            </div>
          </motion.div>

          {/* Airplane floating top right */}
          <motion.div
            animate={{ x: [0, -10, 0], y: [0, -10, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-1/4 -right-2 text-yellow-800/80 transform rotate-45"
          >
            <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor">
              <path d="M21,16V14L13,9V3.5C13,2.67 12.33,2 11.5,2C10.67,2 10,2.67 10,3.5V9L2,14V16L10,13.5V19L8,20.5V22L11.5,21L15,22V20.5L13,19V13.5L21,16Z" />
            </svg>
          </motion.div>

          {/* Center Crown */}
          <div className="absolute inset-x-0 bottom-16 flex justify-center z-20">
            <div className="relative">
              <svg width="120" height="100" viewBox="0 0 100 100" className="drop-shadow-2xl">
                {/* Crown Base */}
                <path d="M10,80 L90,80 L80,90 L20,90 Z" fill="url(#crownGradient)" />
                {/* Left Spike */}
                <path d="M10,80 L0,40 L25,65 Z" fill="url(#redGradient)" stroke="#FFD700" strokeWidth="2" />
                <circle cx="0" cy="35" r="5" fill="#FFF" stroke="#FFD700" strokeWidth="2" />
                {/* Center Spike */}
                <path d="M25,65 L50,10 L75,65 Z" fill="url(#redGradient)" stroke="#FFD700" strokeWidth="3" />
                <circle cx="50" cy="5" r="7" fill="#FFF" stroke="#FFD700" strokeWidth="2" />
                {/* Right Spike */}
                <path d="M75,65 L100,40 L90,80 Z" fill="url(#redGradient)" stroke="#FFD700" strokeWidth="2" />
                <circle cx="100" cy="35" r="5" fill="#FFF" stroke="#FFD700" strokeWidth="2" />

                <defs>
                  <linearGradient id="crownGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FFD700" />
                    <stop offset="100%" stopColor="#B8860B" />
                  </linearGradient>
                  <linearGradient id="redGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ef4444" />
                    <stop offset="100%" stopColor="#991b1b" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>

          {/* Cards Left */}
          <motion.div 
            animate={{ rotate: [-10, -5, -10] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-16 left-0 w-20 h-28 bg-[#FFF9C4] rounded border border-[#FFD54F] shadow-2xl flex flex-col items-center justify-center transform -rotate-12 z-20"
          >
            <span className="text-red-600 font-black text-xl tracking-tighter">WILD</span>
            <div className="w-8 h-8 bg-red-600 transform rotate-45 mt-2"></div>
            <div className="absolute top-1 left-1 text-[8px] font-bold text-red-600">A</div>
            <div className="absolute bottom-1 right-1 text-[8px] font-bold text-red-600 transform rotate-180">A</div>
          </motion.div>

          {/* Coins Base */}
          <div className="absolute -bottom-4 inset-x-0 flex justify-center z-10">
            <div className="flex gap-1 relative">
              {[...Array(3)].map((_, i) => (
                <div key={i} className={`relative flex flex-col items-center ${i === 1 ? 'z-20 -translate-y-2' : 'z-10'} ${i === 0 ? '-translate-x-2' : ''} ${i === 2 ? 'translate-x-2' : ''}`}>
                  <div className="w-16 h-6 rounded-[100%] bg-yellow-400 border border-yellow-200 mt-[-8px]"></div>
                  <div className="w-16 h-6 rounded-[100%] bg-yellow-500 border border-yellow-300 mt-[-20px]"></div>
                  <div className="w-16 h-6 rounded-[100%] bg-yellow-600 border border-yellow-400 mt-[-20px]"></div>
                </div>
              ))}
            </div>
          </div>

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

