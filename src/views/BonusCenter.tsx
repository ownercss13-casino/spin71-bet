import React, { useState } from 'react';
import { Gift, X, Calendar, Star, AlertCircle, RefreshCw, ArrowLeft, Trophy, Users, Zap, CheckCircle2, Copy, Play, ArrowRight, BookOpen, Clock, Settings, Bell, CircleDollarSign } from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState('mission');
  const [subTab, setSubTab] = useState('new_player');

  const tabs = [
    { id: 'event', label: 'ইভেন্ট', badge: 2 },
    { id: 'mission', label: 'মিশন', badge: 3 },
    { id: 'vip', label: 'VIP' },
    { id: 'svip', label: 'SVIP' },
    { id: 'claim', label: 'দাবি করুন', badge: 8 },
    { id: 'cashback', label: 'ক্যাশব্যাক' },
  ];

  const handleClaimReward = (amount: number) => {
    showToast(`Successfully claimed ৳${amount}`, 'success');
    onUpdateUser({
      balance: balance + amount
    });
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
        {/* Chest Progress Section */}
        <div className="bg-[#249965] rounded-xl p-4 shadow-sm border border-[#3bc68a]">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-1 font-bold text-green-300">
              <Zap size={16} className="fill-green-300" />
              <span>0</span>
            </div>
            <button className="text-white text-sm">বিশদ</button>
          </div>

          <div className="relative flex items-center justify-between px-2">
            {/* Progress line */}
            <div className="absolute left-[10%] right-[10%] top-6 h-0.5 bg-[#45B888] -z-0"></div>
            
            {/* Chests */}
            {[
              { id: 1, energy: 100, active: 1 },
              { id: 2, energy: 200, active: 1 },
              { id: 3, energy: 300, active: 1 },
              { id: 4, energy: 500, active: 1 },
            ].map((chest, index) => (
              <div key={chest.id} className="flex flex-col items-center gap-2 z-10">
                <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center border-2 border-[#52C594]">
                  {/* Chest Icon representation */}
                  <div className="w-8 h-8 opacity-80 flex flex-col items-center">
                    <div className="w-8 h-4 bg-gray-200 rounded-t border-b border-gray-400 relative">
                       <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-2 h-2 bg-yellow-400 rounded-full border border-yellow-600"></div>
                    </div>
                    <div className="w-8 h-4 bg-gray-300 rounded-b flex items-center justify-center text-[10px] font-bold text-gray-500">
                       1
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-green-200 bg-[#1D8254] px-2 py-0.5 rounded-full border border-[#42B485]">
                  <Zap size={10} className="fill-green-200" />
                  <span>- {chest.energy}</span>
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
          <button className="flex items-center gap-1 text-white text-sm font-medium">
            <RefreshCw size={14} />
            রিফ্রেশ
          </button>
        </div>

        {/* Gift Icon */}
        <div className="flex justify-between items-center px-1">
           <div className="relative">
              <Gift size={40} className="text-red-500 fill-yellow-400" />
              <span className="absolute -bottom-2 -left-2 bg-green-500 text-white text-[10px] font-black px-1.5 rounded border border-white">NEW</span>
           </div>
           <button className="text-white p-2">
             <BookOpen size={24} className="opacity-80" />
           </button>
        </div>

        {/* Mission List */}
        <div className="space-y-3">
          {/* Mission Item 1 */}
          <div className="bg-[#1D8254]/40 border border-[#3bc68a]/50 rounded-lg overflow-hidden">
            <div className="bg-[#1D8254]/60 px-3 py-2 flex items-center gap-2 border-b border-[#3bc68a]/30">
              <div className="w-6 h-6 bg-white rounded flex items-center justify-center text-[#2BAA74]">
                 <ArrowRight size={16} />
              </div>
              <span className="text-white text-sm font-medium">ডাউনলোড(আমানত)</span>
            </div>
            <div className="p-3 flex items-center justify-between">
               <div className="flex gap-6">
                 <div className="flex flex-col items-center">
                    <CircleDollarSign size={20} className="text-yellow-400 fill-yellow-100" />
                    <span className="text-yellow-400 text-sm mt-1">49.99</span>
                 </div>
                 <div className="flex flex-col items-center">
                    <Zap size={20} className="text-green-300 fill-green-300" />
                    <span className="text-green-300 text-sm mt-1">10</span>
                 </div>
               </div>
               <button 
                 onClick={() => handleClaimReward(49.99)}
                 className="bg-[#2CE830] hover:bg-[#25cc28] text-black font-bold px-8 py-2 rounded-md shadow-sm active:scale-95 transition-all text-sm"
               >
                 দাবি
               </button>
            </div>
          </div>

          {/* Mission Item 2 */}
          <div className="bg-[#1D8254]/40 border border-[#3bc68a]/50 rounded-lg overflow-hidden">
            <div className="bg-[#1D8254]/60 px-3 py-2 flex items-center gap-2 border-b border-[#3bc68a]/30">
              <div className="w-6 h-6 bg-white rounded flex items-center justify-center text-blue-500 relative">
                 <Settings size={16} />
                 <CheckCircle2 size={10} className="absolute -bottom-1 -right-1 text-green-500 fill-white" />
              </div>
              <span className="text-white text-sm font-medium">অ্যাকাউন্ট নিবন্ধন করুন</span>
            </div>
            <div className="p-3 flex items-center justify-between">
               <div className="flex gap-6">
                 <div className="flex flex-col items-center">
                    <CircleDollarSign size={20} className="text-yellow-400 fill-yellow-100" />
                    <span className="text-yellow-400 text-sm mt-1">1.00-9.99</span>
                 </div>
               </div>
               <button 
                 onClick={() => handleClaimReward(5.00)}
                 className="bg-[#2CE830] hover:bg-[#25cc28] text-black font-bold px-8 py-2 rounded-md shadow-sm active:scale-95 transition-all text-sm"
               >
                 দাবি
               </button>
            </div>
          </div>

          {/* Mission Item 3 */}
          <div className="bg-[#1D8254]/40 border border-[#3bc68a]/50 rounded-lg overflow-hidden">
            <div className="bg-[#1D8254]/60 px-3 py-2 flex items-center gap-2 border-b border-[#3bc68a]/30">
              <div className="w-6 h-6 bg-blue-100 rounded flex items-center justify-center text-blue-500">
                 <Settings size={14} className="animate-spin-slow" />
              </div>
              <span className="text-white text-sm font-medium">এসএমএস যাচাইকরণ</span>
            </div>
            <div className="p-3 flex items-center justify-between">
               <div className="flex gap-6">
                 <div className="flex flex-col items-center">
                    <CircleDollarSign size={20} className="text-yellow-400 fill-yellow-100" />
                    <span className="text-yellow-400 text-sm mt-1">2.99</span>
                 </div>
                 <div className="flex flex-col items-center">
                    <Zap size={20} className="text-green-300 fill-green-300" />
                    <span className="text-green-300 text-sm mt-1">10</span>
                 </div>
               </div>
               <button className="bg-white text-[#2BAA74] border border-[#2BAA74] font-bold px-8 py-2 rounded-md shadow-sm active:scale-95 transition-all text-sm">
                 যাওয়া
               </button>
            </div>
          </div>

          {/* Mission Item 4 */}
          <div className="bg-[#1D8254]/40 border border-[#3bc68a]/50 rounded-lg overflow-hidden">
            <div className="bg-[#1D8254]/60 px-3 py-2 flex items-center gap-2 border-b border-[#3bc68a]/30">
              <div className="w-6 h-6 bg-blue-100 rounded flex items-center justify-center text-blue-500">
                 <Copy size={14} />
              </div>
              <span className="text-white text-sm font-medium">ডেস্কটপ শর্টকাট সংরক্ষণ করুন</span>
            </div>
            <div className="p-3 flex items-center justify-between">
               <div className="flex gap-6">
                 <div className="flex flex-col items-center">
                    <CircleDollarSign size={20} className="text-yellow-400 fill-yellow-100" />
                    <span className="text-yellow-400 text-sm mt-1">1.00-99.90</span>
                 </div>
                 <div className="flex flex-col items-center">
                    <Zap size={20} className="text-green-300 fill-green-300" />
                    <span className="text-green-300 text-sm mt-1">10</span>
                 </div>
               </div>
               <button className="bg-white text-[#2BAA74] border border-[#2BAA74] font-bold px-8 py-2 rounded-md shadow-sm active:scale-95 transition-all text-sm">
                 যাওয়া
               </button>
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-[#248B5F] rounded-lg p-4 text-white/90 text-sm leading-relaxed mt-2 border border-[#3bc68a]/30 shadow-inner">
           <p className="mb-4">
             এই ইভেন্টটি বিশেষভাবে নতুন খেলোয়াড়দের জন্য প্রস্তুত। আপনি
             অ্যাকাউন্ট নিবন্ধন করে ৳০.৫ এবং মোবাইল ফোন যাচাইকরণ সম্
             পন্ন করে ৳২.৯৯ পেতে পারেন। আপনার প্রথম জমা করার পর,
             F999 মোবাইল অ্যাপ ডাউনলোড করে এবং অ্যাপে লগ ইন করার
             পর আপনি আবার ৳49.99 পেতে পারেন।
           </p>
           <p>
             ১. কাজটি শেষ করার পরের দিনই আপনি টাস্ক বোনাসটি পেতে পার
             বেন;
           </p>
        </div>
      </div>

    </div>
  );
}

