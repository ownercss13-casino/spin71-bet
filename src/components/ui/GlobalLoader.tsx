import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';

interface GlobalLoaderProps {
  message?: string;
  subMessage?: string;
  type?: 'initial' | 'data' | 'transition';
  onSkip?: () => void;
  onRetry?: () => void;
  showRetry?: boolean;
  appLogo?: string;
}

export default function GlobalLoader({ 
  message = "Loading...", 
  subMessage, 
  type = 'initial',
  onSkip,
  onRetry,
  showRetry = false,
  appLogo
}: GlobalLoaderProps) {
  const [progress, setProgress] = useState(0);
  const [autoShowRetry, setAutoShowRetry] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 99) return 99; // Hold at 99% until fully loaded
        const increment = Math.random() * 15 + 5; // Much faster
        return Math.min(prev + increment, 99);
      });
    }, 50);

    const retryTimer = setTimeout(() => {
      setAutoShowRetry(true);
    }, 8000);

    return () => {
      clearInterval(timer);
      clearTimeout(retryTimer);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[2000] bg-[#111111] flex flex-col items-center justify-center p-6 font-sans">
      
      {/* Central Area */}
      <div className="flex flex-col items-center justify-center w-full max-w-[280px] gap-8 relative z-10 -mt-16">
        
        {/* Logo or placeholder */}
        {appLogo ? (
          <motion.img 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            src={appLogo} 
            alt="Logo" 
            className="w-32 h-auto object-contain drop-shadow-2xl"
          />
        ) : (
          <div className="h-32"></div>
        )}

        {/* Progress Bar Container */}
        <div className="w-full flex flex-col gap-2">
          {/* Progress track */}
          <div className="w-full h-1 bg-[#2a2a2a] rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-gradient-to-r from-yellow-600 via-yellow-400 to-yellow-600 rounded-full"
              style={{ width: `${progress}%` }}
              initial={{ width: "0%" }}
              animate={{ width: `${progress}%` }}
              transition={{ ease: "easeOut", duration: 0.1 }}
            />
          </div>
          
          <div className="flex justify-between items-center px-1">
            <span className="text-[#888888] text-[10px] tracking-wider uppercase">Loading</span>
            <span className="text-yellow-500 text-xs font-black">{Math.floor(progress)}%</span>
          </div>
        </div>

        {/* Retry Button */}
        {(showRetry || autoShowRetry) && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 flex flex-col items-center gap-3"
          >
            <p className="text-[10px] text-[#888888]">Slow connection?</p>
             <button 
                onClick={() => onRetry ? onRetry() : window.location.reload()}
                className="px-6 py-2 bg-[#222222] border border-[#333333] text-white text-[10px] rounded hover:bg-[#333333] transition-colors uppercase tracking-widest"
              >
                Refresh
              </button>
          </motion.div>
        )}
      </div>

    </div>
  );
}

