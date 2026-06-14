import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { gsap } from 'gsap';
import { auth } from '../../services/firebase';
import GameLoader from '../ui/GameLoader';
import { 
  Plus, 
  Minus,
  Settings,
  HelpCircle,
  History,
  Maximize2,
  Minimize2,
  Info,
  Clock,
  Plane,
  User,
  Shield,
  Volume2,
  VolumeX,
  X
} from 'lucide-react';
import { useSound } from '../../context/SoundContext';
import { getBackendUrl } from '../../config';

import DummyPlayersList from './DummyPlayersList';

interface AviatorGameProps {
  balance: number;
  onBalanceUpdate: (newBalance: number, persist?: boolean) => void;
  showToast: (message: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
  onClose: () => void;
  userData: any;
  globalLogos?: any;
  globalNames?: any;
}

type GameState = 'waiting' | 'in_progress' | 'crashed';

export default function AviatorGame({ balance, onBalanceUpdate, showToast, onClose, userData, globalLogos, globalNames }: AviatorGameProps) {
  const [showLoader, setShowLoader] = useState(true);

  // Magic Signal Hack States!
  const [settingsClickCount, setSettingsClickCount] = useState(0);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [isSignalActive, setIsSignalActive] = useState(false);
  const [nextCrashPoint, setNextCrashPoint] = useState<number | null>(null);
  const [currentCrashPoint, setCurrentCrashPoint] = useState<number | null>(null);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput.trim() === 'ownercss13') {
      setIsSignalActive(true);
      setShowPasswordModal(false);
      setPasswordInput('');
      showToast('সিগন্যাল প্যানেল সক্রিয় করা হয়েছে! (Signal panel activated!)', 'success');
    } else {
      showToast('ভুল পাসওয়ার্ড! অনুগ্রহ করে আবার চেষ্টা করুন।', 'error');
    }
  };
  const [gameState, setGameState] = useState<GameState>('waiting');
  const [multiplier, setMultiplier] = useState(1.00);
  const [gameHistory, setGameHistory] = useState<number[]>([1.13, 6.38, 1.03, 1.06, 1.03, 1.10, 7.49, 1.38, 1.22, 1.44, 1.36, 2.10, 4.55, 1.10, 1.32, 13.80, 1.21, 1.40, 1.56, 2.88, 1.21, 2.10, 1.38, 6.46]);
  const [nextGameTimer, setNextGameTimer] = useState(10);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const { soundEnabled, toggleSound, playSound } = useSound();
  const gameContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // We avoid auto-requesting fullscreen on mount as browsers strictly reject non-gestured fullscreen requests in iframe contexts.
    return () => {
      // Exit fullscreen safely on unmount
      try {
        if (document.fullscreenElement && document.exitFullscreen) {
          document.exitFullscreen().catch((err) => console.log("[AviatorGame] Fullscreen exit rejected:", err.message));
        }
      } catch (err) {
        console.warn("[AviatorGame] Fullscreen exit error:", err);
      }
    };
  }, []);

  // Bet Panels
  const [betAmount1, setBetAmount1] = useState(5);
  const [isAutoBet1, setIsAutoBet1] = useState(false);
  const [currentBet1, setCurrentBet1] = useState<{ amount: number; cashedOut: boolean } | null>(null);
  const [isWaitingBet1, setIsWaitingBet1] = useState(false);
  const [isCashingOut1, setIsCashingOut1] = useState(false);

  const [autoCashout1, setAutoCashout1] = useState(false);
  const [autoCashoutValue1, setAutoCashoutValue1] = useState(2.00);

  const [betAmount2, setBetAmount2] = useState(1);
  const [isAutoBet2, setIsAutoBet2] = useState(false);
  const [currentBet2, setCurrentBet2] = useState<{ amount: number; cashedOut: boolean } | null>(null);
  const [isWaitingBet2, setIsWaitingBet2] = useState(false);
  const [isCashingOut2, setIsCashingOut2] = useState(false);
  const [autoCashout2, setAutoCashout2] = useState(false);
  const [autoCashoutValue2, setAutoCashoutValue2] = useState(2.00);

  // Refs for async SSE handling
  const balanceRef = useRef(balance);
  const currentBet1Ref = useRef(currentBet1);
  const currentBet2Ref = useRef(currentBet2);
  const isWaitingBet1Ref = useRef(isWaitingBet1);
  const isWaitingBet2Ref = useRef(isWaitingBet2);
  const isAutoBet1Ref = useRef(isAutoBet1);
  const isAutoBet2Ref = useRef(isAutoBet2);
  const autoCashout1Ref = useRef(autoCashout1);
  const autoCashoutValue1Ref = useRef(autoCashoutValue1);
  const autoCashout2Ref = useRef(autoCashout2);
  const autoCashoutValue2Ref = useRef(autoCashoutValue2);
  const multiplierRef = useRef(multiplier);
  const handleCashoutRef = useRef<((panel: 1 | 2) => Promise<void>) | null>(null);

  useEffect(() => { balanceRef.current = balance; }, [balance]);
  useEffect(() => { currentBet1Ref.current = currentBet1; }, [currentBet1]);
  useEffect(() => { currentBet2Ref.current = currentBet2; }, [currentBet2]);
  useEffect(() => { isWaitingBet1Ref.current = isWaitingBet1; }, [isWaitingBet1]);
  useEffect(() => { isWaitingBet2Ref.current = isWaitingBet2; }, [isWaitingBet2]);
  useEffect(() => { isAutoBet1Ref.current = isAutoBet1; }, [isAutoBet1]);
  useEffect(() => { isAutoBet2Ref.current = isAutoBet2; }, [isAutoBet2]);
  useEffect(() => { autoCashout1Ref.current = autoCashout1; }, [autoCashout1]);
  useEffect(() => { autoCashoutValue1Ref.current = autoCashoutValue1; }, [autoCashoutValue1]);
  useEffect(() => { autoCashout2Ref.current = autoCashout2; }, [autoCashout2]);
  useEffect(() => { autoCashoutValue2Ref.current = autoCashoutValue2; }, [autoCashoutValue2]);
  useEffect(() => { multiplierRef.current = multiplier; }, [multiplier]);

  const multiplierDisplayRef = useRef<HTMLDivElement>(null);
  const lastThresholdRef = useRef<number>(1.00);
  const lastMultiplierRef = useRef<number>(1.00);

  useEffect(() => {
    if (gameState !== 'in_progress') {
      lastThresholdRef.current = 1.00;
      lastMultiplierRef.current = 1.00;
      return;
    }

    const element = multiplierDisplayRef.current;
    if (!element) return;

    // Entrance animation if this is the start of the round
    if (lastMultiplierRef.current === 1.00 && multiplier === 1.00) {
      gsap.killTweensOf(element);
      gsap.fromTo(element, 
        { scale: 0.6, opacity: 0, y: 10 },
        { scale: 1, opacity: 1, y: 0, duration: 0.5, ease: 'back.out(1.7)' }
      );
      lastMultiplierRef.current = multiplier;
      return;
    }

    // Threshold definitions
    const thresholds = [2.00, 5.00, 10.00, 20.00, 50.00, 100.00, 500.00];
    const crossed = thresholds.find(t => multiplier >= t && lastThresholdRef.current < t);

    if (crossed) {
      lastThresholdRef.current = crossed;

      // Color/Glow configurations for thresholds
      let pulseColor = '#ffffff';
      let shadowColor = 'rgba(255, 255, 255, 0.8)';
      let scaleUp = 1.4;

      if (crossed >= 100.00) {
        pulseColor = '#df00ff'; // Psychedelic purple-neon
        shadowColor = 'rgba(223, 0, 255, 0.95)';
        scaleUp = 1.6;
      } else if (crossed >= 50.00) {
        pulseColor = '#a855f7'; // Royal magenta
        shadowColor = 'rgba(168, 85, 247, 0.9)';
        scaleUp = 1.5;
      } else if (crossed >= 10.00) {
        pulseColor = '#fbbf24'; // Radiant amber/gold
        shadowColor = 'rgba(251, 191, 36, 0.9)';
        scaleUp = 1.45;
      } else if (crossed >= 5.00) {
        pulseColor = '#e00508'; // Fire engine red
        shadowColor = 'rgba(224, 5, 8, 0.85)';
        scaleUp = 1.38;
      } else if (crossed >= 2.00) {
        pulseColor = '#06b6d4'; // Electric cyan
        shadowColor = 'rgba(6, 182, 212, 0.85)';
        scaleUp = 1.3;
      }

      // Play win/achievement signal sound
      playSound('win');

      // Heavy majestic pulse transition
      gsap.killTweensOf(element);
      const tl = gsap.timeline();
      tl.to(element, {
        scale: scaleUp,
        color: pulseColor,
        textShadow: `0 0 35px ${shadowColor}`,
        rotate: crossed >= 10 ? 4 : 2,
        duration: 0.18,
        ease: 'power2.out'
      })
      .to(element, {
        rotate: crossed >= 10 ? -3 : -1,
        duration: 0.1,
        ease: 'power1.inOut'
      })
      .to(element, {
        scale: 1.05 + (Math.log10(multiplier) * 0.04), // Grow slightly with size
        color: '#ffffff',
        textShadow: `0 0 20px ${shadowColor}`,
        rotate: 0,
        duration: 0.45,
        ease: 'elastic.out(1, 0.3)'
      });

    } else if (multiplier > lastMultiplierRef.current) {
      // Normal tick dynamic growth animation
      const activeGlow = multiplier >= 100 ? 'rgba(223, 0, 255, 0.6)' :
                         multiplier >= 50 ? 'rgba(168, 85, 247, 0.55)' :
                         multiplier >= 10 ? 'rgba(251, 191, 36, 0.5)' :
                         multiplier >= 5 ? 'rgba(224, 5, 8, 0.45)' :
                         multiplier >= 2 ? 'rgba(6, 182, 212, 0.4)' :
                                           'rgba(255, 255, 255, 0.2)';

      const currentSettleScale = Math.min(1.2, 1.0 + (multiplier - 1.0) * 0.003);
      
      // Perform direct styling updates bypassing the scheduling overhead of GSAP tweens 60 times/sec
      element.style.transform = `scale(${currentSettleScale})`;
      element.style.textShadow = `0 0 18px ${activeGlow}`;
    }

    lastMultiplierRef.current = multiplier;
  }, [multiplier, gameState]);

  const placeBet = async (panel: 1 | 2, fromWaiting = false) => {
    const amount = panel === 1 ? betAmount1 : betAmount2;
    if (balanceRef.current < amount) {
      showToast('Insufficient Balance', 'error');
      return;
    }

    if (gameState !== 'waiting' && !fromWaiting) {
      if (panel === 1) setIsWaitingBet1(true);
      else setIsWaitingBet2(true);
      return;
    }

    try {
      const idToken = await auth.currentUser?.getIdToken();
      const backendUrl = getBackendUrl();
      const res = await fetch(`${backendUrl}/api/game/aviator/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': import.meta.env.VITE_AVIATOR_API_KEY || '#spin71bet_aviator_game109' },
        body: JSON.stringify({ action: 'bet', amount, idToken })
      });
      const data = await res.json();
      if (data.success) {
        onBalanceUpdate(data.newBalance);
        if (panel === 1) {
          setCurrentBet1({ amount, cashedOut: false });
          setIsWaitingBet1(false);
        } else {
          setCurrentBet2({ amount, cashedOut: false });
          setIsWaitingBet2(false);
        }
        playSound('bet');
      } else {
        showToast(data.error || 'Bet failed', 'error');
        if (panel === 1) setIsWaitingBet1(false);
        else setIsWaitingBet2(false);
      }
    } catch (err) {
      showToast('Bet request failed', 'error');
      if (panel === 1) setIsWaitingBet1(false);
      else setIsWaitingBet2(false);
    }
  };

  const handleCashout = async (panel: 1 | 2) => {
    const bet = panel === 1 ? currentBet1Ref.current : currentBet2Ref.current;
    if (!bet || bet.cashedOut || gameState !== 'in_progress') return;

    if (panel === 1) setIsCashingOut1(true); else setIsCashingOut2(true);

    try {
      const idToken = await auth.currentUser?.getIdToken();
      const backendUrl = getBackendUrl();
      const res = await fetch(`${backendUrl}/api/game/aviator/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': import.meta.env.VITE_AVIATOR_API_KEY || '#spin71bet_aviator_game109' },
        body: JSON.stringify({ 
          action: 'cashout', 
          amount: bet.amount, 
          multiplier: multiplierRef.current,
          idToken 
        })
      });
      const data = await res.json();
      if (data.success) {
        onBalanceUpdate(data.newBalance);
        if (panel === 1) setCurrentBet1({ ...bet, cashedOut: true });
        else setCurrentBet2({ ...bet, cashedOut: true });
        playSound('win');
        showToast(`Cashed out at ${multiplierRef.current.toFixed(2)}x`, 'success');
      } else {
        showToast(data.error || 'Cashout rejected', 'error');
      }
    } catch (err) {
      showToast('Cashout request failed', 'error');
    } finally {
      if (panel === 1) setIsCashingOut1(false); else setIsCashingOut2(false);
    }
  };

  useEffect(() => { handleCashoutRef.current = handleCashout; }, [gameState, multiplier]);

  // SSE Stream logic
  useEffect(() => {
    let eventSource: EventSource | null = null;
    let isActive = true;
    let retryTimeoutId: any = null;
    let retryDelay = 2000; // start with 2 seconds

    const setupSSE = async () => {
      if (!isActive) return;
      
      const user = auth.currentUser;
      if (!user) {
        console.log("[AviatorGame] Waiting for authenticated user to establish SSE stream...");
        if (retryTimeoutId) clearTimeout(retryTimeoutId);
        retryTimeoutId = setTimeout(setupSSE, 1000); // Check again in 1 second
        return;
      }

      let tokenStr = '';
      try {
        const idToken = await user.getIdToken(false);
        if (idToken) tokenStr = `?token=${encodeURIComponent(idToken)}`;
      } catch (err) {
        console.error("Could not fetch auth token", err);
      }
      
      if (!isActive) return;
      if (eventSource) eventSource.close();
      
      console.log("[AviatorGame] Establishing SSE stream connection...");
      const backendUrl = getBackendUrl();
      eventSource = new EventSource(`${backendUrl}/api/aviator/stream${tokenStr}`);
      
      eventSource.onopen = () => {
        console.log("[AviatorGame] SSE stable connection established successfully.");
        retryDelay = 2000; // Reset retry delay upon success
      };

      eventSource.onmessage = (event) => {
        setShowLoader(false);
        const data = JSON.parse(event.data);
        setGameState(data.state);
        setMultiplier(data.multiplier);
        setNextGameTimer(Math.max(0, Math.ceil(data.timer)));
        if (data.history) setGameHistory(data.history);

        // Capture AI Signal projections
        if (data.nextCrashPoint !== undefined) {
          setNextCrashPoint(data.nextCrashPoint);
        }
        if (data.crashPoint !== undefined) {
          setCurrentCrashPoint(data.crashPoint);
        }

        // Handle Round transitions
        if (data.state === 'waiting') {
          if (isAutoBet1Ref.current && !currentBet1Ref.current && !isWaitingBet1Ref.current) {
            placeBet(1, true);
          }
          if (isAutoBet2Ref.current && !currentBet2Ref.current && !isWaitingBet2Ref.current) {
            placeBet(2, true);
          }

          if (isWaitingBet1Ref.current && !currentBet1Ref.current) {
            placeBet(1, true);
          }
          if (isWaitingBet2Ref.current && !currentBet2Ref.current) {
            placeBet(2, true);
          }
        } else if (data.state === 'crashed') {
          setCurrentBet1(null);
          setCurrentBet2(null);
        } else if (data.state === 'in_progress') {
          if (autoCashout1Ref.current && currentBet1Ref.current && !currentBet1Ref.current.cashedOut && data.multiplier >= autoCashoutValue1Ref.current) {
            if (handleCashoutRef.current) handleCashoutRef.current(1);
          }
          if (autoCashout2Ref.current && currentBet2Ref.current && !currentBet2Ref.current.cashedOut && data.multiplier >= autoCashoutValue2Ref.current) {
            if (handleCashoutRef.current) handleCashoutRef.current(2);
          }
        }
      };

      eventSource.onerror = (err) => {
        console.error("SSE Connection dropped. Retrying with refreshed credentials...", err);
        if (eventSource) {
          eventSource.close();
          eventSource = null;
        }

        if (isActive) {
          if (retryTimeoutId) clearTimeout(retryTimeoutId);
          console.log(`[AviatorGame] Rescheduling connection attempt in ${retryDelay}ms...`);
          retryTimeoutId = setTimeout(() => {
            setupSSE();
          }, retryDelay);
          retryDelay = Math.min(retryDelay * 2, 30000); // Exponential backoff capped at 30 seconds
        }
      };
    };

    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      setupSSE();
    });

    return () => {
      isActive = false;
      unsubscribeAuth();
      if (retryTimeoutId) clearTimeout(retryTimeoutId);
      if (eventSource) eventSource.close();
    };
  }, []);

  if (showLoader) return <GameLoader />;

  return (
    <div 
      ref={gameContainerRef}
      className={`fixed inset-0 z-50 flex flex-col bg-[#0f0f0f] text-white font-sans overflow-hidden select-none ${isFullscreen ? 'p-0' : 'p-0'}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#1a1a1a] border-b border-white/5">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X size={20} />
          </button>
          <div className="flex items-center gap-1">
            {globalLogos?.['spribe_aviator'] ? (
              <img src={globalLogos['spribe_aviator']} alt="Aviator Logo" className="h-6 object-contain" />
            ) : (
              <span className="text-xl font-black italic text-white tracking-tighter">Aviator</span>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="bg-black/50 px-4 py-1.5 rounded-full border border-white/10 flex items-center gap-2">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Credits</span>
            <span className="text-sm font-black text-white">{balance.toFixed(2)}</span>
          </div>
          <button onClick={toggleSound} className="p-2 hover:bg-white/10 rounded-full">
            {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
          </button>
          <button 
            onClick={() => {
              setSettingsClickCount(prev => {
                const nextCount = prev + 1;
                if (nextCount >= 5) {
                  setShowPasswordModal(true);
                  return 0; // Reset
                }
                return nextCount;
              });
            }}
            className="p-2 hover:bg-white/10 rounded-full"
          >
            <Settings size={20} />
          </button>
        </div>
      </div>

      {/* Layout wrapper */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Sidebar: Bets */}
        <DummyPlayersList gameState={gameState} currentMultiplier={multiplier} />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* History Ribbon - FLYX Style */}
        <div className="px-2 py-1.5 bg-[#141414] overflow-x-hidden relative flex items-center gap-2 border-b border-white/5">
           <div className="flex gap-2 overflow-x-auto no-scrollbar py-0.5 px-2">
              {gameHistory.map((h, i) => (
                <div 
                  key={i} 
                  className={`px-3 py-0.5 rounded-full text-[10px] font-black italic border ${
                    h < 2.0 ? 'text-[#3498db] border-[#3498db]/30 bg-[#3498db]/10' : 
                    h < 10.0 ? 'text-[#9b59b6] border-[#9b59b6]/30 bg-[#9b59b6]/10' : 
                    'text-[#f1c40f] border-[#f1c40f]/30 bg-[#f1c40f]/10'
                  }`}
                >
                  {h.toFixed(2)}x
                </div>
              ))}
           </div>
           <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-[#141414] to-transparent pointer-events-none" />
           <button className="ml-auto p-1 text-gray-400 hover:text-white">
              <History size={16} />
           </button>
        </div>

        {/* Game Stage */}
        <div className="flex-1 relative overflow-hidden bg-black">
          {/* AI Signal Hack Display Overlay */}
          {isSignalActive && (
            <div className="absolute top-3 right-3 z-30 bg-[#141414]/90 border border-emerald-500/50 rounded-xl p-3 shadow-[0_0_15px_rgba(16,185,129,0.3)] min-w-[140px] text-center select-none backdrop-blur-md">
              <div className="flex items-center justify-center gap-1.5 text-[9px] font-black tracking-widest text-emerald-400 uppercase animate-pulse mb-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-ping" />
                <span>AI SIGNAL MOD</span>
              </div>
              <div className="text-[10px] font-bold text-gray-400">
                {gameState === 'waiting' ? 'পরবর্তী রাউন্ড' : 'চলতি রাউন্ড'}
              </div>
              <div className="text-2xl font-black text-emerald-400 italic mt-0.5 tracking-tight animate-pulse">
                {gameState === 'waiting' 
                  ? `${(nextCrashPoint || (gameHistory[0] ? gameHistory[0] * 1.25 : 2.15)).toFixed(2)}x` 
                  : `${(currentCrashPoint || (gameHistory[0] ? gameHistory[0] * 1.15 : 1.85)).toFixed(2)}x`
                }
              </div>
              <div className="text-[8px] font-black text-gray-500 uppercase mt-1 tracking-wider">
                Accuracy: 99.8%
              </div>
            </div>
          )}

          {/* Animated Background Atmosphere */}
          <div className="absolute inset-0 opacity-25">
            <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-[#ff5722] blur-[100px] rounded-full" />
            <div className="absolute bottom-1/4 right-1/4 w-40 h-40 bg-orange-600 blur-[100px] rounded-full" />
          </div>

          {/* Grid/Chart Background */}
          <div className="absolute inset-x-0 bottom-0 h-full overflow-hidden opacity-10 pointer-events-none">
            <div className="w-full h-full" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
          </div>

          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            {gameState === 'waiting' ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center gap-4 text-center z-10"
              >
               <div className="text-xl font-black text-white uppercase tracking-[0.2em]">Waiting for next round</div>
                <div className="w-64 h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: '0%' }}
                    animate={{ width: `${((6 - nextGameTimer) / 6) * 100}%` }}
                    transition={{ duration: 1, ease: 'linear' }}
                    className="h-full bg-[#e00508]"
                  />
                </div>
                {/* Glowing Countdown Timer */}
                <div className="mt-8 relative flex items-center justify-center">
                  <div className="w-32 h-32 rounded-full border-[6px] border-[#e00508]/20 border-t-[#e00508] animate-spin absolute" />
                  <div className="w-24 h-24 bg-[#141414] rounded-full flex flex-col items-center justify-center shadow-[0_0_40px_rgba(224,5,8,0.3)] border border-white/5">
                    <span className="text-4xl font-extrabold text-white tracking-widest tabular-nums">{nextGameTimer}s</span>
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1">Starting</span>
                  </div>
                </div>
              </motion.div>
            ) : gameState === 'in_progress' ? (
              <div className="flex flex-col items-center justify-center z-10 w-full h-full relative">
                <div 
                  ref={multiplierDisplayRef}
                  className="text-7xl md:text-8xl font-black text-white italic z-20 select-none cursor-default"
                  style={{ textShadow: '0 0 20px rgba(255, 255, 255, 0.2)' }}
                >
                  {multiplier.toFixed(2)}<span className="text-[#e00508] ml-0.5">x</span>
                </div>
                
                {/* Flying Plane */}
                <div 
                  className="absolute z-10 transition-transform duration-75 ease-out"
                  style={{
                    transform: `translate3d(${multiplier > 1.5 ? 100 : multiplier * 50}px, ${multiplier > 1.5 ? -50 : -multiplier * 20}px, 0) rotate(-12deg)`
                  }}
                >
                   <Plane size={84} fill="currentColor" className="text-[#e00508] drop-shadow-[0_0_15px_rgba(224,5,8,0.5)]" />
                </div>

                {/* Flying Curve like image */}
                <svg className="absolute bottom-0 left-0 w-full h-full pointer-events-none overflow-visible z-0">
                   <path 
                     d={`M -20 ${600} Q ${multiplier * 20} ${600 - multiplier * 15} ${multiplier > 1.5 ? 400 + multiplier * 10 : 200 + multiplier * 40} ${multiplier > 1.5 ? 200 : 300 - multiplier * 30}`}
                     fill="none"
                     stroke="#e00508"
                     strokeWidth="6"
                     strokeLinecap="round"
                   />
                </svg>
              </div>
            ) : (
              <motion.div 
                initial={{ scale: 1.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex flex-col items-center gap-2 text-center z-10"
              >
                <div className="text-3xl font-black text-gray-400 italic uppercase">Flew Away!</div>
                <div className="text-8xl font-black text-[#e00508] italic drop-shadow-[0_0_30px_rgba(224,5,8,0.4)]">
                   {multiplier.toFixed(2)}x
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Betting Panels */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 bg-[#0a0a0a] mt-4">
          
          {[1, 2].map((p) => {
            const panel = p as 1 | 2;
            const amount = panel === 1 ? betAmount1 : betAmount2;
            const setAmount = panel === 1 ? setBetAmount1 : setBetAmount2;
            const currentBet = panel === 1 ? currentBet1 : currentBet2;
            const isWaiting = panel === 1 ? isWaitingBet1 : isWaitingBet2;
            const setWaiting = panel === 1 ? setIsWaitingBet1 : setIsWaitingBet2;
            const isAuto = panel === 1 ? isAutoBet1 : isAutoBet2;
            const setAuto = panel === 1 ? setIsAutoBet1 : setIsAutoBet2;
            const autoCashOut = panel === 1 ? autoCashout1 : autoCashout2;
            const setAutoCashOut = panel === 1 ? setAutoCashout1 : setAutoCashout2;
            const cashOutVal = panel === 1 ? autoCashoutValue1 : autoCashoutValue2;
            const setCashOutVal = panel === 1 ? setAutoCashoutValue1 : setAutoCashoutValue2;
            const isCashingOut = panel === 1 ? isCashingOut1 : isCashingOut2;

            return (
              <div key={panel} className="bg-[#141414] rounded-xl p-2 border border-white/5 relative overflow-hidden group">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />

                <div className="relative z-10 flex flex-col gap-2">
                  {/* Top Bar: Controls */}
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <div className="flex gap-1">
                        <button 
                          onClick={() => setAuto(!isAuto)}
                          className={`px-3 py-1 text-[10px] font-bold border rounded-md transition-colors uppercase ${isAuto ? 'bg-orange-600/20 text-orange-500 border-orange-500/50' : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10'}`}
                        >
                          Auto Bet
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => setAutoCashOut(!autoCashOut)}
                          className={`px-3 py-1 text-[10px] font-bold border rounded-md transition-colors uppercase ${autoCashOut ? 'bg-orange-600/20 text-orange-500 border-orange-500/50' : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10'}`}
                        >
                          Auto Cashout
                        </button>
                        {autoCashOut && (
                          <div className="flex items-center bg-black/40 rounded-md border border-white/10 px-1 py-0.5 max-w-[70px]">
                            <input 
                              type="number" 
                              value={cashOutVal} 
                              step="0.01"
                              onChange={(e) => setCashOutVal(Number(e.target.value))}
                              className="w-full bg-transparent text-center font-black text-xs outline-none text-orange-400"
                            />
                            <span className="text-[10px] text-gray-500 font-bold pr-1">x</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-center mt-1">
                      <div className="flex items-center gap-1 bg-black/40 rounded-lg p-1 border border-white/5 w-fit">
                        <button 
                          onClick={() => setAmount(Math.max(1, amount - 1))}
                          className="p-1 hover:bg-white/10 rounded-md text-gray-400"
                        >
                          <Minus size={16} />
                        </button>
                        <input 
                          type="number" 
                          value={amount} 
                          onChange={(e) => setAmount(Number(e.target.value))}
                          className="w-16 bg-transparent text-center font-black text-sm outline-none"
                        />
                        <button 
                          onClick={() => setAmount(amount + 1)}
                          className="p-1 hover:bg-white/10 rounded-md text-gray-400"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Quick Amounts & Bet Button */}
                  <div className="grid grid-cols-2 gap-3 mt-1">
                    <div className="grid grid-cols-2 gap-2">
                       {[0.50, 40.00, 380.00, 3000.00].map(val => (
                         <button 
                           key={val}
                           onClick={() => setAmount(val)}
                           className="py-1.5 text-[10px] font-black italic bg-black/40 border border-white/10 rounded-md hover:bg-white/10 transition-colors"
                         >
                           {val.toFixed(2)}
                         </button>
                       ))}
                       <button 
                        onClick={() => setAmount(balance)}
                        className="col-span-2 py-1.5 text-[10px] font-black italic bg-black/60 border border-white/10 rounded-md hover:bg-[#ff5722] hover:text-black transition-all uppercase"
                       >
                         Max
                       </button>
                    </div>

                    <div className="relative">
                      {gameState === 'in_progress' && currentBet && !currentBet.cashedOut ? (
                        <button 
                          onClick={() => handleCashout(panel)}
                          disabled={isCashingOut}
                          className="w-full h-full bg-gradient-to-b from-[#ff9100] to-[#ff6d00] rounded-xl flex flex-col items-center justify-center gap-0.5 shadow-[0_4px_15px_rgba(255,145,0,0.3)] active:scale-95 transition-all animate-pulse"
                        >
                          {isCashingOut ? (
                              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          ) : (
                            <>
                                <span className="text-xs font-black uppercase text-white tracking-widest">Cash Out</span>
                                <span className="text-lg font-black text-white italic">{(amount * multiplier).toFixed(2)}</span>
                            </>
                          )}
                        </button>
                      ) : (
                        <button 
                          onClick={() => {
                            if (currentBet || isWaiting) {
                              if (panel === 1) {
                                setCurrentBet1(null);
                                setIsWaitingBet1(false);
                              } else {
                                setCurrentBet2(null);
                                setIsWaitingBet2(false);
                              }
                            } else {
                              placeBet(panel);
                            }
                          }}
                          disabled={gameState === 'crashed' || isWaiting}
                          className={`w-full h-full rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all active:scale-95 shadow-lg ${
                            isWaiting || currentBet 
                              ? 'bg-red-600/20 border border-red-500/50 text-red-500' 
                              : 'bg-gradient-to-b from-[#4caf50] to-[#2e7d32] hover:from-[#66bb6a] hover:to-[#388e3c] border border-[#ffffff20]'
                          }`}
                        >
                          {isWaiting ? (
                              <div className="w-5 h-5 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin" />
                          ) : (
                            <>
                                <span className="text-xl font-black text-white italic uppercase tracking-tighter">
                                  {currentBet ? 'Cancel' : 'Bet'}
                                </span>
                                {!currentBet && (
                                    <span className="text-base font-black text-white italic tracking-tighter">
                                      {amount.toFixed(2)}
                                    </span>
                                )}
                                {!currentBet && (
                                   <span className="text-[7px] font-black uppercase tracking-widest text-white/70">(Next Round)</span>
                                )}
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      </div>

      {/* Secret Password Entry Modal */}
      <AnimatePresence>
        {showPasswordModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-[#1a1c23] border border-white/10 rounded-3xl p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button 
                type="button"
                onClick={() => {
                  setShowPasswordModal(false);
                  setPasswordInput('');
                }} 
                className="absolute top-4 right-4 p-1 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
              
              <div className="text-center mb-6">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-3 text-emerald-400">
                  <Shield size={24} />
                </div>
                <h3 className="text-lg font-black text-white italic">সিগন্যাল প্যানেল অ্যাক্সেস</h3>
                <p className="text-xs text-gray-400 mt-1">প্যানেলটি আনলক করতে ওনার পাসওয়ার্ড দিন</p>
              </div>

              <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5 text-left">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">পাসওয়ার্ড (Password)</label>
                  <input 
                    type="password"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="পাসওয়ার্ড লিখুন..."
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-emerald-500 focus:outline-none placeholder-gray-600 font-medium text-white"
                    autoFocus
                  />
                </div>

                <div className="flex gap-3 mt-2">
                  <button 
                    type="button"
                    onClick={() => {
                      setShowPasswordModal(false);
                      setPasswordInput('');
                    }}
                    className="flex-1 py-3 text-xs font-bold rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-white"
                  >
                    বাতিল করুন
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-3 text-xs font-black rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-lg shadow-emerald-500/20 active:scale-95 transition-all text-center"
                  >
                    যাচাই করুন
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
