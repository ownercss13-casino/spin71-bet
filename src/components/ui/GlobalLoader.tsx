import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Crown, SkipForward } from 'lucide-react';

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
  message = "SPIN71BET", 
  subMessage = "PREPARING YOUR PREMIUM EXPERIENCE", 
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
        if (prev >= 98) return 98; // Stay near 100 but don't finish until data is ready
        const inc = Math.random() * 4;
        return Math.min(prev + inc, 98);
      });
    }, 200);

    // Show retry button after 15 seconds of waiting
    const retryTimer = setTimeout(() => {
      setAutoShowRetry(true);
    }, 15000);

    return () => {
      clearInterval(timer);
      clearTimeout(retryTimer);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[2000] bg-gradient-to-b from-[#1a2f4a] to-[#0d1a29] flex flex-col items-center justify-between p-6 text-center overflow-hidden font-sans">
      {/* Background Decor */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none" 
        style={{ 
          backgroundImage: 'radial-gradient(circle at 2px 2px, #eab308 1px, transparent 0)', 
          backgroundSize: '24px 24px' 
        }}
      ></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-yellow-500/5 rounded-full blur-[100px] pointer-events-none"></div>

      {/* Top Header */}
      <div className="w-full flex justify-between items-start relative z-20 mt-4">
        <div className="flex-1 flex justify-center relative">
          {/* Title removed per request */}
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
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center w-full">
          <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", bounce: 0.5 }}
          className="relative flex flex-col items-center justify-center p-8"
        >
          <motion.div
            className="relative w-32 h-32 flex items-center justify-center"
          >
            {/* The rotating glowing ring */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
              className="absolute inset-0 rounded-full border-[4px] border-transparent border-t-yellow-500 border-b-yellow-500"
            />
            
            {/* The static centered image */}
            <img 
              src={appLogo || "/images/app_logo.png"}
              alt="Loading" 
              className="w-24 h-24 object-cover rounded-full shadow-[0_0_20px_rgba(253,216,53,0.5)]"
            />
          </motion.div>
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
          {/* Loading status text removed per request */}
          {(showRetry || autoShowRetry) && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 flex flex-col items-center gap-2"
            >
              <p className="text-[10px] text-rose-400 font-bold">নেটওয়ার্ক সমস্যা হচ্ছে?</p>
              <button 
                onClick={() => onRetry ? onRetry() : window.location.reload()}
                className="px-6 py-2 bg-yellow-500 text-black text-[10px] font-black rounded-lg shadow-lg hover:bg-yellow-400 transition-all uppercase tracking-widest"
              >
                আবার চেষ্টা করুন (RETRY)
              </button>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

