import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '../../services/firebase';
import GameLoader from '../ui/GameLoader';
import { collection, addDoc, serverTimestamp, doc, updateDoc, increment } from 'firebase/firestore';
import { 
  Plane, 
  TrendingUp, 
  Users, 
  Settings, 
  HelpCircle, 
  Plus, 
  Minus,
  Wallet,
  Trophy,
  Activity,
  Zap,
  X,
  PlusCircle,
  XCircle,
  Loader2,
  MessageSquare,
  CheckCircle,
  ShieldCheck,
  History,
  Send
} from 'lucide-react';

interface AviatorGameProps {
  balance: number;
  onBalanceUpdate: (newBalance: number, persist?: boolean) => void;
  showToast: (message: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
  onClose: () => void;
  userData: any;
  globalLogos?: Record<string, string>;
  globalNames?: Record<string, string>;
}

const sha256 = (str: string): string => {
  const rightRotate = (value: number, amount: number) => {
    return (value >>> amount) | (value << (32 - amount));
  };
  
  const mathPow = Math.pow;
  const maxWord = mathPow(2, 32);
  let i, j;
  let result = '';

  const words: number[] = [];
  const asciiLength = str.length * 8;
  
  let hash: number[] = [];
  const k: number[] = [];
  let primeCounter = 0;

  const isPrime = (n: number) => {
    for (let factor = 2; factor * factor <= n; factor++) {
      if (n % factor === 0) return false;
    }
    return true;
  };

  let candidate = 2;
  while (primeCounter < 64) {
    if (isPrime(candidate)) {
      if (primeCounter < 8) {
        hash[primeCounter] = (mathPow(candidate, .5) * maxWord) >>> 0;
      }
      k[primeCounter] = (mathPow(candidate, 1 / 3) * maxWord) >>> 0;
      primeCounter++;
    }
    candidate++;
  }

  const asciiBytes: number[] = [];
  for (i = 0; i < str.length; i++) {
    asciiBytes.push(str.charCodeAt(i));
  }

  asciiBytes.push(0x80);
  while (asciiBytes.length % 64 !== 56) {
    asciiBytes.push(0);
  }
  
  asciiBytes.push(0);
  asciiBytes.push(0);
  asciiBytes.push(0);
  asciiBytes.push(0);
  asciiBytes.push((asciiLength >>> 24) & 0xff);
  asciiBytes.push((asciiLength >>> 16) & 0xff);
  asciiBytes.push((asciiLength >>> 8) & 0xff);
  asciiBytes.push(asciiLength & 0xff);

  for (i = 0; i < asciiBytes.length; i += 4) {
    words.push((asciiBytes[i] << 24) | (asciiBytes[i + 1] << 16) | (asciiBytes[i + 2] << 8) | asciiBytes[i + 3]);
  }

  for (i = 0; i < words.length; i += 16) {
    const w = words.slice(i, i + 16);
    const oldHash = [...hash];

    for (j = 0; j < 64; j++) {
      if (j >= 16) {
        const w15 = w[j - 15];
        const w2 = w[j - 2];
        const s0 = rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3);
        const s1 = rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10);
        w[j] = (w[j - 16] + s0 + w[j - 7] + s1) | 0;
      }

      const ch = (hash[4] & hash[5]) ^ (~hash[4] & hash[6]);
      const maj = (hash[0] & hash[1]) ^ (hash[0] & hash[2]) ^ (hash[1] & hash[2]);
      const s0_h = rightRotate(hash[0], 2) ^ rightRotate(hash[0], 13) ^ rightRotate(hash[0], 22);
      const s1_h = rightRotate(hash[4], 6) ^ rightRotate(hash[4], 11) ^ rightRotate(hash[4], 25);
      
      const temp1 = (hash[7] + s1_h + ch + k[j] + (w[j] || 0)) | 0;
      const temp2 = (s0_h + maj) | 0;

      hash = [(temp1 + temp2) | 0].concat(hash);
      hash[8] = 0;
      hash[4] = (hash[4] + temp1) | 0;
    }

    for (j = 0; j < 8; j++) {
      hash[j] = (hash[j] + oldHash[j]) | 0;
    }
  }

  for (i = 0; i < 8; i++) {
    result += (hash[i] >>> 0).toString(16).padStart(8, '0');
  }
  return result;
};

// Deterministic hash helper for Provably Fair transparency calculation using custom server seed
const computeFairnessHash = (serverSeed: string, clientSeed: string) => {
  const combined = clientSeed ? `${serverSeed}:${clientSeed}` : serverSeed;
  return sha256(combined);
};

type GameState = 'waiting' | 'in_progress' | 'crashed';

