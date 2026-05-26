import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2, Crown, Sparkles, Star, Zap, Trophy, Coins, RefreshCw, AlertCircle } from 'lucide-react';

interface GameLoaderProps {
  gameName?: string;
  provider?: string;
  logo?: string;
  hasError?: boolean;
  onClose?: () => void;
  onLoadComplete?: () => void;
}

export default function GameLoader({ gameName, provider, logo, hasError = false, onClose, onLoadComplete }: GameLoaderProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (hasError) {
      setProgress(100);
      return;
    }

    const duration = 2500; // 2.5 seconds
    const interval = 30; // Update every 30ms
    const steps = duration / interval;
    const increment = 100 / steps;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          return 100;
        }
        return Math.min(prev + increment, 100);
      });
    }, interval);

    const finishTimeout = setTimeout(() => {
      if (onLoadComplete) onLoadComplete();
    }, duration + 100);

    return () => {
      clearInterval(timer);
      clearTimeout(finishTimeout);
    };
  }, [hasError, onLoadComplete]);

  return (
    <div className="fixed inset-0 z-[1010] bg-black flex flex-col items-center justify-center p-6 overflow-hidden">
      <div className="relative flex flex-col items-center w-full max-w-[280px]">
        
        {/* Casino Logo in Loader */}
        <motion.div
           initial={{ opacity: 0, scale: 0.9 }}
           animate={{ opacity: 1, scale: 1 }}
           className="relative mb-6 text-center"
        >
          <img 
            src="/apple-touch-icon.png?v=6" 
            alt="SPIN71" 
            className="h-20 w-auto object-contain drop-shadow-[0_0_15px_rgba(253,216,53,0.4)]"
            referrerPolicy="no-referrer"
          />
          {gameName && (
            <p className="text-sm font-black text-yellow-500/80 mt-4 uppercase tracking-widest italic">{gameName}</p>
          )}
          
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-40 h-6 bg-yellow-500/10 blur-2xl rounded-full"></div>
        </motion.div>

        {/* Thin Progress Bar */}
        <div className="w-full h-[3px] bg-[#333] rounded-full overflow-hidden relative shadow-lg">
          <motion.div 
            className="h-full bg-gradient-to-r from-[#cc9a06] to-[#fdd835]"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ type: "spring", bounce: 0, duration: 0.3 }}
          />
        </div>

        {/* Error State Overlay */}
        {hasError && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute top-full mt-10 text-center"
          >
            <p className="text-red-500 text-sm font-bold mb-4">গেমটি লোড করা যাচ্ছে না</p>
            {onClose && (
              <button 
                onClick={onClose}
                className="px-6 py-2 bg-white/10 text-white rounded-lg text-xs font-bold border border-white/20"
              >
                ফিরে যান
              </button>
            )}
          </motion.div>
        )}
      </div>

      <style>{`
        .golden-text {
          display: inline-block;
          background: linear-gradient(180deg, #fff9c4 0%, #fdd835 45%, #fbc02d 55%, #827717 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          filter: drop-shadow(0 2px 1px rgba(0,0,0,0.8));
          font-family: sans-serif;
          transform: skewX(-5deg);
        }
      `}</style>
    </div>
  );
}
