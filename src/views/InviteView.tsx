import React, { useState, useEffect } from "react";
import { QRCodeSVG } from 'qrcode.react';
import { motion } from 'motion/react';
import { db } from "../services/firebase";
import { collection, query, where, getDocs, orderBy, limit } from "firebase/firestore";
import { 
  Copy, 
  HelpCircle, 
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
  Plane,
  Info,
  Download,
  Loader2
} from "lucide-react";
import { ToastType } from '../components/ui/Toast';

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
  
  useEffect(() => {
    if (userData?.id) {
      const fetchReferrals = async () => {
        setIsLoading(true);
        try {
          const q = query(
            collection(db, 'users'), 
            where('referredBy', '==', userData.id),
            limit(50)
          );
          const querySnapshot = await getDocs(q);
          const list = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setReferralsList(list);
        } catch (error) {
          console.error("Error fetching referrals:", error);
        } finally {
          setIsLoading(false);
        }
      };
      
      fetchReferrals();
    }
  }, [userData?.id]);
  
  const currentReferrals = userData?.referralCount || 0;
  const totalEarned = userData?.totalReferralEarnings || 0;
  const referralCode = userData?.referralCode || (userData?.id ? userData.id.substring(0, 6).toUpperCase() : 'BETAIG');
  const referralLink = `${window.location.origin}/?ref=${referralCode}`;
  const displayCasinoName = casinoName || "NAGAD BET";

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
    { id: 'overview', name: 'ওভারভিউ' },
    { id: 'rewards', name: 'পুরস্কার' },
    { id: 'incomes', name: 'আয়' },
    { id: 'records', name: 'রেকর্ড' },
    { id: 'invited', name: 'আমন্ত্রিত তালিকা' }
  ];

  const copyToClipboard = (text: string, msg: string) => {
    navigator.clipboard.writeText(text);
    showToast(msg, "success");
  };

  const shareReferral = (platform: string) => {
    const text = `Join ${displayCasinoName} and get a ৳507 welcome bonus! Use my referral link: ${referralLink}`;
    const url = encodeURIComponent(referralLink);
    const shareText = encodeURIComponent(text);

    let shareUrl = "";
    switch (platform) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${shareText}`;
        break;
      case 'telegram':
        shareUrl = `https://t.me/share/url?url=${url}&text=${shareText}`;
        break;
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${shareText}%20${url}`;
        break;
      default:
        if (navigator.share) {
          navigator.share({
            title: `${displayCasinoName} Referral`,
            text: text,
            url: referralLink,
          }).catch(console.error);
          return;
        }
    }
    if (shareUrl) window.open(shareUrl, '_blank');
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
      <div className="bg-white border-b border-gray-200 sticky top-[60px] z-20">
        <div className="flex overflow-x-auto no-scrollbar">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 min-w-[100px] py-4 text-sm font-medium transition-colors relative ${
                activeTab === tab.id ? 'text-blue-500' : 'text-gray-600'
              }`}
            >
              {tab.name}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-24">
        {activeTab === 'overview' && (
          <div className="p-4 space-y-4 animate-in fade-in duration-500">
            {/* Share Section */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <p className="text-xs font-bold text-indigo-900 mb-3">বন্ধুদের সাথে শেয়ার করুন (Share to friends)</p>
              <div className="flex gap-4 items-start mb-4">
                <div className="flex flex-col items-center gap-1 group cursor-pointer" onClick={downloadQRCode}>
                  <div className="w-16 h-16 bg-white border border-gray-200 p-1 rounded flex items-center justify-center relative shadow-sm group-hover:border-indigo-300 transition-colors">
                    <QRCodeSVG 
                      id="referral-qr"
                      value={referralLink} 
                      size={56} 
                      level="H"
                      includeMargin={false}
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded">
                      <Download size={16} className="text-white" />
                    </div>
                  </div>
                  <span className="text-[8px] bg-indigo-900 text-white px-1 rounded">কিউআর কোড সেভ করুন</span>
                </div>
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded p-1.5 focus-within:border-indigo-300 transition-colors">
                    <span className="text-[10px] text-gray-500 truncate flex-1">{referralLink}</span>
                    <button 
                      onClick={() => copyToClipboard(referralLink, "লিঙ্ক কপি করা হয়েছে!")}
                      className="p-1 bg-indigo-900 rounded text-white hover:bg-indigo-800 transition-colors active:scale-90"
                    >
                      <Copy size={12} />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => shareReferral('facebook')} className="w-8 h-8 rounded bg-[#1877F2] flex items-center justify-center text-white hover:scale-110 transition-transform active:scale-90"><Facebook size={16} fill="currentColor" /></button>
                    <button onClick={() => shareReferral('twitter')} className="w-8 h-8 rounded bg-black flex items-center justify-center text-white hover:scale-110 transition-transform active:scale-90"><XIcon size={16} /></button>
                    <button onClick={() => shareReferral('telegram')} className="w-8 h-8 rounded bg-[#0088cc] flex items-center justify-center text-white hover:scale-110 transition-transform active:scale-90"><Send size={16} /></button>
                    <button onClick={() => shareReferral('whatsapp')} className="w-8 h-8 rounded bg-[#25D366] flex items-center justify-center text-white hover:scale-110 transition-transform active:scale-90"><MessageCircle size={16} /></button>
                    <button onClick={() => shareReferral('native')} className="w-8 h-8 rounded bg-gray-600 flex items-center justify-center text-white hover:scale-110 transition-transform active:scale-90"><Share2 size={16} /></button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="bg-blue-400 rounded-lg p-3 text-white">
                  <p className="text-[10px] font-medium text-center opacity-90">Today's Income</p>
                  <p className="text-lg font-bold text-center">৳ 0.00</p>
                </div>
                <div className="bg-purple-400 rounded-lg p-3 text-white">
                  <p className="text-[10px] font-medium text-center opacity-90">Yesterday's Income</p>
                  <p className="text-lg font-bold text-center">৳ 0.00</p>
                </div>
                <div className="bg-purple-500 rounded-lg p-3 text-white">
                  <p className="text-[10px] font-medium text-center opacity-90">Registers</p>
                  <p className="text-lg font-bold text-center">{userData?.referralCount || 0}</p>
                </div>
                <div className="bg-blue-500 rounded-lg p-3 text-white">
                  <p className="text-[10px] font-medium text-center opacity-90">Valid Referral</p>
                  <p className="text-lg font-bold text-center">{userData?.validReferralCount || 0}</p>
                </div>
              </div>
            </div>

            {/* Banner */}
            <div className="bg-gradient-to-r from-purple-900 to-indigo-900 rounded-xl p-4 text-white relative overflow-hidden shadow-lg">
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-xl bg-yellow-500 p-1 flex items-center justify-center shadow-lg">
                  <img src="https://picsum.photos/seed/casino/100/100" alt="VIP" className="rounded-lg w-full h-full object-cover" />
                </div>
                <div>
                  <h3 className="text-xl font-black italic">বাজি কমিশন</h3>
                  <div className="flex items-center gap-1">
                    <span className="text-2xl font-black text-yellow-400">৳ 88,000.00</span>
                    <HelpCircle size={14} className="text-white/60" />
                  </div>
                  <p className="text-[10px] text-white/60">বাজি কমিশন</p>
                </div>
              </div>
            </div>

            {/* Rewards Released */}
            <div className="space-y-3">
              <h3 className="text-center font-bold text-indigo-900 text-lg">Rewards Released to Date</h3>
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center gap-4">
                <div className="w-16 h-16 flex items-center justify-center">
                  <Star size={48} className="text-yellow-400 fill-yellow-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-gray-700">Invitation Rewards</p>
                  <p className="text-xl font-black text-indigo-900">৳ 445,557,036.00</p>
                  <p className="text-[10px] text-gray-500">438288 claimed</p>
                </div>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center gap-4">
                <div className="w-16 h-16 flex items-center justify-center">
                  <Award size={48} className="text-blue-400 fill-blue-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-gray-700">Achievement Rewards</p>
                  <p className="text-xl font-black text-indigo-900">৳ 246,443,928.00</p>
                  <p className="text-[10px] text-gray-500">175932 claimed</p>
                </div>
              </div>
            </div>

            {/* Commission Details */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 space-y-4">
              <div className="text-center space-y-1">
                <h3 className="text-indigo-900 font-bold text-lg">{displayCasinoName} এর নতুন রেফারেল প্রোগ্রাম</h3>
                <p className="text-indigo-800 text-sm">এজেন্টের ৪টি সুপার কমিশন উপভোগ করুন</p>
              </div>
              
              <div className="space-y-2">
                <div className="bg-purple-100 rounded-lg p-2 flex items-center gap-3 border border-purple-200">
                  <div className="bg-blue-500 text-white w-6 h-6 rounded flex items-center justify-center font-bold text-xs">1</div>
                  <p className="text-indigo-900 font-bold text-sm">প্রতিটি আমন্ত্রণে <span className="text-yellow-600">৳৩০৮</span></p>
                </div>
                <div className="bg-purple-100 rounded-lg p-2 flex items-center gap-3 border border-purple-200">
                  <div className="bg-blue-500 text-white w-6 h-6 rounded flex items-center justify-center font-bold text-xs">2</div>
                  <p className="text-indigo-900 font-bold text-sm">প্রতিটি ডিপোজিটে <span className="text-yellow-600">০.৮৮%</span></p>
                </div>
                <div className="bg-purple-100 rounded-lg p-2 flex items-center gap-3 border border-purple-200">
                  <div className="bg-blue-500 text-white w-6 h-6 rounded flex items-center justify-center font-bold text-xs">3</div>
                  <p className="text-indigo-900 font-bold text-sm">৩ লেভেলে বাজির কমিশন <span className="text-yellow-600">০.৯৮%</span></p>
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
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <p className="text-center text-gray-500 text-sm mb-4">মোট আয় (Total Income) <span className="text-indigo-900 font-bold">৳ {totalEarned.toLocaleString()}</span></p>
              <div className="space-y-3">
                <IncomeItem label="আমন্ত্রণ পুরস্কার" value="৳ 0.00" />
                <IncomeItem label="পুরস্কার অর্জন" value="৳ 0.00" />
                <IncomeItem label="ডিপোজিট রিবেট" value={`৳ ${(userData?.totalReferralEarnings || 0).toLocaleString()}`} />
                <IncomeItem label="বেটিং রিবেট" value="৳ 0.00" />
                <IncomeItem label="নিবন্ধন" value={`${userData?.referralCount || 0}`} isCurrency={false} />
                <IncomeItem label="সঠিক রেফারেল" value={`${userData?.validReferralCount || 0}`} isCurrency={false} />
                <IncomeItem label="ডিপোজিটর" value={`${userData?.validReferralCount || 0}`} isCurrency={false} />
              </div>
            </div>

            <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100">
              <img src="https://picsum.photos/seed/referral/400/200" alt="Referral Program" className="w-full h-auto" />
            </div>

            <p className="text-center text-[10px] text-gray-400">Note : The system updates the data every 15 minutes.</p>
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
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                  <User size={20} className="text-blue-400" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-blue-900">Registers</p>
                  <p className="text-lg font-black text-blue-500">{currentReferrals}</p>
                </div>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                  <Users size={20} className="text-blue-400" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-blue-900">Valid Referral</p>
                  <p className="text-lg font-black text-blue-500">{referralsList.filter(r => r.status === 'active').length}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="bg-orange-50 rounded-lg p-2 border border-orange-100">
                <p className="text-[8px] font-bold text-orange-800">Today</p>
                <p className="text-xs font-black text-orange-900 text-right">+0</p>
              </div>
              <div className="bg-orange-50 rounded-lg p-2 border border-orange-100">
                <p className="text-[8px] font-bold text-orange-800">Yesterday</p>
                <p className="text-xs font-black text-orange-900 text-right">+0</p>
              </div>
              <div className="bg-orange-50 rounded-lg p-2 border border-orange-100">
                <p className="text-[8px] font-bold text-orange-800">Current Month</p>
                <p className="text-xs font-black text-orange-900 text-right">+0</p>
              </div>
            </div>

            <div className="flex gap-2">
              <div className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2 flex items-center justify-between text-xs text-blue-500 font-medium">
                All
                <ChevronDown size={14} />
              </div>
              <div className="bg-blue-500 rounded-lg px-3 py-2 flex items-center gap-2 text-xs text-white font-medium">
                <Shield size={14} />
                Today
              </div>
              <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 flex items-center gap-2 text-xs text-blue-500 font-medium">
                <Calendar size={14} />
                04/13- 04/13
              </div>
            </div>

            <div className="flex-1 flex flex-col">
              {isLoading ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-2">
                  <Loader2 size={32} className="text-blue-500 animate-spin" />
                  <p className="text-xs font-bold text-gray-400">লোড হচ্ছে...</p>
                </div>
              ) : referralsList.length > 0 ? (
                <div className="space-y-2 mt-4">
                  {referralsList.map((ref, idx) => (
                    <div key={idx} className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-400">
                          <User size={16} />
                        </div>
                        <div>
                          <p className="font-bold text-indigo-900 text-sm whitespace-nowrap overflow-hidden text-ellipsis max-w-[120px]">{ref.username || 'Anonymous'}</p>
                          <p className="text-[10px] text-gray-500 italic">
                             {ref.createdAt ? (typeof ref.createdAt === 'string' ? new Date(ref.createdAt).toLocaleDateString() : new Date(ref.createdAt.seconds * 1000).toLocaleDateString()) : 'N/A'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold text-green-500">৳ {ref.totalWinnings || 0}</p>
                        <p className="text-[10px] text-gray-400 uppercase tracking-tighter">{ref.role || 'Player'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center">
                  <EmptyState />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function IncomeItem({ label, value, isCurrency = true }: { label: string, value: string, isCurrency?: boolean }) {
  return (
    <div className="flex justify-between items-center text-sm">
      <span className="text-gray-500 font-medium">{label}</span>
      <span className="text-indigo-900 font-black">{value}</span>
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
