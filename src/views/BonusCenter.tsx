import React, { useState } from 'react';
import { Gift, X, Calendar, Star, AlertCircle, RefreshCw, ArrowLeft, Trophy, Users, Zap, CheckCircle2, Copy, Play, ArrowRight, BookOpen, Clock, Settings, Bell, CircleDollarSign, DollarSign, ArrowUpRight, ArrowDownLeft, Share2, Sparkles, HelpCircle, Coins, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getReferralLink } from '../config';
import { ToastType } from '../components/ui/Toast';

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

export default function BonusCenter({ 
  userData, 
  balance, 
  onBalanceUpdate, 
  onTabChange, 
  onUpdateUser,
  onLogout,
  showToast, 
  welcomeBonus = 507,
  onOpenPromoModal,
  onAddTransaction
}: { 
  userData: any, 
  balance: number, 
  onBalanceUpdate: (newBalance: number) => void, 
  onTabChange: (tab: any) => void, 
  onUpdateUser: (updates: any) => Promise<void>,
  onLogout: () => void,
  showToast: (msg: string, type?: ToastType) => void, 
  welcomeBonus?: number,
  onOpenPromoModal: () => void,
  onAddTransaction?: (trx: any) => Promise<void>
}) {
  const [activeTab, setActiveTab] = useState('mission');
  const [subTab, setSubTab] = useState('new_player');
  const [claimingVip, setClaimingVip] = useState<string | null>(null);
  const [claimingCashback, setClaimingCashback] = useState(false);
  const [dailyClaiming, setDailyClaiming] = useState(false);
  const [particles, setParticles] = useState<CoinParticle[]>([]);

  const tabs = [
    { id: 'event', label: 'ইভেন্ট', badge: 2 },
    { id: 'mission', label: 'মিশন', badge: 3 },
    { id: 'vip', label: 'VIP' },
    { id: 'svip', label: 'SVIP' },
    { id: 'claim', label: 'দাবি করুন' },
    { id: 'cashback', label: 'ক্যাশব্যাক' },
  ];

  const todayStr = new Date().toISOString().split('T')[0];
  const dailyStreak = userData?.dailyStreak || 0;
  const isDailyClaimedToday = userData?.lastClaimedReward === todayStr;

  const rewards = [
    { day: 1, amount: 10 },
    { day: 2, amount: 20 },
    { day: 3, amount: 50 },
    { day: 4, amount: 30 },
    { day: 5, amount: 40 },
    { day: 6, amount: 60 },
    { day: 7, amount: 200 },
  ];

  // Particle explosion logic matching the user's interactive spec
  const triggerCoinsExplosion = (count: number) => {
    const burstParticles: CoinParticle[] = Array.from({ length: count }).map((_, i) => {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.25;
      const speed = 150 + Math.random() * 250;
      const targetX = Math.cos(angle) * speed;
      const targetYUp = -200 - Math.random() * 200;
      const targetYDown = 400 + Math.random() * 400;

      const iconTypes: Array<'coin' | 'sparkle' | 'goldStar'> = ['coin', 'coin', 'coin', 'sparkle', 'goldStar'];
      return {
        id: i,
        targetX,
        targetYUp,
        targetYDown,
        scale: 0.6 + Math.random() * 0.8,
        rotate: Math.random() * 1080 - 540,
        duration: 1.5 + Math.random() * 1.3,
        delay: Math.random() * 0.1,
        iconType: iconTypes[Math.floor(Math.random() * iconTypes.length)],
      };
    });
    setParticles(burstParticles);
    // Cleanup particles
    setTimeout(() => {
      setParticles([]);
    }, 4000);
  };

  // Triggers checking reward direct claim
  const handleClaimDailyCheckIn = async () => {
    if (isDailyClaimedToday || dailyClaiming) return;
    setDailyClaiming(true);
    const dayIndex = Math.min(dailyStreak, 6);
    const amount = rewards[dayIndex].amount;

    try {
      // Trigger visually spectacular physical coin cascade
      triggerCoinsExplosion(45);

      await onUpdateUser({
        balance: balance + amount,
        requiredTurnover: (userData?.requiredTurnover || 0) + amount,
        lastClaimedReward: todayStr,
        dailyStreak: dailyStreak + 1,
      });

      if (onAddTransaction) {
        await onAddTransaction({
          type: 'bonus',
          amount: amount,
          status: 'completed',
          description: `Daily Check-In Reward: Day ${dayIndex + 1}`,
          date: new Date().toISOString()
        });
      }

      showToast(`অভিনন্দন! ৳${amount} দৈনিক উপহার ক্লেম করা হয়েছে!`, 'success');
    } catch (error) {
      console.error("Daily check-in claiming error:", error);
      showToast("দাবি করতে সমস্যা হয়েছে", "error");
    } finally {
      setDailyClaiming(false);
    }
  };

  const handleClaimReward = async (amount: number, bonusId: string) => {
    if (userData?.bonusesClaimed?.includes(bonusId)) {
        showToast("আপনি এই বোনাসটি ইতিমধ্যে নিয়েছেন", "info");
        return;
    }

    // 1. Registration Bonus (৳১৭): No conditions
    if (bonusId === 'registration_bonus') {
      // Allowed to claim directly!
    } 
    // 2. First Deposit Bonus (৳৪৭)
    else if (bonusId === 'first_deposit_bonus') {
      if (!userData?.totalDeposits || userData.totalDeposits <= 0) {
        showToast("এই বোনাসটি নেওয়ার আগে প্রথম ডিপোজিট করা আবশ্যক", "warning");
        onTabChange('deposit');
        return;
      }
    } 
    // 3. Account Verification Bonus (৳১২)
    else if (bonusId === 'account_verification_bonus') {
      const hasDeposit = userData?.totalDeposits && userData.totalDeposits > 0;
      const hasBankCard = userData?.bankCards && userData.bankCards.length > 0;
      if (!hasDeposit && !hasBankCard) {
        showToast("শর্ত অপূর্ণ: প্রথম ডিপোজিট অথবা উইথড্র ব্যাংক কার্ড যুক্ত থাকতে হবে", "warning");
        return;
      }
    } 
    // Default fallback check for any other/original bonuses
    else {
      if (!userData?.totalDeposits || userData.totalDeposits <= 0) {
        showToast("বোনাস নিতে হলে আগে ডিপোজিট করতে হবে", "warning");
        onTabChange('deposit');
        return;
      }
    }

    try {
      triggerCoinsExplosion(30);
      showToast(`সফলভাবে ৳${amount} বোনাস যুক্ত হয়েছে!`, 'success');
      
      await onUpdateUser({
        balance: balance + amount,
        requiredTurnover: (userData?.requiredTurnover || 0) + amount,
        bonusesClaimed: [...(userData?.bonusesClaimed || []), bonusId]
      });
      
      if (onAddTransaction) {
        await onAddTransaction({
          type: 'bonus',
          amount: amount,
          status: 'completed',
          description: `Bonus reward claim: ${bonusId}`,
          date: new Date().toISOString()
        });
      }
    } catch (err) {
      console.error("Claim error:", err);
      showToast("বোনাস নিতে সমস্যা হয়েছে", "error");
    }
  };

  // -------------------------------------------------------------
  // VIP System Setup
  // -------------------------------------------------------------
  const vipLevels = [
    { level: 1, name: 'ব্রোঞ্জ (Bronze)', target: 0, reward: 0 },
    { level: 2, name: 'সিলভার (Silver)', target: 5000, reward: 200 },
    { level: 3, name: 'গোল্ড (Gold)', target: 25000, reward: 750 },
    { level: 4, name: 'প্লাটিনাম (Platinum)', target: 100000, reward: 3000 },
    { level: 5, name: 'ডায়মন্ড (Diamond)', target: 500000, reward: 20000 }
  ];

  const totalDeposited = userData?.totalDeposits || 0;
  
  const currentVipIndex = vipLevels.reduce((acc, current, idx) => {
    if (totalDeposited >= current.target) return idx;
    return acc;
  }, 0);

  const currentVip = vipLevels[currentVipIndex];
  const nextVip = currentVipIndex < vipLevels.length - 1 ? vipLevels[currentVipIndex + 1] : null;
  
  const vipProgressPercent = nextVip 
    ? Math.min(Math.max((totalDeposited - currentVip.target) / (nextVip.target - currentVip.target) * 100, 0), 100)
    : 100;

  const handleClaimVipReward = async (levelNum: number, rewardAmount: number) => {
    const bonusId = `vip_level_${levelNum}_reward`;
    if (userData?.bonusesClaimed?.includes(bonusId)) {
      showToast("এই লেভেল বোনাসটি আপনি ইতিমধ্যে দাবি করেছেন", "info");
      return;
    }
    
    if (totalDeposited < vipLevels[levelNum - 1].target) {
      showToast("এই ভিআইপি লেভেলে পৌঁছাতে আমানত বা খেলোয়াড় লক্ষ্যমাত্রা অপূর্ণ আছে", "warning");
      return;
    }

    setClaimingVip(bonusId);
    try {
      triggerCoinsExplosion(40);
      await onUpdateUser({
        balance: balance + rewardAmount,
        requiredTurnover: (userData?.requiredTurnover || 0) + rewardAmount,
        bonusesClaimed: [...(userData?.bonusesClaimed || []), bonusId]
      });

      if (onAddTransaction) {
        await onAddTransaction({
          type: 'bonus',
          amount: rewardAmount,
          status: 'completed',
          description: `VIP Level ${levelNum} Status Upgrade Reward`,
          date: new Date().toISOString()
        });
      }
      showToast(`অভিনন্দন! VIP Level ${levelNum} উপহার দাবি করেছেন এবং ৳${rewardAmount} জমা হয়েছে!`, "success");
    } catch (err) {
      showToast("VIP দাবি প্রক্রিয়াকরণ ব্যর্থ হয়েছে", "error");
    } finally {
      setClaimingVip(null);
    }
  };

  // -------------------------------------------------------------
  // Cashback / Daily Rebate Claim
  // -------------------------------------------------------------
  const turnover = userData?.requiredTurnover || 0;
  const simulatedCashback = Math.max(Math.floor(turnover * 0.015), 15); // Guaranteed at least 15 for loyalty

  const handleClaimCashback = async () => {
    if (simulatedCashback <= 0) {
      showToast("আপনার দাবির উপযোগী কোনো ক্যাশব্যাক জমে নেই", "warning");
      return;
    }
    setClaimingCashback(true);
    try {
      triggerCoinsExplosion(50);
      await onUpdateUser({
        balance: balance + simulatedCashback,
        requiredTurnover: 0 // Resetting or adjusting turnover requirements
      });

      if (onAddTransaction) {
        await onAddTransaction({
          type: 'bonus',
          amount: simulatedCashback,
          status: 'completed',
          description: `Instant Cash Rebate Claim: ৳${simulatedCashback}`,
          date: new Date().toISOString()
        });
      }
      showToast(`আপনার ক্যাশব্যাক রিবেট ৳${simulatedCashback} সফলভাবে ব্যালেন্সে যুক্ত হয়েছে!`, "success");
    } catch {
      showToast("ক্যাশব্যাক রিবেট দাবি করতে সমস্যা হয়েছে", "error");
    } finally {
      setClaimingCashback(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#2BAA74] pb-24 relative overflow-hidden flex flex-col font-sans">
      
      {/* Top Navigation */}
      <div className="flex items-center gap-2 px-4 py-3 text-white">
        <button onClick={() => onTabChange('home')} className="p-1">
          <ArrowLeft size={24} />
        </button>
        <div className="flex-1 overflow-x-auto no-scrollbar">
          <div className="flex gap-6 min-w-max items-center pb-2">
            {tabs.map(tab => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative whitespace-nowrap text-base font-bold pb-1 transition-all ${
                  activeTab === tab.id 
                    ? 'text-white border-b-2 border-white' 
                    : 'text-white/80 border-b-2 border-transparent'
                }`}
              >
                {tab.label}
                {tab.badge && (
                  <span className="absolute -top-1 -right-4 bg-red-500 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full">
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="px-4 flex-1 overflow-y-auto pb-6 space-y-4">
        
        {/* ======================================================== */}
        {/* MISSION TAB VIEW */}
        {/* ======================================================== */}
        {activeTab === 'mission' && (
          <>
            {/* Chest Progress Section */}
            <div className="bg-[#249965] rounded-xl p-4 shadow-sm border border-[#3bc68a]">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-1 font-bold text-green-300">
                  <Zap size={16} className="fill-green-300" />
                  <span>{dailyStreak * 10}</span>
                </div>
                <button className="text-white text-sm">বিশদ</button>
              </div>

              <div className="relative flex items-center justify-between px-2">
                <div className="absolute left-[10%] right-[10%] top-6 h-0.5 bg-[#45B888] -z-0"></div>
                
                {[
                  { id: 1, energy: 10, active: dailyStreak >= 1 },
                  { id: 2, energy: 30, active: dailyStreak >= 3 },
                  { id: 3, energy: 50, active: dailyStreak >= 5 },
                  { id: 4, energy: 70, active: dailyStreak >= 7 },
                ].map((chest) => (
                  <div key={chest.id} className="flex flex-col items-center gap-2 z-10">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all ${chest.active ? 'bg-amber-400 border-yellow-200 shadow-md scale-105' : 'bg-white/20 border-[#52C594]'}`}>
                      <Gift size={20} className={chest.active ? 'text-amber-950 animate-bounce' : 'text-green-200'} />
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-green-200 bg-[#1D8254] px-2 py-0.5 rounded-full border border-[#42B485]">
                      <Zap size={10} className="fill-green-200" />
                      <span>{chest.energy}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Sub Tabs */}
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <button 
                  onClick={() => setSubTab('new_player')}
                  className={`relative px-4 py-1.5 rounded-full text-sm font-bold transition-colors ${
                    subTab === 'new_player' 
                      ? 'bg-white text-[#2BAA74]' 
                      : 'border border-[#52C594] text-white hover:bg-white/10'
                  }`}
                >
                  নিউপ্লেয়ার বোনাস
                  <span className="absolute -top-1 -right-2 bg-red-500 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full">3</span>
                </button>
                <button 
                  onClick={() => setSubTab('daily')}
                  className={`relative px-4 py-1.5 rounded-full text-sm font-bold transition-colors ${
                    subTab === 'daily' 
                      ? 'bg-white text-[#2BAA74]' 
                      : 'border border-[#52C594] text-white hover:bg-white/10'
                  }`}
                >
                  দৈনিক মিশন
                </button>
              </div>
              <button 
                onClick={onOpenPromoModal}
                className="flex items-center gap-2 bg-yellow-400 text-black px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-tighter shadow-lg active:scale-95 transition-all"
              >
                <Star size={14} className="fill-black" />
                Promo Code
              </button>
            </div>

            {/* NEW PLAYER ITEMS */}
            {subTab === 'new_player' && (
              <div className="space-y-4">
                {/* 1. Registration Bonus */}
                <div className="bg-[#1D8254]/45 border border-[#3bc68a]/50 rounded-lg overflow-hidden">
                  <div className="bg-[#1D8254]/65 px-3 py-2 flex items-center gap-2 border-b border-[#3bc68a]/30">
                    <Gift size={15} className="text-pink-400 fill-pink-100" />
                    <span className="text-white text-sm font-bold">১. নিবন্ধন বোনাস</span>
                    <span className="ml-auto text-[10px] bg-yellow-400 text-black px-2 py-0.5 rounded-full font-black uppercase tracking-wider">ডিপোজিট ছাড়া</span>
                  </div>
                  <div className="p-3 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-green-200 font-bold block">বোনাস পরিমাণ</span>
                      <span className="font-black text-yellow-300 text-lg">৳১৭.০০</span>
                    </div>
                    <button 
                      onClick={() => handleClaimReward(17, 'registration_bonus')}
                      disabled={userData?.bonusesClaimed?.includes('registration_bonus')}
                      className={`${userData?.bonusesClaimed?.includes('registration_bonus') ? 'bg-gray-400 cursor-not-allowed text-gray-700' : 'bg-[#2CE830] hover:bg-[#25cc28] text-black'} font-bold px-6 py-1.5 rounded shadow`}
                    >
                      {userData?.bonusesClaimed?.includes('registration_bonus') ? 'নিয়েছেন' : 'দাবি (Claim)'}
                    </button>
                  </div>
                </div>

                {/* 2. first deposit */}
                <div className="bg-[#1D8254]/45 border border-[#3bc68a]/50 rounded-lg overflow-hidden">
                  <div className="bg-[#1D8254]/65 px-3 py-2 flex items-center gap-2 border-b border-[#3bc68a]/30">
                    <DollarSign size={15} className="text-yellow-400" />
                    <span className="text-white text-sm font-bold">২. প্রথম ডিপোজিট বোনাস</span>
                  </div>
                  <div className="p-3 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-green-200 font-bold block">বোনাস পরিমাণ</span>
                      <span className="font-black text-yellow-300 text-lg">৳৪৭.০০</span>
                    </div>
                    <button 
                      onClick={() => handleClaimReward(47, 'first_deposit_bonus')}
                      disabled={userData?.bonusesClaimed?.includes('first_deposit_bonus')}
                      className={`${userData?.bonusesClaimed?.includes('first_deposit_bonus') ? 'bg-gray-400 cursor-not-allowed text-gray-700' : 'bg-[#2CE830] hover:bg-[#25cc28] text-black'} font-bold px-6 py-1.5 rounded shadow`}
                    >
                      {userData?.bonusesClaimed?.includes('first_deposit_bonus') ? 'নিয়েছেন' : 'দাবি (Claim)'}
                    </button>
                  </div>
                </div>

                {/* 3. verification reward */}
                <div className="bg-[#1D8254]/45 border border-[#3bc68a]/50 rounded-lg overflow-hidden">
                  <div className="bg-[#1D8254]/65 px-3 py-2 flex items-center gap-2 border-b border-[#3bc68a]/30">
                    <Settings size={15} className="text-blue-300" />
                    <span className="text-white text-sm font-bold">৩. অ্যাকাউন্ট ভেরিফিকেশন বোনাস</span>
                  </div>
                  <div className="p-3 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-green-200 font-bold block">বোনাস পরিমাণ</span>
                      <span className="font-black text-yellow-300 text-lg">৳১২.০০</span>
                    </div>
                    <button 
                      onClick={() => handleClaimReward(12, 'account_verification_bonus')}
                      disabled={userData?.bonusesClaimed?.includes('account_verification_bonus')}
                      className={`${userData?.bonusesClaimed?.includes('account_verification_bonus') ? 'bg-gray-400 cursor-not-allowed text-gray-700' : 'bg-[#2CE830] hover:bg-[#25cc28] text-black'} font-bold px-6 py-1.5 rounded shadow`}
                    >
                      {userData?.bonusesClaimed?.includes('account_verification_bonus') ? 'নিয়েছেন' : 'দাবি (Claim)'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* DAILY MISSIONS TAB WITH FULLY ACTIVE 7-DAY BOARD & PULSE BUTTON */}
            {subTab === 'daily' && (
              <div className="bg-[#1D8254]/42 border border-[#3bc68a]/40 rounded-xl p-5 space-y-6">
                <div className="flex items-center gap-2">
                  <Calendar className="text-yellow-300" size={18} />
                  <span className="text-white text-base font-bold">দৈনিক উপহার চেক-ইন ক্যালেন্ডার</span>
                </div>

                {/* 7 Day Matrix */}
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-2.5">
                  {rewards.map((dayReward, index) => {
                    const isClaimed = index < dailyStreak;
                    const isToday = index === dailyStreak;
                    const isFuture = index > dailyStreak;

                    return (
                      <div 
                        key={index}
                        className={`p-2.5 rounded-xl flex flex-col items-center justify-center border text-center transition-all ${
                          isClaimed ? 'bg-[#156e3c] border-green-400/40 text-green-200 opacity-80' : 
                          isToday ? 'bg-yellow-400/10 border-yellow-400 text-yellow-300 shadow-[0_0_12px_rgba(234,179,8,0.25)] ring-2 ring-yellow-400/20' : 
                          'bg-black/10 border-transparent text-gray-400'
                        }`}
                      >
                        <span className="text-[10px] font-black uppercase block tracking-wider mb-1">D{dayReward.day}</span>
                        {isClaimed ? (
                          <CheckCircle2 size={16} className="text-green-400 mb-1" />
                        ) : (
                          <Coins size={16} className={`mb-1 ${isToday ? 'text-yellow-400 animate-bounce' : 'text-gray-500'}`} />
                        )}
                        <span className="text-xs font-black block">৳{dayReward.amount}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Claim button with exact pulse animation and coins effect */}
                <div className="relative pt-2">
                  <motion.button
                    onClick={handleClaimDailyCheckIn}
                    disabled={isDailyClaimedToday || dailyClaiming}
                    animate={isDailyClaimedToday || dailyClaiming ? { 
                      scale: 1,
                      boxShadow: "0 0 0px rgba(0,0,0,0)"
                    } : { 
                      scale: [1, 1.03, 1],
                      boxShadow: [
                        "0 0 10px rgba(251,191,36,0.25)",
                        "0 0 25px rgba(251,191,36,0.65)",
                        "0 0 10px rgba(251,191,36,0.25)"
                      ]
                    }}
                    transition={{ 
                      duration: 2, 
                      repeat: Infinity, 
                      ease: "easeInOut" 
                    }}
                    className={`
                      w-full py-4 rounded-xl font-bold text-base uppercase tracking-wider text-center relative z-10 transition-all select-none
                      ${isDailyClaimedToday ? 'bg-gray-500/50 text-gray-300 cursor-default border border-gray-400/20' : 
                        dailyClaiming ? 'bg-yellow-600 text-black cursor-wait' :
                        'bg-gradient-to-b from-yellow-300 via-yellow-400 to-yellow-600 text-black shadow-lg font-black active:scale-95 cursor-pointer'}
                    `}
                  >
                    {isDailyClaimedToday ? 'আজকের ডেইলি উপহার সম্পন্ন!' : dailyClaiming ? 'দাবি হচ্ছে...' : `৳${rewards[Math.min(dailyStreak, 6)].amount} দাবি করুন (Claim Day ${Math.min(dailyStreak + 1, 7)})`}
                  </motion.button>
                </div>

                <div className="bg-black/10 rounded-lg p-3 text-white/80 text-[11px] leading-relaxed">
                  <p className="flex items-center gap-1 font-bold text-yellow-300 mb-1">
                    <Sparkles size={11} /> দৈনিক চেক-ইন নির্দেশক:
                  </p>
                  প্রতিদিন লগইন করে ধারাবাহিক ভাবে উপহার দাবি করুন। উপহার দাবি করার সাথে সাথে আপনার ব্যালেন্সে তাৎক্ষণিক বোনাস টাকা যুক্ত হয়ে যাবে।
                </div>
              </div>
            )}

            {/* Info Rules Box */}
            <div className="bg-[#248B5F] rounded-lg p-4 text-white/90 text-sm leading-relaxed mt-2 border border-[#3bc68a]/30 shadow-inner">
               <p className="mb-2 font-black text-white hover:text-yellow-300 transition-colors uppercase tracking-wider text-xs">শর্তাবলী ও নিয়মাবলী:</p>
               <ul className="list-disc list-inside space-y-1.5 text-xs">
                 <li><b>১. নিবন্ধন বোনাস:</b> নতুন আইডি তৈরি করার পর যে কেউ সরাসরি ১৭ টাকা দাবি করতে পারবেন, কোনো আমানত ছাড়াই।</li>
                 <li><b>২. প্রথম ডিপোজিট বোনাস:</b> আপনার অ্যাকাউন্টে প্রথম ডিপোজিট সফলভাবে সম্পূর্ণ করার পর ৪৭ টাকা দাবি করতে পারবেন।</li>
                 <li><b>৩. অ্যাকাউন্ট ভেরিফিকেশন বোনাস:</b> অ্যাকাউন্ট ভেরিফাই এবং সুরক্ষিত করার জন্য ১২ টাকা বোনাস দাবি করতে পারবেন যদি প্রথম ডিপোজিট করা থাকে অথবা উত্তোলন ব্যাংক কার্ড যুক্ত করা থাকে।</li>
               </ul>
            </div>
          </>
        )}

        {/* ======================================================== */}
        {/* EVENT TAB VIEW */}
        {/* ======================================================== */}
        {activeTab === 'event' && (
          <div className="space-y-4">
            {/* Event 1 */}
            <div className="bg-gradient-to-b from-[#1E8A57] to-[#156E44] rounded-xl overflow-hidden border border-[#3CC68A]/40 shadow-lg">
              <div className="h-28 bg-[#207c52] relative flex items-center justify-between p-4">
                <div>
                  <h3 className="text-white text-lg font-black">সীমাহীন রেফার করুন এবং কামান!</h3>
                  <p className="text-yellow-300 text-xs font-bold">প্রতি রেফারে তাৎক্ষণিক ৳৫০০ বোনাস!</p>
                </div>
                <Users size={48} className="text-yellow-400 opacity-60 fill-yellow-200" />
              </div>
              <div className="p-4 space-y-3 bg-[#135d38]">
                <p className="text-xs text-white/80">
                  আপনার রেফারেল লিঙ্ক ব্যবহার করে বন্ধুদেরকে SPIN71 এ যোগ দিতে আমন্ত্রণ জানান। তারা প্রথম ডিপোজিট করলেই আপনি পাবেন ৳৫০০ এবং তারাও পাবে একটি আকর্ষণীয় স্বাগত বোনাস।
                </p>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    readOnly 
                    value={getReferralLink(userData?.userId || '102370')}
                    className="flex-1 bg-black/20 text-xs font-mono text-teal-200 px-3 py-1.5 rounded border border-[#36A875] outline-none"
                  />
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(getReferralLink(userData?.userId || '102370'));
                      showToast("রেফার লিঙ্ক ক্লিপবোর্ডে কপি হয়েছে!", "success");
                    }}
                    className="bg-yellow-400 text-black px-4 py-1.5 rounded font-bold text-xs flex items-center gap-1"
                  >
                    <Copy size={12} /> কপি
                  </button>
                </div>
              </div>
            </div>

            {/* Event 2 */}
            <div className="bg-gradient-to-b from-[#1E8A57] to-[#156E44] rounded-xl overflow-hidden border border-[#3CC68A]/40 shadow-lg">
              <div className="h-28 bg-[#207c52] relative flex items-center justify-between p-4">
                <div>
                  <h3 className="text-white text-lg font-black">এভিয়েটর উইকলি জ্যাকপট</h3>
                  <p className="text-green-300 text-xs font-bold">৳১,০০,০০০ সাপ্তাহিক পুল পুরস্কার!</p>
                </div>
                <Trophy size={48} className="text-amber-300 opacity-60" />
              </div>
              <div className="p-4 space-y-3 bg-[#135d38]/90">
                <p className="text-xs text-white/80">
                  সপ্তাহের সবচেয়ে বড় এভিয়েটর মাল্টিপ্লায়ার উড্ডয়নকারী হয়ে উঁচুতে উড়ুন। প্রথম ২০ জন লিডারবোর্ডের খেলোয়াড়দের মাঝে ১ লক্ষ টাকা ভাগ করে দেওয়া হবে প্রতি রবিবার রাতে।
                </p>
                <button 
                  onClick={() => onTabChange('aviator')}
                  className="w-full bg-[#2CE830] hover:bg-[#25cc28] text-black font-black text-xs py-2 rounded-xl flex items-center justify-center gap-1.5 shadow"
                >
                  <Play size={10} className="fill-black" /> এভিয়েটর খেলুন
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* VIP TAB VIEW */}
        {/* ======================================================== */}
        {activeTab === 'vip' && (
          <div className="space-y-4">
            {/* User current club status */}
            <div className="bg-gradient-to-br from-[#1b1c1e] to-[#2c3035] rounded-xl p-5 border border-yellow-500/20 text-white relative shadow-2xl">
              <div className="absolute top-4 right-4 bg-yellow-400 text-black text-[9px] font-black px-2 py-0.5 rounded-full tracking-wider uppercase">
                ACTIVE STATUS
              </div>
              <p className="text-xs text-yellow-500 font-bold uppercase tracking-widest flex items-center gap-1">
                <Trophy size={14} className="fill-yellow-500 text-yellow-500" /> SPIN71 VIP Club
              </p>
              <h3 className="text-2xl font-black italic uppercase tracking-tighter mt-1">
                Level {currentVip.level}: <span className="text-yellow-400">{currentVip.name}</span>
              </h3>
              
              <div className="mt-4 space-y-1">
                <div className="flex justify-between text-xs text-gray-400">
                  <span>মোট আমানত: ৳{totalDeposited}</span>
                  {nextVip && (
                    <span>পরবর্তী লেভেল: ৳{nextVip.target} ({nextVip.name})</span>
                  )}
                </div>
                {nextVip && (
                  <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-yellow-500 to-yellow-300 rounded-full"
                      style={{ width: `${vipProgressPercent}%` }}
                    ></div>
                  </div>
                )}
              </div>
            </div>

            {/* VIP tiers list */}
            <div className="space-y-3">
              <h4 className="text-white text-sm font-black uppercase tracking-wider px-1">ভিআইপি লেভেল-আপ পুরস্কারসমূহ</h4>
              {vipLevels.slice(1).map((v) => {
                const bonusId = `vip_level_${v.level}_reward`;
                const isClaimed = userData?.bonusesClaimed?.includes(bonusId);
                const isEligible = totalDeposited >= v.target;

                return (
                  <div key={v.level} className="bg-black/25 border border-white/10 p-4 rounded-xl flex justify-between items-center text-white/90">
                    <div>
                      <h5 className="font-extrabold text-sm text-yellow-400">{v.name}</h5>
                      <p className="text-[11px] text-gray-300">আমানত লক্ষ্য: ৳{v.target}</p>
                      <p className="text-[11px] text-green-300 font-bold">পুরস্কার: ৳{v.reward}</p>
                    </div>
                    <button
                      onClick={() => handleClaimVipReward(v.level, v.reward)}
                      disabled={isClaimed || claimingVip !== null}
                      className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all ${
                        isClaimed 
                          ? 'bg-gray-500/40 text-gray-400 cursor-not-allowed' 
                          : isEligible 
                            ? 'bg-yellow-400 text-black hover:scale-105 active:scale-95' 
                            : 'bg-white/10 text-white/50 cursor-pointer'
                      }`}
                    >
                      {isClaimed ? 'সংগৃহীত' : isEligible ? 'দাবি (Claim)' : 'তালাবদ্ধ'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* SVIP TAB VIEW */}
        {/* ======================================================== */}
        {activeTab === 'svip' && (
          <div className="bg-[#249965] border border-emerald-400/50 rounded-xl p-6 text-center text-white space-y-6">
            <div className="w-20 h-20 bg-yellow-400 rounded-full mx-auto flex items-center justify-center shadow-lg">
              <ShieldCheck size={44} className="text-emerald-950" />
            </div>
            <div>
              <h3 className="text-xl font-black uppercase text-yellow-300">SPIN71 SVIP লাউঞ্জ</h3>
              <p className="text-xs text-white/80 mt-1">এক্সক্লুসিভ এজেন্ট প্রাধিকার, সাপ্তাহিক কাস্টম রিবেট ও ভিআইপি লিমো ঋণ সুবিধা।</p>
            </div>
            
            <div className="border border-white/10 rounded-xl p-4 bg-black/10 text-left space-y-2 text-xs">
              <p className="font-bold text-yellow-300">প্রাধিকারসমূহ:</p>
              <ul className="list-disc list-inside space-y-1 text-white/70">
                <li>ব্যক্তিগত ২৪/৭ রিয়েল-টাইম কাস্টমার ম্যানেজার</li>
                <li>১ ঘণ্টায় সর্বোচ্চ ১ কোটি টাকা প্রত্যাহার নিশ্চয়তা</li>
                <li>বার্ষিক বিলাসবহুল উপহার এবং ফ্রি ক্রেডিট পুরস্কার</li>
              </ul>
            </div>

            <button 
              onClick={() => {
                showToast("ভিআইপি ম্যানেজার হেল্পডেস্কে রিডাইরেক্ট করা হচ্ছে...", "info");
                window.open("https://t.me/spin71_support", "_blank");
              }}
              className="w-full bg-yellow-400 text-black py-2.5 rounded-xl font-black text-sm uppercase tracking-wider block"
            >
              SVIP ম্যানেজার যোগাযোগ করুন
            </button>
          </div>
        )}

        {/* ======================================================== */}
        {/* CLAIM VIEW (PROMO / SYSTEM) */}
        {/* ======================================================== */}
        {activeTab === 'claim' && (
          <div className="space-y-4">
            <div className="bg-[#249965] rounded-xl p-5 text-white space-y-3">
              <h3 className="text-lg font-black">যেকোনো ভাউচার বা প্রোমো কোড দাবি করুন</h3>
              <p className="text-xs text-white/80">আপনার কাছে থাকা সঠিক কোডটি এখানে নিশ্চিত করে আপনার ওয়ালেট ব্যালেন্স নিমেষেই বাড়াতে পারেন।</p>
              
              <button 
                onClick={onOpenPromoModal}
                className="w-full bg-yellow-400 text-black py-2.5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1 shadow-lg"
              >
                <DollarSign size={14} /> প্রোমো কোড এন্টার করুন (Redeem Code)
              </button>
            </div>

            <div className="bg-black/15 rounded-xl p-4 text-white">
              <h4 className="text-xs font-black uppercase tracking-wider text-green-300 mb-2">আপনার দাবি করা বোনাসসমূহ</h4>
              {userData?.bonusesClaimed && userData.bonusesClaimed.length > 0 ? (
                <div className="space-y-1 text-xs text-white/80">
                  {userData.bonusesClaimed.map((bId: string, idx: number) => (
                    <div key={idx} className="flex justify-between py-1 border-b border-white/5">
                      <span>{bId}</span>
                      <span className="text-yellow-400 font-bold flex items-center gap-1">
                        <CheckCircle2 size={10} /> দাবি সম্পূর্ণ
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-white/50 italic">এখনও কোনো বোনাস দাবি সম্পূর্ণ করা হয়নি।</p>
              )}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* CASHBACK TAB VIEW */}
        {/* ======================================================== */}
        {activeTab === 'cashback' && (
          <div className="bg-gradient-to-b from-[#18754b] to-[#0f5434] rounded-xl p-6 border border-[#3bc68a]/50 text-white space-y-4 shadow-xl">
            <p className="text-xs font-bold text-teal-300 uppercase tracking-widest flex items-center gap-1">
              <RefreshCw size={12} className="animate-spin-slow" /> Real-time Rebate System
            </p>
            <div>
              <span className="text-xs text-white/60">রানিং ক্যাশব্যাক ব্যালেন্স</span>
              <h3 className="text-4xl font-black text-yellow-300 font-mono tracking-tight">৳{simulatedCashback}.০০</h3>
              <p className="text-[10px] text-teal-100 mt-1">১.৫% স্পোর্টস, স্লট ও এভিয়েটর টার্নওভারের সমন্বয়ে তৈরি</p>
            </div>

            <button 
              onClick={handleClaimCashback}
              disabled={claimingCashback}
              className="w-full bg-[#2CE830] hover:bg-[#25cc28] text-black py-3 rounded-xl font-black text-sm uppercase tracking-wider shadow-md transition-all active:scale-95"
            >
              {claimingCashback ? 'সংযুক্ত হচ্ছে...' : 'তাত্ক্ষণিক ওয়ালেটে দাবি করুন'}
            </button>

            <div className="border border-white/5 bg-black/10 p-3 rounded-lg text-[10px] text-white/70 leading-relaxed space-y-1">
              <p className="font-bold text-yellow-400">ক্যাশব্যাক নীতি:</p>
              <p>১. গেম খেলার পর ক্যাশব্যাক তাৎক্ষণিকভাবে জমা হয় এবং ২৪ ঘণ্টার মধ্যে যেকোনো সময় রিডিম করা যায়।</p>
              <p>২. দাবি করা টাকা সরাসরি মূল খেলায় ব্যালেন্স হিসেবে ব্যবহার করা সম্ভব।</p>
            </div>
          </div>
        )}

      </div>

      {/* Confetti Explosion Layer on top of everything inside Bonus Center */}
      <AnimatePresence>
        {particles.length > 0 && (
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
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-200 via-amber-400 to-yellow-600 border border-yellow-200 flex items-center justify-center shadow-[0_4px_10px_rgba(0,0,0,0.5),_inset_0_1.5px_3px_rgba(255,255,255,0.4)]">
                    <div className="w-5 h-5 rounded-full border border-dashed border-amber-300 flex items-center justify-center font-black text-[#5e3800] text-[9px]">
                      ৳
                    </div>
                  </div>
                )}
                
                {p.iconType === 'sparkle' && (
                  <Sparkles className="w-7 h-7 text-yellow-300 drop-shadow-[0_2px_6px_rgba(253,224,71,0.6)] fill-yellow-300" />
                )}

                {p.iconType === 'goldStar' && (
                  <div className="w-7 h-7 bg-gradient-to-tr from-amber-400 to-yellow-200 rotate-45 border border-yellow-200 rounded flex items-center justify-center shadow">
                    <Coins className="w-4 h-4 text-amber-950 -rotate-45" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
