import React from 'react';
import { RefreshCw, Wallet, User, Users, Headset, TrendingUp, CreditCard, Gift, Award, Mail, Smartphone, Clock, Shield, UserCog } from 'lucide-react';

interface OverviewTabProps {
  onTabChange: (tab: string) => void;
  onSubTabChange: (tab: string) => void;
  balance: number;
  isRefreshing: boolean;
  onRefresh: () => void;
  profileData: any;
  userData: any;
  onEditProfile: () => void;
  totals: { deposit: number; withdraw: number; bonus: number; rebate: number };
  setShowAgentPanel: (show: boolean) => void;
  setIsChatOpen: (open: boolean) => void;
}

export default function OverviewTab({ 
  onTabChange, 
  onSubTabChange,
  balance, 
  isRefreshing, 
  onRefresh, 
  profileData, 
  userData, 
  onEditProfile, 
  totals, 
  setShowAgentPanel,
  setIsChatOpen
}: OverviewTabProps) {
  const turnover = userData?.turnover || 0;
  const requiredTurnover = (userData?.totalDeposit || 1000) * 1;
  const turnoverProgress = Math.min(100, (turnover / requiredTurnover) * 100);

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Account Balance Card */}
      <div className="bg-gradient-to-r from-teal-700 to-teal-900 rounded-2xl p-6 border border-teal-600 shadow-xl flex items-center justify-between relative overflow-hidden">
        <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/5 rounded-full blur-3xl"></div>
        <div className="relative z-10">
          <p className="text-teal-200 text-sm font-medium">বর্তমান ব্যালেন্স</p>
          <div className="flex items-center gap-3 mt-1">
            <h2 className="text-3xl font-black text-white italic tracking-tight">৳ {balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h2>
            <button 
              onClick={onRefresh}
              className="p-1.5 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
            >
              <RefreshCw size={18} className={`text-teal-100 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
        <div className="bg-white/10 p-3 rounded-full cursor-pointer relative z-10">
          <Wallet size={32} className="text-yellow-400" />
        </div>
      </div>

      {/* Turnover Progress Card */}
      <div className="bg-teal-800/40 p-4 rounded-2xl border border-teal-700/50 space-y-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <RefreshCw size={14} className="text-teal-400" />
            <span className="text-xs text-teal-200 font-bold uppercase tracking-wider">টানউভার (Turnover)</span>
          </div>
          <span className="text-[10px] text-teal-400 font-black">{turnoverProgress.toFixed(1)}%</span>
        </div>
        <div className="h-2 bg-black/30 rounded-full overflow-hidden border border-white/5">
          <div className="h-full bg-gradient-to-r from-teal-500 to-teal-300 shadow-[0_0_10px_rgba(20,184,166,0.5)]" style={{ width: `${turnoverProgress}%` }}></div>
        </div>
        <div className="flex justify-between text-[10px] font-bold">
          <span className="text-gray-400">৳ {turnover.toLocaleString()}</span>
          <span className="text-teal-400">লক্ষ্য: ৳ {requiredTurnover.toLocaleString()}</span>
        </div>
      </div>

      {/* Quick Actions / Cross-links */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <button 
          onClick={() => onSubTabChange('profile')}
          className="bg-teal-800/40 rounded-xl p-4 border border-teal-700/50 flex flex-col items-center justify-center text-center hover:bg-teal-700/60 transition-all group"
        >
          <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center mb-2 text-blue-400 group-hover:scale-110 transition-transform">
            <User size={24} />
          </div>
          <span className="text-white font-bold text-sm">প্রোফাইল</span>
          <span className="text-teal-300 text-[10px] mt-1">তথ্য দেখুন</span>
        </button>

        <button 
          onClick={() => onTabChange('invite')}
          className="bg-teal-800/40 rounded-xl p-4 border border-teal-700/50 flex flex-col items-center justify-center text-center hover:bg-teal-700/60 transition-all group"
        >
          <div className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center mb-2 text-yellow-400 group-hover:scale-110 transition-transform">
            <Users size={24} />
          </div>
          <span className="text-white font-bold text-sm">আমন্ত্রণ</span>
          <span className="text-teal-300 text-[10px] mt-1">বোনাস পান</span>
        </button>

        <button 
          onClick={() => setIsChatOpen(true)}
          className="bg-teal-800/40 rounded-xl p-4 border border-teal-700/50 flex flex-col items-center justify-center text-center hover:bg-teal-700/60 transition-all group"
        >
          <div className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center mb-2 text-yellow-400 group-hover:scale-110 transition-transform">
            <Headset size={24} />
          </div>
          <span className="text-white font-bold text-sm">সাপোর্ট চ্যাট</span>
          <span className="text-teal-300 text-[10px] mt-1">সাহায্য নিন</span>
        </button>

        {(userData?.role === 'agent' || userData?.role === 'admin') && (
          <button 
            onClick={() => setShowAgentPanel(true)}
            className="bg-teal-800/40 rounded-xl p-4 border border-teal-700/50 flex flex-col items-center justify-center text-center hover:bg-teal-700/60 transition-all group"
          >
            <div className="w-12 h-12 rounded-full bg-teal-500/20 flex items-center justify-center mb-2 text-teal-400 group-hover:scale-110 transition-transform">
              <TrendingUp size={24} />
            </div>
            <span className="text-white font-bold text-sm">এজেন্ট</span>
            <span className="text-teal-300 text-[10px] mt-1">প্যানেল</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-teal-800/40 rounded-xl p-3 border border-teal-700/50 flex flex-col items-center justify-center text-center">
          <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center mb-2 text-blue-300">
            <Wallet size={20} />
          </div>
          <span className="text-teal-100 text-xs mb-1">মোট জমা</span>
          <span className="text-white font-bold">৳ {totals.deposit.toLocaleString()}</span>
        </div>
        <div className="bg-teal-800/40 rounded-xl p-3 border border-teal-700/50 flex flex-col items-center justify-center text-center">
          <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center mb-2 text-green-300">
            <CreditCard size={20} />
          </div>
          <span className="text-teal-100 text-xs mb-1">মোট উত্তোলন</span>
          <span className="text-white font-bold">৳ {totals.withdraw.toLocaleString()}</span>
        </div>
        <div className="bg-teal-800/40 rounded-xl p-3 border border-teal-700/50 flex flex-col items-center justify-center text-center">
          <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center mb-2 text-yellow-300">
            <Gift size={20} />
          </div>
          <span className="text-teal-100 text-xs mb-1">মোট বোনাস</span>
          <span className="text-white font-bold">৳ {totals.bonus.toLocaleString()}</span>
        </div>
        <div className="bg-teal-800/40 rounded-xl p-3 border border-teal-700/50 flex flex-col items-center justify-center text-center">
          <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center mb-2 text-purple-300">
            <Award size={20} />
          </div>
          <span className="text-teal-100 text-xs mb-1">রিবেট</span>
          <span className="text-white font-bold">৳ {totals.rebate.toLocaleString()}</span>
        </div>
      </div>

      {/* Personal Information */}
      <div className="bg-teal-800/40 rounded-xl border border-teal-700/50 overflow-hidden">
        <div className="p-3 border-b border-teal-700/50 flex items-center justify-between">
          <h3 className="font-bold text-white flex items-center gap-2">
            <User size={16} className="text-teal-400" /> ব্যক্তিগত তথ্য (Personal Info)
          </h3>
          <button 
            onClick={onEditProfile}
            className="text-[10px] bg-teal-700/50 hover:bg-teal-600/50 text-teal-100 px-2 py-1 rounded-lg border border-teal-600/50 transition-colors flex items-center gap-1"
          >
            <UserCog size={12} /> এডিট করুন (Edit)
          </button>
        </div>
        <div className="p-3 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-teal-900 flex items-center justify-center text-teal-300">
                <Mail size={14} />
              </div>
              <div>
                <p className="text-white text-sm font-medium">ইমেইল (Email)</p>
                <p className="text-teal-200 text-xs">{profileData?.email || 'Not provided'}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-teal-900 flex items-center justify-center text-teal-300">
                <Smartphone size={14} />
              </div>
              <div>
                <p className="text-white text-sm font-medium">ফোন নম্বর (Phone)</p>
                <p className="text-teal-200 text-xs">{userData?.phoneNumber || userData?.phone || profileData?.phoneNumber || profileData?.phone || 'Not provided'}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-teal-900 flex items-center justify-center text-teal-300">
                <Clock size={14} />
              </div>
              <div>
                <p className="text-white text-sm font-medium">নিবন্ধন তারিখ (Registration Date)</p>
                <p className="text-teal-200 text-xs">{profileData?.registrationDate || 'Not provided'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
