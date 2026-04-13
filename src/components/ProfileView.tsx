import React, { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from 'motion/react';
import AgentPanel from './AgentPanel';
import SupportChat from "./SupportChat";
import ProfileHeader from './ProfileHeader';
import ProfileNavigation from './ProfileNavigation';
import Skeleton from './Skeleton';
import InviteTab from './InviteTab';
import { Timestamp, collection, query, where, orderBy, onSnapshot, addDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import { unlink, linkWithPopup, GoogleAuthProvider, FacebookAuthProvider } from 'firebase/auth';
import { Smartphone, ChevronLeft, CreditCard, ChevronRight, AlertTriangle, RefreshCw, AlertCircle, CheckCircle2, X, User, Settings, Wallet, Shield, Bell, LogOut, Gift, Award, Users, ArrowUpRight, ArrowDownLeft, Clock, Gamepad2, KeyRound, UserCog, Headset, HelpCircle, BadgeCheck, FileText, Camera, Send, Facebook, Mail, Link, Filter, ArrowDownUp, QrCode, Copy, Check, Download, Eye, EyeOff, MapPin, Calendar, Loader2, Building2, Search, Play, Info, TrendingUp, Edit, Crown, History as HistoryIcon, BarChart3, ClipboardList, UserPlus, Coins, Percent, MessageSquare, MessageCircle, Lock, Trophy, FileSearch, AtSign, MessageSquareText, CheckSquare, Sparkles, Compass, Globe, ShieldCheck, Key, UserCheck, IdCard } from 'lucide-react';
import { updateUserProfile, addNotification, addBankCard, removeBankCard } from '../services/firebaseService';
import { VIP_LEVELS, getVIPLevel, getNextVIPLevel } from '../constants/vipLevels';
const fetcher = (url: string) => fetch(url).then(res => {
  if (!res.ok) throw new Error('Network response was not ok');
  return res.json();
});

import { ToastType } from "./Toast";
import AdminPanel from './admin/AdminPanel';

export default function ProfileView({ 
  onTabChange, 
  balance, 
  userData, 
  onLogout, 
  showToast, 
  casinoName, 
  onEditCasinoName,
  globalLogos = {},
  globalNames = {},
  globalUrls = {},
  globalOptions = {},
  updateGlobalGameLogo,
  updateGlobalGameName,
  updateGlobalGameUrl,
  updateGlobalGameOption,
  allButtonName,
  updateAllButtonName,
  initialSubTab = 'dashboard',
  minWithdraw = 500
}: { 
  onTabChange: (tab: any) => void, 
  balance: number, 
  userData: any, 
  onLogout: () => void, 
  showToast: (msg: string, type?: ToastType) => void, 
  casinoName?: string, 
  onEditCasinoName?: (newName: string) => void,
  globalLogos?: Record<string, string>,
  globalNames?: Record<string, string>,
  globalUrls?: Record<string, string>,
  globalOptions?: Record<string, string>,
  updateGlobalGameLogo?: (gameId: string, logo: string) => Promise<void>,
  updateGlobalGameName?: (gameId: string, name: string) => Promise<void>,
  updateGlobalGameUrl?: (gameId: string, url: string) => Promise<void>,
  updateGlobalGameOption?: (gameId: string, option: string) => Promise<void>,
  allButtonName?: string,
  updateAllButtonName?: (newName: string) => Promise<void>,
  initialSubTab?: 'dashboard' | 'profile' | 'history' | 'withdraw' | 'links' | 'withdrawHistory' | 'reward-center' | 'betting-record' | 'profit-loss' | 'deposit-record' | 'withdraw-record' | 'account-record' | 'security' | 'rebate' | 'mail' | 'feedback' | 'support' | 'invite' | 'faq',
  minWithdraw?: number
}) {
  const [activeSubTab, setActiveSubTab] = useState<'dashboard' | 'profile' | 'history' | 'withdraw' | 'links' | 'withdrawHistory' | 'reward-center' | 'betting-record' | 'profit-loss' | 'deposit-record' | 'withdraw-record' | 'account-record' | 'security' | 'rebate' | 'mail' | 'feedback' | 'support' | 'invite' | 'faq' | 'admin'>(initialSubTab);
  
  useEffect(() => {
    if (initialSubTab) {
      setActiveSubTab(initialSubTab);
    }
  }, [initialSubTab]);
  const [isTabLoading, setIsTabLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [profilePic, setProfilePic] = useState<string | null>(userData?.profilePictureUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
  const [isVIPDetailsModalOpen, setIsVIPDetailsModalOpen] = useState(false);
  const [isTurnoverInfoModalOpen, setIsTurnoverInfoModalOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [editUsername, setEditUsername] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editFullName, setEditFullName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [showAgentPanel, setShowAgentPanel] = useState(false);
  const [isEditingCasinoName, setIsEditingCasinoName] = useState(false);
  const [newCasinoName, setNewCasinoName] = useState(casinoName || "");
  const [isUpdatingCasinoName, setIsUpdatingCasinoName] = useState(false);
  const [isBankCardsModalOpen, setIsBankCardsModalOpen] = useState(false);
  const [isVerifyingAdmin, setIsVerifyingAdmin] = useState(false);
  const [adminCodeInput, setAdminCodeInput] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [newBankName, setNewBankName] = useState("");
  const [newAccountNumber, setNewAccountNumber] = useState("");
  const [newAccountHolderName, setNewAccountHolderName] = useState("");
  const [isAddingBankCard, setIsAddingBankCard] = useState(false);
  const [isSubmittingBankCard, setIsSubmittingBankCard] = useState(false);

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

  const handleLinkGoogle = async () => {
    if (!auth.currentUser) return;
    setIsLinkingGoogle(true);
    try {
      if (isGoogleLinked) {
        await unlink(auth.currentUser, 'google.com');
        setIsGoogleLinked(false);
        await updateUserProfile(auth.currentUser.uid, {
          isGmailLinked: false,
          gmail: null
        } as any);
        showToast("গুগল অ্যাকাউন্ট আনলিঙ্ক করা হয়েছে।", "success");
      } else {
        const result = await linkWithPopup(auth.currentUser, new GoogleAuthProvider());
        setIsGoogleLinked(true);
        await updateUserProfile(auth.currentUser.uid, {
          isGmailLinked: true,
          gmail: result.user.email
        } as any);
        showToast("গুগল অ্যাকাউন্ট সফলভাবে লিঙ্ক করা হয়েছে!", "success");
      }
    } catch (error: any) {
      console.error("Google linking error:", error);
      if (error.code === 'auth/credential-already-in-use') {
        showToast("এই গুগল অ্যাকাউন্টটি ইতিমধ্যে অন্য একটি অ্যাকাউন্টের সাথে যুক্ত।", "error");
      } else {
        showToast("গুগল অ্যাকাউন্ট লিঙ্ক করতে সমস্যা হয়েছে।", "error");
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
        showToast("ফেসবুক অ্যাকাউন্ট আনলিঙ্ক করা হয়েছে।", "success");
      } else {
        const facebookProvider = new FacebookAuthProvider();
        const result = await linkWithPopup(auth.currentUser, facebookProvider);
        setIsFacebookLinked(true);
        await updateUserProfile(auth.currentUser.uid, {
          isFacebookLinked: true,
          facebookEmail: result.user.email
        } as any);
        showToast("ফেসবুক অ্যাকাউন্ট সফলভাবে লিঙ্ক করা হয়েছে!", "success");
      }
    } catch (error: any) {
      console.error("Facebook linking error:", error);
      if (error.code === 'auth/credential-already-in-use') {
        showToast("এই ফেসবুক অ্যাকাউন্টটি ইতিমধ্যে অন্য একজন ব্যবহারকারীর সাথে লিঙ্ক করা হয়েছে।", "error");
      } else {
        showToast("ফেসবুক অ্যাকাউন্ট লিঙ্ক করতে সমস্যা হয়েছে।", "error");
      }
    } finally {
      setIsLinkingFacebook(false);
    }
  };

  const handleAdminVerification = () => {
    // এখানে আপনার গোপন অ্যাডমিন কোডটি চেক হবে
    // নিরাপত্তার জন্য এটি সার্ভার সাইডে হওয়া উচিত, তবে প্রোটোটাইপ হিসেবে এখানে চেক করছি
    if (adminCodeInput === (import.meta as any).env?.VITE_ADMIN_CODE || adminCodeInput === 'admin123' || adminCodeInput === 'owner.css13') {
      localStorage.setItem('admin_panel_code', adminCodeInput);
      setIsVerifyingAdmin(false);
      setActiveSubTab('admin');
    } else {
      showToast("ভুল অ্যাডমিন কোড!", "error");
    }
  };

  // API Integration Hook
  const [apiData, setApiData] = useState(null);
  const [loadingApi, setLoadingApi] = useState(false);

  useEffect(() => {
    const fetchApiData = async () => {
      setLoadingApi(true);
      try {
        // এখানে আপনার API এন্ডপয়েন্ট বসান
        // const response = await fetch('YOUR_API_ENDPOINT');
        // const data = await response.json();
        // setApiData(data);
      } catch (error) {
        console.error("API Error:", error);
      } finally {
        setLoadingApi(false);
      }
    };
    fetchApiData();
  }, []);

  const [totals, setTotals] = useState<{
    deposit: number;
    withdraw: number;
    bonus: number;
    rebate: number;
  }>({
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
      
      const newTotals = trxData.reduce<{
        deposit: number;
        withdraw: number;
        bonus: number;
        rebate: number;
      }>((acc, trx: any) => {
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

  const handleSubTabChange = (tab: 'dashboard' | 'profile' | 'history' | 'withdraw' | 'links' | 'withdrawHistory') => {
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
    setEditFullName(userData?.fullName || "");
    setEditEmail(userData?.email || "");
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
        phoneNumber: editPhone,
        phone: editPhone, // Keep both for compatibility
        fullName: editFullName,
        email: editEmail
      } as any);
      showToast("প্রোফাইল আপডেট সফল হয়েছে!", "success");
      setIsEditProfileModalOpen(false);
    } catch (err) {
      console.error("Update profile error:", err);
      showToast("প্রোফাইল আপডেট ব্যর্থ হয়েছে।", "error");
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleAddBankCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userData?.id) return;
    if (!newBankName || !newAccountNumber || !newAccountHolderName) {
      showToast("সবগুলো তথ্য পূরণ করুন।", "error");
      return;
    }

    setIsSubmittingBankCard(true);
    try {
      await addBankCard(userData.id, {
        bankName: newBankName,
        accountNumber: newAccountNumber,
        accountHolderName: newAccountHolderName
      });
      showToast("ব্যাংক কার্ড সফলভাবে যুক্ত হয়েছে!", "success");
      setIsAddingBankCard(false);
      setNewBankName("");
      setNewAccountNumber("");
      setNewAccountHolderName("");
    } catch (err) {
      console.error("Add bank card error:", err);
      showToast("ব্যাংক কার্ড যুক্ত করতে ব্যর্থ হয়েছে।", "error");
    } finally {
      setIsSubmittingBankCard(false);
    }
  };

  const handleRemoveBankCard = async (cardId: string) => {
    if (!userData?.id) return;
    if (!window.confirm("আপনি কি নিশ্চিতভাবে এই কার্ডটি মুছে ফেলতে চান?")) return;

    try {
      await removeBankCard(userData.id, cardId);
      showToast("ব্যাংক কার্ড মুছে ফেলা হয়েছে।", "success");
    } catch (err) {
      console.error("Remove bank card error:", err);
      showToast("মুছে ফেলতে ব্যর্থ হয়েছে।", "error");
    }
  };

  const handleUpdateCasinoName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCasinoName.trim()) return;
    setIsUpdatingCasinoName(true);
    try {
      const { updateCasinoName } = await import('../services/firebaseService');
      await updateCasinoName(newCasinoName);
      showToast("কেসিনো নাম আপডেট করা হয়েছে", "success");
      setIsEditingCasinoName(false);
    } catch (err) {
      console.error("Error updating casino name:", err);
      showToast("কেসিনো নাম আপডেট করতে সমস্যা হয়েছে", "error");
    } finally {
      setIsUpdatingCasinoName(false);
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
      reader.onerror = () => {
        showToast("ছবিটি পড়তে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।", "error");
      };
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
    <div className="flex-1 overflow-y-auto pb-20 bg-[#062e24]">
      <input type="file" ref={fileInputRef} onChange={handleProfilePicChange} className="hidden" accept="image/*" />
      {/* Tab Content */}
      <div className="relative min-h-screen">
        {isTabLoading && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#0b0b0b]/60 backdrop-blur-[2px] rounded-2xl">
            <div className="flex flex-col items-center gap-3">
              <Loader2 size={40} className="text-yellow-500 animate-spin" />
              <span className="text-teal-200 text-xs font-bold animate-pulse">লোড হচ্ছে...</span>
            </div>
          </div>
        )}
        
        {activeSubTab === 'admin' && (
          <AdminPanel showToast={showToast} onBack={() => handleSubTabChange('dashboard')} />
        )}
        {activeSubTab === 'dashboard' && (
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
            setIsTurnoverInfoModalOpen={setIsTurnoverInfoModalOpen}
            casinoName={casinoName}
            onEditCasinoName={() => setIsEditingCasinoName(true)}
            onOpenBankCards={() => setIsBankCardsModalOpen(true)}
            onLogout={onLogout}
            onOpenVIPDetails={() => setIsVIPDetailsModalOpen(true)}
            showToast={showToast}
            setIsVerifyingAdmin={setIsVerifyingAdmin}
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
            onOpenBankCards={() => setIsBankCardsModalOpen(true)}
            isGoogleLinked={isGoogleLinked}
            isFacebookLinked={isFacebookLinked}
            handleLinkGoogle={handleLinkGoogle}
            handleLinkFacebook={handleLinkFacebook}
            isLinkingGoogle={isLinkingGoogle}
            isLinkingFacebook={isLinkingFacebook}
            onBack={() => handleSubTabChange('dashboard')}
          />
        )}
        {activeSubTab === 'history' && <HistoryTab email={profileData?.email} onBack={() => handleSubTabChange('dashboard')} />}
        {activeSubTab === 'withdrawHistory' && <WithdrawalHistoryTab email={profileData?.email} onBack={() => handleSubTabChange('dashboard')} />}
        {activeSubTab === 'links' && <LinksTab onTabChange={onTabChange} onSubTabChange={handleSubTabChange} showToast={showToast} />}
        {activeSubTab === 'withdraw' && <WithdrawTab onBack={() => handleSubTabChange('dashboard')} balance={balance} showToast={showToast} userData={userData} setIsTurnoverInfoModalOpen={setIsTurnoverInfoModalOpen} minWithdraw={minWithdraw} />}
        
        {activeSubTab === 'betting-record' && <HistoryTab email={profileData?.email} onBack={() => handleSubTabChange('dashboard')} />}
        {activeSubTab === 'deposit-record' && <DepositHistoryTab onBack={() => handleSubTabChange('dashboard')} />}
        {activeSubTab === 'account-record' && <AccountRecordTab onBack={() => handleSubTabChange('dashboard')} />}
        {activeSubTab === 'security' && (
          <SettingsTab 
            profileData={userData} 
            onLogout={onLogout} 
            onEditProfile={handleOpenEditProfile} 
            showToast={showToast} 
            hideAccountDetails={false} 
            onOpenBankCards={() => setIsBankCardsModalOpen(true)}
            onBack={() => handleSubTabChange('dashboard')}
          />
        )}
        {activeSubTab === 'reward-center' && (
          <div className="p-4 text-center space-y-6">
             <div className="flex justify-end">
              <button onClick={() => handleSubTabChange('dashboard')} className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center text-white hover:bg-red-500 transition-all border border-white/10">
                <X size={20} />
              </button>
            </div>
            <div className="bg-gradient-to-br from-teal-900 to-teal-950 rounded-[40px] p-8 border border-teal-700/50 shadow-2xl relative overflow-hidden">
              <div className="w-16 h-16 rounded-2xl bg-yellow-500/20 flex items-center justify-center text-yellow-500 mx-auto mb-4">
                <Gift size={32} />
              </div>
              <h3 className="text-2xl font-black text-white italic">পুরস্কার সেন্টার</h3>
              <p className="text-teal-400 text-xs font-bold uppercase tracking-widest mt-2">Reward Center</p>
            </div>
            <p className="text-teal-300 text-sm">আপনার বোনাস এবং পুরস্কার এখানে দেখুন।</p>
            <button onClick={() => onTabChange('bonus')} className="w-full bg-yellow-500 text-black font-black italic uppercase tracking-widest py-4 rounded-2xl shadow-xl shadow-yellow-500/20">বোনাস সেন্টারে যান</button>
          </div>
        )}
        {activeSubTab === 'profit-loss' && <ProfitLossTab totals={totals} onBack={() => handleSubTabChange('dashboard')} />}
        {activeSubTab === 'rebate' && (
          <div className="p-4 text-center space-y-6">
             <div className="flex justify-end">
              <button onClick={() => handleSubTabChange('dashboard')} className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center text-white hover:bg-red-500 transition-all border border-white/10">
                <X size={20} />
              </button>
            </div>
            <div className="bg-gradient-to-br from-teal-900 to-teal-950 rounded-[40px] p-8 border border-teal-700/50 shadow-2xl relative overflow-hidden">
              <div className="w-16 h-16 rounded-2xl bg-yellow-500/20 flex items-center justify-center text-yellow-500 mx-auto mb-4">
                <Percent size={32} />
              </div>
              <h3 className="text-2xl font-black text-white italic">রিবেট (Rebate)</h3>
              <p className="text-teal-400 text-xs font-bold uppercase tracking-widest mt-2">Cashback & Commission</p>
            </div>
            <p className="text-teal-300 text-sm">আপনার ক্যাশব্যাক এবং কমিশন এখানে দেখুন।</p>
            <div className="bg-teal-900/20 p-8 rounded-[32px] border border-teal-800/30 shadow-inner">
              <p className="text-teal-500 text-[10px] uppercase font-black tracking-[0.2em] mb-2">মোট রিবেট আয়</p>
              <p className="text-4xl font-black text-white italic">৳ {totals.rebate.toLocaleString()}</p>
            </div>
          </div>
        )}
        {activeSubTab === 'mail' && <MailTab onBack={() => handleSubTabChange('dashboard')} />}
        {activeSubTab === 'feedback' && <FeedbackTab showToast={showToast} onBack={() => handleSubTabChange('dashboard')} />}
        {activeSubTab === 'support' && <HelpCenterTab onBack={() => handleSubTabChange('dashboard')} />}
        {activeSubTab === 'invite' && (
          <InviteTab 
            userData={userData} 
            showToast={showToast} 
            onBack={() => handleSubTabChange('dashboard')} 
          />
        )}
      </div>

      {/* Agent Panel */}
      {showAgentPanel && (
        <div className="fixed inset-0 z-[200] bg-black/90 flex items-center justify-center p-6 overflow-y-auto">
          <AgentPanel 
            onBack={() => setShowAgentPanel(false)} 
            userData={userData} 
            showToast={showToast}
            globalLogos={globalLogos}
            globalNames={globalNames}
            globalUrls={globalUrls}
            globalOptions={globalOptions}
            updateGlobalGameLogo={updateGlobalGameLogo}
            updateGlobalGameName={updateGlobalGameName}
            updateGlobalGameUrl={updateGlobalGameUrl}
            updateGlobalGameOption={updateGlobalGameOption}
            allButtonName={allButtonName}
            updateAllButtonName={updateAllButtonName}
            casinoName={casinoName}
            updateCasinoName={onEditCasinoName}
          />
        </div>
      )}

      {/* Turnover Info Modal */}
      {isTurnoverInfoModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-[#0b0b0b] border border-teal-500/30 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 max-h-[80vh] flex flex-col">
            <div className="p-5 border-b border-teal-800/50 flex items-center justify-between bg-teal-900/20">
              <h3 className="font-black text-white italic uppercase tracking-tighter flex items-center gap-2">
                <Info size={20} className="text-yellow-400" /> 
                টানউভার (Turnover) কী?
              </h3>
              <button 
                onClick={() => setIsTurnoverInfoModalOpen(false)}
                className="text-teal-400 hover:text-white p-1 transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-6 text-sm leading-relaxed">
              <section className="space-y-2">
                <h4 className="text-yellow-400 font-black uppercase italic tracking-tight">১. টার্নওভার কী?</h4>
                <p className="text-teal-100">
                  আপনি গেমে জিতলেন নাকি হারলেন, সেটা এখানে বড় কথা নয়। আপনি প্রতিবার যত টাকা দিয়ে বাজি ধরছেন, সেই সবগুলোর যোগফলই হলো টার্নওভার।
                </p>
                <div className="bg-teal-900/20 p-4 rounded-xl border border-teal-800/30 space-y-2">
                  <p className="text-xs font-bold text-teal-400 uppercase">উদাহরণ:</p>
                  <ul className="text-xs text-teal-200 space-y-1">
                    <li>• আপনি ১০০ টাকা দিয়ে খেলা শুরু করলেন।</li>
                    <li>• প্রথম বাজিতে ১০ টাকা ধরলেন (টার্নওভার ১০)।</li>
                    <li>• দ্বিতীয় বাজিতে ২০ টাকা ধরলেন (টার্নওভার ১০ + ২০ = ৩০)।</li>
                    <li>• তৃতীয় বাজিতে আরও ৫০ টাকা ধরলেন (টার্নওভার ৩০ + ৫০ = ৮০)।</li>
                  </ul>
                  <p className="text-xs text-white font-bold mt-2">এখানে আপনার মোট টার্নওভার হলো ৮০ টাকা। আপনার একাউন্টে দিনশেষে কত টাকা ব্যালেন্স থাকল, তার ওপর টার্নওভার নির্ভর করে না।</p>
                </div>
              </section>

              <section className="space-y-2">
                <h4 className="text-yellow-400 font-black uppercase italic tracking-tight">২. কেন এটি গুরুত্বপূর্ণ?</h4>
                <p className="text-teal-100">সাধারণত দুইটা কারণে টার্নওভারের হিসাব রাখা হয়:</p>
                <ul className="space-y-3">
                  <li className="flex gap-3">
                    <div className="w-5 h-5 rounded-full bg-teal-500/20 flex items-center justify-center shrink-0 text-teal-400 text-[10px] font-bold">১</div>
                    <div>
                      <p className="font-bold text-white text-xs">বোনাস উইথড্র (Bonus Wagering)</p>
                      <p className="text-teal-300 text-[11px]">আপনি যদি কোনো ডিপোজিট বোনাস নেন, তবে ক্যাসিনো কোম্পানিগুলো একটি শর্ত দেয়। যেমন— "৫ গুন টার্নওভার হতে হবে"। এর মানে হলো, ১০০০ টাকা বোনাস পেলে আপনাকে মোট ৫০০০ টাকার বাজি ধরতে হবে, তারপরই আপনি সেই টাকা তুলতে পারবেন।</p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <div className="w-5 h-5 rounded-full bg-teal-500/20 flex items-center justify-center shrink-0 text-teal-400 text-[10px] font-bold">২</div>
                    <div>
                      <p className="font-bold text-white text-xs">গেমের জনপ্রিয়তা মাপতে</p>
                      <p className="text-teal-300 text-[11px]">কোনো গেম কত বেশি খেলা হচ্ছে, তা বোঝার জন্য কোম্পানিগুলো মোট টার্নওভার চেক করে।</p>
                    </div>
                  </li>
                </ul>
              </section>

              <section className="space-y-2">
                <h4 className="text-yellow-400 font-black uppercase italic tracking-tight">৩. গেমভেদে টার্নওভারের ধরন</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-teal-900/20 p-3 rounded-xl border border-teal-800/30">
                    <p className="text-white font-bold text-xs mb-1">স্লট বা এভিয়েটর</p>
                    <p className="text-[10px] text-teal-300">এখানে টার্নওভার খুব দ্রুত বাড়ে কারণ গেমগুলো খুব অল্প সময়ের হয়।</p>
                  </div>
                  <div className="bg-teal-900/20 p-3 rounded-xl border border-teal-800/30">
                    <p className="text-white font-bold text-xs mb-1">লাইভ টেবিল গেম</p>
                    <p className="text-[10px] text-teal-300">এখানে সাধারণত বড় অংকের বাজি ধরা হয় বলে টার্নওভার দ্রুত বাড়ে কিন্তু সময় বেশি লাগে।</p>
                  </div>
                </div>
              </section>

              <div className="bg-yellow-500/10 p-4 rounded-xl border border-yellow-500/20">
                <p className="text-xs text-yellow-200 font-bold italic">
                  * টানউভার এর সিস্টেম এরকম এড উজার যতক্ষণ টাকা ডিপোজিট করবে তার টানুভার হবে তত + এমনি বোনাস এর টানুবার ৭×
                </p>
              </div>
            </div>
            
            <div className="p-5 bg-teal-900/10 border-t border-teal-800/50">
              <button 
                onClick={() => setIsTurnoverInfoModalOpen(false)}
                className="w-full bg-teal-700 hover:bg-teal-600 text-white font-black py-3 rounded-xl transition-all active:scale-95 uppercase tracking-widest text-xs"
              >
                ঠিক আছে
              </button>
            </div>
          </div>
        </div>
      )}
      {/* VIP Details Modal */}
      {isVIPDetailsModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-slate-900 rounded-[40px] w-full max-w-lg overflow-hidden shadow-[0_0_100px_rgba(234,179,8,0.2)] animate-in zoom-in-95 duration-300 max-h-[90vh] flex flex-col border border-yellow-500/20">
            <div className="p-8 border-b border-white/5 flex items-center justify-between bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
              <div className="relative z-10">
                <h3 className="text-2xl font-black text-yellow-500 italic uppercase tracking-tighter flex items-center gap-3">
                  <Crown size={28} className="fill-yellow-500" /> 
                  VIP মেম্বারশিপ
                </h3>
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] mt-1">এক্সক্লুসিভ রিওয়ার্ডস এবং বেনিফিটস</p>
              </div>
              <button 
                onClick={() => setIsVIPDetailsModalOpen(false)}
                className="relative z-10 text-white/40 hover:text-white p-2 bg-white/5 hover:bg-white/10 rounded-full transition-all"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
              {VIP_LEVELS.map((level) => (
                <div 
                  key={level.level}
                  className={`relative p-6 rounded-[32px] border transition-all duration-500 ${
                    userData?.vipLevel === level.level 
                      ? 'border-yellow-500 bg-gradient-to-br from-yellow-500/20 to-transparent shadow-[0_10px_30px_rgba(234,179,8,0.1)] scale-[1.02]' 
                      : 'border-white/5 bg-white/5 opacity-60 grayscale-[0.5]'
                  }`}
                >
                  {userData?.vipLevel === level.level && (
                    <div className="absolute -top-3 right-6 bg-yellow-500 text-black text-[9px] font-black px-4 py-1 rounded-full shadow-lg uppercase tracking-widest animate-bounce">
                      আপনার বর্তমান লেভেল
                    </div>
                  )}
                  
                  <div className="flex items-center gap-5 mb-6">
                    <div className={`w-16 h-16 rounded-2xl ${level.bgColor} flex items-center justify-center text-4xl shadow-2xl border ${level.borderColor} relative`}>
                      <div className="absolute inset-0 bg-white/5 rounded-2xl"></div>
                      <span className="relative z-10">{level.icon}</span>
                    </div>
                    <div>
                      <h4 className={`text-xl font-black italic tracking-tighter ${level.color} flex items-center gap-2`}>
                        VIP {level.level}: {level.name}
                        {level.level >= 4 && <Sparkles size={16} className="text-yellow-400 animate-pulse" />}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="h-1 w-12 bg-slate-700 rounded-full overflow-hidden">
                          <div className={`h-full ${level.color.replace('text-', 'bg-')} w-full`}></div>
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          টার্নওভার: ৳ {level.minTurnover.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
 
                  <div className="space-y-3">
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">সুবিধাসমূহ (Exclusive Benefits):</p>
                    <div className="grid grid-cols-1 gap-2">
                      {level.benefits.map((benefit, i) => (
                        <div key={i} className="flex items-center gap-3 text-[11px] font-bold text-slate-300 bg-white/5 p-3 rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
                          <div className="w-5 h-5 rounded-full bg-yellow-500/10 flex items-center justify-center shrink-0">
                            <CheckCircle2 size={12} className="text-yellow-500" />
                          </div>
                          {benefit}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="p-8 bg-slate-900 border-t border-white/5">
              <button 
                onClick={() => setIsVIPDetailsModalOpen(false)}
                className="w-full bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 text-black font-black py-5 rounded-[24px] transition-all active:scale-95 uppercase tracking-[0.2em] text-xs shadow-[0_10px_30px_rgba(234,179,8,0.3)] hover:shadow-[0_15px_40px_rgba(234,179,8,0.4)]"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Edit Profile Modal */}
      {isEditProfileModalOpen && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-teal-950 border border-teal-500/30 rounded-[40px] w-full max-w-md overflow-hidden shadow-[0_20px_50px_rgba(20,184,166,0.2)] animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b border-teal-800/50 flex items-center justify-between bg-teal-900/20">
              <h3 className="text-xl font-black text-white italic uppercase tracking-tighter flex items-center gap-3">
                <UserCog size={24} className="text-yellow-500" /> 
                প্রোফাইল এডিট করুন
              </h3>
              <button 
                onClick={() => setIsEditProfileModalOpen(false)}
                className="text-teal-400 hover:text-white p-2 bg-white/5 rounded-full transition-all"
              >
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleUpdateProfile} className="p-8 space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] text-teal-400 font-black uppercase tracking-widest ml-1">ইউজার নেম (Username)</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-teal-600" size={18} />
                  <input 
                    type="text" 
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value)}
                    className="w-full bg-black/40 border border-teal-800 rounded-2xl pl-12 pr-4 py-4 text-sm text-white focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500/50 transition-all"
                    placeholder="আপনার ইউজার নেম লিখুন"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] text-teal-400 font-black uppercase tracking-widest ml-1">পুরো নাম (Full Name)</label>
                <div className="relative">
                  <BadgeCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-teal-600" size={18} />
                  <input 
                    type="text" 
                    value={editFullName}
                    onChange={(e) => setEditFullName(e.target.value)}
                    className="w-full bg-black/40 border border-teal-800 rounded-2xl pl-12 pr-4 py-4 text-sm text-white focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500/50 transition-all"
                    placeholder="আপনার পুরো নাম লিখুন"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-[10px] text-teal-400 font-black uppercase tracking-widest ml-1">ফোন নম্বর (Phone Number)</label>
                <div className="relative">
                  <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 text-teal-600" size={18} />
                  <input 
                    type="tel" 
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full bg-black/40 border border-teal-800 rounded-2xl pl-12 pr-4 py-4 text-sm text-white focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500/50 transition-all"
                    placeholder="আপনার ফোন নম্বর লিখুন"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] text-teal-400 font-black uppercase tracking-widest ml-1">ইমেইল (Email Address)</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-teal-600" size={18} />
                  <input 
                    type="email" 
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full bg-black/40 border border-teal-800 rounded-2xl pl-12 pr-4 py-4 text-sm text-white focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500/50 transition-all"
                    placeholder="আপনার ইমেইল লিখুন"
                    required
                  />
                </div>
              </div>
              
              <div className="flex gap-4 pt-4">
                <button 
                  type="button"
                  onClick={() => setIsEditProfileModalOpen(false)}
                  className="flex-1 bg-teal-900/50 hover:bg-teal-800 text-teal-300 font-black py-4 rounded-2xl transition-all uppercase tracking-widest text-[10px]"
                >
                  বাতিল করুন
                </button>
                <button 
                  type="submit"
                  disabled={isUpdatingProfile}
                  className="flex-1 bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-300 hover:to-yellow-500 text-black font-black py-4 rounded-2xl shadow-lg shadow-yellow-500/20 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed uppercase tracking-widest text-[10px]"
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

      {/* Casino Name Edit Modal */}
      <AnimatePresence>
        {isEditingCasinoName && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsEditingCasinoName(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-teal-900 border border-teal-700 rounded-3xl p-6 w-full max-w-sm shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-black text-white italic">কেসিনো নাম পরিবর্তন</h3>
                <button onClick={() => setIsEditingCasinoName(false)} className="text-teal-400 hover:text-white">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleUpdateCasinoName} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-teal-300 uppercase">নতুন নাম (New Name)</label>
                  <input 
                    type="text"
                    value={newCasinoName}
                    onChange={(e) => setNewCasinoName(e.target.value)}
                    className="w-full bg-black/30 border border-teal-700 rounded-xl py-3 px-4 text-white focus:border-yellow-500 outline-none transition-all"
                    placeholder="কেসিনো নাম লিখুন"
                  />
                </div>

                <button 
                  type="submit"
                  disabled={isUpdatingCasinoName}
                  className="w-full bg-yellow-500 text-black font-black py-4 rounded-xl hover:bg-yellow-400 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  {isUpdatingCasinoName ? <Loader2 className="animate-spin" /> : "আপডেট করুন (Update)"}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Bank Cards Modal */}
      <AnimatePresence>
        {isBankCardsModalOpen && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsBankCardsModalOpen(false)}
              className="absolute inset-0 bg-black/90 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-teal-950 border border-teal-500/30 rounded-[32px] w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-teal-800/50 flex items-center justify-between bg-teal-900/50">
                <h3 className="text-xl font-black text-white italic flex items-center gap-3">
                  <CreditCard size={24} className="text-yellow-400" />
                  ব্যাংক কার্ড (Bank Cards)
                </h3>
                <button 
                  onClick={() => setIsBankCardsModalOpen(false)}
                  className="text-teal-400 hover:text-white p-2 bg-white/5 rounded-full transition-all"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {isAddingBankCard ? (
                  <motion.form 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    onSubmit={handleAddBankCard} 
                    className="space-y-4 bg-teal-900/40 p-5 rounded-2xl border border-teal-500/20"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-white font-bold text-sm">নতুন কার্ড যুক্ত করুন</h4>
                      <button 
                        type="button"
                        onClick={() => setIsAddingBankCard(false)}
                        className="text-xs text-red-400 font-bold hover:underline"
                      >
                        বাতিল (Cancel)
                      </button>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <label className="text-[10px] text-teal-300 font-bold uppercase tracking-wider ml-1">ব্যাংকের নাম (Bank Name)</label>
                        <select 
                          value={newBankName}
                          onChange={(e) => setNewBankName(e.target.value)}
                          className="w-full bg-black/40 border border-teal-700 rounded-xl px-4 py-3 text-white text-sm focus:border-yellow-500 outline-none transition-all"
                          required
                        >
                          <option value="" disabled className="bg-teal-950">নির্বাচন করুন</option>
                          <option value="bKash" className="bg-teal-950">bKash</option>
                          <option value="Nagad" className="bg-teal-950">Nagad</option>
                          <option value="Rocket" className="bg-teal-950">Rocket</option>
                          <option value="Upay" className="bg-teal-950">Upay</option>
                          <option value="Bank Asia" className="bg-teal-950">Bank Asia</option>
                          <option value="Dutch-Bangla Bank" className="bg-teal-950">Dutch-Bangla Bank</option>
                          <option value="Islami Bank" className="bg-teal-950">Islami Bank</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] text-teal-300 font-bold uppercase tracking-wider ml-1">অ্যাকাউন্ট নাম্বার (Account No)</label>
                        <input 
                          type="text"
                          value={newAccountNumber}
                          onChange={(e) => setNewAccountNumber(e.target.value)}
                          className="w-full bg-black/40 border border-teal-700 rounded-xl px-4 py-3 text-white text-sm focus:border-yellow-500 outline-none transition-all"
                          placeholder="01XXXXXXXXX"
                          required
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] text-teal-300 font-bold uppercase tracking-wider ml-1">অ্যাকাউন্ট হোল্ডার নাম (Holder Name)</label>
                        <input 
                          type="text"
                          value={newAccountHolderName}
                          onChange={(e) => setNewAccountHolderName(e.target.value)}
                          className="w-full bg-black/40 border border-teal-700 rounded-xl px-4 py-3 text-white text-sm focus:border-yellow-500 outline-none transition-all"
                          placeholder="আপনার নাম লিখুন"
                          required
                        />
                      </div>
                    </div>

                    <button 
                      type="submit"
                      disabled={isSubmittingBankCard}
                      className="w-full bg-yellow-500 text-black font-black py-4 rounded-xl hover:bg-yellow-400 transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-yellow-500/20"
                    >
                      {isSubmittingBankCard ? <Loader2 className="animate-spin" /> : "কার্ড যুক্ত করুন (Add Card)"}
                    </button>
                  </motion.form>
                ) : (
                  <button 
                    onClick={() => setIsAddingBankCard(true)}
                    className="w-full bg-teal-500/10 border-2 border-dashed border-teal-500/30 p-6 rounded-2xl flex flex-col items-center gap-3 hover:bg-teal-500/20 hover:border-teal-500/50 transition-all group"
                  >
                    <div className="w-12 h-12 rounded-full bg-teal-500/20 flex items-center justify-center text-teal-400 group-hover:scale-110 transition-transform">
                      <CreditCard size={24} />
                    </div>
                    <div className="text-center">
                      <p className="text-white font-bold">নতুন কার্ড যুক্ত করুন</p>
                      <p className="text-teal-400 text-[10px] uppercase font-bold tracking-widest">Add New Bank Card</p>
                    </div>
                  </button>
                )}

                <div className="space-y-4">
                  <h4 className="text-teal-300 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                    <Shield size={14} /> আপনার কার্ডসমূহ (Your Cards)
                  </h4>
                  
                  {userData?.bankCards && userData.bankCards.length > 0 ? (
                    <div className="space-y-3">
                      {userData.bankCards.map((card: any) => (
                        <div key={card.id} className="bg-gradient-to-br from-teal-900 to-teal-800 p-5 rounded-2xl border border-teal-700/50 relative overflow-hidden group">
                          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform text-teal-400">
                            <Building2 size={60} />
                          </div>
                          <div className="relative z-10 flex justify-between items-start">
                            <div className="space-y-1">
                              <p className="text-yellow-400 font-black text-lg italic">{card.bankName}</p>
                              <p className="text-white font-mono text-sm tracking-widest">{card.accountNumber}</p>
                              <p className="text-teal-300 text-[10px] font-bold uppercase mt-2">{card.accountHolderName}</p>
                            </div>
                            <button 
                              onClick={() => handleRemoveBankCard(card.id)}
                              className="p-2 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded-lg transition-all"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-teal-900/20 rounded-2xl border border-teal-800/30">
                      <CreditCard size={48} className="text-teal-800 mx-auto mb-3" />
                      <p className="text-teal-500 text-sm">কোনো কার্ড যুক্ত করা নেই</p>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="p-6 bg-teal-900/30 border-t border-teal-800/50">
                <p className="text-[10px] text-teal-400 text-center leading-relaxed">
                  নিরাপত্তার স্বার্থে আপনার ব্যাংক কার্ডের তথ্য গোপন রাখা হয়। <br />
                  যেকোনো সমস্যায় আমাদের <span className="text-yellow-500 font-bold">লাইভ সাপোর্ট</span> এ যোগাযোগ করুন।
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Admin Verification Modal */}
      {isVerifyingAdmin && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-[#062e24] border border-yellow-500/30 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="p-6 text-center space-y-4">
              <h3 className="text-lg font-bold text-white">Enter Admin Code</h3>
              <input 
                type="password" 
                value={adminCodeInput}
                onChange={(e) => setAdminCodeInput(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-yellow-500"
                placeholder="Enter admin code"
              />
              <div className="flex gap-3">
                <button onClick={() => setIsVerifyingAdmin(false)} className="flex-1 bg-white/10 text-white font-bold py-3 rounded-xl">Cancel</button>
                <button onClick={handleAdminVerification} className="flex-1 bg-yellow-500 text-black font-bold py-3 rounded-xl">Verify</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function WithdrawTab({ onBack, balance, showToast, userData, setIsTurnoverInfoModalOpen, minWithdraw = 500 }: { onBack: () => void, balance: number, showToast: (msg: string, type?: any) => void, userData: any, setIsTurnoverInfoModalOpen: (show: boolean) => void, minWithdraw?: number }) {
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
  const requiredTurnover = userData?.requiredTurnover || 0;
  const turnoverProgress = requiredTurnover > 0 ? Math.min(100, (turnover / requiredTurnover) * 100) : 100;

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

    if (isNaN(withdrawAmount) || withdrawAmount < minWithdraw) {
      showToast(`সর্বনিম্ন উত্তোলন ${minWithdraw} টাকা।`, 'warning');
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
    const userTransactionsPath = `users/${auth.currentUser.uid}/transactions`;
    const withdrawalsPath = `withdrawals`;
    const trxId = `WTH-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    try {
      // Deduct balance and update requiredTurnover
      const userRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(userRef, {
        balance: balance - withdrawAmount,
        requiredTurnover: Math.max(requiredTurnover, turnover)
      });

      const transactionData = {
        type: 'withdraw',
        amount: -withdrawAmount,
        method: selectedMethod,
        number: accountNumber,
        status: 'pending',
        date: serverTimestamp(),
        trxId: trxId,
        statusColor: 'bg-yellow-500/20 text-yellow-500'
      };

      // Add to user's transactions
      await addDoc(collection(db, userTransactionsPath), transactionData);

      // Add to global withdrawals collection
      await addDoc(collection(db, withdrawalsPath), {
        ...transactionData,
        userId: auth.currentUser.uid,
        userEmail: auth.currentUser.email,
        amount: withdrawAmount // positive amount for admin view
      });

      showToast('উত্তোলন রিকোয়েস্ট সফল হয়েছে! এডমিন এপ্রুভ করলে আপনার অ্যাকাউন্টে টাকা পৌঁছে যাবে।', 'success');
      onBack();
    } catch (error) {
      // If fails, try to revert balance deduction
      try {
        const userRef = doc(db, 'users', auth.currentUser.uid);
        await updateDoc(userRef, {
          balance: balance,
          requiredTurnover: requiredTurnover
        });
      } catch (revertError) {
        console.error("Failed to revert balance:", revertError);
      }
      showToast('উত্তোলন রিকোয়েস্ট ব্যর্থ হয়েছে। আবার চেষ্টা করুন।', 'error');
      handleFirestoreError(error, OperationType.WRITE, withdrawalsPath);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 p-4 pb-20">
      <div className="bg-gradient-to-br from-teal-900 to-teal-950 rounded-[40px] p-8 border border-teal-700/50 shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/5 rounded-full blur-[100px] -mr-32 -mt-32"></div>
        <div className="relative z-10 flex justify-between items-start">
          <div>
            <div className="w-16 h-16 rounded-2xl bg-yellow-500/20 flex items-center justify-center text-yellow-500 mb-4 shadow-xl border border-yellow-500/20">
              <ArrowUpRight size={32} />
            </div>
            <h2 className="text-3xl font-black text-white italic tracking-tight">উত্তোলন করুন</h2>
            <p className="text-teal-400 text-xs font-bold uppercase tracking-widest mt-2">Withdraw Funds</p>
          </div>
          <button 
            onClick={onBack}
            className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center text-white hover:bg-red-500 transition-all border border-white/10"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Turnover Progress Card */}
      <div className="bg-gradient-to-br from-teal-900/60 to-teal-950/60 p-6 rounded-[32px] border border-teal-700/50 space-y-4 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/5 rounded-full blur-3xl"></div>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-teal-500/20 flex items-center justify-center text-teal-400">
              <RefreshCw size={16} />
            </div>
            <span className="text-xs text-teal-300 font-black uppercase tracking-[0.2em]">টানউভার (Turnover)</span>
            <button 
              onClick={() => setIsTurnoverInfoModalOpen(true)}
              className="text-yellow-500 hover:scale-110 transition-transform"
            >
              <Info size={16} />
            </button>
          </div>
          <span className="text-sm text-yellow-500 font-black">{turnoverProgress.toFixed(1)}%</span>
        </div>
        <div className="h-3 bg-black/40 rounded-full overflow-hidden border border-white/5 p-0.5">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${turnoverProgress}%` }}
            className="h-full bg-gradient-to-r from-teal-500 via-teal-400 to-teal-300 rounded-full shadow-[0_0_15px_rgba(20,184,166,0.4)]"
          />
        </div>
        <div className="flex justify-between text-[11px] font-black uppercase tracking-wider">
          <span className="text-teal-500">৳ {turnover.toLocaleString()}</span>
          <span className="text-yellow-500">লক্ষ্য: ৳ {requiredTurnover.toLocaleString()}</span>
        </div>
        {turnover < requiredTurnover && (
          <div className="flex items-center gap-3 bg-red-500/5 p-3 rounded-2xl border border-red-500/10">
            <AlertTriangle size={14} className="text-red-400 shrink-0" />
            <p className="text-[10px] text-red-200/80 font-bold leading-relaxed">উত্তোলনের জন্য আরও ৳ {(requiredTurnover - turnover).toFixed(2)} টানউভার প্রয়োজন।</p>
          </div>
        )}
      </div>

      <div className="bg-gradient-to-r from-teal-900 to-teal-800 p-6 rounded-[32px] border border-teal-700/50 shadow-2xl relative overflow-hidden group">
        <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/5 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-700"></div>
        <div className="flex items-center gap-4 mb-1">
          <div className="w-8 h-8 rounded-lg bg-yellow-500/20 flex items-center justify-center text-yellow-500">
            <Wallet size={16} />
          </div>
          <p className="text-teal-400 text-[10px] font-black uppercase tracking-[0.2em]">বর্তমান ব্যালেন্স</p>
        </div>
        <p className="text-4xl font-black text-white italic tracking-tighter">৳ {balance.toLocaleString()}</p>
      </div>

      {step === 1 ? (
        <div className="space-y-4">
          <h4 className="text-white font-black text-sm uppercase tracking-widest mb-4 flex items-center gap-3">
            <CreditCard size={20} className="text-yellow-500" />
            পদ্ধতি নির্বাচন করুন
          </h4>
          <div className="grid grid-cols-1 gap-4">
            {methods.map((method) => (
              <button 
                key={method.id} 
                onClick={() => { setSelectedMethod(method.id); setStep(2); }}
                className="bg-teal-900/30 p-5 rounded-[28px] border border-teal-800/50 flex items-center justify-between hover:bg-teal-800/40 hover:border-teal-600/50 transition-all group shadow-lg"
              >
                <div className="flex items-center gap-5">
                  <div className={`w-14 h-14 rounded-2xl ${method.color} flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform duration-500`}>
                    <Smartphone size={28} className="text-white" />
                  </div>
                  <span className="text-white font-black text-xl italic tracking-tight">{method.name}</span>
                </div>
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-teal-500 group-hover:bg-yellow-500 group-hover:text-black transition-all">
                  <ChevronRight size={24} />
                </div>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-6 animate-in slide-in-from-right-8 duration-500">
          <div className="bg-teal-900/40 p-5 rounded-[28px] border border-teal-700/50 flex items-center gap-5 shadow-xl">
             <div className={`w-12 h-12 rounded-2xl ${methods.find(m => m.id === selectedMethod)?.color} flex items-center justify-center shadow-lg`}>
                <Smartphone size={24} className="text-white" />
             </div>
             <div>
                <p className="text-[10px] text-teal-500 font-black uppercase tracking-[0.2em]">Selected Method</p>
                <p className="text-white font-black text-lg italic">{methods.find(m => m.id === selectedMethod)?.name}</p>
             </div>
             <button onClick={() => setStep(1)} className="ml-auto px-4 py-2 bg-yellow-500/10 text-yellow-500 text-[10px] font-black uppercase tracking-widest rounded-xl border border-yellow-500/20 hover:bg-yellow-500 hover:text-black transition-all">Change</button>
          </div>

          <div className="space-y-6">
            <div className="space-y-3">
              <label className="text-teal-500 text-[10px] font-black uppercase tracking-[0.2em] ml-2">উত্তোলনের পরিমাণ (৳)</label>
              <div className="relative">
                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-yellow-500 font-black text-xl">৳</span>
                <input 
                  type="number" 
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder={`সর্বনিম্ন ${minWithdraw}`}
                  className="w-full bg-teal-950/50 border border-teal-800/50 rounded-[24px] pl-12 pr-6 py-5 text-white font-black text-xl focus:outline-none focus:border-yellow-500/50 transition-all placeholder:text-teal-800"
                />
              </div>
              
              {/* Quick Amount Buttons */}
              <div className="grid grid-cols-5 gap-2">
                {[100, 200, 500, 1000, 25000].map((amt) => (
                  <button
                    key={amt}
                    onClick={() => setAmount(amt.toString())}
                    className={`py-3 rounded-xl text-[11px] font-black border transition-all active:scale-95 ${
                      amount === amt.toString() ? 'bg-yellow-500 border-yellow-500 text-black shadow-lg shadow-yellow-500/20' : 'bg-teal-900/30 border-teal-800/50 text-teal-500 hover:border-teal-500'
                    }`}
                  >
                    {amt >= 1000 ? `${amt/1000}k` : amt}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-teal-500 text-[10px] font-black uppercase tracking-[0.2em] ml-2">অ্যাকাউন্ট নাম্বার</label>
              <div className="relative">
                <Smartphone size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-teal-700" />
                <input 
                  type="text" 
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="01XXXXXXXXX"
                  className="w-full bg-teal-950/50 border border-teal-800/50 rounded-[24px] pl-14 pr-6 py-5 text-white font-black text-xl focus:outline-none focus:border-yellow-500/50 transition-all placeholder:text-teal-800"
                />
              </div>
            </div>

            <button 
              onClick={handleWithdraw}
              disabled={isSubmitting || turnover < requiredTurnover}
              className={`w-full py-5 rounded-[28px] font-black text-xl italic tracking-tight shadow-2xl transition-all active:scale-95 flex justify-center items-center gap-4 ${
                turnover < requiredTurnover ? 'bg-gray-800/50 text-gray-600 cursor-not-allowed border border-gray-700/30' : 'bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 text-black shadow-yellow-500/30 hover:shadow-yellow-500/50'
              }`}
            >
              {isSubmitting ? <Loader2 size={28} className="animate-spin" /> : (
                <>
                  <ArrowUpRight size={24} />
                  উত্তোলন করুন
                </>
              )}
            </button>
            
            {turnover < requiredTurnover && (
               <div className="flex items-center justify-center gap-2 text-red-400 animate-pulse">
                 <AlertCircle size={14} />
                 <p className="text-[10px] font-black uppercase tracking-widest">টানউভার লক্ষ্য পূরণ করুন</p>
               </div>
            )}
          </div>
        </div>
      )}

      {/* Withdrawal History Section */}
      <div className="mt-10 space-y-5">
        <div className="flex items-center justify-between px-2">
          <h4 className="text-white font-black text-sm uppercase tracking-widest flex items-center gap-3">
            <HistoryIcon size={20} className="text-teal-400" />
            উত্তোলনের ইতিহাস
          </h4>
          {withdrawals.length > 0 && (
            <span className="text-[10px] text-teal-500 font-bold bg-teal-900/40 px-3 py-1 rounded-full border border-teal-800/50">
              {withdrawals.length} রিকোয়েস্ট
            </span>
          )}
        </div>
        
        {isLoadingHistory ? (
          <div className="flex justify-center py-12 bg-teal-900/20 rounded-[32px] border border-teal-800/30">
            <Loader2 size={32} className="animate-spin text-teal-500" />
          </div>
        ) : withdrawals.length > 0 ? (
          <div className="space-y-4">
            {withdrawals.map((trx) => (
              <div key={trx.id} className="bg-gradient-to-r from-teal-900/40 to-teal-950/40 p-5 rounded-[28px] border border-teal-800/30 flex items-center justify-between group hover:border-teal-600/50 transition-all shadow-lg">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-orange-500/10 text-orange-400 flex items-center justify-center border border-orange-500/20 group-hover:scale-110 transition-transform">
                    <ArrowUpRight size={22} />
                  </div>
                  <div>
                    <p className="text-base font-black text-white italic tracking-tight uppercase">{trx.method}</p>
                    <p className="text-[10px] text-teal-500 font-bold mt-0.5">{trx.date}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-black text-white tracking-tighter">৳{Math.abs(trx.amount).toLocaleString()}</p>
                  <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest mt-1.5 ${
                    trx.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20' :
                    trx.status === 'approved' ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20' :
                    'bg-red-500/10 text-red-400 border border-red-500/20'
                  }`}>
                    <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                      trx.status === 'pending' ? 'bg-yellow-500' :
                      trx.status === 'approved' ? 'bg-teal-500' :
                      'bg-red-500'
                    }`} />
                    {trx.status}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-teal-900/20 p-12 rounded-[40px] border border-teal-800/30 text-center shadow-inner">
            <div className="w-20 h-20 bg-teal-950 rounded-full flex items-center justify-center mx-auto mb-4 border border-teal-800/50">
              <HistoryIcon size={40} className="text-teal-800" />
            </div>
            <p className="text-teal-500 font-black text-sm uppercase tracking-widest">কোনো উত্তোলনের ইতিহাস নেই</p>
            <p className="text-teal-700 text-[10px] mt-2">আপনার সকল উত্তোলন রিকোয়েস্ট এখানে দেখা যাবে।</p>
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
  setIsTurnoverInfoModalOpen: (show: boolean) => void;
  casinoName?: string;
  onEditCasinoName?: (newName: string) => void;
  onOpenBankCards?: () => void;
  onLogout: () => void;
  onOpenVIPDetails: () => void;
  showToast: (msg: string, type?: ToastType) => void;
  setIsVerifyingAdmin: (show: boolean) => void;
}

function ProfileTab({ 
  userData, 
  onEditProfile, 
  onEditProfilePic, 
  profilePic, 
  onLogout, 
  showToast, 
  onOpenBankCards,
  isGoogleLinked,
  isFacebookLinked,
  handleLinkGoogle,
  handleLinkFacebook,
  isLinkingGoogle,
  isLinkingFacebook,
  onBack
}: { 
  userData: any, 
  onEditProfile: () => void, 
  onEditProfilePic: () => void, 
  profilePic: string | null, 
  onLogout: () => void, 
  showToast: (msg: string, type?: ToastType) => void, 
  onOpenBankCards?: () => void,
  isGoogleLinked: boolean,
  isFacebookLinked: boolean,
  handleLinkGoogle: () => Promise<void>,
  handleLinkFacebook: () => Promise<void>,
  isLinkingGoogle: boolean,
  isLinkingFacebook: boolean,
  onBack: () => void
}) {
  const [isSortedAZ, setIsSortedAZ] = useState(false);

  const userDetails = useMemo(() => {
    if (!userData) return [];
    
    const details = [
      { label: 'ইউজার নেম (Username)', value: userData.username, icon: User },
      { label: 'ফোন নম্বর (Phone)', value: userData.phoneNumber || userData.phone || 'Not provided', icon: Smartphone },
      { label: 'ইমেইল (Email)', value: userData.email || 'Not provided', icon: Mail },
      { label: 'নিবন্ধন তারিখ (Registration)', value: userData.registrationDate || 'Not provided', icon: Calendar },
      { label: 'ভিআইপি লেভেল (VIP Level)', value: `Level ${userData.vipLevel || 0}`, icon: Crown },
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
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 p-4 pb-20">
      {/* Profile Header Card */}
      <div className="bg-gradient-to-br from-teal-900 to-teal-950 rounded-[40px] p-8 border border-teal-700/50 shadow-2xl text-center relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/5 rounded-full blur-[100px] -mr-32 -mt-32"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-teal-500/5 rounded-full blur-[100px] -ml-32 -mb-32"></div>
        
        <div className="relative z-10 flex justify-end mb-2">
          <button 
            onClick={onBack}
            className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center text-white hover:bg-red-500 transition-all border border-white/10"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="relative z-10 flex flex-col items-center">
          <div className="relative">
            <div className="w-32 h-32 rounded-[36px] bg-gradient-to-tr from-yellow-400 via-yellow-500 to-yellow-600 p-1 shadow-[0_20px_50px_rgba(234,179,8,0.3)] rotate-3 group-hover:rotate-0 transition-all duration-700">
              <div className="w-full h-full bg-teal-950 rounded-[32px] flex items-center justify-center border-4 border-teal-900 overflow-hidden">
                {profilePic ? (
                  <img src={profilePic} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User size={64} className="text-yellow-500" />
                )}
              </div>
            </div>
            <button 
              onClick={onEditProfilePic}
              className="absolute -bottom-2 -right-2 bg-yellow-500 p-3 rounded-2xl shadow-xl border-4 border-teal-950 hover:scale-110 transition-transform duration-300"
            >
              <Camera size={18} className="text-black" />
            </button>
          </div>
          
          <div className="mt-8">
            <h2 className="text-3xl font-black text-white italic tracking-tight">{userData?.username || 'Player'}</h2>
            <div className="flex items-center justify-center gap-3 mt-3">
              <span className="px-4 py-1.5 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl text-[11px] font-black text-yellow-500 uppercase tracking-widest">
                VIP Level {userData?.vipLevel || 0}
              </span>
              <span className="px-4 py-1.5 bg-teal-500/10 border border-teal-500/20 rounded-2xl text-[11px] font-black text-teal-400 uppercase tracking-widest">
                ID: {userData?.numericId || userData?.id?.substring(0, 8) || '84729104'}
              </span>
            </div>
          </div>
          
          <button 
            onClick={onEditProfile}
            className="mt-8 px-10 py-4 bg-white/5 hover:bg-white/10 text-white text-xs font-black rounded-[24px] border border-white/10 transition-all flex items-center gap-3 uppercase tracking-widest group shadow-xl"
          >
            <Edit size={18} className="text-yellow-500 group-hover:scale-110 transition-transform" /> 
            প্রোফাইল এডিট করুন
          </button>
        </div>
      </div>

      {/* Social Accounts Section */}
      <div className="bg-teal-900/40 rounded-[36px] border border-teal-700/50 overflow-hidden shadow-xl">
        <div className="p-6 border-b border-teal-800/50 flex items-center justify-between bg-black/20">
          <h3 className="font-black text-white italic flex items-center gap-3 text-sm uppercase tracking-wider">
            <Link size={22} className="text-yellow-500" /> লিঙ্ক করা অ্যাকাউন্ট
          </h3>
        </div>
        <div className="p-5 grid grid-cols-1 gap-4">
          {/* Google */}
          <div className={`flex items-center justify-between p-5 rounded-3xl border transition-all duration-500 ${isGoogleLinked ? 'bg-teal-800/40 border-teal-500/30' : 'bg-black/20 border-white/5'}`}>
            <div className="flex items-center gap-5">
              <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-xl">
                <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" alt="Google" className="w-6 h-6" />
              </div>
              <div>
                <p className="text-base font-black text-white">Google</p>
                <p className={`text-[10px] font-bold ${isGoogleLinked ? 'text-teal-400' : 'text-slate-500'} uppercase tracking-widest mt-0.5`}>
                  {isGoogleLinked ? 'সংযুক্ত (Connected)' : 'সংযুক্ত নয় (Disconnected)'}
                </p>
              </div>
            </div>
            <button 
              onClick={handleLinkGoogle}
              disabled={isLinkingGoogle}
              className={`px-6 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-lg ${
                isGoogleLinked 
                  ? 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500 hover:text-white' 
                  : 'bg-yellow-500 text-black hover:bg-yellow-400 shadow-yellow-500/20'
              }`}
            >
              {isLinkingGoogle ? <RefreshCw size={16} className="animate-spin" /> : (isGoogleLinked ? 'বিচ্ছিন্ন করুন' : 'লিঙ্ক করুন')}
            </button>
          </div>

          {/* Facebook */}
          <div className={`flex items-center justify-between p-5 rounded-3xl border transition-all duration-500 ${isFacebookLinked ? 'bg-teal-800/40 border-teal-500/30' : 'bg-black/20 border-white/5'}`}>
            <div className="flex items-center gap-5">
              <div className="w-12 h-12 rounded-2xl bg-[#1877F2] flex items-center justify-center shadow-xl">
                <Facebook size={24} className="text-white" />
              </div>
              <div>
                <p className="text-base font-black text-white">Facebook</p>
                <p className={`text-[10px] font-bold ${isFacebookLinked ? 'text-teal-400' : 'text-slate-500'} uppercase tracking-widest mt-0.5`}>
                  {isFacebookLinked ? 'সংযুক্ত (Connected)' : 'সংযুক্ত নয় (Disconnected)'}
                </p>
              </div>
            </div>
            <button 
              onClick={handleLinkFacebook}
              disabled={isLinkingFacebook}
              className={`px-6 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-lg ${
                isFacebookLinked 
                  ? 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500 hover:text-white' 
                  : 'bg-yellow-500 text-black hover:bg-yellow-400 shadow-yellow-500/20'
              }`}
            >
              {isLinkingFacebook ? <RefreshCw size={16} className="animate-spin" /> : (isFacebookLinked ? 'বিচ্ছিন্ন করুন' : 'লিঙ্ক করুন')}
            </button>
          </div>
        </div>
      </div>

      {/* Details List */}
      <div className="bg-teal-900/40 rounded-[36px] border border-teal-700/50 overflow-hidden shadow-xl">
        <div className="p-6 border-b border-teal-800/50 flex items-center justify-between bg-black/20">
          <h3 className="font-black text-white italic flex items-center gap-3 text-sm uppercase tracking-wider">
            <Info size={22} className="text-yellow-500" /> ব্যক্তিগত তথ্য
          </h3>
          <button 
            onClick={() => setIsSortedAZ(!isSortedAZ)}
            className={`p-3 rounded-2xl transition-all duration-300 ${isSortedAZ ? 'bg-yellow-500 text-black shadow-lg' : 'bg-white/5 text-teal-400 border border-white/10 hover:bg-white/10'}`}
          >
            <ArrowDownUp size={18} />
          </button>
        </div>
        
        <div className="divide-y divide-teal-800/30">
          {userDetails.map((detail, index) => (
            <div key={index} className="p-6 flex items-center justify-between hover:bg-white/5 transition-all group">
              <div className="flex items-center gap-5">
                <div className="w-12 h-12 rounded-2xl bg-teal-950 border border-teal-800 flex items-center justify-center text-teal-400 group-hover:scale-110 group-hover:text-yellow-500 transition-all duration-500">
                  <detail.icon size={22} />
                </div>
                <div>
                  <p className="text-[10px] text-teal-500 uppercase tracking-[0.2em] font-black">{detail.label}</p>
                  <p className="text-base text-white font-bold mt-1 tracking-tight">{detail.value}</p>
                </div>
              </div>
              {(detail.label.includes('Username') || detail.label.includes('Phone') || detail.label.includes('Email')) ? (
                <button onClick={onEditProfile} className="p-3 bg-white/5 hover:bg-yellow-500 hover:text-black text-teal-400 rounded-2xl transition-all duration-300 shadow-lg">
                  <Edit size={16} />
                </button>
              ) : null}
            </div>
          ))}
        </div>
      </div>

      {/* Security Quick Access */}
      <div className="grid grid-cols-2 gap-3">
        <button 
          onClick={onOpenBankCards}
          className="bg-teal-900/40 p-5 rounded-[24px] border border-teal-700/50 flex flex-col items-center gap-3 hover:bg-teal-800/60 transition-all group shadow-lg"
        >
          <div className="w-12 h-12 rounded-2xl bg-yellow-500/10 flex items-center justify-center text-yellow-500 group-hover:scale-110 transition-transform">
            <CreditCard size={24} />
          </div>
          <p className="text-[10px] font-black text-white uppercase tracking-widest">ব্যাংক কার্ড</p>
        </button>
        <button 
          onClick={onLogout}
          className="bg-red-500/5 p-5 rounded-[24px] border border-red-500/20 flex flex-col items-center gap-3 hover:bg-red-500/10 transition-all group shadow-lg"
        >
          <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500 group-hover:scale-110 transition-transform">
            <LogOut size={24} />
          </div>
          <p className="text-[10px] font-black text-white uppercase tracking-widest">লগ আউট</p>
        </button>
      </div>
    </div>
  );
}

function DepositHistoryTab({ onBack }: { onBack: () => void }) {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 p-4 pb-20">
      <div className="bg-gradient-to-br from-teal-900 to-teal-950 rounded-[40px] p-8 border border-teal-700/50 shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/5 rounded-full blur-[100px] -mr-32 -mt-32"></div>
        <div className="relative z-10 flex justify-between items-start">
          <div>
            <div className="w-16 h-16 rounded-2xl bg-yellow-500/20 flex items-center justify-center text-yellow-500 mb-4 shadow-xl border border-yellow-500/20">
              <ArrowDownLeft size={32} />
            </div>
            <h2 className="text-3xl font-black text-white italic tracking-tight">জমা রেকর্ড</h2>
            <p className="text-teal-400 text-xs font-bold uppercase tracking-widest mt-2">Deposit Records</p>
          </div>
          <button 
            onClick={onBack}
            className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center text-white hover:bg-red-500 transition-all border border-white/10"
          >
            <X size={20} />
          </button>
        </div>
      </div>
      <div className="bg-teal-900/20 p-8 rounded-[32px] border border-teal-800/30 text-center shadow-inner">
        <ArrowDownLeft size={48} className="text-teal-700 mx-auto mb-4" />
        <p className="text-teal-400 text-sm font-bold">কোনো জমার রেকর্ড নেই</p>
      </div>
    </div>
  );
}

function AccountRecordTab({ onBack }: { onBack: () => void }) {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 p-4 pb-20">
      <div className="bg-gradient-to-br from-teal-900 to-teal-950 rounded-[40px] p-8 border border-teal-700/50 shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/5 rounded-full blur-[100px] -mr-32 -mt-32"></div>
        <div className="relative z-10 flex justify-between items-start">
          <div>
            <div className="w-16 h-16 rounded-2xl bg-yellow-500/20 flex items-center justify-center text-yellow-500 mb-4 shadow-xl border border-yellow-500/20">
              <ClipboardList size={32} />
            </div>
            <h2 className="text-3xl font-black text-white italic tracking-tight">অ্যাকাউন্ট রেকর্ড</h2>
            <p className="text-teal-400 text-xs font-bold uppercase tracking-widest mt-2">Account Transaction History</p>
          </div>
          <button 
            onClick={onBack}
            className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center text-white hover:bg-red-500 transition-all border border-white/10"
          >
            <X size={20} />
          </button>
        </div>
      </div>
      <div className="bg-teal-900/20 p-8 rounded-[32px] border border-teal-800/30 text-center shadow-inner">
        <ClipboardList size={48} className="text-teal-700 mx-auto mb-4" />
        <p className="text-teal-400 text-sm font-bold">কোনো অ্যাকাউন্টের রেকর্ড নেই</p>
      </div>
    </div>
  );
}

function ProfitLossTab({ totals, onBack }: { totals: any, onBack: () => void }) {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 p-4 pb-20">
      <div className="bg-gradient-to-br from-teal-900 to-teal-950 rounded-[40px] p-8 border border-teal-700/50 shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/5 rounded-full blur-[100px] -mr-32 -mt-32"></div>
        <div className="relative z-10 flex justify-between items-start">
          <div>
            <div className="w-16 h-16 rounded-2xl bg-yellow-500/20 flex items-center justify-center text-yellow-500 mb-4 shadow-xl border border-yellow-500/20">
              <BarChart3 size={32} />
            </div>
            <h2 className="text-3xl font-black text-white italic tracking-tight">লাভ ও ক্ষতি</h2>
            <p className="text-teal-400 text-xs font-bold uppercase tracking-widest mt-2">Profit & Loss Report</p>
          </div>
          <button 
            onClick={onBack}
            className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center text-white hover:bg-red-500 transition-all border border-white/10"
          >
            <X size={20} />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-green-500/10 p-4 rounded-2xl border border-green-500/20">
          <p className="text-green-400 text-xs font-bold uppercase">মোট লাভ</p>
          <p className="text-2xl font-black text-white">৳ {totals.deposit.toLocaleString()}</p>
        </div>
        <div className="bg-red-500/10 p-4 rounded-2xl border border-red-500/20">
          <p className="text-red-400 text-xs font-bold uppercase">মোট লস</p>
          <p className="text-2xl font-black text-white">৳ {totals.withdraw.toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
}

function MailTab({ onBack }: { onBack: () => void }) {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 p-4 pb-20">
      <div className="bg-gradient-to-br from-teal-900 to-teal-950 rounded-[40px] p-8 border border-teal-700/50 shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/5 rounded-full blur-[100px] -mr-32 -mt-32"></div>
        <div className="relative z-10 flex justify-between items-start">
          <div>
            <div className="w-16 h-16 rounded-2xl bg-yellow-500/20 flex items-center justify-center text-yellow-500 mb-4 shadow-xl border border-yellow-500/20">
              <Mail size={32} />
            </div>
            <h2 className="text-3xl font-black text-white italic tracking-tight">ইনবক্স</h2>
            <p className="text-teal-400 text-xs font-bold uppercase tracking-widest mt-2">Mail & Notifications</p>
          </div>
          <button 
            onClick={onBack}
            className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center text-white hover:bg-red-500 transition-all border border-white/10"
          >
            <X size={20} />
          </button>
        </div>
      </div>
      <div className="text-center py-12 bg-teal-900/20 rounded-[32px] border border-teal-800/30">
        <Mail size={48} className="text-teal-600 mx-auto mb-4" />
        <h3 className="text-white font-bold">কোনো মেইল নেই</h3>
        <p className="text-teal-400 text-sm">আপনার ইনবক্স এখন খালি।</p>
      </div>
    </div>
  );
}

function FeedbackTab({ showToast, onBack }: { showToast: (msg: string) => void, onBack: () => void }) {
  const [feedback, setFeedback] = useState('');
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 p-4 pb-20">
      <div className="bg-gradient-to-br from-teal-900 to-teal-950 rounded-[40px] p-8 border border-teal-700/50 shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/5 rounded-full blur-[100px] -mr-32 -mt-32"></div>
        <div className="relative z-10 flex justify-between items-start">
          <div>
            <div className="w-16 h-16 rounded-2xl bg-yellow-500/20 flex items-center justify-center text-yellow-500 mb-4 shadow-xl border border-yellow-500/20">
              <MessageSquare size={32} />
            </div>
            <h2 className="text-3xl font-black text-white italic tracking-tight">মতামত</h2>
            <p className="text-teal-400 text-xs font-bold uppercase tracking-widest mt-2">Feedback & Suggestions</p>
          </div>
          <button 
            onClick={onBack}
            className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center text-white hover:bg-red-500 transition-all border border-white/10"
          >
            <X size={20} />
          </button>
        </div>
      </div>
      <textarea 
        value={feedback}
        onChange={(e) => setFeedback(e.target.value)}
        placeholder="আপনার পরামর্শ এখানে লিখুন..."
        className="w-full bg-black/40 border border-teal-800/50 rounded-2xl p-4 text-white min-h-[150px] focus:outline-none focus:border-teal-500"
      />
      <button 
        onClick={() => {
          showToast('আপনার পরামর্শ সফলভাবে পাঠানো হয়েছে');
          setFeedback('');
          onBack();
        }}
        className="w-full mt-4 bg-teal-500 text-black font-black py-3 rounded-2xl"
      >
        জমা দিন
      </button>
    </div>
  );
}

function HelpCenterTab({ onBack }: { onBack: () => void }) {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 p-4 pb-20">
      <div className="bg-gradient-to-br from-teal-900 to-teal-950 rounded-[40px] p-8 border border-teal-700/50 shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/5 rounded-full blur-[100px] -mr-32 -mt-32"></div>
        <div className="relative z-10 flex justify-between items-start">
          <div>
            <div className="w-16 h-16 rounded-2xl bg-yellow-500/20 flex items-center justify-center text-yellow-500 mb-4 shadow-xl border border-yellow-500/20">
              <HelpCircle size={32} />
            </div>
            <h2 className="text-3xl font-black text-white italic tracking-tight">সহায়তা কেন্দ্র</h2>
            <p className="text-teal-400 text-xs font-bold uppercase tracking-widest mt-2">Help & Support Center</p>
          </div>
          <button 
            onClick={onBack}
            className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center text-white hover:bg-red-500 transition-all border border-white/10"
          >
            <X size={20} />
          </button>
        </div>
      </div>
      <div className="bg-teal-900/20 p-6 rounded-2xl border border-teal-800/30 text-center space-y-4">
        <p className="text-teal-400 text-sm">যেকোনো প্রয়োজনে আমাদের সাথে যোগাযোগ করুন</p>
        <button className="w-full bg-teal-600 text-white font-bold py-3 rounded-xl shadow-lg shadow-teal-900/50">
          লাইভ চ্যাট
        </button>
      </div>
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
  setIsChatOpen,
  setIsTurnoverInfoModalOpen,
  casinoName,
  onEditCasinoName,
  onOpenBankCards,
  onLogout,
  onOpenVIPDetails,
  showToast,
  setIsVerifyingAdmin
}: OverviewTabProps) {
  const turnover = userData?.turnover || 0;
  const currentVIP = VIP_LEVELS[userData?.vipLevel || 0] || VIP_LEVELS[0];
  const nextVIP = VIP_LEVELS[(userData?.vipLevel || 0) + 1];
  const vipProgress = userData?.vipProgress || 0;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showToast(`${label} কপি করা হয়েছে!`, "success");
  };

  const menuItems = [
    { 
      label: 'আমার রেকর্ড', 
      subtext: 'বিস্তারিত, বাজি, রিপোর্ট', 
      icon: ClipboardList, 
      color: 'text-yellow-500', 
      action: () => onSubTabChange('betting-record') 
    },
    { 
      label: 'প্রত্যাহার ব্যবস্থাপনা', 
      icon: Settings, 
      color: 'text-red-500', 
      action: () => onSubTabChange('withdrawHistory') 
    },
    { 
      label: 'প্রচার (Promotion)', 
      subtext: 'কমিশন পেতে শেয়ার করুন', 
      icon: Users, 
      color: 'text-blue-400', 
      action: () => onTabChange('invite') 
    },
    { 
      label: 'নিরাপত্তা কেন্দ্র', 
      badge: '+4.98', 
      icon: Shield, 
      color: 'text-emerald-400', 
      action: () => onSubTabChange('security') 
    },
    { 
      label: 'যোগাযোগ (Support)', 
      icon: Headset, 
      color: 'text-teal-400', 
      action: () => onSubTabChange('support') 
    },
    { 
      label: 'FAQ', 
      icon: HelpCircle, 
      color: 'text-teal-400', 
      action: () => onSubTabChange('faq') 
    },
  ];

  return (
    <div className="animate-in fade-in duration-500 pb-20 bg-teal-950 min-h-screen text-white relative overflow-hidden">
      {/* Background Accents */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/5 rounded-full blur-[100px] -mr-32 -mt-32"></div>
      <div className="absolute top-1/2 left-0 w-64 h-64 bg-teal-500/5 rounded-full blur-[100px] -ml-32"></div>

      {/* Header */}
      <div className="px-6 py-6 flex items-center justify-between sticky top-0 bg-teal-950/80 backdrop-blur-xl z-50 border-b border-white/5">
        <button onClick={() => onTabChange('home')} className="p-2 bg-white/5 rounded-2xl border border-white/10 hover:bg-red-500 transition-all group">
          <X size={20} className="text-white group-hover:scale-110 transition-transform" />
        </button>
        <h1 className="text-lg font-black italic uppercase tracking-tighter text-yellow-500">অ্যাকাউন্ট ওভারভিউ</h1>
        <div className="flex items-center gap-3">
          <button onClick={() => onSubTabChange('mail')} className="p-2 bg-white/5 rounded-2xl border border-white/10 relative hover:bg-white/10 transition-all">
            <MessageCircle size={20} className="text-white" />
            <div className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-teal-950"></div>
          </button>
        </div>
      </div>

      <div className="px-4 py-6 space-y-6 relative z-10">
        {/* Profile Card */}
        <div className="bg-gradient-to-br from-teal-900 to-teal-950 p-6 rounded-[32px] border border-teal-700/50 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-yellow-500/20 transition-all duration-700"></div>
          
          <div className="flex items-center gap-5">
            <div className="relative">
              <div className="w-20 h-20 rounded-[24px] bg-gradient-to-tr from-yellow-400 to-yellow-600 p-0.5 shadow-xl rotate-3 group-hover:rotate-0 transition-all duration-500">
                <div className="w-full h-full bg-teal-950 rounded-[22px] overflow-hidden flex items-center justify-center">
                  {userData?.profilePictureUrl ? (
                    <img src={userData.profilePictureUrl} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <User size={32} className="text-yellow-500" />
                  )}
                </div>
              </div>
              <button 
                onClick={onEditProfile}
                className="absolute -bottom-1 -right-1 bg-yellow-500 text-black p-2 rounded-xl shadow-lg border-4 border-teal-900 group-hover:scale-110 transition-all"
              >
                <Edit size={12} />
              </button>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-white italic truncate tracking-tight">{userData?.username || 'Player'}</h2>
                <button onClick={() => copyToClipboard(userData?.username || '', 'ইউজারনেম')} className="p-1 hover:bg-white/10 rounded-lg transition-colors">
                  <Copy size={12} className="text-teal-400" />
                </button>
              </div>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-[10px] font-black text-teal-400 uppercase tracking-widest bg-teal-950/50 px-2 py-1 rounded-lg border border-teal-800">
                  ID: {userData?.numericId || '332922939'}
                </span>
                <button onClick={() => copyToClipboard(userData?.numericId || '332922939', 'আইডি')} className="p-1 hover:bg-white/10 rounded-lg transition-colors">
                  <Copy size={12} className="text-teal-400" />
                </button>
              </div>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-4">
            <div className="bg-black/20 p-4 rounded-2xl border border-white/5">
              <p className="text-[10px] font-black text-teal-500 uppercase tracking-widest mb-1">মোট ব্যালেন্স</p>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black text-white italic">৳ {balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                <button onClick={onRefresh} className="text-teal-400 hover:text-yellow-500 transition-colors">
                  <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
                </button>
              </div>
            </div>
            <div className="bg-black/20 p-4 rounded-2xl border border-white/5">
              <p className="text-[10px] font-black text-teal-500 uppercase tracking-widest mb-1">VIP লেভেল</p>
              <div className="flex items-center gap-2">
                <Crown size={18} className="text-yellow-500 fill-yellow-500/20" />
                <span className="text-xl font-black text-yellow-500 italic">Level {userData?.vipLevel || 0}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-4">
          <button 
            onClick={() => onTabChange('deposit')}
            className="bg-gradient-to-br from-yellow-400 to-yellow-600 p-5 rounded-[28px] flex flex-col items-center gap-3 shadow-[0_10px_30px_rgba(234,179,8,0.3)] active:scale-95 transition-all group"
          >
            <div className="w-12 h-12 rounded-2xl bg-black/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <ArrowDownLeft size={28} className="text-black" />
            </div>
            <span className="text-black font-black uppercase tracking-widest text-[11px]">ডিপোজিট করুন</span>
          </button>
          <button 
            onClick={() => onSubTabChange('withdraw')}
            className="bg-teal-900/40 p-5 rounded-[28px] border border-teal-700/50 flex flex-col items-center gap-3 hover:bg-teal-800/60 transition-all group active:scale-95 shadow-xl"
          >
            <div className="w-12 h-12 rounded-2xl bg-teal-500/10 flex items-center justify-center text-teal-400 group-hover:scale-110 transition-transform">
              <ArrowUpRight size={28} />
            </div>
            <span className="text-white font-black uppercase tracking-widest text-[11px]">উত্তোলন করুন</span>
          </button>
        </div>

        {/* VIP Progress Card */}
        <div className="bg-teal-900/40 rounded-[32px] p-6 border border-teal-700/50 shadow-xl overflow-hidden relative">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-black text-white italic uppercase tracking-wider flex items-center gap-2">
              <Sparkles size={18} className="text-yellow-500" /> VIP প্রগ্রেস
            </h3>
            <button 
              onClick={onOpenVIPDetails}
              className="text-[10px] font-black text-yellow-500 uppercase tracking-widest bg-yellow-500/10 px-3 py-1.5 rounded-xl border border-yellow-500/20 hover:bg-yellow-500 hover:text-black transition-all"
            >
              বিস্তারিত দেখুন
            </button>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
              <span className="text-teal-400">VIP {userData?.vipLevel || 0}</span>
              <span className="text-yellow-500">VIP {(userData?.vipLevel || 0) + 1}</span>
            </div>
            <div className="h-3 bg-black/40 rounded-full overflow-hidden border border-white/5 p-0.5">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${vipProgress}%` }}
                className="h-full bg-gradient-to-r from-yellow-600 via-yellow-400 to-yellow-600 rounded-full shadow-[0_0_15px_rgba(234,179,8,0.5)]"
              />
            </div>
            <p className="text-center text-[10px] font-bold text-teal-500 uppercase tracking-[0.2em]">
              পরবর্তী লেভেলে যেতে আরও {100 - vipProgress}% প্রগ্রেস প্রয়োজন
            </p>
          </div>
        </div>

        {/* Menu List */}
        <div className="bg-teal-900/40 rounded-[32px] border border-teal-700/50 overflow-hidden shadow-xl">
          <div className="divide-y divide-teal-800/30">
            {menuItems.map((item, index) => (
              <button 
                key={index}
                onClick={item.action}
                className="w-full p-5 flex items-center justify-between hover:bg-white/5 transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-teal-950 border border-teal-800 flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                    <item.icon size={22} className={item.color} />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-black text-white tracking-tight">{item.label}</p>
                    {item.subtext && <p className="text-[10px] text-teal-500 font-bold mt-0.5">{item.subtext}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {item.badge && (
                    <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 text-[9px] font-black rounded-lg border border-emerald-500/20">
                      {item.badge}
                    </span>
                  )}
                  <ChevronRight size={18} className="text-teal-700 group-hover:text-teal-400 group-hover:translate-x-1 transition-all" />
                </div>
              </button>
            ))}
          </div>
        </div>

      {/* Admin Button (if applicable) */}
      {(userData?.role === 'admin' || userData?.email === 'owner.css13@gmail.com') && (
        <div className="px-4 mt-6">
          <button 
            onClick={() => {
              const savedCode = localStorage.getItem('admin_panel_code');
              if (savedCode === 'owner.css13' || savedCode === 'admin123' || savedCode === (import.meta as any).env?.VITE_ADMIN_CODE) {
                onSubTabChange('admin');
              } else {
                setIsVerifyingAdmin(true);
              }
            }}
            className="w-full bg-red-600/20 border border-red-500/30 text-red-500 font-black py-4 rounded-2xl flex items-center justify-center gap-3 hover:bg-red-600/30 transition-all"
          >
            <Shield size={24} />
            অ্যাডমিন প্যানেল (Admin Panel)
          </button>
        </div>
      )}

        {/* Logout Button */}
        <button 
          onClick={onLogout}
          className="w-full py-5 bg-red-500/5 hover:bg-red-500/10 text-red-400 font-black rounded-[28px] border border-red-500/20 transition-all uppercase tracking-[0.3em] text-xs flex items-center justify-center gap-3 group"
        >
          <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
          লগ আউট করুন
        </button>
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
        <h3 className="font-bold text-[var(--text-main)]">আমার লিংক (My Links)</h3>
      </div>

      <div className="flex flex-col gap-3 mb-4">
        {/* Search */}
        <div className="relative">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <Search size={16} className="text-[var(--brand-primary)]" />
          </div>
          <input 
            type="text" 
            placeholder="লিংক খুঁজুন..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-main)] text-sm rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-yellow-500 transition-colors"
          />
        </div>

        {/* Filters & Sort */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <div className="relative flex-1 min-w-[130px]">
            <div className="absolute inset-y-0 left-2 flex items-center pointer-events-none">
              <Filter size={14} className="text-[var(--brand-primary)]" />
            </div>
            <select 
              value={filterType} 
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-main)] text-xs rounded-lg pl-8 pr-2 py-2.5 appearance-none focus:outline-none focus:border-yellow-500"
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
              <ArrowDownUp size={14} className="text-[var(--brand-primary)]" />
            </div>
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-main)] text-xs rounded-lg pl-8 pr-2 py-2.5 appearance-none focus:outline-none focus:border-yellow-500"
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
            <div key={link.id} className="bg-[var(--bg-card)] rounded-xl p-4 border border-[var(--border-color)] hover:bg-black/5 transition-colors">
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
                    <h4 className="text-[var(--text-main)] font-bold text-sm">{link.title}</h4>
                    <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">{link.type}</span>
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
                    className="flex items-center gap-1 px-3 py-1.5 bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-black/10 rounded-md transition-colors border border-[var(--border-color)]"
                    title="Copy Link"
                  >
                    <Copy size={14} />
                    <span className="text-[10px] font-bold">কপি</span>
                  </button>
                </div>
              </div>
              
              <div className="bg-black/5 p-2 rounded-lg mb-3 overflow-hidden">
                <p className="text-xs text-[var(--text-muted)] truncate font-mono">{link.url}</p>
              </div>
              
              <div className="flex justify-between items-center text-[10px] text-[var(--text-muted)]">
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
          <div className="text-center py-8 text-[var(--text-muted)]">
            <p>কোনো লিংক পাওয়া যায়নি</p>
          </div>
        )}
      </div>
    </div>
  );
}

function HistoryTab({ email, onBack }: { email?: string, onBack: () => void }) {
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
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 p-4 pb-20">
      {/* History Header */}
      <div className="bg-gradient-to-br from-teal-900 to-teal-950 rounded-[40px] p-8 border border-teal-700/50 shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/5 rounded-full blur-[100px] -mr-32 -mt-32"></div>
        <div className="relative z-10 flex justify-between items-start">
          <div>
            <div className="w-16 h-16 rounded-2xl bg-yellow-500/20 flex items-center justify-center text-yellow-500 mb-4 shadow-xl border border-yellow-500/20">
              <HistoryIcon size={32} />
            </div>
            <h2 className="text-3xl font-black text-white italic tracking-tight">লেনদেন ইতিহাস</h2>
            <p className="text-teal-400 text-xs font-bold uppercase tracking-widest mt-2">Transaction History & Records</p>
          </div>
          <button 
            onClick={onBack}
            className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center text-white hover:bg-red-500 transition-all border border-white/10"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-teal-900/40 rounded-[36px] p-6 border border-teal-700/50 shadow-xl space-y-4">
        <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
          <div className="relative min-w-[140px]">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-yellow-500">
              <Filter size={16} />
            </div>
            <select 
              value={filterType} 
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full bg-black/40 border border-teal-700/50 text-white text-xs rounded-2xl pl-11 pr-4 py-3 appearance-none focus:outline-none focus:ring-2 focus:ring-yellow-500/50 transition-all font-bold"
            >
              <option value="all">সব ধরন</option>
              <option value="deposit">জমা (Deposit)</option>
              <option value="withdraw">উত্তোলন (Withdraw)</option>
              <option value="bonus">বোনাস (Bonus)</option>
              <option value="bet">বাজি (Bet)</option>
            </select>
          </div>
          
          <div className="relative min-w-[160px]">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-yellow-500">
              <ArrowDownUp size={16} />
            </div>
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full bg-black/40 border border-teal-700/50 text-white text-xs rounded-2xl pl-11 pr-4 py-3 appearance-none focus:outline-none focus:ring-2 focus:ring-yellow-500/50 transition-all font-bold"
            >
              <option value="date_desc">নতুন থেকে পুরানো</option>
              <option value="date_asc">পুরানো থেকে নতুন</option>
              <option value="amount_desc">অ্যামাউন্ট (বেশি)</option>
              <option value="amount_asc">অ্যামাউন্ট (কম)</option>
            </select>
          </div>

          <div className="relative min-w-[160px]">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-yellow-500">
              <Calendar size={16} />
            </div>
            <select 
              value={dateRange} 
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full bg-black/40 border border-teal-700/50 text-white text-xs rounded-2xl pl-11 pr-4 py-3 appearance-none focus:outline-none focus:ring-2 focus:ring-yellow-500/50 transition-all font-bold"
            >
              <option value="all">সব সময়</option>
              <option value="7days">গত ৭ দিন</option>
              <option value="30days">গত ৩০ দিন</option>
              <option value="custom">কাস্টম রেঞ্জ</option>
            </select>
          </div>
        </div>

        {dateRange === 'custom' && (
          <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="space-y-1.5">
              <label className="text-[10px] text-teal-500 uppercase tracking-widest font-black ml-2">শুরুর তারিখ</label>
              <input 
                type="date" 
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="w-full bg-black/40 border border-teal-700/50 text-white text-xs rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 font-bold"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] text-teal-500 uppercase tracking-widest font-black ml-2">শেষ তারিখ</label>
              <input 
                type="date" 
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="w-full bg-black/40 border border-teal-700/50 text-white text-xs rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 font-bold"
              />
            </div>
          </div>
        )}
      </div>
      
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i}>
              <Skeleton className="h-16 w-full" />
            </div>
          ))}
        </div>
      ) : filteredAndSortedTransactions.length > 0 ? (
        filteredAndSortedTransactions.map((trx: any) => (
          <div key={trx.id} onClick={() => setSelectedTrx(trx)} className="bg-[var(--bg-card)] rounded-xl p-3 border border-[var(--border-color)] flex items-center justify-between cursor-pointer hover:bg-black/5 transition-colors">
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
                <p className="text-sm font-bold text-[var(--text-main)]">
                  {trx.type === 'deposit' ? 'জমা' :
                   trx.type === 'withdraw' ? 'উত্তোলন' :
                   trx.type === 'bonus' ? 'বোনাস' : 'বাজি'}
                </p>
                <div className="flex flex-col gap-0.5 mt-0.5">
                  <div className="flex items-center gap-1 text-[10px] text-[var(--text-muted)]">
                    <Clock size={10} /> {trx.date}
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-[var(--text-muted)]">
                    <span className="font-mono opacity-70">{trx.trxId}</span> • <span className="font-medium">{trx.method}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className={`text-sm font-bold ${trx.type === 'deposit' || trx.type === 'bonus' ? 'text-green-400' : 'text-[var(--text-main)]'}`}>
                {trx.type === 'deposit' || trx.type === 'bonus' ? '+' : '-'}৳{Math.abs(trx.amount).toLocaleString()}
              </p>
              <p className={`text-[10px] mt-0.5 ${trx.statusColor}`}>{trx.status}</p>
            </div>
          </div>
        ))
      ) : (
        <div className="text-center py-8 text-[var(--text-muted)]">
          কোনো লেনদেন পাওয়া যায়নি
        </div>
      )}

      {/* Transaction Details Modal */}
      {selectedTrx && (
        <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4" onClick={() => setSelectedTrx(null)}>
          <div className="bg-[var(--bg-card)] rounded-2xl p-6 max-w-sm w-full border border-[var(--border-color)] shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-[var(--text-main)]">লেনদেনের বিস্তারিত</h3>
              <button onClick={() => setSelectedTrx(null)} className="text-[var(--text-muted)] hover:text-[var(--text-main)]">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-[var(--border-color)]">
                <span className="text-[var(--text-muted)] text-sm">লেনদেন আইডি:</span>
                <span className="text-[var(--text-main)] font-mono font-bold">{selectedTrx.trxId}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-[var(--border-color)]">
                <span className="text-[var(--text-muted)] text-sm">পদ্ধতি:</span>
                <span className="text-[var(--text-main)] font-bold">{selectedTrx.method}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-[var(--border-color)]">
                <span className="text-[var(--text-muted)] text-sm">ধরন:</span>
                <span className="text-[var(--text-main)] font-bold">
                  {selectedTrx.type === 'deposit' ? 'জমা' :
                   selectedTrx.type === 'withdraw' ? 'উত্তোলন' :
                   selectedTrx.type === 'bonus' ? 'বোনাস' : 'বাজি'}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-[var(--border-color)]">
                <span className="text-[var(--text-muted)] text-sm">পরিমাণ:</span>
                <span className={`font-bold ${selectedTrx.type === 'deposit' || selectedTrx.type === 'bonus' ? 'text-green-400' : 'text-[var(--text-main)]'}`}>
                  {selectedTrx.type === 'deposit' || selectedTrx.type === 'bonus' ? '+' : '-'}৳{Math.abs(selectedTrx.amount).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-[var(--border-color)]">
                <span className="text-[var(--text-muted)] text-sm">তারিখ:</span>
                <span className="text-[var(--text-main)]">{selectedTrx.date}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-[var(--text-muted)] text-sm">অবস্থা:</span>
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

function WithdrawalHistoryTab({ email, onBack }: { email?: string, onBack: () => void }) {
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
        let formattedDate = data.date;
        if (data.date instanceof Timestamp) {
          formattedDate = data.date.toDate().toLocaleString('en-GB', { 
            year: 'numeric', 
            month: '2-digit', 
            day: '2-digit', 
            hour: '2-digit', 
            minute: '2-digit' 
          }).replace(/\//g, '-');
        }
        
        return {
          id: doc.id,
          ...data,
          date: formattedDate
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
      const dateA = a.date instanceof Date ? a.date : new Date(a.date);
      const dateB = b.date instanceof Date ? b.date : new Date(b.date);
      
      if (sortBy === 'date_desc') {
        return dateB.getTime() - dateA.getTime();
      } else if (sortBy === 'date_asc') {
        return dateA.getTime() - dateB.getTime();
      } else if (sortBy === 'amount_desc') {
        const amountA = Math.abs(parseFloat(String(a.amount).replace(/[^0-9.-]+/g,"")));
        const amountB = Math.abs(parseFloat(String(b.amount).replace(/[^0-9.-]+/g,"")));
        return amountB - amountA;
      } else if (sortBy === 'amount_asc') {
        const amountA = Math.abs(parseFloat(String(a.amount).replace(/[^0-9.-]+/g,"")));
        const amountB = Math.abs(parseFloat(String(b.amount).replace(/[^0-9.-]+/g,"")));
        return amountA - amountB;
      }
      return 0;
    });
    
    return result;
  }, [transactions, sortBy]);

  return (
    <div className="p-4 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="bg-gradient-to-br from-teal-900 to-teal-950 rounded-[40px] p-8 border border-teal-700/50 shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/5 rounded-full blur-[100px] -mr-32 -mt-32"></div>
        <div className="relative z-10 flex justify-between items-start">
          <div>
            <div className="w-16 h-16 rounded-2xl bg-orange-500/20 flex items-center justify-center text-orange-500 mb-4 shadow-xl border border-orange-500/20">
              <HistoryIcon size={32} />
            </div>
            <h2 className="text-3xl font-black text-white italic tracking-tight">উত্তোলন ইতিহাস</h2>
            <p className="text-teal-400 text-xs font-bold uppercase tracking-widest mt-2">Withdrawal History</p>
          </div>
          <button 
            onClick={onBack}
            className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center text-white hover:bg-red-500 transition-all border border-white/10"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-teal-500" size={16} />
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full bg-teal-900/40 border border-teal-700/50 text-white text-xs font-bold rounded-2xl pl-12 pr-4 py-4 appearance-none focus:outline-none focus:border-yellow-500 transition-all uppercase tracking-widest"
          >
            <option value="date_desc">নতুন থেকে পুরানো (Newest)</option>
            <option value="date_asc">পুরানো থেকে নতুন (Oldest)</option>
            <option value="amount_desc">অ্যামাউন্ট: বেশি (Highest)</option>
            <option value="amount_asc">অ্যামাউন্ট: কম (Lowest)</option>
          </select>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-teal-500">
            <ArrowDownUp size={16} />
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-teal-900/20 rounded-[32px] p-5 border border-teal-800/30">
              <div className="flex justify-between items-center">
                <div className="space-y-2">
                  <div className="h-4 w-24 bg-teal-800/50 rounded animate-pulse"></div>
                  <div className="h-3 w-32 bg-teal-800/30 rounded animate-pulse"></div>
                </div>
                <div className="h-8 w-20 bg-teal-800/40 rounded-full animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredAndSortedTransactions.length === 0 ? (
        <div className="bg-teal-900/20 p-12 rounded-[40px] border border-teal-800/30 text-center shadow-inner">
          <div className="w-20 h-20 bg-teal-950 rounded-full flex items-center justify-center mx-auto mb-4 border border-teal-800/50">
            <HistoryIcon size={40} className="text-teal-800" />
          </div>
          <p className="text-teal-500 font-black text-sm uppercase tracking-widest">কোনো উত্তোলনের ইতিহাস নেই</p>
          <p className="text-teal-700 text-[10px] mt-2">আপনার সকল উত্তোলন রিকোয়েস্ট এখানে দেখা যাবে।</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAndSortedTransactions.map((trx) => (
            <div key={trx.id} className="bg-gradient-to-r from-teal-900/40 to-teal-950/40 p-5 rounded-[28px] border border-teal-800/30 flex items-center justify-between group hover:border-teal-600/50 transition-all shadow-lg relative overflow-hidden">
              <div className="flex items-center gap-4 relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-orange-500/10 text-orange-400 flex items-center justify-center border border-orange-500/20 group-hover:scale-110 transition-transform">
                  <ArrowUpRight size={22} />
                </div>
                <div>
                  <p className="text-base font-black text-white italic tracking-tight uppercase">{trx.method || 'Withdraw'}</p>
                  <p className="text-[10px] text-teal-500 font-bold mt-0.5">{trx.date}</p>
                  {trx.trxId && (
                    <p className="text-[9px] text-teal-600 font-mono mt-1">ID: {trx.trxId}</p>
                  )}
                </div>
              </div>
              <div className="text-right relative z-10">
                <p className="text-lg font-black text-white tracking-tighter">৳{Math.abs(parseFloat(String(trx.amount).replace(/[^0-9.-]+/g,""))).toLocaleString()}</p>
                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest mt-1.5 ${
                  trx.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20' :
                  trx.status === 'approved' || trx.status === 'completed' ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20' :
                  'bg-red-500/10 text-red-400 border border-red-500/20'
                }`}>
                  <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                    trx.status === 'pending' ? 'bg-yellow-500' :
                    trx.status === 'approved' || trx.status === 'completed' ? 'bg-teal-500' :
                    'bg-red-500'
                  }`} />
                  {trx.status === 'completed' ? 'সম্পন্ন' : trx.status === 'pending' ? 'প্রক্রিয়াধীন' : trx.status}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SettingsTab({ profileData, onLogout, onEditProfile, showToast, hideAccountDetails, onOpenBankCards, onBack }: { profileData: any, onLogout: () => void, onEditProfile: () => void, showToast: (msg: string, type?: ToastType) => void, hideAccountDetails?: boolean, onOpenBankCards?: () => void, onBack: () => void }) {
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
      fetchLocationByIP();
      return;
    }

    setIsFetchingLocation(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          let countryName = null;

          // Try BigDataCloud first
          try {
            const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`);
            if (response.ok) {
              const data = await response.json();
              countryName = data.countryName;
            }
          } catch (e) {
            console.warn("BigDataCloud reverse geocode failed:", e);
          }

          // Fallback to Nominatim if BigDataCloud fails
          if (!countryName) {
            try {
              const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=3&addressdetails=1`, {
                headers: { 'Accept-Language': 'en' }
              });
              if (response.ok) {
                const data = await response.json();
                countryName = data.address?.country;
              }
            } catch (e) {
              console.warn("Nominatim reverse geocode failed:", e);
            }
          }

          if (countryName) {
            handleUpdateCountry(countryName);
          } else {
            // If reverse geocoding failed, try IP-based
            await fetchLocationByIP();
          }
        } catch (error) {
          console.error("Error processing geolocation:", error);
          await fetchLocationByIP();
        } finally {
          setIsFetchingLocation(false);
        }
      },
      async (error) => {
        console.warn("Geolocation error, falling back to IP:", error);
        await fetchLocationByIP();
        setIsFetchingLocation(false);
      },
      { timeout: 8000, maximumAge: 60000 }
    );
  };

  const fetchLocationByIP = async () => {
    try {
      // Try ipapi.co first
      const response = await fetch('https://ipapi.co/json/');
      if (response.ok) {
        const data = await response.json();
        if (data.country_name) {
          handleUpdateCountry(data.country_name);
          return;
        }
      }
      
      // Fallback to ip-api.com (HTTP only for free tier, but let's try)
      const response2 = await fetch('https://ipwho.is/');
      if (response2.ok) {
        const data = await response2.json();
        if (data.country) {
          handleUpdateCountry(data.country);
          return;
        }
      }
    } catch (e) {
      console.error("IP-based location failed:", e);
    }
    setLocationError("Could not determine location");
  };

  const handleUpdateCountry = async (countryName: string) => {
    setCountry(countryName);
    if (auth.currentUser) {
      try {
        await updateUserProfile(auth.currentUser.uid, { country: countryName });
      } catch (e) {
        console.error("Failed to update country in profile:", e);
      }
    }
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
        const result = await linkWithPopup(auth.currentUser, new GoogleAuthProvider());
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
    <>
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 p-4 pb-20">
        {/* Security Header */}
      <div className="bg-gradient-to-br from-teal-900 to-teal-950 rounded-[40px] p-8 border border-teal-700/50 shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/5 rounded-full blur-[100px] -mr-32 -mt-32"></div>
        <div className="relative z-10 flex justify-between items-start">
          <div>
            <div className="w-16 h-16 rounded-2xl bg-yellow-500/20 flex items-center justify-center text-yellow-500 mb-4 shadow-xl border border-yellow-500/20">
              <ShieldCheck size={32} />
            </div>
            <h2 className="text-3xl font-black text-white italic tracking-tight">নিরাপত্তা ও সেটিংস</h2>
            <p className="text-teal-400 text-xs font-bold uppercase tracking-widest mt-2">Security & Account Settings</p>
          </div>
          <button 
            onClick={onBack}
            className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center text-white hover:bg-red-500 transition-all border border-white/10"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Linked Accounts Section */}
      <div className="bg-teal-900/40 rounded-[36px] border border-teal-700/50 overflow-hidden shadow-xl">
        <div className="p-6 border-b border-teal-800/50 flex items-center justify-between bg-black/20">
          <h3 className="font-black text-white italic flex items-center gap-3 text-sm uppercase tracking-wider">
            <Link size={22} className="text-yellow-500" /> লিঙ্ক করা অ্যাকাউন্ট
          </h3>
        </div>
        <div className="p-5 grid grid-cols-1 gap-4">
          {/* Google */}
          <div className={`flex items-center justify-between p-5 rounded-3xl border transition-all duration-500 ${isGoogleLinked ? 'bg-teal-800/40 border-teal-500/30' : 'bg-black/20 border-white/5'}`}>
            <div className="flex items-center gap-5">
              <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-xl">
                <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" alt="Google" className="w-6 h-6" />
              </div>
              <div>
                <p className="text-base font-black text-white">Google</p>
                <p className={`text-[10px] font-bold ${isGoogleLinked ? 'text-teal-400' : 'text-slate-500'} uppercase tracking-widest mt-0.5`}>
                  {isGoogleLinked ? 'সংযুক্ত (Connected)' : 'সংযুক্ত নয় (Disconnected)'}
                </p>
              </div>
            </div>
            <button 
              onClick={handleLinkGoogle}
              disabled={isLinkingGoogle}
              className={`px-6 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-lg ${
                isGoogleLinked 
                  ? 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500 hover:text-white' 
                  : 'bg-yellow-500 text-black hover:bg-yellow-400 shadow-yellow-500/20'
              }`}
            >
              {isLinkingGoogle ? <RefreshCw size={16} className="animate-spin" /> : (isGoogleLinked ? 'বিচ্ছিন্ন করুন' : 'লিঙ্ক করুন')}
            </button>
          </div>

          {/* Facebook */}
          <div className={`flex items-center justify-between p-5 rounded-3xl border transition-all duration-500 ${isFacebookLinked ? 'bg-teal-800/40 border-teal-500/30' : 'bg-black/20 border-white/5'}`}>
            <div className="flex items-center gap-5">
              <div className="w-12 h-12 rounded-2xl bg-[#1877F2] flex items-center justify-center shadow-xl">
                <Facebook size={24} className="text-white" />
              </div>
              <div>
                <p className="text-base font-black text-white">Facebook</p>
                <p className={`text-[10px] font-bold ${isFacebookLinked ? 'text-teal-400' : 'text-slate-500'} uppercase tracking-widest mt-0.5`}>
                  {isFacebookLinked ? 'সংযুক্ত (Connected)' : 'সংযুক্ত নয় (Disconnected)'}
                </p>
              </div>
            </div>
            <button 
              onClick={handleLinkFacebook}
              disabled={isLinkingFacebook}
              className={`px-6 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-lg ${
                isFacebookLinked 
                  ? 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500 hover:text-white' 
                  : 'bg-yellow-500 text-black hover:bg-yellow-400 shadow-yellow-500/20'
              }`}
            >
              {isLinkingFacebook ? <RefreshCw size={16} className="animate-spin" /> : (isFacebookLinked ? 'বিচ্ছিন্ন করুন' : 'লিঙ্ক করুন')}
            </button>
          </div>
        </div>
      </div>

      {/* Security Options */}
      <div className="bg-teal-900/40 rounded-[36px] border border-teal-700/50 overflow-hidden shadow-xl">
        <div className="p-6 border-b border-teal-800/50 flex items-center justify-between bg-black/20">
          <h3 className="font-black text-white italic flex items-center gap-3 text-sm uppercase tracking-wider">
            <Lock size={22} className="text-yellow-500" /> অ্যাকাউন্ট নিরাপত্তা
          </h3>
        </div>
        
        <div className="divide-y divide-teal-800/30">
          {/* Email Update */}
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-teal-950 border border-teal-800 flex items-center justify-center text-teal-400">
                  <Mail size={20} />
                </div>
                <div>
                  <p className="text-[10px] text-teal-500 uppercase tracking-widest font-black">ইমেইল ঠিকানা</p>
                  <p className="text-sm text-white font-bold mt-0.5">{profileData?.email || 'সংযুক্ত নেই'}</p>
                </div>
              </div>
              <button 
                onClick={() => setIsPasswordModalOpen(true)}
                className="px-4 py-2 bg-white/5 hover:bg-yellow-500 hover:text-black text-teal-400 text-[10px] font-black uppercase tracking-widest rounded-xl border border-white/10 transition-all"
              >
                পরিবর্তন করুন
              </button>
            </div>
          </div>

          {/* Password Change */}
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-teal-950 border border-teal-800 flex items-center justify-center text-teal-400">
                  <Key size={20} />
                </div>
                <div>
                  <p className="text-[10px] text-teal-500 uppercase tracking-widest font-black">পাসওয়ার্ড</p>
                  <p className="text-sm text-white font-bold mt-0.5">••••••••••••</p>
                </div>
              </div>
              <button 
                onClick={() => setIsPasswordModalOpen(true)}
                className="px-4 py-2 bg-white/5 hover:bg-yellow-500 hover:text-black text-teal-400 text-[10px] font-black uppercase tracking-widest rounded-xl border border-white/10 transition-all"
              >
                রিসেট করুন
              </button>
            </div>
          </div>

          {/* 2FA Toggle */}
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-teal-950 border border-teal-800 flex items-center justify-center text-teal-400">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <p className="text-[10px] text-teal-500 uppercase tracking-widest font-black">টু-ফ্যাক্টর অথেন্টিকেশন</p>
                  <p className={`text-sm font-bold mt-0.5 ${is2FAEnabled ? 'text-teal-400' : 'text-red-400'}`}>
                    {is2FAEnabled ? 'সক্রিয় (Enabled)' : 'নিষ্ক্রিয় (Disabled)'}
                  </p>
                </div>
              </div>
              <button 
                onClick={is2FAEnabled ? () => setIsConfirmingDisable2FA(true) : handleStart2FASetup}
                className={`w-14 h-7 rounded-full relative transition-all duration-500 ${is2FAEnabled ? 'bg-teal-500 shadow-[0_0_15px_rgba(20,184,166,0.5)]' : 'bg-teal-950 border border-teal-800'}`}
              >
                <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all duration-500 shadow-md ${is2FAEnabled ? 'left-8' : 'left-1'}`} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

      {/* Account Verification Section */}
      <div className="bg-teal-900/40 rounded-[36px] border border-teal-700/50 overflow-hidden shadow-xl">
        <div className="p-6 border-b border-teal-800/50 flex items-center justify-between bg-black/20">
          <h3 className="font-black text-white italic flex items-center gap-3 text-sm uppercase tracking-wider">
            <UserCheck size={22} className="text-yellow-500" /> অ্যাকাউন্ট ভেরিফিকেশন
          </h3>
          {isFullyVerified && (
            <span className="px-3 py-1 bg-teal-500/20 text-teal-400 text-[9px] font-black uppercase tracking-widest rounded-full border border-teal-500/30">
              ভেরিফাইড
            </span>
          )}
        </div>
        
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={() => idInputRef.current?.click()}
              className={`p-5 rounded-3xl border-2 border-dashed transition-all flex flex-col items-center gap-3 group ${idStatus === 'verified' ? 'bg-teal-500/10 border-teal-500/30' : 'bg-black/20 border-teal-800/30 hover:border-teal-500/50'}`}
            >
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 ${idStatus === 'verified' ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/20' : 'bg-teal-950 text-teal-500 group-hover:scale-110'}`}>
                <IdCard size={24} />
              </div>
              <p className="text-[10px] font-black text-white uppercase tracking-widest">এনআইডি কার্ড</p>
              <input type="file" ref={idInputRef} onChange={handleIdUpload} className="hidden" accept="image/*" />
            </button>

            <button 
              onClick={() => selfieInputRef.current?.click()}
              className={`p-5 rounded-3xl border-2 border-dashed transition-all flex flex-col items-center gap-3 group ${selfieStatus === 'verified' ? 'bg-teal-500/10 border-teal-500/30' : 'bg-black/20 border-teal-800/30 hover:border-teal-500/50'}`}
            >
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 ${selfieStatus === 'verified' ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/20' : 'bg-teal-950 text-teal-500 group-hover:scale-110'}`}>
                <Camera size={24} />
              </div>
              <p className="text-[10px] font-black text-white uppercase tracking-widest">সেলফি ভেরিফিকেশন</p>
              <input type="file" ref={selfieInputRef} onChange={handleSelfieUpload} className="hidden" accept="image/*" />
            </button>
          </div>

          <div className="bg-yellow-500/5 p-4 rounded-2xl border border-yellow-500/10 flex items-start gap-3">
            <Info size={16} className="text-yellow-500 shrink-0 mt-0.5" />
            <p className="text-[10px] text-yellow-200/70 leading-relaxed font-bold">
              অ্যাকাউন্ট ভেরিফিকেশন করলে আপনার সিকিউরিটি বৃদ্ধি পাবে এবং উত্তোলনের লিমিট বাড়বে।
            </p>
          </div>
        </div>
      </div>

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

      {/* Support Section */}
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
    </div>
  </>
  );
}
