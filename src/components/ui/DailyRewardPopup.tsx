import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Gift, Sparkles, Coins, CheckCircle2, X, Wallet, RefreshCw } from 'lucide-react';
import { auth, getDb } from '../../services/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

interface DailyRewardPopupProps {
  onClose: () => void;
  onClaim: (amount: number) => Promise<void>;
  currentStreak?: number;
  onNavigateToDeposit?: () => void;
}

interface CoinParticle {
  id: number;
  targetX: number;
  targetYUp: number;
  targetYDown: number;
  scale: number;
  rotate: number;
  duration: number;
  delay: number;
  iconType: 'coin' | 'sparkle' | 'goldStar';
}

const DailyRewardPopup: React.FC<DailyRewardPopupProps> = ({ onClose, onClaim, currentStreak = 0, onNavigateToDeposit }) => {
  const [claimed, setClaimed] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [particles, setParticles] = useState<CoinParticle[]>([]);
  const [windowDimensions, setWindowDimensions] = useState({ width: 1000, height: 800 });

  // 24 Hour Deposit Check states
  const [hasRecentDeposit, setHasRecentDeposit] = useState<boolean | null>(null);
  const [checkingDeposit, setCheckingDeposit] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setWindowDimensions({ width: window.innerWidth, height: window.innerHeight });
    }
  }, []);

  useEffect(() => {
    const checkUserDeposit = async () => {
      const user = auth.currentUser;
      if (!user) {
        setHasRecentDeposit(false);
        setCheckingDeposit(false);
        return;
      }

      try {
        const dbInstance = getDb();
        if (!dbInstance) {
          setHasRecentDeposit(false);
          setCheckingDeposit(false);
          return;
        }

        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        
        // Single field query to avoid composite index errors
        const q = query(
          collection(dbInstance, 'transactions'),
          where('userId', '==', user.uid)
        );

        const snap = await getDocs(q);
        const approvedDeposits = snap.docs.map(doc => {
          const data = doc.data();
          let timestamp = null;
          if (data.createdAt) {
            timestamp = data.createdAt.toDate ? data.createdAt.toDate() : new Date(data.createdAt);
          } else if (data.date) {
            timestamp = new Date(data.date);
          }
          return { ...data, timestamp };
        });

        // Filter for approved deposits in the last 24 hours on client-side
        const recentDeposit = approvedDeposits.find((tx: any) => {
          const isDeposit = tx.type === 'deposit';
          const isApproved = tx.status === 'approved';
          const isWithin24h = tx.timestamp && tx.timestamp >= oneDayAgo;
          return isDeposit && isApproved && isWithin24h;
        });

        setHasRecentDeposit(!!recentDeposit);
      } catch (err) {
        console.error("Error checking recent deposit:", err);
        setHasRecentDeposit(false);
      } finally {
        setCheckingDeposit(false);
      }
    };

    checkUserDeposit();
  }, []);

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
    if (claimed || claiming || !hasRecentDeposit) {
      if (!hasRecentDeposit && onNavigateToDeposit) {
        onNavigateToDeposit();
      }
      return;
    }
    setClaiming(true);
    const day = Math.min(currentStreak + 1, 7);
    const amount = rewards[day - 1].amount;

    // Generate stunning shrapnel physical coin explosion particles centered from the click context
    const burstParticles: CoinParticle[] = Array.from({ length: 45 }).map((_, i) => {
      const angle = (Math.PI * 2 * i) / 45 + (Math.random() - 0.5) * 0.25;
      const speed = 180 + Math.random() * 240;

      const targetX = Math.cos(angle) * speed;
      const targetYUp = -220 - Math.random() * 240; 
      const targetYDown = 450 + Math.random() * 450; 

      const iconTypes: Array<'coin' | 'sparkle' | 'goldStar'> = ['coin', 'coin', 'coin', 'sparkle', 'goldStar'];
      const iconType = iconTypes[Math.floor(Math.random() * iconTypes.length)];

      return {
        id: i,
        targetX,
        targetYUp,
        targetYDown,
        scale: 0.5 + Math.random() * 0.9,
        rotate: Math.random() * 1440 - 720,
        duration: 1.6 + Math.random() * 1.4,
        delay: Math.random() * 0.12,
        iconType,
      };
    });

    setParticles(burstParticles);

    try {
      await onClaim(amount);
      setClaimed(true);
      setTimeout(() => {
        onClose();
      }, 3500); 
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
        
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors z-[305]">
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

          {/* Centered button container */}
          <div className="relative w-full">
            {checkingDeposit ? (
              <div className="flex flex-col items-center justify-center p-4 bg-white/5 border border-white/10 rounded-2xl gap-2">
                <RefreshCw className="animate-spin text-yellow-400" size={24} />
                <p className="text-[11px] font-bold text-yellow-300">ডিপোজিট স্থিতি চেক করা হচ্ছে...</p>
              </div>
            ) : !hasRecentDeposit ? (
              <div className="space-y-4">
                <div className="p-3 bg-red-950/40 border border-red-500/20 rounded-2xl text-center space-y-1">
                  <p className="text-[11px] font-black text-rose-400">ডিপোজিট নেই! (No Deposit Found)</p>
                  <p className="text-[10px] text-gray-300 font-medium leading-relaxed">
                    ডেইলি রিওয়ার্ড দাবি করতে বিগত ২৪ ঘণ্টার মধ্যে কমপক্ষে একটি সফল ডিপোজিট থাকতে হবে।
                  </p>
                </div>
                
                <motion.button
                  onClick={onNavigateToDeposit}
                  animate={{ 
                    scale: [1, 1.02, 1],
                    boxShadow: [
                      "0 0 10px rgba(244, 63, 94, 0.2)",
                      "0 0 20px rgba(244, 63, 94, 0.4)",
                      "0 0 10px rgba(244, 63, 94, 0.2)"
                    ]
                  }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  className="w-full py-4.5 bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white rounded-2xl font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-95 transition-all"
                >
                  <Wallet size={16} />
                  ডিপোজিট করুন (Deposit Now)
                </motion.button>
              </div>
            ) : (
              /* The pulsing button */
              <motion.button
                disabled={claimed || claiming}
                onClick={handleClaim}
                animate={claimed || claiming ? { 
                  scale: 1,
                  boxShadow: "0 0 0px rgba(234, 179, 8, 0)"
                } : { 
                  scale: [1, 1.04, 1],
                  boxShadow: [
                    "0 0 12px rgba(234, 179, 8, 0.2)",
                    "0 0 24px rgba(234, 179, 8, 0.6)",
                    "0 0 12px rgba(234, 179, 8, 0.2)"
                  ]
                }}
                transition={{ 
                  duration: 2, 
                  repeat: Infinity, 
                  ease: "easeInOut" 
                }}
                className={`
                  w-full py-5 rounded-2xl font-black text-xl uppercase tracking-widest transition-all relative z-10 select-none
                  ${claimed ? 'bg-green-600 text-white shadow-[0_0_20px_rgba(22,163,74,0.4)] cursor-default' : 
                    claiming ? 'bg-yellow-600 text-black cursor-wait' :
                    'bg-gradient-to-b from-yellow-300 via-yellow-400 to-yellow-600 text-black active:scale-95 cursor-pointer'}
                `}
              >
                {claimed ? 'CLAIMED!' : claiming ? 'CLAIMING...' : 'CLAIM NOW'}
              </motion.button>
            )}

            {/* Exploding Coin Particles starting precisely from the button's center */}
            <AnimatePresence>
              {claimed && particles.length > 0 && (
                <div className="absolute left-1/2 top-1/2 -origin-center -translate-x-1/2 -translate-y-1/2 pointer-events-none z-50">
                  {particles.map((p) => (
                    <motion.div
                      key={p.id}
                      initial={{ 
                        x: 0, 
                        y: 0, 
                        scale: 0, 
                        rotate: 0, 
                        opacity: 1 
                      }}
                      animate={{ 
                        x: [0, p.targetX / 2, p.targetX], 
                        y: [0, p.targetYUp, p.targetYDown], 
                        scale: [0, p.scale, p.scale, 0], 
                        rotate: [0, p.rotate / 2, p.rotate],
                        opacity: [1, 1, 0.9, 0]
                      }}
                      transition={{ 
                        duration: p.duration, 
                        delay: p.delay, 
                        ease: [0.1, 0.8, 0.25, 1] 
                      }}
                      className="absolute"
                    >
                      {p.iconType === 'coin' && (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-200 via-amber-400 to-yellow-600 border border-yellow-200 flex items-center justify-center shadow-[0_4px_12px_rgba(0,0,0,0.45),_inset_0_2px_4px_rgba(255,255,255,0.4)] relative">
                          <div className="w-7 h-7 rounded-full border border-dashed border-amber-300 flex items-center justify-center font-extrabold text-[#744400] text-xs">
                            ৳
                          </div>
                        </div>
                      )}
                      
                      {p.iconType === 'sparkle' && (
                        <Sparkles className="w-8 h-8 text-yellow-300 drop-shadow-[0_2px_8px_rgba(253,224,71,0.65)] fill-yellow-300" />
                      )}

                      {p.iconType === 'goldStar' && (
                        <div className="w-9 h-9 bg-gradient-to-tr from-amber-400 to-yellow-300 rotate-45 border border-yellow-200 rounded flex items-center justify-center shadow-lg">
                          <Coins className="w-5 h-5 text-amber-900 -rotate-45" />
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </AnimatePresence>
          </div>
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

      {/* Confetti-like falling coins across the screen on claim */}
      <AnimatePresence>
        {claimed && (
          <div className="fixed inset-0 pointer-events-none z-[310]">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ y: -50, x: Math.random() * windowDimensions.width, rotate: 0 }}
                animate={{ y: windowDimensions.height + 50, x: (Math.random() - 0.5) * 400 + (Math.random() * windowDimensions.width), rotate: 360 }}
                transition={{ duration: 2.2, delay: i * 0.12 }}
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
