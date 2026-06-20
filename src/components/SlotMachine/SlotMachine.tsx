import React, { useState, useEffect } from 'react';
import { getBackendUrl } from '../../config';
import { motion, AnimatePresence } from 'motion/react';
import { Coins, Trophy, Clock, Star, Gift, User, History, ArrowRight, ArrowLeft, X, Wrench, AlertTriangle } from 'lucide-react';
import { doc, onSnapshot } from 'firebase/firestore';
import Reel from './Reel';
import { useFirebase } from '../../hooks/useFirebase';

interface SlotMachineProps {
  onBack?: () => void;
  balance: number;
  onBalanceUpdate: (newBalance: number, persist?: boolean) => void;
  showToast: (message: string, type?: any) => void;
  userData: any;
}

const SlotMachine: React.FC<SlotMachineProps> = ({ onBack, balance, onBalanceUpdate, showToast, userData }) => {
  // const [isUnderMaintenance] = useState(true);
  const [isUnderMaintenance] = useState(false);
  const { db, auth, user } = useFirebase();
  const [betAmount, setBetAmount] = useState(10);
  
  if (isUnderMaintenance) {
    return (
      <div className="fixed inset-0 z-[200] bg-[#090b0e] flex flex-col items-center justify-center p-6 text-center max-w-[512px] mx-auto">
        {/* Decorative Grid Background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-72 h-72 bg-amber-500/10 rounded-full blur-[100px] pointer-events-none animate-pulse"></div>

        <div className="relative z-10 w-full max-w-md bg-[#13171f] border border-white/5 p-8 rounded-[32px] shadow-2xl relative overflow-hidden flex flex-col items-center">
          {/* Animated Glow Border top */}
          <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-amber-500/50 to-transparent"></div>

          {/* Construction/Wrench Icon visual */}
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-amber-500/20 rounded-3xl blur-xl animate-pulse"></div>
            <div className="w-20 h-20 bg-amber-500/10 border border-amber-500/20 rounded-3xl flex items-center justify-center text-amber-400 relative z-10">
              <Wrench size={38} className="animate-bounce" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-amber-500 rounded-full flex items-center justify-center text-black shadow-lg">
              <AlertTriangle size={14} className="stroke-[3]" />
            </div>
          </div>

          <p className="text-amber-500 text-[10px] font-black uppercase tracking-[0.3em] mb-2">UNDER CONSTRUCTION</p>
          <h2 className="text-2xl font-black text-white italic tracking-tight mb-4">গেম এর কাজ চলতেছে</h2>
          
          <div className="w-full h-[1px] bg-white/5 my-4"></div>

          <p className="text-gray-300 font-medium text-sm leading-relaxed mb-3">
            প্রিয় গ্রাহক, এই গেমটির নতুন আপডেট এবং সার্ভারের কাজ চলতেছে। খুব শীঘ্রই এটি পুনরায় চালু করা হবে।
          </p>
          <p className="text-gray-500 text-xs italic leading-relaxed mb-6">
            Dear user, this game is currently undergoing server updates and improvements. It will be back online shortly. We apologize for the inconvenience.
          </p>

          <button 
            onClick={onBack}
            className="w-full py-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black text-xs uppercase tracking-[0.2em] rounded-2xl transition-all shadow-xl shadow-amber-500/10 active:scale-95 flex items-center justify-center gap-2"
          >
            <ArrowLeft size={16} className="stroke-[3]" /> Home ফিরে যান
          </button>
        </div>
      </div>
    );
  }
  const [isSpinning, setIsSpinning] = useState(false);
  const [autoSpin, setAutoSpin] = useState(false);
  const [turboMode, setTurboMode] = useState(false);
  const [results, setResults] = useState(['7', '7', '7']);
  const [winAmount, setWinAmount] = useState<number | null>(null);
  const [showWin, setShowWin] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (autoSpin && !isSpinning && balance >= betAmount) {
      timer = setTimeout(() => {
        handleSpin();
      }, 1500);
    } else if (autoSpin && balance < betAmount) {
      setAutoSpin(false);
    }
    return () => clearTimeout(timer);
  }, [autoSpin, isSpinning, balance, betAmount]);

  const handleSpin = async () => {
    if (balance < betAmount || isSpinning) {
      if (autoSpin) setAutoSpin(false);
      return;
    }

    setIsSpinning(true);
    setWinAmount(null);
    setShowWin(false);

    try {
      const idToken = await user?.getIdToken();
      const response = await fetch(`${getBackendUrl()}/api/game/slot/spin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ betAmount, idToken })
      });

      const data = await response.json();
      
      const spinDuration = turboMode ? 800 : 2500;
      
      setTimeout(() => {
        setIsSpinning(false);
        if (data.success) {
          setResults(data.symbols);
          setWinAmount(data.winAmount);
          if (data.winAmount > 0) setShowWin(true);
          
          // Force update the local balance for immediate feedback
          if (data.newBalance !== undefined) {
             onBalanceUpdate(data.newBalance, false);
          }
        }
      }, spinDuration);

    } catch (error) {
      console.error("Spin failed:", error);
      setIsSpinning(false);
      setAutoSpin(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#0a0505] p-4 text-white overflow-hidden relative">
      {/* Top Banner / Logo */}
      <div className="absolute top-0 left-0 right-0 h-20 flex items-center justify-center z-20 pointer-events-none pt-4">
        <span className="text-3xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 via-yellow-500 to-yellow-600 drop-shadow-[0_0_12px_rgba(253,216,53,0.5)]">
          SPIN71 BET✨
        </span>
      </div>

      {/* Close Button - × */}
      {onBack && (
        <button 
          onClick={onBack}
          className="absolute top-4 right-4 z-50 w-12 h-12 flex items-center justify-center bg-red-600/20 hover:bg-red-600 rounded-full border border-red-500/30 transition-all text-white shadow-[0_0_20px_rgba(220,38,38,0.4)] group"
          title="Exit Game"
        >
          <X size={28} className="group-hover:scale-110 transition-transform" />
        </button>
      )}
      
      {/* Live Win Ticker (Demo/Simulated for real feel) */}
      <div className="absolute top-20 left-0 right-0 h-8 bg-red-600/10 border-y border-red-600/20 overflow-hidden flex items-center z-10">
         <motion.div 
           animate={{ x: ["100%", "-100%"] }}
           transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
           className="whitespace-nowrap flex items-center gap-8 text-[10px] font-bold uppercase tracking-widest text-red-500"
         >
           <span>🔥 User 03** just won ৳2,500 on slots</span>
           <span>⭐ User admin** hit a ৳10,000 jackpot!</span>
           <span>🎯 BIG WIN: ৳3,450 by User 77**</span>
           <span>💎 MEGA WIN: ৳15,000 by User rich**</span>
         </motion.div>
      </div>

      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(220,38,38,0.15),transparent)] pointer-events-none"></div>
      
      {/* Header Info */}
      <div className="w-full max-w-md flex justify-between items-center mb-8 bg-black/40 p-4 rounded-2xl border border-white/5 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-yellow-500/20 rounded-full border border-yellow-500/30">
            <Coins size={20} className="text-yellow-500" />
          </div>
          <div>
            <div className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">Balance</div>
            <div className="text-lg font-black text-yellow-500">৳{balance.toLocaleString()}</div>
          </div>
        </div>
        <div className="h-8 w-[1px] bg-white/10"></div>
        <div className="flex flex-col items-end">
           <div className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">VIP Level</div>
           <div className="text-sm font-bold text-red-500 px-2 py-0.5 border border-red-500/30 rounded-md bg-red-500/10">PREMIUM</div>
        </div>
      </div>

      {/* Slot Machine Frame */}
      <div className="relative p-8 bg-[#1a0505] rounded-[40px] border-[6px] border-[#310a0a] shadow-[0_0_100px_rgba(220,38,38,0.2),_0_20px_40px_rgba(0,0,0,0.5)]">
        {/* Lights Animation */}
        <div className="absolute -inset-1 border-2 border-red-600/50 rounded-[40px] animate-pulse pointer-events-none"></div>
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 flex items-center justify-center">
           <div className="w-24 h-1 bg-red-600 blur-lg"></div>
        </div>

        {/* Reels Container */}
        <div className="flex gap-3 p-4 bg-black/80 rounded-3xl border-4 border-[#310a0a] shadow-inner mb-8">
          <Reel symbols={['7', 'BAR', 'CHERRY', 'DIAMOND', 'GOLD', 'BELL']} isSpinning={isSpinning} result={results[0]} />
          <Reel symbols={['7', 'BAR', 'CHERRY', 'DIAMOND', 'GOLD', 'BELL']} isSpinning={isSpinning} result={results[1]} />
          <Reel symbols={['7', 'BAR', 'CHERRY', 'DIAMOND', 'GOLD', 'BELL']} isSpinning={isSpinning} result={results[2]} />
        </div>

        {/* Status Line */}
        <div className="h-12 flex items-center justify-center mb-6 overflow-hidden">
           <AnimatePresence mode="wait">
             {showWin ? (
               <motion.div 
                 initial={{ y: 20, opacity: 0 }} 
                 animate={{ y: 0, opacity: 1 }} 
                 exit={{ y: -20, opacity: 0 }}
                 className="text-2xl font-black text-yellow-400 italic tracking-tighter drop-shadow-[0_0_10px_rgba(250,204,21,0.6)]"
               >
                 WIN: ৳{winAmount}
               </motion.div>
             ) : (
               <motion.div 
                 initial={{ opacity: 0 }} 
                 animate={{ opacity: 1 }} 
                 className="text-xs font-bold text-red-500/60 uppercase tracking-[0.3em]"
               >
                 {isSpinning ? 'SPINNING LUCK...' : 'TRY YOUR LUCK'}
               </motion.div>
             )}
           </AnimatePresence>
        </div>

        {/* Interaction Panel */}
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center gap-2">
            <button 
              onClick={() => setAutoSpin(!autoSpin)}
              className={`flex-1 py-3 rounded-xl border text-[10px] font-black uppercase tracking-tighter transition-all ${autoSpin ? 'bg-red-600 border-red-500 text-white shadow-[0_0_15px_rgba(220,38,38,0.4)]' : 'bg-black/40 border-white/10 text-gray-400'}`}
            >
              Auto Spin
            </button>
            <button 
              onClick={() => setTurboMode(!turboMode)}
              className={`flex-1 py-3 rounded-xl border text-[10px] font-black uppercase tracking-tighter transition-all ${turboMode ? 'bg-yellow-500 border-yellow-400 text-black shadow-[0_0_15px_rgba(234,179,8,0.4)]' : 'bg-black/40 border-white/10 text-gray-400'}`}
            >
              Turbo Mode
            </button>
          </div>

          <div className="flex justify-between items-center bg-black/40 p-2 rounded-xl border border-white/5">
             <button disabled={isSpinning} onClick={() => setBetAmount(Math.max(10, betAmount - 10))} className="p-3 bg-red-600/10 hover:bg-red-600/20 text-red-500 rounded-lg transition-colors disabled:opacity-50">-</button>
             <div className="flex flex-col items-center">
                <span className="text-[10px] text-gray-500 font-bold uppercase">Bet Amount</span>
                <span className="text-xl font-black text-yellow-500">৳{betAmount}</span>
             </div>
             <button disabled={isSpinning} onClick={() => setBetAmount(betAmount + 10)} className="p-3 bg-red-600/10 hover:bg-red-600/20 text-red-500 rounded-lg transition-colors disabled:opacity-50">+</button>
          </div>

          <button 
            disabled={isSpinning || balance < betAmount}
            onClick={() => handleSpin()}
            className={`
              relative group py-6 rounded-2xl font-black text-2xl uppercase tracking-widest transition-all overflow-hidden
              ${isSpinning || balance < betAmount 
                ? 'bg-gray-800 text-gray-600 cursor-not-allowed grayscale' 
                : 'bg-gradient-to-b from-red-500 to-red-700 hover:scale-[1.02] active:scale-95 shadow-[0_10px_0_#991b1b,0_15px_30px_rgba(220,38,38,0.4)]'}
            `}
          >
            <span className="relative z-10">{isSpinning ? 'SPINNING...' : 'SPIN'}</span>
            <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-10 transition-opacity"></div>
            {/* Glossy shine */}
            <div className="absolute top-0 left-[-100%] w-12 h-full bg-white/30 rotate-[30deg] animate-shine"></div>
          </button>
        </div>
      </div>

      {/* Floating Particles or Win Celebration */}
      {showWin && (
         <div className="fixed inset-0 pointer-events-none z-50">
           {[...Array(20)].map((_, i) => (
             <motion.div
               key={i}
               initial={{ y: -20, x: Math.random() * window.innerWidth, opacity: 0 }}
               animate={{ y: window.innerHeight + 100, x: (Math.random() - 0.5) * 200 + (Math.random() * window.innerWidth), opacity: [0, 1, 0] }}
               transition={{ duration: 2, delay: Math.random() }}
               className="absolute text-yellow-400"
             >
               <Coins size={24} />
             </motion.div>
           ))}
         </div>
      )}
      <style>{`
        @keyframes shine {
          to { left: 200%; }
        }
        .animate-shine {
          animation: shine 2s infinite linear;
        }
      `}</style>
    </div>
  );
};

export default SlotMachine;
