import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '../../services/firebase';
import { collection, addDoc, serverTimestamp, doc, onSnapshot } from 'firebase/firestore';
import { 
  Plane, 
  TrendingUp, 
  History, 
  Users, 
  Settings, 
  HelpCircle, 
  ChevronDown, 
  Plus, 
  Minus,
  Wallet,
  Trophy,
  Activity,
  Zap,
  Clock,
  Menu,
  X
} from 'lucide-react';

interface AviatorGameProps {
  balance: number;
  onBalanceUpdate: (newBalance: number, persist?: boolean) => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  onClose: () => void;
  userData: any;
}

type GameState = 'waiting' | 'in_progress' | 'crashed';

export default function AviatorGame({ balance, onBalanceUpdate, showToast, onClose, userData }: AviatorGameProps) {
  const [gameState, setGameState] = useState<GameState>('waiting');
  const [multiplier, setMultiplier] = useState(1.00);
  const [betAmount, setBetAmount] = useState(10);
  const [isAutoBet, setIsAutoBet] = useState(false);
  const [autoCashOut, setAutoCashOut] = useState<number | null>(null);
  const [gameHistory, setGameHistory] = useState<number[]>([]);
  const [activeBets, setActiveBets] = useState<{ id: string; user: string; amount: number; cashOut?: number }[]>([]);
  const [currentBet, setCurrentBet] = useState<{ amount: number; cashedOut: boolean } | null>(null);
  const [nextGameTimer, setNextGameTimer] = useState(10);
  const [crashPoint, setCrashPoint] = useState(1.00);

  const requestRef = useRef<number>(null);
  const startTimeRef = useRef<number>(0);

  // Sound effects (simplified)
  const playSound = (type: 'win' | 'bet' | 'crash') => {
    // In a real app, we'd use audio files
    console.log(`Sound: ${type}`);
  };

  const balanceRef = useRef(balance);
  const currentBetRef = useRef(currentBet);
  const multiplierRef = useRef(multiplier);
  
  useEffect(() => {
    balanceRef.current = balance;
  }, [balance]);
  
  useEffect(() => {
    currentBetRef.current = currentBet;
  }, [currentBet]);

  useEffect(() => {
    multiplierRef.current = multiplier;
  }, [multiplier]);

  const logBet = async (betVal: number, winVal: number, multVal: number) => {
    if (!userData?.id) return;
    try {
      await addDoc(collection(db, 'bets'), {
        userId: userData.id,
        betAmount: betVal,
        winAmount: winVal,
        gameType: 'aviator',
        multiplier: multVal,
        symbols: ['plane'],
        createdAt: serverTimestamp()
      });
      console.log("Logged Aviator bet successfully in Firestore");
    } catch (err) {
      console.error("Error logging Aviator bet:", err);
    }
  };

  const handleCashOut = (multVal?: number) => {
    const activeMult = multVal || multiplierRef.current;
    const activeBet = currentBetRef.current;
    const activeBalance = balanceRef.current;

    if (!activeBet || activeBet.cashedOut) return;

    const winAmount = Math.floor(activeBet.amount * activeMult);
    onBalanceUpdate(activeBalance + winAmount);
    
    const updatedBet = { ...activeBet, cashedOut: true };
    setCurrentBet(updatedBet);
    currentBetRef.current = updatedBet;
    
    logBet(activeBet.amount, winAmount, activeMult);
    playSound('win');
    showToast(`৳${winAmount} উইন হয়েছেন! (${activeMult.toFixed(2)}x)`, "success");
  };

  // Subscribe to real-time multiplayer session updates using fast EventSource (SSE)
  useEffect(() => {
    console.log("[Aviator REST] Opening real-time stream via Server-Sent Events (SSE)...");
    const eventSource = new EventSource('/api/aviator/stream');

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (!data) return;

        const serverState = data.state || 'waiting';
        const serverMult = data.multiplier || 1.00;
        const serverTimer = data.timer || 0;
        const serverHistory = data.history || [];

        setGameState(serverState);
        setMultiplier(serverMult);
        setNextGameTimer(Math.max(0, Math.ceil(serverTimer)));
        setGameHistory(serverHistory);

        // Reactive cash out check for auto-cashout
        const activeBet = currentBetRef.current;
        if (serverState === 'in_progress' && activeBet && !activeBet.cashedOut) {
          if (autoCashOut && serverMult >= autoCashOut) {
            handleCashOut(serverMult);
          }
        }

        // Wipe current bet if game crashed
        if (serverState === 'crashed') {
          const activeBet = currentBetRef.current;
          if (activeBet && !activeBet.cashedOut) {
            logBet(activeBet.amount, 0, 0);
          }
          setCurrentBet(null);
          currentBetRef.current = null;
        }

        // Simulate some players list updating based on the round
        if (serverState === 'waiting') {
          setActiveBets(prev => {
            if (prev.length === 0) {
              return Array.from({ length: 4 + Math.floor(Math.random() * 8) }, (_, i) => ({
                id: `fake_${i}_${Date.now()}`,
                user: `Player_${Math.floor(1000 + Math.random() * 8999)}`,
                amount: [50, 100, 200, 500, 1000][Math.floor(Math.random() * 5)]
              }));
            }
            return prev;
          });
        } else if (serverState === 'in_progress') {
          // Randomly show fake cash outs
          setActiveBets(prev => 
            prev.map(b => {
              if (!b.cashOut && Math.random() < 0.05) {
                return { ...b, cashOut: Number((1.1 + Math.random() * (serverMult - 1.1)).toFixed(2)) };
              }
              return b;
            })
          );
        } else if (serverState === 'crashed') {
          setActiveBets([]);
        }
      } catch (err) {
        console.error("[Aviator Stream] Error parsing SSE payload:", err);
      }
    };

    eventSource.onerror = (error) => {
      console.warn("[Aviator Stream] Connection was fractured, SSE will auto-reconnect...", error);
    };

    return () => {
      console.log("[Aviator REST] Closing Server-Sent Events stream.");
      eventSource.close();
    };
  }, [autoCashOut]);

  const handlePlaceBet = () => {
    if (gameState !== 'waiting') {
      showToast("পরবর্তী গেমের জন্য অপেক্ষা করুন", "info");
      return;
    }
    if (balanceRef.current < betAmount) {
      showToast("আপনার ব্যালেন্স পর্যাপ্ত নয়", "error");
      return;
    }
    if (currentBetRef.current) return;

    const placedBet = { amount: betAmount, cashedOut: false };
    onBalanceUpdate(balanceRef.current - betAmount);
    setCurrentBet(placedBet);
    currentBetRef.current = placedBet;
    playSound('bet');
    showToast(`${betAmount} ৳ বেট প্লেস করা হয়েছে`, "success");
  };

  return (
    <div className="fixed inset-0 z-[150] bg-[#0d0d0d] flex flex-col font-sans select-none">
      {/* Header */}
      <div className="h-24 bg-[#1a1a1a] flex items-center justify-between px-6 border-b border-white/5">
        <div className="flex items-center gap-6">
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <Menu size={32} />
          </button>
          <div className="flex items-center gap-4">
             <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center text-white shadow-[0_0_30px_rgba(220,38,38,0.4)] overflow-hidden border border-white/10 ring-4 ring-red-600/20">
                <Plane size={44} className="transform rotate-[15deg] drop-shadow-lg" />
             </div>
             <div className="flex flex-col">
                <span className="text-3xl font-black text-white italic tracking-tighter uppercase leading-none">AVIATOR</span>
                <span className="text-xs font-bold text-red-500 uppercase tracking-[0.4em] mt-1 ml-0.5">SPRIBE GAMING</span>
             </div>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="bg-black/50 border border-white/10 px-4 py-2 rounded-2xl flex items-center gap-3 shadow-inner">
            <Wallet size={20} className="text-yellow-500" />
            <span className="text-base font-black text-white tracking-tight">৳ {balance.toLocaleString()}</span>
          </div>
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/5 rounded-full transition-all">
            <X size={24} />
          </button>
        </div>
      </div>

      {/* Main Game Area */}
      <div className="flex-1 flex flex-col p-2 gap-2 overflow-hidden">
        
        {/* Game Stats / History Bar */}
        <div className="flex overflow-x-auto gap-2 no-scrollbar py-1">
          {gameHistory.map((mult, i) => (
            <div 
              key={i} 
              className={`min-w-[60px] h-7 rounded-full flex items-center justify-center text-[10px] font-black border transition-all ${
                mult > 10 ? 'bg-purple-600/20 border-purple-500 text-purple-400' :
                mult > 2 ? 'bg-blue-600/20 border-blue-500 text-blue-400' :
                'bg-gray-800 border-white/10 text-gray-400'
              }`}
            >
              {mult.toFixed(2)}x
            </div>
          ))}
          {gameHistory.length === 0 && (
            <div className="text-[10px] text-gray-600 font-bold px-2 py-1">HISTORY LOADING...</div>
          )}
        </div>

        {/* Display Stage */}
        <div className="flex-1 bg-[#141414] rounded-2xl relative overflow-hidden flex flex-col border border-white/5">
           {/* Background Grid Lines */}
           <div className="absolute inset-0 opacity-10 pointer-events-none">
              <div className="w-full h-full" style={{ backgroundImage: 'linear-gradient(to right, #333 1px, transparent 1px), linear-gradient(to bottom, #333 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
           </div>

           {/* Game States */}
           <div className="flex-1 flex flex-col items-center justify-center relative z-10">
              
              {gameState === 'waiting' && (
                <div className="flex flex-col items-center gap-4">
                   <div className="w-16 h-16 rounded-full border-4 border-t-red-600 border-white/5 animate-spin" />
                   <div className="flex flex-col items-center">
                     <p className="text-xs font-black text-gray-500 uppercase tracking-widest">WAITING FOR NEXT ROUND</p>
                     <p className="text-3xl font-black text-white italic tracking-tighter mt-1">{nextGameTimer}s</p>
                   </div>
                </div>
              )}

              {gameState === 'in_progress' && (
                <div className="flex flex-col items-center justify-center">
                   <motion.h1 
                    key={multiplier}
                    initial={{ scale: 0.9 }}
                    animate={{ scale: 1 }}
                    className="text-6xl md:text-8xl font-black text-white italic tracking-tighter"
                   >
                     {multiplier.toFixed(2)}<span className="text-4xl md:text-5xl ml-1">x</span>
                   </motion.h1>
                   
                   {/* Animated Plane along a curve */}
                   <motion.div 
                    className="absolute"
                    animate={{ 
                      x: [0, 100, 200, 300, 400], 
                      y: [0, -20, -60, -120, -200],
                      rotate: [0, -5, -10, -15, -20]
                    }}
                    transition={{ duration: 15, ease: "linear" }}
                    style={{ left: '10%', bottom: '20%' }}
                   >
                      <div className="relative">
                         <div className="absolute inset-0 bg-red-600/50 blur-2xl rounded-full scale-150 animate-pulse" />
                         <Plane size={48} className="text-red-600 drop-shadow-[0_0_15px_rgba(220,38,38,0.5)] fill-red-600" />
                         
                         {/* Trail */}
                         <div className="absolute right-full top-1/2 w-40 h-20 origin-right -translate-y-1/2 overflow-hidden pointer-events-none">
                            <svg className="w-full h-full">
                               <motion.path 
                                d="M 160 40 Q 80 40 0 80"
                                fill="transparent"
                                stroke="rgba(220,38,38,0.3)"
                                strokeWidth="3"
                                strokeDasharray="5,5"
                               />
                            </svg>
                         </div>
                      </div>
                   </motion.div>
                </div>
              )}

              {gameState === 'crashed' && (
                <div className="flex flex-col items-center justify-center">
                   <p className="text-sm font-black text-red-500 uppercase tracking-widest mb-2 animate-bounce">FLEW AWAY!</p>
                   <h1 className="text-6xl md:text-8xl font-black text-red-600 italic tracking-tighter opacity-80">
                     {multiplier.toFixed(2)}x
                   </h1>
                </div>
              )}
           </div>

           {/* Graph Labels */}
           <div className="absolute left-4 bottom-4 flex flex-col gap-1 z-0">
             {[2.0, 1.5, 1.0].map(val => (
               <div key={val} className="text-[10px] font-bold text-gray-700">{val.toFixed(1)}x</div>
             ))}
           </div>
        </div>

        {/* Controls Area */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 h-auto max-h-[250px]">
           {/* Bet Control Panel */}
           <div className="bg-[#1a1a1a] rounded-2xl p-3 flex flex-col gap-3 border border-white/5 shadow-xl">
              <div className="flex items-center justify-between">
                 <div className="flex bg-black/40 rounded-full p-1 border border-white/5">
                    <button 
                      onClick={() => setIsAutoBet(false)}
                      className={`px-4 py-1 text-[10px] font-black rounded-full transition-all ${!isAutoBet ? 'bg-[#2a2a2a] text-white shadow-lg' : 'text-gray-500'}`}
                    >
                      BET
                    </button>
                    <button 
                      onClick={() => setIsAutoBet(true)}
                      className={`px-4 py-1 text-[10px] font-black rounded-full transition-all ${isAutoBet ? 'bg-[#2a2a2a] text-white shadow-lg' : 'text-gray-500'}`}
                    >
                      AUTO
                    </button>
                 </div>
                 
                 <div className="flex items-center gap-2">
                    <button className="text-gray-500 hover:text-white transition-colors"><Settings size={16} /></button>
                    <button className="text-gray-500 hover:text-white transition-colors"><HelpCircle size={16} /></button>
                 </div>
              </div>

              <div className="flex gap-2">
                 {/* Bet Amount Control */}
                 <div className="flex-1 flex flex-col gap-2">
                    <div className="flex items-center bg-black/60 rounded-xl p-1 border border-white/10 group focus-within:border-red-600/50 transition-all">
                       <button 
                        onClick={() => setBetAmount(Math.max(10, betAmount - 10))}
                        className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-white bg-[#2a2a2a] rounded-lg transition-colors shadow-inner"
                       >
                         <Minus size={18} />
                       </button>
                       <input 
                        type="number"
                        value={betAmount}
                        onChange={(e) => setBetAmount(Math.max(1, Number(e.target.value)))}
                        className="flex-1 bg-transparent text-center text-lg font-black text-white focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                       />
                       <button 
                        onClick={() => setBetAmount(betAmount + 10)}
                        className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-white bg-[#2a2a2a] rounded-lg transition-colors shadow-inner"
                       >
                         <Plus size={18} />
                       </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                       {[100, 200, 500, 1000].map(val => (
                         <button 
                          key={val}
                          onClick={() => setBetAmount(val)}
                          className="bg-[#2a2a2a] hover:bg-[#333] py-2 rounded-xl text-[10px] font-black text-gray-300 border border-white/5 transition-all shadow-md active:scale-95"
                         >
                           {val} ৳
                         </button>
                       ))}
                    </div>
                 </div>

                 {/* Action Button */}
                 <div className="flex-1">
                    {(!currentBet || currentBet.cashedOut) ? (
                      <button 
                        onClick={handlePlaceBet}
                        disabled={gameState === 'crashed' || (currentBet && !currentBet.cashedOut)}
                        className={`w-full h-full flex flex-col items-center justify-center rounded-2xl transition-all shadow-lg active:scale-95 border-b-4 ${
                          gameState === 'waiting' 
                            ? 'bg-gradient-to-b from-[#22c55e] to-[#15803d] border-[#14532d] shadow-green-500/10'
                            : 'bg-gradient-to-b from-gray-700 to-gray-800 border-gray-900 opacity-50 cursor-not-allowed'
                        }`}
                      >
                         <span className="text-xl font-black text-white italic tracking-tighter">BET</span>
                         <span className="text-[10px] font-black text-white/70 uppercase">PLACE BET</span>
                      </button>
                    ) : (
                      <button 
                        onClick={() => handleCashOut()}
                        disabled={gameState !== 'in_progress'}
                        className={`w-full h-full flex flex-col items-center justify-center rounded-2xl transition-all shadow-lg active:scale-95 border-b-4 ${
                          gameState === 'in_progress'
                            ? 'bg-gradient-to-b from-[#f59e0b] to-[#b45309] border-[#78350f] shadow-orange-500/20'
                            : 'bg-gray-700 border-gray-900 opacity-50 cursor-not-allowed'
                        }`}
                      >
                         <span className="text-sm font-black text-white/80 uppercase mb-1">CASH OUT</span>
                         <span className="text-xl font-black text-white italic tracking-tighter">
                           {(currentBet.amount * multiplier).toFixed(2)} ৳
                         </span>
                      </button>
                    )}
                 </div>
              </div>

              {isAutoBet && (
                <div className="flex items-center gap-2 pt-1 border-t border-white/5">
                   <div className="flex-1 flex items-center bg-black/40 rounded-xl px-3 py-2 border border-white/5">
                      <span className="text-[10px] font-black text-gray-500 uppercase mr-2 shrink-0">AUTO CASH OUT</span>
                      <input 
                        type="number"
                        placeholder="1.01x"
                        step="0.01"
                        onChange={(e) => setAutoCashOut(Number(e.target.value) || null)}
                        className="bg-transparent text-gray-200 text-sm font-bold focus:outline-none w-full"
                      />
                   </div>
                   <div className="w-12 h-10 rounded-xl bg-red-600/10 border border-red-600/20 flex items-center justify-center text-red-500">
                      <Zap size={18} />
                   </div>
                </div>
              )}
           </div>

           {/* Leaderboard / Bets Panel (Desktop only or scrollable) */}
           <div className="hidden md:flex bg-[#1a1a1a] rounded-2xl flex-col overflow-hidden border border-white/5 shadow-xl">
              <div className="bg-black/20 px-4 py-2 border-b border-white/5 flex items-center justify-between">
                 <div className="flex items-center gap-2">
                    <Users size={14} className="text-blue-500" />
                    <span className="text-[10px] font-black text-white uppercase">{activeBets.length} BETS</span>
                 </div>
                 <div className="text-[10px] font-black text-green-500 uppercase tracking-widest">LIVE</div>
              </div>
              <div className="flex-1 overflow-y-auto no-scrollbar p-2 space-y-1">
                 {activeBets.map((bet) => (
                    <div key={bet.id} className="flex items-center justify-between bg-black/20 rounded-lg p-2 border border-white/5">
                       <span className="text-[10px] font-bold text-gray-400">{bet.user}</span>
                       <div className="flex items-center gap-3">
                          <span className="text-[10px] font-black text-white">{bet.amount} ৳</span>
                          {bet.cashOut && (
                            <span className="text-[10px] font-black text-green-500 bg-green-500/10 px-1.5 py-0.5 rounded border border-green-500/20">
                              {bet.cashOut.toFixed(2)}x
                            </span>
                          )}
                       </div>
                    </div>
                 ))}
              </div>
           </div>
        </div>
      </div>

      {/* Footer Nav (Mobile) */}
      <div className="h-14 bg-[#1a1a1a] md:hidden flex items-center justify-around border-t border-white/5">
         <button className="flex flex-col items-center gap-1 text-red-600">
            <Activity size={20} />
            <span className="text-[8px] font-black uppercase">GAME</span>
         </button>
         <button className="flex flex-col items-center gap-1 text-gray-500 hover:text-white transition-colors">
            <Trophy size={20} />
            <span className="text-[8px] font-black uppercase">HISTORY</span>
         </button>
         <button className="flex flex-col items-center gap-1 text-gray-500 hover:text-white transition-colors">
            <TrendingUp size={20} />
            <span className="text-[8px] font-black uppercase">MY BETS</span>
         </button>
         <button className="flex flex-col items-center gap-1 text-gray-500 hover:text-white transition-colors">
            <Users size={20} />
            <span className="text-[8px] font-black uppercase">PLAYERS</span>
         </button>
      </div>

      {/* Styles for marquee and custom elements */}
      <style dangerouslySetInnerHTML={{ __html: `
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
}
