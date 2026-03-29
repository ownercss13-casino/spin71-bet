import React, { useState, useEffect, useRef, useMemo } from "react";
import useSWR from "swr";
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
  ArrowDownUp
} from "lucide-react";

const fetcher = (url: string) => fetch(url).then(res => {
  if (!res.ok) throw new Error('Network response was not ok');
  return res.json();
});

export default function ProfileView({ onTabChange, balance }: { onTabChange: (tab: any) => void, balance: number }) {
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'history' | 'settings'>('overview');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1000);
  };
  
  const { data: profileData, error, isLoading: loading, mutate: refetchProfile } = useSWR('/api/user/profile', fetcher, {
    revalidateOnFocus: true,
    dedupingInterval: 5000,
  });

  if (loading) {
    return (
      <div className="flex-1 overflow-y-auto pb-20 flex items-center justify-center">
        <div className="text-teal-200 animate-pulse flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 animate-spin text-teal-400" />
          <span>লোডিং... (Loading...)</span>
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
            <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-yellow-400 to-yellow-600 p-1.5 shadow-xl">
              <div className="w-full h-full bg-[#16a374] rounded-full flex items-center justify-center border-4 border-white">
                <User size={48} className="text-white" />
              </div>
            </div>
            <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-yellow-500 to-yellow-700 text-black text-xs font-black px-3 py-1 rounded-full border-2 border-yellow-300 shadow-lg">
              VIP {profileData?.vipLevel || 3}
            </div>
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-black text-white drop-shadow-md tracking-tight">{profileData?.username || "Player_SPIN71BET"}</h2>
            <p className="text-teal-50 text-sm font-medium opacity-90">ID: {profileData?.id || "84729104"}</p>
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
        {activeSubTab === 'overview' && <OverviewTab onTabChange={onTabChange} balance={balance} isRefreshing={isRefreshing} onRefresh={handleRefresh} />}
        {activeSubTab === 'history' && <HistoryTab />}
        {activeSubTab === 'settings' && <SettingsTab />}
      </div>
    </div>
  );
}