export default function AviatorGame({ balance, onBalanceUpdate, showToast, onClose, userData, globalLogos, globalNames }: AviatorGameProps) {
  const [showLoader, setShowLoader] = useState(true);
  const [gameState, setGameState] = useState<GameState>('waiting');
  const [multiplier, setMultiplier] = useState(1.00);
  const [gameHistory, setGameHistory] = useState<number[]>([]);
  const [activeBets, setActiveBets] = useState<{ id: string; user: string; amount: number; cashOut?: number }[]>([]);
  const [nextGameTimer, setNextGameTimer] = useState(10);
  
  // Independent States for Panel 1
  const [betAmount1, setBetAmount1] = useState(100);
  const [isAutoBet1, setIsAutoBet1] = useState(false);
  const [autoCashOut1, setAutoCashOut1] = useState<number | null>(2.00);
  const [isAutoWithdraw1, setIsAutoWithdraw1] = useState(false);
  const [currentBet1, setCurrentBet1] = useState<{ amount: number; cashedOut: boolean } | null>(null);
  const [isWaitingBet1, setIsWaitingBet1] = useState(false);

  // Independent States for Panel 2
  const [betAmount2, setBetAmount2] = useState(100);
  const [isAutoBet2, setIsAutoBet2] = useState(false);
  const [autoCashOut2, setAutoCashOut2] = useState<number | null>(2.00);
  const [isAutoWithdraw2, setIsAutoWithdraw2] = useState(false);
  const [currentBet2, setCurrentBet2] = useState<{ amount: number; cashedOut: boolean } | null>(null);
  const [isWaitingBet2, setIsWaitingBet2] = useState(false);

  // Double Panel control
  const [showSecondPanel, setShowSecondPanel] = useState(true);

  // Audio simulation
  const playSound = (type: 'win' | 'bet' | 'crash') => {
    console.log(`Sound triggered: ${type}`);
  };

  // Keep latest states in refs to preserve them during async EventSource trigger
  const balanceRef = useRef(balance);
  const onBalanceUpdateRef = useRef(onBalanceUpdate);
  const currentBet1Ref = useRef(currentBet1);
  const currentBet2Ref = useRef(currentBet2);
  const isWaitingBet1Ref = useRef(isWaitingBet1);
  const isWaitingBet2Ref = useRef(isWaitingBet2);
  const isAutoBet1Ref = useRef(isAutoBet1);
  const isAutoBet2Ref = useRef(isAutoBet2);
  const multiplierRef = useRef(multiplier);
  const betAmount1Ref = useRef(betAmount1);
  const betAmount2Ref = useRef(betAmount2);
  const autoCashOut1Ref = useRef(autoCashOut1);
  const autoCashOut2Ref = useRef(autoCashOut2);
  const isAutoWithdraw1Ref = useRef(isAutoWithdraw1);
  const isAutoWithdraw2Ref = useRef(isAutoWithdraw2);

  // New Features States
  const [activeTab, setActiveTab] = useState<'all' | 'my' | 'top'>('all');
  const [showSignal, setShowSignal] = useState(false);
  const [currentSignal, setCurrentSignal] = useState<string>('---');
  const [signalLoading, setSignalLoading] = useState(false);
  const [myBetsHistory, setMyBetsHistory] = useState<{ amount: number, cashOut?: number, mult?: number, date: number }[]>([]);
  const [showFairness, setShowFairness] = useState<{ show: boolean, hash?: string, mult?: number, serverSeed?: string, clientSeed?: string }>({ show: false });
  const [chatMessages, setChatMessages] = useState<{ id: string, user: string, text: string }[]>([
    { id: '1', user: 'Aviator_Pro', text: 'লেটস গো 🚀' },
    { id: '2', user: 'BD_King', text: 'আজকে ভাই ৫x যাবে?' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [showChat, setShowChat] = useState(false);

  useEffect(() => { balanceRef.current = balance; }, [balance]);
  useEffect(() => { onBalanceUpdateRef.current = onBalanceUpdate; }, [onBalanceUpdate]);
  useEffect(() => { currentBet1Ref.current = currentBet1; }, [currentBet1]);
  useEffect(() => { currentBet2Ref.current = currentBet2; }, [currentBet2]);
  useEffect(() => { isWaitingBet1Ref.current = isWaitingBet1; }, [isWaitingBet1]);
  useEffect(() => { isWaitingBet2Ref.current = isWaitingBet2; }, [isWaitingBet2]);
  useEffect(() => { isAutoBet1Ref.current = isAutoBet1; }, [isAutoBet1]);
  useEffect(() => { isAutoBet2Ref.current = isAutoBet2; }, [isAutoBet2]);
  useEffect(() => { multiplierRef.current = multiplier; }, [multiplier]);
  useEffect(() => { betAmount1Ref.current = betAmount1; }, [betAmount1]);
  useEffect(() => { betAmount2Ref.current = betAmount2; }, [betAmount2]);
  useEffect(() => { autoCashOut1Ref.current = autoCashOut1; }, [autoCashOut1]);
  useEffect(() => { autoCashOut2Ref.current = autoCashOut2; }, [autoCashOut2]);
  useEffect(() => { isAutoWithdraw1Ref.current = isAutoWithdraw1; }, [isAutoWithdraw1]);
  useEffect(() => { isAutoWithdraw2Ref.current = isAutoWithdraw2; }, [isAutoWithdraw2]);

  // Handle Signal Generation - Loading effect only
  useEffect(() => {
    if (gameState === 'waiting') {
      setSignalLoading(true);
      const timer = setTimeout(() => {
        setSignalLoading(false);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [gameState]);

  // Firestore Bet Database Registration
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
      console.log("[Aviator REST] Bet written securely in Firestore.");
    } catch (err) {
      console.error("[Aviator Firestore Error] Failed to log bet:", err);
    }
  };

  // High-reliability Cash Out method
  const handleCashOut = (panel: 1 | 2, forceMult?: number) => {
    const activeMult = forceMult || multiplierRef.current;
    
    if (panel === 1) {
      const activeBet = currentBet1Ref.current;
      if (!activeBet || activeBet.cashedOut) return;

      const winAmount = Math.floor(activeBet.amount * activeMult);
      console.log(`[Aviator Debug V2] Cashout Panel 1 Triggered. Old Balance: ${balanceRef.current}, Win: ${winAmount}, New: ${balanceRef.current + winAmount}`);
      if (onBalanceUpdateRef.current) {
        onBalanceUpdateRef.current(balanceRef.current + winAmount);
      } else {
        console.error("[Aviator Debug V2] Cashout Panel 1: onBalanceUpdateRef.current is null!");
      }

      const updatedBet = { ...activeBet, cashedOut: true };
      setCurrentBet1(updatedBet);
      currentBet1Ref.current = updatedBet;

      setMyBetsHistory(prev => [{ amount: activeBet.amount, cashOut: winAmount, mult: activeMult, date: Date.now() }, ...prev]);
      logBet(activeBet.amount, winAmount, activeMult);
      playSound('win');
      showToast(`৳${winAmount} উইন হয়েছেন! (${activeMult.toFixed(2)}x)`, "success");
    } else {
      const activeBet = currentBet2Ref.current;
      if (!activeBet || activeBet.cashedOut) return;

      const winAmount = Math.floor(activeBet.amount * activeMult);
      console.log(`[Aviator Debug] Cashout Panel 2: Old balance: ${balanceRef.current}, Win amount: ${winAmount}, New balance: ${balanceRef.current + winAmount}`);
      onBalanceUpdateRef.current(balanceRef.current + winAmount);
      
      const updatedBet = { ...activeBet, cashedOut: true };
      setCurrentBet2(updatedBet);
      currentBet2Ref.current = updatedBet;

      setMyBetsHistory(prev => [{ amount: activeBet.amount, cashOut: winAmount, mult: activeMult, date: Date.now() }, ...prev]);
      logBet(activeBet.amount, winAmount, activeMult);
      playSound('win');
      showToast(`৳${winAmount} উইন হয়েছেন! (${activeMult.toFixed(2)}x)`, "success");
    }
  };

  // Handles Bet placements, cancellation and waiting statuses
  const handleBetAction = async (panel: 1 | 2) => {
    const isWaiting = panel === 1 ? isWaitingBet1 : isWaitingBet2;
    const currentBet = panel === 1 ? currentBet1 : currentBet2;
    const betAmount = panel === 1 ? betAmount1 : betAmount2;

    // Check daily bet limit
    if (userData?.dailyBetLimit && userData.dailyBetLimit > 0) {
      const today = new Date().toDateString();
      const lastBetDate = userData.lastBetDate || '';
      const currentDailyTotal = lastBetDate === today ? (userData.dailyTotalBets || 0) : 0;
      
      if (currentDailyTotal + betAmount > userData.dailyBetLimit) {
        showToast("আপনার দৈনিক বেটের সীমা অতিক্রম করেছে!", "error");
        return;
      }
      if (currentDailyTotal + betAmount >= 0.8 * userData.dailyBetLimit && currentDailyTotal < 0.8 * userData.dailyBetLimit) {
        showToast("সতর্কতা: আপনার দৈনিক বেটের সীমাবদ্ধতার কাছাকাছি পৌঁছেছেন!", "warning");
      }
    }

    // 1. Cancel next booked bet
    if (isWaiting) {
      onBalanceUpdate(balanceRef.current + betAmount);
      if (panel === 1) {
        setIsWaitingBet1(false);
        isWaitingBet1Ref.current = false;
      } else {
        setIsWaitingBet2(false);
        isWaitingBet2Ref.current = false;
      }
      showToast("অপেক্ষারত বেট বাতিল করা হয়েছে", "info");
      return;
    }

    // 2. Active placement when game is waiting
    if (gameState === 'waiting') {
      if (balanceRef.current < betAmount) {
        showToast("আপনার ব্যালেন্স পর্যাপ্ত নয়", "error");
        return;
      }
      if (currentBet) return; // Already placed

      onBalanceUpdate(balanceRef.current - betAmount);
      const placedBet = { amount: betAmount, cashedOut: false };
      
      if (panel === 1) {
        setCurrentBet1(placedBet);
        currentBet1Ref.current = placedBet;
      } else {
        setCurrentBet2(placedBet);
        currentBet2Ref.current = placedBet;
      }
      playSound('bet');
      showToast(`৳${betAmount} বেট সফলভাবে প্লেস করা হয়েছে`, "success");

      // Update daily total
      if (userData?.id) {
        const today = new Date().toDateString();
        const lastBetDate = userData.lastBetDate || '';
        const currentDailyTotal = lastBetDate === today ? (userData.dailyTotalBets || 0) : 0;
        await updateDoc(doc(db, 'users', userData.id), {
          dailyTotalBets: currentDailyTotal + betAmount,
          lastBetDate: today,
          totalBets: increment(betAmount)
        });

        // Trigger bonus check
        import('../../utils/bonusUtils').then(utils => utils.checkAndAwardReferralBonus(userData.id, showToast));
      }
    } 
    // 3. Game is running - place a pre-booked (Waiting) bet for the upcoming session
    else {
      if (balanceRef.current < betAmount) {
        showToast("আপনার ব্যালেন্স পর্যাপ্ত নয়", "error");
        return;
      }
      if (currentBet && !currentBet.cashedOut) return; // Active in current round, cannot place another until ended

      onBalanceUpdate(balanceRef.current - betAmount);
      if (panel === 1) {
        setIsWaitingBet1(true);
        isWaitingBet1Ref.current = true;
      } else {
        setIsWaitingBet2(true);
        isWaitingBet2Ref.current = true;
      }
      showToast(`৳${betAmount} পরবর্তী রাউন্ডের জন্য বুক করা হয়েছে।`, "info");
      
      // Update daily total
      if (userData?.id) {
        const today = new Date().toDateString();
        const lastBetDate = userData.lastBetDate || '';
        const currentDailyTotal = lastBetDate === today ? (userData.dailyTotalBets || 0) : 0;
        await updateDoc(doc(db, 'users', userData.id), {
          dailyTotalBets: currentDailyTotal + betAmount,
          lastBetDate: today,
          totalBets: increment(betAmount)
        });

        // Trigger bonus check
        import('../../utils/bonusUtils').then(utils => utils.checkAndAwardReferralBonus(userData.id, showToast));
      }
    }
  };

  // Real-time EventSource and Fallback HTTP polling
  useEffect(() => {
    console.log("[Aviator System] Initializing high-speed SSE link with HTTP polling recovery fallback...");
    const eventSource = new EventSource('/api/aviator/stream');
    const lastSseUpdateRef = { current: 0 };

    const handleStateUpdate = (data: any) => {
      try {
        if (!data) return;

        const serverState = data.state || 'waiting';
        const serverMult = data.multiplier || 1.00;
        const serverTimer = data.timer || 0;
        const serverHistory = data.history || [];
        const serverSignal = data.nextCrashPoint;

        setGameState(serverState);
        setMultiplier(serverMult);
        setNextGameTimer(Math.max(0, Math.ceil(serverTimer)));
        setGameHistory(serverHistory);
        
        if (serverSignal) {
          setCurrentSignal(serverSignal.toFixed(2) + 'x');
        }

        // State Change Checks
        if (serverState === 'waiting') {
          // A. Convert waiting pre-bets to active bets for the new round
          if ((isWaitingBet1Ref.current || isAutoBet1Ref.current) && !currentBet1Ref.current) {
            if (balanceRef.current >= betAmount1Ref.current) {
              onBalanceUpdateRef.current(balanceRef.current - betAmount1Ref.current);
              const placedBet = { amount: betAmount1Ref.current, cashedOut: false };
              setCurrentBet1(placedBet);
              currentBet1Ref.current = placedBet;
              setIsWaitingBet1(false);
              isWaitingBet1Ref.current = false;
              playSound('bet');
            }
          }
          if ((isWaitingBet2Ref.current || isAutoBet2Ref.current) && !currentBet2Ref.current) {
             if (balanceRef.current >= betAmount2Ref.current) {
              onBalanceUpdateRef.current(balanceRef.current - betAmount2Ref.current);
              const placedBet = { amount: betAmount2Ref.current, cashedOut: false };
              setCurrentBet2(placedBet);
              currentBet2Ref.current = placedBet;
              setIsWaitingBet2(false);
              isWaitingBet2Ref.current = false;
              playSound('bet');
            }
          }
        }

        // Auto Cashout checks
        if (serverState === 'in_progress') {
          // Panel 1 Auto Cashout
          const actBet1 = currentBet1Ref.current;
          if (actBet1 && !actBet1.cashedOut) {
            const acPoint1 = autoCashOut1Ref.current;
            if (isAutoWithdraw1Ref.current && acPoint1 && serverMult >= acPoint1) {
              handleCashOut(1, serverMult);
            }
          }

          // Panel 2 Auto Cashout
          const actBet2 = currentBet2Ref.current;
          if (actBet2 && !actBet2.cashedOut) {
            const acPoint2 = autoCashOut2Ref.current;
            if (isAutoWithdraw2Ref.current && acPoint2 && serverMult >= acPoint2) {
              handleCashOut(2, serverMult);
            }
          }
        }

        // Safe Wipe on Crash
        if (serverState === 'crashed') {
          const actBet1 = currentBet1Ref.current;
          if (actBet1 && !actBet1.cashedOut) {
            setMyBetsHistory(prev => [{ amount: actBet1.amount, date: Date.now() }, ...prev]);
            logBet(actBet1.amount, 0, 0);
          }
          setCurrentBet1(null);
          currentBet1Ref.current = null;

          const actBet2 = currentBet2Ref.current;
          if (actBet2 && !actBet2.cashedOut) {
            setMyBetsHistory(prev => [{ amount: actBet2.amount, date: Date.now() }, ...prev]);
            logBet(actBet2.amount, 0, 0);
          }
          setCurrentBet2(null);
          currentBet2Ref.current = null;
        }

        // Simulated Bets Ticker Sync
        if (serverState === 'waiting') {
          setActiveBets(prev => {
            if (prev.length === 0) {
              return Array.from({ length: 5 + Math.floor(Math.random() * 8) }, (_, i) => ({
                id: `player_${i}_${Date.now()}`,
                user: `biker_boss_${Math.floor(100 + Math.random() * 900)}`,
                amount: [100, 200, 500, 1000, 1500, 2000][Math.floor(Math.random() * 6)]
              }));
            }
            return prev;
          });
        } else if (serverState === 'in_progress') {
          setActiveBets(prev => 
            prev.map(b => {
              if (!b.cashOut && Math.random() < 0.08) {
                return { ...b, cashOut: Number((1.05 + Math.random() * (serverMult - 1.05)).toFixed(2)) };
              }
              return b;
            })
          );
        } else if (serverState === 'crashed') {
          setActiveBets([]);
        }

      } catch (err) {
        console.error("[Aviator Stream Parse Error]:", err);
      }
    };

    eventSource.onmessage = (event) => {
      lastSseUpdateRef.current = Date.now();
      try {
        const data = JSON.parse(event.data);
        handleStateUpdate(data);
      } catch (e) {}
    };

    eventSource.onerror = (error) => {
      console.warn("[Aviator Stream] Connection loss, using HTTP recovery fallback...", error);
    };

    // Robust HTTP polling fallback interval (runs every 450ms when SSE is quiet or failing)
    const fallbackPoll = setInterval(async () => {
      if (Date.now() - lastSseUpdateRef.current < 800) {
        // SSE is active and healthy, skip poll
        return;
      }
      try {
        const res = await fetch('/api/aviator/state');
        if (res.ok) {
          const data = await res.json();
          handleStateUpdate(data);
        }
      } catch (e) {
        console.warn("[Aviator Fallback Polling Error]:", e);
      }
    }, 450);

    return () => {
      console.log("[Aviator System] Securing SSE and Polling teardown...");
      eventSource.close();
      clearInterval(fallbackPoll);
    };
  }, []);

  // Dynamic coordinates interpolation for modern red jet propeller trajectory curve
  const progressX = Math.min(85, 10 + (Math.max(1, multiplier) - 1.0) * 12);
  const progressY = Math.max(20, 80 - Math.pow(Math.max(1, multiplier) - 1.0, 0.7) * 18);
  
  return (
    <div id="aviator-root-game" className="fixed inset-0 z-[150] bg-[#0c0c0d] flex flex-col font-sans select-none">
      {showLoader && <GameLoader gameName="Aviator" onLoadComplete={() => setShowLoader(false)} />}
      {!showLoader && (
        <div className="flex flex-col flex-1">
          {/* Upper Navigation Bar */}
          <div id="aviator-header" className="h-[70px] bg-[#141518] flex items-center justify-between px-4 border-b border-white/5 shadow-md">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-3">
                 <button onClick={() => setShowChat(true)} className="relative text-gray-400 hover:text-white transition-colors bg-white/5 p-2 rounded-xl border border-white/5 shadow-sm">
                    <MessageSquare size={18} />
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border border-black animate-pulse" />
                 </button>
                 <button id="aviator-back" onClick={onClose} className="text-gray-400 hover:text-white transition-colors bg-white/5 p-2 rounded-xl border border-white/5 shadow-sm">
                   <X size={20} />
                 </button>
              </div>
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center text-white shadow-[0_0_20px_rgba(220,38,38,0.3)] overflow-hidden">
                    {(globalLogos?.['spribe_aviator']) ? (
                      <img src={globalLogos['spribe_aviator']} alt="Aviator" className="w-full h-full object-cover" />
                    ) : (
                      <Plane size={24} className="transform rotate-[15deg] fill-white" />
                    )}
                 </div>
                 <div className="flex flex-col">
                    <span className="text-lg font-black text-white italic tracking-tighter uppercase leading-none">
                      {globalNames?.['spribe_aviator'] || 'AVIATOR'}
                    </span>
                    <span className="text-[9px] font-bold text-red-500 uppercase tracking-widest mt-1">SPRIBE</span>
                 </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex flex-col items-end gap-1">
                <div className="bg-black/40 border border-white/5 px-4 py-2 rounded-xl flex items-center gap-2.5 shadow-inner">
                  <Wallet size={16} className="text-emerald-400" />
                  <span className="text-sm font-black text-white tracking-tight">৳ {balance.toLocaleString('bn-BD')}</span>
                </div>
                {balance < 50 && (
                  <div className="text-[9px] uppercase tracking-widest font-black text-red-400 bg-red-950/30 px-2 py-0.5 rounded-md animate-pulse border border-red-500/20">
                    Low Balance - Deposit Now
                  </div>
                )}
              </div>
              <button onClick={onClose} className="bg-red-500/10 hover:bg-red-500/20 text-red-500 text-xs font-black uppercase px-4 py-2 rounded-xl transition-all border border-red-500/10">
                Exit
              </button>
            </div>
          </div>

          {/* Main Container Workspace */}
          <div id="aviator-workspace" className="flex-1 flex flex-col lg:flex-row p-2 gap-2 min-h-0 overflow-y-auto lg:overflow-hidden">
            <div id="aviator-left-wing" className="flex-1 flex flex-col gap-2 overflow-y-auto min-h-0">
          
          {/* History Ribbon */}
          <div id="aviator-history-bar" className="flex overflow-x-auto gap-1.5 no-scrollbar py-1.5 bg-black/40 px-2 rounded-xl border border-white/5 shrink-0 min-h-[38px] items-center">
            {gameHistory.map((mult, i) => {
              const borderTheme = mult > 10.0 ? 'bg-purple-600/20 border-purple-500/50 text-purple-300' :
                                  mult > 2.0  ? 'bg-blue-600/25 border-blue-500/50 text-blue-300' :
                                  'bg-slate-800/50 border-white/10 text-slate-300';
              return (
                <div 
                  key={i} 
                  onClick={() => {
                    const sSeed = 'Ofa10e99383049ffec42858a1511a830';
                    const cSeed = `client_seed_${(mult * 7).toFixed(0)}_${i + 1}`;
                    const resHash = computeFairnessHash(sSeed, cSeed);
                    setShowFairness({
                      show: true,
                      mult,
                      serverSeed: sSeed,
                      clientSeed: cSeed,
                      hash: resHash
                    });
                  }}
                  className={`cursor-pointer hover:scale-105 min-w-[60px] h-[26px] rounded-full flex items-center justify-center text-[10.5px] font-extrabold border transition-all shrink-0 ${borderTheme}`}
                >
                  {mult.toFixed(2)}x
                </div>
              );
            })}
            {gameHistory.length === 0 && (
              <div className="text-[10px] text-gray-400 font-bold px-2 py-1 flex items-center gap-2 shrink-0">
                <Loader2 size={12} className="animate-spin text-red-500 shrink-0" />
                HISTORY DISCOVERING...
              </div>
            )}
          </div>

          {/* Graphics Stage Box */}
          <div id="aviator-gameplay-stage" className="flex-1 bg-gradient-to-b from-[#13151b] to-[#07080a] rounded-2xl relative overflow-hidden flex flex-col border border-white/5 shadow-[inset_0_0_60px_rgba(0,0,0,0.85)] min-h-[220px]">
             
             {/* 1. Fine High-Tech Grid Mesh */}
             <div className="absolute inset-0 opacity-[0.06] pointer-events-none" style={{ backgroundImage: 'linear-gradient(to right, #4f4f4f 1px, transparent 1px), linear-gradient(to bottom, #4f4f4f 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

             {/* 2. Concentric Radar Circles for Cyberpunk Aesthetic */}
             <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.16]">
                <div className="absolute w-[20%] h-[20%] border border-red-500/25 rounded-full animate-pulse" />
                <div className="absolute w-[45%] h-[45%] border border-[#3b3d45]/40 rounded-full" />
                <div className="absolute w-[70%] h-[70%] border border-dashed border-[#3b3d45]/30 rounded-full" />
                <div className="absolute w-[95%] h-[95%] border border-[#3b3d45]/20 rounded-full" />
                
                {/* 3. Tech Crosshair Hairlines */}
                <div className="absolute w-[100%] h-[1px] bg-[#3b3d45]/20" />
                <div className="absolute h-[100%] w-[1px] bg-[#3b3d45]/20" />
             </div>

             {/* 4. Slow Rotating Tech Radar Sweep */}
             <div className="absolute inset-x-0 inset-y-0 flex items-center justify-center pointer-events-none opacity-5 animate-[spin_15s_linear_infinite]">
                <div className="w-full h-full max-w-[90%] max-h-[90%] rounded-full bg-gradient-sweep-fade" 
                     style={{ background: 'conic-gradient(from 0deg, rgba(239, 68, 68, 0.3) 0deg, rgba(239, 68, 68, 0) 90deg, transparent 360deg)' }} />
             </div>

             {/* 5. Telemetry & Target Marks (High-fidelity minimalist data aesthetics) */}
             <div className="absolute top-4 left-4 pointer-events-none flex flex-col gap-1 z-0">
                <div className="flex items-center gap-1.5">
                   <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                   <span className="text-[8px] font-mono font-black text-gray-500 uppercase tracking-widest">SYSTEM: MATCH MATCHING</span>
                </div>
                <div className="text-[8px] font-mono font-bold text-gray-600 tracking-wider">RADAR TARGET ID: SPIN-71</div>
             </div>

             {/* Dynamic Flight Canvas containing Bezier Curve & Plane Flight Position */}
             <div className="absolute inset-0 z-10 pointer-events-none">
                {/* SVG flight curve path */}
                {(gameState === 'in_progress' || gameState === 'crashed') && (
                   <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 1000 1000" preserveAspectRatio="none">
                      <defs>
                         <linearGradient id="curve-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="rgba(239, 68, 68, 0.05)" />
                            <stop offset="50%" stopColor="rgba(239, 68, 68, 0.35)" />
                            <stop offset="100%" stopColor="rgba(239, 68, 68, 0.95)" />
                         </linearGradient>
                         <linearGradient id="area-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="rgba(239, 68, 68, 0.35)" />
                            <stop offset="100%" stopColor="rgba(239, 68, 68, 0.0)" />
                         </linearGradient>
                         <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                            <feGaussianBlur stdDeviation="10" result="blur" />
                            <feMerge>
                               <feMergeNode in="blur" />
                               <feMergeNode in="SourceGraphic" />
                            </feMerge>
                         </filter>
                      </defs>

                      {/* Area Fill Under Curve */}
                      <motion.path 
                         d={`M 100 800 Q ${progressX * 7.5 + 50} 800 ${progressX * 10} ${progressY * 10} L ${progressX * 10} 800 L 100 800 Z`}
                         fill="url(#area-gradient)"
                         initial={{ opacity: 0 }}
                         animate={{ opacity: 1 }}
                         transition={{ duration: 0.25 }}
                      />

                      {/* Main Neon Red Trail Line */}
                      <motion.path 
                         d={`M 100 800 Q ${progressX * 7.5 + 50} 800 ${progressX * 10} ${progressY * 10}`}
                         fill="transparent"
                         stroke="url(#curve-gradient)"
                         strokeWidth="10"
                         strokeLinecap="round"
                         filter="url(#glow)"
                         initial={{ opacity: 0 }}
                         animate={{ opacity: 1 }}
                         transition={{ duration: 0.25 }}
                      />

                      {/* Inner High-Intensity White Core Line */}
                      <motion.path 
                         d={`M 100 800 Q ${progressX * 7.5 + 50} 800 ${progressX * 10} ${progressY * 10}`}
                         fill="transparent"
                         stroke="#ffffff"
                         strokeWidth="3"
                         strokeLinecap="round"
                         initial={{ opacity: 0 }}
                         animate={{ opacity: 1 }}
                         transition={{ duration: 0.25 }}
                      />
                   </svg>
                )}

                {/* Unified Plane rendering block */}
                <motion.div 
                   className="absolute z-20"
                   animate={{ 
                      left: gameState === 'waiting' ? '10%' : gameState === 'crashed' ? '115%' : `${progressX}%`,
                      top: gameState === 'waiting' ? '80%' : gameState === 'crashed' ? '-15%' : `${progressY}%`,
                      rotate: gameState === 'waiting' ? 0 : gameState === 'crashed' ? -40 : -22,
                   }}
                   style={{ transform: 'translate(-50%, -50%)' }}
                   transition={{ 
                      type: gameState === 'crashed' ? 'tween' : 'spring', 
                      duration: gameState === 'crashed' ? 1.4 : undefined,
                      damping: 24, 
                      stiffness: 55 
                   }}
                >
                   {/* Propeller Plane Icon */}
                   <div className="relative group">
                      {/* Hyper glowing pulse rings */}
                      <div className="absolute -inset-8 bg-red-600/35 blur-3xl rounded-full scale-150 animate-pulse animate-duration-1000" />
                      
                      {/* Dynamic engine shockwave exhaust streams */}
                      {gameState !== 'waiting' && (
                         <div className="absolute right-12 top-1/2 -translate-y-1/2 flex items-center gap-1.5 opacity-80 rotate-180 origin-left">
                            <span className="w-10 h-0.5 bg-gradient-to-r from-red-500 to-transparent rounded-full animate-pulse" />
                            <span className="w-16 h-1 bg-gradient-to-r from-yellow-400 to-transparent rounded-full opacity-70" />
                            <span className="w-6 h-0.5 bg-gradient-to-r from-orange-500 to-transparent rounded-full animate-ping" />
                         </div>
                      )}

                      <div className="relative">
                         <Plane 
                            size={56} 
                            className="text-red-500 fill-red-600 drop-shadow-[0_0_20px_rgba(239,68,68,1.0)] transform rotate-[15deg]" 
                         />
                         
                         {/* Spinning propeller thrust glow */}
                         <div className="absolute -right-1 top-4 w-1 h-8 bg-yellow-400/80 rounded-full blur-xs animate-ping" />
                         <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-4 h-4 bg-red-500 rounded-full blur-sm animate-ping opacity-75" />
                      </div>
                   </div>
                </motion.div>
             </div>

             {/* SSE Multiplier & State Overlays Display */}
             <div className="flex-1 flex flex-col items-center justify-center relative z-25">
                {/* AI Predictor Overlay */}
                <div className="absolute top-4 right-4 z-30">
                  <div className="bg-black/90 backdrop-blur-md border border-red-500/30 rounded-xl p-2.5 flex flex-col items-center shadow-[0_0_20px_rgba(220,38,38,0.35)]">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Zap size={10} className="text-red-500 animate-pulse" />
                      <span className="text-[8px] font-black text-white italic tracking-widest uppercase">এআই প্রেডিক্টর (V2)</span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                       {signalLoading ? (
                         <div className="flex items-center gap-1">
                           <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                           <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                           <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                         </div>
                       ) : (
                         <div className="flex flex-col items-center">
                           <span className="text-lg font-black text-red-500 italic drop-shadow-[0_0_8px_rgba(220,38,38,0.6)] leading-none">{currentSignal}</span>
                           <span className="text-[7px] text-emerald-400 font-bold uppercase mt-1">হ্যাক সচল আছে</span>
                         </div>
                       )}
                    </div>
                  </div>
                </div>

                {gameState === 'waiting' && (
                  <div className="flex flex-col items-center gap-4 bg-black/50 backdrop-blur-sm px-6 py-5 rounded-3xl border border-white/5 shadow-2xl animate-fade-in relative overflow-hidden">
                     <div className="w-12 h-12 rounded-full border-4 border-t-red-600 border-white/10 animate-spin" />
                     <div className="flex flex-col items-center">
                       <p className="text-[10px] font-black text-rose-500 tracking-[0.35em] uppercase leading-none">WAITING FOR NEXT ROUND</p>
                       <p className="text-4xl font-black text-white italic mt-2 drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]">{nextGameTimer}s</p>
                     </div>
                  </div>
                )}

                {gameState === 'in_progress' && (
                  <div className="flex flex-col items-center justify-center w-full h-full relative">
                     <motion.h1 
                      key={multiplier}
                      initial={{ scale: 0.94, opacity: 0.85 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="text-8xl md:text-[10.5rem] font-sans font-black text-white italic tracking-tighter drop-shadow-[0_0_40px_rgba(239,68,68,0.35)] z-20"
                     >
                       {multiplier.toFixed(2)}<span className="text-4xl md:text-5xl pl-1 font-bold text-red-500">x</span>
                     </motion.h1>
                  </div>
                )}

                {gameState === 'crashed' && (
                  <div className="flex flex-col items-center justify-center animate-pulse z-20 bg-black/60 backdrop-blur-md px-8 py-6 rounded-3xl border border-red-500/20 shadow-[0_0_40px_rgba(239,68,68,0.25)]">
                     <p className="text-xs font-black text-red-500 uppercase tracking-[0.45em] mb-1 leading-none drop-shadow-[0_0_4px_rgba(239,68,68,0.5)]">FLEW AWAY!</p>
                     <h1 className="text-7xl md:text-[7rem] font-black text-red-600 italic tracking-tighter opacity-95 leading-none">
                       {multiplier.toFixed(2)}x
                     </h1>
                  </div>
                )}
             </div>

             {/* Graph indicators */}
             <div className="absolute left-4 bottom-4 flex flex-col gap-1.5 z-0 pointer-events-none">
                {[2.5, 1.5, 1.0].map(val => (
                  <div key={val} className="text-[9px] font-mono font-black text-gray-700/80 tracking-wider">00:{val.toFixed(1)}</div>
                ))}
             </div>
          </div>

          {/* DUAL CO-PILOT BETTING WORKSTATIONS */}
          <div id="aviator-betting-room" className="flex flex-col md:flex-row gap-2">
             
             {/* Workstation 1 */}
             <div id="aviator-workstation-1" className="flex-1 bg-[#191a1f] rounded-2xl p-3 border border-white/5 shadow-xl relative">
                <div className="flex items-center justify-between mb-3.5">
                   <div className="flex bg-black/60 rounded-full p-0.5 border border-white/5">
                      <button 
                        onClick={() => setIsAutoBet1(false)}
                        className={`px-4 py-1 text-[9px] font-black rounded-full transition-all uppercase ${!isAutoBet1 ? 'bg-red-600 text-white shadow-md' : 'text-gray-400'}`}
                      >
                        Bet
                      </button>
                      <button 
                        onClick={() => setIsAutoBet1(true)}
                        className={`px-4 py-1 text-[9px] font-black rounded-full transition-all uppercase ${isAutoBet1 ? 'bg-red-600 text-white shadow-md' : 'text-gray-400'}`}
                      >
                        Auto
                      </button>
                   </div>
                   
                   <div className="flex items-center gap-1.5">
                      <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest bg-black/30 px-2 py-0.5 rounded-md">Panel 1</span>
                      {!showSecondPanel && (
                        <button 
                          onClick={() => setShowSecondPanel(true)}
                          className="text-gray-400 hover:text-white transition-colors flex items-center gap-1 bg-white/5 px-2 py-1 rounded-lg text-[9px] font-bold"
                          title="২য় প্যানেল যুক্ত করুন"
                        >
                          <PlusCircle size={12} className="text-emerald-400" />
                          Add Bet 2
                        </button>
                      )}
                   </div>
                </div>

                <div className="flex gap-2">
                   {/* Parameters controls */}
                   <div className="flex-1 flex flex-col gap-2">
                      <div className="flex items-center bg-black/60 rounded-xl p-1 border border-white/5 focus-within:border-red-600/50 transition-all">
                         <button 
                          onClick={() => setBetAmount1(Math.max(10, betAmount1 - 10))}
                          className="w-10 h-10 flex items-center justify-center text-gray-300 hover:text-white bg-[#262830] rounded-lg transition-colors shadow-sm"
                         >
                           <Minus size={14} />
                         </button>
                         <input 
                          type="number"
                          value={betAmount1}
                          onChange={(e) => setBetAmount1(Math.max(10, Number(e.target.value)))}
                          className="flex-1 bg-transparent text-center text-base font-black text-white focus:outline-none w-10"
                         />
                         <button 
                          onClick={() => setBetAmount1(betAmount1 + 10)}
                          className="w-10 h-10 flex items-center justify-center text-gray-300 hover:text-white bg-[#262830] rounded-lg transition-colors shadow-sm"
                         >
                           <Plus size={14} />
                         </button>
                      </div>

                      <div className="grid grid-cols-4 gap-1">
                         {[100, 200, 500, 1000].map(val => (
                           <button 
                            key={val}
                            onClick={() => setBetAmount1(val)}
                            className={`py-1.5 rounded-lg text-[9px] font-extrabold transition-all border ${
                              betAmount1 === val 
                                ? 'bg-red-600/20 border-red-500/50 text-red-400' 
                                : 'bg-[#21232b] hover:bg-[#282b35] border-white/5 text-gray-300'
                            }`}
                           >
                             {val}
                           </button>
                         ))}
                      </div>
                   </div>

                   {/* Core CTA */}
                   <div className="w-[120px] xs:w-[150px] flex">
                      {isWaitingBet1 ? (
                        <button 
                          onClick={() => handleBetAction(1)}
                          className="w-full h-full flex flex-col items-center justify-center rounded-2xl transition-all shadow-md active:scale-95 border-b-4 bg-gradient-to-b from-red-600 to-red-800 border-red-950 text-white"
                        >
                           <span className="text-base font-black italic">বাতিল</span>
                           <span className="text-[8px] font-bold text-red-200 mt-0.5">বুকড</span>
                        </button>
                      ) : (!currentBet1 || currentBet1.cashedOut) ? (
                        <button 
                          onClick={() => handleBetAction(1)}
                          disabled={gameState === 'crashed'}
                          className={`w-full h-full flex flex-col items-center justify-center rounded-2xl transition-all shadow-md active:scale-95 border-b-4 ${
                            gameState === 'waiting' 
                              ? 'bg-gradient-to-b from-emerald-500 to-emerald-700 border-emerald-950 text-white shadow-emerald-500/10'
                              : 'bg-gradient-to-b from-[#b45309] to-[#78350f] border-orange-950 text-white shadow-orange-500/10'
                          }`}
                        >
                           <span className="text-xl font-black italic tracking-tighter">বেট</span>
                           <span className="text-[8px] font-black uppercase text-white/80 shrink-0">
                             {gameState === 'waiting' ? 'বেট ধরুন' : 'অপেক্ষায়'}
                           </span>
                        </button>
                      ) : (
                        <button 
                          onClick={() => handleCashOut(1)}
                          disabled={gameState !== 'in_progress'}
                          className={`w-full h-full flex flex-col items-center justify-center rounded-2xl transition-all shadow-md active:scale-95 border-b-4 ${
                            gameState === 'in_progress'
                              ? 'bg-gradient-to-b from-amber-500 to-amber-700 border-amber-950 text-white shadow-amber-500/30'
                              : 'bg-gradient-to-b from-amber-500/50 to-amber-700/50 border-amber-950/50 text-white/50 cursor-not-allowed'
                          }`}
                        >
                           <span className="text-[9px] font-black uppercase text-white/80 mb-0.5">টাকা তুলুন</span>
                           <span className="text-lg font-black tracking-tight">
                             {(currentBet1.amount * multiplier).toFixed(1)} ৳
                           </span>
                        </button>
                      )}
                   </div>
                </div>

                {/* Auto panel attributes */}
                <div className="flex items-center justify-between gap-3 pt-2.5 mt-2.5 border-t border-white/5">
                   <div className="flex items-center gap-2">
                      <button
                         type="button"
                         onClick={() => setIsAutoWithdraw1(!isAutoWithdraw1)}
                         className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 focus:outline-none ${
                            isAutoWithdraw1 ? 'bg-red-600' : 'bg-white/10'
                         }`}
                      >
                         <div
                            className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-200 ease-in-out ${
                               isAutoWithdraw1 ? 'translate-x-4' : 'translate-x-0'
                            }`}
                         />
                      </button>
                      <span className="text-[10px] font-black text-gray-300 uppercase tracking-wide">অটো ক্যাশআউট</span>
                   </div>

                   <div className="flex items-center gap-1.5">
                      <div className={`flex items-center bg-black/50 rounded-xl px-2.5 py-1 border border-white/10 transition-all ${isAutoWithdraw1 ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                         <input 
                           type="number"
                           step="0.05"
                           min="1.01"
                           placeholder="2.00"
                           value={autoCashOut1 || ''}
                           onChange={(e) => setAutoCashOut1(Number(parseFloat(e.target.value)) || null)}
                           className="bg-transparent text-gray-200 text-xs font-black focus:outline-none w-[60px] text-center"
                         />
                         <span className="text-[10px] font-extrabold text-red-500">x</span>
                      </div>
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${isAutoWithdraw1 ? 'bg-red-600/20 text-red-500' : 'bg-white/5 text-gray-600'}`}>
                         <Zap size={12} />
                      </div>
                   </div>
                </div>
             </div>

             {/* Workstation 2 */}
             {showSecondPanel && (
               <div id="aviator-workstation-2" className="flex-1 bg-[#191a1f] rounded-2xl p-3 border border-white/5 shadow-xl relative">
                  <div className="flex items-center justify-between mb-3.5">
                     <div className="flex bg-black/60 rounded-full p-0.5 border border-white/5">
                        <button 
                          onClick={() => setIsAutoBet2(false)}
                          className={`px-4 py-1 text-[9px] font-black rounded-full transition-all uppercase ${!isAutoBet2 ? 'bg-red-600 text-white shadow-md' : 'text-gray-400'}`}
                        >
                          Bet
                        </button>
                        <button 
                          onClick={() => setIsAutoBet2(true)}
                          className={`px-4 py-1 text-[9px] font-black rounded-full transition-all uppercase ${isAutoBet2 ? 'bg-red-600 text-white shadow-md' : 'text-gray-400'}`}
                        >
                          Auto
                        </button>
                     </div>
                     
                     <div className="flex items-center gap-1.5">
                        <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest bg-black/30 px-2 py-0.5 rounded-md">Panel 2</span>
                        <button 
                          onClick={() => setShowSecondPanel(false)}
                          className="text-gray-400 hover:text-white transition-colors p-1"
                          title="২য় প্যানেল বন্ধ করুন"
                        >
                          <XCircle size={14} className="text-red-400/85" />
                        </button>
                     </div>
                  </div>

                  <div className="flex gap-2">
                     {/* Parameters controls */}
                     <div className="flex-1 flex flex-col gap-2">
                        <div className="flex items-center bg-black/60 rounded-xl p-1 border border-white/5 focus-within:border-red-600/50 transition-all">
                           <button 
                            onClick={() => setBetAmount2(Math.max(10, betAmount2 - 10))}
                            className="w-10 h-10 flex items-center justify-center text-gray-300 hover:text-white bg-[#262830] rounded-lg transition-colors shadow-sm"
                           >
                             <Minus size={14} />
                           </button>
                           <input 
                            type="number"
                            value={betAmount2}
                            onChange={(e) => setBetAmount2(Math.max(10, Number(e.target.value)))}
                            className="flex-1 bg-transparent text-center text-base font-black text-white focus:outline-none w-10"
                           />
                           <button 
                            onClick={() => setBetAmount2(betAmount2 + 10)}
                            className="w-10 h-10 flex items-center justify-center text-gray-300 hover:text-white bg-[#262830] rounded-lg transition-colors shadow-sm"
                           >
                             <Plus size={14} />
                           </button>
                        </div>

                        <div className="grid grid-cols-4 gap-1">
                           {[100, 200, 500, 1000].map(val => (
                             <button 
                              key={val}
                              onClick={() => setBetAmount2(val)}
                              className={`py-1.5 rounded-lg text-[9px] font-extrabold transition-all border ${
                                betAmount2 === val 
                                  ? 'bg-red-600/20 border-red-500/50 text-red-400' 
                                  : 'bg-[#21232b] hover:bg-[#282b35] border-white/5 text-gray-300'
                              }`}
                             >
                               {val}
                             </button>
                           ))}
                        </div>
                     </div>

                     {/* Core CTA */}
                     <div className="w-[120px] xs:w-[150px] flex">
                        {isWaitingBet2 ? (
                          <button 
                            onClick={() => handleBetAction(2)}
                            className="w-full h-full flex flex-col items-center justify-center rounded-2xl transition-all shadow-md active:scale-95 border-b-4 bg-gradient-to-b from-red-600 to-red-800 border-red-950 text-white"
                          >
                             <span className="text-base font-black italic">বাতিল</span>
                             <span className="text-[8px] font-bold text-red-200 mt-0.5">বুকড</span>
                          </button>
                        ) : (!currentBet2 || currentBet2.cashedOut) ? (
                          <button 
                            onClick={() => handleBetAction(2)}
                            disabled={gameState === 'crashed'}
                            className={`w-full h-full flex flex-col items-center justify-center rounded-2xl transition-all shadow-md active:scale-95 border-b-4 ${
                              gameState === 'waiting' 
                                ? 'bg-gradient-to-b from-emerald-500 to-emerald-700 border-emerald-950 text-white shadow-emerald-500/10'
                                : 'bg-gradient-to-b from-[#b45309] to-[#78350f] border-orange-950 text-white shadow-orange-500/10'
                            }`}
                          >
                             <span className="text-xl font-black italic tracking-tighter">বেট</span>
                             <span className="text-[8px] font-black uppercase text-white/80 shrink-0">
                               {gameState === 'waiting' ? 'বেট ধরুন' : 'অপেক্ষায়'}
                             </span>
                          </button>
                        ) : (
                          <button 
                            onClick={() => handleCashOut(2)}
                            disabled={gameState !== 'in_progress'}
                            className={`w-full h-full flex flex-col items-center justify-center rounded-2xl transition-all shadow-md active:scale-95 border-b-4 ${
                              gameState === 'in_progress'
                                ? 'bg-gradient-to-b from-amber-500 to-amber-700 border-amber-950 text-white shadow-amber-500/30'
                                : 'bg-gradient-to-b from-amber-500/50 to-amber-700/50 border-amber-950/50 text-white/50 cursor-not-allowed'
                              }`}
                          >
                             <span className="text-[9px] font-black uppercase text-white/80 mb-0.5">টাকা তুলুন</span>
                             <span className="text-lg font-black tracking-tight">
                               {(currentBet2.amount * multiplier).toFixed(1)} ৳
                             </span>
                          </button>
                        )}
                     </div>
                  </div>

                  {/* Auto panel attributes */}
                  <div className="flex items-center justify-between gap-3 pt-2.5 mt-2.5 border-t border-white/5">
                     <div className="flex items-center gap-2">
                        <button
                           type="button"
                           onClick={() => setIsAutoWithdraw2(!isAutoWithdraw2)}
                           className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 focus:outline-none ${
                              isAutoWithdraw2 ? 'bg-red-600' : 'bg-white/10'
                           }`}
                        >
                           <div
                              className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-200 ease-in-out ${
                                 isAutoWithdraw2 ? 'translate-x-4' : 'translate-x-0'
                              }`}
                           />
                        </button>
                        <span className="text-[10px] font-black text-gray-300 uppercase tracking-wide">অটো ক্যাশআউট</span>
                     </div>

                     <div className="flex items-center gap-1.5">
                        <div className={`flex items-center bg-black/50 rounded-xl px-2.5 py-1 border border-white/10 transition-all ${isAutoWithdraw2 ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                           <input 
                             type="number"
                             step="0.05"
                             min="1.01"
                             placeholder="2.00"
                             value={autoCashOut2 || ''}
                             onChange={(e) => setAutoCashOut2(Number(parseFloat(e.target.value)) || null)}
                             className="bg-transparent text-gray-200 text-xs font-black focus:outline-none w-[60px] text-center"
                           />
                           <span className="text-[10px] font-extrabold text-red-500">x</span>
                        </div>
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${isAutoWithdraw2 ? 'bg-red-600/20 text-red-500' : 'bg-white/5 text-gray-600'}`}>
                           <Zap size={12} />
                        </div>
                     </div>
                  </div>
               </div>
             )}

          </div>

        </div>

        {/* Right Side Feed Panel (Tabs) */}
        <div id="aviator-live-players-sidebar" className="w-full lg:w-[280px] bg-[#141518] rounded-2xl flex flex-col overflow-hidden border border-white/5 shadow-xl h-[180px] lg:h-auto">
           <div className="bg-black/40 px-2 py-2 border-b border-white/5 flex items-center justify-between gap-1">
              <button 
                onClick={() => setActiveTab('all')} 
                className={`flex-1 py-1 text-[10px] rounded-lg font-bold transition-all ${activeTab === 'all' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'}`}
              >
                সব বেট
              </button>
              <button 
                onClick={() => setActiveTab('my')} 
                className={`flex-1 py-1 text-[10px] rounded-lg font-bold transition-all ${activeTab === 'my' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'}`}
              >
                আমার বেট
              </button>
              <button 
                onClick={() => setActiveTab('top')} 
                className={`flex-1 py-1 text-[10px] rounded-lg font-bold transition-all ${activeTab === 'top' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'}`}
              >
                টপ
              </button>
           </div>
           
           <div className="flex-1 overflow-y-auto no-scrollbar p-2.5 space-y-1.5">
              {activeTab === 'all' && (
                <>
                  <div className="flex justify-between items-center px-1 mb-2">
                    <span className="text-[9px] text-gray-500 font-bold uppercase">User</span>
                    <span className="text-[9px] text-gray-500 font-bold uppercase">Mult / Win</span>
                  </div>
                  {activeBets.map((bet) => (
                    <div key={bet.id} className={`flex items-center justify-between rounded-xl p-2 border transition-all ${bet.cashOut ? 'bg-green-900/10 border-green-500/20' : 'bg-black/25 border-white/5'}`}>
                        <span className="text-[10px] font-semibold text-gray-400">{bet.user}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black text-white/95">{bet.amount} ৳</span>
                          {bet.cashOut ? (
                            <span className="text-[9px] font-black text-green-400 bg-green-500/10 px-1.5 py-0.5 rounded-lg border border-green-500/10">
                              {bet.cashOut.toFixed(2)}x
                            </span>
                          ) : (
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-700 animate-pulse" />
                          )}
                        </div>
                    </div>
                  ))}
                  {activeBets.length === 0 && (
                    <div className="text-center py-8 text-[10px] font-bold text-gray-600 uppercase tracking-widest">
                      Awaiting player bets...
                    </div>
                  )}
                </>
              )}
              {activeTab === 'my' && (
                 <>
                   {myBetsHistory.length === 0 ? (
                     <div className="text-center py-8 text-[10px] font-bold text-gray-600 uppercase tracking-widest">
                       No bets yet
                     </div>
                   ) : (
                     myBetsHistory.map((bet, idx) => (
                       <div key={idx} className={`flex items-center justify-between rounded-xl p-2 border ${bet.mult ? 'bg-green-900/10 border-green-500/20' : 'bg-red-900/10 border-red-500/20'}`}>
                          <div className="flex flex-col">
                            <span className="text-[10px] font-semibold text-gray-400">{new Date(bet.date).toLocaleTimeString()}</span>
                            <span className="text-[10px] font-black text-white/95">{bet.amount} ৳</span>
                          </div>
                          {bet.mult ? (
                            <div className="flex flex-col items-end">
                               <span className="text-[10px] font-black text-green-400 border border-green-500/20 bg-green-500/10 px-1 rounded-md">{bet.mult.toFixed(2)}x</span>
                               <span className="text-xs font-bold text-white mt-0.5">+{bet.cashOut} ৳</span>
                            </div>
                          ) : (
                            <span className="text-[10px] font-black text-red-500 px-1">0.00x</span>
                          )}
                       </div>
                     ))
                   )}
                 </>
              )}
              {activeTab === 'top' && (
                 <>
                   <div className="flex justify-between items-center px-1 mb-2">
                     <span className="text-[9px] text-gray-500 font-bold uppercase">Rank / User</span>
                     <span className="text-[9px] text-gray-500 font-bold uppercase">Mult / Win</span>
                   </div>
                   {[
                     { user: 'boss_71', amount: 5000, mult: 50.12, win: 250600 },
                     { user: 'bd_king00', amount: 2000, mult: 21.05, win: 42100 },
                     { user: 'pro_max', amount: 1000, mult: 15.60, win: 15600 }
                   ].map((tb, idx) => (
                     <div key={idx} className="flex items-center justify-between rounded-xl p-2 border bg-yellow-900/10 border-yellow-500/20">
                        <div className="flex items-center gap-2">
                           <span className="text-xs font-black text-yellow-500">#{idx+1}</span>
                           <span className="text-[10px] font-semibold text-gray-400">{tb.user}</span>
                        </div>
                        <div className="flex flex-col items-end">
                           <span className="text-[10px] font-black text-yellow-400 border border-yellow-500/20 bg-yellow-500/10 px-1 rounded-md">{tb.mult.toFixed(2)}x</span>
                           <span className="text-xs font-bold text-white mt-0.5">+{tb.win.toLocaleString()} ৳</span>
                        </div>
                     </div>
                   ))}
                 </>
              )}
           </div>
        </div>

      </div>

      {/* Fairness Modal */}
      <AnimatePresence>
        {showFairness.show && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#141518] border border-white/10 rounded-2xl p-5 w-full max-w-sm flex flex-col gap-4 text-white"
            >
               <div className="flex justify-between items-center">
                 <div className="flex items-center gap-2">
                   <ShieldCheck size={20} className="text-green-500" />
                   <h3 className="font-bold text-sm tracking-widest uppercase">PROVABLY FAIR</h3>
                 </div>
                 <button onClick={() => setShowFairness({ show: false })} className="text-gray-400 hover:text-white">
                   <X size={18} />
                 </button>
               </div>
               
               <div className="bg-black/30 p-3 rounded-xl border border-white/5 space-y-3">
                 <div>
                   <p className="text-[10px] text-gray-500 font-bold mb-1">Crash Point</p>
                   <p className="text-xl font-black text-rose-500">{showFairness.mult?.toFixed(2)}x</p>
                 </div>
                 <div>
                   <p className="text-[10px] text-gray-400 font-bold mb-1">Server Seed (Active)</p>
                   <p className="text-xs font-mono text-amber-300 break-all">{showFairness.serverSeed}</p>
                 </div>
                 <div>
                   <p className="text-[10px] text-gray-500 font-bold mb-1">Server Seed (SHA-256 Hashed)</p>
                   <p className="text-xs font-mono text-slate-400 break-all">{showFairness.serverSeed ? computeFairnessHash(showFairness.serverSeed, '') : ''}</p>
                 </div>
                 <div>
                   <p className="text-[10px] text-gray-500 font-bold mb-1">Client Seed</p>
                   <p className="text-xs font-mono text-gray-300 break-all">{showFairness.clientSeed}</p>
                 </div>
                 <div>
                   <p className="text-[10px] text-gray-500 font-bold mb-1">Combined Hash (SHA-256)</p>
                   <p className="text-xs font-mono text-emerald-400 break-all">{showFairness.hash}</p>
                 </div>
               </div>
               
               <button onClick={() => setShowFairness({ show: false })} className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition-colors">
                 DONE
               </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Live Chat Drawer */}
      <AnimatePresence>
        {showChat && (
          <motion.div 
            initial={{ x: '100%', opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: '100%', opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-80 bg-[#141518] z-[200] border-l border-white/10 flex flex-col shadow-2xl"
          >
             <div className="p-4 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2 text-white font-bold tracking-wider text-sm">
                  <MessageSquare size={16} /> LIVE CHAT
                </div>
                <button onClick={() => setShowChat(false)} className="text-gray-400 hover:text-white p-1">
                  <X size={20} />
                </button>
             </div>
             
             <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar flex flex-col justify-end">
                {chatMessages.map(msg => (
                  <div key={msg.id} className="flex flex-col">
                    <span className="text-[10px] font-bold text-gray-500 mb-0.5">{msg.user}</span>
                    <span className="text-xs text-white/90 bg-white/5 py-1.5 px-3 rounded-r-xl rounded-bl-xl inline-block max-w-[85%] border border-white/5">
                      {msg.text}
                    </span>
                  </div>
                ))}
             </div>
             
             <div className="p-3 border-t border-white/5">
                <div className="flex items-center bg-black/40 border border-white/10 rounded-xl p-1 gap-2">
                   <input 
                     type="text" 
                     value={chatInput}
                     onChange={(e) => setChatInput(e.target.value)}
                     onKeyDown={(e) => {
                       if (e.key === 'Enter' && chatInput.trim()) {
                         setChatMessages(prev => [...prev, { id: Date.now().toString(), user: userData?.displayName || 'You', text: chatInput.trim() }]);
                         setChatInput('');
                       }
                     }}
                     className="flex-1 bg-transparent text-xs text-white px-2 py-1.5 outline-none placeholder:text-gray-600"
                     placeholder="Say something..."
                   />
                   <button 
                     onClick={() => {
                        if (chatInput.trim()) {
                           setChatMessages(prev => [...prev, { id: Date.now().toString(), user: userData?.displayName || 'You', text: chatInput.trim() }]);
                           setChatInput('');
                        }
                     }}
                     className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center text-white"
                   >
                     <Send size={14} />
                   </button>
                </div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Styled Overlays */}
      <style dangerouslySetInnerHTML={{ __html: `
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
        </div>
      )}
    </div>
  );
}
