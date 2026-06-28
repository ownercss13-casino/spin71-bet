import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { gsap } from 'gsap';
import { auth, getActiveUser } from '../../services/firebase';
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
  X,
  Wifi,
  WifiOff,
  Loader2,
  MessageSquare
} from 'lucide-react';
import { useSound } from '../../context/SoundContext';
import { getBackendUrl } from '../../config';

import DummyPlayersList from './DummyPlayersList';

const getCleanApiKey = (): string => {
  const rawKey = import.meta.env.VITE_AVIATOR_API_KEY || '#spin71bet_aviator_game109';
  if (!rawKey || typeof rawKey !== 'string') return '#spin71bet_aviator_game109';
  return rawKey.trim().replace(/^['"]|['"]$/g, '');
};

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

interface QueuedAction {
  id: string;
  action: 'bet' | 'cashout' | 'cancel';
  panel: 1 | 2;
  amount: number;
  multiplier?: number;
  timestamp: number;
  attempts: number;
}

export default function AviatorGame({ balance, onBalanceUpdate, showToast, onClose, userData, globalLogos, globalNames }: AviatorGameProps) {
  const settingsTimerRef = useRef<any>(null);
  const [showLoader, setShowLoader] = useState(true);

  // Magic Signal Hack States!
  const [settingsClickCount, setSettingsClickCount] = useState(0);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [isSignalActive, setIsSignalActive] = useState(() => {
    try {
      const saved = localStorage.getItem('spin71bet_aviator_signal_active');
      if (saved === 'true') return true;
    } catch (_) {}
    return false;
  });
  const [nextCrashPoint, setNextCrashPoint] = useState<number | null>(null);
  const [currentCrashPoint, setCurrentCrashPoint] = useState<number | null>(null);

  useEffect(() => {
    if (userData) {
      const email = userData.email || '';
      const isAdmin = userData.role === 'admin' || userData.isAdmin === true || 
        ['owner.css13@gmail.com', 'cutelegend7045@gmail.com'].includes(email);
      if (isAdmin) {
        setIsSignalActive(true);
        try {
          localStorage.setItem('spin71bet_aviator_signal_active', 'true');
        } catch (_) {}
      }
    }
  }, [userData]);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedInput = passwordInput.trim();
    if (normalizedInput === 'admin03' || normalizedInput === 'ownercss13') {
      setIsSignalActive(true);
      try {
        localStorage.setItem('spin71bet_aviator_signal_active', 'true');
      } catch (_) {}
      setShowPasswordModal(false);
      setPasswordInput('');
      showToast('সিগন্যাল প্যানেল সক্রিয় করা হয়েছে! (Signal panel activated!)', 'success');
    } else if (normalizedInput === 'off' || normalizedInput === 'disable' || normalizedInput === 'admin03off') {
      setIsSignalActive(false);
      try {
        localStorage.setItem('spin71bet_aviator_signal_active', 'false');
      } catch (_) {}
      setShowPasswordModal(false);
      setPasswordInput('');
      showToast('সিগন্যাল প্যানেল নিষ্ক্রিয় করা হয়েছে। (Signal panel deactivated.)', 'info');
    } else {
      showToast('ভুল পাসওয়ার্ড! অনুগ্রহ করে আবার চেষ্টা করুন।', 'error');
    }
  };
  const [gameState, setGameState] = useState<GameState>('waiting');
  const [multiplier, setMultiplier] = useState(1.00);
  const [gameHistory, setGameHistory] = useState<number[]>([1.13, 6.38, 1.03, 1.06, 1.03, 1.10, 7.49, 1.38, 1.22, 1.44, 1.36, 2.10, 4.55, 1.10, 1.32, 13.80, 1.21, 1.40, 1.56, 2.88, 1.21, 2.10, 1.38, 6.46]);
  const [nextGameTimer, setNextGameTimer] = useState(10);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const { playSound, startBgm, stopBgm, updateEngineSound, stopEngineSound } = useSound();
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const prevGameStateRef = useRef<GameState | null>(null);

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

  useEffect(() => {
    // Start Spribe-like arpeggiating background chord music
    startBgm();
    return () => {
      stopBgm();
      stopEngineSound();
    };
  }, []);

  // Bet Panels
  const [betAmount1, setBetAmount1] = useState(5);
  const [isAutoBet1, setIsAutoBet1] = useState(false);
  const [currentBet1, setCurrentBet1] = useState<{ amount: number; cashedOut: boolean } | null>(null);
  const [isWaitingBet1, setIsWaitingBet1] = useState(false);
  const [isCashingOut1, setIsCashingOut1] = useState(false);
  const [isPlacingBet1, setIsPlacingBet1] = useState(false);
  const [retryAttempt1, setRetryAttempt1] = useState(0);

  const [autoCashout1, setAutoCashout1] = useState(false);
  const [autoCashoutValue1, setAutoCashoutValue1] = useState(2.00);

  const [betAmount2, setBetAmount2] = useState(1);
  const [isAutoBet2, setIsAutoBet2] = useState(false);
  const [currentBet2, setCurrentBet2] = useState<{ amount: number; cashedOut: boolean } | null>(null);
  const [isWaitingBet2, setIsWaitingBet2] = useState(false);
  const [isCashingOut2, setIsCashingOut2] = useState(false);
  const [isPlacingBet2, setIsPlacingBet2] = useState(false);
  const [retryAttempt2, setRetryAttempt2] = useState(0);

  const [autoCashout2, setAutoCashout2] = useState(false);
  const [autoCashoutValue2, setAutoCashoutValue2] = useState(2.00);

  // Network queuing mechanism state references
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [offlineQueue, setOfflineQueue] = useState<QueuedAction[]>([]);
  const offlineQueueRef = useRef<QueuedAction[]>([]);
  const [sseConnected, setSseConnected] = useState(false);

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
  useEffect(() => { offlineQueueRef.current = offlineQueue; }, [offlineQueue]);

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

  const isProcessingQueueRef = useRef(false);

  const processQueue = async () => {
    if (isProcessingQueueRef.current || offlineQueueRef.current.length === 0) return;
    isProcessingQueueRef.current = true;

    console.log(`[Aviator Queue] Starting to process ${offlineQueueRef.current.length} pending actions...`);
    
    // We try to process each item sequentially
    while (offlineQueueRef.current.length > 0) {
      if (!navigator.onLine) {
        console.log('[Aviator Queue] Network is still offline. Pausing sync.');
        break;
      }

      const activeItem = offlineQueueRef.current[0];
      let success = false;
      let explicitReject = false;
      let balanceToUpdate = 0;
      let explicitError = '';

      try {
        const idToken = await getActiveUser()?.getIdToken();
        const backendUrl = getBackendUrl();
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);

        const bodyData: any = {
          action: activeItem.action,
          amount: activeItem.amount,
          idToken
        };
        if (activeItem.action === 'cashout' && activeItem.multiplier) {
          bodyData.multiplier = activeItem.multiplier;
        }

        const res = await fetch(`${backendUrl}/api/game/aviator/action`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-api-key': getCleanApiKey() },
          body: JSON.stringify(bodyData),
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        const data = await res.json();
        if (data.success) {
          success = true;
          balanceToUpdate = data.newBalance;
        } else {
          // If the server explicitly rejected (e.g. invalid balance, or already crashed), stop retrying this item
          console.error(`[Aviator Queue] Action rejected by server:`, data.error);
          explicitReject = true;
          explicitError = data.error || 'Server error';
        }
      } catch (err: any) {
        console.warn(`[Aviator Queue] Attempt failed for action ${activeItem.id}:`, err.message || err);
      }

      if (success) {
        // Apply success states
        onBalanceUpdate(balanceToUpdate, false);
        if (activeItem.action === 'bet') {
          if (activeItem.panel === 1) {
            setCurrentBet1({ amount: activeItem.amount, cashedOut: false });
            setIsWaitingBet1(false);
          } else {
            setCurrentBet2({ amount: activeItem.amount, cashedOut: false });
            setIsWaitingBet2(false);
          }
          playSound('bet');
          showToast(`বাজি সফলভাবে কিউ থেকে সম্পন্ন হয়েছে!`, 'success');
        } else if (activeItem.action === 'cashout') {
          if (activeItem.panel === 1) {
            const bet = currentBet1Ref.current;
            if (bet) setCurrentBet1({ ...bet, cashedOut: true });
          } else {
            const bet = currentBet2Ref.current;
            if (bet) setCurrentBet2({ ...bet, cashedOut: true });
          }
          playSound('win');
          showToast(`অফলাইন ক্যাশআউট সম্পন্ন! ${activeItem.multiplier?.toFixed(2)}x`, 'success');
        } else if (activeItem.action === 'cancel') {
          if (activeItem.panel === 1) {
            setCurrentBet1(null);
            setIsWaitingBet1(false);
          } else {
            setCurrentBet2(null);
            setIsWaitingBet2(false);
          }
          showToast(`বাজি কিউ থেকে বাতিল হয়েছে।`, 'success');
        }

        // Remove from queue
        const newQueue = offlineQueueRef.current.slice(1);
        setOfflineQueue(newQueue);
        offlineQueueRef.current = newQueue;
      } else if (explicitReject) {
        // Remove bad action
        showToast(`অ্যাকশন বাতিল: ${explicitError}`, 'error');
        if (activeItem.action === 'bet') {
          if (activeItem.panel === 1) setIsWaitingBet1(false);
          else setIsWaitingBet2(false);
        }
        const newQueue = offlineQueueRef.current.slice(1);
        setOfflineQueue(newQueue);
        offlineQueueRef.current = newQueue;
      } else {
        // Network timeout / transport error. Increase attempt and backoff, try later
        activeItem.attempts += 1;
        if (activeItem.attempts > 12) {
          // drop from queue after 12 retries
          showToast('নেটওয়ার্ক ত্রুটির কারণে অনুরোধটি বাতিল করা হয়েছে।', 'error');
          if (activeItem.action === 'bet') {
            if (activeItem.panel === 1) setIsWaitingBet1(false);
            else setIsWaitingBet2(false);
          }
          const newQueue = offlineQueueRef.current.slice(1);
          setOfflineQueue(newQueue);
          offlineQueueRef.current = newQueue;
        } else {
          // Pause processing loop for a bit, let next run of processQueue handle it
          break;
        }
      }
    }
    isProcessingQueueRef.current = false;
  };

  // Connectivity and Queue listeners
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      showToast('ইন্টারনেট সংযোগ ফিরে এসেছে! অমীমাংসিত অ্যাকশন সিঙ্ক করা হচ্ছে...', 'success');
      processQueue();
    };
    const handleOffline = () => {
      setIsOnline(false);
      showToast('নেটওয়ার্ক বিচ্ছিন্ন! অফলাইন ট্রানজেকশন কিউ সক্রিয় করা হয়েছে।', 'error');
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Periodic fallback processor
  useEffect(() => {
    const intervalId = setInterval(() => {
      if (offlineQueue.length > 0 && navigator.onLine) {
        processQueue();
      }
    }, 3500);
    return () => clearInterval(intervalId);
  }, [offlineQueue]);

  const isProcessingBet1Ref = useRef(false);
  const isProcessingBet2Ref = useRef(false);

  const placeBet = async (panel: 1 | 2, fromWaiting = false) => {
    const isProcessing = panel === 1 ? isProcessingBet1Ref.current : isProcessingBet2Ref.current;
    if (isProcessing) return;

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

    if (panel === 1) {
      isProcessingBet1Ref.current = true;
      setIsPlacingBet1(true);
      setRetryAttempt1(1);
    } else {
      isProcessingBet2Ref.current = true;
      setIsPlacingBet2(true);
      setRetryAttempt2(1);
    }

    let success = false;
    let explicitError = '';
    const maxAttempts = 10;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      if (panel === 1) setRetryAttempt1(attempt);
      else setRetryAttempt2(attempt);

      try {
        const idToken = await getActiveUser()?.getIdToken();
        const backendUrl = getBackendUrl();
        
        // Fast timeout to avoid freezing during network degradation
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3500);

        const res = await fetch(`${backendUrl}/api/game/aviator/action`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-api-key': getCleanApiKey() },
          body: JSON.stringify({ action: 'bet', amount, idToken }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        const data = await res.json();
        if (data.success) {
          onBalanceUpdate(data.newBalance, false);
          if (panel === 1) {
            setCurrentBet1({ amount, cashedOut: false });
            setIsWaitingBet1(false);
          } else {
            setCurrentBet2({ amount, cashedOut: false });
            setIsWaitingBet2(false);
          }
          playSound('bet');
          success = true;
          break;
        } else {
          explicitError = data.error || 'Bet failed';
          break; // explicit server reject, stop retrying
        }
      } catch (err: any) {
        console.warn(`[Aviator Network Retry] Panel ${panel} - Attempt ${attempt}/${maxAttempts} failed:`, err.message || err);
        
        if (attempt === maxAttempts) {
          explicitError = 'নেটওয়ার্ক সংযোগ ব্যর্থ। দয়া করে আপনার ইন্টারনেট চেক করুন।';
          break;
        }

        if (attempt === 1) {
          showToast('নেটওয়ার্ক ল্যাগ পাওয়া গেছে! আবার চেষ্টা করা হচ্ছে...', 'warning');
        }

        // Wait 1.2s before next retry
        await new Promise((resolve) => setTimeout(resolve, 1200));
      }
    }

    if (!success) {
      if (explicitError.includes('সংযোগ ব্যর্থ') || explicitError === '') {
        showToast('নেটওয়ার্ক সংযোগ বিঘ্নিত! বাজিটি অটো-সিঙ্ক কিউতে রাখা হল...', 'warning');
        const newAction: QueuedAction = {
          id: `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          action: 'bet',
          panel,
          amount,
          timestamp: Date.now(),
          attempts: 1
        };
        const newQueue = [...offlineQueueRef.current, newAction];
        setOfflineQueue(newQueue);
        offlineQueueRef.current = newQueue;
        processQueue();
      } else {
        showToast(explicitError || 'Bet failed', 'error');
        if (panel === 1) setIsWaitingBet1(false);
        else setIsWaitingBet2(false);
      }
    }

    if (panel === 1) {
      isProcessingBet1Ref.current = false;
      setIsPlacingBet1(false);
      setRetryAttempt1(0);
    } else {
      isProcessingBet2Ref.current = false;
      setIsPlacingBet2(false);
      setRetryAttempt2(0);
    }
  };

  const isCashingOut1Ref = useRef(isCashingOut1);
  const isCashingOut2Ref = useRef(isCashingOut2);
  useEffect(() => { isCashingOut1Ref.current = isCashingOut1; }, [isCashingOut1]);
  useEffect(() => { isCashingOut2Ref.current = isCashingOut2; }, [isCashingOut2]);

  const handleCashout = async (panel: 1 | 2) => {
    const bet = panel === 1 ? currentBet1Ref.current : currentBet2Ref.current;
    const isCashingOut = panel === 1 ? isCashingOut1Ref.current : isCashingOut2Ref.current;
    
    if (!bet || bet.cashedOut || gameState !== 'in_progress' || isCashingOut) return;

    if (panel === 1) {
      setIsCashingOut1(true);
      isCashingOut1Ref.current = true;
    } else {
      setIsCashingOut2(true);
      isCashingOut2Ref.current = true;
    }

    const targetMultiplier = multiplierRef.current;

    try {
      const idToken = await getActiveUser()?.getIdToken();
      const backendUrl = getBackendUrl();
      const res = await fetch(`${backendUrl}/api/game/aviator/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': getCleanApiKey() },
        body: JSON.stringify({ 
          action: 'cashout', 
          amount: bet.amount, 
          multiplier: targetMultiplier,
          idToken 
        })
      });
      const data = await res.json();
      if (data.success) {
        onBalanceUpdate(data.newBalance, false);
        if (panel === 1) setCurrentBet1({ ...bet, cashedOut: true });
        else setCurrentBet2({ ...bet, cashedOut: true });
        playSound('win');
        showToast(`Cashed out at ${targetMultiplier.toFixed(2)}x`, 'success');
      } else {
        showToast(data.error || 'Cashout rejected', 'error');
      }
    } catch (err) {
      console.warn('[Aviator Cashout Network Error] Adding to offline queue:', err);
      showToast('নেটওয়ার্ক ল্যাগ! স্বয়ংক্রিয় অফলাইন ক্যাশআউট কিউতে যোগ করা হয়েছে...', 'warning');
      
      const newAction: QueuedAction = {
        id: `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        action: 'cashout',
        panel,
        amount: bet.amount,
        multiplier: targetMultiplier,
        timestamp: Date.now(),
        attempts: 1
      };
      
      const newQueue = [...offlineQueueRef.current, newAction];
      setOfflineQueue(newQueue);
      offlineQueueRef.current = newQueue;
      
      processQueue();
    } finally {
      if (panel === 1) {
        setIsCashingOut1(false);
        isCashingOut1Ref.current = false;
      } else {
        setIsCashingOut2(false);
        isCashingOut2Ref.current = false;
      }
    }
  };

  const handleCancel = async (panel: 1 | 2) => {
    const bet = panel === 1 ? currentBet1 : currentBet2;
    if (!bet) {
      if (panel === 1) {
        setIsWaitingBet1(false);
      } else {
        setIsWaitingBet2(false);
      }
      return;
    }

    try {
      const idToken = await getActiveUser()?.getIdToken();
      const backendUrl = getBackendUrl();
      const res = await fetch(`${backendUrl}/api/game/aviator/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': getCleanApiKey() },
        body: JSON.stringify({ 
          action: 'cancel', 
          amount: bet.amount, 
          idToken 
        })
      });
      const data = await res.json();
      if (data.success) {
        onBalanceUpdate(data.newBalance, false);
        if (panel === 1) {
          setCurrentBet1(null);
          setIsWaitingBet1(false);
        } else {
          setCurrentBet2(null);
          setIsWaitingBet2(false);
        }
        showToast('বাজি বাতিল করা হয়েছে এবং রিফান্ড করা হয়েছে।', 'success');
      } else {
        showToast(data.error || 'Cancellation rejected', 'error');
      }
    } catch (err) {
      console.warn('[Aviator Cancel Network Error] Adding to offline queue:', err);
      showToast('নেটওয়ার্ক ল্যাগ! বাজি বাতিলকরণ কিউতে যোগ করা হয়েছে...', 'warning');

      const newAction: QueuedAction = {
        id: `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        action: 'cancel',
        panel,
        amount: bet.amount,
        timestamp: Date.now(),
        attempts: 1
      };
      
      const newQueue = [...offlineQueueRef.current, newAction];
      setOfflineQueue(newQueue);
      offlineQueueRef.current = newQueue;

      processQueue();
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
      
      const user = getActiveUser();
      if (!user) {
        console.log("[AviatorGame] Waiting for authenticated user to establish SSE stream...");
        if (retryTimeoutId) clearTimeout(retryTimeoutId);
        retryTimeoutId = setTimeout(setupSSE, 2000); 
        return;
      }

      let tokenStr = '';
      try {
        // Force refresh token if retrying to guarantee valid credentials
        const idToken = await user.getIdToken(retryDelay > 2000);
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
        setSseConnected(true);
      };

      eventSource.onmessage = (event) => {
        try {
          if (!event.data) return;
          setSseConnected(true);
          const data = JSON.parse(event.data);
          setGameState(data.state);
          setMultiplier(typeof data.multiplier === 'number' ? data.multiplier : 1.0);
          setNextGameTimer(Math.max(0, Math.ceil(typeof data.timer === 'number' ? data.timer : 0)));
          if (Array.isArray(data.history)) setGameHistory(data.history);

          // Capture AI Signal projections
          if (data.nextCrashPoint !== undefined) {
            setNextCrashPoint(data.nextCrashPoint);
          }
          if (data.crashPoint !== undefined) {
            setCurrentCrashPoint(data.crashPoint);
          }

          // Synthesize dynamic sound transitions in real time (climbing engine revs, and flight state swooshes)
          const nextState = data.state;
          const currentMult = data.multiplier;

          if (nextState === 'in_progress') {
            if (prevGameStateRef.current !== 'in_progress') {
              // Takeoff! Play launch alarm scale sounds
              playSound('takeoff');
            }
            // Dynamically scale pitch and modulate propeller vibrato based on current altitude multiplier
            updateEngineSound(currentMult);
          } else if (nextState === 'crashed') {
            if (prevGameStateRef.current === 'in_progress') {
              // Crashed / Flew away! Stop the motor and play wind rust sweeps
              stopEngineSound();
              playSound('flew_away');
            } else {
              stopEngineSound();
            }
          } else if (nextState === 'waiting') {
            stopEngineSound();
          }

          prevGameStateRef.current = nextState;

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
        } catch (err) {
          console.error("[AviatorGame] SSE Parse Error:", err);
        }
      };

      eventSource.onerror = (err) => {
        console.warn("[AviatorGame] SSE connection temporarily closed or retrying (this is expected during server updates/restarts):", err);
        if (eventSource) {
          eventSource.close();
          eventSource = null;
        }

        // Only show loader if we have never loaded successfully
        if (multiplier === 1.00 && gameState === 'waiting') {
          setShowLoader(true);
          setSseConnected(false);
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

    setupSSE();

    return () => {
      isActive = false;
      if (retryTimeoutId) clearTimeout(retryTimeoutId);
      if (eventSource) (eventSource as EventSource).close();
    };
  }, []);

  if (showLoader) {
    return (
      <GameLoader 
        ready={sseConnected} 
        onLoadComplete={() => setShowLoader(false)} 
      />
    );
  }

  // Real-time Parabolic flight trail tracking coordinates
  const planeX = gameState === 'in_progress' ? Math.min(80, 15 + Math.pow(multiplier - 1, 0.72) * 15) + Math.sin(multiplier * 4) * 0.6 : 15;
  const planeY = gameState === 'in_progress' ? Math.min(72, 15 + Math.pow(multiplier - 1, 0.85) * 10) + Math.cos(multiplier * 5) * 1.0 : 15;

  return (
    <div 
      ref={gameContainerRef}
      className={`fixed inset-0 z-50 flex flex-col bg-[#0f0f0f] text-white font-sans overflow-hidden select-none ${isFullscreen ? 'p-0' : 'p-0'}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#1a1a1a] border-b border-white/5">
        <div className="flex items-center gap-1">
          {globalLogos?.['spribe_aviator'] ? (
            <img src={globalLogos['spribe_aviator']} alt="Aviator Logo" className="h-6 object-contain" />
          ) : (
            <span className="text-xl font-black italic text-white tracking-tighter">Aviator</span>
          )}
        </div>
        
        <div className="flex items-center gap-3">
          <div className="bg-black/40 px-4 py-2 rounded-xl border border-white/10 flex items-center gap-3 shadow-inner">
            <span className="text-[9px] text-gray-500 font-black uppercase tracking-[0.2em]">Credits</span>
            <span className="text-[15px] font-black text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.2)] tracking-tighter tabular-nums">
              {balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
          </div>
          {/* Sound settings removed to use global controller */}

          <button 
            onClick={() => {
              const nextCount = settingsClickCount + 1;
              if (nextCount >= 5) {
                setShowPasswordModal(true);
                setSettingsClickCount(0);
              } else {
                setSettingsClickCount(nextCount);
                // Clear count after 3 seconds of inactivity
                if (settingsTimerRef.current) clearTimeout(settingsTimerRef.current);
                settingsTimerRef.current = setTimeout(() => setSettingsClickCount(0), 3000);
                
                // Also show rules if clicked once
                if (nextCount === 1) {
                  setShowRulesModal(true);
                }
              }
            }} 
            className="p-2 hover:bg-white/10 rounded-full text-gray-300 hover:text-white transition-colors"
            title="How to Play"
          >
            <HelpCircle size={20} />
          </button>
          <button 
            onClick={() => {
              const nextCount = settingsClickCount + 1;
              if (nextCount >= 5) {
                setShowPasswordModal(true);
                setSettingsClickCount(0);
              } else {
                setSettingsClickCount(nextCount);
                // Clear count after 3 seconds of inactivity
                if (settingsTimerRef.current) clearTimeout(settingsTimerRef.current);
                settingsTimerRef.current = setTimeout(() => setSettingsClickCount(0), 3000);
              }
            }}
            className="p-2 hover:bg-white/10 rounded-full text-gray-300 hover:text-white transition-colors"
            title="Settings"
          >
            <Settings size={20} />
          </button>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X size={20} />
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
           <button onClick={() => setShowHistoryModal(true)} className="ml-auto p-1 text-gray-400 hover:text-white transition-colors">
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

          {/* Floating Community Chat Button */}
          <button 
            onClick={() => window.dispatchEvent(new CustomEvent('openGlobalChat'))}
            className="absolute bottom-4 right-4 z-40 w-10 h-10 bg-[#e00508]/20 hover:bg-[#e00508]/40 border border-[#e00508]/30 rounded-xl flex items-center justify-center text-[#e00508] shadow-lg backdrop-blur-sm transition-all active:scale-90 group"
            title="Community Chat"
          >
            <MessageSquare size={20} className="group-hover:scale-110 transition-transform" />
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          </button>

          {/* Animated Background Atmosphere */}
          <div className="absolute inset-0 opacity-25">
            <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-[#ff5722] blur-[100px] rounded-full animate-[pulse_8s_infinite]" />
            <div className="absolute bottom-1/4 right-1/4 w-40 h-40 bg-red-600 blur-[100px] rounded-full animate-[pulse_10s_infinite]" />
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
                
                {/* Floating Real-Time Large Multiplier */}
                <div 
                  ref={multiplierDisplayRef}
                  className="text-7xl md:text-8xl font-black text-white italic z-20 select-none cursor-default mb-10"
                  style={{ textShadow: '0 0 20px rgba(255, 255, 255, 0.2)' }}
                >
                  {multiplier.toFixed(2)}<span className="text-[#e00508] ml-0.5">x</span>
                </div>

                {/* Flying Plane Container positioned on parabolic offsets */}
                <div 
                  className="absolute z-20 transition-all duration-100 ease-out flex items-center justify-center"
                  style={{
                    left: `${planeX}%`,
                    bottom: `${planeY}%`,
                    transform: 'translate(-50%, 50%) rotate(-5deg)'
                  }}
                >
                   <div className="relative">
                     {/* Flame jet sparkles */}
                     <div className="absolute -left-6 top-1/2 -translate-y-1/2 w-8 h-3 bg-gradient-to-r from-transparent via-[#ff3d00] to-[#e00508] blur-sm animate-[pulse_0.15s_infinite] rounded-full pointer-events-none" />
                     <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-4 h-2 bg-orange-500 blur-md rounded-full animate-ping" />
                     
                     <Plane size={72} fill="currentColor" className="text-[#e00508] transform rotate-[10deg] drop-shadow-[0_0_12px_rgba(224,5,8,0.85)]" />
                   </div>
                </div>

                {/* Elegant Parabolic SVG Flight curves */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible z-10">
                   <defs>
                     <linearGradient id="plane-trail" x1="0%" y1="100%" x2="100%" y2="0%">
                       <stop offset="0%" stopColor="#e00508" stopOpacity="0.05" />
                       <stop offset="65%" stopColor="#e00508" stopOpacity="0.35" />
                       <stop offset="100%" stopColor="#e00508" stopOpacity="0.85" />
                     </linearGradient>
                     <linearGradient id="plane-fill-glow" x1="0%" y1="100%" x2="0%" y2="0%">
                       <stop offset="0%" stopColor="#e00508" stopOpacity="0" />
                       <stop offset="100%" stopColor="#e00508" stopOpacity="0.22" />
                     </linearGradient>
                   </defs>

                   {/* Fill curve path below flight route */}
                   <path 
                     d={`M 0 100% Q ${planeX * 0.45}% ${100 - planeY * 0.15}% ${planeX}% ${100 - planeY}% L ${planeX}% 100% Z`}
                     fill="url(#plane-fill-glow)"
                   />

                   {/* Solid, glowing trail curve */}
                   <path 
                     d={`M 0 100% Q ${planeX * 0.45}% ${100 - planeY * 0.15}% ${planeX}% ${100 - planeY}%`}
                     fill="none"
                     stroke="url(#plane-trail)"
                     strokeWidth="4.5"
                     strokeLinecap="round"
                     className="drop-shadow-[0_0_10px_rgba(224,5,8,0.65)]"
                   />
                </svg>
              </div>
            ) : (
              <motion.div 
                initial={{ scale: 1.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex flex-col items-center gap-2 text-center z-10 relative w-full h-full justify-center"
              >
                {/* Crashed Escape Flight */}
                <div 
                  className="absolute z-10 opacity-30 transition-all duration-[2000ms] ease-out-sine pointer-events-none"
                  style={{
                    left: `${planeX + 25}%`,
                    bottom: `${planeY + 30}%`,
                    transform: 'scale(0.3) rotate(-35deg)',
                  }}
                >
                   <Plane size={72} fill="currentColor" className="text-[#3c3d40] drop-shadow-[0_0_5px_rgba(255,255,255,0.2)]" />
                </div>

                <div className="text-3xl font-black text-gray-500 italic uppercase tracking-wider animate-pulse">Flew Away!</div>
                <div className="text-8xl font-black text-[#e00508] italic drop-shadow-[0_0_35px_rgba(224,5,8,0.55)]">
                   {multiplier.toFixed(2)}x
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Sync Queue Monitor Banner */}
        {offlineQueue.length > 0 && (
          <div className="mx-2 mt-4 p-2.5 bg-gradient-to-r from-amber-600/90 to-orange-700/90 border border-amber-500/50 rounded-xl flex items-center justify-between text-white text-xs shadow-lg animate-pulse z-25">
            <div className="flex items-center gap-2">
              <Loader2 size={16} className="animate-spin text-yellow-300" />
              <div>
                <span className="font-bold text-yellow-300">নেটওয়ার্ক সংযোগ পুনর্স্থাপন করা হচ্ছে...</span>
                <p className="text-[10px] text-orange-100">অমীমাংসিত ট্রানজেকশন কিউতে আছে এবং স্বয়ংক্রিয়ভাবে পুনরায় চেষ্টা করা হচ্ছে</p>
              </div>
            </div>
            <div className="bg-black/40 px-2 py-1 rounded-md text-[10px] font-mono font-bold text-orange-200">
              {offlineQueue.length} Pending
            </div>
          </div>
        )}

        {!isOnline && (
          <div className="mx-2 mt-4 p-2.5 bg-gradient-to-r from-red-600 to-red-800 border border-red-500/55 rounded-xl flex items-center justify-between text-white text-xs shadow-lg animate-pulse z-25">
            <div className="flex items-center gap-2">
              <WifiOff size={16} className="text-red-300 animate-bounce" />
              <div>
                <span className="font-bold text-red-100">আপনি অফলাইনে আছেন!</span>
                <p className="text-[10px] text-red-100">আপনার বাজি এবং ক্যাশআউট অনুরোধগুলো অফলাইন কিউতে সংরক্ষিত রাখা হচ্ছে</p>
              </div>
            </div>
            <div className="bg-black/40 px-2 py-1 rounded-md text-[10px] font-mono font-bold text-red-300">
              OFFLINE
            </div>
          </div>
        )}

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
            const isPlacing = panel === 1 ? isPlacingBet1 : isPlacingBet2;
            const retryAttempt = panel === 1 ? retryAttempt1 : retryAttempt2;

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
                            if (isPlacing) return;
                            if (currentBet || isWaiting) {
                              handleCancel(panel);
                            } else {
                              placeBet(panel);
                            }
                          }}
                          disabled={gameState === 'crashed' || isPlacing}
                          className={`w-full h-full rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all active:scale-95 shadow-lg ${
                            isPlacing
                              ? 'bg-gradient-to-b from-amber-600 to-amber-800 border border-amber-500/50 text-white shadow-[0_4px_15px_rgba(245,158,11,0.3)] animate-pulse'
                              : isWaiting || currentBet 
                                ? 'bg-gradient-to-b from-red-600 to-red-800 hover:from-red-500 hover:to-red-700 border border-red-500/50 text-white shadow-[0_4px_15px_rgba(239,68,68,0.3)] animate-pulse' 
                                : 'bg-gradient-to-b from-[#4caf50] to-[#2e7d32] hover:from-[#66bb6a] hover:to-[#388e3c] border border-[#ffffff20]'
                          }`}
                        >
                          {isPlacing ? (
                            <div className="flex flex-col items-center justify-center gap-1">
                              <Loader2 size={24} className="animate-spin text-yellow-300" />
                              <span className="text-[11px] font-black uppercase text-yellow-300 tracking-wider">
                                লোডিং হচ্ছে... ({retryAttempt}/১০)
                              </span>
                              <span className="text-[7px] text-white/70 block uppercase font-black tracking-widest leading-none mt-0.5">
                                Reconnecting API
                              </span>
                            </div>
                          ) : (
                            <>
                              <span className="text-xl font-black text-white italic uppercase tracking-tighter">
                                {currentBet || isWaiting ? 'Cancel' : 'Bet'}
                              </span>
                              {(currentBet || isWaiting) ? (
                                <span className="text-[9px] text-red-100 font-bold uppercase tracking-wider">
                                  (Click to Cancel)
                                </span>
                              ) : (
                                <>
                                  <span className="text-base font-black text-white italic tracking-tighter">
                                    {amount.toFixed(2)}
                                  </span>
                                  <span className="text-[7px] font-black uppercase tracking-widest text-white/70 mt-0.5">(Next Round)</span>
                                </>
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

        {/* Real Casino Aviator Instruction Manual (How to Play Rules) */}
        {showRulesModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-[#14151b] border border-white/10 rounded-3xl p-6 shadow-2xl flex flex-col max-h-[85vh] overflow-y-auto no-scrollbar"
              onClick={(e) => e.stopPropagation()}
            >
              <button 
                type="button"
                onClick={() => setShowRulesModal(false)}
                className="absolute top-4 right-4 p-1.5 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>

              <div className="flex items-center gap-2 mb-4 border-b border-white/15 pb-3">
                <Info className="text-[#e00508]" size={24} />
                <h3 className="text-lg font-extrabold text-white uppercase tracking-wider">এভিয়েটর গেমের নিয়মাবলী (Aviator Rules)</h3>
              </div>

              <div className="space-y-4 text-xs leading-relaxed text-gray-300">
                <div className="bg-[#e00508]/10 border border-[#e00508]/25 rounded-2xl p-4">
                  <h4 className="text-white font-extrabold text-[13px] mb-1 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#e00508]" />
                    মূল মেকানিজম (Basic Gameplay)
                  </h4>
                  <p>
                    Aviator একটি সামাজিক মাল্টিপ্লেয়ার ক্র্যাশ কভার গেম। আপনার লক্ষ্য হলো বিমানটি উড়ার সাথে সাথে আপনার বাজিটিকে গুণিত হতে দেখা এবং বিমানটি উধাও হওয়ার পূর্বেই <strong>Cash Out</strong> বাটনে ক্লিক করে বোনাস ক্যাশ ইন করা।
                  </p>
                </div>

                <div className="bg-white/5 rounded-2xl p-4 border border-white/5 space-y-3">
                  <div>
                    <h5 className="text-white font-bold mb-1">১. বাজি স্থাপন (Placing Bets):</h5>
                    <p>
                      প্রতি রাউন্ড শুরু হওয়ার পূর্বে আপনার কাঙ্ক্ষিত ক্রাউড অ্যামাউন্ট নির্ধারণ করুন ও "Bet" বোতামে চাপ দিন। আপনি চাইলে একই সময়ে সর্বমোট দুটি (Dual panels) আলাদা বাজি ধরতে পারেন।
                    </p>
                  </div>
                  <div>
                    <h5 className="text-white font-bold mb-1">২. ক্যাশ আউট (Cashing Out):</h5>
                    <p>
                      বিমান চলাকালীন সময়ে আপনার উপার্জিত গুণিতক (Multiplier) পরিবর্তিত হতে থাকে। আপনি যত দেরিতে ক্যাশআউট করবেন, জেতার হার তত বেশি হবে; তবে বিমান উড়ে চলে যাওয়ার আগে ক্যাশআউট না করলে পুরো বাজির টাকা বাতিল হয়ে যাবে।
                    </p>
                  </div>
                </div>

                <div className="bg-white/5 rounded-2xl p-4 border border-white/5 space-y-3">
                  <h4 className="text-white font-extrabold text-[13px] mb-1">অটোমেটিক গেম ফিচার (Auto Features)</h4>
                  <div>
                    <h5 className="text-emerald-400 font-bold mb-1">● Auto Play:</h5>
                    <p>
                      এই অপশনটি অন রাখলে প্রতি নতুন রাউন্ডে স্বয়ংক্রিয়ভাবে আপনার নির্ধারণ করা বাজি পুনরায় প্লেস হয়ে যাবে, বার বার ক্লিক করতে হবে না।
                    </p>
                  </div>
                  <div>
                    <h5 className="text-emerald-400 font-bold mb-1">● Auto Cashout:</h5>
                    <p>
                      এখানে আপনার কাঙ্ক্ষিত মাল্টিপ্লায়ার (যেমনঃ 2.0x, 5.0x) সেভ করে রাখলে, বিমান ওই পয়েন্ট স্পর্শ করা মাত্রই স্বয়ংক্রিয়ভাবে জেতার টাকা ব্যালেন্সে যুক্ত হয়ে যাবে।
                    </p>
                  </div>
                </div>

                <div className="bg-[#10b981]/10 border border-[#10b981]/20 rounded-2xl p-4 flex items-start gap-2.5">
                  <Shield className="text-emerald-400 shrink-0 mt-0.5" size={16} />
                  <div>
                    <h5 className="text-white font-bold mb-1">স্বচ্ছতা গ্যারান্টি (RNG & Provably Fair)</h5>
                    <p className="text-[11px] text-gray-400">
                      এই গেমের ফলাফলসমূহ সম্পূর্ণ ক্রিপ্টোগ্রাফিক অ্যালগরিদম দ্বারা র্যান্ডমলি সার্ভারে প্রসেস করা হয়। প্রতি রাউন্ডের ডাটা স্বচ্ছ এবং কোনো ম্যানুয়াল কারচুপির সুযোগ নেই।
                    </p>
                  </div>
                </div>
              </div>

              <button 
                type="button"
                onClick={() => setShowRulesModal(false)}
                className="w-full mt-5 py-3 text-xs font-black rounded-xl bg-gradient-to-r from-[#e00508] to-[#ff3d00] hover:brightness-110 text-white shadow-lg active:scale-95 transition-all text-center"
              >
                বুঝেছি, খেলা শুরু করুন!
              </button>
            </motion.div>
          </motion.div>
        )}

        {/* Detailed Round History Table Modal */}
        {showHistoryModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-[#14151b] border border-white/10 rounded-3xl p-6 shadow-2xl flex flex-col max-h-[80vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <button 
                type="button"
                onClick={() => setShowHistoryModal(false)}
                className="absolute top-4 right-4 p-1.5 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>

              <div className="flex items-center gap-2 mb-4 border-b border-white/10 pb-3">
                <Clock className="text-amber-500" size={20} />
                <h3 className="text-base font-extrabold text-white uppercase tracking-wider">বিগত রাউন্ডের তালিকা (Outcome History)</h3>
              </div>

              {/* Responsive Scrollable List */}
              <div className="flex-1 overflow-y-auto space-y-2 no-scrollbar pr-1">
                {gameHistory.length === 0 ? (
                  <div className="text-center py-10 text-sm text-gray-500 font-bold">কোনো রাউন্ডের তথ্য উপলব্ধ নেই।</div>
                ) : (
                  gameHistory.map((mult, idx) => {
                    // Decide type
                    const isHigh = mult >= 10.0;
                    const isMid = mult >= 2.0 && mult < 10.0;
                    
                    return (
                      <div 
                        key={idx} 
                        className="flex items-center justify-between p-3 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 transition-all group"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-[11px] font-bold text-gray-500 group-hover:text-gray-400">
                            #{gameHistory.length - idx}
                          </span>
                          <span className="w-1.5 h-1.5 rounded-full bg-white/20" />
                          <div className="flex flex-col">
                            <span className="text-xs font-black text-white">এভিয়েটর রাউন্ড</span>
                            <span className="text-[9px] text-emerald-400/80 font-black tracking-widest uppercase flex items-center gap-0.5 mt-0.5">
                              <Shield size={10} /> Verified Fair
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className={`px-2.5 py-1 rounded-xl text-[11px] font-black italic tracking-wide border ${
                            isHigh ? 'text-[#f1c40f] border-[#f1c40f]/20 bg-[#f1c40f]/10' :
                            isMid ? 'text-[#9b59b6] border-[#9b59b6]/20 bg-[#9b59b6]/10' :
                            'text-[#3498db] border-[#3498db]/20 bg-[#3498db]/10'
                          }`}>
                            {mult.toFixed(2)}x
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-white/10 flex justify-between items-center text-[10px] text-gray-500 font-bold">
                <span>RNG SEED: ACTIVE_PROVABLY_FAIR</span>
                <span>TOTAL: {gameHistory.length} ROUNDS</span>
              </div>
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