function OverviewTab({ onTabChange, balance, isRefreshing, onRefresh }: { onTabChange: (tab: any) => void, balance: number, isRefreshing: boolean, onRefresh: () => void }) {
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

function HistoryTab() {
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('date_desc');

  const { data: transactions, error, isLoading, mutate: refetchTransactions } = useSWR('/api/transactions', fetcher, {
    revalidateOnFocus: true,
    dedupingInterval: 5000,
  });

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

  if (isLoading) {
    return (
      <div className="flex-1 overflow-y-auto pb-20 flex items-center justify-center">
        <div className="text-teal-200 animate-pulse flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 animate-spin text-teal-400" />
          <span>লেনদেন লোড হচ্ছে... (Loading transactions...)</span>
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
          <p className="text-red-200/80 text-sm mb-4">লেনদেনের ইতিহাস লোড করতে সমস্যা হয়েছে। (Failed to load transaction history.)</p>
          <button 
            onClick={() => refetchTransactions()} 
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
          <div key={trx.id} className="bg-teal-800/40 rounded-xl p-3 border border-teal-700/50 flex items-center justify-between">
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
                <div className="flex items-center gap-1 text-[10px] text-teal-200 mt-0.5">
                  <Clock size={10} /> {trx.date}
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
    </div>
  );
}

function SettingsTab() {
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [twoFAMethod, setTwoFAMethod] = useState<'app' | 'sms'>('app');
  const [isGoogleLinked, setIsGoogleLinked] = useState(false);
  const [isFacebookLinked, setIsFacebookLinked] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessage, setChatMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<{id: number, text: string, sender: 'user' | 'agent', time: string}[]>([
    { id: 1, text: "স্বাগতম! আমরা আপনাকে কীভাবে সাহায্য করতে পারি?", sender: 'agent', time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) }
  ]);
  const [chatError, setChatError] = useState<string | null>(null);
  const [isAgentTyping, setIsAgentTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isUserTyping, setIsUserTyping] = useState(false);
  const [chatBgColor, setChatBgColor] = useState('bg-teal-900');
  const [chatFont, setChatFont] = useState('font-sans');

  useEffect(() => {
    if (isChatOpen && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatHistory, isChatOpen, isAgentTyping, isUserTyping]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setChatMessage(e.target.value);
    setIsUserTyping(e.target.value.length > 0);
    
    // Debounce user typing indicator
    const timer = setTimeout(() => setIsUserTyping(false), 2000);
    return () => clearTimeout(timer);
  };

  const handleSendMessage = async () => {
    if (!chatMessage.trim()) return;
    
    const text = chatMessage;
    setChatMessage("");
    setIsUserTyping(false);
    setChatError(null);
    
    const newUserMsg = {
      id: Date.now(),
      text,
      sender: 'user' as const,
      time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
    };
    setChatHistory(prev => [...prev, newUserMsg]);
    
    // Simulate agent typing and response
    setIsAgentTyping(true);
    setTimeout(() => {
      setIsAgentTyping(false);
      const agentResponses = [
        "আপনার সমস্যার জন্য আমরা দুঃখিত। আমরা বিষয়টি দেখছি।",
        "অনুগ্রহ করে আপনার ট্রানজ্যাকশন আইডিটি দিন।",
        "আপনার অ্যাকাউন্টটি চেক করা হচ্ছে, একটু অপেক্ষা করুন।",
        "ধন্যবাদ! আমরা শীঘ্রই আপনার সাথে যোগাযোগ করব।"
      ];
      const randomResponse = agentResponses[Math.floor(Math.random() * agentResponses.length)];
      
      setChatHistory(prev => [...prev, {
        id: Date.now() + 1,
        text: randomResponse,
        sender: 'agent',
        time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
      }]);
    }, 1500 + Math.random() * 2000); // Random delay between 1.5s and 3.5s
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
                onClick={() => setIs2FAEnabled(!is2FAEnabled)}
              >
                <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform ${is2FAEnabled ? 'translate-x-5' : 'translate-x-0'}`}></div>
              </div>
            </div>
            
            {is2FAEnabled && (
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
                
                <button className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 text-black font-bold py-2 rounded-lg shadow-md hover:from-yellow-400 hover:to-yellow-500 transition-colors text-xs flex items-center justify-center gap-2">
                  <Settings size={14} />
                  {twoFAMethod === 'app' ? 'অ্যাপ সেটআপ করুন' : 'এসএমএস সেটআপ করুন'}
                </button>
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
          <span className="bg-red-500/20 text-red-400 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border border-red-500/30">
            <AlertCircle size={10} /> যাচাই করা হয়নি
          </span>
        </div>
        
        <div className="p-4 space-y-3 bg-teal-900/20">
          <p className="text-xs text-teal-100">আপনার অ্যাকাউন্ট সম্পূর্ণ সুরক্ষিত করতে এবং উত্তোলনের সীমা বাড়াতে আপনার পরিচয় যাচাই করুন।</p>
          
          <div className="space-y-2">
            <button className="w-full flex items-center justify-between p-3 bg-teal-800/30 border border-teal-700 rounded-lg hover:bg-teal-700/40 transition-colors">
              <div className="flex items-center gap-3">
                <div className="bg-teal-700/50 p-2 rounded-full">
                  <FileText size={16} className="text-teal-300" />
                </div>
                <div className="text-left">
                  <div className="text-sm text-teal-50 font-medium">আইডি কার্ড আপলোড</div>
                  <div className="text-[10px] text-teal-200">জাতীয় পরিচয়পত্র বা পাসপোর্ট</div>
                </div>
              </div>
              <ChevronRight size={16} className="text-teal-500" />
            </button>
            
            <button className="w-full flex items-center justify-between p-3 bg-teal-800/30 border border-teal-700 rounded-lg hover:bg-teal-700/40 transition-colors">
              <div className="flex items-center gap-3">
                <div className="bg-teal-700/50 p-2 rounded-full">
                  <Camera size={16} className="text-teal-300" />
                </div>
                <div className="text-left">
                  <div className="text-sm text-teal-50 font-medium">সেলফি যাচাইকরণ</div>
                  <div className="text-[10px] text-teal-200">আপনার চেহারার লাইভ ছবি</div>
                </div>
              </div>
              <ChevronRight size={16} className="text-teal-500" />
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
          <button 
            onClick={() => {
              if (window.confirm('আপনি কি নিশ্চিত যে আপনি চ্যাট ইতিহাস মুছে ফেলতে চান?')) {
                setChatHistory([{ id: 1, text: "স্বাগতম! আমরা আপনাকে কীভাবে সাহায্য করতে পারি?", sender: 'agent', time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) }]);
              }
            }}
            className="w-full flex items-center justify-between p-3 hover:bg-red-900/30 transition-colors"
          >
            <div className="flex items-center gap-3">
              <X size={16} className="text-red-400" />
              <span className="text-sm text-red-200">চ্যাট ইতিহাস মুছুন</span>
            </div>
          </button>
        </div>
      </div>

      {/* Chat Theme Customization */}
      <div className="bg-teal-800/40 rounded-xl border border-teal-700/50 overflow-hidden">
        <div className="p-3 border-b border-teal-700/50">
          <h3 className="font-bold text-white text-sm">চ্যাট থিম কাস্টমাইজেশন</h3>
        </div>
        <div className="p-4 space-y-4">
          <div className="space-y-2">
            <label className="text-xs text-teal-200">চ্যাটের ব্যাকগ্রাউন্ড</label>
            <select 
              value={chatBgColor} 
              onChange={(e) => setChatBgColor(e.target.value)}
              className="w-full bg-teal-900/50 border border-teal-700 rounded-lg p-2 text-sm text-white"
            >
              <option value="bg-teal-900">টিল (Teal)</option>
              <option value="bg-slate-900">স্লেট (Slate)</option>
              <option value="bg-zinc-900">জিঙ্ক (Zinc)</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-xs text-teal-200">চ্যাটের ফন্ট</label>
            <select 
              value={chatFont} 
              onChange={(e) => setChatFont(e.target.value)}
              className="w-full bg-teal-900/50 border border-teal-700 rounded-lg p-2 text-sm text-white"
            >
              <option value="font-sans">স্যান্স (Sans)</option>
              <option value="font-mono">মনো (Mono)</option>
              <option value="font-serif">সেরিফ (Serif)</option>
            </select>
          </div>
        </div>
      </div>

      <button className="w-full bg-red-500/10 border border-red-500/30 text-red-400 font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-red-500/20 transition-colors mt-6">
        <LogOut size={18} /> লগ আউট
      </button>

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
                <label className="text-xs text-teal-200 font-medium">বর্তমান পাসওয়ার্ড (Current Password)</label>
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

      {/* Chat Modal */}
      {isChatOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-teal-950/95 sm:p-4 h-full w-full pb-safe">
          <div className={`flex-1 ${chatBgColor} ${chatFont} sm:rounded-2xl border-teal-700/50 sm:border flex flex-col overflow-hidden shadow-2xl max-w-md mx-auto w-full`}>
            {/* Chat Header */}
            <div className="bg-teal-800 p-3 flex items-center justify-between border-b border-teal-700/50">
              <div className="flex items-center gap-2">
                <div className="bg-teal-700 p-1.5 rounded-full">
                  <Headset size={16} className="text-teal-300" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">গ্রাহক সেবা (24/7)</h3>
                  <p className="text-[10px] text-teal-300">দ্রুত উত্তর দেয়</p>
                </div>
              </div>
              <button 
                onClick={() => setIsChatOpen(false)}
                className="p-1.5 hover:bg-teal-700 rounded-full transition-colors"
              >
                <X size={16} className="text-teal-100" />
              </button>
            </div>
            
            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {chatError && (
                <div className="bg-red-900/80 border border-red-500/50 text-red-200 text-[10px] p-2 rounded-lg flex items-center justify-between sticky top-0 z-10 shadow-lg backdrop-blur-sm">
                  <div className="flex items-center gap-1">
                    <AlertCircle size={12} className="text-red-400 shrink-0" />
                    <span>{chatError}</span>
                  </div>
                  <button onClick={() => setChatError(null)} className="text-red-400 hover:text-red-300 p-0.5">
                    <X size={12} />
                  </button>
                </div>
              )}
              {chatHistory.map(msg => (
                <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] px-3 py-1.5 shadow-sm ${msg.sender === 'user' ? 'bg-teal-500 text-white rounded-xl rounded-tr-sm' : 'bg-teal-800 text-teal-50 rounded-xl rounded-tl-sm'}`}>
                    <p className="text-xs">{msg.text}</p>
                    <p className={`text-[9px] mt-0.5 ${msg.sender === 'user' ? 'text-teal-100 text-right' : 'text-teal-300'}`}>{msg.time}</p>
                  </div>
                </div>
              ))}
              {isUserTyping && (
                <div className="flex justify-end">
                  <div className="bg-teal-600 text-white rounded-xl rounded-tr-sm px-3 py-1.5 text-[10px] italic">
                    টাইপ করছেন...
                  </div>
                </div>
              )}
              {isAgentTyping && (
                <div className="flex justify-start">
                  <div className="bg-teal-800 text-teal-50 rounded-xl rounded-tl-sm px-3 py-2 flex items-center gap-0.5">
                    <div className="w-1 h-1 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-1 h-1 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-1 h-1 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
            
            {/* Chat Input */}
            <div className="p-2 bg-teal-800/50 border-t border-teal-700/50 flex items-center gap-1.5">
              <input 
                type="text" 
                value={chatMessage}
                onChange={handleInputChange}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="মেসেজ..." 
                className="flex-1 bg-teal-900/80 border border-teal-700 rounded-full px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500 placeholder-teal-400/50"
              />
              <button 
                onClick={handleSendMessage}
                disabled={!chatMessage.trim()}
                className="bg-teal-500 hover:bg-teal-400 disabled:bg-teal-700 disabled:text-teal-500 text-white p-2 rounded-full transition-colors"
              >
                <Send size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
