import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Loader2, AlertCircle, Sparkles, Shield, Cpu, Flame } from 'lucide-react';

interface GameLoaderProps {
  gameName?: string;
  provider?: string;
  logo?: string;
  hasError?: boolean;
  onClose?: () => void;
  onLoadComplete?: () => void;
}

export default function GameLoader({ 
  gameName, 
  provider, 
  logo, 
  hasError = false, 
  onClose, 
  onLoadComplete 
}: GameLoaderProps) {
  const [progress, setProgress] = useState(0);
  const [loadingText, setLoadingText] = useState('সিকিউর সার্ভার সংযোগ করা হচ্ছে...');

  const onLoadCompleteRef = useRef(onLoadComplete);
  onLoadCompleteRef.current = onLoadComplete;

  // Bengali dynamic tips to show high-tech premium feel
  useEffect(() => {
    if (progress < 25) {
      setLoadingText('সিকিউর সার্ভার সংযোগ করা হচ্ছে...');
    } else if (progress < 50) {
      setLoadingText('নিরাপত্তা এনক্রিপশন যাচাই করা হচ্ছে...');
    } else if (progress < 75) {
      setLoadingText('গেম রিসোর্স এবং ডিজাইন লোড হচ্ছে...');
    } else if (progress < 90) {
      setLoadingText('হাই-পারফরম্যান্স ইন্টারফেস প্রস্তুত করা হচ্ছে...');
    } else {
      setLoadingText('ইনস্ট্যান্ট সেশন লাইভ করা হচ্ছে...');
    }
  }, [progress]);

  useEffect(() => {
    if (hasError) {
      setProgress(100);
      return;
    }

    // High performance smooth dynamic duration
    const duration = 1400; // 1.4 seconds for beautiful appreciation of the polished animation
    const interval = 16;   // ~60fps updates
    const steps = duration / interval;
    const increment = 100 / steps;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          return 100;
        }
        // Add tiny variation for organic feeling
        const variation = Math.random() * 0.4 + 0.8;
        return Math.min(prev + (increment * variation), 100);
      });
    }, interval);

    const finishTimeout = setTimeout(() => {
      if (onLoadCompleteRef.current) {
        onLoadCompleteRef.current();
      }
    }, duration + 150);

    return () => {
      clearInterval(timer);
      clearTimeout(finishTimeout);
    };
  }, [hasError]);

  return (
    <div id="premium-game-loader" className="fixed inset-0 z-[1010] bg-[#090a0f] flex flex-col items-center justify-center p-6 overflow-hidden select-none">
      
      {/* Dynamic Ambient Background Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-yellow-500/10 rounded-full blur-[120px] pointer-events-none animate-pulse duration-[4000ms]" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-red-600/10 rounded-full blur-[120px] pointer-events-none animate-pulse duration-[3000ms]" />
      
      {/* Decorative Floating Matrix/Particles */}
      <div className="absolute inset-0 bg-[radial-gradient(#1a1d29_1px,transparent_1px)] [background-size:24px_24px] opacity-30 pointer-events-none" />

      <div className="relative flex flex-col items-center w-full max-w-[340px] text-center z-10">
        
        {/* Glowing Crest / Top Element */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8 relative"
        >
          {/* External golden rotating glow ring */}
          <div className="absolute -inset-4 rounded-full border border-yellow-500/10 animate-[spin_10s_linear_infinite]" />
          <div className="absolute -inset-4 rounded-full border-t-2 border-b-2 border-yellow-500/30 animate-[spin_3s_linear_infinite]" />
          
          <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-[#1b1e2c] to-[#0d0f17] border border-yellow-500/30 flex items-center justify-center shadow-[0_0_30px_rgba(234,179,8,0.15)] relative overflow-hidden group">
            {/* Moving flare light */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
            
            {logo ? (
              <img 
                src={logo} 
                alt={gameName || "Game Logo"} 
                className="w-16 h-16 object-contain rounded-xl drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)]"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            ) : (
              <Sparkles className="w-10 h-10 text-yellow-500 animate-pulse" />
            )}
          </div>
          
          {/* Premium Tech badging */}
          <div className="absolute -bottom-2 translate-y-1/2 left-1/2 -translate-x-1/2 bg-gradient-to-r from-red-600 to-yellow-500 text-[9px] font-black uppercase text-white px-3 py-1 rounded-full border border-yellow-400/30 tracking-[0.15em] shadow-[0_4px_10px_rgba(0,0,0,0.4)] flex items-center gap-1">
            <Cpu className="w-2.5 h-2.5 text-white/90" />
            <span>LIVE SECURE</span>
          </div>
        </motion.div>

        {/* Casino Name / Game Title */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-6 mt-1"
        >
          <span className="text-4xl font-extrabold italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-yellow-200 via-yellow-400 to-amber-600 drop-shadow-[0_2px_10px_rgba(245,158,11,0.3)]">
            SPIN71BET
          </span>
          
          <div className="flex items-center justify-center gap-2 mt-3">
            <span className="h-[1px] w-6 bg-gradient-to-r from-transparent to-yellow-500/30" />
            <h3 className="text-sm font-black text-rose-500 uppercase tracking-[0.2em] italic max-w-[200px] truncate">
              {gameName || "CASINO LOBBY"}
            </h3>
            <span className="h-[1px] w-6 bg-gradient-to-l from-transparent to-yellow-500/30" />
          </div>
          
          {provider && (
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-mono mt-1">
              PROV: {provider}
            </p>
          )}
        </motion.div>

        {/* Central Radial Progress Orb */}
        <div className="relative w-28 h-28 my-2 flex items-center justify-center">
          {/* Progress Ring Canvas / SVG */}
          <svg className="absolute w-28 h-28 -rotate-90">
            {/* Background ring */}
            <circle
              cx="56"
              cy="56"
              r="48"
              className="stroke-[#121520]"
              strokeWidth="4"
              fill="transparent"
            />
            {/* Glowing Golden Ring segment */}
            <motion.circle
              cx="56"
              cy="56"
              r="48"
              className="stroke-yellow-500"
              strokeWidth="5"
              strokeDasharray={301.6}
              strokeDashoffset={301.6 - (301.6 * progress) / 100}
              strokeLinecap="round"
              fill="transparent"
              style={{ filter: 'drop-shadow(0px 0px 8px #f59e0b)' }}
              transition={{ type: 'tween', ease: 'easeOut' }}
            />
          </svg>

          {/* Inner glass counter */}
          <div className="w-20 h-20 rounded-full bg-gradient-to-b from-[#181b2a] to-[#090b12] border border-white/5 flex flex-col items-center justify-center shadow-inner relative">
            <div className="absolute inset-0 bg-yellow-500/5 rounded-full blur-sm" />
            <span className="text-2xl font-black text-white relative flex items-baseline font-mono tracking-tighter">
              {Math.floor(progress)}
              <span className="text-xs text-yellow-500 ml-0.5">%</span>
            </span>
            <span className="text-[8px] text-yellow-500/60 font-black tracking-widest uppercase mt-0.5 animate-pulse">
              LOADING
            </span>
          </div>
        </div>

        {/* Informative Progress Text with Micro-Animations */}
        <div className="h-6 mt-4 w-full flex items-center justify-center">
          <motion.p
            key={loadingText}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="text-xs text-slate-300 font-medium tracking-wide"
          >
            {loadingText}
          </motion.p>
        </div>

        {/* Technical Status Badges */}
        <div className="flex gap-4 mt-8 bg-black/40 border border-white/5 px-4 py-2.5 rounded-xl w-full text-left justify-around text-[10px] text-slate-400 font-mono">
          <div className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-emerald-500" />
            <div>
              <p className="text-[8px] text-slate-500 leading-none uppercase">SSL LINK</p>
              <p className="font-bold text-slate-300">SECURE</p>
            </div>
          </div>
          <div className="h-6 w-[1px] bg-white/10" />
          <div className="flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-red-500" />
            <div>
              <p className="text-[8px] text-slate-500 leading-none uppercase">SPEED</p>
              <p className="font-bold text-slate-300">1.4s MAX</p>
            </div>
          </div>
        </div>

        {/* Error Handling Overlay */}
        {hasError && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute inset-0 bg-[#090a0f] flex flex-col items-center justify-center p-4 z-20"
          >
            <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mb-4">
              <AlertCircle className="w-6 h-6 text-red-500 animate-bounce" />
            </div>
            <h4 className="text-white font-black text-sm mb-1">সিস্টেম সংযোগ ব্যর্থ হয়েছে</h4>
            <p className="text-slate-400 text-xs mb-6 max-w-[240px]">দয়া করে আপনার নেটওয়ার্ক কানেকশন চেক করুন এবং পুনরায় চেষ্টা করুন।</p>
            
            {onClose && (
              <button 
                id="loader-retry-btn"
                onClick={onClose}
                className="w-full py-2.5 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-heavy text-xs rounded-xl transition-all shadow-[0_4px_12px_rgba(220,38,38,0.25)] flex items-center justify-center gap-2 border border-yellow-500/20 uppercase tracking-widest font-black"
              >
                ফিরে যান / BACK TO LOBBY
              </button>
            )}
          </motion.div>
        )}

      </div>

      {/* Global CSS for Animations */}
      <style>{`
        @keyframes shimmer {
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
    </div>
  );
}
