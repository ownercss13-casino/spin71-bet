import React, { useState, useEffect, useRef } from 'react';
import { useLiveAviator } from '../hooks/useLiveAviator';
import GameLoader from './GameLoader';
import { ArrowLeft, Wallet, Play, X, History, Users, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GAME_IMAGES } from '../constants/gameAssets';

interface AviatorGameProps {
  onClose: () => void;
  userBalance: number;
  onBalanceUpdate: (newBalance: number) => void;
  logo?: string | null;
  onLogoChange?: (newLogo: string) => void;
  showToast: (msg: string, type?: any) => void;
  referredBy?: string | null;
  globalName?: string;
  userData?: any;
}

export default function AviatorGame({ onClose, userBalance, onBalanceUpdate, logo, onLogoChange, showToast, referredBy, globalName, userData }: AviatorGameProps) {
  const [isLoading, setIsLoading] = useState(true);
  const IS_BETTING_DISABLED = false;

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);
  const { session } = useLiveAviator();
  const [multiplier, setMultiplier] = useState(1.00);
  const [isFlying, setIsFlying] = useState(false);
  const [hasCrashed, setHasCrashed] = useState(false);
  const [betAmount, setBetAmount] = useState(100);
  const [betAmount2, setBetAmount2] = useState(100);
  const [betError, setBetError] = useState<string | null>(null);
  const [isBetPlaced, setIsBetPlaced] = useState(false);
  const [isBetPlaced2, setIsBetPlaced2] = useState(false);
  const [isCashedOut, setIsCashedOut] = useState(false);
  const [isCashedOut2, setIsCashedOut2] = useState(false);
  const [isAutoBet, setIsAutoBet] = useState(false);
  const [isAutoBet2, setIsAutoBet2] = useState(false);
  const [isAutoCashOut, setIsAutoCashOut] = useState(false);
  const [isAutoCashOut2, setIsAutoCashOut2] = useState(false);
  const [autoCashOutValue, setAutoCashOutValue] = useState(2.00);
  const [autoCashOutValue2, setAutoCashOutValue2] = useState(2.00);
  const [cashOutMultiplier, setCashOutMultiplier] = useState(0);
  const [cashOutMultiplier2, setCashOutMultiplier2] = useState(0);
  const [history, setHistory] = useState<number[]>([]);
  const [showFullHistory, setShowFullHistory] = useState(false);
  const [gamePhase, setGamePhase] = useState<'betting' | 'flying' | 'crashed'>('betting');
  const [bettingCountdown, setBettingCountdown] = useState(5);
  const [parallaxOffset, setParallaxOffset] = useState({ x: 0, y: 0 });
  const [betHistory, setBetHistory] = useState<{
    multiplier: number;
    amount: number;
    win: number;
    isWin: boolean;
  }[]>([]);
  const [liveBets, setLiveBets] = useState<{ id: number; name: string; amount: number; cashedOut: boolean; cashOutMultiplier?: number }[]>([]);
  const [justPlacedBet, setJustPlacedBet] = useState(false);
  const [showSecondBet, setShowSecondBet] = useState(false);
  
  const multiplierRef = useRef(1.00);

  // Sync with shared session
  useEffect(() => {
    if (!session) return;

    setMultiplier(session.multiplier);
    setHistory(session.history || []);
    
    if (session.status === 'waiting') {
      setGamePhase('betting');
      setIsFlying(false);
      setHasCrashed(false);
      
      // Calculate countdown based on startTime
      const now = Date.now();
      const startTime = session.startTime || now;
      const diff = Math.max(0, 8 - Math.floor((now - startTime) / 1000));
      setBettingCountdown(diff);
      
      // Reset for new round
      if (gamePhase !== 'betting') {
        setIsCashedOut(false);
        setIsCashedOut2(false);
        setCashOutMultiplier(0);
        setCashOutMultiplier2(0);
        setIsBetPlaced(false);
        setIsBetPlaced2(false);
      }
    } else if (session.status === 'running') {
      setGamePhase('flying');
      setIsFlying(true);
      setHasCrashed(false);
      
      // Initial sync from session
      setMultiplier(session.multiplier);
    } else if (session.status === 'crashed') {
      setGamePhase('crashed');
      setIsFlying(false);
      setHasCrashed(true);
      setMultiplier(session.multiplier); // Ensure it shows the crash point
    }
  }, [session, gamePhase]);

  // Local multiplier calculation for smooth animation
  useEffect(() => {
    if (gamePhase !== 'flying' || !isFlying || !session || hasCrashed) return;

    const interval = setInterval(() => {
      const now = new Date();
      const startTimeTimestamp = session.startTime;
      const startTime = (startTimeTimestamp && typeof startTimeTimestamp === 'number') 
        ? new Date(startTimeTimestamp) 
        : now;
      const elapsed = (now.getTime() - startTime.getTime()) / 1000;
      
      // Aviator multiplier formula: 1.00 * e^(0.1 * t)
      // Matching the controller's 1.06^elapsed
      const currentMultiplier = Number(Math.pow(1.06, elapsed).toFixed(2));
      
      // Don't go beyond crash point if we know it (though usually we don't until it crashes)
      if (session.status === 'running') {
        setMultiplier(currentMultiplier);
      }
    }, 50); // Update every 50ms for smooth animation

    return () => clearInterval(interval);
  }, [gamePhase, isFlying, session, hasCrashed]);

  useEffect(() => {
    multiplierRef.current = multiplier;
  }, [multiplier]);

  useEffect(() => {
    if (gamePhase === 'betting') {
      const newBets = Array.from({ length: 12 }, (_, i) => ({
        id: Date.now() + i,
        name: `Player_${Math.floor(Math.random() * 9000) + 1000}`,
        amount: Math.floor(Math.random() * 500) + 10,
        cashedOut: false,
      }));
      setLiveBets(newBets);
    } else if (gamePhase === 'flying' && isFlying) {
      const interval = setInterval(() => {
        setLiveBets(prev => prev.map(bet => {
          if (!bet.cashedOut && Math.random() > 0.95) {
            return { ...bet, cashedOut: true, cashOutMultiplier: multiplierRef.current };
          }
          return bet;
        }));
      }, 500);
      return () => clearInterval(interval);
    }
  }, [gamePhase, isFlying]);

  useEffect(() => {
    if (betAmount <= 0) {
      setBetError("Bet must be positive");
    } else if (betAmount > userBalance) {
      setBetError("Insufficient balance");
    } else {
      setBetError(null);
    }
  }, [betAmount, userBalance]);

  // Parallax Effect
  useEffect(() => {
    if (gamePhase === 'flying' && isFlying) {
      const interval = setInterval(() => {
        setParallaxOffset(prev => ({
          x: (prev.x - 0.2) % 100,
          y: (prev.y + 0.1) % 100
        }));
      }, 50);
      return () => clearInterval(interval);
    } else if (gamePhase === 'betting') {
      setParallaxOffset({ x: 0, y: 0 });
    }
  }, [gamePhase, isFlying]);

  const placeBet = React.useCallback((isSecond = false) => {
    const amount = isSecond ? betAmount2 : betAmount;
    const isPlaced = isSecond ? isBetPlaced2 : isBetPlaced;
    const setIsPlaced = isSecond ? setIsBetPlaced2 : setIsBetPlaced;

    if (IS_BETTING_DISABLED) {
      showToast('বেটিং সাময়িকভাবে বন্ধ আছে!', 'info');
      return;
    }
    if (gamePhase !== 'betting') {
      showToast('বেটিং সময় শেষ!', 'error');
      return;
    }
    if (amount <= 0) {
      showToast('সঠিক বেট অ্যামাউন্ট দিন!', 'error');
      return;
    }
    if (userBalance < amount) {
      showToast('পর্যাপ্ত ব্যালেন্স নেই!', 'error');
      return;
    }
    if (isPlaced) {
      showToast('বেট ইতিমধ্যেই প্লেস করা হয়েছে!', 'info');
      return;
    }

    onBalanceUpdate(userBalance - amount);
    setIsPlaced(true);
    setJustPlacedBet(true);
    setTimeout(() => setJustPlacedBet(false), 1000);

    showToast('বেট সফলভাবে প্লেস করা হয়েছে!', 'success');
  }, [gamePhase, userBalance, betAmount, betAmount2, isBetPlaced, isBetPlaced2, onBalanceUpdate, showToast]);

  const cashOut = React.useCallback((isSecond = false) => {
    const isPlaced = isSecond ? isBetPlaced2 : isBetPlaced;
    const isCashed = isSecond ? isCashedOut2 : isCashedOut;
    const setIsCashed = isSecond ? setIsCashedOut2 : setIsCashedOut;
    const setIsPlaced = isSecond ? setIsBetPlaced2 : setIsBetPlaced;
    const amount = isSecond ? betAmount2 : betAmount;
    const setMult = isSecond ? setCashOutMultiplier2 : setCashOutMultiplier;

    if (!isPlaced || isCashed || hasCrashed || gamePhase !== 'flying') return;
    
    const winAmount = amount * multiplier;
    setIsCashed(true);
    setIsPlaced(false);
    setMult(multiplier);
    onBalanceUpdate(userBalance + winAmount);
    showToast(`আপনি ৳ ${winAmount.toFixed(2)} জিতেছেন! (${multiplier.toFixed(2)}x)`, 'success');
    
    setBetHistory(prev => [
      {
        multiplier: multiplier,
        amount: amount,
        win: winAmount,
        isWin: true
      },
      ...prev.slice(0, 9)
    ]);

    setTimeout(() => {
      setIsCashed(false);
    }, 2000);
  }, [isBetPlaced, isBetPlaced2, isCashedOut, isCashedOut2, hasCrashed, gamePhase, betAmount, betAmount2, multiplier, onBalanceUpdate, userBalance]);

  // Auto Bet and Cashout logic
  useEffect(() => {
    if (gamePhase === 'betting' && isAutoBet && !isBetPlaced) placeBet(false);
    if (gamePhase === 'betting' && isAutoBet2 && !isBetPlaced2) placeBet(true);
  }, [gamePhase, isAutoBet, isAutoBet2, isBetPlaced, isBetPlaced2, placeBet]);

  useEffect(() => {
    if (isAutoCashOut && isBetPlaced && !isCashedOut && isFlying && multiplier >= autoCashOutValue) {
      cashOut(false);
    }
    if (isAutoCashOut2 && isBetPlaced2 && !isCashedOut2 && isFlying && multiplier >= autoCashOutValue2) {
      cashOut(true);
    }
  }, [multiplier, isAutoCashOut, isAutoCashOut2, isBetPlaced, isBetPlaced2, isCashedOut, isCashedOut2, isFlying, autoCashOutValue, autoCashOutValue2, cashOut]);

  // Handle crash for bet history reset
  useEffect(() => {
    if (gamePhase === 'crashed') {
      if (isBetPlaced && !isCashedOut) {
        setBetHistory(prev => [{ multiplier, amount: betAmount, win: 0, isWin: false }, ...prev.slice(0, 9)]);
        setIsBetPlaced(false);
      }
      if (isBetPlaced2 && !isCashedOut2) {
        setBetHistory(prev => [{ multiplier, amount: betAmount2, win: 0, isWin: false }, ...prev.slice(0, 9)]);
        setIsBetPlaced2(false);
      }
    }
  }, [gamePhase, isBetPlaced, isBetPlaced2, isCashedOut, isCashedOut2, multiplier, betAmount, betAmount2]);

  return (
    <div 
      className="full-display-game flex flex-col font-sans select-none safe-top safe-bottom"
      onContextMenu={(e) => e.preventDefault()}
      onCopy={(e) => e.preventDefault()}
      style={{ touchAction: 'none' }}
    >
      {isLoading && (
        <GameLoader 
          gameName={globalName || 'AVIATOR'} 
          provider="SPRIBE" 
          logo={logo || undefined} 
        />
      )}
      {/* Header */}
      <div className="flex items-center justify-between p-3 bg-[#1b1b1b] border-b border-white/5">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="text-gray-400 hover:text-white p-1">
            <ArrowLeft size={20} />
          </button>
          <div 
            className="relative cursor-pointer group" 
            onClick={() => {
              if (onLogoChange) {
                const newUrl = window.prompt("নতুন লোগোর URL দিন (Enter new logo URL):", logo || "");
                if (newUrl && newUrl.trim() !== "") {
                  onLogoChange(newUrl.trim());
                }
              }
            }}
          >
            {logo ? (
              <img src={logo} className="w-8 h-8 rounded-full border border-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.6)] group-hover:opacity-80 transition-opacity" alt="Aviator Logo" />
            ) : (
              <svg width="32" height="32" viewBox="0 0 24 24" className="drop-shadow-[0_0_8px_rgba(250,204,21,0.6)] group-hover:opacity-80 transition-opacity">
                <defs>
                  <linearGradient id="goldLogo" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#fef08a" />
                    <stop offset="50%" stopColor="#eab308" />
                    <stop offset="100%" stopColor="#a16207" />
                  </linearGradient>
                </defs>
                <path 
                  d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" 
                  fill="url(#goldLogo)"
                  stroke="#fff"
                  strokeWidth="0.5"
                />
              </svg>
            )}
            <div className="absolute -top-1 -right-1 bg-red-600 text-white text-[6px] font-bold px-1 rounded-sm border border-yellow-400">VIP</div>
          </div>
          <div className="flex flex-col">
            <span className="bg-gradient-to-r from-yellow-200 via-yellow-400 to-yellow-600 text-transparent bg-clip-text font-black italic text-sm tracking-tighter">{globalName || 'CRASH GAME'}</span>
            <span className="text-[9px] text-gray-500 uppercase tracking-widest leading-none">GOLDEN VIP</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-black/40 px-3 py-1 rounded-full border border-white/10">
            <Wallet size={14} className="text-yellow-500" />
            <span className="text-white font-bold text-xs">৳ {userBalance.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Multiplier History Bar */}
      <div className="px-3 py-2 bg-[#141414] border-b border-white/5">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">ইতিহাস (History)</span>
            <button 
              onClick={() => setShowFullHistory(true)}
              className="p-1 bg-white/5 rounded hover:bg-white/10 transition-colors"
            >
              <History size={10} className="text-teal-500" />
            </button>
          </div>
          <div className="flex gap-2 text-[8px] text-gray-600">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-gray-600"></span> Low</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-600"></span> Med</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-600"></span> High</span>
          </div>
        </div>
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
          {history.length === 0 ? (
            <div className="text-[10px] text-gray-600 italic py-1">No history yet...</div>
          ) : (
            history.map((val, i) => {
              const tier = val < 1.5 ? 'low' : val < 3.0 ? 'medium' : 'high';
              const colorClass = tier === 'low' ? 'text-gray-400 border-gray-800' : tier === 'medium' ? 'text-yellow-400 border-yellow-800' : 'text-green-400 border-green-800';
              const bgClass = tier === 'low' ? 'bg-gray-900/30' : tier === 'medium' ? 'bg-yellow-900/30' : 'bg-green-900/30';
              
              return (
                <div 
                  key={i} 
                  className={`px-2 py-1 rounded-md text-[10px] font-bold shrink-0 flex flex-col items-center gap-1 border ${colorClass} ${bgClass} animate-in slide-in-from-right-2 duration-300`}
                >
                  <span>{val.toFixed(2)}x</span>
                  <div className="w-full h-0.5 bg-black/20 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${tier === 'low' ? 'bg-gray-600' : tier === 'medium' ? 'bg-yellow-600' : 'bg-green-600'}`} style={{ width: `${Math.min(100, (val / 5) * 100)}%` }}></div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Main Game Area */}
      <div className={`flex-1 relative bg-[#0b0b0b] flex flex-col overflow-hidden transition-all duration-300 ${hasCrashed ? 'animate-[shake_0.5s_ease-in-out]' : ''}`}>
        {/* Real Background Image */}
        <img 
          src={GAME_IMAGES.CRASH_GAME} 
          className={`absolute inset-0 w-[120%] h-[120%] -left-[10%] -top-[10%] object-cover pointer-events-none transition-opacity duration-500 ${hasCrashed ? 'opacity-40 mix-blend-multiply grayscale blur-md scale-110' : 'opacity-30 mix-blend-overlay'}`}
          style={{ 
            transform: `translate(${parallaxOffset.x}px, ${parallaxOffset.y}px) scale(${isFlying ? 1.1 : 1})`,
            transition: hasCrashed ? 'all 0.5s ease-out' : 'transform 0.1s linear, opacity 0.5s ease'
          }}
          alt="Game Background"
          referrerPolicy="no-referrer"
        />
        
        {/* Vignette Effect */}
        <div className={`absolute inset-0 z-10 pointer-events-none transition-all duration-1000 ${isFlying ? 'shadow-[inset_0_0_150px_rgba(0,0,0,0.8)]' : 'shadow-[inset_0_0_50px_rgba(0,0,0,0.5)]'}`}></div>

        {/* Crash Flash Effect */}
        {hasCrashed && (
          <>
            <div className="absolute inset-0 z-50 bg-white animate-flash pointer-events-none"></div>
            <div className="absolute inset-0 z-40 bg-red-600/40 animate-pulse pointer-events-none"></div>
            <div className="absolute inset-0 z-40 shadow-[inset_0_0_150px_rgba(239,68,68,0.7)] pointer-events-none"></div>
            
            {/* Cracked Screen Overlay */}
            <div className="absolute inset-0 z-50 pointer-events-none opacity-40 mix-blend-overlay animate-in fade-in duration-100">
              <svg viewBox="0 0 100 100" className="w-full h-full stroke-white/30 fill-none" strokeWidth="0.5">
                <path d="M0,20 L30,40 L10,70 M30,40 L60,30 L90,50 M60,30 L50,0 M10,70 L40,90 L80,70 M40,90 L20,100 M80,70 L100,80 M80,70 L70,100" />
                <path d="M50,50 L55,45 L65,48 L70,40 M55,45 L52,35 M65,48 L75,55" />
              </svg>
            </div>

            {/* Explosion Particles */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none">
              {[...Array(20)].map((_, i) => (
                <div 
                  key={i}
                  className="absolute w-3 h-3 bg-gradient-to-br from-red-500 to-orange-500 rounded-full animate-particle"
                  style={{
                    '--tx': `${(Math.random() - 0.5) * 400}px`,
                    '--ty': `${(Math.random() - 0.5) * 400}px`,
                    '--delay': `${Math.random() * 0.1}s`
                  } as any}
                ></div>
              ))}
            </div>

            {/* Static Noise Effect */}
            <div className="absolute inset-0 z-50 pointer-events-none opacity-20 mix-blend-screen animate-static-noise"></div>

            {/* Dramatic "CRASH" Text */}
            <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none">
              <span className="text-8xl font-black text-white/10 italic uppercase tracking-tighter animate-crash-text">CRASH</span>
            </div>
          </>
        )}

        {/* Grid Background */}
        <div className={`absolute inset-0 opacity-10 transition-all duration-1000 ${isFlying ? 'blur-[0.5px]' : ''}`} style={{
          backgroundImage: 'linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }}></div>

        {/* Decorative Clouds */}
        {gamePhase === 'flying' && !hasCrashed && (
          <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
            <motion.div
              initial={{ x: '120%' }}
              animate={{ x: '-50%' }}
              transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
              className="absolute top-[20%] opacity-20"
            >
              <div className="w-48 h-12 bg-white rounded-full blur-2xl"></div>
            </motion.div>
            <motion.div
              initial={{ x: '150%' }}
              animate={{ x: '-60%' }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear", delay: 5 }}
              className="absolute top-[50%] opacity-10"
            >
              <div className="w-64 h-16 bg-white rounded-full blur-3xl"></div>
            </motion.div>
            <motion.div
              initial={{ x: '130%' }}
              animate={{ x: '-40%' }}
              transition={{ duration: 12, repeat: Infinity, ease: "linear", delay: 2 }}
              className="absolute top-[70%] opacity-15"
            >
              <div className="w-40 h-10 bg-white rounded-full blur-xl"></div>
            </motion.div>
          </div>
        )}

        {/* Speed Lines */}
        {gamePhase === 'flying' && !hasCrashed && (
          <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
            {[...Array(6)].map((_, i) => (
              <div 
                key={i}
                className="absolute h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent animate-speed-line"
                style={{
                  top: `${20 + i * 15}%`,
                  width: `${100 + Math.random() * 100}px`,
                  left: '-200px',
                  animationDelay: `${Math.random() * 2}s`,
                  animationDuration: `${0.5 + Math.random() * 0.5}s`
                } as any}
              ></div>
            ))}
          </div>
        )}

        {/* Multiplier Display */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 text-center w-full px-4">
          <AnimatePresence mode="wait">
            {gamePhase === 'betting' ? (
              <motion.div 
                key="betting"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.1 }}
                className="flex flex-col items-center"
              >
                <span className="text-gray-400 text-[10px] uppercase font-black tracking-[0.3em] mb-4 drop-shadow-lg">WAITING FOR NEXT ROUND</span>
                <div className="relative w-28 h-28 flex items-center justify-center">
                  <svg className="absolute inset-0 w-full h-full -rotate-90 drop-shadow-[0_0_15px_rgba(239,68,68,0.3)]">
                    <circle cx="56" cy="56" r="52" fill="transparent" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
                    <motion.circle 
                      cx="56" cy="56" r="52" fill="transparent" stroke="#ef4444" strokeWidth="6" 
                      strokeDasharray={326}
                      initial={{ strokeDashoffset: 326 }}
                      animate={{ strokeDashoffset: 326 - (326 * bettingCountdown / 5) }}
                      transition={{ duration: 1, ease: "linear" }}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="flex flex-col items-center justify-center">
                    <span className="text-4xl font-black text-white drop-shadow-lg">{bettingCountdown}</span>
                    <span className="text-[8px] font-bold text-red-500 uppercase tracking-widest">SECONDS</span>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="flying"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`flex flex-col items-center transition-all duration-500 ${hasCrashed ? 'scale-125' : 'scale-100'}`}
              >
                {!hasCrashed ? (
                  <div className="relative">
                    <motion.h1 
                      className={`text-7xl md:text-8xl font-black italic tracking-tighter drop-shadow-[0_0_40px_rgba(255,255,255,0.4)] transition-colors duration-300 ${isFlying ? 'text-white' : 'text-gray-400'}`}
                    >
                      {multiplier.toFixed(2)}x
                    </motion.h1>
                    {isFlying && (
                      <div className="absolute -inset-4 bg-white/5 blur-3xl -z-10 animate-pulse"></div>
                    )}
                  </div>
                ) : (
                  <motion.div 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="flex flex-col items-center"
                  >
                    <div className="relative group">
                      <span className="text-red-500 font-black text-5xl md:text-6xl uppercase tracking-tighter italic drop-shadow-[0_0_30px_rgba(239,68,68,0.9)] animate-bounce">FLEW AWAY!</span>
                      <div className="absolute -inset-4 bg-red-600/30 blur-2xl -z-10 animate-pulse"></div>
                    </div>
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5 }}
                      className="mt-6 flex flex-col items-center gap-2"
                    >
                      <div className="text-white/60 font-black text-2xl italic tracking-tight">
                        at {multiplier.toFixed(2)}x
                      </div>
                      <div className="px-6 py-2 bg-red-600/20 border border-red-500/30 rounded-full backdrop-blur-md shadow-lg">
                        <span className="text-red-400 text-[10px] font-black uppercase tracking-[0.3em] animate-pulse">Preparing next flight...</span>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Plane and Graph Animation */}
        {(gamePhase === 'flying' || hasCrashed) && (
          <div className={`absolute inset-0 z-10 pointer-events-none transition-opacity duration-1000 ${hasCrashed ? 'opacity-0' : 'opacity-100'}`}>
            <div 
              className={`absolute ${hasCrashed ? 'animate-[crash-plane_1s_ease-in_forwards]' : ''}`} 
              style={{ 
                bottom: '40%', 
                right: '20%',
                animation: !hasCrashed ? `fly-aviator ${Math.max(0.4, 1.5 / Math.pow(multiplier, 0.3))}s cubic-bezier(0.42, 0, 0.58, 1) infinite` : undefined
              }}
            >
              <div className="relative">
                {/* Smoke Trail */}
                <div className={`absolute right-full top-1/2 -translate-y-1/2 w-48 h-2 bg-gradient-to-l from-red-500/40 to-transparent blur-md transform origin-right rotate-12 ${hasCrashed ? 'animate-pulse' : ''} ${isFlying ? 'blur-[2px]' : ''}`}></div>
                
                {/* Stylized Anime Plane or Custom Logo */}
                <div className="relative transform -rotate-12">
                  {logo ? (
                    <img 
                      src={logo} 
                      className={`w-24 h-24 object-contain drop-shadow-[0_0_30px_rgba(239,68,68,0.6)] ${hasCrashed ? 'brightness-50' : ''} ${isFlying ? 'blur-[0.5px] animate-chromatic' : ''}`}
                      alt="Custom Aviator Logo"
                    />
                  ) : (
                    <svg 
                      viewBox="-20 0 140 80" 
                      className={`w-40 h-24 drop-shadow-[0_0_30px_rgba(239,68,68,0.6)] ${hasCrashed ? 'brightness-50' : ''} ${isFlying ? 'blur-[0.5px] animate-chromatic' : ''}`}
                    >
                      <defs>
                        <linearGradient id="planeBodyGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#ff4d4d" />
                          <stop offset="100%" stopColor="#990000" />
                        </linearGradient>
                        <linearGradient id="wingGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#ff6666" />
                          <stop offset="100%" stopColor="#cc0000" />
                        </linearGradient>
                        <linearGradient id="thrustGrad" x1="100%" y1="0%" x2="0%" y2="0%">
                          <stop offset="0%" stopColor="#fbbf24" />
                          <stop offset="50%" stopColor="#ea580c" />
                          <stop offset="100%" stopColor="transparent" />
                        </linearGradient>
                        <filter id="glow">
                          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                          <feMerge>
                            <feMergeNode in="coloredBlur"/>
                            <feMergeNode in="SourceGraphic"/>
                          </feMerge>
                        </filter>
                      </defs>
                      
                      {/* Engine Thrust */}
                      {isFlying && !hasCrashed && (
                        <path 
                          d="M10,38 Q-20,40 10,42 Z" 
                          fill="url(#thrustGrad)" 
                          style={{
                            transformOrigin: '10px 40px',
                            transform: `scaleX(${Math.min(4, 1 + (multiplier - 1) * 0.5)})`,
                            transition: 'transform 0.1s linear'
                          }}
                          className="animate-pulse"
                        />
                      )}

                      {/* Main Body - Sleek Anime Shape */}
                      <path 
                        d="M10,40 Q30,35 60,35 L100,38 L110,40 L100,42 L60,45 Q30,45 10,40 Z" 
                        fill="url(#planeBodyGrad)" 
                        stroke="#fff" 
                        strokeWidth="1.5"
                      />
                      
                      {/* Cockpit */}
                      <path 
                        d="M45,35 Q55,25 75,35 Z" 
                        fill="#87ceeb" 
                        stroke="#fff" 
                        strokeWidth="1"
                        opacity="0.9"
                      />
                      
                      {/* Main Wing */}
                      <path 
                        d="M40,40 L20,65 L50,65 L70,40 Z" 
                        fill="url(#wingGrad)" 
                        stroke="#fff" 
                        strokeWidth="1.5"
                        style={{
                          transformOrigin: '40px 40px',
                          animation: isFlying && !hasCrashed ? `wing-flap ${Math.max(0.05, 0.2 - (multiplier - 1) * 0.01)}s infinite alternate` : 'none'
                        }}
                      />
                      
                      {/* Tail Wing */}
                      <path 
                        d="M15,40 L5,25 L25,25 L30,40 Z" 
                        fill="url(#wingGrad)" 
                        stroke="#fff" 
                        strokeWidth="1.5"
                      />
                      
                      {/* Propeller Hub */}
                      <circle cx="110" cy="40" r="3" fill="#333" stroke="#fff" strokeWidth="1" />
                      
                      {/* Rotating Propeller */}
                      {!hasCrashed && (
                        <motion.g
                          animate={{ rotate: [0, 360] }}
                          transition={{ 
                            duration: Math.max(0.05, 0.2 - (multiplier - 1) * 0.05), 
                            repeat: Infinity, 
                            ease: "linear" 
                          }}
                          style={{ originX: '110px', originY: '40px' }}
                        >
                          <path 
                            d="M110,25 L110,55 M95,40 L125,40" 
                            stroke="#fff" 
                            strokeWidth="2" 
                            opacity="0.6" 
                            strokeLinecap="round"
                          />
                        </motion.g>
                      )}
                      
                      {/* Speed Lines on Plane */}
                      <line x1="20" y1="38" x2="40" y2="38" stroke="#fff" strokeWidth="1" opacity="0.5" />
                      <line x1="25" y1="42" x2="45" y2="42" stroke="#fff" strokeWidth="1" opacity="0.5" />
                    </svg>
                  )}

                  {/* VIP Tag Overlay */}
                  <div className="absolute -top-2 -left-2 bg-gradient-to-r from-yellow-400 to-yellow-600 text-black text-[10px] font-black px-2 py-0.5 rounded-sm shadow-lg transform -rotate-12 border border-yellow-300 animate-pulse">
                    VIP
                  </div>

                  {/* LIVE Indicator */}
                  <div className="absolute top-0 -right-4 flex items-center gap-1 bg-black/60 backdrop-blur-sm px-1.5 py-0.5 rounded-full border border-red-500/50">
                    <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping"></div>
                    <span className="text-[8px] font-black text-white tracking-tighter">LIVE</span>
                  </div>
                </div>
              </div>
            </div>
            {!hasCrashed && (
              <svg className="w-full h-full">
                <path 
                  d={`M 0 ${window.innerHeight * 0.6} Q ${window.innerWidth * 0.4} ${window.innerHeight * 0.6} ${window.innerWidth * 0.8} ${window.innerHeight * 0.3}`}
                  fill="none"
                  stroke="url(#lineGradient)"
                  strokeWidth="4"
                  strokeLinecap="round"
                  className={`animate-[dash_2s_linear_infinite] ${isFlying ? 'blur-[0.5px]' : ''}`}
                  style={{ strokeDasharray: '10, 10' }}
                />
                <defs>
                  <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="transparent" />
                    <stop offset="100%" stopColor="#ef4444" />
                  </linearGradient>
                </defs>
              </svg>
            )}
            
            {/* Plane Icon */}
            {!hasCrashed && (
              <div className={`absolute top-[30%] right-[15%] transform -translate-y-1/2 animate-float ${isFlying ? 'blur-[0.5px] animate-chromatic' : ''}`}>
                 <svg width="60" height="40" viewBox="0 0 24 24" className="drop-shadow-[0_0_15px_rgba(250,204,21,0.8)]">
                    <path 
                      d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" 
                      fill="url(#planeGradGame)"
                    />
                 </svg>
                 {/* Engine Flame */}
                 <div className={`absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-1 bg-yellow-400 blur-sm animate-pulse ${isFlying ? 'blur-[1px]' : ''}`}></div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Betting Controls */}
      <div className="p-4 bg-[#1b1b1b] border-t border-white/10 space-y-4 relative shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
        {/* Multi-bet Toggle Button */}
        <motion.button 
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowSecondBet(!showSecondBet)}
          className="absolute -top-5 right-6 w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-[0_4px_15px_rgba(34,197,94,0.4)] border-2 border-[#1b1b1b] z-50 transition-all"
        >
          {showSecondBet ? <X size={20} className="text-black" /> : <span className="text-black font-black text-2xl">+</span>}
        </motion.button>

        {/* First Bet Panel */}
        <div className="space-y-4">
          {/* Auto Controls Row */}
          <div className="flex gap-2">
            <button 
              onClick={() => setIsAutoBet(!isAutoBet)}
              className={`flex-1 py-1.5 rounded-lg text-[9px] font-black tracking-widest transition-all duration-300 border ${
                isAutoBet 
                  ? 'bg-blue-500/20 border-blue-500 text-blue-400' 
                  : 'bg-black/40 border-white/5 text-gray-500'
              }`}
            >
              AUTO BET
            </button>
            <div className={`flex-[1.5] flex items-center justify-between px-2 py-1.5 rounded-lg border transition-all duration-300 ${
              isAutoCashOut 
                ? 'bg-orange-500/20 border-orange-500' 
                : 'bg-black/40 border-white/5'
            }`}>
              <button 
                onClick={() => setIsAutoCashOut(!isAutoCashOut)}
                className={`text-[9px] font-black tracking-widest ${isAutoCashOut ? 'text-orange-400' : 'text-gray-500'}`}
              >
                AUTO CASH OUT
              </button>
              <div className="flex items-center gap-1">
                <input 
                  type="number" 
                  step="0.1"
                  min="1.1"
                  value={autoCashOutValue}
                  onChange={(e) => setAutoCashOutValue(parseFloat(e.target.value) || 1.1)}
                  className="bg-transparent text-white text-[10px] font-black w-8 text-right outline-none"
                />
                <span className="text-gray-500 text-[9px] font-bold">x</span>
              </div>
            </div>
          </div>

          <div className="flex gap-2 h-20">
            {/* Bet Amount Selector */}
            <div className="flex-[2] bg-black/60 rounded-lg border border-white/5 p-2 flex flex-col justify-between">
              <div className="flex items-center justify-between w-full">
                 <button 
                   onClick={() => setBetAmount(prev => Math.max(1, prev - 10))}
                   disabled={isBetPlaced || gamePhase !== 'betting'}
                   className="w-6 h-6 rounded bg-white/5 flex items-center justify-center text-white text-[10px] disabled:opacity-20"
                 >-</button>
                 <div className="flex items-center gap-0.5">
                   <span className="text-[10px] font-bold text-white/40">৳</span>
                   <input 
                     type="number"
                     value={betAmount === 0 ? '' : betAmount}
                     onChange={(e) => setBetAmount(parseInt(e.target.value) || 0)}
                     disabled={isBetPlaced || gamePhase !== 'betting'}
                     className="bg-transparent text-xs font-black text-white w-14 outline-none text-center"
                   />
                 </div>
                 <button 
                   onClick={() => setBetAmount(prev => prev + 10)} 
                   disabled={isBetPlaced || gamePhase !== 'betting'}
                   className="w-6 h-6 rounded bg-white/5 flex items-center justify-center text-white text-[10px] disabled:opacity-20"
                 >+</button>
              </div>
              
              <div className="grid grid-cols-3 gap-1 w-full">
                {[10, 50, 100, 200, 500, 1000].map(val => (
                  <button 
                    key={val} 
                    disabled={isBetPlaced || gamePhase !== 'betting'}
                    onClick={() => setBetAmount(val)}
                    className={`text-[8px] font-bold py-1 rounded transition-all ${
                      betAmount === val ? 'bg-white/20 text-white' : 'bg-white/5 text-gray-500'
                    } disabled:opacity-10`}
                  >
                    {val >= 1000 ? `${val/1000}k` : val}
                  </button>
                ))}
              </div>
            </div>

            {/* Main Action Button */}
            <div className="flex-1">
              <AnimatePresence mode="wait">
                {isBetPlaced && !isCashedOut && !hasCrashed && gamePhase === 'flying' ? (
                  <motion.button 
                    key="cashout"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => cashOut(false)}
                    className="w-full h-full bg-gradient-to-b from-orange-400 to-orange-600 rounded-2xl shadow-[0_8px_25px_rgba(249,115,22,0.4)] flex flex-col items-center justify-center p-4 border-t border-white/20"
                  >
                    <span className="text-black font-black text-sm tracking-widest mb-1">CASH OUT</span>
                    <div className="flex items-center gap-1">
                      <span className="text-black/60 text-[10px] font-bold">৳</span>
                      <span className="text-black font-black text-xl">{(betAmount * multiplier).toFixed(2)}</span>
                    </div>
                  </motion.button>
                ) : (
                  <motion.button 
                    key="bet"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    disabled={isBetPlaced || gamePhase !== 'betting' || !!betError}
                    onClick={() => placeBet(false)}
                    className={`w-full h-full rounded-2xl flex flex-col items-center justify-center p-4 transition-all duration-300 border-t ${
                      isBetPlaced 
                        ? 'bg-blue-900/40 border-blue-500/30 text-blue-400' 
                        : gamePhase === 'betting' 
                          ? (!!betError 
                              ? 'bg-red-900/40 border-red-500/30 cursor-not-allowed' 
                              : 'bg-gradient-to-b from-green-400 to-green-600 border-white/20 shadow-[0_8px_25px_rgba(34,197,94,0.4)] active:scale-95') 
                          : 'bg-gray-800 border-white/5 text-gray-500'
                    }`}
                  >
                    <span className={`font-black text-xl tracking-tighter mb-1 ${
                      isBetPlaced ? 'text-blue-400' : (!!betError && gamePhase === 'betting' ? 'text-red-400' : 'text-black')
                    }`}>
                      {isBetPlaced ? 'WAITING' : (gamePhase === 'betting' ? 'BET' : 'FLYING')}
                    </span>
                    <div className="flex items-center gap-1 opacity-70">
                      <span className="text-[10px] font-bold">৳</span>
                      <span className="font-black text-sm">{betAmount}</span>
                    </div>
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* Second Bet Panel (Multi) */}
        {showSecondBet && (
          <div className="relative pt-3 border-t border-white/5">
            <div className="flex gap-2 mb-3">
              <button 
                onClick={() => setIsAutoBet2(!isAutoBet2)}
                className={`flex-1 py-1.5 rounded-lg text-[9px] font-black tracking-widest transition-all duration-300 border ${
                  isAutoBet2 
                    ? 'bg-blue-500/20 border-blue-500 text-blue-400' 
                    : 'bg-black/40 border-white/5 text-gray-500'
                }`}
              >
                AUTO BET
              </button>
              <div className={`flex-[1.5] flex items-center justify-between px-2 py-1.5 rounded-lg border transition-all duration-300 ${
                isAutoCashOut2 
                  ? 'bg-orange-500/20 border-orange-500' 
                  : 'bg-black/40 border-white/5'
              }`}>
                <button 
                  onClick={() => setIsAutoCashOut2(!isAutoCashOut2)}
                  className={`text-[9px] font-black tracking-widest ${isAutoCashOut2 ? 'text-orange-400' : 'text-gray-500'}`}
                >
                  AUTO CASH OUT
                </button>
                <div className="flex items-center gap-1">
                  <input 
                    type="number" 
                    step="0.1"
                    min="1.1"
                    value={autoCashOutValue2}
                    onChange={(e) => setAutoCashOutValue2(parseFloat(e.target.value) || 1.1)}
                    className="bg-transparent text-white text-[10px] font-black w-8 text-right outline-none"
                  />
                  <span className="text-gray-500 text-[9px] font-bold">x</span>
                </div>
              </div>
            </div>

            <div className="flex gap-2 h-20">
              <div className="flex-[2] bg-black/60 rounded-lg border border-white/5 p-2 flex flex-col justify-between">
                <div className="flex items-center justify-between w-full">
                   <button 
                     onClick={() => setBetAmount2(prev => Math.max(1, prev - 10))}
                     disabled={isBetPlaced2 || gamePhase !== 'betting'}
                     className="w-6 h-6 rounded bg-white/5 flex items-center justify-center text-white text-[10px] disabled:opacity-20"
                   >-</button>
                   <div className="flex items-center gap-0.5">
                     <span className="text-[10px] font-bold text-white/40">৳</span>
                     <input 
                       type="number"
                       value={betAmount2 === 0 ? '' : betAmount2}
                       onChange={(e) => setBetAmount2(parseInt(e.target.value) || 0)}
                       disabled={isBetPlaced2 || gamePhase !== 'betting'}
                       className="bg-transparent text-xs font-black text-white w-14 outline-none text-center"
                     />
                   </div>
                   <button 
                     onClick={() => setBetAmount2(prev => prev + 10)} 
                     disabled={isBetPlaced2 || gamePhase !== 'betting'}
                     className="w-6 h-6 rounded bg-white/5 flex items-center justify-center text-white text-[10px] disabled:opacity-20"
                   >+</button>
                </div>
                
                <div className="grid grid-cols-3 gap-1 w-full">
                  {[10, 50, 100, 200, 500, 1000].map(val => (
                    <button 
                      key={val} 
                      disabled={isBetPlaced2 || gamePhase !== 'betting'}
                      onClick={() => setBetAmount2(val)}
                      className={`text-[8px] font-bold py-1 rounded transition-all ${
                        betAmount2 === val ? 'bg-white/20 text-white' : 'bg-white/5 text-gray-500'
                      } disabled:opacity-10`}
                    >
                      {val >= 1000 ? `${val/1000}k` : val}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex-1">
                <AnimatePresence mode="wait">
                  {isBetPlaced2 && !isCashedOut2 && !hasCrashed && gamePhase === 'flying' ? (
                    <motion.button 
                      key="cashout2"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => cashOut(true)}
                      className="w-full h-full bg-gradient-to-b from-orange-400 to-orange-600 rounded-2xl shadow-[0_8px_25px_rgba(249,115,22,0.4)] flex flex-col items-center justify-center p-4 border-t border-white/20"
                    >
                      <span className="text-black font-black text-[10px] tracking-widest leading-none">CASH OUT</span>
                      <div className="flex items-baseline gap-0.5 mt-1">
                        <span className="text-black font-black text-lg">{(betAmount2 * multiplier).toFixed(2)}</span>
                      </div>
                    </motion.button>
                  ) : (
                    <motion.button 
                      key="bet2"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      disabled={isBetPlaced2 || gamePhase !== 'betting'}
                      onClick={() => placeBet(true)}
                      className={`w-full h-full rounded-2xl flex flex-col items-center justify-center p-4 transition-all duration-300 border-t ${
                        isBetPlaced2 
                          ? 'bg-blue-900/40 border-blue-500/30 text-blue-400' 
                          : gamePhase === 'betting' 
                            ? 'bg-gradient-to-b from-green-400 to-green-600 border-white/20 shadow-[0_8px_25px_rgba(34,197,94,0.4)] active:scale-95' 
                            : 'bg-gray-800 border-white/5 text-gray-500'
                      }`}
                    >
                      <span className={`font-black text-sm tracking-tighter mb-1 ${
                        isBetPlaced2 ? 'text-blue-400' : 'text-black'
                      }`}>
                        {isBetPlaced2 ? 'WAITING' : (gamePhase === 'betting' ? 'BET' : 'FLYING')}
                      </span>
                      <div className="flex items-center gap-0.5 opacity-70">
                        <span className="text-[8px] font-bold">৳</span>
                        <span className="font-black text-xs">{betAmount2}</span>
                      </div>
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        )}

        {/* Cashed Out Message Overlay */}
        {(isCashedOut || isCashedOut2) && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[100] pointer-events-none">
            {isCashedOut && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.5, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.5, y: -20 }}
                className="bg-green-500/90 backdrop-blur-md px-6 py-3 rounded-2xl border border-green-400 shadow-[0_15px_40px_rgba(0,0,0,0.5)] mb-4"
              >
                <div className="text-center">
                  <p className="text-black text-[10px] font-black uppercase tracking-widest">Bet 1 Cashed Out</p>
                  <h2 className="text-black font-black text-3xl italic">{cashOutMultiplier.toFixed(2)}x</h2>
                  <p className="text-black font-bold text-sm">৳ {(betAmount * cashOutMultiplier).toFixed(2)}</p>
                </div>
              </motion.div>
            )}
            {isCashedOut2 && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.5, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.5, y: -20 }}
                className="bg-green-500/90 backdrop-blur-md px-6 py-3 rounded-2xl border border-green-400 shadow-[0_15px_40px_rgba(0,0,0,0.5)]"
              >
                <div className="text-center">
                  <p className="text-black text-[10px] font-black uppercase tracking-widest">Bet 2 Cashed Out</p>
                  <h2 className="text-black font-black text-3xl italic">{cashOutMultiplier2.toFixed(2)}x</h2>
                  <p className="text-black font-bold text-sm">৳ {(betAmount2 * cashOutMultiplier2).toFixed(2)}</p>
                </div>
              </motion.div>
            )}
          </div>
        )}

        {/* Full History Modal */}
        <AnimatePresence>
          {showFullHistory && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-[110] bg-black/95 backdrop-blur-xl flex flex-col p-6"
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-teal-500/20 rounded-xl">
                    <History size={24} className="text-teal-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-white tracking-tight italic uppercase">Round History</h2>
                    <p className="text-[10px] text-teal-500 font-bold tracking-widest">LAST 20 ROUNDS</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowFullHistory(false)}
                  className="p-2 bg-white/5 rounded-full text-gray-400 hover:text-white transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                <div className="grid grid-cols-2 gap-4">
                  {history.map((val, i) => {
                    const tier = val < 1.5 ? 'low' : val < 3.0 ? 'medium' : 'high';
                    const colorClass = tier === 'low' ? 'text-gray-400' : tier === 'medium' ? 'text-yellow-400' : 'text-green-400';
                    const bgClass = tier === 'low' ? 'bg-gray-900/50' : tier === 'medium' ? 'bg-yellow-900/20' : 'bg-green-900/20';
                    const borderClass = tier === 'low' ? 'border-gray-800' : tier === 'medium' ? 'border-yellow-800/50' : 'border-green-800/50';

                    return (
                      <motion.div 
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.03 }}
                        className={`p-4 rounded-2xl border ${borderClass} ${bgClass} flex flex-col items-center gap-2 relative overflow-hidden group`}
                      >
                        <div className={`absolute -right-4 -top-4 w-12 h-12 rounded-full blur-2xl opacity-20 ${tier === 'low' ? 'bg-gray-500' : tier === 'medium' ? 'bg-yellow-500' : 'bg-green-500'}`}></div>
                        
                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Round #{history.length - i}</span>
                        <div className="flex items-baseline gap-1">
                          <span className={`text-2xl font-black italic tracking-tighter ${colorClass}`}>{val.toFixed(2)}</span>
                          <span className={`text-xs font-bold ${colorClass}`}>x</span>
                        </div>
                        
                        <div className="w-full h-1 bg-black/40 rounded-full overflow-hidden mt-2">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(100, (val / 5) * 100)}%` }}
                            transition={{ duration: 1, delay: i * 0.05 }}
                            className={`h-full rounded-full ${tier === 'low' ? 'bg-gray-600' : tier === 'medium' ? 'bg-yellow-600' : 'bg-green-600'}`}
                          ></motion.div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
                
                {history.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-20 text-gray-600">
                    <History size={48} className="mb-4 opacity-20" />
                    <p className="font-bold italic">No round history available yet</p>
                  </div>
                )}
              </div>

              <button 
                onClick={() => setShowFullHistory(false)}
                className="mt-8 w-full py-4 bg-gradient-to-r from-teal-600 to-teal-800 text-white font-black rounded-2xl shadow-lg shadow-teal-900/20 active:scale-95 transition-transform"
              >
                BACK TO GAME
              </button>
            </motion.div>
          )}
        </AnimatePresence>

      <style>{`
        @keyframes fly-aviator {
          0% { transform: translate(0, 0) rotate(-12deg); }
          20% { transform: translate(10px, -15px) rotate(-10deg); }
          40% { transform: translate(25px, -5px) rotate(-14deg); }
          60% { transform: translate(15px, -20px) rotate(-11deg); }
          80% { transform: translate(5px, -10px) rotate(-13deg); }
          100% { transform: translate(0, 0) rotate(-12deg); }
        }
        @keyframes wing-flap {
          0% { transform: skewY(0deg); }
          100% { transform: skewY(-5deg); }
        }
        @keyframes dash {
          to { stroke-dashoffset: -20; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(-50%) translateX(0); }
          50% { transform: translateY(-55%) translateX(5px); }
        }
        @keyframes loading {
          from { transform: translateX(-100%); }
          to { transform: translateX(100%); }
        }
        @keyframes shake {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          10%, 30%, 50%, 70%, 90% { transform: translate(-10px, -10px) rotate(-2deg); }
          20%, 40%, 60%, 80% { transform: translate(10px, 10px) rotate(2deg); }
        }
        @keyframes crash-text {
          0% { transform: scale(0.5); opacity: 0; filter: blur(20px); }
          10% { transform: scale(1.2); opacity: 0.8; filter: blur(0px); }
          100% { transform: scale(1.5); opacity: 0; filter: blur(40px); }
        }
        @keyframes flash {
          0% { opacity: 0; }
          10% { opacity: 0.8; }
          100% { opacity: 0; }
        }
        @keyframes crash-plane {
          0% { transform: translate(0, 0) rotate(-12deg) scale(1); filter: blur(0); }
          20% { transform: translate(10px, 20px) rotate(0deg) scale(1.1); filter: blur(2px); }
          50% { transform: translate(50px, 100px) rotate(45deg) scale(0.8); opacity: 0.5; filter: blur(5px); }
          100% { transform: translate(150px, 300px) rotate(180deg) scale(0); opacity: 0; filter: blur(10px); }
        }
        @keyframes glitch {
          0% { transform: translate(0); text-shadow: -2px 0 #ff00c1, 2px 0 #00fff9; }
          20% { transform: translate(-2px, 2px); }
          40% { transform: translate(-2px, -2px); text-shadow: 2px 0 #ff00c1, -2px 0 #00fff9; }
          60% { transform: translate(2px, 2px); }
          80% { transform: translate(2px, -2px); text-shadow: -2px 0 #ff00c1, 2px 0 #00fff9; }
          100% { transform: translate(0); }
        }
        @keyframes particle {
          0% { transform: translate(0, 0) scale(1); opacity: 1; }
          100% { transform: translate(var(--tx), var(--ty)) scale(0); opacity: 0; }
        }
        @keyframes speed-line {
          0% { transform: translateX(0); opacity: 0; }
          50% { opacity: 1; }
          100% { transform: translateX(100vw); opacity: 0; }
        }
        @keyframes motion-blur {
          0%, 100% { filter: blur(0px); transform: scale(1); }
          50% { filter: blur(1px); transform: scale(1.02); }
        }
        @keyframes chromatic {
          0%, 100% { text-shadow: 0 0 0 rgba(255,0,0,0.5), 0 0 0 rgba(0,255,0,0.5), 0 0 0 rgba(0,0,255,0.5); }
          50% { text-shadow: -1px 0 0 rgba(255,0,0,0.5), 1px 0 0 rgba(0,255,0,0.5), 0 1px 0 rgba(0,0,255,0.5); }
        }
        .animate-glitch { animation: glitch 0.2s ease-in-out infinite; }
        .animate-particle { animation: particle 0.8s ease-out var(--delay) forwards; }
        .animate-speed-line { animation: speed-line linear infinite; }
        .animate-motion-blur { animation: motion-blur 0.5s ease-in-out infinite; }
        .animate-chromatic { animation: chromatic 0.3s ease-in-out infinite; }
        @keyframes static-noise {
          0%, 100% { background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E"); transform: translate(0,0); }
          10% { transform: translate(-5%,-5%); }
          20% { transform: translate(-10%,5%); }
          30% { transform: translate(5%,-10%); }
          40% { transform: translate(-5%,15%); }
          50% { transform: translate(-10%,-5%); }
          60% { transform: translate(15%,0); }
          70% { transform: translate(0,10%); }
          80% { transform: translate(-15%,0); }
          90% { transform: translate(10%,5%); }
        }
        .animate-static-noise { animation: static-noise 0.2s steps(1) infinite; }
        .animate-crash-text { animation: crash-text 0.8s ease-out forwards; }
        .animate-shake { animation: shake 0.6s cubic-bezier(.36,.07,.19,.97) both; }
        .animate-flash { animation: flash 0.4s ease-out both; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
