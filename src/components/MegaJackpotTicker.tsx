import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../context/LanguageContext';
import { Coins, Sparkles, Flame, Trophy } from 'lucide-react';

export default function MegaJackpotTicker() {
  const { language } = useLanguage();
  const [jackpot, setJackpot] = useState<number>(() => {
    const saved = localStorage.getItem('casino_mega_jackpot');
    return saved ? parseFloat(saved) : 18549302.45;
  });

  const [lastIncrement, setLastIncrement] = useState<boolean>(false);

  useEffect(() => {
    const interval = setInterval(() => {
      const increment = Math.random() * 12.85 + 1.25;
      setJackpot(prev => {
        const next = prev + increment;
        localStorage.setItem('casino_mega_jackpot', next.toFixed(2));
        return next;
      });
      setLastIncrement(prev => !prev);
    }, 450);

    return () => clearInterval(interval);
  }, []);

  const formatNumber = (num: number): string => {
    const formatted = num.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });

    if (language === 'bn') {
      const banglaDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
      return formatted.replace(/\d/g, (d) => banglaDigits[parseInt(d, 10)]);
    }
    return formatted;
  };

  return (
    <div id="casino-mega-jackpot-billboard" className="relative overflow-hidden rounded-[28px] bg-gradient-to-b from-[#101f35] to-[#070e17] border-2 border-yellow-500/40 p-6 shadow-[0_0_30px_rgba(234,179,8,0.15)] select-none">
      {/* Sparkle Particles Layer */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div 
          animate={{ opacity: [0.3, 0.8, 0.3], scale: [1, 1.2, 1] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-4 left-10 text-yellow-400 opacity-60"
        >
          <Sparkles size={16} className="fill-yellow-400" />
        </motion.div>
        <motion.div 
          animate={{ opacity: [0.2, 0.6, 0.2], scale: [0.8, 1.1, 0.8] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute bottom-6 right-12 text-yellow-300 opacity-50"
        >
          <Sparkles size={14} className="fill-yellow-300" />
        </motion.div>
        <motion.div 
          animate={{ y: [-5, 5, -5], rotate: [0, 10, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/2 left-4 text-amber-500 opacity-30"
        >
          <Coins size={18} />
        </motion.div>
        <div className="absolute top-0 right-0 w-48 h-48 bg-yellow-500/5 rounded-full blur-3xl pointer-events-none" />
      </div>

      <div className="flex flex-col items-center text-center relative z-10">
        {/* Title Header Badge */}
        <div className="flex items-center gap-2 bg-gradient-to-r from-red-600/30 via-yellow-500/20 to-red-600/30 px-4 py-1.5 rounded-full border border-yellow-500/30 shadow-[0_0_15px_rgba(234,179,8,0.1)] mb-4 animate-pulse">
          <Trophy size={14} className="text-yellow-400 fill-yellow-400" />
          <span className="text-[10px] md:text-xs font-black uppercase tracking-[0.2em] text-yellow-400">
            {language === 'bn' ? 'মেগা ক্যাসিনো জ্যাকপট' : 'MEGA CASINO JACKPOT'}
          </span>
          <Flame size={14} className="text-orange-500 fill-orange-500" />
        </div>

        {/* Dynamic Multi-layered Jackpot Number Box */}
        <div className="relative w-full max-w-lg bg-gradient-to-b from-[#0a1523] to-[#04080e] rounded-2xl py-5 px-6 border border-white/5 shadow-inner">
          <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-yellow-500/20 via-orange-500/30 to-yellow-500/20 opacity-40 blur-[1px]" />
          
          <div className="relative flex items-center justify-center gap-1 sm:gap-2">
            <span className="text-2xl sm:text-3xl font-black text-yellow-400 italic font-sans mr-1">
              ৳
            </span>
            <span className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight bg-gradient-to-b from-white via-yellow-200 to-yellow-500 bg-clip-text text-transparent font-mono select-all">
              {formatNumber(jackpot)}
            </span>
          </div>

          <div className="flex justify-between items-center mt-3 pt-2.5 border-t border-white/5 text-[9px] md:text-[10px] font-bold uppercase text-gray-500 tracking-widest">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {language === 'bn' ? 'লাইভ কাউন্টার' : 'LIVE TICKER'}
            </span>
            <span className="text-yellow-500/80 animate-pulse">
              {language === 'bn' ? 'যেকোনো মুহূর্তে উইন সম্ভব!' : 'WINNABLE ON ANY SPIN!'}
            </span>
          </div>
        </div>

        {/* Animated Winning Stats Ribbon */}
        <div className="mt-4 flex items-center gap-6 text-[10px] font-black uppercase tracking-widest text-teal-400 bg-teal-950/20 px-5 py-2 rounded-xl border border-teal-500/10">
          <span className="flex items-center gap-1.5">
            <span className="text-white font-normal">Last Win:</span>
            <span className="text-yellow-400 font-mono">৳{language === 'bn' ? '১,৮২,৫০০' : '182,500'}</span>
          </span>
          <div className="w-[1px] h-3 bg-white/10" />
          <span className="flex items-center gap-1.5">
            <span className="text-white font-normal">Winner:</span>
            <span className="text-teal-300">@hasan_98</span>
          </span>
        </div>
      </div>
    </div>
  );
}
