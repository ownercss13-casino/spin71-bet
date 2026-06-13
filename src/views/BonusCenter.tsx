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

    // Validation logic for specific bonuses
    if (bonusId === 'first_deposit_bonus') {
      if (!userData?.totalDeposits || userData.totalDeposits <= 0) {
        showToast("এই বোনাসটি নেওয়ার আগে প্রথম ডিপোজিট করা আবশ্যক", "warning");
        onTabChange('deposit');
        return;
      }
    } else if (bonusId === 'account_verification_bonus') {
      const hasDeposit = userData?.totalDeposits && userData.totalDeposits > 0;
      const hasBankCard = userData?.bankCards && userData.bankCards.length > 0;
      if (!hasDeposit && !hasBankCard) {
        showToast("শর্ত অপূর্ণ: প্রথম ডিপোজিট অথবা উইথড্র ব্যাংক কার্ড যুক্ত থাকতে হবে", "warning");
        return;
      }
    } else if (bonusId.startsWith('mission_chest_')) {
      // Logic for mission chests based on dailyStreak
      const chestId = parseInt(bonusId.split('_').pop() || '0');
      const requiredStreaks = [1, 3, 5, 7];
      const required = requiredStreaks[chestId - 1];
      
      if (dailyStreak < required) {
        showToast(`এই বক্সটি খুলতে আপনার অন্তত ${required} দিনের স্ট্রিক প্রয়োজন`, "warning");
        return;
      }
    } else if (bonusId !== 'registration_bonus') {
      // Default deposit check for others
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
    <div className="min-h-screen bg-[#070d14] pb-24 relative overflow-hidden flex flex-col font-sans select-none">
      
      {/* Dynamic Background Glows */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-teal-500/10 blur-[120px] rounded-full" />
        <div className="absolute top-1/2 -right-24 w-80 h-80 bg-blue-600/5 blur-[100px] rounded-full" />
        <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 w-full h-64 bg-teal-400/5 blur-[100px] rounded-full" />
      </div>

      {/* Top Navigation */}
      <div className="flex items-center gap-2 px-4 py-4 text-white bg-[#0a141f]/80 backdrop-blur-md sticky top-0 z-[110] border-b border-white/5 shadow-xl">
        <motion.button 
          whileTap={{ scale: 0.9 }}
          onClick={() => onTabChange('home')} 
          className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 active:bg-white/10"
        >
          <ArrowLeft size={20} />
        </motion.button>
        <div className="flex-1 overflow-x-auto no-scrollbar ml-1">
          <div className="flex gap-7 min-w-max items-center">
            {tabs.map(tab => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative whitespace-nowrap text-[13px] font-black uppercase tracking-wider pb-1 transition-all ${
                  activeTab === tab.id 
                    ? 'text-yellow-400' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <motion.div 
                    layoutId="activeTabUnderline"
                    className="absolute -bottom-1 left-0 right-0 h-0.5 bg-yellow-400 rounded-full"
                  />
                )}
                {tab.badge && (
                  <span className="absolute -top-2 -right-3.5 bg-red-500 text-white text-[8px] w-3.5 h-3.5 flex items-center justify-center rounded-full font-black">
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="px-4 flex-1 overflow-y-auto pt-4 pb-6 space-y-5 relative z-10">
        
        {/* ======================================================== */}
        {/* MISSION TAB VIEW */}
        {/* ======================================================== */}
        {activeTab === 'mission' && (
          <>
            {/* Chest Progress Section - Refined for Dark Theme */}
            <div className="bg-[#0f1926] rounded-2xl p-5 shadow-2xl border border-teal-500/10 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-2 opacity-5 pointer-events-none">
                 <Zap size={100} className="fill-teal-500" />
              </div>
              <div className="flex justify-between items-center mb-7 relative z-10">
                <div className="flex flex-col">
                  <span className="text-[10px] text-teal-500 font-black uppercase tracking-widest leading-none mb-1">Energy Streak</span>
                  <div className="flex items-center gap-1.5 font-black text-2xl text-white italic">
                    <Zap size={20} className="fill-yellow-400 text-yellow-400" />
                    <span>{dailyStreak * 10}</span>
                  </div>
                </div>
                <button className="bg-white/5 px-3 py-1.5 rounded-lg text-[10px] font-black text-teal-400 uppercase tracking-widest border border-white/5 active:bg-white/10">Rules</button>
              </div>

              <div className="relative flex items-center justify-between px-2 pb-4">
                <div className="absolute left-[10%] right-[10%] top-6 h-0.5 bg-white/5 rounded-full -z-0">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min((dailyStreak / 7) * 100, 100)}%` }}
                    className="h-full bg-gradient-to-r from-teal-500 to-yellow-400 rounded-full shadow-[0_0_10px_rgba(45,212,191,0.3)]"
                  />
                </div>
                
                {[
                  { id: 1, energy: 10, required: 1, amount: 5, active: dailyStreak >= 1 },
                  { id: 2, energy: 30, required: 3, amount: 15, active: dailyStreak >= 3 },
                  { id: 3, energy: 50, required: 5, amount: 30, active: dailyStreak >= 5 },
                  { id: 4, energy: 70, required: 7, amount: 50, active: dailyStreak >= 7 },
                ].map((chest) => {
                  const chestBonusId = `mission_chest_${chest.id}`;
                  const isClaimed = userData?.bonusesClaimed?.includes(chestBonusId);
                  
                  return (
                    <div key={chest.id} className="flex flex-col items-center gap-3 z-10">
                      <motion.button 
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleClaimReward(chest.amount, chestBonusId)}
                        className={`w-14 h-14 rounded-2xl flex items-center justify-center border transition-all relative ${
                          isClaimed ? 'bg-[#070d14] border-white/5 opacity-40' :
                          chest.active ? 'bg-gradient-to-b from-yellow-300 to-orange-500 border-yellow-200 shadow-[0_0_20px_rgba(251,191,36,0.3)] scale-110 cursor-pointer' : 
                          'bg-[#1a2533] border-white/10 opacity-70 cursor-not-allowed'
                        }`}
                      >
                        {isClaimed ? (
                          <CheckCircle2 size={20} className="text-teal-400" />
                        ) : (
                          <Gift size={24} className={chest.active ? 'text-white drop-shadow-md animate-bounce' : 'text-gray-500'} />
                        )}
                        {chest.active && !isClaimed && (
                          <span className="absolute -top-1 -right-1 flex h-4 w-4">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-4 w-4 bg-yellow-500"></span>
                          </span>
                        )}
                      </motion.button>
                      <div className="flex flex-col items-center">
                        <div className={`flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded-full border ${chest.active ? 'bg-yellow-400/20 text-yellow-400 border-yellow-400/30' : 'bg-white/5 text-gray-500 border-white/5'}`}>
                          <Zap size={10} className={chest.active ? 'fill-yellow-400' : ''} />
                          <span>{chest.energy}</span>
                        </div>
                        {!isClaimed && (
                           <span className="text-[10px] text-white/50 font-black mt-1">৳{chest.amount}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Sub Tabs - Consistent Dark Style */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex bg-[#0f1926] p-1 rounded-xl border border-white/5 shadow-inner flex-1">
                <button 
                  onClick={() => setSubTab('new_player')}
                  className={`flex-1 relative py-2.5 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all ${
                    subTab === 'new_player' 
                      ? 'bg-teal-600 text-white shadow-lg' 
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  New Player
                  {subTab !== 'new_player' && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] w-3.5 h-3.5 flex items-center justify-center rounded-full font-black">3</span>
                  )}
                </button>
                <button 
                  onClick={() => setSubTab('daily')}
                  className={`flex-1 relative py-2.5 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all ${
                    subTab === 'daily' 
                      ? 'bg-teal-600 text-white shadow-lg' 
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Daily Mission
                </button>
              </div>
              <motion.button 
                whileTap={{ scale: 0.95 }}
                onClick={onOpenPromoModal}
                className="flex items-center gap-2 bg-gradient-to-r from-yellow-300 to-yellow-500 text-black px-5 py-3 rounded-xl text-[11px] font-black uppercase tracking-tight shadow-xl shadow-yellow-500/20 active:scale-95 transition-all"
              >
                <Star size={14} className="fill-black" />
                Promo
              </motion.button>
            </div>

            {/* NEW PLAYER ITEMS */}
            {subTab === 'new_player' && (
              <div className="space-y-4">
                {/* 1. Registration Bonus */}
                <div className="bg-[#0f1926] border border-white/5 rounded-2xl overflow-hidden shadow-xl group">
                  <div className="bg-[#1a2533] px-4 py-3 flex items-center justify-between border-b border-white/5">
                    <div className="flex items-center gap-2">
                       <div className="w-8 h-8 rounded-lg bg-pink-500/10 flex items-center justify-center text-pink-400">
                          <Gift size={18} />
                       </div>
                       <span className="text-white text-xs font-black uppercase tracking-wider">নিবন্ধন বোনাস (৳১৭)</span>
                    </div>
                    <span className="text-[9px] bg-yellow-400/10 text-yellow-500 px-2.5 py-1 rounded-full font-black uppercase tracking-widest border border-yellow-500/20">NO DEPOSIT</span>
                  </div>
                  <div className="p-5 flex items-center justify-between">
                    <div className="space-y-1">
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest block">Bonus Reward</span>
                      <span className="font-black text-teal-400 text-2xl italic tracking-tighter">৳১৭.০০</span>
                    </div>
                    <motion.button 
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleClaimReward(17, 'registration_bonus')}
                      disabled={userData?.bonusesClaimed?.includes('registration_bonus')}
                      className={`h-12 px-8 rounded-xl font-black text-xs uppercase tracking-[0.1em] transition-all shadow-lg ${
                        userData?.bonusesClaimed?.includes('registration_bonus') 
                          ? 'bg-white/5 text-gray-500 border border-white/5 cursor-not-allowed' 
                          : 'bg-teal-500 hover:bg-teal-400 text-black shadow-teal-500/20'
                      }`}
                    >
                      {userData?.bonusesClaimed?.includes('registration_bonus') ? 'CLAIMED' : 'CLAIM'}
                    </motion.button>
                  </div>
                </div>

                {/* 2. first deposit */}
                <div className="bg-[#0f1926] border border-white/5 rounded-2xl overflow-hidden shadow-xl">
                  <div className="bg-[#1a2533] px-4 py-3 flex items-center gap-2 border-b border-white/5">
                     <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-400">
                        <DollarSign size={18} />
                     </div>
                     <span className="text-white text-xs font-black uppercase tracking-wider">প্রথম ডিপোজিট বোনাস (৳৪৭)</span>
                  </div>
                  <div className="p-5 flex items-center justify-between">
                    <div className="space-y-1">
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest block">First Time Recharge</span>
                      <span className="font-black text-teal-400 text-2xl italic tracking-tighter">৳৪৭.০০</span>
                    </div>
                    <motion.button 
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleClaimReward(47, 'first_deposit_bonus')}
                      disabled={userData?.bonusesClaimed?.includes('first_deposit_bonus')}
                      className={`h-12 px-8 rounded-xl font-black text-xs uppercase tracking-[0.1em] transition-all shadow-lg ${
                        userData?.bonusesClaimed?.includes('first_deposit_bonus') 
                          ? 'bg-white/5 text-gray-500 border border-white/5 cursor-not-allowed' 
                          : 'bg-teal-500 hover:bg-teal-400 text-black shadow-teal-500/20'
                      }`}
                    >
                      {userData?.bonusesClaimed?.includes('first_deposit_bonus') ? 'CLAIMED' : 'CLAIM'}
                    </motion.button>
                  </div>
                </div>

                {/* 3. verification reward */}
                <div className="bg-[#0f1926] border border-white/5 rounded-2xl overflow-hidden shadow-xl">
                  <div className="bg-[#1a2533] px-4 py-3 flex items-center gap-2 border-b border-white/5">
                     <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
                        <Settings size={18} />
                     </div>
                     <span className="text-white text-xs font-black uppercase tracking-wider">নিরাপত্তা ভেরিফিকেশন (৳১২)</span>
                  </div>
                  <div className="p-5 flex items-center justify-between">
                    <div className="space-y-1">
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest block">Account Security</span>
                      <span className="font-black text-teal-400 text-2xl italic tracking-tighter">৳১২.০০</span>
                    </div>
                    <motion.button 
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleClaimReward(12, 'account_verification_bonus')}
                      disabled={userData?.bonusesClaimed?.includes('account_verification_bonus')}
                      className={`h-12 px-8 rounded-xl font-black text-xs uppercase tracking-[0.1em] transition-all shadow-lg ${
                        userData?.bonusesClaimed?.includes('account_verification_bonus') 
                          ? 'bg-white/5 text-gray-500 border border-white/5 cursor-not-allowed' 
                          : 'bg-teal-500 hover:bg-teal-400 text-black shadow-teal-500/20'
                      }`}
                    >
                      {userData?.bonusesClaimed?.includes('account_verification_bonus') ? 'CLAIMED' : 'CLAIM'}
                    </motion.button>
                  </div>
                </div>
              </div>
            )}

            {/* DAILY MISSIONS TAB WITH FULLY ACTIVE 7-DAY BOARD & PULSE BUTTON */}
            {subTab === 'daily' && (
              <div className="bg-[#0f1926] border border-white/5 rounded-[24px] p-6 space-y-7 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                   <Calendar size={120} />
                </div>
                
                <div className="flex items-center gap-2 relative z-10">
                  <div className="w-8 h-8 rounded-lg bg-yellow-400/10 flex items-center justify-center text-yellow-400">
                     <Calendar size={18} />
                  </div>
                  <span className="text-white text-base font-black uppercase tracking-tight italic">Daily Login Rewards</span>
                </div>

                {/* 7 Day Matrix */}
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-3 relative z-10">
                  {rewards.map((dayReward, index) => {
                    const isClaimed = index < dailyStreak;
                    const isToday = index === dailyStreak;

                    return (
                      <div 
                        key={index}
                        className={`p-3 rounded-2xl flex flex-col items-center justify-center border text-center transition-all ${
                          isClaimed ? 'bg-teal-500/5 border-teal-500/10 text-teal-500 opacity-50' : 
                          isToday ? 'bg-yellow-400 border-yellow-300 text-black shadow-[0_0_20px_rgba(251,191,36,0.25)] scale-105' : 
                          'bg-white/5 border-white/5 text-gray-500'
                        }`}
                      >
                        <span className="text-[9px] font-black uppercase block tracking-wider mb-1.5">{isToday ? 'TODAY' : `DAY ${dayReward.day}`}</span>
                        {isClaimed ? (
                          <CheckCircle2 size={18} className="mb-1.5" />
                        ) : (
                          <Coins size={18} className={`mb-1.5 ${isToday ? 'text-black' : 'text-gray-600'}`} />
                        )}
                        <span className={`text-[11px] font-black block tabular-nums ${isToday ? 'text-black' : 'text-white'}`}>৳{dayReward.amount}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Claim button with exact pulse animation and coins effect */}
                <div className="relative pt-2 z-10">
                  <motion.button
                    onClick={handleClaimDailyCheckIn}
                    disabled={isDailyClaimedToday || dailyClaiming}
                    whileTap={{ scale: 0.98 }}
                    animate={isDailyClaimedToday || dailyClaiming ? {} : { 
                      boxShadow: [
                        "0 0 10px rgba(45,212,191,0.1)",
                        "0 0 25px rgba(45,212,191,0.4)",
                        "0 0 10px rgba(45,212,191,0.1)"
                      ]
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className={`
                      w-full py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] text-center relative transition-all shadow-xl
                      ${isDailyClaimedToday ? 'bg-white/5 text-gray-500 border border-white/5 cursor-default' : 
                        dailyClaiming ? 'bg-teal-700 text-black cursor-wait' :
                        'bg-gradient-to-r from-teal-500 to-teal-600 text-black hover:from-teal-400 hover:to-teal-500 active:scale-95'}
                    `}
                  >
                    {isDailyClaimedToday ? 'ALREADY CLAIMED TODAY' : dailyClaiming ? 'CLAIMING...' : `Claim Day ${Math.min(dailyStreak + 1, 7)} Reward`}
                  </motion.button>
                </div>

                <div className="bg-white/5 rounded-2xl p-4 text-gray-400 text-[11px] leading-relaxed border border-white/5 relative z-10">
                  <p className="flex items-center gap-1.5 font-black text-teal-400 mb-1 uppercase tracking-widest text-[9px]">
                    <Sparkles size={11} /> Activity rules:
                  </p>
                  প্রতিদিন লগইন করুন এবং টাকা জিতে নিন। যদি কোনো দিন মিস করেন তবে আপনার স্ট্রিক পুনরায় ১ দিন থেকে শুরু হতে পারে। উপহার দাবি করার সাথে সাথে ব্যালেন্সে টাকা যুক্ত হবে।
                </div>
              </div>
            )}
          </>
        )}

        {/* INFO RULES BOX - UPDATED */}
        <div className="bg-[#0f1926] rounded-2xl p-5 text-gray-400 text-[11px] leading-relaxed mt-2 border border-white/5 shadow-2xl relative overflow-hidden">
           <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded bg-teal-500/10 flex items-center justify-center text-teal-400">
                 <BookOpen size={14} />
              </div>
              <p className="font-black text-white uppercase tracking-wider text-[10px]">শর্তাবলী ও নিয়মাবলী:</p>
           </div>
           <ul className="space-y-2 text-white/60">
             <li className="flex gap-2">
                <span className="text-teal-500 font-black">•</span>
                <span><b>নিবন্ধন বোনাস:</b> নতুন আইডি তৈরি করার পর যে কেউ সরাসরি ১৭ টাকা দাবি করতে পারবেন, কোনো আমানত ছাড়াই।</span>
             </li>
             <li className="flex gap-2">
                <span className="text-teal-500 font-black">•</span>
                <span><b>প্রথম ডিপোজিট বোনাস:</b> আপনার অ্যাকাউন্টে প্রথম ডিপোজিট সফলভাবে সম্পূর্ণ করার পর ৪৭ টাকা দাবি করতে পারবেন।</span>
             </li>
             <li className="flex gap-2">
                <span className="text-teal-500 font-black">•</span>
                <span><b>ভেরিফিকেশন বোনাস:</b> অ্যাকাউন্ট ভেরিফাই এবং সুরক্ষিত করার জন্য ১২ টাকা বোনাস দাবি করতে পারবেন যদি প্রথম ডিপোজিট করা থাকে।</span>
             </li>
           </ul>
        </div>
      

        {/* ======================================================== */}
        {/* EVENT TAB VIEW */}
        {/* ======================================================== */}
        {activeTab === 'event' && (
          <div className="space-y-4">
            <div className="bg-[#0f1926] rounded-3xl overflow-hidden shadow-2xl border border-white/5 relative">
              <div className="h-40 overflow-hidden relative group">
                <img 
                  src="https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&q=80&w=800" 
                  alt="Referral" 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0f1926] via-transparent to-transparent" />
                <div className="absolute bottom-4 left-6">
                   <h4 className="text-white font-black text-2xl uppercase italic tracking-tighter drop-shadow-lg">সীমাহীন রেফার করুন</h4>
                   <p className="text-teal-400 text-[10px] font-black uppercase tracking-[0.2em]">Refer & Earn ৳১০০+ Recharge</p>
                </div>
              </div>
              <div className="p-6 space-y-5">
                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-gray-500 bg-white/5 px-4 py-2 rounded-xl">
                   <span>Your Referral Code</span>
                   <span className="text-teal-400 font-mono text-xs">{userData?.referralCode || '----'}</span>
                </div>
                <div className="flex flex-col gap-3">
                  <p className="text-gray-400 text-xs leading-relaxed font-bold">আপনার আমন্ত্রিত বন্ধু প্রথমবার ২০০ টাকা বা তার বেশি ডিপোজিট করলে আপনি ১০০ টাকা বোনাস পাবেন।</p>
                  <motion.button 
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                        const link = getReferralLink(userData?.referralCode || '');
                        navigator.clipboard.writeText(link);
                        showToast("রেফারেল লিঙ্ক কপি করা হয়েছে!", "success");
                    }}
                    className="w-full py-4 bg-teal-600 hover:bg-teal-500 text-white font-black rounded-2xl transition-all shadow-xl shadow-teal-600/20 active:scale-95 flex items-center justify-center gap-3 uppercase text-xs tracking-[0.2em]"
                  >
                    <Share2 size={16} />
                    Copy Invite Link
                  </motion.button>
                </div>
              </div>
            </div>

            <div className="bg-[#0f1926] rounded-3xl p-6 border border-white/5 shadow-2xl space-y-4">
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                     <Users size={20} />
                  </div>
                  <div>
                     <span className="text-white font-black uppercase tracking-tight block">Referral Stats</span>
                     <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest leading-none">Your network overview</span>
                  </div>
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                     <span className="text-[10px] text-gray-500 font-black uppercase block tracking-wider mb-1">Total Invites</span>
                     <span className="text-2xl font-black text-white italic">০ জন</span>
                  </div>
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                     <span className="text-[10px] text-gray-500 font-black uppercase block tracking-wider mb-1">Total Earned</span>
                     <span className="text-2xl font-black text-yellow-500 italic">৳০.০০</span>
                  </div>
               </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* VIP TAB VIEW */}
        {/* ======================================================== */}
        {activeTab === 'vip' && (
          <div className="space-y-5">
            {/* Current Status */}
            <div className="bg-[#0f1926] rounded-[32px] p-6 border border-white/5 shadow-2xl relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
                  <Trophy size={140} />
               </div>
               
               <div className="flex items-center justify-between mb-6 relative z-10">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-yellow-300 to-yellow-600 flex items-center justify-center text-black shadow-lg">
                       <Trophy size={24} strokeWidth={2.5} />
                    </div>
                    <div>
                       <span className="text-white font-black text-lg uppercase leading-none block">VIP {currentVip.name}</span>
                       <span className="text-[10px] text-yellow-500 font-black uppercase tracking-[0.2em]">Member Since {new Date(userData?.createdAt || Date.now()).getFullYear()}</span>
                    </div>
                  </div>
                  {nextVip && <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">LVL {userData?.vipLevel || 1} / {vipLevels.length}</span>}
               </div>

               {nextVip ? (
                 <div className="space-y-3 relative z-10">
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-1.5">
                       <span className="text-gray-400">Upgrade Progress</span>
                       <span className="text-teal-400">{vipProgressPercent.toFixed(1)}%</span>
                    </div>
                    <div className="h-2.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
                       <motion.div 
                         initial={{ width: 0 }}
                         animate={{ width: `${vipProgressPercent}%` }}
                         className="h-full bg-gradient-to-r from-teal-500 to-teal-400 rounded-full shadow-[0_0_10px_rgba(20,184,166,0.3)]"
                       />
                    </div>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest text-center mt-2">
                       Deposit ৳{(nextVip.target - totalDeposited).toLocaleString()} more to reach <b>{nextVip.name}</b>
                    </p>
                 </div>
               ) : (
                 <div className="py-2 flex items-center justify-center gap-2 text-teal-400 bg-teal-500/10 rounded-2xl border border-teal-500/20">
                    <Star size={16} className="fill-teal-400" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">You have reached Maximum VIP Level!</span>
                 </div>
               )}
            </div>

            {/* VIP Levels List */}
            <div className="space-y-4">
              {vipLevels.map((lvl, idx) => {
                const levelNum = idx + 1;
                const isCurrent = (userData?.vipLevel || 1) === levelNum;
                const isLocked = (userData?.vipLevel || 1) < levelNum;
                const bonusId = `vip_level_${levelNum}_bonus`;
                const isClaimed = userData?.bonusesClaimed?.includes(bonusId);
                const canClaim = !isLocked && !isClaimed;

                return (
                  <div key={lvl.name} className={`bg-[#0f1926] rounded-3xl border transition-all ${isCurrent ? 'border-teal-500/30' : isLocked ? 'border-white/5 opacity-80' : 'border-white/10'}`}>
                    <div className="p-5 flex items-center justify-between">
                       <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${
                            isCurrent ? 'bg-teal-500/20 border-teal-500/50 text-teal-400' : 
                            isLocked ? 'bg-white/5 border-white/5 text-gray-700' : 
                            'bg-yellow-400/20 border-yellow-400/50 text-yellow-500'
                          }`}>
                             {isLocked ? <Lock size={20} /> : <Trophy size={20} />}
                          </div>
                          <div>
                             <h5 className={`font-black uppercase tracking-tight text-base ${isLocked ? 'text-gray-500' : 'text-white'}`}>{lvl.name}</h5>
                             <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest leading-none">Target: ৳{lvl.target.toLocaleString()}</span>
                          </div>
                       </div>
                       <div className="text-right">
                          <span className="text-[9px] text-gray-500 font-black uppercase block tracking-widest mb-1">Bonus Reward</span>
                          <span className={`${isLocked ? 'text-gray-700' : 'text-teal-400'} font-black text-xl italic tabular-nums leading-none`}>৳{lvl.reward.toLocaleString()}</span>
                       </div>
                    </div>

                    <div className="px-5 pb-5 pt-1">
                       <motion.button 
                         whileTap={canClaim ? { scale: 0.98 } : {}}
                         onClick={() => handleClaimVipReward(lvl.reward, bonusId, levelNum)}
                         disabled={isClaimed || claimingVip !== null || isLocked}
                         className={`w-full py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all border ${
                            isClaimed ? 'bg-white/5 text-gray-500 border-white/5' : 
                            isLocked ? 'bg-white/5 text-gray-600 border-white/5' :
                            claimingVip === bonusId ? 'bg-teal-700 text-black border-teal-600' :
                            'bg-gradient-to-r from-teal-500 to-teal-600 text-black border-teal-400 shadow-lg shadow-teal-500/10'
                         }`}
                       >
                         {isClaimed ? 'LEVEL REWARD TAKEN' : isLocked ? 'DEPOSIT MORE TO UNLOCK' : claimingVip === bonusId ? 'PROCESS...' : 'CLAIM LEVEL BONUS'}
                       </motion.button>
                    </div>
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
          <div className="space-y-4">
             <div className="bg-[#0f1926] rounded-[32px] overflow-hidden border border-white/5 shadow-2xl relative group">
                <div className="p-8 space-y-6 relative z-10">
                   <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white shadow-2xl shadow-indigo-500/20 mb-6 mx-auto scale-110">
                      <Star size={40} className="fill-white" />
                   </div>
                   <div className="text-center space-y-2">
                       <h3 className="text-white font-black text-3xl italic uppercase tracking-tighter">Become SVIP</h3>
                       <p className="text-gray-400 text-xs font-bold leading-relaxed max-w-[240px] mx-auto">সুপার ভিআইপি মেম্বার হিসেবে যুক্ত হয়ে পান প্রতিদিন আনলিমিটেড বোনাস এবং ভিআইপি সাপোর্ট।</p>
                   </div>
                   <div className="space-y-3 py-4">
                      {[
                        'Daily Birthday Bonus ৳৫০০+',
                        'Weekly Loss Recovery ৳১০০০+',
                        'Direct Admin Support Line',
                        'Instant Withdraw Priority'
                      ].map(feature => (
                        <div key={feature} className="flex items-center gap-3 bg-white/5 p-3.5 rounded-2xl border border-white/5">
                           <div className="w-5 h-5 rounded bg-teal-500/10 flex items-center justify-center text-teal-400">
                              <CheckCircle2 size={12} />
                           </div>
                           <span className="text-[11px] font-black uppercase text-gray-300 tracking-wide">{feature}</span>
                        </div>
                      ))}
                   </div>
                   <motion.button 
                     whileTap={{ scale: 0.95 }}
                     onClick={() => window.open(APP_CONFIG.SUPPORT_TELEGRAM, '_blank')}
                     className="w-full py-5 bg-gradient-to-r from-teal-500 to-blue-600 text-white font-black rounded-3xl shadow-2xl shadow-teal-500/20 active:scale-95 transition-all text-xs tracking-[0.2em] uppercase flex items-center justify-center gap-3"
                   >
                     <Share2 size={18} />
                     Contact Support for SVIP
                   </motion.button>
                </div>
                <div className="absolute inset-0 bg-blue-600/5 blur-[100px] pointer-events-none" />
             </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* CLAIM TAB VIEW (PROMO CODE) */}
        {/* ======================================================== */}
        {activeTab === 'claim' && (
           <div className="space-y-4">
              <div className="bg-[#0f1926] rounded-[32px] p-8 border border-white/5 shadow-2xl text-center space-y-6 relative overflow-hidden">
                 <div className="w-20 h-20 rounded-[28px] bg-teal-500/10 flex items-center justify-center text-teal-400 mx-auto border border-teal-500/20">
                    <Ticket size={40} />
                 </div>
                 <div className="space-y-2">
                    <h3 className="text-white font-black text-2xl uppercase italic tracking-tight">Reward Unlock</h3>
                    <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.2em]">Have a secret promo code?</p>
                 </div>
                 <motion.button 
                   whileTap={{ scale: 0.95 }}
                   onClick={onOpenPromoModal}
                   className="w-full py-5 bg-yellow-400 hover:bg-yellow-300 text-black font-black rounded-2xl shadow-xl shadow-yellow-500/20 transition-all uppercase text-xs tracking-[0.2em]"
                 >
                   Enter Coupon Code
                 </motion.button>
                 <p className="text-[9px] text-gray-600 font-bold uppercase leading-relaxed tracking-wider">আমাদের টেলিগ্রাম চ্যানেলে জয়েন করুন নতুন নতুন প্রোমো কোড পেতে।</p>
              </div>
           </div>
        )}

        {/* ======================================================== */}
        {/* CASHBACK TAB VIEW */}
        {/* ======================================================== */}
        {activeTab === 'cashback' && (
          <div className="space-y-4">
             <div className="bg-[#0f1926] rounded-[32px] p-8 border border-white/5 shadow-2xl relative overflow-hidden group">
                <div className="absolute -top-12 -right-12 p-4 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity">
                   <Clock size={180} />
                </div>
                <div className="flex flex-col items-center text-center space-y-4 relative z-10">
                   <div className="w-20 h-20 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-400 border border-orange-500/20 mb-2">
                      <Zap size={40} className="fill-orange-400" />
                   </div>
                   <div className="space-y-1">
                      <h3 className="text-white font-black text-3xl uppercase italic tracking-tighter">Daily Cashback</h3>
                      <p className="text-teal-400 text-[10px] font-black uppercase tracking-[0.3em]">Ready to claim: 1.5% Rate</p>
                   </div>
                   
                   <div className="w-full bg-white/5 rounded-3xl p-6 border border-white/5 backdrop-blur-sm my-4">
                      <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-1.5">Unclaimed Reward</p>
                      <span className="text-white text-5xl font-black italic tabular-nums">৳{simulatedCashback.toLocaleString()}</span>
                   </div>

                   <motion.button 
                     whileTap={{ scale: 0.95 }}
                     onClick={() => handleClaimReward(simulatedCashback, `cashback_${new Date().toISOString().split('T')[0]}`)}
                     disabled={userData?.bonusesClaimed?.includes(`cashback_${new Date().toISOString().split('T')[0]}`)}
                     className={`w-full py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all shadow-2xl ${
                        userData?.bonusesClaimed?.includes(`cashback_${new Date().toISOString().split('T')[0]}`)
                        ? 'bg-white/5 text-gray-500 border border-white/5'
                        : 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-orange-500/20'
                     }`}
                   >
                     {userData?.bonusesClaimed?.includes(`cashback_${new Date().toISOString().split('T')[0]}`) ? 'CLAIMED TODAY' : 'CLAIM CASHBACK NOW'}
                   </motion.button>
                   
                   <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest leading-relaxed">আপনার মোট টার্নওভারের ১.৫% প্রতিদিন রাত ১২টায় ক্যাশব্যাক হিসেবে জমা হয়।</p>
                </div>
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
