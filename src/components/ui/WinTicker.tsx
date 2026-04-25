import React, { useEffect, useState } from 'react';
import { Trophy, TrendingUp, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const WINNERS = [
  { name: 'Robin***', amount: 4500, game: 'Aviator' },
  { name: 'Ashik***', amount: 12000, game: 'Cricket' },
  { name: 'Sumon***', amount: 2500, game: 'Super Ace' },
  { name: 'Kushal***', amount: 8900, game: 'Crazy Time' },
  { name: 'Moni***', amount: 1500, game: 'Gates of Olympus' },
];

export default function WinTicker() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % WINNERS.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const winner = WINNERS[index];

  return (
    <div className="w-full bg-teal-900/40 backdrop-blur-md border-y border-teal-500/20 py-2 px-4 flex items-center justify-between overflow-hidden">
      <div className="flex items-center gap-2 shrink-0">
        <Trophy size={14} className="text-yellow-400 animate-bounce" />
        <span className="text-[10px] font-black italic text-teal-400 uppercase tracking-tighter">Live Winners</span>
      </div>
      
      <div className="flex-1 px-4 overflow-hidden relative h-5">
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            className="flex items-center justify-center gap-3 w-full"
          >
            <span className="text-[11px] font-bold text-white tracking-tight">{winner.name}</span>
            <span className="text-[10px] text-teal-300 font-medium">won</span>
            <span className="text-[11px] font-black text-yellow-400">৳{winner.amount.toLocaleString()}</span>
            <span className="text-[9px] text-teal-500 font-bold uppercase tracking-widest">{winner.game}</span>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <TrendingUp size={12} className="text-green-400" />
        <span className="text-[9px] font-black text-teal-600">LIVE</span>
      </div>
    </div>
  );
}
