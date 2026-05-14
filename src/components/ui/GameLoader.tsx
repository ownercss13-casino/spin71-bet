import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2, Crown, Sparkles, Star, Zap, Trophy, Coins, RefreshCw, AlertCircle } from 'lucide-react';

interface GameLoaderProps {
  gameName?: string;
  provider?: string;
  logo?: string;
  hasError?: boolean;
  onClose?: () => void;
}

export default function GameLoader({ gameName, provider, logo, hasError = false, onClose }: GameLoaderProps) {
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

    return () => {
      clearInterval(timer);
    };
  }, [hasError]);

  return (
    <div className="fixed inset-0 z-[110] bg-black flex flex-col items-center justify-center p-6 overflow-hidden">
      <div className="relative flex flex-col items-center w-full max-w-[280px]">
        
        {/* Provider Name in Golden Style */}
        <motion.div
           initial={{ opacity: 0, scale: 0.9 }}
           animate={{ opacity: 1, scale: 1 }}
           className="relative mb-4"
        >
          <h1 className="text-6xl font-black italic tracking-tighter golden-text">
            {provider || 'JILI'}
          </h1>
          
          {/* Subtle Glow under text */}
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-32 h-4 bg-yellow-500/20 blur-xl rounded-full"></div>
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
