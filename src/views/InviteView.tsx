import React, { useState, useEffect } from "react";
import { QRCodeSVG } from 'qrcode.react';
import { motion } from 'motion/react';
import { db } from "../services/firebase";
import { collection, query, where, getDocs, orderBy, limit } from "firebase/firestore";
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
import { ToastType } from '../components/ui/Toast';

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
  const [activeTab, setActiveTab] = useState(initialSubTab);
  const [incomeCalculatorValue, setIncomeCalculatorValue] = useState(1);
  const [referralsList, setReferralsList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  
  useEffect(() => {
    if (userData?.id) {
      const fetchReferrals = async () => {
        setIsLoading(true);
        try {
          const q = query(
            collection(db, 'users'), 
            where('referredBy', '==', userData.id),
            orderBy('createdAt', 'desc')
          );
          const querySnapshot = await getDocs(q);
          const list = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setReferralsList(list);
          
          // Calculate stats locally for extra accuracy
          const valid = list.filter((u: any) => (u.deposits || 0) > 0).length;
          setStats({
            registers: list.length,
            validReferrals: valid,
            totalEarnings: userData.totalReferralEarnings || 0
          });
        } catch (error) {
          console.error("Error fetching referrals:", error);
        } finally {
          setIsLoading(false);
        }
      };
      
      fetchReferrals();
    }
  }, [userData?.id, userData?.totalReferralEarnings]);

  const [stats, setStats] = useState({
    registers: userData?.referralCount || 0,
    validReferrals: userData?.validReferralCount || 0,
    totalEarnings: userData?.totalReferralEarnings || 0
  });
  
  const referralCode = userData?.referralCode || (userData?.id ? userData.id.substring(0, 6).toUpperCase() : 'BETAIG');
  const referralLink = `${window.location.origin}/?ref=${referralCode}`;
  const displayCasinoName = casinoName || "SPIN71.bet";

  const [isClaiming, setIsClaiming] = useState<number | null>(null);

  const handleClaimReward = async (tier: any, index: number) => {
    if (!userData?.id || !onUpdateUser || !onAddTransaction) return;
    
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
    { id: 'overview', name: 'ওভারভিউ', icon: Home },
    { id: 'rewards', name: 'পুরস্কার', icon: Award },
    { id: 'incomes', name: 'আয়', icon: DollarSign },
    { id: 'records', name: 'রেকর্ড', icon: History },
    { id: 'invited', name: 'আমন্ত্রিত তালিকা', icon: Users }
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
    <div className="flex-1 flex flex-col h-full bg-[#f4f7f9]">
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
      <div className="bg-white border-b border-gray-100 sticky top-[60px] z-20 shadow-sm">
        <div className="flex overflow-x-auto no-scrollbar">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 min-w-[90px] py-3 flex flex-col items-center gap-1 transition-all relative ${
                activeTab === tab.id ? 'text-indigo-600 scale-105' : 'text-gray-400'
              }`}
            >
              <tab.icon size={18} className={activeTab === tab.id ? 'animate-pulse' : ''} />
              <span className="text-[10px] font-black uppercase tracking-tighter">{tab.name}</span>
              {activeTab === tab.id && (
                <motion.div 
                  layoutId="activeInviteTab"
                  className="absolute bottom-0 left-2 right-2 h-1 bg-indigo-600 rounded-t-full" 
                />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-24">
        {activeTab === 'overview' && (
          <div className="p-4 space-y-4 animate-in fade-in duration-500">
            {/* Share Section */}
            <div className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full blur-3xl -mr-16 -mt-16"></div>
              <div className="relative z-10">
                <p className="text-[10px] font-black text-indigo-900 uppercase tracking-[0.2em] mb-4">বন্ধুদের সাথে শেয়ার করুন</p>
                
                <div className="flex gap-4 items-center mb-6">
                  <div className="relative group cursor-pointer" onClick={downloadQRCode}>
                    <div className="w-20 h-20 bg-white border-2 border-indigo-100 p-1.5 rounded-[24px] flex items-center justify-center relative shadow-sm group-hover:border-indigo-500 transition-all duration-300">
                      <QRCodeSVG 
                        id="referral-qr"
                        value={referralLink} 
                        size={64} 
                        level="H"
                        includeMargin={false}
                      />
                      <div className="absolute inset-0 bg-indigo-600/10 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-[24px]">
                        <Download size={20} className="text-indigo-600" />
                      </div>
                    </div>
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap bg-indigo-900 text-white text-[8px] font-black px-2 py-0.5 rounded-full shadow-sm">Save QR</div>
                  </div>

                  <div className="flex-1 space-y-4">
                    <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 group focus-within:border-indigo-300 transition-all">
                      <span className="text-[11px] font-bold text-gray-500 truncate flex-1">{referralLink}</span>
                      <button 
                        onClick={() => copyToClipboard(referralLink, "লিঙ্ক কপি করা হয়েছে!")}
                        className="p-2 bg-indigo-600 rounded-xl text-white hover:bg-indigo-700 transition-all active:scale-90 shadow-md"
                      >
                        <Copy size={14} />
                      </button>
                    </div>
                    
                    <div className="flex items-center justify-between gap-2">
                       <button onClick={() => shareToSocial('whatsapp')} className="flex-1 bg-[#25D366] text-white p-3 rounded-2xl flex items-center justify-center shadow-lg shadow-green-500/20 active:scale-95 transition-all">
                         <MessageCircle size={20} />
                       </button>
                       <button onClick={() => shareToSocial('telegram')} className="flex-1 bg-[#0088cc] text-white p-3 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20 active:scale-95 transition-all">
                         <Send size={20} />
                       </button>
                       <button onClick={() => shareToSocial('facebook')} className="flex-1 bg-[#1877F2] text-white p-3 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/20 active:scale-95 transition-all">
                         <Facebook size={20} />
                       </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-[24px] p-4 text-white shadow-lg shadow-indigo-500/20">
                    <div className="flex items-center gap-2 mb-1 opacity-80">
                       <TrendingUp size={12} />
                       <p className="text-[10px] font-bold uppercase tracking-wider">Today's Income</p>
                    </div>
                    <p className="text-xl font-black italic">৳ 0.00</p>
                  </div>
                  <div className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-[24px] p-4 text-white shadow-lg shadow-purple-500/20">
                    <div className="flex items-center gap-2 mb-1 opacity-80">
                       <Clock size={12} />
                       <p className="text-[10px] font-bold uppercase tracking-wider">Yesterday's</p>
                    </div>
                    <p className="text-xl font-black italic">৳ 0.00</p>
                  </div>
                  <div className="bg-white border border-gray-100 rounded-[24px] p-4 shadow-sm">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">Registers</p>
                    <p className="text-xl font-black text-indigo-900 italic">{stats.registers}</p>
                  </div>
                  <div className="bg-white border border-gray-100 rounded-[24px] p-4 shadow-sm">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">Valid Users</p>
                    <p className="text-xl font-black text-green-600 italic">{stats.validReferrals}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Commission details */}
            <div className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100">
               <h3 className="text-indigo-900 font-black italic text-lg mb-4 flex items-center gap-2">
                 <Target size={20} className="text-yellow-500" />
                 রেফারেল কমিশন সিস্টেম
               </h3>
               
               <div className="space-y-3">
                 <div className="bg-green-50 rounded-2xl p-4 border border-green-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center font-bold text-xs">1</div>
                      <p className="text-[11px] font-bold text-green-800">প্রথম ডিপোজিট বোনাস</p>
                    </div>
                    <span className="text-sm font-black text-green-900 italic">৳ ৩০৮</span>
                 </div>
                 <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-xs">2</div>
                      <p className="text-[11px] font-bold text-blue-800">বেটিং টার্নওভার কমিশন</p>
                    </div>
                    <span className="text-sm font-black text-blue-900 italic">০.৮৮%</span>
                 </div>
                 <div className="bg-purple-50 rounded-2xl p-4 border border-purple-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-purple-500 text-white flex items-center justify-center font-bold text-xs">3</div>
                      <p className="text-[11px] font-bold text-purple-800">৩-স্তরের নেটওয়ার্ক কমিশন</p>
                    </div>
                    <span className="text-sm font-black text-purple-900 italic">১০% পর্যন্ত</span>
                 </div>
               </div>
            </div>

            {/* Rules Section */}
            <div className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100 mb-10">
               <h3 className="text-gray-900 font-black italic text-lg mb-4 flex items-center gap-2 underline decoration-yellow-400 decoration-4 underline-offset-4">
                 <Shield size={20} className="text-indigo-600" />
                 আমন্ত্রণ নিয়মাবলী (Invite Rules)
               </h3>
               
               <div className="space-y-4">
                 {[
                   "আপনার আমন্ত্রিত বন্ধুকে অবশ্যই তার প্রোফাইল ভেরিফাই করতে হবে।",
                   "আপনার বন্ধু প্রথম ২,০০০ টাকা ডিপোজিট করলে আপনি ভ্যালিড রেফারেল হিসেবে গণ্য হবেন।",
                   "একই আইপি (IP) বা ডিভাইস থেকে একাধিক অ্যাকাউন্ট খোলা নিষিদ্ধ।",
                   "যেকোনো প্রতারণামূলক কাজের জন্য আপনার অ্যাকাউন্ট এবং ব্যালেন্স বাজেয়াপ্ত হতে পারে।",
                   "কোম্পানি যেকোনো সময় এই প্রচারের নিয়মাবলী পরিবর্তনের অধিকার রাখে।"
                 ].map((rule, idx) => (
                   <div key={idx} className="flex gap-3 items-start">
                     <div className="mt-1 w-1.5 h-1.5 rounded-full bg-indigo-600 shrink-0"></div>
                     <p className="text-xs text-gray-600 font-medium leading-relaxed">{rule}</p>
                   </div>
                 ))}
               </div>
            </div>

              {/* Hierarchy Diagram */}
              <div className="py-8 flex flex-col items-center bg-indigo-50/50 rounded-[30px] border border-indigo-100">
                <div className="flex flex-col items-center relative mb-12">
                  <div className="w-16 h-16 rounded-[24px] bg-indigo-600 border-4 border-white shadow-xl flex items-center justify-center mb-2 z-10 relative">
                    <User size={32} className="text-white" />
                    <div className="absolute -top-2 -right-2 bg-yellow-400 text-black text-[8px] font-black px-2 py-0.5 rounded-full border-2 border-white shadow-sm">ADMIN</div>
                  </div>
                  <p className="text-[11px] font-black text-indigo-900 uppercase tracking-widest">আপনি (You)</p>
                  
                  {/* Connecting lines from you to level 1 */}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 w-[220px] h-10 border-x-2 border-t-2 border-indigo-200 rounded-t-3xl mt-2"></div>
                </div>
                
                <div className="flex justify-between w-full max-w-[320px] relative px-4">
                  {/* Level 1 Nodes */}
                  <div className="flex flex-col items-center relative group">
                    <div className="w-12 h-12 rounded-[18px] bg-white border-2 border-blue-400 shadow-md flex items-center justify-center mb-2 z-10 hover:scale-110 transition-transform">
                      <Users size={20} className="text-blue-500" />
                    </div>
                    <p className="text-[9px] font-black text-blue-600 uppercase">স্তর ১ (L1)</p>
                    
                    {/* Level 2 connection line */}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 w-[80px] h-8 border-x-2 border-t-2 border-blue-100 rounded-t-2xl mt-4"></div>
                    
                    <div className="flex justify-around w-full mt-10 gap-4">
                      {/* Level 2 Nodes */}
                      <div className="flex flex-col items-center">
                        <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200 shadow-sm flex items-center justify-center mb-1">
                          <User size={14} className="text-blue-300" />
                        </div>
                        <p className="text-[7px] font-bold text-gray-400">L2</p>
                      </div>
                      <div className="flex flex-col items-center">
                        <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200 shadow-sm flex items-center justify-center mb-1">
                          <User size={14} className="text-blue-300" />
                        </div>
                        <p className="text-[7px] font-bold text-gray-400">L2</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-center relative group">
                    <div className="w-12 h-12 rounded-[18px] bg-white border-2 border-purple-400 shadow-md flex items-center justify-center mb-2 z-10 hover:scale-110 transition-transform">
                      <Users size={20} className="text-purple-500" />
                    </div>
                    <p className="text-[9px] font-black text-purple-600 uppercase">স্তর ১ (L1)</p>
                    
                    {/* Level 2 connection line (Deep) */}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 w-[80px] h-8 border-x-2 border-t-2 border-purple-100 rounded-t-2xl mt-4"></div>
                    
                    <div className="flex justify-around w-full mt-10 gap-4">
                      {/* Level 2 Nodes showing Level 3 below one */}
                      <div className="flex flex-col items-center relative">
                        <div className="w-8 h-8 rounded-xl bg-purple-50 border border-purple-200 shadow-sm flex items-center justify-center mb-1">
                          <User size={14} className="text-purple-300" />
                        </div>
                        <p className="text-[7px] font-bold text-gray-400">L2</p>
                        
                        {/* Level 3 tiny indicator */}
                        <div className="w-px h-6 bg-purple-100 mt-1"></div>
                        <div className="w-6 h-6 rounded-lg bg-green-50 border border-green-200 flex items-center justify-center shadow-sm">
                          <User size={10} className="text-green-300" />
                        </div>
                        <p className="text-[6px] font-black text-green-500 uppercase mt-0.5">L3</p>
                      </div>
                      <div className="flex flex-col items-center">
                        <div className="w-8 h-8 rounded-xl bg-purple-50 border border-purple-200 shadow-sm flex items-center justify-center mb-1">
                          <User size={14} className="text-purple-300" />
                        </div>
                        <p className="text-[7px] font-bold text-gray-400">L2</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-purple-100 rounded-lg p-2 flex items-center gap-3 border border-purple-200">
                <div className="bg-blue-500 text-white w-6 h-6 rounded flex items-center justify-center font-bold text-xs">4</div>
                <p className="text-indigo-900 font-bold text-sm">অর্জন বোনাস <span className="text-yellow-600">৳১৯,৯৯৯,৯৯৯</span></p>
              </div>
            

            {/* Leaderboard */}
            <div className="space-y-4">
              <h3 className="text-center font-bold text-indigo-900 text-2xl">Leaderboard</h3>
              <div className="bg-gradient-to-b from-blue-400 to-purple-600 rounded-2xl p-4 shadow-lg overflow-hidden relative">
                <h4 className="text-white font-bold text-center mb-4 relative z-10 pb-2 border-b border-white/10">Who received the rewards</h4>
                <div className="relative h-[200px] overflow-hidden" style={{ maskImage: 'linear-gradient(to bottom, transparent, black 10%, black 90%, transparent)', WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 10%, black 90%, transparent)' }}>
                  <motion.div 
                    initial={{ y: 0 }}
                    animate={{ y: "-50%" }}
                    transition={{ 
                      duration: 15, 
                      repeat: Infinity, 
                      ease: "linear" 
                    }}
                    className="flex flex-col gap-2 pt-2"
                  >
                    {[
                      { name: 'ro******1', amount: '৳ 308.00' },
                      { name: 'md**********0', amount: '৳ 507.00' },
                      { name: 'mi******6', amount: '৳ 1,000.00' },
                      { name: '18*******2', amount: '৳ 2,500.00' },
                      { name: 'ab******4', amount: '৳ 1,500.00' },
                      { name: 'sh******9', amount: '৳ 2,100.00' },
                      { name: 'ka******7', amount: '৳ 5,500.00' },
                      { name: 'ta******3', amount: '৳ 10,000.00' },
                      // duplicate for seamless loop
                      { name: 'ro******1', amount: '৳ 308.00' },
                      { name: 'md**********0', amount: '৳ 507.00' },
                      { name: 'mi******6', amount: '৳ 1,000.00' },
                      { name: '18*******2', amount: '৳ 2,500.00' },
                      { name: 'ab******4', amount: '৳ 1,500.00' },
                      { name: 'sh******9', amount: '৳ 2,100.00' },
                      { name: 'ka******7', amount: '৳ 5,500.00' },
                      { name: 'ta******3', amount: '৳ 10,000.00' }
                    ].map((item, i) => (
                      <div key={i} className="bg-white/90 rounded-full px-4 py-2 flex justify-between items-center text-xs font-bold text-gray-700 mx-1 shrink-0">
                        <span className="w-1/3 truncate">{item.name}</span>
                        <span className="w-1/3 text-center text-gray-400">Received</span>
                        <span className="w-1/3 text-right text-indigo-900">{item.amount}</span>
                      </div>
                    ))}
                  </motion.div>
                </div>
              </div>
            </div>

            {/* Income Calculator */}
            <div className="bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl p-6 shadow-lg text-white">
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 bg-yellow-400 rounded-xl flex items-center justify-center shadow-lg">
                  <MailIcon size={40} className="text-white" />
                </div>
                <h3 className="text-2xl font-black">Income calculator</h3>
                <p className="text-3xl font-black text-yellow-300">৳ {(incomeCalculatorValue * 8000).toLocaleString()}.00</p>
                <p className="text-[10px] font-bold opacity-80">Invite <span className="text-yellow-300">{incomeCalculatorValue}</span> active users, expected revenue</p>
                <input 
                  type="range" 
                  min="1" 
                  max="100" 
                  value={incomeCalculatorValue} 
                  onChange={(e) => setIncomeCalculatorValue(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-white/30 rounded-lg appearance-none cursor-pointer accent-teal-400"
                />
              </div>
            </div>

            <div className="text-center py-4">
              <h3 className="text-indigo-900 font-black text-2xl">এজেন্ট ৪ সুপার কমিশন</h3>
              <div className="mt-4 bg-gray-100 rounded-xl p-4 border border-gray-200">
                <p className="text-indigo-900 font-bold">{displayCasinoName} এর এজেন্ট হন এখনই</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'rewards' && (
          <div className="p-4 space-y-3 animate-in fade-in duration-500">
            <div className="text-right text-[10px] text-gray-400 mb-2">no expiration</div>
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

        {activeTab === 'incomes' && (
          <div className="p-4 space-y-4 animate-in fade-in duration-500">
            <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100 text-center space-y-6 relative overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500"></div>
              
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">সর্বমোট আয় (Total Earnings)</p>
                <p className="text-4xl font-black text-indigo-900 italic">৳ {stats.totalEarnings.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
              </div>

              <div className="grid grid-cols-1 gap-3 py-4">
                <IncomeItem label="আমন্ত্রণ পুরস্কার (Invite Bonus)" value="৳ 0.00" icon={Gift} color="bg-orange-100 text-orange-600" />
                <IncomeItem label="অর্জন পুরস্কার (Achievement)" value="৳ 0.00" icon={Award} color="bg-blue-100 text-blue-600" />
                <IncomeItem label="ডিপোজিট রিবেট (Deposit Rebate)" value={`৳ ${stats.totalEarnings.toLocaleString()}`} icon={DollarSign} color="bg-green-100 text-green-600" />
                <IncomeItem label="বেটিং রিবেট (Betting Rebate)" value="৳ 0.00" icon={Activity} color="bg-purple-100 text-purple-600" />
              </div>

              <div className="pt-6 border-t border-gray-50 grid grid-cols-3 gap-2">
                <div>
                   <p className="text-[9px] font-bold text-gray-400 uppercase">নিবন্ধন</p>
                   <p className="text-sm font-black text-indigo-900">{stats.registers}</p>
                </div>
                <div>
                   <p className="text-[9px] font-bold text-gray-400 uppercase">সঠিক রেফার</p>
                   <p className="text-sm font-black text-indigo-900">{stats.validReferrals}</p>
                </div>
                <div>
                   <p className="text-[9px] font-bold text-gray-400 uppercase">ডিপোজিটর</p>
                   <p className="text-sm font-black text-indigo-900">{stats.validReferrals}</p>
                </div>
              </div>
            </div>

            <div className="bg-indigo-900 rounded-[32px] p-6 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                <Info size={120} />
              </div>
              <h4 className="text-lg font-black italic mb-2">কিভাবে আরও আয় করবেন?</h4>
              <p className="text-xs text-indigo-200 leading-relaxed mb-4">
                আপনার বন্ধুদের আমন্ত্রন জানান এবং তারা গেম খেললে আপনি লাইফটাইম কমিশন পাবেন। যত বেশি বন্ধু, তত বেশি আয়!
              </p>
              <button 
                onClick={() => setActiveTab('overview')}
                className="bg-white text-indigo-900 px-6 py-2 rounded-xl font-bold text-xs uppercase tracking-widest active:scale-95 transition-all"
              >
                এখনই শেয়ার করুন
              </button>
            </div>

            <p className="text-center text-[10px] text-gray-400 font-medium">সিস্টেম প্রতি ১৫ মিনিট পর পর ডাটা আপডেট করে।</p>
          </div>
        )}

        {activeTab === 'records' && (
          <div className="p-4 space-y-4 animate-in fade-in duration-500 h-full flex flex-col">
            <div className="flex gap-2">
              <div className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2 flex items-center justify-between text-xs text-blue-500 font-medium">
                Invitation Rewards
                <ChevronDown size={14} />
              </div>
              <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 flex items-center gap-2 text-xs text-blue-500 font-medium">
                <Calendar size={14} />
                04/13- 04/13
              </div>
            </div>

            <div className="bg-gray-100 rounded p-2 flex text-[10px] font-bold text-gray-500">
              <span className="w-1/3 text-center">Registration date</span>
              <span className="w-1/3 text-center">Username</span>
              <span className="w-1/3 text-center">Amount</span>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center">
              <EmptyState />
            </div>

            <div className="bg-white border-t border-gray-200 p-4 flex justify-between items-center text-sm font-bold text-gray-700">
              <span>Total</span>
              <span>0.00</span>
            </div>
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

            <div className="flex gap-2">
              <button className="flex-1 bg-white border border-gray-100 rounded-2xl px-4 py-3 flex items-center justify-between text-xs font-bold text-gray-600 shadow-sm active:scale-95 transition-all">
                All Type
                <ChevronDown size={14} className="text-gray-400" />
              </button>
              <button className="bg-indigo-600 rounded-2xl px-6 py-3 flex items-center gap-2 text-xs font-bold text-white shadow-lg shadow-indigo-200 active:scale-95 transition-all">
                Today
              </button>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar min-h-0">
              {isLoading ? (
                <div className="h-64 flex flex-col items-center justify-center gap-4">
                  <div className="w-10 h-10 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                  <p className="text-[10px] font-black text-indigo-900 uppercase tracking-widest">Loading...</p>
                </div>
              ) : referralsList.length > 0 ? (
                <div className="space-y-3 py-2">
                  {referralsList.map((ref, idx) => (
                    <motion.div 
                      key={idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="bg-white p-4 rounded-[28px] border border-gray-50 shadow-sm flex justify-between items-center group hover:border-indigo-100 transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-[18px] bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                          <User size={20} />
                        </div>
                        <div className="min-w-0">
                          <p className="font-black text-indigo-900 text-sm truncate w-24">
                            {ref.username ? `${ref.username.substring(0, 3)}***${ref.username.slice(-2)}` : 'Anonymous'}
                          </p>
                          <div className="flex items-center gap-1.5">
                             <Clock size={10} className="text-gray-300" />
                             <p className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter">
                               {ref.createdAt ? (typeof ref.createdAt === 'string' ? new Date(ref.createdAt).toLocaleDateString() : new Date(ref.createdAt.seconds * 1000).toLocaleDateString()) : 'N/A'}
                             </p>
                          </div>
                        </div>
                      </div>
                      <div className="text-right whitespace-nowrap">
                        <div className="bg-gray-50 px-3 py-1 rounded-full mb-1 group-hover:bg-indigo-50 transition-colors">
                           <p className="text-[10px] font-black text-indigo-900 italic">৳ {ref.totalWinnings || '0'}</p>
                        </div>
                        <p className={`text-[8px] font-black uppercase tracking-[0.1em] ${(ref.totalDeposits || 0) > 0 ? 'text-green-500' : 'text-gray-300'}`}>
                           {(ref.totalDeposits || 0) > 0 ? 'VALID' : 'PENDING'}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <EmptyState />
                </div>
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

function IncomeItem({ 
  label, 
  value, 
  icon: Icon, 
  color 
}: { 
  label: string, 
  value: string, 
  icon: any, 
  color: string 
}) {
  return (
    <div className="flex justify-between items-center bg-gray-50/50 p-4 rounded-2xl border border-gray-100 group hover:border-indigo-200 transition-all">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-xl ${color}`}>
          <Icon size={18} />
        </div>
        <span className="text-[11px] font-bold text-gray-500 whitespace-nowrap">{label}</span>
      </div>
      <span className="text-sm font-black text-indigo-900 italic tracking-tighter">{value}</span>
    </div>
  );
}

function XIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4l16 16M4 20L20 4" />
    </svg>
  );
}

function LineIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 10.304c0-5.23-5.39-9.456-12-9.456s-12 4.226-12 9.456c0 4.687 4.276 8.604 10.052 9.33l-.644 3.87c-.033.203.158.377.354.29l4.548-2.02c4.361-.533 7.69-3.414 7.69-6.47z" />
    </svg>
  );
}

function MailIcon({ size, className }: { size: number, className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  );
}
