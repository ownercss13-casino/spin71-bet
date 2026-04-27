import React, { useState } from 'react';
import { Gift, X, Calendar, Star, AlertCircle, RefreshCw, ArrowLeft, Trophy, Users, Wallet, ChevronRight, Info, Target, Award, Activity } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { motion, AnimatePresence } from 'motion/react';

import { ToastType } from '../components/ui/Toast';

export default function BonusCenter({ 
  userData, 
  balance, 
  onBalanceUpdate, 
  onTabChange, 
  onUpdateUser,
  onLogout,
  showToast, 
  welcomeBonus = 507,
  onOpenPromoModal
}: { 
  userData: any, 
  balance: number, 
  onBalanceUpdate: (newBalance: number) => void, 
  onTabChange: (tab: any) => void, 
  onUpdateUser: (updates: any) => Promise<void>,
  onLogout: () => void,
  showToast: (msg: string, type?: ToastType) => void, 
  welcomeBonus?: number,
  onOpenPromoModal: () => void
}) {
  const [isClaiming, setIsClaiming] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");

  const parseClaimDate = (dateVal: any) => {
    if (!dateVal) return null;
    if (typeof dateVal === 'string') return new Date(dateVal);
    if (dateVal.toDate && typeof dateVal.toDate === 'function') return dateVal.toDate();
    if (dateVal.seconds) return new Date(dateVal.seconds * 1000);
    return new Date(dateVal);
  };

  const lastClaimed = userData?.lastDailyBonusClaimedAt;
  const lastClaimedDate = parseClaimDate(lastClaimed);
  const now = new Date();
  const canClaimDaily = !lastClaimedDate || (now.getTime() - lastClaimedDate.getTime() > 24 * 60 * 60 * 1000);
  
  const hasClaimedWelcome = userData?.hasClaimedWelcomeBonus;
  const hasMadeDeposit = (userData?.totalDeposits || 0) > 0;
  const hasClaimedDepositBonus = userData?.hasClaimedDepositBonus;

  const handleClaimDaily = async () => {
    if (canClaimDaily && userData?.id) {
       setIsClaiming(true);
       try {
         const claimTime = new Date().toISOString();
         const bonusAmt = 6.77;
         await onUpdateUser({
           balance: balance + bonusAmt,
           lastDailyBonusClaimedAt: claimTime
         });
         setPopupMessage(`অভিনন্দন! আপনি ৳${bonusAmt} ডেইলি বোনাস পেয়েছেন!`);
         setShowPopup(true);
       } catch (err) {
         showToast("বোনাস ক্লেইম করতে সমস্যা হয়েছে", "error");
       } finally {
         setIsClaiming(false);
       }
    }
  };

  const handleClaimWelcome = async () => {
    if (!hasClaimedWelcome && userData?.id) {
       setIsClaiming(true);
       try {
         await onUpdateUser({
           balance: balance + welcomeBonus,
           hasClaimedWelcomeBonus: true
         });
         setPopupMessage(`অভিনंदन! আপনি ${welcomeBonus} টাকা ওয়েলকাম বোনাস পেয়েছেন!`);
         setShowPopup(true);
       } catch (err) {
         showToast("বোনাস ক্লেইম করতে সমস্যা হয়েছে", "error");
       } finally {
         setIsClaiming(false);
       }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24 animate-in fade-in duration-500 relative">
      {isClaiming && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3 bg-white p-8 rounded-[40px] border border-gray-100 shadow-2xl scale-110">
            <RefreshCw size={48} className="text-red-500 animate-spin" />
            <span className="text-gray-900 font-black italic uppercase tracking-tighter text-lg animate-pulse">Processing...</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 to-red-800 p-6 rounded-b-[40px] shadow-lg shadow-red-900/20 sticky top-0 z-30">
        <div className="flex items-center gap-4 mb-4">
          <button onClick={() => onTabChange('home')} className="text-white hover:scale-110 transition-transform">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-2xl font-black text-white italic uppercase tracking-tighter">প্রচার ও বোনাস (Promotions)</h1>
        </div>
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 flex items-center justify-between border border-white/20">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-full bg-yellow-400 flex items-center justify-center shadow-lg">
                <Trophy size={20} className="text-red-700" />
             </div>
             <div>
                <p className="text-[10px] font-black text-white/60 uppercase tracking-widest leading-none mb-1">Available Rewards</p>
                <p className="text-xl font-black text-white italic leading-none">৳ {balance.toLocaleString()}</p>
             </div>
          </div>
          <button onClick={() => onTabChange('wallet')} className="bg-yellow-400 text-red-900 px-4 py-2 rounded-xl font-black text-xs uppercase tracking-tighter shadow-lg active:scale-95 transition-all">
            উত্তোলন
          </button>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Promo Code section */}
        <div className="bg-white rounded-[40px] p-8 shadow-sm border border-gray-100 flex flex-col items-center text-center space-y-4 relative overflow-hidden group">
           <div className="absolute top-0 right-0 w-32 h-32 bg-red-50 rounded-full blur-3xl -mr-16 -mt-16 opacity-50 group-hover:opacity-100 transition-opacity"></div>
           <Gift size={56} className="text-red-500 animate-bounce" />
           <div>
             <h3 className="text-2xl font-black text-gray-900 italic leading-none mb-2">প্রোমো কোড (Promo Code)</h3>
             <p className="text-xs text-gray-500 font-medium">আপনার কাছে কি কোনো গিফট কোড আছে? এখানে উপহার সংগ্রহ করুন।</p>
           </div>
           <button 
             onClick={onOpenPromoModal}
             className="w-full bg-gradient-to-r from-red-600 to-red-800 text-white font-black py-5 rounded-[24px] shadow-lg shadow-red-500/30 flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 transition-all uppercase tracking-widest text-sm"
           >
             কোড ব্যবহার করুন
           </button>
        </div>

        {/* Featured Promotion */}
        <div className="relative rounded-[40px] overflow-hidden shadow-2xl group cursor-pointer" onClick={() => onTabChange('deposit')}>
          <img src="https://picsum.photos/seed/bonus/800/400" alt="Special Offer" className="w-full h-56 object-cover group-hover:scale-110 transition-transform duration-1000" />
          <div className="absolute inset-0 bg-gradient-to-t from-red-900/90 via-black/20 to-transparent p-6 flex flex-col justify-end">
            <div className="bg-yellow-400 text-red-900 text-[10px] font-black px-3 py-1 rounded-full w-fit mb-2 uppercase tracking-widest shadow-lg">New Offer 🔥</div>
            <h2 className="text-3xl font-black text-white italic leading-tight mb-1">স্বাগতম বোনাস ৳ ৫০০৭ পর্যন্ত!</h2>
            <p className="text-red-200 text-xs font-bold leading-none">প্রথম জমার ওপর ১০০% ক্যাশব্যাক বোনাস পান আজই</p>
          </div>
        </div>

        {/* Categories */}
        <div className="grid grid-cols-2 gap-4">
          <BonusCard 
            title="ডেইলি বোনাস" 
            desc="প্রতিদিন ৩-৭ টাকা পর্যন্ত ফ্রী রিওয়ার্ড" 
            icon={Calendar} 
            color="bg-orange-500" 
            available={canClaimDaily}
            onClick={handleClaimDaily}
          />
          <BonusCard 
            title="রেফারেল" 
            desc="বন্ধুদের আনুন এবং আয় করুন Unlimited" 
            icon={Users} 
            color="bg-indigo-600" 
            available={true}
            onClick={() => onTabChange('invite')}
          />
        </div>

        <div>
           <div className="flex items-center justify-between mb-4 px-2">
             <h3 className="font-black text-gray-900 uppercase tracking-tighter italic text-xl underline decoration-red-500 decoration-4 underline-offset-4">অন্যান্য অফার (Explore)</h3>
             <ChevronRight size={24} className="text-gray-300" />
           </div>
           
           <div className="space-y-4 pb-10">
              <PromotionItem 
                title="সাপ্তাহিক ৫% ক্যাশব্যাক" 
                desc="আপনার মোট হারের ৫% টাকা ক্যাশব্যাক হিসেবে ফিরে পান সরাসরি ওয়ালেটে।" 
                icon={RefreshCw}
                color="bg-blue-500"
                tag="LIVE"
              />
              <PromotionItem 
                title="VIP মেম্বারশিপ টার্গেট" 
                desc="১ লক্ষ টাকা টার্নওভার পূরণ করে ভিআইপি ক্লাবে যোগদান করুন এবং পান স্পেশাল সুবিধা।" 
                icon={Star}
                color="bg-yellow-500"
                tag="VIP"
              />
              <PromotionItem 
                title="প্রথম ডিপোজিটে ১০০%" 
                desc="রেজিস্ট্রেশনের পর প্রথম ২৪ ঘন্টার জন্য স্পেশাল বোনাস।" 
                icon={Target}
                color="bg-red-500"
                tag="NEW"
              />
           </div>
        </div>
      </div>

      <AnimatePresence>
        {showPopup && (
          <div className="fixed inset-0 z-[210] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              className="bg-white rounded-[40px] p-8 text-center max-w-sm w-full shadow-2xl relative border-4 border-yellow-400"
            >
              <div className="w-24 h-24 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trophy size={48} className="text-yellow-600" />
              </div>
              <h3 className="text-2xl font-black text-gray-900 italic mb-2">চমৎকার খবর!</h3>
              <p className="text-gray-600 font-medium mb-8 leading-relaxed">{popupMessage}</p>
              <button 
                onClick={() => setShowPopup(false)}
                className="w-full bg-red-600 text-white font-black py-4 rounded-[24px] uppercase tracking-widest text-sm shadow-lg shadow-red-500/30 active:scale-95 transition-all"
              >
                দারুণ, ধন্যবাদ!
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function BonusCard({ title, desc, icon: Icon, color, available, onClick }: any) {
  return (
    <button 
      onClick={onClick}
      className={`${color} p-6 rounded-[32px] text-left text-white shadow-xl relative overflow-hidden group active:scale-95 transition-all h-full flex flex-col justify-between`}
    >
      <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:scale-110 transition-transform">
        <Icon size={40} />
      </div>
      <div className="relative z-10">
        <div className="bg-white/20 w-10 h-10 rounded-xl flex items-center justify-center mb-4">
          <Icon size={20} />
        </div>
        <h4 className="text-lg font-black italic leading-none mb-1">{title}</h4>
        <p className="text-[10px] font-bold text-white/70 leading-tight mb-2">{desc}</p>
      </div>
      
      <div className={`mt-2 w-fit px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${available ? 'bg-white text-black' : 'bg-black/20 text-white/50'}`}>
        {available ? 'এখনই দেখুন' : 'শেষ হয়েছে'}
      </div>
    </button>
  );
}

function PromotionItem({ title, desc, icon: Icon, color, tag }: any) {
  return (
    <div className="bg-white rounded-[32px] p-5 shadow-sm border border-gray-100 flex gap-4 hover:border-gray-200 transition-all group">
      <div className={`${color} w-16 h-16 rounded-[24px] shrink-0 flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform`}>
        <Icon size={28} />
      </div>
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <h4 className="font-black text-gray-900 italic">{title}</h4>
          <span className="text-[8px] font-black bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full uppercase tracking-widest">{tag}</span>
        </div>
        <p className="text-[11px] text-gray-500 font-medium leading-tight">{desc}</p>
      </div>
    </div>
  );
}

