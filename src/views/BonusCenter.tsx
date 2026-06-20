import React, { useState, useEffect } from 'react';
import { Gift, X, Calendar, Star, AlertCircle, RefreshCw, ArrowLeft, Trophy, Users, Zap, CheckCircle2, Copy, Play, ArrowRight, BookOpen, Clock, Settings, Bell, CircleDollarSign, DollarSign, ArrowUpRight, ArrowDownLeft, Share2, Sparkles, HelpCircle, Coins, ShieldCheck, Ticket, Lock, TrendingDown, Wallet } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getReferralLink, APP_CONFIG } from '../config';
import { ToastType } from '../types';
import InstallAppButton from '../components/InstallAppButton';
import { apiService } from '../services/apiService';
import { auth } from '../services/firebase';

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
  const [genericClaiming, setGenericClaiming] = useState<string[]>([]);
  const [particles, setParticles] = useState<CoinParticle[]>([]);
  const [lossStats, setLossStats] = useState<any>(null);
  const [isLoadingLossStats, setIsLoadingLossStats] = useState(false);
  const [isClaimingLossRebate, setIsClaimingLossRebate] = useState(false);

  useEffect(() => {
    if (activeTab === 'loss_rebate' && userData) {
      fetchLossStats();
    }
  }, [activeTab, userData]);

  const fetchLossStats = async () => {
    setIsLoadingLossStats(true);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) return;
      const res = await apiService.get<any>(`/rebate/loss/stats`, {
        'Authorization': `Bearer ${idToken}`
      });
      if (res.success) {
        setLossStats(res.data);
      }
    } catch (err) {
      console.error("Error fetching loss stats:", err);
    } finally {
      setIsLoadingLossStats(false);
    }
  };

  const handleClaimLossRebate = async () => {
    if (!isPWA) {
      showToast("বোনাস নিতে অনুগ্রহ করে আমাদের অ্যাপটি ইনস্টল করুন", "warning");
      return;
    }
    if (!lossStats || !lossStats.canClaim || lossStats.rebateAmount <= 0) {
      showToast("আপনার দাবি করার মতো কোনো লস রিবেট নেই", "warning");
      return;
    }

    setIsClaimingLossRebate(true);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) return;
      
      const res = await apiService.post<any>(`/rebate/loss/claim`, {
        idToken
      }, {
        'Authorization': `Bearer ${idToken}`
      });

      if (res.success) {
        triggerCoinsExplosion(50);
        showToast(`অভিনন্দন! আপনার ৳${res.data.amount} লস রিবেট সফলভাবে ব্যালেন্সে যুক্ত হয়েছে।`, "success");
        onBalanceUpdate(balance + res.data.amount);
        fetchLossStats(); // Refresh stats
      } else {
        showToast(res.error || "দাবি করতে ব্যর্থ হয়েছে", "error");
      }
    } catch (err: any) {
      showToast(err.message || "দাবি করতে সমস্যা হয়েছে", "error");
    } finally {
      setIsClaimingLossRebate(false);
    }
  };

  const tabs = [
    { id: 'mission', label: 'মিশন' },
    { id: 'loss_rebate', label: 'লস রিবেট' },
    { id: 'vip', label: 'VIP' },
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

  const isPWA = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;

  // Render PWA install reminder if needed
  const renderPWAReminder = () => {
    if (isPWA) return null;
    return (
      <div className="bg-yellow-400/10 border border-yellow-500/30 rounded-2xl p-5 mb-5 flex items-center justify-between gap-4">
        <div>
           <p className="text-yellow-400 font-black text-xs uppercase tracking-wider mb-1">বোনাস পেতে অ্যাপ ইনস্টল করুন</p>
           <p className="text-[10px] text-yellow-500/70 font-bold">আমাদের অ্যাপটি ইনস্টল করলে আপনি নিরবচ্ছিন্ন অভিজ্ঞতা এবং এক্সকুসিভ বোনাস পাবেন!</p>
        </div>
        <InstallAppButton />
      </div>
    );
  };
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
    if (!isPWA) {
        showToast("বোনাস নিতে অনুগ্রহ করে আমাদের অ্যাপটি ইনস্টল করুন", "warning");
        return;
    }
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
    if (!isPWA) {
        showToast("বোনাস নিতে অনুগ্রহ করে আমাদের অ্যাপটি ইনস্টল করুন", "warning");
        return;
    }
    if (userData?.bonusesClaimed?.includes(bonusId) || genericClaiming.includes(bonusId)) {
        showToast("আপনি এই বোনাসটি ইতিমধ্যে নিয়েছেন", "info");
        return;
    }

    // Force first deposit for all bonuses EXCEPT registration (app install) bonus
    if (bonusId !== 'registration_bonus' && (!userData?.totalDeposits || userData.totalDeposits <= 0)) {
      showToast("কোন প্রকার বোনাস বা উপহার দাবি করার আগে প্রথম ডিপোজিট করা আবশ্যক", "warning");
      onTabChange('deposit');
      return;
    }

    // Validation logic for specific bonuses
    if (bonusId === 'registration_bonus') {
       // Registration bonus is accessible ONLY via PWA as per user request
       if (!isPWA) {
         showToast("এই বোনাসটি শুধুমাত্র আমাদের অ্যাপ থেকে দাবিযোগ্য", "warning");
         return;
       }
    } else if (bonusId === 'first_deposit_bonus') {
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

    setGenericClaiming(prev => [...prev, bonusId]);
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
    } finally {
      setGenericClaiming(prev => prev.filter(id => id !== bonusId));
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
    if (!isPWA) {
        showToast("বোনাস নিতে অনুগ্রহ করে আমাদের অ্যাপটি ইনস্টল করুন", "warning");
        return;
    }
    const bonusId = `vip_level_${levelNum}_reward`;
    if (userData?.bonusesClaimed?.includes(bonusId) || claimingVip) {
      showToast("এই লেভেল বোনাসটি আপনি ইতিমধ্যে দাবি করেছেন", "info");
      return;
    }

    if (!userData?.totalDeposits || userData.totalDeposits <= 0) {
      showToast("ভিআইপি বোনাস দাবি করার আগে প্রথম ডিপোজিট করা আবশ্যক", "warning");
      onTabChange('deposit');
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
    if (!isPWA) {
        showToast("বোনাস নিতে অনুগ্রহ করে আমাদের অ্যাপটি ইনস্টল করুন", "warning");
        return;
    }
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
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="px-4 flex-1 overflow-y-auto pt-4 pb-6 space-y-5 relative z-10">
        {renderPWAReminder()}
        
        {/* ======================================================== */}
        {/* MISSION TAB VIEW */}
        {/* ======================================================== */}
        {activeTab === 'mission' && (
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
                <span className="text-[9px] bg-yellow-400/10 text-yellow-500 px-2.5 py-1 rounded-full font-black uppercase tracking-widest border border-yellow-500/20">APP ONLY</span>
              </div>
              <div className="p-5 flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest block">Bonus Reward</span>
                  <span className="font-black text-teal-400 text-2xl italic tracking-tighter">৳{welcomeBonus}</span>
                </div>
                <motion.button 
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleClaimReward(welcomeBonus || 17, 'registration_bonus')}
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
          </div>
        )}

        {/* ======================================================== */}
        {/* LOSS REBATE TAB VIEW */}
        {/* ======================================================== */}
        {activeTab === 'loss_rebate' && (
          <div className="space-y-4">
             <div className="bg-[#0f1926] rounded-[32px] p-6 border border-white/5 shadow-2xl relative overflow-hidden group">
                <div className="absolute -top-12 -right-12 p-4 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity">
                   <TrendingDown size={180} />
                </div>
                
                <div className="flex flex-col items-center text-center space-y-4 relative z-10">
                   <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-400 border border-red-500/20 mb-2">
                      <TrendingDown size={32} />
                   </div>
                   
                   <div className="space-y-1">
                      <h3 className="text-white font-black text-2xl uppercase italic tracking-tighter">উইকলি লস রিবেট</h3>
                      <p className="text-teal-400 text-[10px] font-black uppercase tracking-[0.2em]">WEEKLY RECOVERY: 1% RATE</p>
                   </div>

                   {isLoadingLossStats ? (
                     <div className="w-full bg-white/5 rounded-3xl p-10 flex flex-col items-center justify-center space-y-3">
                        <RefreshCw className="animate-spin text-teal-500" size={32} />
                        <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Calculating your losses...</p>
                     </div>
                   ) : (
                     <>
                        <div className="w-full grid grid-cols-2 gap-3">
                           <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                              <p className="text-gray-500 text-[9px] font-black uppercase tracking-widest mb-1">Total Wagered</p>
                              <span className="text-white text-lg font-black italic tabular-nums">৳{(lossStats?.totalBet || 0).toLocaleString()}</span>
                           </div>
                           <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                              <p className="text-gray-500 text-[9px] font-black uppercase tracking-widest mb-1">Weekly Net Loss</p>
                              <span className="text-red-400 text-lg font-black italic tabular-nums">৳{(lossStats?.netLoss || 0).toLocaleString()}</span>
                           </div>
                        </div>

                        <div className="w-full bg-gradient-to-br from-[#1a2533] to-[#0f1926] rounded-3xl p-6 border border-teal-500/20 shadow-xl">
                           <p className="text-teal-500/70 text-[10px] font-black uppercase tracking-widest mb-1.5">Claimable Bonus (1%)</p>
                           <div className="flex items-baseline justify-center gap-1">
                              <span className="text-white text-5xl font-black italic tabular-nums">৳{(lossStats?.rebateAmount || 0).toLocaleString()}</span>
                           </div>
                        </div>

                        <motion.button 
                          whileTap={{ scale: 0.95 }}
                          onClick={handleClaimLossRebate}
                          disabled={isClaimingLossRebate || !lossStats?.canClaim || (lossStats?.rebateAmount || 0) <= 0}
                          className={`w-full py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all shadow-2xl flex items-center justify-center gap-2 ${
                             !lossStats?.canClaim || (lossStats?.rebateAmount || 0) <= 0
                             ? 'bg-white/5 text-gray-500 border border-white/5 cursor-not-allowed' 
                             : 'bg-gradient-to-r from-teal-500 to-teal-600 text-black shadow-teal-500/20'
                          }`}
                        >
                          {isClaimingLossRebate ? (
                            <RefreshCw className="animate-spin" size={18} />
                          ) : (
                            <Wallet size={18} />
                          )}
                          {!lossStats?.canClaim ? 'ALREADY CLAIMED THIS WEEK' : (lossStats?.rebateAmount || 0) <= 0 ? 'NO REBATE AVAILABLE' : 'CLAIM WEEKLY REBATE'}
                        </motion.button>
                        
                        <div className="flex items-center gap-2 text-[9px] text-gray-500 font-bold uppercase tracking-widest bg-white/5 px-4 py-2 rounded-full border border-white/5">
                           <Clock size={12} />
                           <span>Next Claim Available: {lossStats?.lastClaimedAt ? new Date(new Date(lossStats.lastClaimedAt).getTime() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString() : 'Now'}</span>
                        </div>
                     </>
                   )}
                   
                   <div className="bg-yellow-400/5 rounded-2xl p-4 border border-yellow-500/10 w-full">
                      <p className="text-[9px] text-yellow-500/70 font-bold uppercase tracking-widest leading-relaxed text-center">
                         গত ৭ দিনের নিট লসের ওপর ১% ক্যাশব্যাক রিবেট পান। এটি সপ্তাহে একবার দাবি করা যায়।
                      </p>
                   </div>
                </div>
             </div>
          </div>
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
                <span><b>নিবন্ধন বোনাস:</b> নতুন আইডি তৈরি করার পর যে কেউ আমাদের অ্যাপ ব্যবহার করে ১৭ টাকা দাবি করতে পারবেন।</span>
             </li>
           </ul>
        </div>
      


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
                         onClick={() => handleClaimVipReward(levelNum, lvl.reward)}
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
