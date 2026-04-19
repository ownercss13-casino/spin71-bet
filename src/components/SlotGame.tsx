import React, { useState, useEffect, useCallback } from 'react';
import GameLoader from './GameLoader';
import { ArrowLeft, Wallet, Play, RotateCcw, Star, Trophy } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import Reel from './Reel';

interface SlotGameProps {
  game: {
    id: string;
    name: string;
    provider: string;
    image: string;
    bgColor?: string;
  };
  onClose: () => void;
  userBalance: number;
  onBalanceUpdate: (newBalance: number) => void;
  referredBy?: string | null;
  globalLogo?: string;
  globalName?: string;
  userData?: any;
}

const SYMBOLS = ['🍒', '🍋', '🍇', '🔔', '💎', '7️⃣', '⭐', '🍀'];

export default function SlotGame({ game, onClose, userBalance, onBalanceUpdate, referredBy, globalLogo, globalName, userData }: SlotGameProps) {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  const [reels, setReels] = useState([
    [SYMBOLS[0], SYMBOLS[1], SYMBOLS[2]],
    [SYMBOLS[3], SYMBOLS[4], SYMBOLS[5]],
    [SYMBOLS[6], SYMBOLS[7], SYMBOLS[0]],
  ]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [betAmount, setBetAmount] = useState(10);
  const [winAmount, setWinAmount] = useState(0);
  const [showWin, setShowWin] = useState(false);
  const [lastWin, setLastWin] = useState(0);
  const [recentWins, setRecentWins] = useState<{amount: number, time: string}[]>([]);

  const spin = useCallback(() => {
    if (isSpinning || userBalance < betAmount) return;

    onBalanceUpdate(userBalance - betAmount);
    setIsSpinning(true);
    setWinAmount(0);
    setShowWin(false);

    // Activity logs removed (Firebase disconnected)

    // Simulate spinning
    const spinDuration = 2000;
    const startTime = Date.now();

    const interval = setInterval(() => {
      setReels(prev => prev.map(reel => 
        reel.map(() => SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)])
      ));

      if (Date.now() - startTime > spinDuration) {
        clearInterval(interval);
        
        // Final result
        const finalReels = [
          Array.from({ length: 3 }, () => SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]),
          Array.from({ length: 3 }, () => SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]),
          Array.from({ length: 3 }, () => SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]),
        ];
        setReels(finalReels);
        setIsSpinning(false);
        checkWin(finalReels);
      }
    }, 100);
  }, [isSpinning, userBalance, betAmount, onBalanceUpdate]);

  const checkWin = (currentReels: string[][]) => {
    let totalWin = 0;
    
    // Check horizontal lines
    for (let i = 0; i < 3; i++) {
      if (currentReels[0][i] === currentReels[1][i] && currentReels[1][i] === currentReels[2][i]) {
        const symbol = currentReels[0][i];
        const multiplier = SYMBOLS.indexOf(symbol) + 2;
        totalWin += betAmount * multiplier;
      }
    }

    // Check diagonals
    if (currentReels[0][0] === currentReels[1][1] && currentReels[1][1] === currentReels[2][2]) {
      const symbol = currentReels[0][0];
      const multiplier = SYMBOLS.indexOf(symbol) + 3;
      totalWin += betAmount * multiplier;
    }
    if (currentReels[0][2] === currentReels[1][1] && currentReels[1][1] === currentReels[2][0]) {
      const symbol = currentReels[0][2];
      const multiplier = SYMBOLS.indexOf(symbol) + 3;
      totalWin += betAmount * multiplier;
    }

    if (totalWin > 0) {
      setWinAmount(totalWin);
      setLastWin(totalWin);
      setShowWin(true);
      onBalanceUpdate(userBalance + totalWin);
      
      // Leaderboard and activity logs removed (Firebase disconnected)
      setRecentWins(prev => [{
        amount: totalWin,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }, ...prev].slice(0, 5));
      setTimeout(() => setShowWin(false), 3000);
    }
  };

  return (
    <div className="full-display-game flex flex-col font-sans safe-top safe-bottom">
      {isLoading && (
        <GameLoader 
          gameName={globalName || game.name} 
          provider={game.provider} 
          logo={globalLogo || game.image} 
        />
      )}
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-teal-900 border-b border-teal-800">
        <button onClick={onClose} className="text-white p-1 hover:bg-teal-800 rounded-full">
          <ArrowLeft size={24} />
        </button>
        <div className="text-center">
          <h3 className="text-white font-bold text-sm">{globalName || game.name}</h3>
          <span className="text-teal-300 text-[10px] uppercase tracking-widest">{game.provider}</span>
        </div>
        <div className="flex items-center gap-2 bg-black/40 px-3 py-1 rounded-full border border-white/10">
          <Wallet size={14} className="text-yellow-500" />
          <span className="text-white font-bold text-xs">৳ {userBalance.toLocaleString()}</span>
        </div>
      </div>

      {/* Slot Machine Area */}
      <div className="flex-1 relative bg-gray-900 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-xs bg-gradient-to-b from-gray-800 to-gray-900 rounded-3xl p-4 border-4 border-yellow-600 shadow-2xl relative">
          {/* Paylines indicators */}
          <div className="absolute -left-4 top-1/2 -translate-y-1/2 flex flex-col gap-8 text-[10px] font-bold text-yellow-500">
            <span>1</span>
            <span>2</span>
            <span>3</span>
          </div>

          {/* Reels Container */}
          <div className="bg-black rounded-xl p-2 grid grid-cols-3 gap-2 border-2 border-gray-700 overflow-hidden">
            {reels.map((reel, i) => (
              <Reel key={i} symbols={reel} isSpinning={isSpinning} />
            ))}
          </div>

          {/* Win Display */}
          <AnimatePresence>
            {showWin && (
              <motion.div 
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none"
              >
                <div className="bg-yellow-500 text-black px-8 py-4 rounded-full font-black text-2xl shadow-[0_0_50px_rgba(234,179,8,0.8)] border-4 border-white animate-bounce">
                  WIN: ৳ {winAmount}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Stats */}
        <div className="mt-8 grid grid-cols-2 gap-4 w-full max-w-xs">
          <div className="bg-gray-800 p-3 rounded-xl border border-white/5 text-center">
            <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Last Win</p>
            <p className="text-yellow-400 font-black">৳ {lastWin}</p>
          </div>
          <div className="bg-gray-800 p-3 rounded-xl border border-white/5 text-center">
            <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Bet</p>
            <p className="text-white font-black">৳ {betAmount}</p>
          </div>
        </div>

        {/* Recent Wins */}
        <div className="mt-6 w-full max-w-xs">
          <h4 className="text-[10px] text-gray-500 uppercase font-black mb-2 flex items-center gap-1">
            <Trophy size={10} className="text-yellow-500" />
            Recent Wins
          </h4>
          <div className="space-y-1.5">
            {recentWins.length > 0 ? recentWins.map((win, i) => (
              <motion.div 
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                key={i} 
                className="bg-black/30 border border-white/5 rounded-lg p-2 flex justify-between items-center"
              >
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                  <span className="text-xs text-white font-bold">৳ {win.amount}</span>
                </div>
                <span className="text-[9px] text-gray-500 font-mono">{win.time}</span>
              </motion.div>
            )) : (
              <div className="text-center py-4 border border-dashed border-white/10 rounded-lg">
                <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">No wins yet</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="p-4 bg-teal-950 border-t border-teal-900 flex flex-col gap-4">
        <div className="flex items-center justify-between gap-2">
          {[10, 50, 100, 500].map((amount) => (
            <button
              key={amount}
              onClick={() => setBetAmount(amount)}
              className={`flex-1 py-2 rounded-lg text-[10px] font-black border transition-all ${
                betAmount === amount 
                  ? 'bg-yellow-500 border-yellow-400 text-black' 
                  : 'bg-black/40 border-white/10 text-gray-400'
              }`}
            >
              ৳ {amount}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 bg-black/40 p-1.5 rounded-xl border border-white/10">
            <button 
              onClick={() => setBetAmount(prev => Math.max(10, prev - 10))}
              className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center text-white text-xl font-bold hover:bg-gray-700 active:scale-90 transition-all"
            >
              -
            </button>
            <div className="w-24 text-center">
              <span className="text-[9px] text-gray-500 uppercase font-black block leading-none mb-1">Bet Amount</span>
              <input 
                type="number"
                value={betAmount}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  if (!isNaN(val)) setBetAmount(Math.max(0, val));
                }}
                className="bg-transparent text-white font-black text-center w-full focus:outline-none text-lg"
              />
            </div>
            <button 
              onClick={() => setBetAmount(prev => prev + 10)}
              className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center text-white text-xl font-bold hover:bg-gray-700 active:scale-90 transition-all"
            >
              +
            </button>
          </div>

          <button 
            onClick={spin}
            disabled={isSpinning || userBalance < betAmount || betAmount <= 0}
            className={`flex-1 h-14 rounded-xl font-black text-lg flex items-center justify-center gap-3 transition-all shadow-lg ${
              isSpinning || userBalance < betAmount || betAmount <= 0
                ? 'bg-gray-800 text-gray-500 cursor-not-allowed' 
                : 'bg-gradient-to-b from-yellow-400 to-yellow-600 text-black hover:brightness-110 active:scale-95'
            }`}
          >
            {isSpinning ? (
              <RotateCcw className="animate-spin" />
            ) : (
              <>
                <Play className="fill-black" size={20} />
                SPIN
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
