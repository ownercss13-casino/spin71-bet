import React, { useState, useEffect, useRef, useMemo } from "react";
import useSWR from "swr";
import SupportChat from "./SupportChat";
import { updateUserProfile } from '../services/firebaseService';
import {
  User,
  Settings,
  Wallet,
  ChevronRight,
  ChevronLeft,
  Shield,
  Bell,
  LogOut,
  CreditCard,
  Gift,
  Award,
  Users,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  RefreshCw,
  Gamepad2,
  Smartphone,
  KeyRound,
  Headset,
  HelpCircle,
  BadgeCheck,
  FileText,
  Camera,
  AlertCircle,
  X,
  Send,
  Facebook,
  Mail,
  Link,
  CheckCircle2,
  Filter,
  ArrowDownUp,
  QrCode,
  Copy,
  Check,
  Download,
  AlertTriangle,
  Eye,
  EyeOff
} from "lucide-react";

const fetcher = (url: string) => fetch(url).then(res => {
  if (!res.ok) throw new Error('Network response was not ok');
  return res.json();
});

export default function ProfileView({ onTabChange, balance, userData, onLogout }: { onTabChange: (tab: any) => void, balance: number, userData: any, onLogout: () => void }) {
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'history' | 'settings'>('overview');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [profilePic, setProfilePic] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const handleProfilePicChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        setProfilePic(base64String);
        // Update Firestore
        const userId = userData?.id || profileData?.id;
        if (userId) {
          await updateUserProfile(userId, { profilePictureUrl: base64String });
          refetchProfile();
        }
      };
      reader.readAsDataURL(file);
    }
  };
  
  const { data: profileData, error, isLoading: loading, mutate: refetchProfile } = useSWR('/api/user/profile', fetcher, {
    revalidateOnFocus: true,
    dedupingInterval: 5000,
  });

  if (loading) {
    return (
      <div className="flex-1 overflow-y-auto pb-20">
        {/* Header Skeleton */}
        <div className="bg-gradient-to-b from-teal-900/50 to-teal-800/30 p-4 pt-6 rounded-b-3xl shadow-md animate-pulse">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-10 h-10 bg-teal-700/50 rounded-full"></div>
            <div className="w-32 h-6 bg-teal-700/50 rounded-lg"></div>
          </div>
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-full bg-teal-700/50 shrink-0"></div>
            <div className="flex-1 space-y-3">
              <div className="w-3/4 h-8 bg-teal-700/50 rounded-lg"></div>
              <div className="w-1/2 h-4 bg-teal-700/50 rounded-lg"></div>
              <div className="w-full h-2.5 bg-teal-700/50 rounded-full mt-4"></div>
            </div>
          </div>
        </div>

        {/* Tabs Skeleton */}
        <div className="flex px-4 mt-4 gap-2 animate-pulse">
          <div className="flex-1 h-10 bg-teal-800/50 rounded-lg"></div>
          <div className="flex-1 h-10 bg-teal-800/50 rounded-lg"></div>
          <div className="flex-1 h-10 bg-teal-800/50 rounded-lg"></div>
        </div>

        {/* Content Skeleton */}
        <div className="p-4 space-y-4 animate-pulse">
          {/* Balance Card */}
          <div className="h-28 bg-teal-800/40 rounded-2xl border border-teal-700/50"></div>
          
          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-3">
            <div className="h-28 bg-teal-800/40 rounded-xl border border-teal-700/50"></div>
            <div className="h-28 bg-teal-800/40 rounded-xl border border-teal-700/50"></div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="h-24 bg-teal-800/40 rounded-xl border border-teal-700/50"></div>
            <div className="h-24 bg-teal-800/40 rounded-xl border border-teal-700/50"></div>
            <div className="h-24 bg-teal-800/40 rounded-xl border border-teal-700/50"></div>
            <div className="h-24 bg-teal-800/40 rounded-xl border border-teal-700/50"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 overflow-y-auto pb-20 flex items-center justify-center p-6">
        <div className="bg-red-900/20 border border-red-500/50 rounded-xl p-6 text-center max-w-sm">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-red-300 font-bold mb-2">ত্রুটি (Error)</h3>
          <p className="text-red-200/80 text-sm mb-4">আপনার প্রোফাইল ডেটা লোড করতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন। (Failed to load profile data. Please try again.)</p>
          <button 
            onClick={() => refetchProfile()} 
            className="bg-red-500/20 hover:bg-red-500/30 text-red-300 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 mx-auto"
          >
            <RefreshCw size={16} />
            পুনরায় চেষ্টা করুন (Retry)
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto pb-20">
      {/* Profile Header */}
      <div className="bg-gradient-to-b from-[#128a61] to-[#16a374] p-4 pt-6 rounded-b-3xl shadow-md">
        <div className="flex items-center gap-4 mb-6">
          <button 
            onClick={() => onTabChange('home')}
            className="p-2 bg-black/20 hover:bg-black/30 rounded-full transition-colors text-white"
          >
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-xl font-bold text-white">আমার প্রোফাইল</h1>
        </div>
        <div className="flex items-center gap-6">
          <div className="relative">
            <div className="relative w-24 h-24 rounded-full bg-gradient-to-tr from-yellow-400 to-yellow-600 p-1.5 shadow-xl cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              <div className="w-full h-full bg-[#16a374] rounded-full flex items-center justify-center border-4 border-white overflow-hidden">
                {profilePic ? (
                  <img src={profilePic} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User size={48} className="text-white" />
                )}
              </div>
              <div className="absolute bottom-1 right-1 bg-white p-1.5 rounded-full shadow-lg">
                <Camera size={16} className="text-teal-600" />
              </div>
            </div>
            <input type="file" ref={fileInputRef} onChange={handleProfilePicChange} accept="image/*" className="hidden" />
            <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-yellow-500 to-yellow-700 text-black text-xs font-black px-3 py-1 rounded-full border-2 border-yellow-300 shadow-lg">
              VIP {profileData?.vipLevel || 3}
            </div>
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-black text-white drop-shadow-md tracking-tight">{userData?.username || profileData?.username || "Player_SPIN71BET"}</h2>
            <p className="text-teal-50 text-sm font-medium opacity-90">ID: {userData?.id || profileData?.id || "84729104"}</p>
            <div className="mt-2 flex flex-col gap-1.5">
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-yellow-300 font-black uppercase tracking-widest">VIP Progress</span>
                <span className="text-[10px] text-yellow-300 font-bold">{profileData?.vipProgress || 75}% to VIP {profileData ? profileData.vipLevel + 1 : 4}</span>
              </div>
              <div className="bg-black/30 rounded-full h-2.5 w-full overflow-hidden border border-white/10">
                <div className="bg-gradient-to-r from-yellow-400 to-yellow-200 h-full rounded-full shadow-[0_0_10px_rgba(250,204,21,0.5)]" style={{ width: `${profileData?.vipProgress || 75}%` }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex px-4 mt-4 gap-2">
        <button 
          onClick={() => setActiveSubTab('overview')}
          className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors ${activeSubTab === 'overview' ? 'bg-yellow-500 text-black shadow-md' : 'bg-teal-800/50 text-teal-100 border border-teal-700'}`}
        >
          ওভারভিউ
        </button>
        <button 
          onClick={() => setActiveSubTab('history')}
          className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors ${activeSubTab === 'history' ? 'bg-yellow-500 text-black shadow-md' : 'bg-teal-800/50 text-teal-100 border border-teal-700'}`}
        >
          ইতিহাস
        </button>
        <button 
          onClick={() => setActiveSubTab('settings')}
          className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors ${activeSubTab === 'settings' ? 'bg-yellow-500 text-black shadow-md' : 'bg-teal-800/50 text-teal-100 border border-teal-700'}`}
        >
          সেটিংস
        </button>
      </div>

      {/* Tab Content */}
      <div className="p-4">
        {activeSubTab === 'overview' && <OverviewTab onTabChange={onTabChange} balance={balance} isRefreshing={isRefreshing} onRefresh={handleRefresh} profileData={profileData} userData={userData} />}
        {activeSubTab === 'history' && <HistoryTab email={profileData?.email} />}
        {activeSubTab === 'settings' && <SettingsTab profileData={profileData} onLogout={onLogout} />}
      </div>
    </div>
  );
}

function OverviewTab({ onTabChange, balance, isRefreshing, onRefresh, profileData, userData }: { onTabChange: (tab: any) => void, balance: number, isRefreshing: boolean, onRefresh: () => void, profileData: any, userData: any }) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Account Balance Card */}
      <div className="bg-gradient-to-r from-teal-700 to-teal-900 rounded-2xl p-6 border border-teal-600 shadow-xl flex items-center justify-between">
        <div>
          <p className="text-teal-200 text-sm font-medium">বর্তমান ব্যালেন্স</p>
          <div className="flex items-center gap-3 mt-1">
            <h2 className="text-3xl font-bold text-white">৳ {balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h2>
            <button 
              onClick={onRefresh}
              className="p-1.5 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
            >
              <RefreshCw size={18} className={`text-teal-100 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
        <div className="bg-white/10 p-3 rounded-full">
          <Wallet size={32} className="text-yellow-400" />
        </div>
      </div>

      {/* Account Details Card */}
      <div className="bg-teal-800/40 rounded-2xl p-5 border border-teal-700/50 shadow-lg">
        <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
          <Shield size={16} className="text-yellow-400" /> অ্যাকাউন্ট তথ্য (Account Details)
        </h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center py-2 border-b border-teal-700/30">
            <span className="text-xs text-teal-200">ইউজার নেম (Username)</span>
            <span className="text-sm font-bold text-white">{userData?.username || profileData?.username || 'Player_SPIN71'}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-teal-700/30">
            <span className="text-xs text-teal-200">আইডি নাম্বার (ID Number)</span>
            <span className="text-sm font-mono text-yellow-400 font-bold">{userData?.id || profileData?.id || '84729104'}</span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-xs text-teal-200">পাসওয়ার্ড (Password)</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-mono text-white">
                {showPassword ? (userData?.password || '••••••••') : '••••••••'}
              </span>
              <button 
                onClick={() => setShowPassword(!showPassword)}
                className="text-teal-400 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions / Cross-links */}
      <div className="grid grid-cols-2 gap-3">
        <button 
          onClick={() => onTabChange('invite')}
          className="bg-teal-800/40 rounded-xl p-4 border border-teal-700/50 flex flex-col items-center justify-center text-center hover:bg-teal-700/60 transition-all group"
        >
          <div className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center mb-2 text-yellow-400 group-hover:scale-110 transition-transform">
            <Users size={24} />
          </div>
          <span className="text-white font-bold text-sm">বন্ধুদের আমন্ত্রণ জানান</span>
          <span className="text-teal-300 text-[10px] mt-1">বোনাস পান</span>
        </button>
        <button 
          onClick={() => onTabChange('shop')}
          className="bg-teal-800/40 rounded-xl p-4 border border-teal-700/50 flex flex-col items-center justify-center text-center hover:bg-teal-700/60 transition-all group"
        >
          <div className="w-12 h-12 rounded-full bg-teal-500/20 flex items-center justify-center mb-2 text-teal-300 group-hover:scale-110 transition-transform">
            <Gift size={24} />
          </div>
          <span className="text-white font-bold text-sm">শপ ভিজিট করুন</span>
          <span className="text-teal-300 text-[10px] mt-1">উপহার কিনুন</span>
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-teal-800/40 rounded-xl p-3 border border-teal-700/50 flex flex-col items-center justify-center text-center">
          <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center mb-2 text-blue-300">
            <Wallet size={20} />
          </div>
          <span className="text-teal-100 text-xs mb-1">মোট জমা</span>
          <span className="text-white font-bold">৳ 150,000</span>
        </div>
        <div className="bg-teal-800/40 rounded-xl p-3 border border-teal-700/50 flex flex-col items-center justify-center text-center">
          <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center mb-2 text-green-300">
            <CreditCard size={20} />
          </div>
          <span className="text-teal-100 text-xs mb-1">মোট উত্তোলন</span>
          <span className="text-white font-bold">৳ 125,400</span>
        </div>
        <div className="bg-teal-800/40 rounded-xl p-3 border border-teal-700/50 flex flex-col items-center justify-center text-center">
          <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center mb-2 text-yellow-300">
            <Gift size={20} />
          </div>
          <span className="text-teal-100 text-xs mb-1">মোট বোনাস</span>
          <span className="text-white font-bold">৳ 12,500</span>
        </div>
        <div className="bg-teal-800/40 rounded-xl p-3 border border-teal-700/50 flex flex-col items-center justify-center text-center">
          <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center mb-2 text-purple-300">
            <Award size={20} />
          </div>
          <span className="text-teal-100 text-xs mb-1">রিবেট</span>
          <span className="text-white font-bold">৳ 3,450</span>
        </div>
      </div>

      {/* Personal Information */}
      <div className="bg-teal-800/40 rounded-xl border border-teal-700/50 overflow-hidden">
        <div className="p-3 border-b border-teal-700/50 flex items-center justify-between">
          <h3 className="font-bold text-white flex items-center gap-2">
            <User size={16} className="text-teal-400" /> ব্যক্তিগত তথ্য (Personal Info)
          </h3>
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
                <p className="text-teal-200 text-xs">{profileData?.phone || 'Not provided'}</p>
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

      <div className="bg-teal-800/40 rounded-xl border border-teal-700/50 overflow-hidden">
        <div className="p-3 border-b border-teal-700/50 flex items-center justify-between">
          <h3 className="font-bold text-white flex items-center gap-2">
            <Shield size={16} className="text-yellow-400" /> নিরাপত্তা কেন্দ্র
          </h3>
          <span className="text-xs bg-green-500/20 text-green-300 px-2 py-0.5 rounded-full border border-green-500/30">উচ্চ</span>
        </div>
        <div className="p-3 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-teal-900 flex items-center justify-center text-teal-300">
                <User size={14} />
              </div>
              <div>
                <p className="text-sm text-white font-medium">ব্যক্তিগত তথ্য</p>
                <p className="text-[10px] text-teal-200">সম্পূর্ণ</p>
              </div>
            </div>
            <ChevronRight size={16} className="text-teal-400" />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-teal-900 flex items-center justify-center text-teal-300">
                <CreditCard size={14} />
              </div>
              <div>
                <p className="text-sm text-white font-medium">ব্যাংক কার্ড</p>
                <p className="text-[10px] text-teal-200">২টি কার্ড যুক্ত</p>
              </div>
            </div>
            <ChevronRight size={16} className="text-teal-400" />
          </div>
        </div>
      </div>
    </div>
  );
}

function HistoryTab({ email }: { email?: string }) {
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('date_desc');
  const [selectedTrx, setSelectedTrx] = useState<any>(null);

  const transactions = useMemo(() => [
    { id: 1, trxId: 'TXN1001', method: 'bKash', type: 'deposit', amount: '+৳5,000', date: '2026-03-29 14:30', status: 'সম্পন্ন', statusColor: 'text-green-400' },
    { id: 2, trxId: 'TXN1002', method: 'Nagad', type: 'withdraw', amount: '-৳2,000', date: '2026-03-28 09:15', status: 'প্রক্রিয়াধীন', statusColor: 'text-yellow-400' },
    { id: 3, trxId: 'TXN1003', method: 'Wallet', type: 'bet', amount: '-৳500', date: '2026-03-27 21:45', status: 'সম্পন্ন', statusColor: 'text-green-400' },
    { id: 4, trxId: 'TXN1004', method: 'System', type: 'bonus', amount: '+৳1,000', date: '2026-03-26 10:00', status: 'সম্পন্ন', statusColor: 'text-green-400' },
    { id: 5, trxId: 'TXN1005', method: 'Wallet', type: 'bet', amount: '-৳1,200', date: '2026-03-25 18:20', status: 'সম্পন্ন', statusColor: 'text-green-400' },
    { id: 6, trxId: 'TXN1006', method: 'Rocket', type: 'deposit', amount: '+৳10,000', date: '2026-03-24 11:10', status: 'সম্পন্ন', statusColor: 'text-green-400' },
    { id: 7, trxId: 'TXN1007', method: 'bKash', type: 'withdraw', amount: '-৳5,000', date: '2026-03-23 16:45', status: 'সম্পন্ন', statusColor: 'text-green-400' },
    { id: 8, trxId: 'TXN1008', method: 'Wallet', type: 'bet', amount: '-৳2,500', date: '2026-03-22 20:15', status: 'ব্যর্থ', statusColor: 'text-red-400' },
    { id: 9, trxId: 'TXN1009', method: 'Nagad', type: 'deposit', amount: '+৳2,000', date: '2026-03-21 12:30', status: 'সম্পন্ন', statusColor: 'text-green-400' },
    { id: 10, trxId: 'TXN1010', method: 'System', type: 'bonus', amount: '+৳500', date: '2026-03-20 09:00', status: 'সম্পন্ন', statusColor: 'text-green-400' },
  ], []);

  const filteredAndSortedTransactions = useMemo(() => {
    if (!transactions) return [];
    
    let result = [...transactions];
    
    if (filterType !== 'all') {
      result = result.filter(trx => trx.type === filterType);
    }
    
    result.sort((a, b) => {
      if (sortBy === 'date_desc') {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      } else if (sortBy === 'date_asc') {
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      } else if (sortBy === 'amount_desc') {
        const amountA = parseFloat(a.amount.replace(/[^0-9.-]+/g,""));
        const amountB = parseFloat(b.amount.replace(/[^0-9.-]+/g,""));
        return amountB - amountA;
      } else if (sortBy === 'amount_asc') {
        const amountA = parseFloat(a.amount.replace(/[^0-9.-]+/g,""));
        const amountB = parseFloat(b.amount.replace(/[^0-9.-]+/g,""));
        return amountA - amountB;
      }
      return 0;
    });
    
    return result;
  }, [transactions, filterType, sortBy]);

  return (
    <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold text-white">সাম্প্রতিক লেনদেন</h3>
        <button className="text-xs text-yellow-400 flex items-center gap-1">
          সব দেখুন <ChevronRight size={12} />
        </button>
      </div>

      <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
        <div className="relative flex-1 min-w-[120px]">
          <div className="absolute inset-y-0 left-2 flex items-center pointer-events-none">
            <Filter size={14} className="text-teal-400" />
          </div>
          <select 
            value={filterType} 
            onChange={(e) => setFilterType(e.target.value)}
            className="w-full bg-teal-800/60 border border-teal-700/50 text-teal-100 text-xs rounded-lg pl-8 pr-2 py-2 appearance-none focus:outline-none focus:border-teal-500"
          >
            <option value="all">সব ধরন</option>
            <option value="deposit">জমা</option>
            <option value="withdraw">উত্তোলন</option>
            <option value="bonus">বোনাস</option>
            <option value="bet">বাজি</option>
          </select>
        </div>
        
        <div className="relative flex-1 min-w-[140px]">
          <div className="absolute inset-y-0 left-2 flex items-center pointer-events-none">
            <ArrowDownUp size={14} className="text-teal-400" />
          </div>
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full bg-teal-800/60 border border-teal-700/50 text-teal-100 text-xs rounded-lg pl-8 pr-2 py-2 appearance-none focus:outline-none focus:border-teal-500"
          >
            <option value="date_desc">নতুন থেকে পুরানো</option>
            <option value="date_asc">পুরানো থেকে নতুন</option>
            <option value="amount_desc">অ্যামাউন্ট (বেশি থেকে কম)</option>
            <option value="amount_asc">অ্যামাউন্ট (কম থেকে বেশি)</option>
          </select>
        </div>
      </div>
      
      {filteredAndSortedTransactions.length > 0 ? (
        filteredAndSortedTransactions.map((trx: any) => (
          <div key={trx.id} onClick={() => setSelectedTrx(trx)} className="bg-teal-800/40 rounded-xl p-3 border border-teal-700/50 flex items-center justify-between cursor-pointer hover:bg-teal-700/50 transition-colors">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                trx.type === 'deposit' ? 'bg-blue-500/20 text-blue-400' :
                trx.type === 'withdraw' ? 'bg-orange-500/20 text-orange-400' :
                trx.type === 'bonus' ? 'bg-yellow-500/20 text-yellow-400' :
                'bg-purple-500/20 text-purple-400'
              }`}>
                {trx.type === 'deposit' && <ArrowDownLeft size={18} />}
                {trx.type === 'withdraw' && <ArrowUpRight size={18} />}
                {trx.type === 'bonus' && <Gift size={18} />}
                {trx.type === 'bet' && <Gamepad2 size={18} />}
              </div>
              <div>
                <p className="text-sm font-bold text-white">
                  {trx.type === 'deposit' ? 'জমা' :
                   trx.type === 'withdraw' ? 'উত্তোলন' :
                   trx.type === 'bonus' ? 'বোনাস' : 'বাজি'}
                </p>
                <div className="flex flex-col gap-0.5 mt-0.5">
                  <div className="flex items-center gap-1 text-[10px] text-teal-200">
                    <Clock size={10} /> {trx.date}
                  </div>
                  {email && (
                    <div className="flex items-center gap-1 text-[10px] text-teal-400">
                      <Mail size={10} /> {email}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className={`text-sm font-bold ${trx.amount.startsWith('+') ? 'text-green-400' : 'text-white'}`}>
                {trx.amount}
              </p>
              <p className={`text-[10px] mt-0.5 ${trx.statusColor}`}>{trx.status}</p>
            </div>
          </div>
        ))
      ) : (
        <div className="text-center py-8 text-teal-300/50">
          কোনো লেনদেন পাওয়া যায়নি
        </div>
      )}

      {/* Transaction Details Modal */}
      {selectedTrx && (
        <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4" onClick={() => setSelectedTrx(null)}>
          <div className="bg-teal-900 rounded-2xl p-6 max-w-sm w-full border border-teal-700 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">লেনদেনের বিস্তারিত</h3>
              <button onClick={() => setSelectedTrx(null)} className="text-teal-300 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-teal-800">
                <span className="text-teal-300 text-sm">লেনদেন আইডি:</span>
                <span className="text-white font-mono font-bold">{selectedTrx.trxId}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-teal-800">
                <span className="text-teal-300 text-sm">পদ্ধতি:</span>
                <span className="text-white font-bold">{selectedTrx.method}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-teal-800">
                <span className="text-teal-300 text-sm">ধরন:</span>
                <span className="text-white font-bold">
                  {selectedTrx.type === 'deposit' ? 'জমা' :
                   selectedTrx.type === 'withdraw' ? 'উত্তোলন' :
                   selectedTrx.type === 'bonus' ? 'বোনাস' : 'বাজি'}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-teal-800">
                <span className="text-teal-300 text-sm">পরিমাণ:</span>
                <span className={`font-bold ${selectedTrx.amount.startsWith('+') ? 'text-green-400' : 'text-white'}`}>{selectedTrx.amount}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-teal-800">
                <span className="text-teal-300 text-sm">তারিখ:</span>
                <span className="text-white">{selectedTrx.date}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-teal-300 text-sm">অবস্থা:</span>
                <span className={`font-bold ${selectedTrx.statusColor}`}>{selectedTrx.status}</span>
              </div>
            </div>
            <button 
              onClick={() => setSelectedTrx(null)}
              className="w-full mt-6 bg-yellow-500 text-black font-bold py-3 rounded-lg hover:bg-yellow-400 transition-colors"
            >
              বন্ধ করুন
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function SettingsTab({ profileData, onLogout }: { profileData: any, onLogout: () => void }) {
  const [activeSettingsTab, setActiveSettingsTab] = useState<'general' | 'history'>('general');
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [twoFAMethod, setTwoFAMethod] = useState<'app' | 'sms'>('app');
  const [isGoogleLinked, setIsGoogleLinked] = useState(false);
  const [isFacebookLinked, setIsFacebookLinked] = useState(false);
  const [isConfirmingLogout, setIsConfirmingLogout] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [email, setEmail] = useState(profileData?.email || "");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailSuccess, setEmailSuccess] = useState<string | null>(null);
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);

  // 2FA Setup States
  const [isSettingUp2FA, setIsSettingUp2FA] = useState(false);
  const [setupStep, setSetupStep] = useState(1);
  const [verificationCode, setVerificationCode] = useState("");
  const [phoneNumber, setPhoneNumber] = useState(profileData?.phone || "");
  const [isVerifying, setIsVerifying] = useState(false);
  const [setupError, setSetupError] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [isConfirmingDisable2FA, setIsConfirmingDisable2FA] = useState(false);
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [showRecoveryCodes, setShowRecoveryCodes] = useState(false);

  const secretKey = "JBSWY3DPEHPK3PXP"; // Mock secret key

  const generateRecoveryCodes = () => {
    const codes = Array.from({ length: 8 }, () => 
      Math.random().toString(36).substring(2, 10).toUpperCase()
    );
    setRecoveryCodes(codes);
  };

  const handleCopySecret = () => {
    navigator.clipboard.writeText(secretKey);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleStart2FASetup = () => {
    setIsSettingUp2FA(true);
    setSetupStep(1);
    setSetupError(null);
    setVerificationCode("");
  };

  const handleVerify2FA = async () => {
    if (verificationCode.length !== 6) {
      setSetupError("৬ ডিজিটের কোড প্রদান করুন। (Please enter a 6-digit code.)");
      return;
    }

    setIsVerifying(true);
    setSetupError(null);
    try {
      // Simulate verification
      await new Promise(resolve => setTimeout(resolve, 1500));
      if (verificationCode === "123456") { // Mock success code
        generateRecoveryCodes();
        setShowRecoveryCodes(true);
        setSetupStep(4); // Move to recovery codes step
      } else {
        setSetupError("ভুল কোড। অনুগ্রহ করে আবার চেষ্টা করুন। (Invalid code. Please try again.)");
      }
    } catch (err) {
      setSetupError("যাচাইকরণ ব্যর্থ হয়েছে। (Verification failed.)");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleFinish2FASetup = () => {
    setIs2FAEnabled(true);
    setIsSettingUp2FA(false);
    setShowRecoveryCodes(false);
    setSetupStep(1);
  };

  const handleDisable2FA = () => {
    setIs2FAEnabled(false);
    setIsConfirmingDisable2FA(false);
  };

  const [idStatus, setIdStatus] = useState<'unverified' | 'pending' | 'verified'>('unverified');
  const [selfieStatus, setSelfieStatus] = useState<'unverified' | 'pending' | 'verified'>('unverified');
  const idInputRef = useRef<HTMLInputElement>(null);
  const selfieInputRef = useRef<HTMLInputElement>(null);

  const handleIdUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setIdStatus('pending');
      setTimeout(() => setIdStatus('verified'), 3000);
    }
  };

  const handleSelfieUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelfieStatus('pending');
      setTimeout(() => setSelfieStatus('verified'), 3000);
    }
  };

  const isFullyVerified = idStatus === 'verified' && selfieStatus === 'verified';
  const isPending = idStatus === 'pending' || selfieStatus === 'pending';

  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError(null);
    setEmailSuccess(null);

    if (!email.trim()) {
      setEmailError("ইমেইল ঠিকানা আবশ্যক। (Email address is required.)");
      return;
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      setEmailError("সঠিক ইমেইল ঠিকানা প্রদান করুন। (Please provide a valid email address.)");
      return;
    }

    if (email === profileData?.email) {
      setEmailError("নতুন ইমেইল ঠিকানা প্রদান করুন। (Please provide a new email address.)");
      return;
    }

    setIsUpdatingEmail(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setEmailSuccess("ইমেইল সফলভাবে আপডেট করা হয়েছে। (Email updated successfully.)");
    } catch (err) {
      setEmailError("ইমেইল আপডেট করতে সমস্যা হয়েছে। (Failed to update email.)");
    } finally {
      setIsUpdatingEmail(false);
    }
  };

  const handleForgotPassword = async () => {
    setPasswordError(null);
    setPasswordSuccess(null);
    
    if (!profileData?.email && !email) {
      setPasswordError("পাসওয়ার্ড রিসেট করতে আপনার অ্যাকাউন্টে একটি ইমেইল যুক্ত থাকতে হবে। (An email must be linked to your account to reset password.)");
      return;
    }

    setIsChangingPassword(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      setPasswordSuccess(`আপনার ইমেইলে (${email || profileData?.email}) একটি পাসওয়ার্ড রিসেট লিঙ্ক পাঠানো হয়েছে। (A password reset link has been sent to your email.)`);
    } catch (err) {
      setPasswordError("পাসওয়ার্ড রিসেট লিঙ্ক পাঠাতে সমস্যা হয়েছে। (Failed to send reset link.)");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError("সবগুলো ফিল্ড পূরণ করুন। (Please fill all fields.)");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("নতুন পাসওয়ার্ড এবং কনফার্ম পাসওয়ার্ড মিলছে না। (Passwords do not match.)");
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError("নতুন পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে। (Password must be at least 6 characters.)");
      return;
    }

    setIsChangingPassword(true);
    try {
      // Simulate API call for password change
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In a real app, you would make a fetch call here:
      // const res = await fetch('/api/user/password', { method: 'POST', body: JSON.stringify({ currentPassword, newPassword }) });
      // if (!res.ok) throw new Error('Failed to change password');
      
      setPasswordSuccess("পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে। (Password changed successfully.)");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      
      // Close modal after showing success message
      setTimeout(() => {
        setIsPasswordModalOpen(false);
        setPasswordSuccess(null);
      }, 2000);
    } catch (err) {
      setPasswordError("পাসওয়ার্ড পরিবর্তন করতে সমস্যা হয়েছে। (Failed to change password.)");
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Settings Sub-Tabs */}
      <div className="flex p-1 bg-teal-900/40 rounded-xl border border-teal-700/50">
        <button 
          onClick={() => setActiveSettingsTab('general')}
          className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${activeSettingsTab === 'general' ? 'bg-teal-600 text-white shadow-lg' : 'text-teal-300 hover:text-white'}`}
        >
          <Settings size={14} /> সাধারণ সেটিংস
        </button>
        <button 
          onClick={() => setActiveSettingsTab('history')}
          className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${activeSettingsTab === 'history' ? 'bg-teal-600 text-white shadow-lg' : 'text-teal-300 hover:text-white'}`}
        >
          <Clock size={14} /> লেনদেনের ইতিহাস
        </button>
      </div>

      {activeSettingsTab === 'general' ? (
        <>
          {/* Security Center Section */}
          <div className="bg-teal-800/40 rounded-xl border border-teal-700/50 overflow-hidden">
        <div className="p-3 border-b border-teal-700/50">
          <h3 className="font-bold text-white text-sm flex items-center gap-2">
            <Shield size={16} className="text-yellow-400" /> নিরাপত্তা কেন্দ্র (Security Center)
          </h3>
        </div>
        <div className="divide-y divide-teal-700/50">
          <button 
            onClick={() => setIsPasswordModalOpen(true)}
            className="w-full flex items-center justify-between p-3 hover:bg-teal-700/30 transition-colors"
          >
            <div className="flex items-center gap-3">
              <KeyRound size={16} className="text-teal-300" />
              <span className="text-sm text-teal-50">পাসওয়ার্ড পরিবর্তন (Change Password)</span>
            </div>
            <ChevronRight size={16} className="text-teal-500" />
          </button>
          <button className="w-full flex items-center justify-between p-3 hover:bg-teal-700/30 transition-colors">
            <div className="flex items-center gap-3">
              <Bell size={16} className="text-teal-300" />
              <span className="text-sm text-teal-50">বিজ্ঞপ্তি সেটিংস (Notification Settings)</span>
            </div>
            <ChevronRight size={16} className="text-teal-500" />
          </button>
          
          {/* 2FA Setup inside Security Center */}
          <div className="p-3">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <Shield size={16} className={is2FAEnabled ? "text-green-400" : "text-teal-300"} />
                <span className="text-sm text-teal-50">টু-ফ্যাক্টর প্রমাণীকরণ (2FA)</span>
              </div>
              <div 
                className={`w-10 h-5 rounded-full p-0.5 cursor-pointer transition-colors ${is2FAEnabled ? 'bg-green-500' : 'bg-gray-600'}`}
                onClick={() => is2FAEnabled ? setIsConfirmingDisable2FA(true) : handleStart2FASetup()}
              >
                <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform ${is2FAEnabled ? 'translate-x-5' : 'translate-x-0'}`}></div>
              </div>
            </div>
            
            {is2FAEnabled && !isSettingUp2FA && (
              <div className="p-3 mt-2 rounded-lg bg-green-500/10 border border-green-500/30 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-green-400" />
                  <span className="text-xs text-green-300 font-bold">2FA সক্রিয় আছে ({twoFAMethod === 'app' ? 'অ্যাপ' : 'এসএমএস'})</span>
                </div>
                <button 
                  onClick={() => setIsConfirmingDisable2FA(true)}
                  className="text-[10px] text-red-400 font-bold hover:underline"
                >
                  বন্ধ করুন (Disable)
                </button>
              </div>
            )}

            {!is2FAEnabled && !isSettingUp2FA && (
              <div className="p-3 mt-2 rounded-lg bg-teal-900/40 border border-teal-700/50 space-y-3">
                <p className="text-xs text-teal-100">আপনার অ্যাকাউন্ট আরও সুরক্ষিত রাখতে একটি পদ্ধতি নির্বাচন করুন:</p>
                
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => setTwoFAMethod('app')}
                    className={`flex flex-col items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-colors border ${twoFAMethod === 'app' ? 'bg-teal-700/50 border-teal-400 text-white shadow-inner' : 'bg-teal-800/30 border-teal-700 text-teal-200 hover:bg-teal-700/40'}`}
                  >
                    <Shield size={18} className={twoFAMethod === 'app' ? 'text-teal-300' : 'text-teal-500'} /> 
                    অথেনটিকেটর অ্যাপ
                  </button>
                  <button 
                    onClick={() => setTwoFAMethod('sms')}
                    className={`flex flex-col items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-colors border ${twoFAMethod === 'sms' ? 'bg-teal-700/50 border-teal-400 text-white shadow-inner' : 'bg-teal-800/30 border-teal-700 text-teal-200 hover:bg-teal-700/40'}`}
                  >
                    <Smartphone size={18} className={twoFAMethod === 'sms' ? 'text-teal-300' : 'text-teal-500'} /> 
                    এসএমএস (SMS)
                  </button>
                </div>
                
                <button 
                  onClick={handleStart2FASetup}
                  className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 text-black font-bold py-2 rounded-lg shadow-md hover:from-yellow-400 hover:to-yellow-500 transition-colors text-xs flex items-center justify-center gap-2"
                >
                  <Settings size={14} />
                  {twoFAMethod === 'app' ? 'অ্যাপ সেটআপ করুন' : 'এসএমএস সেটআপ করুন'}
                </button>
              </div>
            )}

            {isSettingUp2FA && (
              <div className="p-4 mt-2 rounded-xl bg-teal-900/60 border border-teal-500/30 space-y-4 animate-in fade-in zoom-in-95 duration-300">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    {twoFAMethod === 'app' ? <Shield size={16} className="text-teal-400" /> : <Smartphone size={16} className="text-teal-400" />}
                    {twoFAMethod === 'app' ? 'অথেনটিকেটর অ্যাপ সেটআপ' : 'এসএমএস ভেরিফিকেশন সেটআপ'}
                  </h4>
                  <button onClick={() => setIsSettingUp2FA(false)} className="text-teal-400 hover:text-white">
                    <X size={16} />
                  </button>
                </div>

                {/* Progress Steps */}
                <div className="flex items-center justify-between px-2">
                  {[1, 2, 3, 4].map((step) => (
                    <div key={step} className="flex items-center">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border ${setupStep >= step ? 'bg-teal-500 border-teal-400 text-white shadow-[0_0_10px_rgba(20,184,166,0.5)]' : 'bg-teal-900 border-teal-700 text-teal-500'}`}>
                        {step}
                      </div>
                      {step < 4 && <div className={`w-10 h-0.5 mx-1 ${setupStep > step ? 'bg-teal-500' : 'bg-teal-800'}`}></div>}
                    </div>
                  ))}
                </div>

                {/* Step Content */}
                <div className="space-y-4">
                  {twoFAMethod === 'app' ? (
                    <>
                      {setupStep === 1 && (
                        <div className="space-y-3">
                          <p className="text-xs text-teal-100 leading-relaxed">
                            ১. আপনার ফোনে <span className="text-yellow-400 font-bold">Google Authenticator</span> বা <span className="text-yellow-400 font-bold">Authy</span> অ্যাপটি ডাউনলোড করুন।
                          </p>
                          <div className="flex justify-center py-2">
                            <div className="p-3 bg-white rounded-xl shadow-lg">
                              <QrCode size={120} className="text-black" />
                            </div>
                          </div>
                          <p className="text-[10px] text-teal-300 text-center italic">উপরের QR কোডটি আপনার অথেনটিকেটর অ্যাপ দিয়ে স্ক্যান করুন।</p>
                          <button 
                            onClick={() => setSetupStep(2)}
                            className="w-full bg-teal-600 hover:bg-teal-500 text-white font-bold py-2.5 rounded-lg text-xs transition-all"
                          >
                            পরবর্তী ধাপ (Next Step)
                          </button>
                        </div>
                      )}

                      {setupStep === 2 && (
                        <div className="space-y-3">
                          <p className="text-xs text-teal-100 leading-relaxed">
                            ২. যদি QR কোড স্ক্যান করতে না পারেন, তবে নিচের সিক্রেট কি-টি ম্যানুয়ালি প্রবেশ করান:
                          </p>
                          <div className="bg-black/40 border border-teal-700/50 rounded-lg p-3 flex items-center justify-between">
                            <code className="text-yellow-400 font-mono text-sm tracking-wider">{secretKey}</code>
                            <button 
                              onClick={handleCopySecret}
                              className="p-2 hover:bg-white/10 rounded-lg transition-colors text-teal-400"
                            >
                              {isCopied ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
                            </button>
                          </div>
                          <div className="bg-yellow-500/10 border border-yellow-500/30 p-3 rounded-lg">
                            <p className="text-[10px] text-yellow-200 leading-relaxed">
                              <AlertCircle size={10} className="inline mr-1 mb-0.5" />
                              এই কি-টি নিরাপদ স্থানে সংরক্ষণ করুন। আপনার ফোন হারিয়ে গেলে এটি অ্যাকাউন্ট পুনরুদ্ধারে সাহায্য করবে।
                            </p>
                          </div>
                          <button 
                            onClick={() => setSetupStep(3)}
                            className="w-full bg-teal-600 hover:bg-teal-500 text-white font-bold py-2.5 rounded-lg text-xs transition-all"
                          >
                            পরবর্তী ধাপ (Next Step)
                          </button>
                        </div>
                      )}

                      {setupStep === 3 && (
                        <div className="space-y-4">
                          <p className="text-xs text-teal-100 leading-relaxed">
                            ৩. আপনার অথেনটিকেটর অ্যাপ থেকে ৬ ডিজিটের কোডটি এখানে লিখুন:
                          </p>
                          <div className="relative">
                            <input 
                              type="text" 
                              maxLength={6}
                              value={verificationCode}
                              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                              placeholder="000000"
                              className="w-full bg-black/50 border border-teal-500 rounded-xl py-3 text-center text-2xl font-black tracking-[0.5em] text-white focus:outline-none focus:ring-2 focus:ring-teal-500/50 transition-all"
                            />
                          </div>
                          {setupError && <p className="text-[10px] text-red-400 text-center">{setupError}</p>}
                          <button 
                            onClick={handleVerify2FA}
                            disabled={isVerifying || verificationCode.length !== 6}
                            className={`w-full bg-gradient-to-r from-green-500 to-green-600 text-white font-black py-3 rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 ${isVerifying || verificationCode.length !== 6 ? 'opacity-50 grayscale' : 'hover:from-green-400 hover:to-green-500'}`}
                          >
                            {isVerifying ? <RefreshCw size={18} className="animate-spin" /> : <Shield size={18} />}
                            ভেরিফাই করুন
                          </button>
                        </div>
                      )}

                      {setupStep === 4 && (
                        <div className="space-y-4">
                          <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                            <p className="text-xs text-yellow-200 font-bold mb-1 flex items-center gap-2">
                              <AlertCircle size={14} /> রিকভারি কোড (Recovery Codes)
                            </p>
                            <p className="text-[10px] text-teal-200">আপনার ফোন হারিয়ে গেলে এই কোডগুলো দিয়ে লগইন করতে পারবেন। এগুলো কোথাও লিখে রাখুন।</p>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2 bg-black/40 p-3 rounded-xl border border-teal-700/50">
                            {recoveryCodes.map((code, idx) => (
                              <div key={idx} className="text-xs font-mono text-teal-100 flex items-center gap-2">
                                <span className="text-teal-500 w-4">{idx + 1}.</span>
                                {code}
                              </div>
                            ))}
                          </div>
                          
                          <div className="flex gap-2">
                            <button className="flex-1 bg-teal-800 hover:bg-teal-700 text-teal-100 py-2 rounded-lg text-[10px] font-bold flex items-center justify-center gap-2">
                              <Download size={14} /> ডাউনলোড করুন
                            </button>
                            <button className="flex-1 bg-teal-800 hover:bg-teal-700 text-teal-100 py-2 rounded-lg text-[10px] font-bold flex items-center justify-center gap-2">
                              <Copy size={14} /> কপি করুন
                            </button>
                          </div>
                          
                          <button 
                            onClick={handleFinish2FASetup}
                            className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-xl text-sm transition-all"
                          >
                            সেটআপ সম্পন্ন করুন
                          </button>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      {setupStep === 1 && (
                        <div className="space-y-4">
                          <p className="text-xs text-teal-100 leading-relaxed">
                            ১. আপনার মোবাইল নম্বরটি নিশ্চিত করুন যেখানে ভেরিফিকেশন কোড পাঠানো হবে:
                          </p>
                          <div className="relative">
                            <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 text-teal-500" size={18} />
                            <input 
                              type="tel" 
                              value={phoneNumber}
                              onChange={(e) => setPhoneNumber(e.target.value)}
                              placeholder="01XXXXXXXXX"
                              className="w-full bg-black/40 border border-teal-700/50 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-teal-500 transition-all"
                            />
                          </div>
                          <button 
                            onClick={() => setSetupStep(2)}
                            className="w-full bg-teal-600 hover:bg-teal-500 text-white font-bold py-2.5 rounded-lg text-xs transition-all"
                          >
                            কোড পাঠান (Send Code)
                          </button>
                        </div>
                      )}

                      {setupStep === 2 && (
                        <div className="space-y-4">
                          <p className="text-xs text-teal-100 leading-relaxed text-center">
                            আপনার <span className="text-yellow-400 font-bold">{phoneNumber}</span> নম্বরে একটি ৬ ডিজিটের কোড পাঠানো হয়েছে।
                          </p>
                          <div className="relative">
                            <input 
                              type="text" 
                              maxLength={6}
                              value={verificationCode}
                              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                              placeholder="000000"
                              className="w-full bg-black/50 border border-teal-500 rounded-xl py-3 text-center text-2xl font-black tracking-[0.5em] text-white focus:outline-none focus:ring-2 focus:ring-teal-500/50 transition-all"
                            />
                          </div>
                          {setupError && <p className="text-[10px] text-red-400 text-center">{setupError}</p>}
                          <div className="flex justify-center">
                            <button className="text-[10px] text-teal-400 hover:underline">কোড পাননি? আবার পাঠান</button>
                          </div>
                          <button 
                            onClick={handleVerify2FA}
                            disabled={isVerifying || verificationCode.length !== 6}
                            className={`w-full bg-gradient-to-r from-green-500 to-green-600 text-white font-black py-3 rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 ${isVerifying || verificationCode.length !== 6 ? 'opacity-50 grayscale' : 'hover:from-green-400 hover:to-green-500'}`}
                          >
                            {isVerifying ? <RefreshCw size={18} className="animate-spin" /> : <Shield size={18} />}
                            ভেরিফাই করুন
                          </button>
                        </div>
                      )}

                      {setupStep === 4 && (
                        <div className="space-y-4">
                          <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                            <p className="text-xs text-yellow-200 font-bold mb-1 flex items-center gap-2">
                              <AlertCircle size={14} /> রিকভারি কোড (Recovery Codes)
                            </p>
                            <p className="text-[10px] text-teal-200">আপনার ফোন হারিয়ে গেলে এই কোডগুলো দিয়ে লগইন করতে পারবেন। এগুলো কোথাও লিখে রাখুন।</p>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2 bg-black/40 p-3 rounded-xl border border-teal-700/50">
                            {recoveryCodes.map((code, idx) => (
                              <div key={idx} className="text-xs font-mono text-teal-100 flex items-center gap-2">
                                <span className="text-teal-500 w-4">{idx + 1}.</span>
                                {code}
                              </div>
                            ))}
                          </div>
                          
                          <div className="flex gap-2">
                            <button className="flex-1 bg-teal-800 hover:bg-teal-700 text-teal-100 py-2 rounded-lg text-[10px] font-bold flex items-center justify-center gap-2">
                              <Download size={14} /> ডাউনলোড করুন
                            </button>
                            <button className="flex-1 bg-teal-800 hover:bg-teal-700 text-teal-100 py-2 rounded-lg text-[10px] font-bold flex items-center justify-center gap-2">
                              <Copy size={14} /> কপি করুন
                            </button>
                          </div>
                          
                          <button 
                            onClick={handleFinish2FASetup}
                            className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-xl text-sm transition-all"
                          >
                            সেটআপ সম্পন্ন করুন
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* General Settings Section */}
      <div className="bg-teal-800/40 rounded-xl border border-teal-700/50 overflow-hidden">
        <div className="p-3 border-b border-teal-700/50">
          <h3 className="font-bold text-white text-sm">সাধারণ সেটিংস (General Settings)</h3>
        </div>
        <div className="divide-y divide-teal-700/50">
          <div className="p-4 space-y-3">
            <label className="text-xs text-teal-200 font-medium flex items-center gap-2">
              <Mail size={14} className="text-teal-400" /> ইমেইল ঠিকানা (Email Address)
            </label>
            <form onSubmit={handleUpdateEmail} className="space-y-2">
              <div className="flex gap-2">
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="flex-1 bg-teal-950/50 border border-teal-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-400 transition-colors"
                  placeholder="আপনার ইমেইল লিখুন"
                />
                <button 
                  type="submit"
                  disabled={isUpdatingEmail}
                  className="bg-teal-600 hover:bg-teal-500 disabled:bg-teal-800 text-white px-4 py-2 rounded-lg text-xs font-bold transition-colors flex items-center gap-2"
                >
                  {isUpdatingEmail ? <RefreshCw size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                  আপডেট
                </button>
              </div>
              {emailError && <p className="text-[10px] text-red-400">{emailError}</p>}
              {emailSuccess && <p className="text-[10px] text-green-400">{emailSuccess}</p>}
            </form>
          </div>
          <button className="w-full flex items-center justify-between p-3 hover:bg-teal-700/30 transition-colors">
            <div className="flex items-center gap-3">
              <Settings size={16} className="text-teal-300" />
              <span className="text-sm text-teal-50">ভাষা (Language)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-teal-200">বাংলা</span>
              <ChevronRight size={16} className="text-teal-500" />
            </div>
          </button>
        </div>
      </div>

      {/* Account Verification Section */}
      <div className="bg-teal-800/40 rounded-xl border border-teal-700/50 overflow-hidden">
        <div className="p-3 border-b border-teal-700/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BadgeCheck size={16} className="text-teal-400" />
            <h3 className="font-bold text-white text-sm">অ্যাকাউন্ট যাচাইকরণ</h3>
          </div>
          {isFullyVerified ? (
            <span className="bg-green-500/20 text-green-400 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border border-green-500/30">
              <CheckCircle2 size={10} /> যাচাইকৃত
            </span>
          ) : isPending ? (
            <span className="bg-yellow-500/20 text-yellow-400 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border border-yellow-500/30">
              <RefreshCw size={10} className="animate-spin" /> প্রক্রিয়াধীন
            </span>
          ) : (
            <span className="bg-red-500/20 text-red-400 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border border-red-500/30">
              <AlertCircle size={10} /> যাচাই করা হয়নি
            </span>
          )}
        </div>
        
        <div className="p-4 space-y-3 bg-teal-900/20">
          <p className="text-xs text-teal-100">আপনার অ্যাকাউন্ট সম্পূর্ণ সুরক্ষিত করতে এবং উত্তোলনের সীমা বাড়াতে আপনার পরিচয় যাচাই করুন।</p>
          
          <div className="space-y-2">
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              ref={idInputRef} 
              onChange={handleIdUpload} 
            />
            <button 
              onClick={() => idStatus === 'unverified' && idInputRef.current?.click()}
              disabled={idStatus !== 'unverified'}
              className={`w-full flex items-center justify-between p-3 border rounded-lg transition-colors ${
                idStatus === 'verified' ? 'bg-green-900/20 border-green-700/50 cursor-default' : 
                idStatus === 'pending' ? 'bg-yellow-900/20 border-yellow-700/50 cursor-default' : 
                'bg-teal-800/30 border-teal-700 hover:bg-teal-700/40'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${
                  idStatus === 'verified' ? 'bg-green-700/50 text-green-300' : 
                  idStatus === 'pending' ? 'bg-yellow-700/50 text-yellow-300' : 
                  'bg-teal-700/50 text-teal-300'
                }`}>
                  <FileText size={16} />
                </div>
                <div className="text-left">
                  <div className="text-sm text-teal-50 font-medium">আইডি কার্ড আপলোড</div>
                  <div className="text-[10px] text-teal-200">জাতীয় পরিচয়পত্র বা পাসপোর্ট</div>
                </div>
              </div>
              {idStatus === 'verified' ? (
                <CheckCircle2 size={16} className="text-green-500" />
              ) : idStatus === 'pending' ? (
                <RefreshCw size={16} className="text-yellow-500 animate-spin" />
              ) : (
                <ChevronRight size={16} className="text-teal-500" />
              )}
            </button>
            
            <input 
              type="file" 
              accept="image/*" 
              capture="user"
              className="hidden" 
              ref={selfieInputRef} 
              onChange={handleSelfieUpload} 
            />
            <button 
              onClick={() => selfieStatus === 'unverified' && selfieInputRef.current?.click()}
              disabled={selfieStatus !== 'unverified'}
              className={`w-full flex items-center justify-between p-3 border rounded-lg transition-colors ${
                selfieStatus === 'verified' ? 'bg-green-900/20 border-green-700/50 cursor-default' : 
                selfieStatus === 'pending' ? 'bg-yellow-900/20 border-yellow-700/50 cursor-default' : 
                'bg-teal-800/30 border-teal-700 hover:bg-teal-700/40'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${
                  selfieStatus === 'verified' ? 'bg-green-700/50 text-green-300' : 
                  selfieStatus === 'pending' ? 'bg-yellow-700/50 text-yellow-300' : 
                  'bg-teal-700/50 text-teal-300'
                }`}>
                  <Camera size={16} />
                </div>
                <div className="text-left">
                  <div className="text-sm text-teal-50 font-medium">সেলফি যাচাইকরণ</div>
                  <div className="text-[10px] text-teal-200">আপনার চেহারার লাইভ ছবি</div>
                </div>
              </div>
              {selfieStatus === 'verified' ? (
                <CheckCircle2 size={16} className="text-green-500" />
              ) : selfieStatus === 'pending' ? (
                <RefreshCw size={16} className="text-yellow-500 animate-spin" />
              ) : (
                <ChevronRight size={16} className="text-teal-500" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Linked Accounts Section */}
      <div className="bg-teal-800/40 rounded-xl border border-teal-700/50 overflow-hidden">
        <div className="p-3 border-b border-teal-700/50 flex items-center gap-2">
          <Link size={16} className="text-teal-400" />
          <h3 className="font-bold text-white text-sm">লিঙ্ক করা অ্যাকাউন্ট (Linked Accounts)</h3>
        </div>
        
        <div className="p-4 space-y-3 bg-teal-900/20">
          <p className="text-xs text-teal-100">দ্রুত লগইন করতে আপনার সামাজিক মিডিয়া অ্যাকাউন্টগুলো লিঙ্ক করুন।</p>
          
          <div className="space-y-2">
            {/* Google Account */}
            <div className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all duration-300 ${isGoogleLinked ? 'bg-teal-800/50 border-teal-500/50 shadow-[0_0_10px_rgba(20,184,166,0.15)]' : 'bg-teal-900/30 border-teal-800/50 opacity-80'}`}>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full transition-colors ${isGoogleLinked ? 'bg-red-500/20' : 'bg-gray-800/50'}`}>
                  <Mail size={16} className={isGoogleLinked ? 'text-red-400' : 'text-gray-400'} />
                </div>
                <div className="text-left">
                  <div className={`text-sm font-medium ${isGoogleLinked ? 'text-teal-50' : 'text-gray-300'}`}>Google</div>
                  <div className={`text-[10px] flex items-center gap-1 ${isGoogleLinked ? 'text-teal-300' : 'text-gray-500'}`}>
                    {isGoogleLinked && <CheckCircle2 size={10} />}
                    {isGoogleLinked ? 'সংযুক্ত (Linked)' : 'সংযুক্ত নয় (Not Linked)'}
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setIsGoogleLinked(!isGoogleLinked)}
                className={`px-3 py-1.5 rounded text-xs font-bold transition-colors ${isGoogleLinked ? 'bg-teal-900/50 text-teal-400 hover:bg-teal-900 border border-teal-700/50' : 'bg-teal-600 text-white hover:bg-teal-500 shadow-md'}`}
              >
                {isGoogleLinked ? 'বিচ্ছিন্ন করুন' : 'লিঙ্ক করুন'}
              </button>
            </div>
            
            {/* Facebook Account */}
            <div className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all duration-300 ${isFacebookLinked ? 'bg-teal-800/50 border-teal-500/50 shadow-[0_0_10px_rgba(20,184,166,0.15)]' : 'bg-teal-900/30 border-teal-800/50 opacity-80'}`}>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full transition-colors ${isFacebookLinked ? 'bg-blue-500/20' : 'bg-gray-800/50'}`}>
                  <Facebook size={16} className={isFacebookLinked ? 'text-blue-400' : 'text-gray-400'} />
                </div>
                <div className="text-left">
                  <div className={`text-sm font-medium ${isFacebookLinked ? 'text-teal-50' : 'text-gray-300'}`}>Facebook</div>
                  <div className={`text-[10px] flex items-center gap-1 ${isFacebookLinked ? 'text-teal-300' : 'text-gray-500'}`}>
                    {isFacebookLinked && <CheckCircle2 size={10} />}
                    {isFacebookLinked ? 'সংযুক্ত (Linked)' : 'সংযুক্ত নয় (Not Linked)'}
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setIsFacebookLinked(!isFacebookLinked)}
                className={`px-3 py-1.5 rounded text-xs font-bold transition-colors ${isFacebookLinked ? 'bg-teal-900/50 text-teal-400 hover:bg-teal-900 border border-teal-700/50' : 'bg-teal-600 text-white hover:bg-teal-500 shadow-md'}`}
              >
                {isFacebookLinked ? 'বিচ্ছিন্ন করুন' : 'লিঙ্ক করুন'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-teal-800/40 rounded-xl border border-teal-700/50 overflow-hidden">
        <div className="p-3 border-b border-teal-700/50">
          <h3 className="font-bold text-white text-sm">সমর্থন</h3>
        </div>
        <div className="divide-y divide-teal-700/50">
          <button onClick={() => setIsChatOpen(true)} className="w-full flex items-center justify-between p-3 hover:bg-teal-700/30 transition-colors">
            <div className="flex items-center gap-3">
              <Headset size={16} className="text-teal-300" />
              <span className="text-sm text-teal-50">গ্রাহক সেবা (24/7)</span>
            </div>
            <ChevronRight size={16} className="text-teal-500" />
          </button>
          <a 
            href="https://t.me/spin71bet" 
            target="_blank" 
            rel="noopener noreferrer"
            className="w-full flex items-center justify-between p-3 hover:bg-teal-700/30 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Send size={16} className="text-blue-400" />
              <span className="text-sm text-teal-50">টেলিগ্রাম চ্যানেল (Telegram)</span>
            </div>
            <ChevronRight size={16} className="text-teal-500" />
          </a>
          <button className="w-full flex items-center justify-between p-3 hover:bg-teal-700/30 transition-colors">
            <div className="flex items-center gap-3">
              <Shield size={16} className="text-teal-300" />
              <span className="text-sm text-teal-50">শর্তাবলী</span>
            </div>
            <ChevronRight size={16} className="text-teal-500" />
          </button>
          <a href="#faq" className="w-full flex items-center justify-between p-3 hover:bg-teal-700/30 transition-colors">
            <div className="flex items-center gap-3">
              <HelpCircle size={16} className="text-teal-300" />
              <span className="text-sm text-teal-50">সচরাচর জিজ্ঞাসিত প্রশ্ন (FAQ)</span>
            </div>
            <ChevronRight size={16} className="text-teal-500" />
          </a>
        </div>
      </div>

      <button 
        onClick={() => setIsConfirmingLogout(true)}
        className="w-full bg-red-500/10 border border-red-500/30 text-red-400 font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-red-500/20 transition-colors mt-6"
      >
        <LogOut size={18} /> লগ আউট
      </button>

      {/* Logout Confirmation Modal */}
      {isConfirmingLogout && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-teal-900 border border-teal-500/30 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="p-6 text-center space-y-4">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
                <AlertTriangle size={32} className="text-red-500" />
              </div>
              <h3 className="text-lg font-bold text-white">লগ আউট করতে চান?</h3>
              <p className="text-sm text-teal-200">আপনি কি নিশ্চিত যে আপনি লগ আউট করতে চান?</p>
              
              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => setIsConfirmingLogout(false)}
                  className="flex-1 bg-teal-800 hover:bg-teal-700 text-teal-100 font-bold py-3 rounded-xl transition-colors"
                >
                  না
                </button>
                <button 
                  onClick={() => {
                    setIsConfirmingLogout(false);
                    onLogout();
                  }}
                  className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-xl shadow-lg transition-all active:scale-95"
                >
                  হ্যাঁ, লগ আউট করুন
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
        </>
      ) : (
        <HistoryTab email={profileData?.email} />
      )}

      {/* Password Change Modal */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-teal-950/90 p-4 backdrop-blur-sm">
          <div className="bg-teal-900 rounded-2xl border border-teal-700/50 w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-teal-700/50 flex items-center justify-between bg-teal-800/50">
              <h3 className="font-bold text-white flex items-center gap-2">
                <KeyRound size={18} className="text-teal-400" /> 
                পাসওয়ার্ড পরিবর্তন
              </h3>
              <button 
                onClick={() => {
                  setIsPasswordModalOpen(false);
                  setPasswordError(null);
                  setPasswordSuccess(null);
                  setCurrentPassword("");
                  setNewPassword("");
                  setConfirmPassword("");
                }}
                className="text-teal-400 hover:text-white p-1 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleChangePassword} className="p-5 space-y-4">
              {passwordError && (
                <div className="bg-red-900/40 border border-red-500/50 text-red-200 text-xs p-3 rounded-lg flex items-start gap-2">
                  <AlertCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
                  <span>{passwordError}</span>
                </div>
              )}
              
              {passwordSuccess && (
                <div className="bg-green-900/40 border border-green-500/50 text-green-200 text-xs p-3 rounded-lg flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-green-400 shrink-0 mt-0.5" />
                  <span>{passwordSuccess}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs text-teal-200 font-medium">বর্তমান পাসওয়ার্ড (Current Password)</label>
                  <button 
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-[10px] text-yellow-400 hover:text-yellow-300 transition-colors"
                  >
                    পাসওয়ার্ড ভুলে গেছেন? (Forgot Password?)
                  </button>
                </div>
                <input 
                  type="password" 
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full bg-teal-950/50 border border-teal-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-teal-400 transition-colors"
                  placeholder="বর্তমান পাসওয়ার্ড লিখুন"
                />
              </div>
              
              <div className="space-y-1.5">
                <label className="text-xs text-teal-200 font-medium">নতুন পাসওয়ার্ড (New Password)</label>
                <input 
                  type="password" 
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-teal-950/50 border border-teal-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-teal-400 transition-colors"
                  placeholder="নতুন পাসওয়ার্ড লিখুন (কমপক্ষে ৬ অক্ষর)"
                />
              </div>
              
              <div className="space-y-1.5">
                <label className="text-xs text-teal-200 font-medium">কনফার্ম নতুন পাসওয়ার্ড (Confirm Password)</label>
                <input 
                  type="password" 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-teal-950/50 border border-teal-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-teal-400 transition-colors"
                  placeholder="নতুন পাসওয়ার্ডটি আবার লিখুন"
                />
              </div>
              
              <button 
                type="submit"
                disabled={isChangingPassword || !!passwordSuccess}
                className="w-full bg-teal-500 hover:bg-teal-400 disabled:bg-teal-700 disabled:text-teal-400 text-white font-bold py-3 rounded-lg transition-colors mt-2 flex items-center justify-center gap-2"
              >
                {isChangingPassword ? (
                  <>
                    <RefreshCw size={18} className="animate-spin" /> পরিবর্তন হচ্ছে...
                  </>
                ) : (
                  'পাসওয়ার্ড পরিবর্তন করুন'
                )}
              </button>
            </form>
            <p className="text-[10px] text-teal-400 text-center mt-4 px-4 pb-4">
              For your security, we do not store your old password.
            </p>
          </div>
        </div>
      )}

      {/* 2FA Disable Confirmation Modal */}
      {isConfirmingDisable2FA && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-teal-900 border border-teal-500/30 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="p-6 text-center space-y-4">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
                <AlertTriangle size={32} className="text-red-500" />
              </div>
              <h3 className="text-lg font-bold text-white">2FA বন্ধ করতে চান?</h3>
              <p className="text-sm text-teal-200">2FA বন্ধ করলে আপনার অ্যাকাউন্টের নিরাপত্তা কমে যাবে। আপনি কি নিশ্চিত?</p>
              
              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => setIsConfirmingDisable2FA(false)}
                  className="flex-1 bg-teal-800 hover:bg-teal-700 text-teal-100 font-bold py-3 rounded-xl transition-colors"
                >
                  না, থাক
                </button>
                <button 
                  onClick={handleDisable2FA}
                  className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-xl shadow-lg transition-all active:scale-95"
                >
                  হ্যাঁ, বন্ধ করুন
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Support Chat */}
      <SupportChat isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </div>
  );
}
