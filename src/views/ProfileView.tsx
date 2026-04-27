import React, { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from 'motion/react';
import AgentPanel from './AgentPanel';
import SupportChat from "../layout/SupportChat";
import ProfileHeader from './ProfileHeader';
import ProfileNavigation from './ProfileNavigation';
import Skeleton from '../components/ui/Skeleton';
import InviteView from './InviteView';
import ImageCropper from '../components/ui/ImageCropper';
import ShareModal from '../components/modals/ShareModal';
import { VIP_LEVELS, getVIPLevel, getNextVIPLevel } from '../constants/vipLevels';
const fetcher = (url: string) => fetch(url).then(res => {
  if (!res.ok) throw new Error('Network response was not ok');
  return res.json();
});

import { ToastType } from "../components/ui/Toast";
import { 
  X, Gift, Percent, Info, Crown, Sparkles, CheckCircle2, UserCog, 
  User, BadgeCheck, Smartphone, Mail, CreditCard, Shield, Building2, 
  ChevronLeft, ClipboardList, MessageCircle, Wallet, Plus, RefreshCw, 
  Eye, EyeOff, Calendar, MapPin, QrCode, Facebook, Camera, Edit, 
  Link, MessageSquare, HelpCircle, Settings, Users, ArrowDownUp, 
  LogOut, ArrowDownLeft, BarChart3, Headset, Send, History as HistoryIcon, 
  Filter, Play, Clock, ArrowUpRight, ShieldCheck, Check, AlertCircle, 
  AlertTriangle, KeyRound, Copy, Lock, UserCheck, IdCard, Loader2, ChevronRight,
  Search, TrendingUp, Gamepad2, Key, Download, Bell, Trophy, Star, FileText,
  ClipboardCheck, FileSearch, UserCircle, UserPlus, Coins, AtSign, Zap, ArrowRight,
  ChevronDown, Megaphone, Compass, Globe, Share2
} from 'lucide-react';

import { db } from '../services/firebase';
import { collection, query, where, getDocs, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore';

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
  minWithdraw = 500,
  onUpdateUser,
  onAddTransaction
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
  minWithdraw?: number,
  onUpdateUser?: (updates: any) => Promise<void>,
  onAddTransaction?: (transaction: any) => Promise<void>
}) {
  const [activeSubTab, setActiveSubTab] = useState<'dashboard' | 'profile' | 'history' | 'withdraw' | 'links' | 'withdrawHistory' | 'reward-center' | 'betting-record' | 'profit-loss' | 'deposit-record' | 'withdraw-record' | 'account-record' | 'security' | 'rebate' | 'mail' | 'feedback' | 'support' | 'invite' | 'faq'>(initialSubTab as any);
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState(false);
  const unreadNotificationsCount = 0; // Temporary definition
  
  useEffect(() => {
    if (initialSubTab) {
      setActiveSubTab(initialSubTab);
    }
  }, [initialSubTab]);
  const [isTabLoading, setIsTabLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [profilePic, setProfilePic] = useState<string | null>(userData?.profilePictureUrl || null);
  
  useEffect(() => {
    if (userData?.profilePictureUrl) {
      setProfilePic(userData.profilePictureUrl);
    }
  }, [userData?.profilePictureUrl]);

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
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
  const [isConfirmingLogout, setIsConfirmingLogout] = useState(false);
  const [showAgentPanel, setShowAgentPanel] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isEditingCasinoName, setIsEditingCasinoName] = useState(false);
  const [newCasinoName, setNewCasinoName] = useState(casinoName || "");
  const [isUpdatingCasinoName, setIsUpdatingCasinoName] = useState(false);
  const [isBankCardsModalOpen, setIsBankCardsModalOpen] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [newBankName, setNewBankName] = useState("");
  const [newAccountNumber, setNewAccountNumber] = useState("");
  const [newAccountHolderName, setNewAccountHolderName] = useState("");
  const [isAddingBankCard, setIsAddingBankCard] = useState(false);
  const [isSubmittingBankCard, setIsSubmittingBankCard] = useState(false);

  const [isGoogleLinked, setIsGoogleLinked] = useState(false);
  const [isFacebookLinked, setIsFacebookLinked] = useState(false);
  const [isOTPModalOpen, setIsOTPModalOpen] = useState(false);
  const [otpValue, setOtpValue] = useState("");
  const [isVerifyingOTP, setIsVerifyingOTP] = useState(false);
  const [isAccountVerified, setIsAccountVerified] = useState(userData?.isVerified || false);

  useEffect(() => {
    // Auth state listeners removed (Firebase disconnected)
  }, []);

  const [isLinkingGoogle, setIsLinkingGoogle] = useState(false);
  const [isLinkingFacebook, setIsLinkingFacebook] = useState(false);

  const handleLinkGoogle = async () => {
    setIsLinkingGoogle(true);
    setTimeout(() => {
      setIsGoogleLinked(!isGoogleLinked);
      showToast(isGoogleLinked ? "গুগল অ্যাকাউন্ট আনলিঙ্ক করা হয়েছে।" : "গুগল অ্যাকাউন্ট সফলভাবে লিঙ্ক করা হয়েছে!", "success");
      setIsLinkingGoogle(false);
    }, 1000);
  };

  const handleLinkFacebook = async () => {
    setIsLinkingFacebook(true);
    setTimeout(() => {
      setIsFacebookLinked(!isFacebookLinked);
      showToast(isFacebookLinked ? "ফেসবুক অ্যাকাউন্ট আনলিঙ্ক করা হয়েছে।" : "ফেসবুক অ্যাকাউন্ট সফলভাবে লিঙ্ক করা হয়েছে!", "success");
      setIsLinkingFacebook(false);
    }, 1000);
  };

  const handleRequestOTP = () => {
    if (!userData?.phone && !userData?.phoneNumber) {
      showToast("দয়া করে আগে প্রোফাইলে ফোন নম্বর যুক্ত করুন।", "warning");
      return;
    }
    showToast("আপনার ফোন নম্বরে একটি ওটিপি পাঠানো হয়েছে (সিমুলেশন)", "info");
    setIsOTPModalOpen(true);
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpValue.length !== 6) {
      showToast("দয়া করে ৬ ডিজিটের ওটিপি দিন।", "error");
      return;
    }
    setIsVerifyingOTP(true);
    setTimeout(async () => {
      setIsAccountVerified(true);
      if (onUpdateUser) {
        await onUpdateUser({ isVerified: true });
      }
      showToast("আপনার অ্যাকাউন্ট সফলভাবে ভেরিফাই করা হয়েছে!", "success");
      setIsOTPModalOpen(false);
      setIsVerifyingOTP(false);
      setOtpValue("");
    }, 1500);
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
    // Totals fetching removed (Firebase disconnected)
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
      if (onUpdateUser) {
        await onUpdateUser({
          username: editUsername,
          phone: editPhone,
          phoneNumber: editPhone,
          fullName: editFullName,
          email: editEmail
        });
      }
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
    
    const currentBankCards = userData?.bankCards || [];
    if (currentBankCards.length >= 5) {
      showToast("আপনি সর্বোচ্চ ৫টি কার্ড যুক্ত করতে পারবেন।", "error");
      return;
    }

    if (!newBankName || !newAccountNumber || !newAccountHolderName) {
      showToast("সবগুলো তথ্য পূরণ করুন।", "error");
      return;
    }

    setIsSubmittingBankCard(true);
    try {
      const newCard = {
        id: Math.random().toString(36).substr(2, 9),
        bankName: newBankName,
        accountNumber: newAccountNumber,
        accountHolderName: newAccountHolderName,
        createdAt: new Date().toISOString()
      };
      
      if (onUpdateUser) {
        await onUpdateUser({
          bankCards: [...currentBankCards, newCard]
        });
      }
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
      const currentBankCards = userData?.bankCards || [];
      if (onUpdateUser) {
        await onUpdateUser({
          bankCards: currentBankCards.filter((c: any) => c.id !== cardId)
        });
      }
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
      // updateCasinoName call removed (Firebase disconnected)
      showToast("কেসিনো নাম আপডেট করা হয়েছে", "success");
      setIsEditingCasinoName(false);
    } catch (err) {
      console.error("Error updating casino name:", err);
      showToast("কেসিনো নাম আপডেট করতে সমস্যা হয়েছে", "error");
    } finally {
      setIsUpdatingCasinoName(false);
    }
  };

  const handleLogoutRequest = () => {
    setIsConfirmingLogout(true);
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
      if (file.size > 5 * 1024 * 1024) {
        showToast("ছবিটি ৫ মেগাবাইটের কম হতে হবে", "error");
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCropComplete = async (croppedImage: string) => {
    setSelectedImage(null);
    setProfilePic(croppedImage);
    const userId = userData?.id;
    if (userId) {
      try {
        if (onUpdateUser) {
           await onUpdateUser({ profilePictureUrl: croppedImage });
        }
        showToast("প্রোফাইল ছবি সফলভাবে আপডেট করা হয়েছে", "success");
      } catch (error) {
        console.error("Error updating profile picture:", error);
        showToast("ছবি আপডেট করতে সমস্যা হয়েছে", "error");
      }
    }
  };
  
  const profileData = userData;

  return (
    <div className="flex-1 overflow-y-auto pb-20 bg-[#0b5c4b]">
      {selectedImage && (
        <ImageCropper 
          image={selectedImage} 
          onCropComplete={handleCropComplete} 
          onCancel={() => setSelectedImage(null)} 
        />
      )}
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
            onLogout={handleLogoutRequest}
            onOpenVIPDetails={() => setIsVIPDetailsModalOpen(true)}
            showToast={showToast}
            onShareProgress={() => setIsShareModalOpen(true)}
            setIsNotificationCenterOpen={setIsNotificationCenterOpen}
            unreadNotificationsCount={unreadNotificationsCount}
            onEditProfilePic={() => fileInputRef.current?.click()}
            profilePic={profilePic}
          />
        )}

        {activeSubTab === 'profile' && (
          <ProfileTab 
            userData={userData} 
            onEditProfile={handleOpenEditProfile} 
            onEditProfilePic={() => fileInputRef.current?.click()}
            profilePic={profilePic}
            onLogout={handleLogoutRequest}
            showToast={showToast}
            onOpenBankCards={() => setIsBankCardsModalOpen(true)}
            isGoogleLinked={isGoogleLinked}
            isFacebookLinked={isFacebookLinked}
            handleLinkGoogle={handleLinkGoogle}
            handleLinkFacebook={handleLinkFacebook}
            isLinkingGoogle={isLinkingGoogle}
            isLinkingFacebook={isLinkingFacebook}
            onBack={() => handleSubTabChange('dashboard')}
            isAccountVerified={isAccountVerified}
            handleRequestOTP={handleRequestOTP}
          />
        )}
        {activeSubTab === 'history' && <HistoryTab userData={userData} onBack={() => handleSubTabChange('dashboard')} />}
        {activeSubTab === 'withdrawHistory' && <WithdrawalHistoryTab userData={userData} onBack={() => handleSubTabChange('dashboard')} />}
        {activeSubTab === 'links' && <LinksTab onTabChange={onTabChange} onSubTabChange={handleSubTabChange} showToast={showToast} />}
        {activeSubTab === 'withdraw' && <WithdrawTab onBack={() => handleSubTabChange('dashboard')} balance={balance} showToast={showToast} userData={userData} setIsTurnoverInfoModalOpen={setIsTurnoverInfoModalOpen} minWithdraw={minWithdraw} onRefresh={handleRefresh} isRefreshing={isRefreshing} onOpenBankCards={() => setIsBankCardsModalOpen(true)} onUpdateUser={onUpdateUser} onAddTransaction={onAddTransaction} />}
        
        {activeSubTab === 'betting-record' && <HistoryTab userData={userData} onBack={() => handleSubTabChange('dashboard')} />}
        {activeSubTab === 'deposit-record' && <DepositHistoryTab userData={userData} onBack={() => handleSubTabChange('dashboard')} />}
        {activeSubTab === 'account-record' && <AccountRecordTab userData={userData} onBack={() => handleSubTabChange('dashboard')} />}
        {activeSubTab === 'security' && (
          <SettingsTab 
            profileData={userData} 
            onLogout={handleLogoutRequest} 
            onEditProfile={handleOpenEditProfile} 
            showToast={showToast} 
            hideAccountDetails={false} 
            onOpenBankCards={() => setIsBankCardsModalOpen(true)}
            onBack={() => handleSubTabChange('dashboard')}
            onUpdateUser={onUpdateUser}
            isGoogleLinked={isGoogleLinked}
            isFacebookLinked={isFacebookLinked}
            handleLinkGoogle={handleLinkGoogle}
            handleLinkFacebook={handleLinkFacebook}
            isLinkingGoogle={isLinkingGoogle}
            isLinkingFacebook={isLinkingFacebook}
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
        {activeSubTab === 'faq' && <HelpCenterTab onBack={() => handleSubTabChange('dashboard')} />}
        {activeSubTab === 'invite' && (
          <InviteView 
            onTabChange={onTabChange}
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
          />
        </div>
      )}

      {/* Turnover Info Modal */}
      {isTurnoverInfoModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[40px] w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 max-h-[85vh] flex flex-col border border-white">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h3 className="font-black text-gray-800 italic uppercase tracking-tighter flex items-center gap-2">
                <Info size={22} className="text-yellow-600" /> 
                টানউভার (Turnover) কী?
              </h3>
              <button 
                onClick={() => setIsTurnoverInfoModalOpen(false)}
                className="text-gray-400 hover:text-red-500 p-2 hover:bg-red-50 rounded-xl transition-all"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="p-8 overflow-y-auto space-y-8 text-sm leading-relaxed scrollbar-hide">
              <section className="space-y-3">
                <h4 className="text-yellow-600 font-black uppercase italic tracking-tight flex items-center gap-2 text-base">
                  <Star size={18} /> ১. টার্নওভার কী?
                </h4>
                <p className="text-gray-600 font-medium">
                  আপনি গেমে জিতলেন নাকি হারলেন, সেটা এখানে বড় কথা নয়। আপনি প্রতিবার যত টাকা দিয়ে বাজি ধরছেন, সেই সবগুলোর যোগফলই হলো টার্নওভার।
                </p>
                <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100 shadow-inner space-y-3">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">উদাহরণ (Example):</p>
                  <ul className="text-xs text-gray-600 space-y-2 font-bold">
                    <li className="flex gap-2"><span>•</span> ১০০ টাকা দিয়ে বাজি ধরলে টার্নওভার ১০০।</li>
                    <li className="flex gap-2"><span>•</span> আবার ৫০ টাকা ধরলে টার্নওভার ১০০ + ৫০ = ১৫০।</li>
                  </ul>
                  <p className="text-[10px] text-gray-700 font-black mt-2 leading-relaxed">এখানে আপনার মোট টার্নওভার ১৫০ টাকা। ব্যালেন্স কত থাকল সেটা বিষয় নয়।</p>
                </div>
              </section>

              <section className="space-y-3">
                <h4 className="text-yellow-600 font-black uppercase italic tracking-tight flex items-center gap-2 text-base">
                  <Star size={18} /> ২. কেন এটি গুরুত্বপূর্ণ?
                </h4>
                <div className="space-y-4">
                  <div className="flex gap-4 p-4 rounded-2xl bg-white border border-gray-50 shadow-sm">
                    <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center shrink-0 text-yellow-600 text-xs font-black">১</div>
                    <div>
                      <p className="font-black text-gray-800 text-xs uppercase italic tracking-tight mb-1">বোনাস উইথড্র (Wagering)</p>
                      <p className="text-gray-500 text-[11px] font-medium leading-relaxed">বোঝার জন্য— ১০০০ টাকা বোনাস পেলে আপনাকে ৫০০০ টাকার বাজি ধরতে হতে পারে (৫ গুন), তারপরই আপনি সেই টাকা তুলতে পারবেন।</p>
                    </div>
                  </div>
                </div>
              </section>

              <div className="bg-yellow-50 p-5 rounded-3xl border border-yellow-100/50">
                <p className="text-xs text-yellow-700 font-bold italic text-center">
                  * টানউভার সিস্টেম: ডিপোজিট ১গুণ + বোনাস ৭গুণ।
                </p>
              </div>
            </div>
            
            <div className="p-6 bg-gray-50 border-t border-gray-100">
              <button 
                onClick={() => setIsTurnoverInfoModalOpen(false)}
                className="w-full bg-[#333] hover:bg-black text-white font-black py-4 rounded-2xl transition-all shadow-lg shadow-black/10 uppercase tracking-widest text-xs active:scale-95"
              >
                ঠিক আছে (Got it)
              </button>
            </div>
          </div>
        </div>
      )}
      {/* OTP Verification Modal */}
      {isOTPModalOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOTPModalOpen(false)}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative bg-white border border-gray-100 rounded-[40px] p-10 w-full max-w-sm shadow-2xl text-center"
          >
            <div className="w-20 h-20 bg-blue-50 text-blue-500 rounded-[30px] flex items-center justify-center mx-auto mb-6 shadow-inner">
              <Smartphone size={40} />
            </div>
            <h3 className="text-2xl font-serif font-black text-gray-900 mb-2 italic">OTP যাচাইকরণ</h3>
            <p className="text-gray-400 text-xs font-bold mb-8">আপনার ফোন নম্বরে পাঠানো ৬ ডিজিটের কোডটি লিখুন।</p>
            
            <form onSubmit={handleVerifyOTP} className="space-y-6">
              <input 
                type="text"
                maxLength={6}
                value={otpValue}
                onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, ''))}
                className="w-full bg-gray-50 border border-gray-100 rounded-[24px] py-5 px-6 text-center text-3xl font-black tracking-[0.5em] text-gray-900 focus:outline-none focus:border-blue-400 transition-all shadow-inner"
                placeholder="000000"
                autoFocus
              />
              
              <div className="flex flex-col gap-3">
                <button 
                  type="submit"
                  disabled={isVerifyingOTP || otpValue.length !== 6}
                  className="w-full bg-gray-900 text-white font-black py-4 rounded-[20px] hover:bg-black transition-all shadow-xl flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {isVerifyingOTP ? <Loader2 className="animate-spin" /> : 'ভেরিফাই সম্পন্ন করুন'}
                </button>
                <button 
                  type="button"
                  onClick={() => setIsOTPModalOpen(false)}
                  className="text-gray-400 text-[10px] font-black uppercase tracking-widest hover:text-gray-600 transition-colors"
                >
                  এখন না (Later)
                </button>
              </div>
            </form>

            <div className="mt-8 p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
              <p className="text-[10px] text-blue-700 font-bold leading-relaxed">
                * কোডটি পেতে ১-২ মিনিট সময় লাগতে পারে। সিমটি সক্রিয় রাখুন।
              </p>
            </div>
          </motion.div>
        </div>
      )}

      {/* VIP Details Modal */}
      {isVIPDetailsModalOpen && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-[48px] w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 max-h-[90vh] flex flex-col border border-white">
            <div className="p-10 border-b border-gray-100 flex items-center justify-between bg-gradient-to-br from-gray-50 to-white relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/5 rounded-full -mr-16 -mt-16 blur-3xl" />
              <div className="relative z-10">
                <h3 className="text-2xl font-black text-[#333] italic uppercase tracking-tighter flex items-center gap-3">
                  <Crown size={32} className="text-yellow-600 fill-yellow-500/20" /> 
                  VIP মেম্বারশিপ
                </h3>
                <p className="text-[#8c7841] text-[10px] font-black uppercase tracking-[0.2em] mt-1">এক্সক্লুসিভ রিওয়ার্ডস এবং বেনিফিটস</p>
              </div>
              <button 
                onClick={() => setIsVIPDetailsModalOpen(false)}
                className="relative z-10 text-gray-400 hover:text-red-500 p-2 hover:bg-red-50 rounded-xl transition-all"
              >
                <X size={28} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
              {VIP_LEVELS.map((level) => (
                <div 
                  key={level.level}
                  className={`relative p-8 rounded-[40px] border-2 transition-all duration-500 ${
                    userData?.vipLevel === level.level 
                      ? 'border-yellow-500 bg-yellow-50/50 shadow-xl scale-[1.02]' 
                      : 'border-gray-100 bg-white opacity-60'
                  }`}
                >
                  {userData?.vipLevel === level.level && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#333] text-white text-[9px] font-black px-6 py-2 rounded-full shadow-lg uppercase tracking-widest z-10 border-2 border-white">
                      বর্তমান লেভেল
                    </div>
                  )}
                  
                  <div className="flex items-center gap-6 mb-8">
                    <div className={`w-20 h-20 rounded-3xl ${level.bgColor} flex items-center justify-center text-5xl shadow-lg border-2 ${level.borderColor} relative overflow-hidden transform group-hover:rotate-6 transition-transform`}>
                      <span className="relative z-10 drop-shadow-md">{level.icon}</span>
                    </div>
                    <div>
                      <h4 className={`text-2xl font-black italic tracking-tighter ${level.color} flex items-center gap-2`}>
                        VIP {level.level}
                        <span className="text-gray-400 text-lg ml-1 opacity-50">•</span>
                        {level.name}
                      </h4>
                      <div className="flex items-center gap-3 mt-2">
                        <div className="h-2 w-24 bg-gray-100 rounded-full overflow-hidden border border-black/5">
                          <div className={`h-full ${level.color.replace('text-', 'bg-')} w-full`} />
                        </div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                          ৳ {level.minTurnover.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
 
                  <div className="space-y-4">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">সুবিধাসমূহ (Exclusive Benefits):</p>
                    <div className="grid grid-cols-1 gap-2.5">
                      {level.benefits.map((benefit, i) => (
                        <div key={i} className="flex items-center gap-4 text-xs font-bold text-gray-600 bg-white/50 p-4 rounded-2xl border border-gray-100 hover:border-yellow-200 transition-colors">
                          <div className="w-6 h-6 rounded-full bg-yellow-400/10 flex items-center justify-center shrink-0">
                            <Check size={14} className="text-yellow-600" />
                          </div>
                          {benefit}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="p-8 bg-gray-50 border-t border-gray-100">
              <button 
                onClick={() => setIsVIPDetailsModalOpen(false)}
                className="w-full bg-[#333] hover:bg-black text-white font-black py-5 rounded-[24px] transition-all active:scale-95 uppercase tracking-[0.2em] text-xs shadow-xl"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Edit Profile Modal */}
      {isEditProfileModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-[48px] w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 border border-white">
            <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h3 className="text-xl font-black text-gray-800 italic uppercase tracking-tighter flex items-center gap-3">
                <UserCog size={24} className="text-yellow-600" /> 
                প্রোফাইল এডিট করুন
              </h3>
              <button 
                onClick={() => setIsEditProfileModalOpen(false)}
                className="text-gray-400 hover:text-red-500 p-2 hover:bg-red-50 rounded-xl transition-all"
              >
                <X size={28} />
              </button>
            </div>
            
            <form onSubmit={handleUpdateProfile} className="p-8 space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] text-gray-400 font-black uppercase tracking-widest ml-2">ইউজার নেম (Username)</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                  <input 
                    type="text" 
                    value={editUsername}
                    disabled
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-12 pr-4 py-4 text-sm text-gray-400 focus:outline-none cursor-not-allowed font-bold"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] text-gray-400 font-black uppercase tracking-widest ml-2">পুরো নাম (Full Name)</label>
                <div className="relative">
                  <BadgeCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input 
                    type="text" 
                    value={editFullName}
                    onChange={(e) => setEditFullName(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-12 pr-4 py-4 text-sm text-gray-700 focus:outline-none focus:border-yellow-500 transition-all font-bold"
                    placeholder="আপনার পুরো নাম লিখুন"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-[10px] text-gray-400 font-black uppercase tracking-widest ml-2">ফোন নম্বর (Phone Number)</label>
                <div className="relative">
                  <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input 
                    type="tel" 
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-12 pr-4 py-4 text-sm text-gray-700 focus:outline-none focus:border-yellow-500 transition-all font-bold"
                    placeholder="আপনার ফোন নম্বর লিখুন"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] text-gray-400 font-black uppercase tracking-widest ml-2">ইমেইল (Email Address)</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input 
                    type="email" 
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-12 pr-4 py-4 text-sm text-gray-700 focus:outline-none focus:border-yellow-500 transition-all font-bold"
                    placeholder="আপনার ইমেইল লিখুন"
                  />
                </div>
              </div>
              
              <div className="flex gap-4 pt-6">
                <button 
                  type="button"
                  onClick={() => setIsEditProfileModalOpen(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-500 font-black py-4 rounded-2xl transition-all uppercase tracking-widest text-[10px]"
                >
                  বাতিল করুন
                </button>
                <button 
                  type="submit"
                  disabled={isUpdatingProfile}
                  className="flex-1 bg-[#333] hover:bg-black text-white font-black py-4 rounded-2xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 uppercase tracking-widest text-[10px]"
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

      {/* Share Progress Modal */}
      <ShareModal 
        isOpen={isShareModalOpen} 
        onClose={() => setIsShareModalOpen(false)} 
        showToast={showToast}
        title={`${casinoName || 'SPIN71.bet'} - Play with me!`}
        text={`Hey guys, check out my progress on ${casinoName || 'SPIN71.bet'}! I have ৳ ${balance.toLocaleString()} in my wallet. Join me and play!`}
        url={window.location.href}
      />

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
              className="relative bg-white rounded-[48px] w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[90vh] border border-white"
            >
              <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <h3 className="text-xl font-black text-gray-800 italic flex items-center gap-3">
                  <CreditCard size={24} className="text-yellow-600" />
                  ব্যাংক কার্ড (Bank Cards)
                </h3>
                <button 
                  onClick={() => setIsBankCardsModalOpen(false)}
                  className="text-gray-400 hover:text-red-500 p-2 hover:bg-red-50 rounded-xl transition-all"
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
                    className="space-y-6 bg-gray-50 p-6 rounded-[32px] border border-gray-100 shadow-inner"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-gray-800 font-black text-xs uppercase tracking-widest">নতুন কার্ড যুক্ত করুন</h4>
                      <button 
                        type="button"
                        onClick={() => setIsAddingBankCard(false)}
                        className="text-[10px] text-red-500 font-black hover:underline uppercase tracking-widest"
                      >
                        বাতিল (Cancel)
                      </button>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <label className="text-[10px] text-gray-400 font-black uppercase tracking-widest ml-2">ব্যাংকের নাম (Bank Name)</label>
                        <select 
                          value={newBankName}
                          onChange={(e) => setNewBankName(e.target.value)}
                          className="w-full bg-white border border-gray-100 rounded-2xl px-5 py-4 text-gray-700 text-sm focus:border-yellow-500 outline-none transition-all font-bold"
                          required
                        >
                          <option value="" disabled>নির্বাচন করুন</option>
                          <option value="bKash">bKash</option>
                          <option value="Nagad">Nagad</option>
                          <option value="Rocket">Rocket</option>
                          <option value="Upay">Upay</option>
                          <option value="Bank Asia">Bank Asia</option>
                          <option value="Dutch-Bangla Bank">Dutch-Bangla Bank</option>
                          <option value="Islami Bank">Islami Bank</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] text-gray-400 font-black uppercase tracking-widest ml-2">অ্যাকাউন্ট নাম্বার (Account No)</label>
                        <input 
                          type="text"
                          value={newAccountNumber}
                          onChange={(e) => setNewAccountNumber(e.target.value)}
                          className="w-full bg-white border border-gray-100 rounded-2xl px-5 py-4 text-gray-700 text-sm focus:border-yellow-500 outline-none transition-all font-bold"
                          placeholder="01XXXXXXXXX"
                          required
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] text-gray-400 font-black uppercase tracking-widest ml-2">অ্যাকাউন্ট হোল্ডার নাম (Holder Name)</label>
                        <input 
                          type="text"
                          value={newAccountHolderName}
                          onChange={(e) => setNewAccountHolderName(e.target.value)}
                          className="w-full bg-white border border-gray-100 rounded-2xl px-5 py-4 text-gray-700 text-sm focus:border-yellow-500 outline-none transition-all font-bold"
                          placeholder="আপনার নাম লিখুন"
                          required
                        />
                      </div>
                    </div>

                    <button 
                      type="submit"
                      disabled={isSubmittingBankCard}
                      className="w-full bg-[#333] text-white font-black py-5 rounded-[24px] hover:bg-black transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-black/10 uppercase tracking-widest text-[10px]"
                    >
                      {isSubmittingBankCard ? <Loader2 className="animate-spin" /> : "কার্ড যুক্ত করুন (Add Card)"}
                    </button>
                  </motion.form>
                ) : (
                  <button 
                    onClick={() => setIsAddingBankCard(true)}
                    disabled={(userData?.bankCards || []).length >= 5}
                    className={`w-full border-2 border-dashed p-10 rounded-[32px] flex flex-col items-center gap-4 transition-all group ${
                      (userData?.bankCards || []).length >= 5 
                        ? 'bg-gray-50 border-gray-200 opacity-50 cursor-not-allowed'
                        : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-yellow-500/30'
                    }`}
                  >
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-transform ${
                      (userData?.bankCards || []).length >= 5 ? 'bg-gray-100 text-gray-300' : 'bg-yellow-500/10 text-yellow-600 group-hover:scale-110'
                    }`}>
                      <CreditCard size={28} />
                    </div>
                    <div className="text-center">
                      <p className={`${(userData?.bankCards || []).length >= 5 ? 'text-gray-400' : 'text-gray-800'} font-black italic`}>
                        {(userData?.bankCards || []).length >= 5 ? 'কার্ডের সীমা পূর্ণ' : 'নতুন কার্ড যুক্ত করুন'}
                      </p>
                      <p className={`${(userData?.bankCards || []).length >= 5 ? 'text-gray-400' : 'text-yellow-600'} text-[9px] uppercase font-black tracking-widest mt-1`}>
                        {(userData?.bankCards || []).length >= 5 ? 'Limit Reached' : 'Add New Bank Card'}
                      </p>
                    </div>
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function WithdrawTab({ onBack, balance, showToast, userData, setIsTurnoverInfoModalOpen, minWithdraw = 500, onRefresh, isRefreshing, onOpenBankCards, onUpdateUser, onAddTransaction }: { onBack: () => void, balance: number, showToast: (msg: string, type?: any) => void, userData: any, setIsTurnoverInfoModalOpen: (show: boolean) => void, minWithdraw?: number, onRefresh: () => void, isRefreshing: boolean, onOpenBankCards: () => void, onUpdateUser?: (updates: any) => Promise<void>, onAddTransaction?: (transaction: any) => Promise<void> }) {
  const [step, setStep] = useState(1);
  const [selectedMethod, setSelectedMethod] = useState('bkash');
  const [amount, setAmount] = useState('');
  const [transactionPassword, setTransactionPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [accountNumber, setAccountNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [verificationStep, setVerificationStep] = useState(false);
  const [captchaCode, setCaptchaCode] = useState('');
  const [userCaptcha, setUserCaptcha] = useState('');
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);

  const bankCards = userData?.bankCards || [];

  useEffect(() => {
    // Withdrawals history removed (Firebase disconnected)
    setIsLoadingHistory(false);
  }, []);

  const turnover = userData?.turnover || 0;
  const requiredTurnover = userData?.requiredTurnover || 0;
  const turnoverProgress = requiredTurnover > 0 ? Math.min(100, (turnover / requiredTurnover) * 100) : 100;

  const generateCaptcha = () => {
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    setCaptchaCode(code);
    setUserCaptcha('');
  };

  const handleWithdraw = async () => {
    const withdrawAmount = parseFloat(amount);
    
    if (turnover < requiredTurnover) {
      showToast(`উত্তোলনের জন্য আরও ৳ ${(requiredTurnover - turnover).toFixed(2)} টানউভার প্রয়োজন।`, 'error');
      return;
    }

    if (isNaN(withdrawAmount) || withdrawAmount <= 0) {
      showToast('উত্তোলন পরিমাণ অবশ্যই একটি ধনাত্মক সংখ্যা হতে হবে।', 'error');
      return;
    }

    if (withdrawAmount < minWithdraw) {
      showToast(`সর্বনিম্ন উত্তোলন ${minWithdraw} টাকা।`, 'warning');
      return;
    }

    if (withdrawAmount > balance) {
      showToast('আপনার অ্যাকাউন্টে পর্যাপ্ত ব্যালেন্স নেই।', 'error');
      return;
    }

    if (bankCards.length === 0) {
      showToast('দয়া করে একটি ব্যাংক কার্ড যুক্ত করুন।', 'warning');
      return;
    }

    if (!transactionPassword.trim()) {
      showToast('দয়া করে লেনদেন পাসওয়ার্ড দিন।', 'warning');
      return;
    }

    if (!/^\d{6}$/.test(transactionPassword)) {
      showToast('লেনদেন পাসওয়ার্ড অবশ্যই ৬ ডিজিটের হতে হবে।', 'error');
      return;
    }

    // Move to verification step
    generateCaptcha();
    setVerificationStep(true);
  };

  const confirmWithdraw = async () => {
    if (userCaptcha !== captchaCode) {
      showToast('ভুল ভেরিফিকেশন কোড। (Invalid verification code)', 'error');
      generateCaptcha();
      return;
    }

    setIsSubmitting(true);
    const trxId = `WTH-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    const withdrawAmount = parseFloat(amount);
    const selectedCard = bankCards[currentCardIndex] || bankCards[0];

    try {
      // Send Telegram Notification
      try {
        await fetch('/api/telegram/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: `💸 <b>New Withdrawal Request!</b>\n\n👤 <b>User:</b> <code>${userData?.id || 'Unknown'}</code>\n💰 <b>Amount:</b> ৳${withdrawAmount}\n🏦 <b>Method:</b> ${selectedCard?.bankName || 'Bank Card'}\n💳 <b>Account:</b> ${selectedCard?.accountNumber || ''}\n🔖 <b>TxID:</b> <code>${trxId}</code>`
          })
        });
      } catch (err) {
        console.error("Telegram notification error", err);
      }

      if (onAddTransaction) {
        await onAddTransaction({
          trxId,
          type: 'withdraw',
          amount: withdrawAmount,
          method: selectedCard?.bankName || 'Bank Card',
          accountNumber: selectedCard?.accountNumber || '',
          status: 'pending',
          statusColor: 'text-amber-600',
          createdAt: new Date().toISOString()
        });
      }

      if (onUpdateUser) {
        await onUpdateUser({
          balance: balance - withdrawAmount,
          totalWithdraws: (userData?.totalWithdraws || 0) + withdrawAmount
        });
      }
      showToast('উত্তোলন রিকোয়েস্ট সফল হয়েছে! আপনার অ্যাকাউন্টে টাকা পৌঁছে যাবে।', 'success');
      onBack();
    } catch (error) {
      showToast('উত্তোলন রিকোয়েস্ট ব্যর্থ হয়েছে। আবার চেষ্টা করুন।', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#21817d] font-sans">
      {/* Header */}
      <header className="bg-[#5abeb9] text-[#13615e] p-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-4 w-full relative">
          <button onClick={onBack} className="absolute left-0 p-1">
            <ChevronLeft size={28} />
          </button>
          <h1 className="text-xl font-bold w-full text-center">Withdraw</h1>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto pb-24 scrollbar-hide">
        {verificationStep ? (
          <section className="p-4 bg-[#21817d]">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-[#1d7470] rounded-xl p-4 border border-[#319b96]/30 space-y-6"
            >
              <div className="text-center space-y-2">
                <div className="w-16 h-16 bg-[#ffc107]/20 text-[#ffc107] rounded-xl flex items-center justify-center mx-auto">
                  <ShieldCheck size={32} strokeWidth={2} />
                </div>
                <h3 className="text-lg font-bold text-white">Security Verification</h3>
              </div>

              <div className="space-y-4">
                <div className="bg-[#21817d] p-4 rounded-xl flex items-center justify-between">
                  <div className="text-3xl font-bold tracking-[0.4em] text-white opacity-90">
                    {captchaCode}
                  </div>
                  <button 
                    onClick={generateCaptcha}
                    className="p-3 bg-[#1d7470] text-white rounded-lg shadow-sm hover:text-[#ffc107] transition-all"
                  >
                    <RefreshCw size={20} />
                  </button>
                </div>

                <div className="space-y-1">
                  <input 
                    type="text"
                    maxLength={4}
                    value={userCaptcha}
                    onChange={(e) => setUserCaptcha(e.target.value)}
                    className="w-full bg-[#21817d] rounded py-3 px-3 text-white text-center font-bold tracking-widest focus:outline-none placeholder:text-white/30"
                    placeholder="ENTER CAPTCHA"
                  />
                </div>

                <div className="flex gap-2">
                  <button 
                    onClick={() => setVerificationStep(false)}
                    className="flex-1 py-3 rounded text-white text-[13px] font-bold bg-[#b64b14] hover:bg-[#de5b1a]"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={confirmWithdraw}
                    disabled={userCaptcha.length !== 4 || isSubmitting}
                    className={`flex-1 flex justify-center py-3 rounded text-white text-[13px] font-bold transition-all ${
                      userCaptcha.length !== 4 || isSubmitting
                        ? 'bg-[#b64b14] text-white/50 cursor-not-allowed'
                        : 'bg-[#f5661d] hover:bg-[#de5b1a]'
                    }`}
                  >
                    {isSubmitting ? <Loader2 className="animate-spin" /> : 'Confirm'}
                  </button>
                </div>
              </div>
            </motion.div>
          </section>
        ) : (
          <section className="p-4 bg-[#21817d]">
            {/* Bank Card Section */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="mb-6 space-y-3"
            >
              <div className="flex justify-between items-center text-white">
                 <h3 className="font-bold">E-wallets</h3>
                 <span className="text-xs bg-[#1d7470] px-2 py-1 rounded">{bankCards.length} / 5 Linked</span>
              </div>
              
              <div>
                {bankCards.length > 0 ? (
                  <div className="space-y-4">
                     {bankCards.map((card: any, idx: number) => (
                       <motion.div 
                         key={card.id} 
                         initial={{ opacity: 0, scale: 0.9 }}
                         animate={{ opacity: 1, scale: 1 }}
                         transition={{ delay: idx * 0.1 }}
                         className="p-4 bg-[#1d7470] rounded-xl flex items-center justify-between text-white border border-[#319b96]/30"
                       >
                         <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-white rounded p-1 flex items-center justify-center">
                              <Building2 size={24} className="text-[#13615e]" />
                            </div>
                            <div>
                               <p className="font-bold text-sm">{card.bankName}</p>
                               <p className="text-xs text-white/70">{card.accountNumber}</p>
                            </div>
                         </div>
                         <div className="text-right">
                            <p className="text-green-400 font-bold text-xs uppercase">Verified</p>
                            <p className="text-xs text-white/70 mt-1">{card.accountHolderName}</p>
                         </div>
                       </motion.div>
                     ))}
                     {bankCards.length < 5 && (
                       <div 
                         onClick={onOpenBankCards}
                         className="p-4 bg-[#1d7470] rounded-xl border-2 border-dashed border-[#319b96]/50 flex flex-col items-center justify-center text-white/70 space-y-2 py-8 cursor-pointer hover:bg-[#165c59] transition-colors"
                       >
                         <Plus size={24} />
                         <p className="text-sm font-bold">Add New Bank Card</p>
                       </div>
                     )}
                  </div>
                ) : (
                  <div 
                    onClick={onOpenBankCards}
                    className="p-4 bg-[#1d7470] rounded-xl border-2 border-dashed border-[#319b96]/50 flex flex-col items-center justify-center text-white/70 space-y-2 py-8 cursor-pointer hover:bg-[#165c59] transition-colors"
                  >
                    <Plus size={24} />
                    <p className="text-sm font-bold">Add New Bank Card</p>
                  </div>
                )}
              </div>
            </motion.div>

          {/* Turnover Progress */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-4 bg-[#1d7470] rounded-xl border border-[#319b96]/30 mb-6 space-y-2"
          >
            <div className="flex justify-between items-end text-white text-sm">
                <p className="font-bold">Turnover Requirement</p>
                <p className="font-bold text-[#ffc107]">{turnoverProgress.toFixed(1)}%</p>
            </div>
            <div className="h-2.5 bg-[#21817d] rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${turnoverProgress}%` }}
                  transition={{ duration: 1, delay: 0.5 }}
                  className="h-full bg-[#ffc107]" 
                />
            </div>
            <div className="flex justify-between items-center text-xs text-white/70 pt-1">
                <p>৳ {turnover.toLocaleString()} / ৳ {requiredTurnover.toLocaleString()}</p>
                <button onClick={() => setIsTurnoverInfoModalOpen(true)} className="flex items-center gap-1 text-[#ffc107] hover:underline">
                  <Info size={12} /> Rules
                </button>
            </div>
          </motion.div>

          {/* Amount and Password Section */}
          <div className="space-y-4">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-[#1d7470] p-4 rounded-xl border border-[#319b96]/30"
              >
                <div className="flex items-center justify-between mb-3 text-white">
                  <h2 className="font-bold text-sm">Withdraw Amount</h2>
                  <button onClick={() => setAmount(balance.toString())} className="text-xs text-[#ffc107] font-bold">Set Max</button>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder={`৳ ${minWithdraw} ~ `}
                    className="w-full bg-[#21817d] rounded py-3 px-3 text-white font-bold focus:outline-none placeholder:text-white/30 pl-10"
                  />
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 font-bold">৳</div>
                </div>
                <div className="flex items-center gap-2 mt-3 mb-1 text-white/70">
                  <p className="text-xs">Balance: ৳ {balance.toLocaleString()}</p>
                  <button onClick={onRefresh} className={`hover:text-white transition-all ${isRefreshing ? 'animate-spin' : ''}`}>
                    <RefreshCw size={12} />
                  </button>
                </div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-[#1d7470] p-4 rounded-xl border border-[#319b96]/30"
              >
                <h2 className="text-white font-bold text-sm mb-3">Transaction Password</h2>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={transactionPassword}
                    onChange={(e) => setTransactionPassword(e.target.value)}
                    placeholder="Enter 6-digit PIN"
                    className="w-full bg-[#21817d] rounded py-3 px-3 text-white font-bold focus:outline-none placeholder:text-white/30 pl-10 pr-10"
                  />
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30">
                    <Lock size={18} />
                  </div>
                  <button onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white">
                    {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                  </button>
                </div>
              </motion.div>

              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                onClick={handleWithdraw}
                disabled={isSubmitting}
                className={`w-full py-4 rounded text-white font-bold text-center drop-shadow-sm transition-all flex justify-center items-center gap-2 ${
                  isSubmitting ? 'bg-[#b64b14] text-white/50 cursor-not-allowed' : 'bg-[#f5661d] hover:bg-[#de5b1a]'
                }`}
              >
                {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : 'Submit Withdraw'}
              </motion.button>
            </div>
          </section>
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
  onShareProgress?: () => void;
  setIsNotificationCenterOpen: (show: boolean) => void;
  unreadNotificationsCount: number;
  onEditProfilePic: () => void;
  profilePic: string | null;
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
  onBack,
  isAccountVerified,
  handleRequestOTP
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
  onBack: () => void,
  isAccountVerified: boolean,
  handleRequestOTP: () => void 
}) {
  const [isSortedAZ, setIsSortedAZ] = useState(false);

  const formatDate = (date: any) => {
    if (!date) return 'Not provided';
    if (date.toDate) return date.toDate().toLocaleDateString('en-GB');
    if (date.seconds) return new Date(date.seconds * 1000).toLocaleDateString('en-GB');
    if (typeof date === 'string') return new Date(date).toLocaleDateString('en-GB');
    return 'Not provided';
  };

  const userDetails = useMemo(() => {
    if (!userData) return [];
    
    const details = [
      { label: 'ইউজার নেম (Username)', value: userData.username, icon: User },
      { label: 'ফোন নম্বর (Phone)', value: userData.phoneNumber || userData.phone || 'Not provided', icon: Smartphone },
      { label: 'ইমেইল (Email)', value: userData.email || 'Not provided', icon: Mail },
      { label: 'নিবন্ধন তারিখ (Registration)', value: formatDate(userData.createdAt || userData.registrationDate), icon: Calendar },
      { label: 'ভিআইপি লেভেল (VIP Level)', value: `Level ${userData.vipLevel || 0}`, icon: Crown },
      { label: 'দেশ (Country)', value: userData.country || 'Not provided', icon: MapPin },
      { label: 'রোল (Role)', value: userData.role || 'user', icon: Shield },
    ];

    if (userData.facebookId) {
      details.push({ label: 'Facebook ID', value: userData.facebookId, icon: Facebook });
    }
    if (userData.googleId) {
      details.push({ label: 'Google ID', value: userData.googleId, icon: Mail });
    }

    if (isSortedAZ) {
      return details.sort((a, b) => a.label.localeCompare(b.label));
    }
    return details;
  }, [userData, isSortedAZ]);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-6 duration-700 bg-[#FBFBFB] min-h-screen pb-24 font-sans relative overflow-x-hidden">
      {/* Dynamic Background Elements */}
      <div className="absolute top-0 right-[-20%] w-96 h-96 bg-amber-100/30 rounded-full blur-[100px] -z-10 animate-float" />
      
      {/* Header */}
      <div className="backdrop-blur-xl bg-white/60 px-6 py-4 flex items-center sticky top-0 z-[60] border-b border-white/20">
        <button 
          onClick={onBack} 
          className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-gray-800 hover:scale-110 active:scale-95 transition-all"
        >
          <ChevronLeft size={24} />
        </button>
        <h1 className="flex-1 text-center font-serif text-2xl font-bold tracking-tight text-gray-900 mr-10">ব্যক্তিগত তথ্য</h1>
      </div>

      <div className="p-5 space-y-6">
        {/* Modern Profile Card */}
        <div className="bg-white rounded-[40px] p-8 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.06)] border border-white relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50 rounded-full blur-3xl -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-1000"></div>
          
          <div className="relative z-10 flex flex-col items-center">
            <div className="relative">
              <div className="w-32 h-32 rounded-[40px] p-1.5 bg-gradient-to-br from-yellow-400 via-amber-200 to-yellow-600 shadow-2xl active:scale-95 transition-transform overflow-hidden">
                <div className="w-full h-full rounded-[34px] bg-white overflow-hidden">
                  {profilePic ? (
                    <img src={profilePic} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-50 text-gray-300">
                      <User size={64} />
                    </div>
                  )}
                </div>
              </div>
              <button 
                onClick={onEditProfilePic}
                className="absolute -bottom-2 -right-2 bg-gray-900 p-3 rounded-2xl shadow-xl border-4 border-white hover:scale-110 active:scale-95 transition-all text-white"
              >
                <Camera size={18} />
              </button>
            </div>
            
            <div className="mt-6 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <h2 className="text-3xl font-serif font-black text-gray-900 tracking-tight leading-none">{userData?.username || 'Player'}</h2>
                {isAccountVerified && (
                  <div className="bg-blue-500 text-white p-1 rounded-full shadow-lg" title="Verified Account">
                    <ShieldCheck size={16} fill="white" />
                  </div>
                )}
              </div>
              <div className="flex items-center justify-center gap-3">
                <span className="px-4 py-1.5 bg-amber-50 text-amber-600 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] border border-amber-100 shadow-sm flex items-center gap-1.5">
                  <Trophy size={10} strokeWidth={3} /> VIP Level {userData?.vipLevel || 0}
                </span>
                <span className="px-4 py-1.5 bg-gray-50 text-gray-400 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] border border-gray-100">
                  ID: {userData?.numericId || userData?.id?.substring(0, 8) || '84729104'}
                </span>
              </div>
            </div>
            
            <button 
              onClick={onEditProfile}
              className="mt-8 w-full py-4 bg-gray-900 hover:bg-black text-white text-[10px] font-black rounded-2xl transition-all flex items-center justify-center gap-3 uppercase tracking-[0.2em] shadow-xl shadow-black/10 active:scale-95"
            >
              <Edit size={16} /> 
              তথ্য পরিবর্তন করুন
            </button>

            {/* Account Verification Card */}
            {!isAccountVerified && (
              <div className="mt-4 w-full bg-rose-50 border border-rose-100 rounded-3xl p-6 flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center">
                    <AlertCircle size={24} />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-rose-900 font-serif">অ্যাকাউন্ট ভেরিফাই নেই</h4>
                    <p className="text-[9px] font-bold text-rose-600 uppercase tracking-widest mt-0.5">OTP ভেরিফিকেশন করুন</p>
                  </div>
                </div>
                <button 
                  onClick={handleRequestOTP}
                  className="px-5 py-3 bg-rose-600 text-white rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-rose-700 transition-all shadow-lg shadow-rose-200 active:scale-95"
                >
                  ভেরিফাই করুন
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Social Accounts Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="font-serif text-lg font-black text-gray-900 italic tracking-tighter">লিঙ্ক অ্যাকাউন্টস</h3>
            <span className="text-[9px] text-amber-600 font-black uppercase tracking-[0.2em] bg-amber-50 px-3 py-1 rounded-full border border-amber-100">Social Accounts</span>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {/* Google Card */}
            <div className="bg-white p-5 rounded-[32px] border border-white shadow-sm flex items-center justify-between group">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center shadow-lg border border-gray-50 group-hover:scale-110 transition-transform">
                  <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" alt="Google" className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-sm font-black text-gray-800 font-serif">Google Account</p>
                  <p className={`text-[9px] font-black uppercase tracking-widest mt-0.5 ${isGoogleLinked ? 'text-emerald-500' : 'text-gray-300'}`}>
                    {isGoogleLinked ? 'Connected' : 'Not Connected'}
                  </p>
                </div>
              </div>
              <button 
                onClick={handleLinkGoogle}
                disabled={isLinkingGoogle}
                className={`px-5 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all active:scale-95 ${
                  isGoogleLinked 
                    ? 'text-rose-500 hover:bg-rose-50' 
                    : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                }`}
              >
                {isLinkingGoogle ? <RefreshCw size={14} className="animate-spin" /> : (isGoogleLinked ? 'Unlink' : 'Link')}
              </button>
            </div>

            {/* Facebook Card */}
            <div className="bg-white p-5 rounded-[32px] border border-white shadow-sm flex items-center justify-between group">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-[#1877F2] flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <Facebook size={26} className="text-white" />
                </div>
                <div>
                  <p className="text-sm font-black text-gray-800 font-serif">Facebook account</p>
                  <p className={`text-[9px] font-black uppercase tracking-widest mt-0.5 ${isFacebookLinked ? 'text-emerald-500' : 'text-gray-300'}`}>
                    {isFacebookLinked ? 'Connected' : 'Not Connected'}
                  </p>
                </div>
              </div>
              <button 
                onClick={handleLinkFacebook}
                disabled={isLinkingFacebook}
                className={`px-5 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all active:scale-95 ${
                  isFacebookLinked 
                    ? 'text-rose-500 hover:bg-rose-50' 
                    : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                }`}
              >
                {isLinkingFacebook ? <RefreshCw size={14} className="animate-spin" /> : (isFacebookLinked ? 'Unlink' : 'Link')}
              </button>
            </div>
          </div>
        </div>

        {/* Detail Matrix */}
        <div className="space-y-4 pb-12">
          <div className="flex items-center justify-between px-1">
            <h3 className="font-serif text-lg font-black text-gray-900 italic tracking-tighter">অ্যাকাউন্ট ডিটেইলস</h3>
            <button 
              onClick={() => setIsSortedAZ(!isSortedAZ)}
              className={`p-2 rounded-xl transition-all shadow-sm ${isSortedAZ ? 'bg-amber-100 text-amber-700' : 'bg-white text-gray-400 border border-gray-100'}`}
            >
              <ArrowDownUp size={16} />
            </button>
          </div>
          
          <div className="grid grid-cols-1 gap-2">
            {userDetails.map((detail, index) => (
              <div key={index} className="bg-white p-5 rounded-[28px] border border-white shadow-sm flex items-center justify-between group hover:shadow-md transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-300 group-hover:scale-110 group-hover:text-amber-500 transition-all duration-500">
                    <detail.icon size={22} strokeWidth={2} />
                  </div>
                  <div>
                    <p className="text-[9px] text-gray-400 uppercase tracking-widest font-black leading-none mb-1.5">{detail.label}</p>
                    <p className="text-sm text-gray-800 font-black tracking-tight">{detail.value}</p>
                  </div>
                </div>
                {(detail.label.includes('Username') || detail.label.includes('Phone') || detail.label.includes('Email')) ? (
                  <button onClick={onEditProfile} className="p-3 bg-gray-50 text-gray-400 rounded-2xl hover:bg-amber-50 hover:text-amber-600 transition-all active:scale-90">
                    <Edit size={14} />
                  </button>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function DepositHistoryTab({ userData, onBack }: { userData?: any, onBack: () => void }) {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userData?.id) {
       setIsLoading(false);
       return;
    }
    const q = query(
      collection(db, 'transactions'), 
      where('userId', '==', userData.id)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const trxs: any[] = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        let dateStr = 'Just now';
        let timestamp = 0;
        
        const createdAt = data.createdAt;
        if (createdAt) {
          if (typeof createdAt.toDate === 'function') {
            const date = createdAt.toDate();
            dateStr = date.toLocaleString();
            timestamp = date.getTime();
          } else {
            const date = new Date(createdAt);
            dateStr = date.toLocaleString();
            timestamp = date.getTime();
          }
        }

        if (data.type === 'deposit') {
          trxs.push({ 
            id: doc.id, 
            ...data,
            date: dateStr,
            _timestamp: timestamp
          });
        }
      });
      // Sort in descending order
      trxs.sort((a, b) => b._timestamp - a._timestamp);
      setTransactions(trxs);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [userData?.id]);

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

      <div className="space-y-4">
        {isLoading ? (
          <div className="flex justify-center p-8">
            <span className="text-teal-500 font-bold">লোড হচ্ছে...</span>
          </div>
        ) : transactions.length > 0 ? (
            transactions.map(trx => (
            <div key={trx.id} className="bg-teal-900/40 p-5 rounded-[28px] border border-teal-800/30 flex items-center justify-between group hover:border-teal-600/50 transition-all shadow-lg relative overflow-hidden">
              <div className="relative z-10">
                <p className="font-bold text-white text-sm">{trx.method}</p>
                <p className="text-[10px] text-teal-400 font-bold uppercase mt-1 opacity-80">{trx.date}</p>
              </div>
              <div className="text-right relative z-10">
                <p className="font-black text-green-400 text-lg italic tracking-tighter leading-none">+৳{trx.amount}</p>
                <div className={`mt-2 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest inline-flex items-center gap-1.5 ${
                  trx.status === 'completed' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 
                  trx.status === 'pending' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' : 
                  'bg-red-500/10 text-red-400 border border-red-500/20'
                }`}>
                  <div className={`w-1 h-1 rounded-full ${trx.status === 'completed' ? 'bg-green-500' : trx.status === 'pending' ? 'bg-orange-500' : 'bg-red-500'}`}></div>
                  {trx.status}
                </div>
              </div>
            </div>
            ))
        ) : (
          <div className="bg-teal-900/20 p-8 rounded-[32px] border border-teal-800/30 text-center shadow-inner">
            <ArrowDownLeft size={48} className="text-teal-700 mx-auto mb-4" />
            <p className="text-teal-400 text-sm font-bold">কোনো জমার রেকর্ড নেই</p>
          </div>
        )}
      </div>
    </div>
  );
}

function AccountRecordTab({ userData, onBack }: { userData?: any, onBack: () => void }) {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userData?.id) {
       setIsLoading(false);
       return;
    }
    const q = query(
      collection(db, 'transactions'), 
      where('userId', '==', userData.id)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const trxs: any[] = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        let dateStr = 'Just now';
        let timestamp = 0;
        
        const createdAt = data.createdAt;
        if (createdAt) {
          if (typeof createdAt.toDate === 'function') {
            const date = createdAt.toDate();
            dateStr = date.toLocaleString();
            timestamp = date.getTime();
          } else {
            const date = new Date(createdAt);
            dateStr = date.toLocaleString();
            timestamp = date.getTime();
          }
        }
        
        trxs.push({ 
          id: doc.id, 
          ...data,
          date: dateStr,
          _timestamp: timestamp
        });
      });
      // Sort in descending order
      trxs.sort((a, b) => b._timestamp - a._timestamp);
      setTransactions(trxs);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [userData?.id]);

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
      
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex justify-center p-8">
            <span className="text-teal-500 font-bold">লোড হচ্ছে...</span>
          </div>
        ) : transactions.length > 0 ? (
            transactions.map(trx => (
            <div key={trx.id} className="bg-teal-900/40 p-5 rounded-[28px] border border-teal-800/30 flex items-center justify-between group hover:border-teal-600/50 transition-all shadow-lg relative overflow-hidden">
              <div className="relative z-10">
                <p className="font-bold text-white text-sm">{String(trx.type).toUpperCase()} {trx.method ? `/ ${trx.method}` : ''}</p>
                <p className="text-[10px] text-teal-400 font-bold uppercase mt-1 opacity-80">{trx.date}</p>
              </div>
              <div className="text-right relative z-10">
                <p className={`font-black text-lg italic tracking-tighter leading-none ${trx.type === 'withdraw' ? 'text-red-400' : 'text-green-400'}`}>
                  {trx.type === 'withdraw' ? '-' : '+'}৳{Math.abs(trx.amount)}
                </p>
                <div className={`mt-2 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest inline-flex items-center gap-1.5 ${
                  trx.status === 'completed' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 
                  trx.status === 'pending' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' : 
                  'bg-red-500/10 text-red-400 border border-red-500/20'
                }`}>
                  <div className={`w-1 h-1 rounded-full ${trx.status === 'completed' ? 'bg-green-500' : trx.status === 'pending' ? 'bg-orange-500' : 'bg-red-500'}`}></div>
                  {trx.status}
                </div>
              </div>
            </div>
            ))
        ) : (
          <div className="bg-teal-900/20 p-8 rounded-[32px] border border-teal-800/30 text-center shadow-inner">
            <ClipboardList size={48} className="text-teal-700 mx-auto mb-4" />
            <p className="text-teal-400 text-sm font-bold">কোনো অ্যাকাউন্টের রেকর্ড নেই</p>
          </div>
        )}
      </div>
    </div>
  );
}

function ProfitLossTab({ totals, onBack }: { totals: any, onBack: () => void }) {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 bg-gray-50 min-h-screen p-4 pb-20 font-sans">
      <div className="bg-gradient-to-br from-[#f5e6ba] via-[#eee0be] to-[#d4c291] rounded-[40px] p-8 shadow-lg relative overflow-hidden group border border-[#e5d5ac]">
        <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12 group-hover:rotate-0 transition-transform duration-700">
          <BarChart3 size={120} className="text-[#8c7841]" />
        </div>
        <div className="relative z-10 flex justify-between items-start">
          <div>
            <div className="w-16 h-16 rounded-2xl bg-[#333] flex items-center justify-center text-yellow-500 mb-4 shadow-xl">
              <BarChart3 size={32} />
            </div>
            <h2 className="text-2xl font-black text-[#333] italic uppercase tracking-tight">লাভ ও ক্ষতি</h2>
            <p className="text-[#8c7841] text-[10px] font-black uppercase tracking-widest mt-2">Profit & Loss Report</p>
          </div>
          <button 
            onClick={onBack}
            className="w-10 h-10 rounded-2xl bg-white/40 flex items-center justify-center text-[#333] hover:bg-white transition-all border border-black/5"
          >
            <X size={20} />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm">
          <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">মোট লাভ (Deposit)</p>
          <p className="text-2xl font-black text-green-600 italic">৳ {totals.deposit.toLocaleString()}</p>
        </div>
        <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm">
          <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">মোট লস (Withdraw)</p>
          <p className="text-2xl font-black text-red-500 italic">৳ {totals.withdraw.toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
}

function MailTab({ onBack }: { onBack: () => void }) {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 bg-gray-50 min-h-screen p-4 pb-20 font-sans">
      <div className="bg-gradient-to-br from-[#f5e6ba] via-[#eee0be] to-[#d4c291] rounded-[40px] p-8 shadow-lg relative overflow-hidden group border border-[#e5d5ac]">
        <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12 group-hover:rotate-0 transition-transform duration-700">
          <Mail size={120} className="text-[#8c7841]" />
        </div>
        <div className="relative z-10 flex justify-between items-start">
          <div>
            <div className="w-16 h-16 rounded-2xl bg-[#333] flex items-center justify-center text-yellow-500 mb-4 shadow-xl">
              <Mail size={32} />
            </div>
            <h2 className="text-2xl font-black text-[#333] italic uppercase tracking-tight">ইনবক্স</h2>
            <p className="text-[#8c7841] text-[10px] font-black uppercase tracking-widest mt-2">Mail & Notifications</p>
          </div>
          <button 
            onClick={onBack}
            className="w-10 h-10 rounded-2xl bg-white/40 flex items-center justify-center text-[#333] hover:bg-white transition-all border border-black/5"
          >
            <X size={20} />
          </button>
        </div>
      </div>
      <div className="text-center py-20 bg-white rounded-[40px] border border-gray-100 shadow-sm">
        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <Mail size={40} className="text-gray-200" />
        </div>
        <h3 className="text-gray-800 font-bold">কোনো মেইল নেই</h3>
        <p className="text-gray-400 text-sm">আপনার ইনবক্স এখন খালি।</p>
      </div>
    </div>
  );
}

function FeedbackTab({ showToast, onBack }: { showToast: (msg: string) => void, onBack: () => void }) {
  const [feedback, setFeedback] = useState('');
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 bg-gray-50 min-h-screen p-4 pb-20 font-sans">
      <div className="bg-gradient-to-br from-[#f5e6ba] via-[#eee0be] to-[#d4c291] rounded-[40px] p-8 shadow-lg relative overflow-hidden group border border-[#e5d5ac]">
        <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12 group-hover:rotate-0 transition-transform duration-700">
          <MessageSquare size={120} className="text-[#8c7841]" />
        </div>
        <div className="relative z-10 flex justify-between items-start">
          <div>
            <div className="w-16 h-16 rounded-2xl bg-[#333] flex items-center justify-center text-yellow-500 mb-4 shadow-xl">
              <MessageSquare size={32} />
            </div>
            <h2 className="text-2xl font-black text-[#333] italic uppercase tracking-tight">মতামত</h2>
            <p className="text-[#8c7841] text-[10px] font-black uppercase tracking-widest mt-2">Feedback & Suggestions</p>
          </div>
          <button 
            onClick={onBack}
            className="w-10 h-10 rounded-2xl bg-white/40 flex items-center justify-center text-[#333] hover:bg-white transition-all border border-black/5"
          >
            <X size={20} />
          </button>
        </div>
      </div>
      <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm space-y-4">
        <textarea 
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="আপনার পরামর্শ এখানে লিখুন..."
          className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 text-gray-700 min-h-[150px] focus:outline-none focus:border-yellow-500 font-bold"
        />
        <button 
          onClick={() => {
            showToast('আপনার পরামর্শ সফলভাবে পাঠানো হয়েছে');
            setFeedback('');
            onBack();
          }}
          className="w-full bg-[#333] text-white font-black py-4 rounded-2xl hover:bg-black transition-all active:scale-95 uppercase tracking-widest text-xs shadow-lg"
        >
          জমা দিন
        </button>
      </div>
    </div>
  );
}

function HelpCenterTab({ onBack }: { onBack: () => void }) {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 bg-gray-50 min-h-screen p-4 pb-20 font-sans">
      <div className="bg-gradient-to-br from-[#f5e6ba] via-[#eee0be] to-[#d4c291] rounded-[40px] p-8 shadow-lg relative overflow-hidden group border border-[#e5d5ac]">
        <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12 group-hover:rotate-0 transition-transform duration-700">
          <HelpCircle size={120} className="text-[#8c7841]" />
        </div>
        <div className="relative z-10 flex justify-between items-start">
          <div>
            <div className="w-16 h-16 rounded-2xl bg-[#333] flex items-center justify-center text-yellow-500 mb-4 shadow-xl">
              <HelpCircle size={32} />
            </div>
            <h2 className="text-2xl font-black text-[#333] italic uppercase tracking-tight">সহায়তা কেন্দ্র</h2>
            <p className="text-[#8c7841] text-[10px] font-black uppercase tracking-widest mt-2">Help & Support Center</p>
          </div>
          <button 
            onClick={onBack}
            className="w-10 h-10 rounded-2xl bg-white/40 flex items-center justify-center text-[#333] hover:bg-white transition-all border border-black/5"
          >
            <X size={20} />
          </button>
        </div>
      </div>
      <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm space-y-4">
        {[
          { q: 'কিভাবে ডিপোজিট করব?', a: 'ডিপোজিট করতে "জমা দিন" বাটনে ক্লিক করুন এবং আপনার পছন্দের মাধ্যম নির্বাচন করুন।' },
          { q: 'উত্তোলন করতে কত সময় লাগে?', a: 'সাধারণত ১০-৩০ মিনিটের মধ্যে উত্তোলন সফল হয়।' },
          { q: 'পাসওয়ার্ড ভুলে গেলে কি করব?', a: 'পাসওয়ার্ড রিসেট করতে কাস্টমার সার্ভিসের সাথে যোগাযোগ করুন।' }
        ].map((item, i) => (
          <div key={i} className="p-4 rounded-3xl bg-gray-50 border border-gray-100">
            <h4 className="font-bold text-gray-800 text-sm mb-1">{item.q}</h4>
            <p className="text-gray-500 text-[11px] leading-relaxed font-medium">{item.a}</p>
          </div>
        ))}
        <button 
          onClick={() => (window as any).LC_API?.open_chat_window()}
          className="w-full bg-[#333] text-white font-black py-4 rounded-2xl shadow-lg hover:bg-black transition-all active:scale-95 uppercase tracking-widest text-xs"
        >
          লাইভ চ্যাট (Live Chat Support)
        </button>
      </div>
    </div>
  );
}

function OverviewTab(props: OverviewTabProps) {
  const { 
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
    onShareProgress,
    setIsNotificationCenterOpen,
    unreadNotificationsCount,
    onEditProfilePic,
    profilePic
  } = props;


  const [showNotification, setShowNotification] = useState(false);

  const vipLevel = getVIPLevel(userData?.totalRecharge || 0);
  const recharge = userData?.totalRecharge || 0;
  const nextVIP = VIP_LEVELS[vipLevel.level + 1] || VIP_LEVELS[vipLevel.level];
  const req = nextVIP?.minTurnover || 1000;
  const vipProgress = Math.min(100, (recharge / req) * 100);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast("কপি করা হয়েছে!", "success");
  };

  const menuRows: { title: string; subtitle?: string; icon: any; action: () => void; color: string; badge?: string }[] = [
    { title: 'আমার রেকর্ড', subtitle: 'বিস্তারিত, বাজি, রিপোর্ট, ব্যালেন্স পুনরুদ্ধার', icon: ClipboardCheck, action: () => onSubTabChange('account-record'), color: 'text-yellow-500', badge: '' },
    { title: 'প্রত্যাহার ব্যবস্থাপনা', icon: CreditCard, action: onOpenBankCards, color: 'text-red-500', badge: '' },
  ];

  const mainList: { title: string; subtitle?: string; icon: any; action: () => void; color: string; badge?: string }[] = [
    { title: 'প্রচার', subtitle: 'শেয়ার করুন~ কমিশন পান', icon: Megaphone, action: () => onSubTabChange('invite'), color: 'text-teal-500' },
    { title: 'সাপোর্ট (Support)', icon: Headset, action: () => setIsChatOpen?.(true), color: 'text-teal-500' },
    { title: 'প্রোফাইল', icon: UserCircle, action: () => onSubTabChange('profile'), color: 'text-teal-500' },
    { title: 'নিরাপত্তা কেন্দ্র', icon: ShieldCheck, action: () => onSubTabChange('security'), color: 'text-teal-500' },
    { title: 'ভাষা (Language)', subtitle: 'বাংলা', icon: Globe, action: () => {}, color: 'text-teal-500' },
    { title: 'FAQ', icon: HelpCircle, action: () => onSubTabChange('faq'), color: 'text-teal-500' },
    { title: 'মতামত (Feedback)', icon: MessageSquare, action: () => onSubTabChange('feedback'), color: 'text-teal-500' },
    { title: 'ডিভাইস হিস্টরি', icon: Smartphone, action: () => {}, color: 'text-teal-500' },
    { title: 'প্রস্থান (Logout)', icon: LogOut, action: onLogout, color: 'text-teal-500' },
  ];

  return (
    <div className="bg-[#0b5c4b] min-h-screen flex flex-col font-sans">
      {/* 1. Top Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative pt-6 pb-16 px-4 overflow-hidden"
      >
        {/* Abstract Background Patterns */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-10">
          <svg className="w-full h-full" viewBox="0 0 400 400" preserveAspectRatio="none">
             <path d="M0,100 C150,200 350,0 400,100 L400,400 L0,400 Z" fill="currentColor" className="text-teal-200" />
          </svg>
        </div>

        {/* Top Icons */}
        <div className="flex justify-between items-center mb-6 relative z-10">
          <button onClick={() => onTabChange('home')} className="text-white">
            <ChevronLeft size={28} />
          </button>
          <div className="flex items-center gap-4">
             <button onClick={onShareProgress} className="text-white relative" title="Share Profile">
               <Share2 size={24} />
             </button>
             <button onClick={() => setIsChatOpen(true)} className="text-white relative">
               <Headset size={28} />
             </button>
             <button onClick={() => setIsNotificationCenterOpen?.(true)} className="text-white relative">
               <MessageCircle size={28} />
               {unreadNotificationsCount > 0 && (
                 <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-[#0b5c4b] animate-pulse">
                   {unreadNotificationsCount > 99 ? '99+' : unreadNotificationsCount}
                 </span>
               )}
             </button>
          </div>
        </div>

        {/* Profile Info Row */}
        <div className="flex items-center gap-3 relative z-10">
          <motion.div 
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className="relative"
          >
             <div className="w-16 h-16 rounded-full border-2 border-white overflow-hidden bg-white">
               {profilePic ? (
                 <img 
                   src={profilePic} 
                   className="w-full h-full object-cover" 
                   alt="User"
                   referrerPolicy="no-referrer"
                 />
               ) : (
                 <div className="w-full h-full flex items-center justify-center bg-teal-800/40 text-white/50">
                   <User size={32} />
                 </div>
               )}
             </div>
             <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-md cursor-pointer" onClick={onEditProfilePic}>
               <Camera size={14} className="text-teal-700" />
             </div>
             <div className="absolute top-0 left-0 w-3 h-3 bg-red-500 rounded-full border-2 border-[#0b5c4b]" />
          </motion.div>
          
          <div className="flex-1">
             <div className="flex items-center gap-1 text-white">
               <ChevronDown size={14} />
               <span className="font-bold text-lg">{userData?.username || 'user'}</span>
               <button onClick={() => copyToClipboard(userData?.username || '')} className="ml-1">
                 <Copy size={14} className="opacity-80" />
               </button>
             </div>
             <div className="flex items-center gap-2 mt-1">
                <span className="text-teal-100 text-sm font-medium">ID : {userData?.id?.substring(0, 9) || '123456789'}</span>
                <button onClick={() => copyToClipboard(userData?.id || '')}>
                   <Copy size={12} className="text-teal-200" />
                </button>
             </div>
          </div>

          <motion.div 
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="flex items-center gap-2 bg-teal-900/40 px-3 py-2 rounded-full border border-teal-700/30"
          >
             <div className="w-6 h-6 rounded-full bg-red-600 flex items-center justify-center border border-white/20">
                <span className="text-[10px] text-white font-bold">BD</span>
             </div>
             <span className="text-white font-bold text-lg">{balance.toFixed(2)}</span>
             <RefreshCw size={18} className={`text-white transition-transform duration-700 cursor-pointer ${isRefreshing ? 'animate-spin' : ''}`} onClick={onRefresh} />
          </motion.div>
        </div>

        {/* Quick Actions (Dashboard level) Staggered */}
        <div className="grid grid-cols-3 gap-4 mt-8 relative z-10 px-2">
           {[
             { label: 'উত্তোলন', icon: Wallet, action: () => onSubTabChange('withdraw') },
             { label: 'জমা', icon: CreditCard, action: () => onTabChange('deposit'), badge: '+5%' },
             { label: 'কুপন', icon: Percent, action: () => onSubTabChange('reward-center') }
           ].map((item, i) => (
             <motion.button 
               key={i}
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.1 + i * 0.1 }}
               onClick={item.action} 
               className="flex flex-col items-center gap-2 group"
             >
                <div className="w-14 h-14 bg-teal-800/40 rounded-2xl flex items-center justify-center text-white border border-teal-700/30 group-hover:bg-teal-700/50 transition-all">
                   <item.icon size={32} />
                </div>
                <span className="text-white text-xs font-medium">{item.label}</span>
                {item.badge && <div className="absolute top-0 right-0 bg-green-500 text-white text-[8px] px-1.5 py-0.5 rounded-full font-bold">{item.badge}</div>}
             </motion.button>
           ))}
        </div>
      </motion.div>

      {/* 2. Main Content Area */}
      <motion.div 
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", damping: 20, stiffness: 100 }}
        className="bg-[#0d7c66] flex-1 rounded-t-[40px] px-4 pt-12 -mt-8 relative shadow-2xl"
      >
        
        {/* VIP Card Wrapper (Floating half-in/half-out) */}
        <div className="absolute top-0 left-4 right-4 -translate-y-1/2">
           <motion.div 
             initial={{ scale: 0.9, opacity: 0 }}
             animate={{ scale: 1, opacity: 1 }}
             transition={{ delay: 0.3 }}
             className="bg-white rounded-3xl p-5 shadow-xl flex items-center gap-4 border border-teal-50"
           >
              {/* Left: VIP Badge */}
              <div className="flex flex-col items-center">
                 <div className="w-16 h-16 rounded-full border-[3px] border-[#c09628] flex items-center justify-center p-1 relative">
                    <div className="w-full h-full rounded-full bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center text-white font-bold text-2xl shadow-inner">{userData?.vipLevel || 0}</div>
                    {/* Laurel Wreath Mock */}
                    <div className="absolute -bottom-2 w-full flex justify-center">
                       <Sparkles size={14} className="text-[#c09628]" />
                    </div>
                 </div>
                 <span className="text-[#c09628] font-black text-xl italic mt-1">V{userData?.vipLevel || 0}</span>
              </div>

              {/* Middle: Progress bars */}
              <div className="flex-1 space-y-3">
                 <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-teal-600 uppercase">বর্তমানে {userData?.vipLevel || 0} লেভেল এ আছেন</span>
                 </div>
                 <div className="space-y-2">
                    <div className="relative h-6 bg-gray-100 rounded-full overflow-hidden border border-gray-200">
                       <motion.div 
                         initial={{ width: 0 }}
                         animate={{ width: `${Math.min(100, (userData?.totalRecharge || 0) / 1000 * 100)}%` }}
                         transition={{ duration: 1, delay: 0.5 }}
                         className="h-full bg-green-500" 
                       />
                       <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-white px-2">রিচার্জ: {userData?.totalRecharge || 0}/1000</span>
                    </div>
                    <div className="relative h-6 bg-gray-100 rounded-full overflow-hidden border border-gray-200">
                       <motion.div 
                         initial={{ width: 0 }}
                         animate={{ width: `${Math.min(100, (userData?.totalTurnover || 0) / 5000 * 100)}%` }}
                         transition={{ duration: 1, delay: 0.7 }}
                         className="h-full bg-green-500" 
                       />
                       <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-white px-2">টার্নওভার: {userData?.totalTurnover || 0}/5000</span>
                    </div>
                 </div>
              </div>

              <div className="flex flex-col gap-1 text-[9px] font-bold text-gray-400">
                 <div className="flex items-center gap-1">
                    <span>আমানত {userData?.totalRecharge || 0}</span>
                 </div>
                 <div className="flex items-center gap-1">
                    <span>বাজি {userData?.totalTurnover || 0}</span>
                 </div>
                 <ChevronRight size={20} className="text-gray-300 self-end mt-2" />
              </div>
           </motion.div>
        </div>

        {/* Menu Items */}
        <div className="mt-8 space-y-4 pb-12">
           {/* Section 1 */}
           <motion.div 
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             transition={{ delay: 0.4 }}
             className="bg-[#0b5c4b]/30 rounded-[24px] overflow-hidden"
           >
              {menuRows.map((item, idx) => (
                <button 
                  key={idx} 
                  onClick={item.action} 
                  className={`w-full flex items-center gap-4 p-5 hover:bg-white/5 transition-all text-white border-b border-white/5 last:border-0`}
                >
                  <div className={`p-2 rounded-xl bg-white/10 ${item.color}`}>
                     <item.icon size={28} />
                  </div>
                  <div className="flex-1 text-left">
                     <p className="font-bold text-sm tracking-tight">{item.title}</p>
                     {item.subtitle && <p className="text-[10px] text-teal-200 opacity-60 leading-tight mt-0.5">{item.subtitle}</p>}
                  </div>
                  <ChevronRight size={20} className="text-white/20" />
                </button>
              ))}
           </motion.div>

           {/* Section 2 (List format like image) */}
           <div className="space-y-1">
              {mainList.map((item, idx) => (
                <motion.button 
                  key={idx} 
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.05 }}
                  onClick={item.action} 
                  className="w-full flex items-center gap-4 p-5 hover:bg-white/5 transition-all text-white"
                >
                  <div className="text-white/80">
                     <item.icon size={28} strokeWidth={1.5} />
                  </div>
                  <div className="flex-1 text-left flex items-center justify-between">
                     <p className="font-bold text-sm tracking-tight">{item.title}</p>
                     <div className="flex items-center gap-2">
                        {item.subtitle && <span className="text-[11px] text-white/40">{item.subtitle}</span>}
                        {item.badge && (
                           <div className="flex items-center gap-1 bg-green-500 px-2 py-0.5 rounded-full">
                              <Gift size={12} className="text-white" />
                              <span className="text-[10px] font-black text-white">{item.badge}</span>
                           </div>
                        )}
                        <ChevronRight size={20} className="text-white/20" />
                     </div>
                  </div>
                </motion.button>
              ))}
           </div>
        </div>
      </motion.div>
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
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory scroll-smooth">
          <div className="relative flex-1 min-w-[130px] snap-start">
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
          
          <div className="relative flex-1 min-w-[140px] snap-start">
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

function HistoryTab({ userData, onBack }: { userData?: any, onBack: () => void }) {
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('date_desc');
  const [dateRange, setDateRange] = useState('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [selectedTrx, setSelectedTrx] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userData?.id) {
       setIsLoading(false);
       return;
    }
    const q = query(
      collection(db, 'transactions'), 
      where('userId', '==', userData.id)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const trxs: any[] = [];
      snapshot.forEach(doc => {
        trxs.push({ id: doc.id, ...doc.data() });
      });
      setTransactions(trxs);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [userData?.id]);

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
      const getTrxDate = (trx: any) => {
        if (trx.createdAt?.seconds) return trx.createdAt.seconds * 1000;
        if (trx.createdAt?.toDate) return trx.createdAt.toDate().getTime();
        return new Date(trx.date || trx.createdAt || 0).getTime();
      };

      if (sortBy === 'date_desc') {
        return getTrxDate(b) - getTrxDate(a);
      } else if (sortBy === 'date_asc') {
        return getTrxDate(a) - getTrxDate(b);
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
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 bg-gray-50 min-h-screen p-4 pb-20 font-sans">
      {/* History Header */}
      <div className="bg-gradient-to-br from-[#f5e6ba] via-[#eee0be] to-[#d4c291] rounded-[40px] p-8 shadow-lg relative overflow-hidden group border border-[#e5d5ac]">
        <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12 group-hover:rotate-0 transition-transform duration-700">
          <HistoryIcon size={120} className="text-[#8c7841]" />
        </div>
        <div className="relative z-10 flex justify-between items-start">
          <div>
            <div className="w-16 h-16 rounded-2xl bg-[#333] flex items-center justify-center text-yellow-500 mb-4 shadow-xl">
              <HistoryIcon size={32} />
            </div>
            <h2 className="text-2xl font-black text-[#333] italic uppercase tracking-tight">লেনদেন ইতিহাস</h2>
            <p className="text-[#8c7841] text-[10px] font-black uppercase tracking-widest mt-2">Transaction History & Records</p>
          </div>
          <button 
            onClick={onBack}
            className="w-10 h-10 rounded-2xl bg-white/40 flex items-center justify-center text-[#333] hover:bg-white transition-all border border-black/5"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-white rounded-[32px] p-6 border border-gray-100 shadow-sm space-y-4">
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory scroll-smooth">
          <div className="relative min-w-[140px] snap-start">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-yellow-600">
              <Filter size={16} />
            </div>
            <select 
              value={filterType} 
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full bg-gray-50 border border-gray-100 text-gray-700 text-xs rounded-2xl pl-11 pr-4 py-4 appearance-none focus:outline-none focus:border-yellow-500 transition-all font-bold"
            >
              <option value="all">সব ধরন</option>
              <option value="deposit">জমা (Deposit)</option>
              <option value="withdraw">উত্তোলন (Withdraw)</option>
              <option value="bonus">বোনাস (Bonus)</option>
              <option value="bet">বাজি (Bet)</option>
            </select>
          </div>
          
          <div className="relative min-w-[160px] snap-start">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-yellow-600">
              <ArrowDownUp size={16} />
            </div>
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full bg-gray-50 border border-gray-100 text-gray-700 text-xs rounded-2xl pl-11 pr-4 py-4 appearance-none focus:outline-none focus:border-yellow-500 transition-all font-bold"
            >
              <option value="date_desc">নতুন থেকে পুরানো</option>
              <option value="date_asc">পুরানো থেকে নতুন</option>
              <option value="amount_desc">অ্যামাউন্ট (বেশি)</option>
              <option value="amount_asc">অ্যামাউন্ট (কম)</option>
            </select>
          </div>

          <div className="relative min-w-[160px]">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-yellow-600">
              <Calendar size={16} />
            </div>
            <select 
              value={dateRange} 
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full bg-gray-50 border border-gray-100 text-gray-700 text-xs rounded-2xl pl-11 pr-4 py-4 appearance-none focus:outline-none focus:border-yellow-500 transition-all font-bold"
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
              <label className="text-[10px] text-gray-400 uppercase tracking-widest font-black ml-2">শুরুর তারিখ</label>
              <input 
                type="date" 
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="w-full bg-gray-50 border border-gray-100 text-gray-700 text-xs rounded-2xl px-4 py-3 focus:outline-none focus:border-yellow-500 font-bold"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] text-gray-400 uppercase tracking-widest font-black ml-2">শেষ তারিখ</label>
              <input 
                type="date" 
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="w-full bg-gray-50 border border-gray-100 text-gray-700 text-xs rounded-2xl px-4 py-3 focus:outline-none focus:border-yellow-500 font-bold"
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
        <div className="space-y-3">
          {filteredAndSortedTransactions.map((trx: any, idx: number) => (
            <motion.div 
              key={trx.id} 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              onClick={() => setSelectedTrx(trx)} 
              className="bg-[var(--bg-card)] rounded-xl p-3 border border-[var(--border-color)] flex items-center justify-between cursor-pointer hover:bg-black/5 transition-colors"
            >
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
                      <Clock size={10} /> {
                        trx.createdAt?.toDate ? trx.createdAt.toDate().toLocaleString() :
                        trx.createdAt?.seconds ? new Date(trx.createdAt.seconds * 1000).toLocaleString() :
                        trx.date || 'N/A'
                      }
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
            </motion.div>
          ))}
        </div>
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

function WithdrawalHistoryTab({ userData, onBack }: { userData?: any, onBack: () => void }) {
  const [sortBy, setSortBy] = useState('date_desc');
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTrx, setSelectedTrx] = useState<any>(null);

  useEffect(() => {
    if (!userData?.id) {
       setIsLoading(false);
       return;
    }
    const q = query(
      collection(db, 'transactions'), 
      where('userId', '==', userData.id)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const trxs: any[] = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        let dateStr = 'Just now';
        let timestamp = 0;
        
        const createdAt = data.createdAt;
        if (createdAt) {
          if (typeof createdAt.toDate === 'function') {
            const date = createdAt.toDate();
            dateStr = date.toLocaleString();
            timestamp = date.getTime();
          } else {
            const date = new Date(createdAt);
            dateStr = date.toLocaleString();
            timestamp = date.getTime();
          }
        }

        if (data.type === 'withdraw') {
          trxs.push({ 
            id: doc.id, 
            ...data,
            date: dateStr,
            _timestamp: timestamp
          });
        }
      });
      setTransactions(trxs);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [userData?.id]);

  const filteredAndSortedTransactions = useMemo(() => {
    if (!transactions) return [];
    
    let result = [...transactions];
    
    result.sort((a, b) => {
      const timeA = a._timestamp || 0;
      const timeB = b._timestamp || 0;
      
      if (sortBy === 'date_desc') {
        return timeB - timeA;
      } else if (sortBy === 'date_asc') {
        return timeA - timeB;
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
          {filteredAndSortedTransactions.map((trx, idx) => (
            <motion.div 
              key={trx.id} 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
              onClick={() => setSelectedTrx(trx)}
              className="bg-gradient-to-r from-teal-900/40 to-teal-950/40 p-5 rounded-[28px] border border-teal-800/30 flex items-center justify-between group hover:border-teal-600/50 transition-all shadow-lg relative overflow-hidden cursor-pointer active:scale-[0.98]"
            >
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
            </motion.div>
          ))}
        </div>
      )}

      {/* Detail Modal for Withdrawal */}
      {selectedTrx && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setSelectedTrx(null)}>
          <div className="bg-[#0b5c4b] rounded-[40px] w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 font-sans border border-teal-700/30" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-teal-800/30 flex items-center justify-between bg-teal-900/40">
              <h3 className="font-black text-white italic uppercase tracking-tighter flex items-center gap-2">
                <FileSearch size={22} className="text-orange-400" /> উত্তোলন বিস্তারিত
              </h3>
              <button 
                onClick={() => setSelectedTrx(null)}
                className="text-teal-400 hover:text-red-400 p-2 hover:bg-red-500/10 rounded-xl transition-all"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="p-8 space-y-6">
               <div className="flex flex-col items-center gap-2 pb-6 border-b border-teal-800/20">
                  <div className="w-20 h-20 bg-orange-500/10 rounded-3xl flex items-center justify-center text-orange-400 mb-2 shadow-inner border border-orange-500/10">
                     <ArrowUpRight size={40} />
                  </div>
                  <p className="text-3xl font-black text-white italic tracking-tighter leading-none">-৳{Math.abs(selectedTrx.amount).toLocaleString()}</p>
                  <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 mt-2 ${
                    selectedTrx.status === 'completed' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                    selectedTrx.status === 'pending' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' :
                    'bg-red-500/10 text-red-400 border border-red-500/20'
                  }`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${selectedTrx.status === 'completed' ? 'bg-green-500' : selectedTrx.status === 'pending' ? 'bg-orange-500' : 'bg-red-500'} animate-pulse`}></div>
                    {selectedTrx.status}
                  </div>
               </div>

               <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-teal-400 uppercase tracking-widest">Withdrawal ID</span>
                    <span className="text-xs font-mono font-bold text-white">{selectedTrx.trxId}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-teal-400 uppercase tracking-widest">পদ্ধতি (Method)</span>
                    <span className="text-xs font-black text-white uppercase">{selectedTrx.method}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-teal-400 uppercase tracking-widest">তারিখ (Date)</span>
                    <span className="text-xs font-black text-teal-100">{selectedTrx.date}</span>
                  </div>
                  {selectedTrx.accountNumber && (
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-teal-400 uppercase tracking-widest">অ্যাকাউন্ট (Account)</span>
                      <span className="text-xs font-mono font-bold text-white">{selectedTrx.accountNumber}</span>
                    </div>
                  )}
               </div>

               <div className="p-4 bg-teal-900/40 rounded-2xl border border-teal-800/30 italic">
                  <p className="text-[10px] text-teal-400 font-bold text-center leading-relaxed">
                    * আপনার উত্তোলনটি প্রক্রিয়াকরণাধীন আছে। ভেরিফিকেশন সম্পন্ন হলে আপনার অ্যাকাউন্টে টাকা পৌঁছে যাবে।
                  </p>
               </div>
            </div>
            
            <div className="p-6">
              <button 
                onClick={() => setSelectedTrx(null)}
                className="w-full bg-teal-700 hover:bg-teal-600 text-white font-black py-4 rounded-2xl transition-all shadow-xl shadow-black/20 uppercase tracking-widest text-[11px] active:scale-95"
              >
                বন্ধ করুন (Close)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SettingsTab({ 
  profileData, 
  onLogout, 
  onEditProfile, 
  showToast, 
  hideAccountDetails, 
  onOpenBankCards, 
  onBack,
  onUpdateUser,
  isGoogleLinked,
  isFacebookLinked,
  handleLinkGoogle,
  handleLinkFacebook,
  isLinkingGoogle,
  isLinkingFacebook
}: { 
  profileData: any, 
  onLogout: () => void, 
  onEditProfile: () => void, 
  showToast: (msg: string, type?: ToastType) => void, 
  hideAccountDetails?: boolean, 
  onOpenBankCards?: () => void, 
  onBack: () => void,
  onUpdateUser?: (updates: any) => Promise<void>,
  isGoogleLinked: boolean,
  isFacebookLinked: boolean,
  handleLinkGoogle: () => Promise<void>,
  handleLinkFacebook: () => Promise<void>,
  isLinkingGoogle: boolean,
  isLinkingFacebook: boolean
}) {
  const [showPassword, setShowPassword] = useState(false);
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [twoFAMethod, setTwoFAMethod] = useState<'app' | 'sms'>('app');
  const [language, setLanguage] = useState<'bn' | 'en'>('bn');
  const [linkingError, setLinkingError] = useState<string | null>(null);
  const [isFullyVerified, setIsFullyVerified] = useState(false);
  const [idStatus, setIdStatus] = useState<'pending' | 'verified' | 'rejected'>('pending');
  const [selfieStatus, setSelfieStatus] = useState<'pending' | 'verified' | 'rejected'>('pending');
  const idInputRef = React.useRef<HTMLInputElement>(null);
  const selfieInputRef = React.useRef<HTMLInputElement>(null);

  const handleIdUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    // implementation
  };
  const handleSelfieUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    // implementation
  };
  const handleFinish2FASetup = async () => {
    // implementation
  };
  const handleUpdateEmail = async () => {
    // implementation
  };
  const handleUpdateTrxPassword = async () => {
    // implementation
  };
  const handleChangePassword = async () => {
    // implementation
  };
  const handleForgotPassword = async () => {
    // implementation
  };
  const handleDisable2FA = async () => {
    // implementation
  };
  
  const toggleLanguage = () => {
    setLanguage(prev => prev === 'bn' ? 'en' : 'bn');
  };
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
    if (onUpdateUser) {
      await onUpdateUser({ country: countryName });
    }
  };

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isTrxPasswordModalOpen, setIsTrxPasswordModalOpen] = useState(false);
  const [trxPassword, setTrxPassword] = useState("");
  const [confirmTrxPassword, setConfirmTrxPassword] = useState("");
  const [isUpdatingTrxPassword, setIsUpdatingTrxPassword] = useState(false);
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
  const [isConfirmingLogout, setIsConfirmingLogout] = useState(false);
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
        setSetupError("ভুল কোড। অনুগ্রহ করে আবার চেষ্টা করুন।");
      }
    } catch (error) {
      setSetupError("যাচাই করতে সমস্যা হয়েছে।");
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Security Center Section */}
      <div className="bg-teal-900/40 rounded-[36px] border border-teal-700/50 overflow-hidden shadow-xl">
        <div className="p-6 border-b border-teal-800/50 flex items-center justify-between bg-black/20">
          <h3 className="font-black text-white italic flex items-center gap-3 text-sm uppercase tracking-wider">
            <ShieldCheck size={22} className="text-yellow-500" /> নিরাপত্তা কেন্দ্র (Security Center)
          </h3>
        </div>
        <div className="divide-y divide-teal-800/30">
          {/* Password Change */}
          <button 
            onClick={() => setIsPasswordModalOpen(true)}
            className="w-full flex items-center justify-between p-6 hover:bg-teal-800/30 transition-colors group"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-teal-950 border border-teal-800 flex items-center justify-center text-teal-400 group-hover:text-yellow-500 transition-colors">
                <KeyRound size={20} />
              </div>
              <div className="text-left">
                <p className="text-sm text-white font-bold">লগইন পাসওয়ার্ড</p>
                <p className="text-[10px] text-teal-500 uppercase tracking-widest font-black">Change Login Password</p>
              </div>
            </div>
            <ChevronRight size={20} className="text-teal-600" />
          </button>

          {/* 2FA Section */}
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-teal-950 border border-teal-800 flex items-center justify-center text-teal-400">
                  <Shield size={20} />
                </div>
                <div>
                  <p className="text-sm text-white font-bold">টু-ফ্যাক্টর অথেন্টিকেশন</p>
                  <p className="text-[10px] text-teal-500 uppercase tracking-widest font-black">Two-Factor Authentication (2FA)</p>
                </div>
              </div>
              <div 
                className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors ${is2FAEnabled ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-gray-600'}`}
                onClick={() => is2FAEnabled ? setIsConfirmingDisable2FA(true) : handleStart2FASetup()}
              >
                <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform ${is2FAEnabled ? 'translate-x-6' : 'translate-x-0'}`}></div>
              </div>
            </div>
            
            {!is2FAEnabled && !isSettingUp2FA && (
              <div className="grid grid-cols-2 gap-3 mt-4">
                <button 
                  onClick={() => setTwoFAMethod('app')}
                  className={`flex flex-col items-center justify-center gap-2 py-3 rounded-2xl text-[10px] font-black uppercase transition-all border ${twoFAMethod === 'app' ? 'bg-teal-700/50 border-teal-400 text-white shadow-inner' : 'bg-teal-950/40 border-teal-800 text-teal-400 hover:bg-teal-800/40'}`}
                >
                  <Smartphone size={18} /> অথেনটিকেটর অ্যাপ
                </button>
                <button 
                  onClick={() => setTwoFAMethod('sms')}
                  className={`flex flex-col items-center justify-center gap-2 py-3 rounded-2xl text-[10px] font-black uppercase transition-all border ${twoFAMethod === 'sms' ? 'bg-teal-700/50 border-teal-400 text-white shadow-inner' : 'bg-teal-950/40 border-teal-800 text-teal-400 hover:bg-teal-800/40'}`}
                >
                  <MessageSquare size={18} /> এসএমএস (SMS)
                </button>
              </div>
            )}
            
            {is2FAEnabled && (
              <div className="bg-green-500/10 border border-green-500/30 p-3 rounded-2xl flex items-center gap-3">
                <CheckCircle2 size={16} className="text-green-400" />
                <p className="text-[11px] text-green-300 font-bold">আপনার অ্যাকাউন্ট সুরক্ষিত আছে।</p>
              </div>
            )}
          </div>

          {/* Social Linking */}
          <div className="p-6 space-y-4">
            <h4 className="text-[10px] text-teal-500 uppercase tracking-widest font-black flex items-center gap-2">
              <Link size={14} /> লিঙ্ক করা অ্যাকাউন্ট (Linked Accounts)
            </h4>
            <div className="grid grid-cols-1 gap-3">
              {/* Google */}
              <div className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${isGoogleLinked ? 'bg-teal-800/40 border-teal-500/30' : 'bg-teal-950/40 border-white/5'}`}>
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shrink-0">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" alt="Google" className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-white">Google</span>
                </div>
                <button 
                  onClick={handleLinkGoogle}
                  disabled={isLinkingGoogle}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isGoogleLinked ? 'text-red-400 bg-red-500/10' : 'bg-yellow-500 text-black'}`}
                >
                  {isLinkingGoogle ? <RefreshCw size={14} className="animate-spin" /> : (isGoogleLinked ? 'Unlink' : 'Link')}
                </button>
              </div>
              {/* Facebook */}
              <div className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${isFacebookLinked ? 'bg-teal-800/40 border-teal-500/30' : 'bg-teal-950/40 border-white/5'}`}>
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-lg bg-[#1877F2] flex items-center justify-center shrink-0">
                    <Facebook size={18} className="text-white" />
                  </div>
                  <span className="text-xs font-bold text-white">Facebook</span>
                </div>
                <button 
                  onClick={handleLinkFacebook}
                  disabled={isLinkingFacebook}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isFacebookLinked ? 'text-red-400 bg-red-500/10' : 'bg-yellow-500 text-black'}`}
                >
                  {isLinkingFacebook ? <RefreshCw size={14} className="animate-spin" /> : (isFacebookLinked ? 'Unlink' : 'Link')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction Password */}
      <div className="bg-teal-900/40 rounded-[36px] border border-teal-700/50 overflow-hidden shadow-xl mt-6">
        <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-teal-950 border border-teal-800 flex items-center justify-center text-teal-400">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <p className="text-[10px] text-teal-500 uppercase tracking-widest font-black">লেনদেন পাসওয়ার্ড</p>
                  <p className="text-sm text-white font-bold mt-0.5">••••••</p>
                </div>
              </div>
              <button 
                onClick={() => setIsTrxPasswordModalOpen(true)}
                className="px-4 py-2 bg-white/5 hover:bg-yellow-500 hover:text-black text-teal-400 text-[10px] font-black uppercase tracking-widest rounded-xl border border-white/10 transition-all"
              >
                সেট করুন
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

      {/* Transaction Password Change Modal */}
      {isTrxPasswordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-teal-950/90 p-4 backdrop-blur-sm">
          <div className="bg-teal-900 rounded-2xl border border-teal-700/50 w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-teal-700/50 flex items-center justify-between bg-teal-800/50">
              <h3 className="font-bold text-white flex items-center gap-2">
                <ShieldCheck size={18} className="text-teal-400" /> 
                লেনদেন পাসওয়ার্ড সেট করুন
              </h3>
              <button 
                onClick={() => {
                  setIsTrxPasswordModalOpen(false);
                  setPasswordError(null);
                  setPasswordSuccess(null);
                  setTrxPassword("");
                  setConfirmTrxPassword("");
                }}
                className="text-teal-400 hover:text-white p-1 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleUpdateTrxPassword} className="p-5 space-y-4">
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
                <label className="text-xs text-teal-200 font-medium">নতুন লেনদেন পাসওয়ার্ড (New Transaction Pin)</label>
                <input 
                  type="password" 
                  maxLength={6}
                  value={trxPassword}
                  onChange={(e) => setTrxPassword(e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-teal-950/50 border border-teal-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-teal-400 transition-colors tracking-widest font-mono"
                  placeholder="৬ ডিজিটের পিন লিখুন"
                />
              </div>
              
              <div className="space-y-1.5">
                <label className="text-xs text-teal-200 font-medium">পুনরায় পিন লিখুন (Confirm Pin)</label>
                <input 
                  type="password" 
                  maxLength={6}
                  value={confirmTrxPassword}
                  onChange={(e) => setConfirmTrxPassword(e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-teal-950/50 border border-teal-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-teal-400 transition-colors tracking-widest font-mono"
                  placeholder="আবারও পিন লিখুন"
                />
              </div>

              <div className="p-3 bg-yellow-500/5 rounded-lg border border-yellow-500/10">
                <p className="text-[10px] text-yellow-200/70 leading-relaxed font-bold">
                  * লেনদেন পাসওয়ার্ডটি শুধুমাত্র উত্তোলন করার সময় প্রয়োজন হবে। এটি কমপক্ষে ৬ ডিজিটের সংখ্যা হতে হবে।
                </p>
              </div>

              <button 
                type="submit"
                disabled={isUpdatingTrxPassword || trxPassword.length !== 6 || trxPassword !== confirmTrxPassword}
                className="w-full bg-yellow-500 hover:bg-yellow-400 disabled:opacity-50 disabled:grayscale text-black font-black py-4 rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 uppercase tracking-widest text-[11px]"
              >
                {isUpdatingTrxPassword ? <RefreshCw size={18} className="animate-spin" /> : "সেভ করুন"}
              </button>
            </form>
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
  </div>
  );
}
