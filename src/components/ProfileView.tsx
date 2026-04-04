import React, { useState, useEffect, useRef, useMemo } from "react";
import { motion } from 'motion/react';
import AgentPanel from './AgentPanel';
import SupportChat from "./SupportChat";
import ProfileHeader from './ProfileHeader';
import ProfileNavigation from './ProfileNavigation';
import OverviewTab from './OverviewTab';
import { Timestamp, collection, query, where, orderBy, onSnapshot, addDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import { Smartphone, ChevronLeft, CreditCard, ChevronRight, AlertTriangle, RefreshCw, AlertCircle, CheckCircle2, X } from 'lucide-react';
import { motion } from 'motion/react';
import React, { useState, useEffect } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
  addDoc,
  serverTimestamp,
  doc,
  updateDoc
} from 'firebase/firestore';
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
  UserCog,
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
  EyeOff,
  MapPin,
  Calendar,
  Loader2,
  Building2,
  Search,
  Play,
  Info,
  TrendingUp,
  Edit,
  Crown
} from "lucide-react";

const fetcher = (url: string) => fetch(url).then(res => {
  if (!res.ok) throw new Error('Network response was not ok');
  return res.json();
});

import { ToastType } from "./Toast";

export default function ProfileView({ onTabChange, balance, userData, onLogout, showToast }: { onTabChange: (tab: any) => void, balance: number, userData: any, onLogout: () => void, showToast: (msg: string, type?: ToastType) => void }) {
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'profile' | 'history' | 'withdraw' | 'links' | 'withdrawHistory'>('overview');
  const [isTabLoading, setIsTabLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [profilePic, setProfilePic] = useState<string | null>(userData?.profilePictureUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [editUsername, setEditUsername] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [showAgentPanel, setShowAgentPanel] = useState(false);

  const [totals, setTotals] = useState({
    deposit: 0,
    withdraw: 0,
    bonus: 0,
    rebate: 0
  });

  useEffect(() => {
    if (userData?.profilePictureUrl) {
      setProfilePic(userData.profilePictureUrl);
    }
  }, [userData?.profilePictureUrl]);

  useEffect(() => {
    if (!auth.currentUser) return;

    const path = `users/${auth.currentUser.uid}/transactions`;
    const q = query(collection(db, path));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const trxData = snapshot.docs.map(doc => doc.data());
      
      const newTotals = trxData.reduce((acc, trx) => {
        const amountStr = String(trx.amount || "0");
        const amount = parseFloat(amountStr.replace(/[^0-9.-]+/g,"")) || 0;
        if (trx.type === 'deposit') acc.deposit += amount;
        else if (trx.type === 'withdraw') acc.withdraw += amount;
        else if (trx.type === 'bonus') acc.bonus += amount;
        else if (trx.type === 'rebate') acc.rebate += amount;
        return acc;
      }, { deposit: 0, withdraw: 0, bonus: 0, rebate: 0 });
      
      setTotals(newTotals);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });

    return () => unsubscribe();
  }, []);

  const handleSubTabChange = (tab: 'overview' | 'profile' | 'history' | 'withdraw' | 'links' | 'withdrawHistory') => {
    if (tab === activeSubTab) return;
    setIsTabLoading(true);
    setTimeout(() => {
      setActiveSubTab(tab);
      setIsTabLoading(false);
    }, 500);
  };

  const handleOpenEditProfile = () => {
    setEditUsername(userData?.username || profileData?.username || "");
    setEditPhone(userData?.phoneNumber || userData?.phone || profileData?.phoneNumber || profileData?.phone || "");
    setIsEditProfileModalOpen(true);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const userId = userData?.id || profileData?.id;
    if (!userId) return;

    setIsUpdatingProfile(true);
    try {
      await updateUserProfile(userId, {
        username: editUsername,
        phoneNumber: editPhone
      });
      showToast("প্রোফাইল আপডেট সফল হয়েছে! (Profile updated!)", "success");
      setIsEditProfileModalOpen(false);
    } catch (err) {
      console.error("Update profile error:", err);
      showToast("প্রোফাইল আপডেট ব্যর্থ হয়েছে। (Update failed.)", "error");
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 100);
  };

  const handleProfilePicChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (limit to 5MB before processing)
      if (file.size > 5 * 1024 * 1024) {
        showToast("ছবিটি ৫ মেগাবাইটের কম হতে হবে", "error");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = async () => {
        const img = new Image();
        img.src = reader.result as string;
        img.onload = async () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 400;
          const MAX_HEIGHT = 400;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
          setProfilePic(compressedBase64);
          
          const userId = userData?.id;
          if (userId) {
            try {
              await updateUserProfile(userId, { profilePictureUrl: compressedBase64 });
              await addNotification(userId, {
                title: "প্রোফাইল ছবি আপডেট!",
                message: "আপনার প্রোফাইল ছবি সফলভাবে পরিবর্তন করা হয়েছে।",
                type: "account"
              });
              showToast("প্রোফাইল ছবি সফলভাবে আপডেট করা হয়েছে", "success");
            } catch (error) {
              console.error("Error updating profile picture:", error);
              showToast("ছবি আপডেট করতে সমস্যা হয়েছে", "error");
            }
          }
        };
      };
      reader.readAsDataURL(file);
    }
  };
  
  const profileData = userData;

  return (
    <div className="flex-1 overflow-y-auto pb-20">
      <ProfileHeader 
        userData={userData}
        profilePic={profilePic}
        fileInputRef={fileInputRef}
        handleProfilePicChange={handleProfilePicChange}
        onBack={() => onTabChange('home')}
      />

      <ProfileNavigation 
        activeSubTab={activeSubTab}
        handleSubTabChange={handleSubTabChange}
      />

      {/* Tab Content */}
      <div className="p-4 relative min-h-[300px]">
        {isTabLoading && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#0b0b0b]/60 backdrop-blur-[2px] rounded-2xl">
            <div className="flex flex-col items-center gap-3">
              <Loader2 size={40} className="text-yellow-500 animate-spin" />
              <span className="text-teal-200 text-xs font-bold animate-pulse">লোড হচ্ছে...</span>
            </div>
          </div>
        )}
        
        {activeSubTab === 'overview' && (
          <OverviewTab 
            onTabChange={onTabChange} 
            onSubTabChange={handleSubTabChange}
            balance={balance} 
            isRefreshing={isRefreshing} 
            onRefresh={handleRefresh} 
            profileData={profileData} 
            userData={userData} 
            onEditProfile={handleOpenEditProfile}
            totals={totals}
            setShowAgentPanel={setShowAgentPanel}
            setIsChatOpen={setIsChatOpen}
          />
        )}

        {activeSubTab === 'profile' && (
          <ProfileTab 
            userData={userData} 
            onEditProfile={handleOpenEditProfile} 
            onEditProfilePic={() => fileInputRef.current?.click()}
            profilePic={profilePic}
            onLogout={onLogout}
            showToast={showToast}
          />
        )}
        {activeSubTab === 'history' && <HistoryTab email={profileData?.email} />}
        {activeSubTab === 'withdrawHistory' && <WithdrawalHistoryTab email={profileData?.email} />}
        {activeSubTab === 'links' && <LinksTab onTabChange={onTabChange} onSubTabChange={handleSubTabChange} showToast={showToast} />}
        {activeSubTab === 'withdraw' && <WithdrawTab onBack={() => handleSubTabChange('overview')} balance={balance} showToast={showToast} userData={userData} />}
      </div>

      {/* Agent Panel */}
      {showAgentPanel && (
        <div className="fixed inset-0 z-[200] bg-black/90 flex items-center justify-center p-6 overflow-y-auto">
          <AgentPanel onBack={() => setShowAgentPanel(false)} userData={userData} showToast={showToast} />
        </div>
      )}

      {/* Edit Profile Modal */}
      {isEditProfileModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-teal-900 border border-teal-500/30 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="p-4 border-b border-teal-700/50 flex items-center justify-between bg-teal-800/50">
              <h3 className="font-bold text-white flex items-center gap-2">
                <UserCog size={18} className="text-teal-400" /> 
                প্রোফাইল এডিট করুন
              </h3>
              <button 
                onClick={() => setIsEditProfileModalOpen(false)}
                className="text-teal-400 hover:text-white p-1 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleUpdateProfile} className="p-5 space-y-4">
              {/* Profile update success is now handled by showToast */}
              
              <div className="space-y-1.5">
                <label className="text-xs text-teal-200 font-medium">ইউজার নেম (Username)</label>
                <input 
                  type="text" 
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                  className="w-full bg-teal-950/50 border border-teal-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-teal-400 transition-colors"
                  placeholder="আপনার ইউজার নেম লিখুন"
                  required
                />
              </div>
              
              <div className="space-y-1.5">
                <label className="text-xs text-teal-200 font-medium">ফোন নম্বর (Phone Number)</label>
                <input 
                  type="tel" 
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full bg-teal-950/50 border border-teal-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-teal-400 transition-colors"
                  placeholder="আপনার ফোন নম্বর লিখুন"
                  required
                />
              </div>
              
              <div className="flex gap-3 pt-2">
                <button 
                  type="button"
                  onClick={() => setIsEditProfileModalOpen(false)}
                  className="flex-1 bg-teal-800 hover:bg-teal-700 text-teal-100 font-bold py-3 rounded-xl transition-colors"
                >
                  বাতিল করুন
                </button>
                <button 
                  type="submit"
                  disabled={isUpdatingProfile}
                  className="flex-1 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-400 hover:to-teal-500 text-white font-bold py-3 rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isUpdatingProfile ? (
                    <>
                      <Loader2 size={18} className="animate-spin" /> সংরক্ষণ হচ্ছে...
                    </>
                  ) : (
                    'সংরক্ষণ করুন'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function WithdrawTab({ onBack, balance, showToast, userData }: { onBack: () => void, balance: number, showToast: (msg: string, type?: any) => void, userData: any }) {
  const [step, setStep] = useState(1);
  const [selectedMethod, setSelectedMethod] = useState('');
  const [amount, setAmount] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

  useEffect(() => {
    if (!auth.currentUser) return;

    const path = `users/${auth.currentUser.uid}/transactions`;
    const q = query(
      collection(db, path),
      where('type', '==', 'withdraw'),
      orderBy('date', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const trxData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          date: data.date instanceof Timestamp ? 
                data.date.toDate().toLocaleString('en-GB', { 
                  year: 'numeric', 
                  month: '2-digit', 
                  day: '2-digit', 
                  hour: '2-digit', 
                  minute: '2-digit' 
                }).replace(/\//g, '-') : data.date
        };
      });
      setWithdrawals(trxData);
      setIsLoadingHistory(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
      setIsLoadingHistory(false);
    });

    return () => unsubscribe();
  }, []);

  const turnover = userData?.turnover || 0;
  const requiredTurnover = (userData?.totalDeposit || 1000) * 1;
  const turnoverProgress = Math.min(100, (turnover / requiredTurnover) * 100);

  const methods = [
    { id: 'bkash', name: 'bKash', icon: Smartphone, color: 'bg-[#d12053]' },
    { id: 'nagad', name: 'Nagad', icon: Smartphone, color: 'bg-[#f7941d]' },
    { id: 'rocket', name: 'Rocket', icon: Smartphone, color: 'bg-[#8c3494]' },
  ];

  const handleWithdraw = async () => {
    const withdrawAmount = parseFloat(amount);
    
    if (turnover < requiredTurnover) {
      showToast(`উত্তোলনের জন্য আরও ৳ ${(requiredTurnover - turnover).toFixed(2)} টানউভার প্রয়োজন।`, 'error');
      return;
    }

    if (isNaN(withdrawAmount) || withdrawAmount < 200) {
      showToast('সর্বনিম্ন উত্তোলন ২০০ টাকা।', 'warning');
      return;
    }

    if (withdrawAmount > balance) {
      showToast('আপনার অ্যাকাউন্টে পর্যাপ্ত ব্যালেন্স নেই।', 'error');
      return;
    }

    if (!accountNumber.trim()) {
      showToast('দয়া করে অ্যাকাউন্ট নাম্বার দিন।', 'warning');
      return;
    }

    if (!auth.currentUser) {
      showToast('You must be logged in to withdraw.', 'error');
      return;
    }

    setIsSubmitting(true);
    const path = `users/${auth.currentUser.uid}/transactions`;
    try {
      // Deduct balance first
      const userRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(userRef, {
        balance: balance - withdrawAmount
      });

      await addDoc(collection(db, path), {
        type: 'withdraw',
        amount: -withdrawAmount,
        method: selectedMethod,
        number: accountNumber,
        status: 'pending',
        date: serverTimestamp(),
        trxId: `WTH-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        statusColor: 'bg-yellow-500/20 text-yellow-500'
      });

      showToast('উত্তোলন রিকোয়েস্ট সফল হয়েছে! এডমিন এপ্রুভ করলে আপনার অ্যাকাউন্টে টাকা পৌঁছে যাবে।', 'success');
      onBack();
    } catch (error) {
      // If addDoc fails, try to revert balance deduction
      try {
        const userRef = doc(db, 'users', auth.currentUser.uid);
        await updateDoc(userRef, {
          balance: balance
        });
      } catch (revertError) {
        console.error("Failed to revert balance:", revertError);
      }
      showToast('উত্তোলন রিকোয়েস্ট ব্যর্থ হয়েছে। আবার চেষ্টা করুন।', 'error');
      handleFirestoreError(error, OperationType.WRITE, path);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="flex items-center gap-4 mb-4">
        <button 
          onClick={onBack}
          className="p-2 bg-teal-800/50 hover:bg-teal-700/50 rounded-full transition-colors text-white"
        >
          <ChevronLeft size={20} />
        </button>
        <h3 className="text-white font-bold text-lg">উত্তোলন (Withdraw)</h3>
      </div>

      {/* Turnover Progress Card */}
      <div className="bg-black/40 p-4 rounded-2xl border border-white/5 space-y-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <RefreshCw size={14} className="text-teal-400" />
            <span className="text-xs text-teal-200 font-bold uppercase tracking-wider">টানউভার (Turnover)</span>
          </div>
          <span className="text-[10px] text-teal-400 font-black">{turnoverProgress.toFixed(1)}%</span>
        </div>
        <div className="h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${turnoverProgress}%` }}
            className="h-full bg-gradient-to-r from-teal-500 to-teal-300 shadow-[0_0_10px_rgba(20,184,166,0.5)]"
          />
        </div>
        <div className="flex justify-between text-[10px] font-bold">
          <span className="text-gray-500">৳ {turnover.toLocaleString()}</span>
          <span className="text-teal-400">লক্ষ্য: ৳ {requiredTurnover.toLocaleString()}</span>
        </div>
        {turnover < requiredTurnover && (
          <div className="flex items-center gap-2 bg-yellow-500/10 p-2 rounded-lg border border-yellow-500/20">
            <AlertTriangle size={12} className="text-yellow-500" />
            <p className="text-[9px] text-yellow-200 leading-tight">উত্তোলনের জন্য আরও ৳ {(requiredTurnover - turnover).toFixed(2)} টানউভার প্রয়োজন।</p>
          </div>
        )}
      </div>

      <div className="bg-gradient-to-br from-teal-800 to-teal-950 p-5 rounded-2xl border border-teal-700/50 shadow-xl relative overflow-hidden">
        <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/5 rounded-full blur-2xl"></div>
        <p className="text-teal-200 text-xs font-bold uppercase tracking-widest mb-1">বর্তমান ব্যালেন্স</p>
        <p className="text-3xl font-black text-white italic tracking-tight">৳ {balance.toLocaleString()}</p>
      </div>

      {step === 1 ? (
        <>
          <h4 className="text-white font-bold mb-3 flex items-center gap-2">
            <CreditCard size={18} className="text-yellow-500" />
            পদ্ধতি নির্বাচন করুন
          </h4>
          <div className="grid grid-cols-1 gap-3">
            {methods.map((method) => (
              <button 
                key={method.id} 
                onClick={() => { setSelectedMethod(method.id); setStep(2); }}
                className="bg-teal-900/40 p-4 rounded-2xl border border-teal-800/50 flex items-center justify-between hover:bg-teal-800/60 transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl ${method.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                    <Smartphone size={24} className="text-white" />
                  </div>
                  <span className="text-white font-black text-lg">{method.name}</span>
                </div>
                <ChevronRight size={20} className="text-teal-600 group-hover:text-teal-400 transition-colors" />
              </button>
            ))}
          </div>
        </>
      ) : (
        <div className="space-y-5 animate-in slide-in-from-right-4 duration-300">
          <div className="bg-teal-900/20 p-4 rounded-2xl border border-teal-800/30 flex items-center gap-4">
             <div className={`w-10 h-10 rounded-lg ${methods.find(m => m.id === selectedMethod)?.color} flex items-center justify-center`}>
                <Smartphone size={20} className="text-white" />
             </div>
             <div>
                <p className="text-[10px] text-teal-400 font-bold uppercase tracking-widest">Selected Method</p>
                <p className="text-white font-black">{methods.find(m => m.id === selectedMethod)?.name}</p>
             </div>
             <button onClick={() => setStep(1)} className="ml-auto text-[10px] text-yellow-500 font-bold underline">Change</button>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-teal-200 text-xs font-bold uppercase tracking-widest ml-1">উত্তোলনের পরিমাণ (৳)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-teal-500 font-black">৳</span>
                <input 
                  type="number" 
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="সর্বনিম্ন ২০০"
                  className="w-full bg-teal-950/50 border border-teal-700 rounded-2xl pl-8 pr-4 py-4 text-white font-black focus:outline-none focus:border-yellow-500 transition-all"
                />
              </div>
              
              {/* Quick Amount Buttons */}
              <div className="grid grid-cols-5 gap-2">
                {[100, 200, 500, 1000, 25000].map((amt) => (
                  <button
                    key={amt}
                    onClick={() => setAmount(amt.toString())}
                    className={`py-2 rounded-xl text-[10px] font-black border transition-all active:scale-95 ${
                      amount === amt.toString() ? 'bg-yellow-500 border-yellow-500 text-black' : 'bg-teal-900/30 border-teal-800 text-teal-300 hover:border-teal-600'
                    }`}
                  >
                    {amt >= 1000 ? `${amt/1000}k` : amt}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-teal-200 text-xs font-bold uppercase tracking-widest ml-1">অ্যাকাউন্ট নাম্বার</label>
              <input 
                type="text" 
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="01XXXXXXXXX"
                className="w-full bg-teal-950/50 border border-teal-700 rounded-2xl px-4 py-4 text-white font-black focus:outline-none focus:border-yellow-500 transition-all"
              />
            </div>

            <button 
              onClick={handleWithdraw}
              disabled={isSubmitting || turnover < requiredTurnover}
              className={`w-full py-4 rounded-2xl font-black text-lg shadow-xl transition-all active:scale-95 flex justify-center items-center gap-3 ${
                turnover < requiredTurnover ? 'bg-gray-800 text-gray-500 cursor-not-allowed' : 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-black shadow-yellow-500/20'
              }`}
            >
              {isSubmitting ? <Loader2 size={24} className="animate-spin" /> : (
                <>
                  <ArrowUpRight size={20} />
                  উত্তোলন করুন
                </>
              )}
            </button>
            
            {turnover < requiredTurnover && (
               <p className="text-center text-[10px] text-red-400 font-bold animate-pulse">টানউভার লক্ষ্য পূরণ করুন</p>
            )}
          </div>
        </div>
      )}

      {/* Withdrawal History Section */}
      <div className="mt-8 space-y-4">
        <h4 className="text-white font-bold flex items-center gap-2">
          <History size={18} className="text-teal-400" />
          উত্তোলনের ইতিহাস
        </h4>
        
        {isLoadingHistory ? (
          <div className="flex justify-center py-8">
            <Loader2 size={24} className="animate-spin text-teal-500" />
          </div>
        ) : withdrawals.length > 0 ? (
          <div className="space-y-3">
            {withdrawals.map((trx) => (
              <div key={trx.id} className="bg-teal-900/20 p-4 rounded-2xl border border-teal-800/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center">
                    <ArrowUpRight size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white uppercase">{trx.method}</p>
                    <p className="text-[10px] text-teal-200">{trx.date}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-white">৳{Math.abs(trx.amount).toLocaleString()}</p>
                  <p className={`text-[10px] mt-0.5 ${trx.statusColor || 'text-yellow-500'}`}>{trx.status}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-teal-900/20 p-8 rounded-2xl border border-teal-800/30 text-center">
            <History size={32} className="text-teal-700 mx-auto mb-2" />
            <p className="text-teal-400 text-sm">কোনো উত্তোলনের ইতিহাস নেই</p>
          </div>
        )}
      </div>
    </div>
  );
}
interface OverviewTabProps {
  onTabChange: (tab: any) => void;
  onSubTabChange: (tab: any) => void;
  balance: number;
  isRefreshing: boolean;
  onRefresh: () => void;
  profileData: any;
  userData: any;
  onEditProfile: () => void;
  totals: any;
  setShowAgentPanel: (show: boolean) => void;
  setIsChatOpen: (show: boolean) => void;
}

function ProfileTab({ userData, onEditProfile, onEditProfilePic, profilePic, onLogout, showToast }: { userData: any, onEditProfile: () => void, onEditProfilePic: () => void, profilePic: string | null, onLogout: () => void, showToast: (msg: string, type?: ToastType) => void }) {
  const [isSortedAZ, setIsSortedAZ] = useState(false);

  const userDetails = useMemo(() => {
    if (!userData) return [];
    
    const details = [
      { label: 'ইউজার নেম (Username)', value: userData.username, icon: User },
      { label: 'ফোন নম্বর (Phone)', value: userData.phoneNumber || userData.phone || 'Not provided', icon: Smartphone },
      { label: 'ইমেইল (Email)', value: userData.email || 'Not provided', icon: Mail },
      { label: 'নিবন্ধন তারিখ (Registration)', value: userData.registrationDate || 'Not provided', icon: Calendar },
      { label: 'ভিআইপি লেভেল (VIP Level)', value: `Level ${userData.vipLevel || 1}`, icon: Crown },
      { label: 'দেশ (Country)', value: userData.country || 'Not provided', icon: MapPin },
      { label: 'রেফারেল কোড (Referral Code)', value: userData.referralCode || 'SPIN71', icon: QrCode },
      { label: 'ব্যালেন্স (Balance)', value: `৳ ${userData.balance?.toLocaleString() || 0}`, icon: Wallet },
      { label: 'রোল (Role)', value: userData.role || 'user', icon: Shield },
    ];

    if (isSortedAZ) {
      return details.sort((a, b) => a.label.localeCompare(b.label));
    }
    return details;
  }, [userData, isSortedAZ]);

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Profile Header Card */}
      <div className="bg-teal-800/40 rounded-2xl p-6 border border-teal-700/50 shadow-lg text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-teal-500/5 rounded-full blur-3xl -ml-16 -mb-16"></div>
        
        <div className="relative z-10 flex flex-col items-center">
          <div className="relative group cursor-pointer" onClick={onEditProfilePic}>
            <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-yellow-400 to-yellow-600 p-1 shadow-xl">
              <div className="w-full h-full bg-teal-900 rounded-full flex items-center justify-center border-4 border-teal-800 overflow-hidden">
                {profilePic ? (
                  <img src={profilePic} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User size={48} className="text-teal-400" />
                )}
              </div>
            </div>
            <div className="absolute bottom-0 right-0 bg-yellow-500 p-2 rounded-full shadow-lg border-2 border-teal-900 group-hover:scale-110 transition-transform">
              <Camera size={14} className="text-black" />
            </div>
            <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="text-[10px] text-white font-bold">পরিবর্তন করুন</span>
            </div>
          </div>
          
          <h2 className="text-xl font-black text-white mt-4">{userData?.username || 'Player'}</h2>
          <p className="text-teal-400 text-xs font-mono uppercase tracking-widest mt-1">ID: {userData?.id || '84729104'}</p>
          
          <button 
            onClick={onEditProfile}
            className="mt-4 px-6 py-2 bg-teal-700/50 hover:bg-teal-600 text-white text-sm font-bold rounded-xl border border-teal-600/50 transition-all flex items-center gap-2"
          >
            <Edit size={16} /> প্রোফাইল এডিট করুন
          </button>
        </div>
      </div>

      {/* Details List */}
      <div className="bg-teal-800/40 rounded-2xl border border-teal-700/50 overflow-hidden">
        <div className="p-4 border-b border-teal-700/50 flex items-center justify-between bg-teal-900/30">
          <h3 className="font-bold text-white flex items-center gap-2">
            <Info size={18} className="text-yellow-400" /> ব্যক্তিগত তথ্য (Personal Info)
          </h3>
          <button 
            onClick={() => setIsSortedAZ(!isSortedAZ)}
            className={`p-2 rounded-lg transition-colors ${isSortedAZ ? 'bg-yellow-500 text-black' : 'bg-teal-700 text-teal-300'}`}
            title={isSortedAZ ? "Original Order" : "Sort A-Z"}
          >
            <ArrowDownUp size={16} />
          </button>
        </div>
        
        <div className="divide-y divide-teal-700/30">
          {userDetails.map((detail, index) => (
            <div key={index} className="p-4 flex items-center justify-between hover:bg-teal-700/20 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-teal-900/50 flex items-center justify-center text-teal-400">
                  <detail.icon size={16} />
                </div>
                <div>
                  <p className="text-[10px] text-teal-400 uppercase tracking-wider font-bold">{detail.label}</p>
                  <p className="text-sm text-white font-medium mt-0.5">{detail.value}</p>
                </div>
              </div>
              {detail.label.includes('Username') || detail.label.includes('Phone') ? (
                <button onClick={onEditProfile} className="p-2 text-teal-500 hover:text-yellow-400 transition-colors">
                  <Edit size={14} />
                </button>
              ) : null}
            </div>
          ))}
        </div>
      </div>

      {/* Settings Tab Content (Security Center, Linked Accounts, 2FA) */}
      <SettingsTab profileData={userData} onLogout={onLogout} onEditProfile={onEditProfile} showToast={showToast} hideAccountDetails={true} />
    </div>
  );
}

function OverviewTab({ 
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
        <div 
          className="bg-white/10 p-3 rounded-full cursor-pointer relative z-10"
        >
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

function LinksTab({ onTabChange, onSubTabChange, showToast }: { onTabChange: (tab: any) => void, onSubTabChange: (tab: string) => void, showToast: (msg: string, type?: ToastType) => void }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('recent');

  // Real app links/pages
  const [links] = useState([
    { id: 'home', title: 'হোম পেজ (Home)', url: 'https://spin71-bet-e0m5.onrender.com/', type: 'page', clicks: 1245, lastVisited: new Date().toISOString(), action: () => onTabChange('home') },
    { id: 'deposit', title: 'ডিপোজিট (Deposit)', url: 'https://spin71-bet-e0m5.onrender.com/deposit', type: 'finance', clicks: 432, lastVisited: new Date(Date.now() - 86400000).toISOString(), action: () => onTabChange('deposit') },
    { id: 'withdraw', title: 'উত্তোলন (Withdraw)', url: 'https://spin71-bet-e0m5.onrender.com/profile/withdraw', type: 'finance', clicks: 210, lastVisited: new Date(Date.now() - 120000000).toISOString(), action: () => onSubTabChange('withdraw') },
    { id: 'bonus', title: 'বোনাস সেন্টার (Bonus)', url: 'https://spin71-bet-e0m5.onrender.com/bonus', type: 'page', clicks: 890, lastVisited: new Date(Date.now() - 172800000).toISOString(), action: () => onTabChange('bonus') },
    { id: 'invite', title: 'আমন্ত্রণ (Invite)', url: 'https://spin71-bet-e0m5.onrender.com/invite', type: 'referral', clicks: 156, lastVisited: new Date(Date.now() - 259200000).toISOString(), action: () => onTabChange('invite') },
    { id: 'profile', title: 'প্রোফাইল (Profile)', url: 'https://spin71-bet-e0m5.onrender.com/profile', type: 'page', clicks: 567, lastVisited: new Date().toISOString(), action: () => onTabChange('profile') },
    { id: 'history', title: 'ইতিহাস (History)', url: 'https://spin71-bet-e0m5.onrender.com/profile/history', type: 'page', clicks: 345, lastVisited: new Date(Date.now() - 50000000).toISOString(), action: () => onSubTabChange('history') },
    { id: 'settings', title: 'সেটিংস (Settings)', url: 'https://spin71-bet-e0m5.onrender.com/profile/settings', type: 'page', clicks: 120, lastVisited: new Date(Date.now() - 400000000).toISOString(), action: () => onSubTabChange('profile') },
    { id: 'telegram', title: 'টেলিগ্রাম সাপোর্ট (Support)', url: 'https://t.me/spin71bet_support', type: 'support', clicks: 89, lastVisited: new Date(Date.now() - 345600000).toISOString(), action: () => window.open('https://t.me/spin71bet_support', '_blank') },
  ]);

  const filteredAndSortedLinks = useMemo(() => {
    let result = [...links];

    // Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(link => 
        link.title.toLowerCase().includes(q) || 
        link.url.toLowerCase().includes(q)
      );
    }

    // Filter
    if (filterType !== 'all') {
      result = result.filter(link => link.type === filterType);
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'recent') {
        return new Date(b.lastVisited).getTime() - new Date(a.lastVisited).getTime();
      } else if (sortBy === 'clicks_desc') {
        return b.clicks - a.clicks;
      } else if (sortBy === 'title_asc') {
        return a.title.localeCompare(b.title);
      }
      return 0;
    });

    return result;
  }, [links, searchQuery, filterType, sortBy]);

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold text-white">আমার লিংক (My Links)</h3>
      </div>

      <div className="flex flex-col gap-3 mb-4">
        {/* Search */}
        <div className="relative">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <Search size={16} className="text-teal-400" />
          </div>
          <input 
            type="text" 
            placeholder="লিংক খুঁজুন..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-teal-800/60 border border-teal-700/50 text-teal-100 text-sm rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-yellow-500 transition-colors"
          />
        </div>

        {/* Filters & Sort */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <div className="relative flex-1 min-w-[130px]">
            <div className="absolute inset-y-0 left-2 flex items-center pointer-events-none">
              <Filter size={14} className="text-teal-400" />
            </div>
            <select 
              value={filterType} 
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full bg-teal-800/60 border border-teal-700/50 text-teal-100 text-xs rounded-lg pl-8 pr-2 py-2.5 appearance-none focus:outline-none focus:border-yellow-500"
            >
              <option value="all">সব ধরন</option>
              <option value="page">পেজ</option>
              <option value="finance">ফাইন্যান্স</option>
              <option value="referral">রেফারেল</option>
              <option value="support">সাপোর্ট</option>
            </select>
          </div>
          
          <div className="relative flex-1 min-w-[140px]">
            <div className="absolute inset-y-0 left-2 flex items-center pointer-events-none">
              <ArrowDownUp size={14} className="text-teal-400" />
            </div>
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full bg-teal-800/60 border border-teal-700/50 text-teal-100 text-xs rounded-lg pl-8 pr-2 py-2.5 appearance-none focus:outline-none focus:border-yellow-500"
            >
              <option value="recent">সাম্প্রতিক</option>
              <option value="clicks_desc">সবচেয়ে বেশি ক্লিক</option>
              <option value="title_asc">নাম (A-Z)</option>
            </select>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {filteredAndSortedLinks.length > 0 ? (
          filteredAndSortedLinks.map((link) => (
            <div key={link.id} className="bg-teal-800/40 rounded-xl p-4 border border-teal-700/50 hover:bg-teal-700/50 transition-colors">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <div className={`p-2 rounded-lg ${
                    link.type === 'page' ? 'bg-purple-500/20 text-purple-400' :
                    link.type === 'finance' ? 'bg-green-500/20 text-green-400' :
                    link.type === 'referral' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-blue-500/20 text-blue-400'
                  }`}>
                    {link.type === 'page' ? <Play size={16} /> :
                     link.type === 'finance' ? <Wallet size={16} /> :
                     link.type === 'referral' ? <Users size={16} /> :
                     <Info size={16} />}
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-sm">{link.title}</h4>
                    <span className="text-[10px] text-teal-300 uppercase tracking-wider">{link.type}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={link.action}
                    className="px-3 py-1.5 bg-yellow-500 text-black font-bold text-xs rounded-md hover:bg-yellow-400 transition-colors"
                  >
                    ভিজিট
                  </button>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(link.url);
                      showToast('লিংক কপি করা হয়েছে!', 'success');
                    }}
                    className="p-1.5 bg-teal-900/50 text-teal-300 hover:text-white hover:bg-teal-700 rounded-md transition-colors"
                    title="Copy Link"
                  >
                    <Copy size={14} />
                  </button>
                </div>
              </div>
              
              <div className="bg-black/20 p-2 rounded-lg mb-3 overflow-hidden">
                <p className="text-xs text-teal-100/70 truncate font-mono">{link.url}</p>
              </div>
              
              <div className="flex justify-between items-center text-[10px] text-teal-400">
                <span className="flex items-center gap-1">
                  <TrendingUp size={12} /> {link.clicks} ক্লিক
                </span>
                <span className="flex items-center gap-1">
                  <Calendar size={12} /> {new Date(link.lastVisited).toLocaleDateString('en-GB')}
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-teal-400/60">
            <p>কোনো লিংক পাওয়া যায়নি</p>
          </div>
        )}
      </div>
    </div>
  );
}

function HistoryTab({ email }: { email?: string }) {
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('date_desc');
  const [dateRange, setDateRange] = useState('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [selectedTrx, setSelectedTrx] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!auth.currentUser) return;

    const path = `users/${auth.currentUser.uid}/transactions`;
    const q = query(
      collection(db, path),
      orderBy('date', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const trxData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          // Convert Firestore Timestamp to string for display if needed
          date: data.date instanceof Timestamp ? 
                data.date.toDate().toLocaleString('en-GB', { 
                  year: 'numeric', 
                  month: '2-digit', 
                  day: '2-digit', 
                  hour: '2-digit', 
                  minute: '2-digit' 
                }).replace(/\//g, '-') : data.date
        };
      });
      setTransactions(trxData);
      setIsLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredAndSortedTransactions = useMemo(() => {
    if (!transactions) return [];
    
    let result = [...transactions];
    
    if (filterType !== 'all') {
      result = result.filter(trx => trx.type === filterType);
    }

    const now = new Date();
    if (dateRange === '7days') {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(now.getDate() - 7);
      result = result.filter(trx => new Date(trx.date) >= sevenDaysAgo);
    } else if (dateRange === '30days') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(now.getDate() - 30);
      result = result.filter(trx => new Date(trx.date) >= thirtyDaysAgo);
    } else if (dateRange === 'custom' && customStartDate && customEndDate) {
      const start = new Date(customStartDate);
      const end = new Date(customEndDate);
      end.setHours(23, 59, 59, 999);
      result = result.filter(trx => {
        const trxDate = new Date(trx.date);
        return trxDate >= start && trxDate <= end;
      });
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
  }, [transactions, filterType, sortBy, dateRange, customStartDate, customEndDate]);

  return (
    <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold text-white">সাম্প্রতিক লেনদেন</h3>
        <button className="text-xs text-yellow-400 flex items-center gap-1">
          সব দেখুন <ChevronRight size={12} />
        </button>
      </div>

      <div className="flex flex-col gap-2 mb-4">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
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

          <div className="relative flex-1 min-w-[140px]">
            <div className="absolute inset-y-0 left-2 flex items-center pointer-events-none">
              <Calendar size={14} className="text-teal-400" />
            </div>
            <select 
              value={dateRange} 
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full bg-teal-800/60 border border-teal-700/50 text-teal-100 text-xs rounded-lg pl-8 pr-2 py-2 appearance-none focus:outline-none focus:border-teal-500"
            >
              <option value="all">সব সময়</option>
              <option value="7days">গত ৭ দিন</option>
              <option value="30days">গত ৩০ দিন</option>
              <option value="custom">কাস্টম রেঞ্জ</option>
            </select>
          </div>
        </div>

        {dateRange === 'custom' && (
          <div className="flex gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex-1">
              <label className="text-[10px] text-teal-300 mb-1 block">শুরুর তারিখ</label>
              <input 
                type="date" 
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="w-full bg-teal-800/60 border border-teal-700/50 text-teal-100 text-xs rounded-lg px-2 py-2 focus:outline-none focus:border-teal-500"
              />
            </div>
            <div className="flex-1">
              <label className="text-[10px] text-teal-300 mb-1 block">শেষ তারিখ</label>
              <input 
                type="date" 
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="w-full bg-teal-800/60 border border-teal-700/50 text-teal-100 text-xs rounded-lg px-2 py-2 focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>
        )}
      </div>
      
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12 text-teal-400">
          <Loader2 size={32} className="animate-spin mb-2" />
          <p className="text-xs">লোড হচ্ছে...</p>
        </div>
      ) : filteredAndSortedTransactions.length > 0 ? (
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
                  <div className="flex items-center gap-1 text-[10px] text-teal-400">
                    <span className="font-mono opacity-70">{trx.trxId}</span> • <span className="font-medium">{trx.method}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className={`text-sm font-bold ${trx.type === 'deposit' || trx.type === 'bonus' ? 'text-green-400' : 'text-white'}`}>
                {trx.type === 'deposit' || trx.type === 'bonus' ? '+' : '-'}৳{Math.abs(trx.amount).toLocaleString()}
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
                <span className={`font-bold ${selectedTrx.type === 'deposit' || selectedTrx.type === 'bonus' ? 'text-green-400' : 'text-white'}`}>
                  {selectedTrx.type === 'deposit' || selectedTrx.type === 'bonus' ? '+' : '-'}৳{Math.abs(selectedTrx.amount).toLocaleString()}
                </span>
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

function WithdrawalHistoryTab({ email }: { email?: string }) {
  const [sortBy, setSortBy] = useState('date_desc');
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!auth.currentUser) return;

    const path = `users/${auth.currentUser.uid}/transactions`;
    const q = query(
      collection(db, path),
      where('type', '==', 'withdraw'),
      orderBy('date', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const trxData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          date: data.date instanceof Timestamp ? 
                data.date.toDate().toLocaleString('en-GB', { 
                  year: 'numeric', 
                  month: '2-digit', 
                  day: '2-digit', 
                  hour: '2-digit', 
                  minute: '2-digit' 
                }).replace(/\//g, '-') : data.date
        };
      });
      setTransactions(trxData);
      setIsLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredAndSortedTransactions = useMemo(() => {
    if (!transactions) return [];
    
    let result = [...transactions];
    
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
  }, [transactions, sortBy]);

  return (
    <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold text-white">উত্তোলন ইতিহাস</h3>
      </div>

      <div className="flex gap-2 mb-4">
        <select 
          value={sortBy} 
          onChange={(e) => setSortBy(e.target.value)}
          className="w-full bg-teal-800/60 border border-teal-700/50 text-teal-100 text-xs rounded-lg px-2 py-2 appearance-none focus:outline-none focus:border-teal-500"
        >
          <option value="date_desc">নতুন থেকে পুরানো</option>
          <option value="date_asc">পুরানো থেকে নতুন</option>
          <option value="amount_desc">অ্যামাউন্ট (বেশি থেকে কম)</option>
          <option value="amount_asc">অ্যামাউন্ট (কম থেকে বেশি)</option>
        </select>
      </div>

      {isLoading ? (
        <div className="text-center text-teal-400 text-sm py-10">লোড হচ্ছে...</div>
      ) : filteredAndSortedTransactions.length === 0 ? (
        <div className="text-center text-teal-400 text-sm py-10">কোনো উত্তোলন ইতিহাস নেই।</div>
      ) : (
        <div className="space-y-2">
          {filteredAndSortedTransactions.map((trx) => (
            <div key={trx.id} className="bg-teal-900/40 p-3 rounded-xl border border-teal-700/30 flex justify-between items-center">
              <div>
                <p className="text-white font-bold text-sm">{trx.amount}</p>
                <p className="text-teal-400 text-[10px]">{trx.date}</p>
              </div>
              <div className="text-right">
                <p className="text-teal-100 text-xs">{trx.method}</p>
                <p className={`text-[10px] font-bold ${trx.status === 'completed' ? 'text-green-400' : 'text-yellow-400'}`}>
                  {trx.status === 'completed' ? 'সম্পন্ন' : 'প্রক্রিয়াধীন'}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SettingsTab({ profileData, onLogout, onEditProfile, showToast, hideAccountDetails }: { profileData: any, onLogout: () => void, onEditProfile: () => void, showToast: (msg: string, type?: ToastType) => void, hideAccountDetails?: boolean }) {
  const [showPassword, setShowPassword] = useState(false);
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [twoFAMethod, setTwoFAMethod] = useState<'app' | 'sms'>('app');
  const [language, setLanguage] = useState<'bn' | 'en'>('bn');
  
  const toggleLanguage = () => {
    setLanguage(prev => prev === 'bn' ? 'en' : 'bn');
  };
  
  const [isGoogleLinked, setIsGoogleLinked] = useState(
    auth.currentUser?.providerData.some(p => p.providerId === 'google.com') || false
  );
  const [isFacebookLinked, setIsFacebookLinked] = useState(
    auth.currentUser?.providerData.some(p => p.providerId === 'facebook.com') || false
  );

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setIsGoogleLinked(user.providerData.some(p => p.providerId === 'google.com'));
        setIsFacebookLinked(user.providerData.some(p => p.providerId === 'facebook.com'));
      }
    });
    return () => unsubscribe();
  }, []);

  const [isLinkingGoogle, setIsLinkingGoogle] = useState(false);
  const [isLinkingFacebook, setIsLinkingFacebook] = useState(false);
  const [linkingError, setLinkingError] = useState<string | null>(null);
  const [country, setCountry] = useState<string | null>(profileData?.country || null);
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  useEffect(() => {
    if (!country && !isFetchingLocation) {
      // Check if permission is already granted
      if ('permissions' in navigator) {
        navigator.permissions.query({ name: 'geolocation' as any }).then((result) => {
          if (result.state === 'granted') {
            fetchLocation();
          }
        });
      }
    }
  }, [country]);

  const fetchLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser");
      return;
    }

    setIsFetchingLocation(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          // Use a free reverse geocoding API (e.g., bigdatacloud)
          const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`);
          if (!response.ok) throw new Error("Failed to fetch location data");
          
          const data = await response.json();
          if (data.countryName) {
            setCountry(data.countryName);
            // Update the user's profile in Firestore
            if (auth.currentUser) {
              await updateUserProfile(auth.currentUser.uid, { country: data.countryName });
            }
          } else {
             setLocationError("Could not determine country from location");
          }
        } catch (error) {
          console.error("Error fetching location:", error);
          setLocationError("Failed to get country name");
        } finally {
          setIsFetchingLocation(false);
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        setLocationError("Location access denied or unavailable");
        setIsFetchingLocation(false);
      }
    );
  };

  const handleLinkGoogle = async () => {
    if (!auth.currentUser) return;
    setIsLinkingGoogle(true);
    setLinkingError(null);
    try {
      if (isGoogleLinked) {
        await unlink(auth.currentUser, 'google.com');
        setIsGoogleLinked(false);
        await updateUserProfile(auth.currentUser.uid, {
          isGmailLinked: false,
          gmail: null
        } as any);
      } else {
        const result = await linkWithPopup(auth.currentUser, googleProvider);
        setIsGoogleLinked(true);
        await updateUserProfile(auth.currentUser.uid, {
          isGmailLinked: true,
          gmail: result.user.email
        } as any);
      }
    } catch (error: any) {
      console.error("Google linking error:", error);
      if (error.code === 'auth/credential-already-in-use') {
        setLinkingError("এই গুগল অ্যাকাউন্টটি ইতিমধ্যে অন্য একটি অ্যাকাউন্টের সাথে যুক্ত। (This Google account is already linked to another account.)");
      } else if (error.code === 'auth/popup-closed-by-user') {
        // User closed the popup, do nothing
      } else {
        setLinkingError("গুগল অ্যাকাউন্ট লিঙ্ক করতে সমস্যা হয়েছে। আবার চেষ্টা করুন। (Failed to link Google account. Please try again.)");
      }
    } finally {
      setIsLinkingGoogle(false);
    }
  };

  const handleLinkFacebook = async () => {
    if (!auth.currentUser) return;
    setIsLinkingFacebook(true);
    try {
      if (isFacebookLinked) {
        await unlink(auth.currentUser, 'facebook.com');
        setIsFacebookLinked(false);
        await updateUserProfile(auth.currentUser.uid, {
          isFacebookLinked: false,
          facebookEmail: null
        } as any);
      } else {
        const facebookProvider = new FacebookAuthProvider();
        const result = await linkWithPopup(auth.currentUser, facebookProvider);
        setIsFacebookLinked(true);
        await updateUserProfile(auth.currentUser.uid, {
          isFacebookLinked: true,
          facebookEmail: result.user.email
        } as any);
      }
    } catch (error: any) {
      console.error("Facebook linking error:", error);
      if (error.code === 'auth/credential-already-in-use') {
        showToast("এই ফেসবুক অ্যাকাউন্টটি ইতিমধ্যে অন্য একজন ব্যবহারকারীর সাথে লিঙ্ক করা হয়েছে। (This Facebook account is already linked to another user.)", "error");
      } else if (error.code === 'auth/popup-closed-by-user') {
        // User closed the popup, do nothing
      }
    } finally {
      setIsLinkingFacebook(false);
    }
  };
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
  const [phoneNumber, setPhoneNumber] = useState(profileData?.phoneNumber || profileData?.phone || "");
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
      setIdStatus('verified');
    }
  };

  const handleSelfieUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelfieStatus('verified');
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
      
      // In a real app, you would make a fetch call here:
      // const res = await fetch('/api/user/password', { method: 'POST', body: JSON.stringify({ currentPassword, newPassword }) });
      // if (!res.ok) throw new Error('Failed to change password');
      
      setPasswordSuccess("পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে। (Password changed successfully.)");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      
      // Close modal after showing success message
      setIsPasswordModalOpen(false);
      setPasswordSuccess(null);
    } catch (err) {
      setPasswordError("পাসওয়ার্ড পরিবর্তন করতে সমস্যা হয়েছে। (Failed to change password.)");
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Account Details Card */}
      {!hideAccountDetails && (
        <div className="bg-teal-800/40 rounded-2xl p-5 border border-teal-700/50 shadow-lg mb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Shield size={16} className="text-yellow-400" /> অ্যাকাউন্ট তথ্য (Account Details)
              </h3>
              <button 
                onClick={onEditProfile}
                className="text-[10px] bg-teal-700/50 hover:bg-teal-600/50 text-teal-100 px-2 py-1 rounded-lg border border-teal-600/50 transition-colors flex items-center gap-1"
              >
                <UserCog size={12} /> এডিট করুন (Edit)
              </button>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-teal-700/30">
                <span className="text-xs text-teal-200">ইউজার নেম (Username)</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-white">{profileData?.username || 'Player_SPIN71'}</span>
                  <button 
                    onClick={() => navigator.clipboard.writeText(profileData?.username || 'Player_SPIN71')}
                    className="p-1 bg-white/5 hover:bg-white/10 rounded transition-colors text-teal-400 hover:text-teal-200"
                  >
                    <Copy size={12} />
                  </button>
                </div>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-teal-700/30">
                <span className="text-xs text-teal-200">আইডি নাম্বার (ID Number)</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-mono text-yellow-400 font-bold">{profileData?.id || '84729104'}</span>
                  <button 
                    onClick={() => navigator.clipboard.writeText(profileData?.id || '84729104')}
                    className="p-1 bg-white/5 hover:bg-white/10 rounded transition-colors text-teal-400 hover:text-teal-200"
                  >
                    <Copy size={12} />
                  </button>
                </div>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-xs text-teal-200">পাসওয়ার্ড (Password)</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-mono text-white">
                    {showPassword ? (profileData?.password || '••••••••') : '••••••••'}
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
      )}

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
          
          {/* Linked Accounts Section moved to Security Center */}
          <div className="p-3 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <Link size={14} className="text-teal-400" />
              <span className="text-xs font-bold text-teal-100">লিঙ্ক করা অ্যাকাউন্ট (Linked Accounts)</span>
            </div>
            <div className="space-y-2">
              {linkingError && (
                <div 
                  className="bg-red-500/10 border border-red-500/30 text-red-400 p-2.5 rounded-lg text-[10px] flex items-center gap-2 mb-2"
                >
                  <AlertCircle size={14} className="shrink-0" />
                  <span className="flex-1">{linkingError}</span>
                  <button onClick={() => setLinkingError(null)} className="ml-auto hover:text-white">
                    <X size={12} />
                  </button>
                </div>
              )}
              {/* Google Account */}
              <div 
                onClick={!isLinkingGoogle ? handleLinkGoogle : undefined}
                className={`w-full flex items-center justify-between p-2.5 rounded-lg border transition-all duration-300 cursor-pointer ${isGoogleLinked ? 'bg-teal-800/50 border-teal-500/50 shadow-[0_0_10px_rgba(20,184,166,0.15)]' : 'bg-teal-900/30 border-teal-800/50 opacity-80 hover:bg-teal-800/40'}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-1.5 rounded-full transition-colors ${isGoogleLinked ? 'bg-red-500/20' : 'bg-gray-800/50'}`}>
                    <Mail size={14} className={isGoogleLinked ? 'text-red-400' : 'text-gray-400'} />
                  </div>
                  <div className="text-left">
                    <div className={`text-xs font-medium ${isGoogleLinked ? 'text-teal-50' : 'text-gray-300'}`}>Google</div>
                    <div className={`text-[9px] flex items-center gap-1 ${isGoogleLinked ? 'text-teal-300' : 'text-gray-500'}`}>
                      {isGoogleLinked && <CheckCircle2 size={8} />}
                      {isGoogleLinked ? 'সংযুক্ত (Linked)' : 'সংযুক্ত নয় (Not Linked)'}
                    </div>
                  </div>
                </div>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleLinkGoogle();
                  }}
                  disabled={isLinkingGoogle}
                  className={`px-2.5 py-1 rounded text-[10px] font-bold transition-colors flex items-center gap-1 ${isGoogleLinked ? 'bg-teal-900/50 text-teal-400 hover:bg-teal-900 border border-teal-700/50' : 'bg-teal-600 text-white hover:bg-teal-500 shadow-md'}`}
                >
                  {isLinkingGoogle ? <RefreshCw size={10} className="animate-spin" /> : (isGoogleLinked ? 'বিচ্ছিন্ন করুন' : 'লিঙ্ক করুন')}
                </button>
              </div>
              
              {/* Facebook Account */}
              <div className={`w-full flex items-center justify-between p-2.5 rounded-lg border transition-all duration-300 ${isFacebookLinked ? 'bg-teal-800/50 border-teal-500/50 shadow-[0_0_10px_rgba(20,184,166,0.15)]' : 'bg-teal-900/30 border-teal-800/50 opacity-80'}`}>
                <div className="flex items-center gap-3">
                  <div className={`p-1.5 rounded-full transition-colors ${isFacebookLinked ? 'bg-blue-500/20' : 'bg-gray-800/50'}`}>
                    <Facebook size={14} className={isFacebookLinked ? 'text-blue-400' : 'text-gray-400'} />
                  </div>
                  <div className="text-left">
                    <div className={`text-xs font-medium ${isFacebookLinked ? 'text-teal-50' : 'text-gray-300'}`}>Facebook</div>
                    <div className={`text-[9px] flex items-center gap-1 ${isFacebookLinked ? 'text-teal-300' : 'text-gray-500'}`}>
                      {isFacebookLinked && <CheckCircle2 size={8} />}
                      {isFacebookLinked ? 'সংযুক্ত (Linked)' : 'সংযুক্ত নয় (Not Linked)'}
                    </div>
                  </div>
                </div>
                <button 
                  onClick={handleLinkFacebook}
                  disabled={isLinkingFacebook}
                  className={`px-2.5 py-1 rounded text-[10px] font-bold transition-colors flex items-center gap-1 ${isFacebookLinked ? 'bg-teal-900/50 text-teal-400 hover:bg-teal-900 border border-teal-700/50' : 'bg-teal-600 text-white hover:bg-teal-500 shadow-md'}`}
                >
                  {isLinkingFacebook ? <RefreshCw size={10} className="animate-spin" /> : (isFacebookLinked ? 'বিচ্ছিন্ন করুন' : 'লিঙ্ক করুন')}
                </button>
              </div>
            </div>
          </div>
          
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
          <button onClick={toggleLanguage} className="w-full flex items-center justify-between p-3 hover:bg-teal-700/30 transition-colors">
            <div className="flex items-center gap-3">
              <Settings size={16} className="text-teal-300" />
              <span className="text-sm text-teal-50">ভাষা (Language)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-teal-200">{language === 'bn' ? 'বাংলা' : 'English'}</span>
              <ChevronRight size={16} className="text-teal-500" />
            </div>
          </button>
          
          {/* Notification Settings moved to General Settings */}
          <button className="w-full flex items-center justify-between p-3 hover:bg-teal-700/30 transition-colors">
            <div className="flex items-center gap-3">
              <Bell size={16} className="text-teal-300" />
              <span className="text-sm text-teal-50">বিজ্ঞপ্তি সেটিংস (Notification Settings)</span>
            </div>
            <ChevronRight size={16} className="text-teal-500" />
          </button>
        </div>
      </div>

      {/* Location Section */}
      <div className="bg-teal-800/40 rounded-xl border border-teal-700/50 overflow-hidden">
        <div className="p-3 border-b border-teal-700/50">
          <h3 className="font-bold text-white text-sm flex items-center gap-2">
            <MapPin size={16} className="text-teal-400" /> অবস্থান (Location)
          </h3>
        </div>
        <div className="p-4 space-y-3">
          {country ? (
            <div className="flex items-center justify-between bg-teal-900/50 border border-teal-700/50 p-3 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-teal-800 flex items-center justify-center text-teal-300">
                  <MapPin size={16} />
                </div>
                <div>
                  <p className="text-xs text-teal-300">আপনার দেশ (Your Country)</p>
                  <p className="text-sm font-bold text-white">{country}</p>
                </div>
              </div>
              <div className="text-[10px] text-teal-400 bg-teal-900/80 px-2 py-1 rounded border border-teal-700/50">
                Verified
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-teal-200 leading-relaxed">
                ব্যক্তিগতকৃত অফার এবং কন্টেন্ট পেতে আপনার অবস্থান শেয়ার করুন। (Share your location to receive personalized offers and content.)
              </p>
              <button
                onClick={fetchLocation}
                disabled={isFetchingLocation}
                className="w-full bg-teal-600 hover:bg-teal-500 disabled:bg-teal-800 text-white py-2.5 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-2"
              >
                {isFetchingLocation ? (
                  <><RefreshCw size={14} className="animate-spin" /> অবস্থান খোঁজা হচ্ছে...</>
                ) : (
                  <><MapPin size={14} /> অবস্থান শেয়ার করুন</>
                )}
              </button>
              {locationError && (
                <p className="text-[10px] text-red-400 text-center flex items-center justify-center gap-1">
                  <AlertCircle size={12} /> {locationError}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Account Verification Section */}

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
      <SupportChat isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} userData={profileData} />
    </div>
  );
}
