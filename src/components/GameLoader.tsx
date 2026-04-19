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
  const [luckFactor, setLuckFactor] = useState(70);
  const [currentTipIndex, setCurrentTipIndex] = useState(0);

  const tips = [
    "বড় জয়ের জন্য প্রস্তুত হন! (Get ready for a big win!)",
    "আপনার ভাগ্য আজ আপনার সাথে থাকতে পারে। (Luck might be on your side today.)",
    "গেমটি লোড হচ্ছে, ধৈর্য ধরুন। (Game is loading, please wait.)",
    "আমরা ফেয়ার প্লে নিশ্চিত করি। (We ensure fair play.)",
    "আপনার ব্যালেন্স সুরক্ষিত আছে। (Your balance is secure.)",
    "নতুন নতুন বোনাস চেক করতে ভুলবেন পণ্ডিত। (Don't forget to check new bonuses.)"
  ];

  useEffect(() => {
    if (hasError) {
      setProgress(100);
      return;
    }

    const duration = 3000; // 3 seconds
    const interval = 50; // Update every 50ms
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
      
      // Randomly fluctuate luck factor
      setLuckFactor(prev => {
        const change = Math.floor(Math.random() * 5) - 2;
        return Math.max(70, Math.min(99, prev + change));
      });
    }, interval);

    const tipTimer = setInterval(() => {
      setCurrentTipIndex(prev => (prev + 1) % tips.length);
    }, 1000);

    return () => {
      clearInterval(timer);
      clearInterval(tipTimer);
    };
  }, [hasError]);

  return (
    <div className="fixed inset-0 z-[110] bg-[#050505] flex flex-col items-center justify-center p-6 text-center overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Dynamic Glows */}
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.2, 0.1]
          }}
          transition={{ duration: 4, repeat: Infinity }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-yellow-500/10 rounded-full blur-[150px]"
        ></motion.div>
        
        <motion.div 
          animate={{ 
            x: [-20, 20, -20],
            y: [-20, 20, -20]
          }}
          transition={{ duration: 5, repeat: Infinity }}
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-teal-500/5 rounded-full blur-[120px]"
        ></motion.div>

        {/* Floating Particles */}
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ 
              x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 400), 
              y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 800),
              opacity: 0 
            }}
            animate={{ 
              y: [null, Math.random() * -200 - 100],
              opacity: [0, 0.6, 0],
              scale: [0, 1, 0]
            }}
            transition={{ 
              duration: Math.random() * 4 + 3, 
              repeat: Infinity,
              delay: Math.random() * 2
            }}
            className="absolute"
          >
            {i % 4 === 0 ? <Star size={10} className="text-yellow-500/40" /> : 
             i % 4 === 1 ? <Coins size={10} className="text-yellow-200/30" /> : 
             i % 4 === 2 ? <Sparkles size={10} className="text-teal-400/30" /> :
             <div className="w-1.5 h-1.5 bg-white/20 rounded-full blur-[1px]"></div>}
          </motion.div>
        ))}
      </div>

      <div className="relative z-10 flex flex-col items-center max-w-sm w-full">
        {/* Main Logo Container */}
        <div className="relative mb-12">
          {/* Outer Spinning Rings */}
          <div className="absolute -inset-12 border border-yellow-500/10 rounded-full animate-[spin_15s_linear_infinite]"></div>
          <div className="absolute -inset-8 border-2 border-dashed border-yellow-500/20 rounded-full animate-[spin_10s_linear_infinite]"></div>
          <div className="absolute -inset-4 border border-yellow-500/10 rounded-full animate-[spin_6s_linear_reverse_infinite]"></div>
          
          <motion.div 
            initial={{ scale: 0.5, opacity: 0, rotate: -10 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            transition={{ type: "spring", damping: 12, stiffness: 100 }}
            className="w-40 h-40 rounded-[3rem] bg-gradient-to-br from-gray-900 via-black to-gray-900 border-2 border-yellow-500/40 flex items-center justify-center shadow-[0_0_60px_rgba(234,179,8,0.4)] overflow-hidden relative z-10"
          >
            {logo ? (
              <img src={logo} alt={gameName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Crown size={56} className="text-yellow-500 drop-shadow-[0_0_15px_rgba(234,179,8,0.6)]" />
                <span className="text-[10px] font-black text-yellow-500 uppercase tracking-[0.4em]">PREMIUM</span>
              </div>
            )}
            
            {/* Shimmer Effect on Logo */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent -translate-x-full animate-[shimmer_2s_infinite]"></div>
          </motion.div>
          
          {/* Pulse Effect */}
          <div className="absolute inset-0 bg-yellow-500/30 rounded-[3rem] animate-ping opacity-20"></div>
        </div>

        {/* Game Info */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex flex-col items-center mb-10"
        >
          <h2 className="text-4xl font-black text-white mb-2 tracking-tighter italic uppercase drop-shadow-[0_5px_15px_rgba(0,0,0,0.5)] text-center bg-gradient-to-b from-white via-white to-gray-500 bg-clip-text text-transparent">
            {gameName || 'Loading Game'}
          </h2>
          <div className="flex items-center gap-3">
            <div className="h-[1px] w-12 bg-gradient-to-r from-transparent to-yellow-500/50"></div>
            <p className="text-yellow-500 font-black text-[10px] uppercase tracking-[0.6em]">{provider || 'Casino Game'}</p>
            <div className="h-[1px] w-12 bg-gradient-to-l from-transparent to-yellow-500/50"></div>
          </div>
        </motion.div>

        {/* Luck Meter */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mb-8 flex items-center gap-4 bg-white/5 px-6 py-3 rounded-2xl border border-white/10 backdrop-blur-xl shadow-xl"
        >
          <div className="flex items-center gap-2">
            <Zap size={16} className="text-yellow-400 fill-yellow-400 animate-pulse" />
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Luck Meter:</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-black text-yellow-500 font-mono w-12">{luckFactor}%</span>
            <div className="flex gap-1">
              {[...Array(6)].map((_, i) => (
                <div 
                  key={i} 
                  className={`w-2 h-4 rounded-full transition-all duration-300 ${i < Math.floor((luckFactor-70)/5) + 1 ? 'bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.6)] scale-y-110' : 'bg-white/10 scale-y-90'}`}
                ></div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Progress Section / Error Section */}
        {hasError ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full flex flex-col items-center bg-red-500/10 border border-red-500/20 rounded-3xl p-6 backdrop-blur-md"
          >
            <AlertCircle size={48} className="text-red-500 mb-4 animate-pulse" />
            <h3 className="text-xl font-black text-white mb-2 tracking-tight">গেমটি লোড করা যাচ্ছে না</h3>
            <p className="text-xs text-red-200/60 text-center mb-6 max-w-[250px] leading-relaxed">
              দুঃখিত, গেমটি এই মুহূর্তে লোড করা সম্ভব হচ্ছে না। অনুগ্রহ করে কিছুক্ষণ পর আবার চেষ্টা করুন অথবা সাপোর্টে যোগাযোগ করুন।
            </p>
            {onClose && (
              <button 
                onClick={onClose}
                className="bg-gradient-to-r from-red-600 to-red-500 text-white font-bold px-8 py-3 rounded-xl hover:from-red-500 hover:to-red-400 transition-all shadow-[0_0_20px_rgba(239,68,68,0.4)] active:scale-95"
              >
                ফিরে যান
              </button>
            )}
          </motion.div>
        ) : (
          <div className="w-full space-y-6">
            <div className="flex justify-between items-end px-2">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <RefreshCw size={18} className="animate-spin text-yellow-500" />
                  <div className="absolute inset-0 blur-md bg-yellow-500/40 animate-pulse"></div>
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-white/60 text-[10px] font-black uppercase tracking-[0.3em]">
                    {progress < 30 ? 'Connecting...' : progress < 60 ? 'Loading Assets...' : progress < 90 ? 'Optimizing...' : 'Ready!'}
                  </span>
                  <AnimatePresence mode="wait">
                    <motion.span 
                      key={currentTipIndex}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="text-yellow-500/40 text-[8px] font-bold uppercase tracking-widest mt-1"
                    >
                      {tips[currentTipIndex]}
                    </motion.span>
                  </AnimatePresence>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-yellow-500 font-black text-3xl font-mono leading-none drop-shadow-[0_0_10px_rgba(234,179,8,0.3)]">{Math.round(progress)}%</span>
              </div>
            </div>
            
            <div className="w-full h-5 bg-black/80 rounded-full overflow-hidden border border-white/10 shadow-[inset_0_4px_8px_rgba(0,0,0,0.8)] relative p-[4px]">
              <motion.div 
                className="h-full bg-gradient-to-r from-yellow-600 via-yellow-400 to-yellow-200 rounded-full relative"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ type: "spring", bounce: 0, duration: 0.5 }}
              >
                {/* Internal Shimmer */}
                <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_25%,rgba(255,255,255,0.4)_50%,transparent_75%)] bg-[length:40px_100%] animate-[shimmer_1s_infinite]"></div>
                
                {/* Particle Trail at the end of progress */}
                {progress > 0 && progress < 100 && (
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full blur-md shadow-[0_0_15px_#fff]"></div>
                )}
              </motion.div>
            </div>
          </div>
        )}

        {/* Bottom Message */}
        {!hasError && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1 }}
            className="mt-16 flex items-center gap-4 bg-yellow-500/5 px-6 py-3 rounded-2xl border border-yellow-500/10 backdrop-blur-sm"
          >
            <Trophy size={20} className="text-yellow-500 animate-bounce" />
            <p className="text-[10px] text-yellow-200/60 font-black uppercase tracking-[0.2em] leading-relaxed">
              Big wins are waiting for you.<br/>Good luck, Player!
            </p>
            <Trophy size={20} className="text-yellow-500 animate-bounce" />
          </motion.div>
        )}
      </div>

      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}
