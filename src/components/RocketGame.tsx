import React, { useState, useEffect, useRef } from 'react';
import { useLiveRocket } from '../hooks/useLiveRocket';
import GameLoader from './GameLoader';
import { ArrowLeft, Wallet, Play, X, History, Zap, Stars, Rocket, Shield, Thermometer, Radio, Activity, Terminal } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface RocketGameProps {
  onClose: () => void;
  userBalance: number;
  onBalanceUpdate: (newBalance: number) => void;
  showToast: (msg: string, type?: any) => void;
  globalName?: string;
  userData?: any;
}

export default function RocketGame({ onClose, userBalance, onBalanceUpdate, showToast, globalName, userData }: RocketGameProps) {
  const [isLoading, setIsLoading] = useState(true);
  const { session } = useLiveRocket();
  const [multiplier, setMultiplier] = useState(1.00);
  const [gamePhase, setGamePhase] = useState<'betting' | 'flying' | 'crashed'>('betting');
  const [bettingCountdown, setBettingCountdown] = useState(5);
  const [betAmount, setBetAmount] = useState(100);
  const [isBetPlaced, setIsBetPlaced] = useState(false);
  const [isCashedOut, setIsCashedOut] = useState(false);
  const [history, setHistory] = useState<number[]>([]);
  const [stars, setStars] = useState<{ id: number; x: number; y: number; size: number; speed: number }[]>([]);
  const [cashoutAmount, setCashoutAmount] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 2000);
    const newStars = Array.from({ length: 80 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 1.5 + 0.5,
      speed: Math.random() * 0.3 + 0.1
    }));
    setStars(newStars);
    return () => clearTimeout(timer);
  }, []);

  // Sync with shared session
  useEffect(() => {
    if (!session) return;
    setMultiplier(session.multiplier);
    setHistory(session.history || []);
    
    if (session.status === 'waiting') {
      setGamePhase('betting');
      const diff = Math.max(0, 6 - Math.floor((Date.now() - session.startTime) / 1000));
      setBettingCountdown(diff);
      if (gamePhase !== 'betting') {
        setIsCashedOut(false);
        setIsBetPlaced(false);
        setCashoutAmount(0);
      }
    } else if (session.status === 'running') {
      setGamePhase('flying');
    } else if (session.status === 'crashed') {
      setGamePhase('crashed');
    }
  }, [session, gamePhase]);

  // Star Animation linked to multiplier speed
  useEffect(() => {
    if (gamePhase !== 'flying') return;
    const interval = setInterval(() => {
      setStars(prev => prev.map(star => ({
        ...star,
        y: (star.y + star.speed * (1 + (multiplier - 1) * 0.2)) % 100
      })));
    }, 50);
    return () => clearInterval(interval);
  }, [gamePhase, multiplier]);

  const handlePlaceBet = () => {
    if (gamePhase !== 'betting') {
      showToast('বেটিং সময় শেষ!', 'error');
      return;
    }
    if (betAmount <= 0) {
      showToast('সঠিক বেট অ্যামাউন্ট দিন!', 'error');
      return;
    }
    if (userBalance < betAmount) {
      showToast('পর্যাপ্ত ব্যালেন্স নেই!', 'error');
      return;
    }
    if (isBetPlaced) return;

    onBalanceUpdate(userBalance - betAmount);
    setIsBetPlaced(true);
    showToast('বেট সফলভাবে প্লেস করা হয়েছে!', 'success');
  };

  const handleCashOut = () => {
    if (gamePhase !== 'flying' || isCashedOut || !isBetPlaced) return;

    const winAmount = betAmount * multiplier;
    setIsCashedOut(true);
    setCashoutAmount(winAmount);
    onBalanceUpdate(userBalance + winAmount);
    showToast(`আপনি ৳ ${winAmount.toFixed(2)} জিতেছেন!`, 'success');
  };

  // Determine atmospheric color based on multiplier
  const getAtmosphereColor = () => {
    if (gamePhase !== 'flying') return 'bg-black';
    if (multiplier < 1.5) return 'from-blue-600/20 via-blue-900/40 to-black';
    if (multiplier < 3.0) return 'from-indigo-900/30 via-purple-950/40 to-black';
    if (multiplier < 8.0) return 'from-purple-950/30 via-black to-black';
    return 'from-black via-black/80 to-indigo-950/20';
  };

  const getAtmosphereLabel = () => {
    if (multiplier < 1.5) return 'TROPOSPHERE';
    if (multiplier < 3.0) return 'STRATOSPHERE';
    if (multiplier < 8.0) return 'EXOSPHERE';
    return 'DEEP SPACE';
  };

  return (
    <div className="full-display-game flex flex-col bg-[#050505] text-white font-sans overflow-hidden">
      {isLoading && (
        <GameLoader 
          gameName={globalName || 'SPACE ROCKET'} 
          provider="GALACTIC" 
          logo="https://picsum.photos/seed/rocket/200/200"
        />
      )}

      {/* Technical Header */}
      <div className="flex items-center justify-between p-4 bg-black/80 backdrop-blur-xl border-b border-white/5 z-50">
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-black text-xs tracking-[0.2em] text-white/50 uppercase italic">G-71 MISSION</span>
              <div className={`w-2 h-2 rounded-full ${gamePhase === 'flying' ? 'bg-green-500 animate-pulse shadow-[0_0_8px_#22c55e]' : 'bg-red-500'}`}></div>
            </div>
            <h3 className="text-lg font-black tracking-tighter text-white uppercase italic -mt-1 drop-shadow-lg">
              {globalName || 'ROCKET CRASH'} 
              <span className="text-indigo-500 ml-1">v.2</span>
            </h3>
          </div>
        </div>
        
        <div className="flex flex-col items-end">
          <div className="flex items-center gap-2 bg-indigo-500/10 px-4 py-1.5 rounded-2xl border border-indigo-500/20">
            <Wallet size={14} className="text-indigo-400" />
            <span className="text-sm font-black tracking-widest text-indigo-100">৳ {userBalance.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Tech Telemetry Bar */}
      <div className="grid grid-cols-3 gap-1 px-4 py-1.5 bg-black/40 border-b border-white/5 text-[8px] font-black uppercase tracking-widest text-white/30">
        <div className="flex items-center gap-1.5">
          <Shield size={10} className="text-indigo-500" />
          <span>HULL INTEGRITY: 100%</span>
        </div>
        <div className="flex items-center justify-center gap-1.5">
          <Thermometer size={10} className={multiplier > 5 ? 'text-orange-500' : 'text-blue-500'} />
          <span>CORE TEMP: {(300 + multiplier * 20).toFixed(0)}K</span>
        </div>
        <div className="flex items-center justify-end gap-1.5">
          <Radio size={10} className="animate-pulse" />
          <span>SIGNAL: OPTIMAL</span>
        </div>
      </div>

      {/* Main Game Interface: Grid on Desktop */}
      <div className="flex-1 overflow-y-auto no-scrollbar">
        <div className="max-w-[1440px] mx-auto h-full grid grid-cols-12 gap-0 lg:gap-4 lg:p-4">
          
          {/* Left Sidebar: Telemetry & Logs (Desktop Only) */}
          <div className="hidden lg:flex col-span-3 flex-col gap-4 overflow-hidden">
            {/* Real-time Telemetry Card */}
            <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-4 shadow-xl">
              <div className="flex items-center gap-2 mb-4">
                <Activity className="text-blue-400" size={16} />
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Live Telemetry</h3>
              </div>
              <div className="space-y-4">
                <div className="space-y-1">
                  <div className="flex justify-between text-[9px] font-bold text-slate-500 uppercase">
                    <span>Dynamic Pressure</span>
                    <span className="text-blue-400">{(multiplier * 120.5).toFixed(1)} kPa</span>
                  </div>
                  <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                    <motion.div className="h-full bg-blue-500" animate={{ width: `${Math.min(100, multiplier * 5)}%` }} />
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-[9px] font-bold text-slate-500 uppercase">
                    <span>Velocity Vector</span>
                    <span className="text-purple-400">{(multiplier * 0.85).toFixed(2)} Mach</span>
                  </div>
                  <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                    <motion.div className="h-full bg-purple-500" animate={{ width: `${Math.min(100, multiplier * 4)}%` }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Mission Log (Scrollable) */}
            <div className="flex-1 bg-black/40 border border-white/5 rounded-2xl p-4 font-mono text-[9px] flex flex-col overflow-hidden backdrop-blur-md">
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-white/5">
                <Terminal className="text-indigo-400" size={14} />
                <span className="text-white/40 uppercase tracking-tighter">Mission Comms</span>
              </div>
              <div className="flex-1 space-y-2 overflow-y-auto no-scrollbar opacity-60">
                <p className="text-green-500/80 underline decoration-indigo-500/30 underline-offset-4">[SYSTEM] Main Engine Ignition.</p>
                <p className="text-white/40">[MCC] Monitoring lift-off parameters.</p>
                {gamePhase === 'flying' && (
                  <>
                    <p className="text-blue-400">[HOUSTON] Max-Q status: Optimal.</p>
                    <p className="text-white/40">[PILOT] Passing {multiplier.toFixed(1)}x altitude.</p>
                  </>
                )}
                {gamePhase === 'crashed' && (
                  <p className="text-red-500 font-bold">[ALERT] DISCONTINUITY DETECTED.</p>
                )}
                <p className="text-white/20">Waiting for next transmission...</p>
              </div>
            </div>
          </div>

          {/* Center Stage: The Flight Arena */}
          <div className="col-span-12 lg:col-span-6 flex flex-col bg-slate-900 lg:rounded-3xl border border-white/10 overflow-hidden relative shadow-2xl h-[450px] lg:h-auto min-h-[450px]">
            {/* Main Game Area */}
            <div className={`flex-1 relative overflow-hidden flex flex-col items-center justify-center transition-all duration-700 ${gamePhase === 'crashed' ? 'animate-[shake_0.4s_ease-in-out]' : ''}`}>
              
              {/* Layered Atmospheric Background */}
              <div className={`absolute inset-0 z-0 transition-colors duration-2000 bg-gradient-to-b ${getAtmosphereColor()}`}></div>
              
              {/* Starfield */}
              <div className="absolute inset-0 z-0 pointer-events-none">
                {stars.map(star => (
                  <motion.div 
                    key={star.id}
                    className="absolute bg-white rounded-full opacity-40"
                    style={{
                      left: `${star.x}%`,
                      top: `${star.y}%`,
                      width: `${star.size}px`,
                      height: `${star.size}px`,
                      boxShadow: star.size > 1 ? `0 0 ${star.size * 4}px rgba(255,255,255,0.8)` : 'none'
                    }}
                  />
                ))}
              </div>

              {/* HUD Elements */}
              {gamePhase === 'flying' && (
                <div className="absolute inset-x-8 top-12 z-20 flex justify-between items-start pointer-events-none">
                  <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="flex flex-col gap-1">
                    <span className="text-[10px] font-black text-indigo-400/60 tracking-widest bg-black/40 px-3 py-1 rounded-full border border-white/5 backdrop-blur-md">ALTITUDE: {getAtmosphereLabel()}</span>
                    <div className="w-32 h-1 bg-white/5 rounded-full overflow-hidden">
                      <motion.div 
                        className="h-full bg-indigo-500" 
                        animate={{ width: `${Math.min(100, (multiplier / 10) * 100)}%` }} 
                      />
                    </div>
                  </motion.div>
                </div>
              )}

              {/* Central Multiplier Display */}
              <div className="relative z-30 text-center select-none">
                <AnimatePresence mode="wait">
                  {gamePhase === 'betting' ? (
                    <motion.div 
                      key="betting"
                      initial={{ scale: 2, opacity: 0, filter: 'blur(20px)' }}
                      animate={{ scale: 1, opacity: 1, filter: 'blur(0px)' }}
                      exit={{ scale: 0.5, opacity: 0, filter: 'blur(10px)' }}
                      className="flex flex-col items-center"
                    >
                      <div className="relative w-32 h-32 flex items-center justify-center">
                        <motion.div 
                          animate={{ rotate: 360 }}
                          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                          className="absolute inset-0 border-2 border-dashed border-indigo-500/20 rounded-full"
                        />
                        <div className="text-5xl font-black text-white italic tracking-tighter">
                          {bettingCountdown}
                        </div>
                      </div>
                      <span className="mt-4 text-indigo-400 text-[10px] font-black uppercase tracking-[0.5em] animate-pulse">PRE-LAUNCH</span>
                    </motion.div>
                  ) : gamePhase === 'flying' ? (
                    <motion.div key="flying" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }}>
                      <h2 className={`text-9xl font-black italic tracking-tighter transition-all duration-300 ${isCashedOut ? 'text-green-500' : 'text-white'}`}>
                        {multiplier.toFixed(2)}x
                      </h2>
                      {isCashedOut && (
                        <div className="bg-green-500/20 border border-green-500/50 px-4 py-1 rounded-full text-green-400 text-[10px] font-black uppercase mt-2">
                          PAYOUT SECURED
                        </div>
                      )}
                    </motion.div>
                  ) : (
                    <motion.div key="crashed" initial={{ scale: 3, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center">
                      <span className="text-red-600 text-6xl font-black italic uppercase animate-bounce">
                        ABORTED
                      </span>
                      <span className="text-white/40 font-black text-lg mt-2 italic">AT {multiplier.toFixed(2)}x</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Rocket Animation */}
              <div className="absolute inset-0 pointer-events-none z-20">
                <motion.div
                  animate={gamePhase === 'flying' ? { x: [0, -1, 1, 0], y: [0, 1, -1, 0] } : {}}
                  transition={{ repeat: Infinity, duration: 0.15 }}
                  className={`absolute bottom-[25%] left-1/2 -translate-x-1/2 transition-all duration-1000 ${gamePhase === 'betting' ? 'translate-y-40 opacity-0' : gamePhase === 'crashed' ? 'rotate-[45deg] -translate-y-[100vh] opacity-0' : 'translate-y-0 opacity-100'}`}
                >
                  <div className="w-16 h-28 bg-white rounded-t-full relative shadow-2xl border-x-2 border-slate-300">
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 w-4 h-4 bg-indigo-500 rounded-full shadow-[0_0_10px_#6366f1]"></div>
                    {gamePhase === 'flying' && (
                      <motion.div 
                        animate={{ height: [40, 70, 40], opacity: [0.8, 1, 0.8] }}
                        transition={{ repeat: Infinity, duration: 0.1 }}
                        className="absolute -bottom-16 left-1/2 -translate-x-1/2 w-8 bg-gradient-to-t from-orange-500 via-yellow-400 to-white rounded-b-full filter blur-[2px]"
                      />
                    )}
                  </div>
                </motion.div>
              </div>
            </div>
          </div>

          {/* Right Sidebar: Betting History (Desktop Only) */}
          <div className="hidden lg:flex col-span-3 flex-col gap-4 overflow-hidden">
            <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-4 flex flex-col h-full shadow-xl">
              <div className="flex items-center gap-2 mb-4">
                <History className="text-slate-400" size={16} />
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Mission History</h3>
              </div>
              <div className="flex-1 overflow-y-auto no-scrollbar space-y-2">
                {history.map((h, i) => (
                  <div key={i} className="flex justify-between items-center p-2 rounded-lg bg-black/40 border border-white/5">
                    <span className="text-[9px] text-slate-500 font-bold">ROUND #{history.length - i}</span>
                    <span className={`text-[11px] font-black ${h >= 2 ? 'text-green-500' : 'text-slate-400'}`}>{h.toFixed(2)}x</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Specialist Control Deck */}
      <div className="p-6 bg-[#0a0a0c] border-t border-white/10 safe-bottom">
        <div className="max-w-md mx-auto space-y-6">
          <div className="flex items-center gap-4">
            {/* Bet Input Field with Hardware feel */}
            <div className="flex-1 bg-black rounded-2xl p-3 border border-indigo-500/20 shadow-inner flex flex-col gap-1">
              <span className="text-[8px] font-black text-indigo-400/50 uppercase tracking-[0.2em] ml-2">AMOUNT IN ৳</span>
              <div className="flex items-center justify-between">
                <button 
                  onClick={() => setBetAmount(Math.max(10, betAmount - 100))}
                  className="w-12 h-12 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-xl transition-colors font-black text-2xl text-indigo-400"
                >
                  -
                </button>
                <div className="text-2xl font-black italic tracking-tighter text-white">৳ {betAmount}</div>
                <button 
                  onClick={() => setBetAmount(betAmount + 100)}
                  className="w-12 h-12 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-xl transition-colors font-black text-2xl text-indigo-400"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            {gamePhase === 'flying' && isBetPlaced && !isCashedOut ? (
              <button 
                onClick={handleCashOut}
                className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-400 hover:to-green-500 text-black font-black py-5 rounded-2xl shadow-[0_15px_40px_rgba(34,197,94,0.4)] transition-all active:scale-95 flex flex-col items-center group relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                <span className="text-[10px] uppercase font-bold tracking-[0.3em] mb-1 z-10">SECURE PAYLOAD</span>
                <span className="text-2xl italic tracking-tighter z-10">৳ {(betAmount * multiplier).toFixed(2)}</span>
              </button>
            ) : (
              <button 
                onClick={handlePlaceBet}
                disabled={isBetPlaced && gamePhase === 'betting'}
                className={`flex-1 font-black py-5 rounded-2xl shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-3 uppercase tracking-[0.2em] relative overflow-hidden group ${isBetPlaced ? 'bg-indigo-950/20 text-indigo-500 border border-indigo-500/30' : 'bg-gradient-to-r from-indigo-600 to-blue-700 text-white'}`}
              >
                <div className="absolute inset-0 bg-white/10 -translate-x-full group-hover:translate-x-0 transition-transform duration-500"></div>
                {isBetPlaced && gamePhase === 'betting' ? (
                  <>
                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }}><Zap size={20} /></motion.div>
                    <span>IDLE AT PAD</span>
                  </>
                ) : (
                  <>
                    <Play size={20} fill="currentColor" />
                    <span>LIGNITE MISSION</span>
                  </>
                )}
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-4 gap-2">
            {[100, 500, 1000, 5000].map(val => (
              <button 
                key={val}
                onClick={() => setBetAmount(val)}
                className={`py-2.5 rounded-xl text-[9px] font-black border transition-all ${betAmount === val ? 'bg-indigo-600 text-white border-white/20' : 'bg-white/5 text-white/30 border-transparent hover:bg-white/10'}`}
              >
                ৳ {val}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

