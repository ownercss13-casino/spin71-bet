import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../context/LanguageContext';
import { HelpCircle, Sparkles, Trophy, RotateCw, Check, Clock } from 'lucide-react';

interface LuckySpinWheelProps {
  userData: any;
  balance: number;
  onUpdateUser: (updates: any) => Promise<void>;
  onAddTransaction?: (trx: any) => Promise<void>;
  showToast: (msg: string, type?: any) => void;
  onOpenLogin?: () => void;
}

interface PrizeSegment {
  labelEn: string;
  labelBn: string;
  value: number; // 0 for Try Again
  color: string;
  weight: number; // probability weighting
}

const PRIZES: PrizeSegment[] = [
  { labelEn: "৳10", labelBn: "৳১০", value: 10, color: "#0d9488", weight: 35 },
  { labelEn: "৳500", labelBn: "৳৫০০", value: 500, color: "#d97706", weight: 2 },
  { labelEn: "৳20", labelBn: "৳২০", value: 20, color: "#2563eb", weight: 25 },
  { labelEn: "Try Again", labelBn: "আবার খেলুন", value: 0, color: "#1e293b", weight: 15 },
  { labelEn: "৳50", labelBn: "৳৫০", value: 50, color: "#0891b2", weight: 12 },
  { labelEn: "৳18", labelBn: "৳১৮", value: 18, color: "#7c3aed", weight: 15 },
  { labelEn: "৳100", labelBn: "৳১০০", value: 100, color: "#db2777", weight: 4 },
  { labelEn: "Try Again", labelBn: "আবার খেলুন", value: 0, color: "#1e293b", weight: 15 },
];

