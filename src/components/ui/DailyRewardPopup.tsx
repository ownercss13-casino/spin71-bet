import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Gift, Sparkles, Coins, CheckCircle2, X } from 'lucide-react';
import { useFirebase } from '../../hooks/useFirebase';

interface DailyRewardPopupProps {
  onClose: () => void;
  onClaim: (amount: number) => Promise<void>;
  currentStreak: number;
}

const DailyRewardPopup: React.FC<DailyRewardPopupProps> = ({ onClose, onClaim, currentStreak }) => {
  const [claimed, setClaimed] = useState(false);
  const [claiming, setClaiming] = useState(false);

  const rewards = [
    { day: 1, amount: 10, bonus: false },
    { day: 2, amount: 20, bonus: false },
    { day: 3, amount: 50, bonus: true },
    { day: 4, amount: 30, bonus: false },
    { day: 5, amount: 40, bonus: false },
    { day: 6, amount: 60, bonus: false },
    { day: 7, amount: 200, bonus: true },
  ];

  const handleClaim = async () => {
    if (claimed || claiming) return;
    setClaiming(true);
    const day = Math.min(currentStreak + 1, 7);
    const amount = rewards[day - 1].amount;
    
    try {
      await onClaim(amount);
      setClaimed(true);
      setTimeout(() => {
        onClose();
      }, 2500);
    } catch (error) {
      console.error(error);
    } finally {
      setClaiming(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        className="bg-[#1a0505] w-full max-w-sm rounded-[40px] border-4 border-[#310a0a] p-8 relative overflow-hidden shadow-[0_0_100px_rgba(220,38,38,0.2)]"
      >
        {/* Lights */}
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent"></div>
        
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors">
          <X size={24} />
        </button>

        <div className="flex flex-col items-center text-center">
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity }}
            className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-3xl flex items-center justify-center shadow-[0_0_30px_rgba(234,179,8,0.3)] mb-6"
          >
            <Gift size={40} className="text-black" />
          </motion.div>

          <h2 className="text-3xl font-black italic text-white tracking-tighter uppercase mb-2">
            DAILY <span className="text-yellow-500">BONUS</span>
          </h2>
          <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-8">
            Day {currentStreak + 1} Reward
          </p>

          <div className="grid grid-cols-4 gap-2 w-full mb-8">
            {rewards.map((r, i) => (
              <div 
                key={i} 
                className={`
                  p-1 rounded-xl border flex flex-col items-center gap-1 transition-all
                  ${i < currentStreak ? 'bg-green-500/20 border-green-500/40 text-green-500' : 
                    i === currentStreak ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-500' : 
                    'bg-white/5 border-white/5 text-gray-600'}
                `}
              >
                <div className="text-[8px] font-black uppercase">Day {r.day}</div>
                {i < currentStreak ? <CheckCircle2 size={12} /> : <Coins size={12} />}
                <div className="text-[10px] font-black">৳{r.amount}</div>
              </div>
            ))}
          </div>

          <button
            disabled={claimed || claiming}
            onClick={handleClaim}
            className={`
              w-full py-5 rounded-2xl font-black text-xl uppercase tracking-widest transition-all
              ${claimed ? 'bg-green-600 text-white shadow-[0_0_20px_rgba(22,163,74,0.4)]' : 
                'bg-gradient-to-b from-yellow-400 to-yellow-600 text-black hover:scale-[1.02] active:scale-95 shadow-[0_0_20px_rgba(234,179,8,0.3)]'}
            `}
          >
            {claimed ? 'CLAIMED!' : claiming ? 'CLAIMING...' : 'CLAIM NOW'}
          </button>
        </div>

        {/* Shine effect */}
        <div className="absolute inset-0 z-0 pointer-events-none opacity-20">
          <motion.div 
            animate={{ x: ["-100%", "200%"] }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            className="w-full h-full bg-gradient-to-r from-transparent via-white to-transparent -skew-x-12"
          />
        </div>
      </motion.div>

      {/* Confetti-like coins on claim */}
      <AnimatePresence>
        {claimed && (
          <div className="fixed inset-0 pointer-events-none z-[310]">
            {[...Array(15)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ y: -50, x: Math.random() * window.innerWidth, rotate: 0 }}
                animate={{ y: window.innerHeight + 50, x: (Math.random() - 0.5) * 400 + (Math.random() * window.innerWidth), rotate: 360 }}
                transition={{ duration: 2, delay: i * 0.1 }}
                className="absolute text-yellow-400"
              >
                <Coins size={32} />
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DailyRewardPopup;
