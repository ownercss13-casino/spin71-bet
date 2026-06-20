import React, { useState, useEffect } from "react";
import { QRCodeSVG } from 'qrcode.react';
import { motion } from 'motion/react';
import { db } from "../services/firebase";
import { collection, query, where, getDocs, orderBy, limit, onSnapshot } from "firebase/firestore";
import { 
  Copy, 
  HelpCircle, 
  Home,
  Share2, 
  User, 
  Users, 
  Award, 
  Facebook, 
  Twitter, 
  MessageCircle, 
  Send, 
  Gift, 
  ChevronLeft, 
  TrendingUp, 
  DollarSign, 
  Target, 
  Crown, 
  Coins, 
  Zap, 
  Shield, 
  Star, 
  Activity, 
  Clock,
  QrCode,
  Calendar,
  ChevronDown,
  History,
  Plane,
  Info,
  Download,
  Loader2
} from "lucide-react";
import { ToastType } from '../types';
import { getReferralLink } from '../config';

import ShareModal from '../components/modals/ShareModal';

export default function InviteView({ 
  onTabChange, 
  userData, 
  showToast, 
  initialSubTab,
  casinoName,
  onUpdateUser,
  onAddTransaction,
  onBack
}: { 
  onTabChange: (tab: any) => void, 
  userData?: any, 
  showToast: (msg: string, type?: ToastType) => void, 
  initialSubTab?: string,
  casinoName?: string,
  onUpdateUser?: (updates: any) => Promise<void>,
  onAddTransaction?: (transaction: any) => Promise<void>,
  onBack: () => void
}) {
  const [activeTab, setActiveTab] = useState(initialSubTab || 'overview');
  const [referralsList, setReferralsList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isTabLoading, setIsTabLoading] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [expandedRef, setExpandedRef] = useState<string | null>(null);

  useEffect(() => {
    // Fast tab loading experience
    setIsTabLoading(true);
    const timer = setTimeout(() => setIsTabLoading(false), 50);
    return () => clearTimeout(timer);
  }, [activeTab]);

  useEffect(() => {
    if (!userData?.id) return;

    // Listen to referred users in real-time
    const q = query(
      collection(db, 'users'), 
      where('referredBy', '==', userData.id)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Sort by createdAt descending
      list.sort((a: any, b: any) => {
        const timeA = a.createdAt?.seconds || (a.createdAt ? new Date(a.createdAt).getTime() : 0);
        const timeB = b.createdAt?.seconds || (b.createdAt ? new Date(b.createdAt).getTime() : 0);
        return timeB - timeA;
      });

      setReferralsList(list);

      // Recalculate stats locally
      const valid = list.filter((u: any) => (u.totalDeposits || 0) > 0 || (u.deposits || 0) > 0).length;
      setStats({
        registers: list.length,
        validReferrals: valid,
        totalEarnings: userData.totalReferralEarnings || 0
      });
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [userData?.id, userData?.totalReferralEarnings]);

  const [stats, setStats] = useState({
    registers: userData?.referralCount || 0,
    validReferrals: userData?.validReferralCount || 0,
    totalEarnings: userData?.totalReferralEarnings || 0
  });
  
  const referralCode = userData?.referralCode || 'BETAIG';
  const referralLink = getReferralLink(referralCode);
  const displayCasinoName = casinoName || "SPIN71 BET✨";

  const [isClaiming, setIsClaiming] = useState<number | null>(null);

  const handleClaimReward = async (tier: any, index: number) => {
    if (!userData?.id || !onUpdateUser || !onAddTransaction) return;
    
    if (!userData?.totalDeposits || userData.totalDeposits <= 0) {
      showToast("রেফারেল পুরস্কার দাবি করার আগে প্রথম ডিপোজিট করা আবশ্যক।", "warning");
      return;
    }
    
    const validCount = userData.validReferralCount || 0;
    if (validCount < tier.count) {
      showToast(`আপনার অন্তত ${tier.count} জন সঠিক রেফারেল প্রয়োজন।`, "warning");
      return;
    }

    // Check if already claimed (this should be tracked in a 'claimedRewards' list in userData)
    const claimedRewards = userData.claimedRewards || [];
    if (claimedRewards.includes(tier.count)) {
      showToast("এই পুরস্কারটি আপনি ইতিমধ্যে গ্রহণ করেছেন।", "info");
      return;
    }

    setIsClaiming(index);
    try {
      const rewardAmount = parseFloat(tier.reward.replace(/,/g, ''));
      
      // Update balance
      await onUpdateUser({
        balance: (userData.balance || 0) + rewardAmount,
        totalReferralEarnings: (userData.totalReferralEarnings || 0) + rewardAmount,
        claimedRewards: [...claimedRewards, tier.count]
      });

      // Add transaction record
      await onAddTransaction({
        trxId: `REF-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        type: 'bonus',
        amount: rewardAmount,
        method: 'Referral Reward',
        status: 'completed',
        statusColor: 'text-green-500',
        date: new Date().toLocaleString()
      });

      showToast(`অভিনন্দন! আপনি ৳${rewardAmount.toLocaleString()} পুরস্কার পেয়েছেন।`, "success");
    } catch (error) {
      console.error("Error claiming reward:", error);
      showToast("পুরস্কার গ্রহণ করতে সমস্যা হয়েছে।", "error");
    } finally {
      setIsClaiming(null);
    }
  };

  const tabs = [
    { id: 'overview', name: 'আমন্ত্রণ (Share)', icon: Share2 },
    { id: 'rewards', name: 'পুরস্কার (Bonus)', icon: Award },
    { id: 'invited', name: 'টিম (My Team)', icon: Users }
  ];

  const copyToClipboard = (text: string, msg: string) => {
    navigator.clipboard.writeText(text);
    showToast(msg, "success");
  };

  const shareToSocial = (platform: string) => {
    const text = `Join ${displayCasinoName} and get a ৳507 welcome bonus! Use my referral link: ${referralLink}`;
    let url = "";

    switch (platform) {
      case 'whatsapp':
        url = `https://wa.me/?text=${encodeURIComponent(text)}`;
        break;
      case 'telegram':
        url = `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(text)}`;
        break;
      case 'facebook':
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}`;
        break;
    }

    if (url) window.open(url, '_blank');
  };

  const downloadQRCode = () => {
    const svg = document.getElementById('referral-qr');
    if (svg) {
      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);
        const pngFile = canvas.toDataURL("image/png");
        const downloadLink = document.createElement("a");
        downloadLink.download = `referral-qr-${referralCode}.png`;
        downloadLink.href = `${pngFile}`;
        downloadLink.click();
      };
      img.src = "data:image/svg+xml;base64," + btoa(svgData);
      showToast("QR Code ডাউনলোড শুরু হয়েছে", "success");
    }
  };

  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center py-20 animate-in fade-in duration-500">
      <div className="relative mb-6">
        <Plane size={80} className="text-blue-400 transform -rotate-12 animate-bounce" />
        <div className="absolute -top-2 -right-2 flex gap-1">
          <Star size={12} className="text-blue-300 fill-blue-300" />
          <Star size={8} className="text-blue-200 fill-blue-200" />
        </div>
        <div className="absolute -bottom-2 -left-2">
          <Star size={10} className="text-blue-300 fill-blue-300" />
        </div>
      </div>
      <h3 className="text-2xl font-bold text-blue-500">No data</h3>
    </div>
  );

  return (
    <div className="flex-1 w-full flex flex-col min-h-screen bg-[#f4f7f9]">
      {/* Header */}
      <div className="bg-[#1a0b2e] p-4 flex items-center gap-4 sticky top-0 z-20">
        <button 
          onClick={() => onTabChange('home')}
          className="text-white p-1"
        >
          <ChevronLeft size={24} />
        </button>
        <h2 className="text-white text-lg font-medium flex-1 text-center mr-8">বন্ধুদের আমন্ত্রণ জানান</h2>
      </div>

      {/* Tab Navigation */}
      <div className="bg-[#1a0b2e] z-20 shadow-xl border-b border-white/5">
        <div className="flex px-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-4 flex flex-col items-center gap-1 transition-all relative ${
                activeTab === tab.id ? 'text-yellow-400' : 'text-gray-400'
              }`}
            >
              <tab.icon size={20} className={activeTab === tab.id ? 'animate-pulse' : ''} />
              <span className="text-[10px] font-black uppercase tracking-tight">{tab.name}</span>
              {activeTab === tab.id && (
                <motion.div 
                  layoutId="activeInviteTab"
                  className="absolute bottom-0 left-4 right-4 h-0.5 bg-yellow-400 rounded-t-full shadow-[0_0_10px_rgba(234,179,8,0.8)]" 
                />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 pb-24 bg-[#0b0c14] relative">
        {isTabLoading && (
          <div className="absolute inset-0 z-50 bg-[#0b0c14] flex flex-col items-center justify-center gap-4 animate-in fade-in duration-300">
            <div className="w-12 h-12 border-4 border-yellow-500/10 border-t-yellow-500 rounded-full animate-spin shadow-[0_0_15px_rgba(234,179,8,0.3)]"></div>
            <p className="text-[10px] font-black text-yellow-500 uppercase tracking-[0.3em] animate-pulse">লোড হচ্ছে...</p>
          </div>
        )}
        
        {activeTab === 'overview' && (
          <div className="p-4 space-y-4 animate-in fade-in duration-500">
            {/* Share Section */}
            <div className="bg-[#1c1d29] rounded-[32px] p-6 shadow-2xl border border-white/5 relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
              <div className="relative z-10">
                <p className="text-[11px] font-black text-yellow-500 uppercase tracking-[0.3em] mb-4 text-center">আমন্ত্রণ লিংক ও কোড</p>
                
                <div className="flex flex-col gap-6 items-center">
                  <div className="flex flex-col items-center justify-center bg-black/40 px-6 py-3 border border-white/5 shadow-inner rounded-[20px] w-full">
                     <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">আপনার ইউজার নেম</span>
                     <span className="text-xl font-black text-white uppercase tracking-wider">{userData?.username || 'User'}</span>
                  </div>

                  <div className="relative group cursor-pointer" onClick={downloadQRCode}>
                    <div className="w-32 h-32 bg-white p-2 rounded-[24px] flex items-center justify-center relative shadow-[0_0_40px_rgba(255,255,255,0.1)] group-hover:scale-105 transition-transform duration-500">
                      <QRCodeSVG 
                        id="referral-qr"
                        value={referralLink} 
                        size={112} 
                        level="H"
                        includeMargin={false}
                      />
                      <div className="absolute inset-0 bg-yellow-600/10 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-[24px]">
                        <Download size={32} className="text-yellow-600" />
                      </div>
                    </div>
                    <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap bg-yellow-500 text-black text-[9px] font-black px-3 py-1 rounded-full shadow-lg border border-yellow-400">SAVE QR CODE</div>
                  </div>

                  <div className="w-full space-y-4">
                    {/* Link Section */}
                    <div className="flex items-center gap-2 bg-black/40 border border-white/5 rounded-2xl px-4 py-4 group focus-within:border-yellow-500/50 transition-all">
                      <span className="text-[10px] font-bold text-gray-400 break-all flex-1 leading-tight select-all">{referralLink}</span>
                      <button 
                        onClick={() => copyToClipboard(referralLink, "লিঙ্ক কপি করা হয়েছে!")}
                        className="flex items-center gap-1.5 px-4 py-2.5 bg-yellow-500 rounded-xl text-black hover:bg-yellow-400 transition-all active:scale-95 shadow-lg shrink-0 group/link"
                      >
                        <Copy size={14} className="group-active/link:scale-110 transition-transform" />
                        <span className="text-[10px] font-black uppercase">COPY LINK</span>
                      </button>
                    </div>
                    
                    {/* Invited Code Section */}
                    <div 
                      className="flex items-center gap-2 bg-yellow-500/5 border border-yellow-500/10 rounded-2xl px-4 py-4 cursor-pointer hover:border-yellow-500/20 transition-all"
                      onClick={() => copyToClipboard(referralCode, "আমন্ত্রণ কোড কপি করা হয়েছে!")}
                    >
                      <span className="text-[11px] font-black text-gray-300 flex-1 uppercase tracking-wider">MY INVITE CODE: <span className="text-yellow-500 text-sm ml-2">{referralCode}</span></span>
                      <button 
                        className="flex items-center gap-1.5 px-4 py-2.5 bg-white/5 rounded-xl text-yellow-500 hover:bg-white/10 transition-all active:scale-95 shadow-sm border border-white/5 shrink-0 group"
                      >
                        <Copy size={14} className="group-active:scale-110 transition-transform" />
                        <span className="text-[10px] font-black uppercase">COPY</span>
                      </button>
                    </div>
                    
                    <div className="flex items-center justify-between gap-3">
                       <button onClick={() => shareToSocial('whatsapp')} className="flex-1 bg-[#25D366]/10 border border-[#25D366]/20 text-[#25D366] p-4 rounded-2xl flex items-center justify-center shadow-lg active:scale-95 transition-all">
                         <MessageCircle size={22} />
                       </button>
                       <button onClick={() => shareToSocial('telegram')} className="flex-1 bg-[#0088cc]/10 border border-[#0088cc]/20 text-[#0088cc] p-4 rounded-2xl flex items-center justify-center shadow-lg active:scale-95 transition-all">
                         <Send size={22} />
                       </button>
                       <button onClick={() => shareToSocial('facebook')} className="flex-1 bg-[#1877F2]/10 border border-[#1877F2]/20 text-[#1877F2] p-4 rounded-2xl flex items-center justify-center shadow-lg active:scale-95 transition-all">
                         <Facebook size={22} />
                       </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-6">
                  <div className="bg-gradient-to-br from-yellow-500 to-orange-600 rounded-[24px] p-5 text-black shadow-xl">
                    <div className="flex items-center gap-2 mb-1 opacity-70">
                       <TrendingUp size={14} />
                       <p className="text-[10px] font-black uppercase tracking-wider">Today Earnings</p>
                    </div>
                    <p className="text-2xl font-black italic tracking-tighter">৳ 0.00</p>
                  </div>
                  <div className="bg-white/5 border border-white/5 rounded-[24px] p-5 text-white shadow-xl">
                    <div className="flex items-center gap-2 mb-1 opacity-50">
                       <Users size={14} />
                       <p className="text-[10px] font-black uppercase tracking-wider">Registers</p>
                    </div>
                    <p className="text-2xl font-black text-white italic tracking-tighter">{stats.registers}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Commission details */}
            <div className="bg-[#1c1d29] rounded-[32px] p-6 shadow-2xl border border-white/5">
               <h3 className="text-white font-black italic text-lg mb-6 flex items-center gap-3">
                 <Target size={20} className="text-yellow-500" />
                 REWARD SYSTEM
               </h3>
               
               <div className="space-y-4">
                 <div className="bg-white/5 rounded-2xl p-5 border border-white/5 flex items-center justify-between group hover:bg-yellow-500/5 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-yellow-500/10 text-yellow-500 flex items-center justify-center font-black text-sm border border-yellow-500/20">01</div>
                      <p className="text-xs font-bold text-gray-300">Invite Friends Bonus</p>
                    </div>
                    <span className="text-base font-black text-yellow-500 italic">৳ ৪০০</span>
                 </div>
                 <div className="bg-white/5 rounded-2xl p-5 border border-white/5 flex items-center justify-between group hover:bg-yellow-500/5 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center font-black text-sm border border-blue-500/20">02</div>
                      <p className="text-xs font-bold text-gray-300">Betting Rebate</p>
                    </div>
                    <span className="text-base font-black text-blue-400 italic">০.৮৮%</span>
                 </div>
               </div>
            </div>

            {/* Rules Section (Minified) */}
            <div className="bg-[#1c1d29] rounded-[32px] p-6 shadow-2xl border border-white/5 mb-10">
               <h3 className="text-white font-black italic text-lg mb-6 flex items-center gap-3">
                 <Shield size={20} className="text-yellow-500" />
                 নীতিমালা (TERMS)
               </h3>
               <div className="space-y-4 px-1">
                 {[
                   "আমন্ত্রিত বন্ধু নিবন্ধন করলে কোনো সাইনআপ বোনাস পাবেন না।",
                   "আপনার বন্ধু অন্তত ২০০ টাকা ডিপোজিট এবং ১২০০ টাকা বেটিং সম্পূর্ণ করলে আপনি ৪০০ টাকা বোনাস পাবেন।",
                   "একই আইপি বা ডিভাইস থেকে একাধিক অ্যাকাউন্ট খোলার চেষ্টা করবেন না।",
                   "প্রতারণা প্রমাণিত হলে অ্যাকাউন্ট এবং রেফারেল বোনাস বাতিল করা হবে।"
                 ].map((rule, idx) => (
                   <div key={idx} className="flex gap-4 items-start">
                     <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-yellow-500 shrink-0 shadow-[0_0_8px_rgba(234,179,8,0.8)]"></div>
                     <p className="text-[11px] text-gray-400 font-bold leading-relaxed">{rule}</p>
                   </div>
                 ))}
               </div>
            </div>
          </div>
        )}

        {activeTab === 'rewards' && (
          <div className="p-4 space-y-3 animate-in fade-in duration-500">
            <div className="bg-indigo-600/10 border border-indigo-500/20 rounded-2xl p-4 mb-4">
              <h4 className="text-indigo-900 font-black text-xs uppercase mb-2">বোনাস পাওয়ার শর্ত:</h4>
              <p className="text-[10px] text-gray-500 font-bold leading-relaxed">
                আপনার আমন্ত্রিত বন্ধুকে অবশ্যই <span className="text-indigo-600 italic">কমপক্ষে ২০০ টাকা ডিপোজিট</span> এবং <span className="text-indigo-600 italic">১২০০ টাকা বেটিং (Turnover)</span> সম্পূর্ণ করতে হবে। এই শর্ত পূরণ হলে আপনি প্রতি বন্ধুর জন্য <span className="text-emerald-600 font-black">৪০০ টাকা</span> বোনাস সরাসরি আপনার মেইন ব্যালেন্সে পাবেন।
              </p>
            </div>
            
            <div className="text-right text-[10px] text-gray-400 mb-2 font-bold uppercase tracking-widest">মাইলস্টোন বোনাস তালিকা</div>
            {[
              { count: 5, reward: '399.00', icon: Award, color: 'text-orange-400' },
              { count: 20, reward: '1,699.00', icon: Award, color: 'text-green-400' },
              { count: 50, reward: '3,999.00', icon: Award, color: 'text-blue-400' },
              { count: 100, reward: '9,999.00', icon: Award, color: 'text-purple-400' },
              { count: 200, reward: '16,999.00', icon: Star, color: 'text-teal-400' },
              { count: 500, reward: '49,999.00', icon: Star, color: 'text-yellow-400' },
              { count: 1000, reward: '99,999.00', icon: Crown, color: 'text-yellow-500' }
            ].map((tier, i) => (
              <div key={i} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center gap-4">
                <div className={`w-14 h-14 rounded-full bg-gray-50 flex items-center justify-center ${tier.color}`}>
                  <tier.icon size={32} />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-medium text-gray-500">Over {tier.count} valid referral in total.</p>
                  <p className="text-lg font-black text-gray-700 flex items-center gap-1">
                    <Coins size={14} className="text-gray-400" />
                    {tier.reward}
                  </p>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <span className="text-[10px] font-bold text-indigo-900">
                    {userData?.validReferralCount || 0} <span className="text-gray-400">/ {tier.count}</span>
                  </span>
                  <button 
                    onClick={() => handleClaimReward(tier, i)}
                    disabled={isClaiming !== null || (userData?.claimedRewards || []).includes(tier.count)}
                    className={`text-[10px] font-bold px-3 py-1 rounded shadow-sm transition-all ${
                      (userData?.claimedRewards || []).includes(tier.count)
                        ? 'bg-gray-400 text-white cursor-not-allowed'
                        : (userData?.validReferralCount || 0) >= tier.count
                          ? 'bg-green-500 text-white hover:bg-green-600 active:scale-95'
                          : 'bg-blue-200 text-white cursor-not-allowed'
                    }`}
                  >
                    {isClaiming === i ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (userData?.claimedRewards || []).includes(tier.count) ? (
                      'Claimed'
                    ) : (userData?.validReferralCount || 0) >= tier.count ? (
                      'Claim'
                    ) : (
                      'Available'
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'invited' && (
          <div className="p-4 space-y-4 animate-in fade-in duration-500 h-full flex flex-col">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-indigo-50 rounded-[28px] p-5 border border-indigo-100 flex items-center gap-4">
                <div className="w-12 h-12 rounded-[20px] bg-indigo-600 flex items-center justify-center text-white shadow-lg">
                  <User size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest leading-none mb-1">Registers</p>
                  <p className="text-2xl font-black text-indigo-900 italic leading-none">{stats.registers}</p>
                </div>
              </div>
              <div className="bg-green-50 rounded-[28px] p-5 border border-green-100 flex items-center gap-4">
                <div className="w-12 h-12 rounded-[20px] bg-green-600 flex items-center justify-center text-white shadow-lg">
                  <Users size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-green-400 uppercase tracking-widest leading-none mb-1">Valid</p>
                  <p className="text-2xl font-black text-green-900 italic leading-none">{stats.validReferrals}</p>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar min-h-0 bg-white rounded-[32px] p-4 shadow-sm border border-gray-100 mb-6">
              <div className="flex items-center justify-between mb-4 px-2">
                <h3 className="text-sm font-black text-indigo-950 uppercase tracking-widest">রেফারেল তালিকা</h3>
                <span className="text-[10px] font-bold text-gray-400 uppercase">{referralsList.length} জন</span>
              </div>

              {isLoading ? (
                <div className="h-64 flex flex-col items-center justify-center gap-4">
                  <div className="w-10 h-10 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                  <p className="text-[10px] font-black text-indigo-900 uppercase tracking-widest">Loading...</p>
                </div>
              ) : referralsList.length > 0 ? (
                <div className="space-y-3">
                  {referralsList.map((ref, idx) => {
                    const isExpanded = expandedRef === ref.id;
                    const isValid = (ref.totalDeposits || 0) > 0;
                    
                    return (
                      <motion.div 
                        key={ref.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className={`overflow-hidden transition-all duration-300 rounded-[24px] border ${
                          isExpanded ? 'bg-indigo-50/50 border-indigo-200' : 'bg-white border-gray-100 hover:border-gray-200'
                        }`}
                      >
                        <div 
                          className="p-4 flex items-center justify-between cursor-pointer"
                          onClick={() => setExpandedRef(isExpanded ? null : ref.id)}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-[14px] flex items-center justify-center transition-colors shadow-sm ${
                              isExpanded ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-400'
                            }`}>
                              <User size={18} />
                            </div>
                            <div className="min-w-0">
                              <p className="font-black text-indigo-900 text-sm truncate">
                                {ref.username ? `${ref.username.substring(0, 3)}***${ref.username.slice(-3)}` : 'Anonymous'}
                              </p>
                              <div className="flex items-center gap-1.5 opacity-60">
                                <Clock size={10} className="text-gray-400" />
                                <p className="text-[9px] text-gray-500 font-bold uppercase tracking-tighter">
                                  {ref.createdAt ? (typeof ref.createdAt === 'string' ? new Date(ref.createdAt).toLocaleDateString() : new Date(ref.createdAt.seconds * 1000).toLocaleDateString()) : 'N/A'}
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <div className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border transition-all ${
                              isValid ? 'bg-green-50 text-green-600 border-green-200' : 'bg-orange-50 text-orange-600 border-orange-100'
                            }`}>
                              {isValid ? 'Valid' : 'Pending'}
                            </div>
                            <ChevronDown size={14} className={`text-gray-300 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                          </div>
                        </div>

                        {isExpanded && (
                          <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            className="px-4 pb-4 border-t border-indigo-100/50 pt-3"
                          >
                            <div className="grid grid-cols-2 gap-2 mb-4">
                              <div className="bg-white/50 p-2.5 rounded-2xl border border-indigo-100/50">
                                <p className="text-[8px] font-black text-gray-400 uppercase mb-1">মোট ডিপোজিট</p>
                                <p className="text-xs font-black text-indigo-900 tracking-tight">৳ {(ref.totalDeposits || 0).toLocaleString()}</p>
                              </div>
                              <div className="bg-white/50 p-2.5 rounded-2xl border border-indigo-100/50">
                                <p className="text-[8px] font-black text-gray-400 uppercase mb-1">মোট বেট</p>
                                <p className="text-xs font-black text-indigo-900 tracking-tight">৳ {(ref.totalBets || 0).toLocaleString()}</p>
                              </div>
                              <div className="bg-white/50 p-2.5 rounded-2xl border border-indigo-100/50">
                                <p className="text-[8px] font-black text-gray-400 uppercase mb-1">মোট উইনিং (Earnings)</p>
                                <p className="text-xs font-black text-green-600 tracking-tight">৳ {(ref.totalWinnings || 0).toLocaleString()}</p>
                              </div>
                              <div className="bg-indigo-600/5 p-2.5 rounded-2xl border border-indigo-100/50 ring-1 ring-inset ring-indigo-500/10">
                                <p className="text-[8px] font-black text-indigo-500 uppercase mb-1">আপনার কমিশন</p>
                                <p className="text-xs font-black text-indigo-600 tracking-tight">৳ {(ref.commissionFromUser || 0).toLocaleString()}</p>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2 text-[9px] font-bold text-gray-400 uppercase tracking-widest px-1">
                              <Zap size={10} className="text-yellow-500" />
                              <span>সর্বশেষ অ্যাক্টিভিটি: {ref.lastReferralActivity ? new Date(ref.lastReferralActivity).toLocaleDateString() : (ref.updatedAt ? (typeof ref.updatedAt === 'string' ? new Date(ref.updatedAt).toLocaleDateString() : new Date(ref.updatedAt.seconds * 1000).toLocaleDateString()) : 'No Data')}</span>
                            </div>
                          </motion.div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <EmptyState />
              )}
            </div>
          </div>
        )}
      </div>

      <ShareModal 
        isOpen={isShareModalOpen} 
        onClose={() => setIsShareModalOpen(false)} 
        showToast={showToast}
        title={`${displayCasinoName} - Join & Play!`}
        text={`Join ${displayCasinoName} and get a ৳507 welcome bonus! Use my referral link: ${referralLink}`}
        url={referralLink}
      />
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
      <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4 border border-white/5 shadow-xl">
        <Users size={32} className="text-gray-600" />
      </div>
      <p className="text-sm font-black text-gray-400 mb-1">কোন ডাটা পাওয়া যায়নি</p>
      <p className="text-[10px] font-bold text-gray-500 max-w-[200px]">বন্ধুদের আমন্ত্রণ জানান এবং আপনার টিম তৈরি করুন।</p>
    </div>
  );
}