export default function LuckySpinWheel({
  userData,
  balance,
  onUpdateUser,
  onAddTransaction,
  showToast,
  onOpenLogin
}: LuckySpinWheelProps) {
  const { language } = useLanguage();
  const [spinning, setSpinning] = useState(false);
  const [deg, setDeg] = useState(0);
  const [cooldownRemaining, setCooldownRemaining] = useState<number>(0);
  const [wonPrize, setWonPrize] = useState<PrizeSegment | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);

  // Check cooldown status on load
  useEffect(() => {
    const checkCooldown = () => {
      const lastSpinTime = localStorage.getItem(`last_spin_time_${userData?.uid || userData?.id || 'anon'}`);
      if (lastSpinTime) {
        const diff = Date.now() - parseInt(lastSpinTime, 10);
        const cooldownMs = 24 * 60 * 60 * 1000; // 24 hours
        if (diff < cooldownMs) {
          setCooldownRemaining(cooldownMs - diff);
        } else {
          setCooldownRemaining(0);
        }
      } else {
        setCooldownRemaining(0);
      }
    };

    checkCooldown();
    const interval = setInterval(checkCooldown, 1000);
    return () => clearInterval(interval);
  }, [userData]);

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const toBn = (n: number) => {
      if (language === 'bn') {
        const banglaDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
        return n.toString().replace(/\d/g, (d) => banglaDigits[parseInt(d, 10)]);
      }
      return n.toString().padStart(2, '0');
    };

    return `${toBn(hours)}h : ${toBn(minutes)}m : ${toBn(seconds)}s`;
  };

  const handleSpin = async () => {
    if (!userData) {
      showToast(
        language === 'bn' 
          ? "ভাগ্য চক্র ঘুরাতে দয়া করে প্রথমে লগইন করুন!" 
          : "Please login first to spin the lucky wheel!", 
        "warning"
      );
      onOpenLogin?.();
      return;
    }

    if (cooldownRemaining > 0) {
      showToast(
        language === 'bn' 
          ? "আপনি আজকে ইতিমধ্যেই স্পিন করেছেন! ২৪ ঘণ্টা পর আবার চেষ্টা করুন।" 
          : "You have already spun today! Try again in 24 hours.", 
        "warning"
      );
      return;
    }

    if (spinning) return;

    // Start spin action
    setSpinning(true);
    setWonPrize(null);
    setShowCelebration(false);

    // Pick winning segment based on weights
    const totalWeight = PRIZES.reduce((acc, curr) => acc + curr.weight, 0);
    let randomVal = Math.random() * totalWeight;
    let selectedIndex = 0;

    for (let i = 0; i < PRIZES.length; i++) {
      randomVal -= PRIZES[i].weight;
      if (randomVal <= 0) {
        selectedIndex = i;
        break;
      }
    }

    const prize = PRIZES[selectedIndex];
    
    // Calculate final rotation degrees
    // We want the selected segment to stop exactly at the top pointer (index 0 is offset accordingly)
    // The pointer is at 90 degrees (right side or top side depending on perspective, normally top side is 270 degrees)
    // Each slice is 360 / 8 = 45 degrees.
    // Segment i occupies angles: i * 45 to (i + 1) * 45
    // To align center of segment i to the top arrow (which is 270 deg or -90 deg), 
    // We want the wheel rotation to be: (360 - (i * 45 + 22.5)) + 5 full rotations (1800 deg)
    const segmentAngle = 360 / PRIZES.length;
    const offset = 270; // top pointer alignment
    const targetDeg = (360 - (selectedIndex * segmentAngle + segmentAngle / 2) + offset) + (360 * 6); // 6 full extra rounds
    
    setDeg(targetDeg);

    // Wait for animation to finish (e.g. 4.5 seconds)
    setTimeout(async () => {
      setSpinning(false);
      setWonPrize(prize);

      // Save last spin timestamp
      const spinTime = Date.now();
      localStorage.setItem(`last_spin_time_${userData?.uid || userData?.id}`, spinTime.toString());
      setCooldownRemaining(24 * 60 * 60 * 1000);

      if (prize.value > 0) {
        setShowCelebration(true);
        // Add balance logic
        try {
          await onUpdateUser({
            balance: balance + prize.value,
            requiredTurnover: (userData?.requiredTurnover || 0) + prize.value
          });

          if (onAddTransaction) {
            await onAddTransaction({
              type: 'bonus',
              amount: prize.value,
              status: 'completed',
              description: `Lucky Spin Wheel Daily Reward`,
              date: new Date().toISOString()
            });
          }

          showToast(
            language === 'bn' 
              ? `অভিনন্দন! আপনি জিতেছেন ৳${prize.value}!` 
              : `Congratulations! You won ৳${prize.value}!`, 
            "success"
          );
        } catch (err) {
          console.error("Spin balance update error:", err);
          showToast("ব্যালেন্স আপডেট করতে সমস্যা হয়েছে", "error");
        }
      } else {
        showToast(
          language === 'bn' 
            ? "আজ আপনার ভাগ্য সহায় হয়নি! আগামীকাল আবার চেষ্টা করুন।" 
            : "No luck today! Try again tomorrow.", 
          "info"
        );
      }
    }, 4500);
  };

  return (
    <div id="casino-lucky-spin-container" className="bg-[#101f35]/60 border border-[#1e3a5f] rounded-[28px] p-6 shadow-2xl relative overflow-hidden">
      
      {/* Background visual accents */}
      <div className="absolute -top-24 -left-24 w-48 h-48 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        
        {/* Left Column: Interactive Wheel Stage */}
        <div className="flex flex-col items-center justify-center relative">
          
          {/* Wheel Outercase Frame with gold lights */}
          <div className="relative w-72 h-72 sm:w-80 sm:h-80 rounded-full border-8 border-[#ca8a04] bg-[#070e17] p-1 shadow-[0_0_35px_rgba(202,138,4,0.3)] flex items-center justify-center">
            
            {/* Blinking boundary dots (simulating real neon casino lights) */}
            <div className="absolute inset-0 rounded-full pointer-events-none">
              <div className="absolute top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-white animate-ping" />
              <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
              <div className="absolute left-1 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
              <div className="absolute right-1 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white animate-ping" />
            </div>

            {/* SVG Wheel segments */}
            <div 
              style={{ 
                transform: `rotate(${deg}deg)`,
                transition: spinning ? 'transform 4.5s cubic-bezier(0.2, 0.8, 0.25, 1)' : 'none'
              }}
              className="w-full h-full rounded-full overflow-hidden relative"
            >
              <svg viewBox="0 0 100 100" className="w-full h-full select-none pointer-events-none">
                {PRIZES.map((prize, idx) => {
                  const angle = 360 / PRIZES.length;
                  const startAngle = idx * angle;
                  const endAngle = startAngle + angle;
                  
                  // Convert polar to cartesian coordinates for SVG Arc
                  const rad = (degAngle: number) => (degAngle - 90) * Math.PI / 180;
                  const x1 = 50 + 50 * Math.cos(rad(startAngle));
                  const y1 = 50 + 50 * Math.sin(rad(startAngle));
                  const x2 = 50 + 50 * Math.cos(rad(endAngle));
                  const y2 = 50 + 50 * Math.sin(rad(endAngle));

                  // Path representing each pie slice
                  const d = `M 50 50 L ${x1} ${y1} A 50 50 0 0 1 ${x2} ${y2} Z`;

                  // Calculate text alignment position
                  const textAngle = startAngle + angle / 2;
                  const textRad = (textAngle - 90) * Math.PI / 180;
                  const tx = 50 + 30 * Math.cos(textRad);
                  const ty = 50 + 30 * Math.sin(textRad);

                  return (
                    <g key={idx}>
                      <path d={d} fill={prize.color} stroke="#1e293b" strokeWidth="0.5" />
                      <text 
                        x={tx} 
                        y={ty} 
                        fill="white" 
                        fontSize="4" 
                        fontWeight="900"
                        textAnchor="middle" 
                        transform={`rotate(${textAngle}, ${tx}, ${ty})`}
                        className="font-sans"
                      >
                        {language === 'bn' ? prize.labelBn : prize.labelEn}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Golden Pointer Peg at top of wheel */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20">
              <div className="w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[20px] border-t-yellow-500 filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]" />
              <div className="w-2 h-2 rounded-full bg-white absolute top-[2px] left-1/2 -translate-x-1/2 animate-pulse" />
            </div>

            {/* Premium Wheel Center Spin Button */}
            <button 
              disabled={spinning}
              onClick={handleSpin}
              className="absolute w-16 h-16 rounded-full bg-gradient-to-b from-yellow-300 via-amber-500 to-yellow-600 border-4 border-[#070e17] z-20 flex flex-col items-center justify-center text-[#070e17] hover:scale-105 active:scale-95 transition-transform disabled:opacity-90 disabled:scale-100 shadow-[0_4px_15px_rgba(0,0,0,0.6),_0_0_15px_rgba(251,191,36,0.3)]"
            >
              <RotateCw size={18} className={`font-black ${spinning ? 'animate-spin' : ''}`} />
              <span className="text-[9px] font-black uppercase tracking-tight -mt-0.5">
                {language === 'bn' ? 'স্পিন' : 'SPIN'}
              </span>
            </button>

          </div>
        </div>

        {/* Right Column: Promotional details and state notifications */}
        <div className="space-y-4 text-left">
          <div className="space-y-1">
            <span className="text-[10px] font-black text-teal-400 uppercase tracking-[0.2em] block">
              {language === 'bn' ? 'দৈনিক ফ্রি ক্যাশপ্রাইজ' : 'DAILY FREE BONUS'}
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-white italic uppercase tracking-tight flex items-center gap-2">
              <Trophy size={20} className="text-yellow-400" />
              {language === 'bn' ? 'লাকি স্পিন হুইল' : 'LUCKY SPIN WHEEL'}
            </h3>
            <p className="text-xs text-gray-400 font-medium leading-relaxed">
              {language === 'bn' 
                ? 'প্রতিদিন একটি সম্পূর্ণ ফ্রি স্পিন পান এবং জিতে নিন সর্বোচ্চ ৫০০ টাকা পর্যন্ত নিশ্চিত ক্যাশ বোনাস যা সরাসরি আপনার মূল ব্যালেন্সে যুক্ত হবে!' 
                : 'Get one completely free spin daily and claim up to ৳500 cash prize instantly added to your primary wallet balance!'}
            </p>
          </div>

          {/* Interactive States Card */}
          <div className="bg-[#0c1624] border border-white/5 p-4 rounded-2xl">
            <AnimatePresence mode="wait">
              {cooldownRemaining > 0 ? (
                <motion.div 
                  key="cooldown"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-2"
                >
                  <div className="flex items-center gap-2 text-yellow-500">
                    <Clock size={16} />
                    <span className="text-[10px] font-black uppercase tracking-widest">
                      {language === 'bn' ? 'পরবর্তী স্পিন সময়' : 'NEXT SPIN AVAILABILITY'}
                    </span>
                  </div>
                  <div className="text-2xl font-black text-yellow-400 font-mono tracking-tight">
                    {formatTime(cooldownRemaining)}
                  </div>
                  <p className="text-[10px] text-gray-500 font-semibold leading-relaxed">
                    {language === 'bn' 
                      ? 'স্পিন লিমিট শেষ হয়েছে। আগামীকাল আবার ফ্রি স্পিন পেতে অনুগ্রহ করে অপেক্ষা করুন।' 
                      : 'Spin limit reached. Please wait for the countdown to expire to receive your next free spin.'}
                  </p>
                </motion.div>
              ) : (
                <motion.div 
                  key="ready"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-3"
                >
                  <div className="flex items-center gap-2 text-emerald-400">
                    <Check size={16} className="bg-emerald-500/20 rounded-full p-0.5" />
                    <span className="text-[10px] font-black uppercase tracking-widest">
                      {language === 'bn' ? 'স্পিন প্রস্তুত!' : 'SPIN STATUS: READY!'}
                    </span>
                  </div>
                  <p className="text-sm font-bold text-white leading-normal">
                    {language === 'bn' 
                      ? 'আপনার আজকের ফ্রি স্পিনটি দাবি করুন।' 
                      : 'Your daily free spin is waiting to be claimed.'}
                  </p>
                  <button
                    disabled={spinning}
                    onClick={handleSpin}
                    className="w-full py-3.5 bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-300 hover:to-yellow-500 text-black font-black uppercase tracking-widest rounded-xl text-xs shadow-lg shadow-yellow-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    <RotateCw size={14} className={spinning ? 'animate-spin' : ''} />
                    {language === 'bn' ? 'হুইল ঘুরান এখন' : 'SPIN THE WHEEL NOW'}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Celebration Dialog inside card */}
          <AnimatePresence>
            {showCelebration && wonPrize && (
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 animate-bounce shrink-0">
                  <Sparkles size={20} className="fill-emerald-400" />
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase text-emerald-400 tracking-wider">
                    {language === 'bn' ? 'বিশাল জয়!' : 'BIG WIN!'}
                  </h4>
                  <p className="text-[10px] font-bold text-teal-100 mt-0.5">
                    {language === 'bn' 
                      ? `অভিনন্দন! আপনার ব্যালেন্সে ৳${wonPrize.value} ক্যাশ সফলভাবে যোগ হয়েছে।` 
                      : `Successfully added ৳${wonPrize.value} cash back to your standard wallet.`}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>

      </div>

    </div>
  );
}
