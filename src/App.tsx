import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from 'motion/react';
import { auth, getDb, switchToDefaultDb } from './services/firebase';
import { apiService } from './services/apiService';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, collection, getDocs, onSnapshot, serverTimestamp, increment, query, orderBy, limit } from 'firebase/firestore';
import SlotMachine from './components/SlotMachine/SlotMachine';
import DailyRewardPopup from "./components/ui/DailyRewardPopup";
import BonusCenter from './views/BonusCenter';
import AdminPanelView from "./views/AdminPanelView";
import AnalyticsView from "./views/AnalyticsView";
import ActivityHistory from "./views/ActivityHistory";
import ProfileView from "./views/ProfileView";
import InviteView from "./views/InviteView";
import HomeView from "./views/HomeView";
import DepositView from "./views/DepositView";
import WalletView from "./views/WalletView";
import SupportChat from "./layout/SupportChat";
import PromoCodeModal from "./components/modals/PromoCodeModal";
import LoginModal from "./components/modals/LoginModal";
import DepositRequiredModal from "./components/ui/DepositRequiredModal";
import PermissionManager from "./layout/PermissionManager";
import NotificationCenter from "./layout/NotificationCenter";
import FAQView from "./views/FAQView";
import BottomNav from "./components/BottomNav";
import Sidebar from "./layout/Sidebar";
import LeaderboardView from "./views/LeaderboardView";
import AIAssistant from "./layout/AIAssistant";
import GlobalChat from "./layout/GlobalChat";
import LearningProgressView from "./views/LearningProgressView";
import SettingsView from "./views/SettingsView";
import WinTicker from "./components/ui/WinTicker";
import { Game } from "./components/ui/GameGrid";
import GameLoader from "./components/ui/GameLoader";
import GlobalLoader from "./components/ui/GlobalLoader";
import { ToastContainer, ToastType } from "./components/ui/Toast";
import {
  AlertCircle,
  X,
  ChevronLeft,
  ArrowLeft,
  Send,
  MessageSquare,
  Loader2,
} from "lucide-react";

export default function App() {
  const db = getDb();
  const [dbStatus, setDbStatus] = useState<'testing' | 'success' | 'error'>('testing');
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [showRegistrationSuccess, setShowRegistrationSuccess] = useState(false);
  const [supportEmail, setSupportEmail] = useState<string>("support@spin71.bet");
  const [isGameLoading, setIsGameLoading] = useState(false);
  const [globalLogos, setGlobalLogos] = useState<Record<string, string>>({});
  const [globalNames, setGlobalNames] = useState<Record<string, string>>({});
  const [globalUrls, setGlobalUrls] = useState<Record<string, string>>({});
  const [globalOptions, setGlobalOptions] = useState<Record<string, string>>({});
  const [globalImages, setGlobalImages] = useState<Record<string, string>>({});
  const [balance, setBalance] = useState(500); // Default guest balance
  const [allButtonName, setAllButtonName] = useState<string>("ALL");
  const [casinoName, setCasinoName] = useState<string>("SPIN71.BET");
  const [noticeText, setNoticeText] = useState<string>("আমাদের নতুন স্লট মেশিনে বড় জয় নিশ্চিত করুন!");
  const [toasts, setToasts] = useState<{ id: string; message: string; type: ToastType }[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState<'home' | 'slot' | 'profile' | 'invite' | 'deposit' | 'bonus' | 'wallet' | 'faq' | 'leaderboard' | 'terms' | 'analytics' | 'admin' | 'learning' | 'settings' | 'history' | 'prize'>('home');
  const [profileSubTab, setProfileSubTab] = useState<string>('dashboard');
  const [recentlyPlayed, setRecentlyPlayed] = useState<Game[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [activeCategory, setActiveCategory] = useState('সেরা');
  const [searchQuery, setSearchQuery] = useState("");
  const [showPromoModal, setShowPromoModal] = useState(false);
  const [showDailyReward, setShowDailyReward] = useState(false);
  const [dailyStreak, setDailyStreak] = useState(0);
  const [isTabLoading, setIsTabLoading] = useState(false);
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState(false);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSupportChatOpen, setIsSupportChatOpen] = useState(false);
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false);
  const [isGlobalChatOpen, setIsGlobalChatOpen] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [telegramLink, setTelegramLink] = useState<string>("https://t.me/spin71bet_official");
  const [whatsappLink, setWhatsappLink] = useState<string>("https://wa.me/...");
  const [facebookLink, setFacebookLink] = useState<string>("https://facebook.com/...");
  const [minDeposit, setMinDeposit] = useState<number>(100);
  const [minWithdraw, setMinWithdraw] = useState<number>(100);
  const [welcomeBonus, setWelcomeBonus] = useState<number>(507);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [showDepositRequired, setShowDepositRequired] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [userData, setUserData] = useState<any>(null); // State to store user info from DB

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  const handleTabChange = (tab: any) => {
    if (tab === 'bonus' || tab === 'reward' || tab === 'prize' || tab === 'invite' || tab === 'slot') {
      if (!isLoggedIn) {
        setShowLoginModal(true);
        return;
      }
      if (!userData?.totalDeposits || userData.totalDeposits <= 0) {
        setShowDepositRequired(true);
        return;
      }
    }

    setIsTabLoading(true);
    setActiveTab(tab);
    setTimeout(() => setIsTabLoading(false), 500);
  };
  
  const handleLogout = async () => {
    try {
      await auth.signOut();
      setIsLoggedIn(false);
      setUserData(null);
      setBalance(500); // Reset to guest balance
      localStorage.removeItem('currentUser');
      showToast("লগআউট সফল হয়েছে", "info");
      setActiveTab('home');
    } catch (err) {
      console.error("Logout error:", err);
      showToast("লগআউট করতে সমস্যা হয়েছে", "error");
    }
  };

  const handleUpdateGlobalGameLogo = async (gameId: string, logo: string) => {
    let finalLogo = logo;
    if (logo.startsWith('data:image/') && logo.length > 200000) {
      showToast("ছবি রিসাইজ করা হচ্ছে (Compressing)...", "info");
      finalLogo = await compressImage(logo, 300, 400, 0.7);
    }

    setGlobalLogos(prev => ({ ...prev, [gameId]: finalLogo }));
    
    try {
      await setDoc(doc(db, 'game_settings', gameId), { 
        game_id: gameId, 
        logo_url: finalLogo,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      showToast("গেম লোগো সফলভাবে আপডেট করা হয়েছে এবং সবার জন্য সেভ হয়েছে", "success");
    } catch (err) {
      console.error("Error persisting logo:", err);
      showToast("ডাটাবেসে সেভ করতে সমস্যা হয়েছে", "error");
      throw err;
    }
  };

  const handleUpdateGlobalGameName = async (gameId: string, name: string) => {
    setGlobalNames(prev => ({ ...prev, [gameId]: name }));
    
    try {
      await setDoc(doc(db, 'game_settings', gameId), { 
        game_id: gameId, 
        name: name,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      showToast("গেমের নাম সফলভাবে আপডেট করা হয়েছে এবং সবার জন্য সেভ হয়েছে", "success");
    } catch (err) {
      console.error(err);
      showToast("ডাটাবেসে সেভ করতে সমস্যা হয়েছে", "error");
      throw err;
    }
  };

  const compressImage = (base64Str: string, maxWidth = 1200, maxHeight = 1200, quality = 0.7): Promise<string> => {
    return new Promise((resolve) => {
      if (!base64Str.startsWith('data:image/')) {
        resolve(base64Str);
        return;
      }

      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(base64Str);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        const compressed = canvas.toDataURL('image/jpeg', quality);
        
        if (compressed.length > 1000000) {
          resolve(canvas.toDataURL('image/jpeg', quality * 0.5));
        } else {
          resolve(compressed);
        }
      };
      img.onerror = () => resolve(base64Str);
    });
  };

  const handleUpdateGlobalImage = async (imageKey: string, url: string) => {
    let finalUrl = url;
    if (url.startsWith('data:image/') && url.length > 680000) {
      showToast("ছবি রিসাইজ করা হচ্ছে (Compressing)...", "info");
      finalUrl = await compressImage(url, 1200, 1200, 0.7);
    }
    setGlobalImages(prev => ({ ...prev, [imageKey]: finalUrl }));
    try {
      await setDoc(doc(db, 'global_images', imageKey), { 
        url: finalUrl,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      showToast("লোগো/ছবি সফলভাবে আপডেট করা হয়েছে এবং সবার জন্য সেভ হয়েছে", "success");
    } catch (err) {
      console.error("Error persisting global image:", err);
      showToast("ডাটাবেসে সেভ করতে সমস্যা হয়েছে", "error");
      throw err;
    }
  };

  const handleAddUser = async (user: any) => {
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, orderBy('numericId', 'desc'), limit(1));
      const querySnapshot = await getDocs(q);
      let nextId = 10000001;
      if (!querySnapshot.empty) {
        const lastData = querySnapshot.docs[0].data() as { numericId?: number };
        nextId = (lastData.numericId || 10000000) + 1;
      }

      const newUserRef = doc(collection(db, 'users'));
      await setDoc(newUserRef, {
        id: newUserRef.id,
        numericId: nextId,
        username: user.username,
        password: user.password,
        role: user.role,
        balance: Number(user.balance) || 0,
        status: 'active',
        createdAt: serverTimestamp(),
        vipLevel: 0,
        vipProgress: 0,
        experience: 0,
        deposits: 0,
        totalDeposits: 0,
        withdrawals: 0,
        totalWagered: 0,
        totalWon: 0,
        totalLost: 0,
        referralCode: user.username.toLowerCase().substring(0, 4) + Math.floor(1000 + Math.random() * 9000),
        referredBy: null,
        referredUsers: [],
        profilePictureUrl: null,
      });
      showToast("ইউজার সফলভাবে তৈরি করা হয়েছে", "success");
    } catch (err) {
      showToast("ইউজার তৈরি করতে সমস্যা হয়েছে", "error");
      throw err;
    }
  };

  const handleUpdateCasinoName = async (newName: string) => {
    setCasinoName(newName);
    try {
      await setDoc(doc(db, 'metadata', 'settings'), { casinoName: newName }, { merge: true });
      showToast("ক্যাসিনোর নাম সফলভাবে আপডেট করা হয়েছে", "success");
    } catch (err) {
      console.error(err);
      showToast("সেভ করতে সমস্যা হয়েছে", "error");
    }
  };

  const handleNavigate = (tab: string, subTab?: string) => {
    setActiveTab(tab as any);
    if (subTab) {
      setProfileSubTab(subTab as any);
    }
  };

  const handleGameSelect = async (game: Game | null) => {
    if (game) {
      if (!isLoggedIn) {
        showToast("গেম খেলতে লগইন করুন", "info");
        setShowLoginModal(true);
        return;
      }

      if (!userData?.totalDeposits || userData.totalDeposits <= 0) {
        setShowDepositRequired(true);
        return;
      }

      if (balance <= 0) {
        showToast("আপনার ব্যালেন্স যথেষ্ট নয়", "error");
        return;
      }

      if (game.id === 'native_slot') {
        setActiveTab('slot');
        return;
      }
    }

    setSelectedGame(game);
    setIsGameLoading(!!game);
    if (game && userData?.id) {
      // Update recently played list
      const updatedList = [game, ...recentlyPlayed.filter(g => g.id !== game.id)].slice(0, 10);
      setRecentlyPlayed(updatedList);
    }
  };

  const handleUpdateAllButtonName = async (newName: string) => {
    setAllButtonName(newName);
    try {
      await setDoc(doc(db, 'metadata', 'settings'), { allButtonName: newName }, { merge: true });
      showToast("বাটন নাম সফলভাবে আপডেট করা হয়েছে", "success");
    } catch (err) {
      console.error(err);
      showToast("সেভ করতে সমস্যা হয়েছে", "error");
    }
  };

  const handleProfileUpdate = async (updates: any) => {
    if (!userData?.id) return;
    try {
      const userRef = doc(db, 'users', userData.id);
      await updateDoc(userRef, updates);
      setUserData((prev: any) => ({ ...prev, ...updates }));
      if (updates.balance !== undefined) setBalance(updates.balance);
    } catch (err) {
      console.error("User update error:", err);
      showToast("প্রোফাইল আপডেট করতে সমস্যা হয়েছে", "error");
      throw err;
    }
  };

  useEffect(() => {
    if (!isLoggedIn && !isDataLoading) {
      setShowLoginModal(true);
    }
  }, [isLoggedIn, isDataLoading]);

  // Auth listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log("[App] Auth state changed:", user ? `LoggedIn: ${user.uid}` : "LoggedOut");
      
      const processUserSession = async (retryCount = 0) => {
        try {
          if (user) {
            setIsLoggedIn(true);
            
            // Set up real-time listener for user document immediately
            const userRef = doc(db, 'users', user.uid);
            const userUnsubscribe = onSnapshot(userRef, (snapshot) => {
              if (snapshot.exists()) {
                const data = snapshot.data();
                console.log("[App] Real-time user update received", user.uid);
                setUserData({ id: user.uid, ...data });
                setBalance(data.balance || 0);
              } else {
                console.log("[App] User document not found, initializing...", user.uid);
                // Initialize for new user (if not exists)
                const newUser = {
                  id: user.uid,
                  username: user.email?.split('@')[0] || 'User',
                  balance: 500,
                  vipLevel: 0,
                  createdAt: serverTimestamp(),
                  lastLogin: serverTimestamp(),
                };
                setDoc(userRef, newUser);
                setUserData(newUser);
                setBalance(500);
              }
              setIsDataLoading(false);
              setDbStatus('success');
            }, (error) => {
               console.error("[App] User listener error:", error);
               if (error.code === 'permission-denied') {
                  setDbStatus('error');
                  setIsDataLoading(false);
               }
            });

            // Clean up listener on logout or change
            return () => userUnsubscribe();

          } else {
            setIsLoggedIn(false);
            setUserData(null);
            setIsDataLoading(false);
            setDbStatus('testing');
          }
        } catch (err: any) {
          console.error(`[App] Auth state process error (Attempt ${retryCount + 1}):`, err.message);
          
          if (retryCount < 3 && (err.message === 'TIMEOUT' || err.message.includes('offline'))) {
             console.warn(`[App] Retrying auth session processing... (${retryCount + 1}/3)`);
             setTimeout(() => processUserSession(retryCount + 1), 1000);
             return;
          }

          if (user && err.message === 'TIMEOUT') {
             showToast("নেটওয়ার্ক স্লো, আবার চেষ্টা করা হচ্ছে...", "info");
          }
          
          setIsDataLoading(false);
          setDbStatus('error');
        }
      };

      processUserSession();
    });
    return unsubscribe;
  }, [db]);

  // Fetch all app config data once
  const loadAllAppConfig = async (retryCount = 0) => {
    try {
      console.log(`[App] Starting loadAllAppConfig... (Attempt ${retryCount + 1})`);
      setIsRefreshing(true);
      
      // Use parallel fetching with individual try-catches to ensure partial failures don't block the app
      const fetchGameSettings = async () => {
        try {
          const snapshot = await getDocs(collection(db, 'game_settings'));
          const logos: Record<string, string> = {};
          const names: Record<string, string> = {};
          const urls: Record<string, string> = {};
          const options: Record<string, string> = {};
          snapshot.forEach((doc) => {
            const item = doc.data();
            if (item.logo_url) logos[item.game_id] = item.logo_url;
            if (item.name) names[item.game_id] = item.name;
            if (item.game_url) urls[item.game_id] = item.game_url;
            if (item.provider_option) options[item.game_id] = item.provider_option;
          });
          setGlobalLogos(prev => ({ ...prev, ...logos }));
          setGlobalNames(prev => ({ ...prev, ...names }));
          setGlobalUrls(prev => ({ ...prev, ...urls }));
          setGlobalOptions(prev => ({ ...prev, ...options }));
          return true;
        } catch (e: any) {
          if (e.message?.includes('offline')) throw e;
          console.error("[App] Game settings fetch failed", e);
          return false;
        }
      };

      const fetchGlobalImages = async () => {
        try {
          const snapshot = await getDocs(collection(db, 'global_images'));
          const images: Record<string, string> = {};
          snapshot.forEach((doc) => {
            const data = doc.data();
            if (data.url) images[doc.id] = data.url;
          });
          setGlobalImages(prev => ({ ...prev, ...images }));
          return true;
        } catch (e: any) {
          if (e.message?.includes('offline')) throw e;
          console.error("[App] Global images fetch failed", e);
          return false;
        }
      };

      const fetchMetadataSettings = async () => {
        try {
          const settingsDoc = await getDoc(doc(db, 'metadata', 'settings'));
          if (settingsDoc.exists()) {
            const data = settingsDoc.data();
            if (data?.allButtonName) setAllButtonName(data.allButtonName);
            if (data?.casinoName) setCasinoName(data.casinoName);
            if (data?.noticeText) setNoticeText(data.noticeText);
            if (data?.telegramLink) setTelegramLink(data.telegramLink);
            if (data?.whatsappLink) setWhatsappLink(data.whatsappLink);
            if (data?.facebookLink) setFacebookLink(data.facebookLink);
            if (data?.supportEmail) setSupportEmail(data.supportEmail);
            if (data?.minDeposit !== undefined) setMinDeposit(data.minDeposit);
            if (data?.minWithdraw !== undefined) setMinWithdraw(data.minWithdraw);
            if (data?.welcomeBonus !== undefined) setWelcomeBonus(data.welcomeBonus);
          }
          return true;
        } catch (e: any) {
          if (e.message?.includes('offline')) throw e;
          console.error("[App] Metadata settings fetch failed", e);
          return false;
        }
      };

      // Wrap all initial fetches in a timeout race to prevent hanging
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('TIMEOUT')), 45000));
      const fetchPromise = Promise.all([
        fetchGameSettings(),
        fetchGlobalImages(),
        fetchMetadataSettings()
      ]);

      await Promise.race([fetchPromise, timeoutPromise]);
      
      setDbStatus('success');
      console.log("[App] LoadAllAppConfig completed successfully");
    } catch (err: any) {
      console.error(`[App] Error loading app config (Attempt ${retryCount + 1}):`, err.message);
      
      // If we consistently fail on a custom DB, try switching to (default)
      if (retryCount >= 2 && retryCount < 4) {
          console.warn("[App] Persistent failure. Attempting to switch to default database instance...");
          switchToDefaultDb();
      }

      const isRetryable = err.message.includes('TIMEOUT') || 
                        err.message.includes('offline') || 
                        err.message.includes('failed-precondition') || 
                        err.message.includes('permission-denied') ||
                        err.message.includes('5');

      if (isRetryable && retryCount < 8) {
        const backoff = Math.pow(2, Math.min(retryCount, 4)) * 1000;
        console.warn(`[App] Connection issue. Retrying in ${backoff}ms... (${retryCount + 1}/8)`);
        setTimeout(() => loadAllAppConfig(retryCount + 1), backoff);
        return;
      }
      
      setDbStatus('error');
    } finally {
      setIsRefreshing(false);
      setIsDataLoading(false);
    }
  };

  useEffect(() => {
    loadAllAppConfig();
  }, []);

  // Referral tracking and Admin tab switch
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref) {
      localStorage.setItem('referralCode', ref);
      console.log("Captured referral code:", ref);
      // Clean up URL
      const newUrl = window.location.pathname + window.location.search.replace(/[?&]ref=[^&]*/, '');
      window.history.replaceState({}, '', newUrl);
    }
    
    // Admin tab switch
    const tab = params.get('tab');
    if (tab === 'admin') {
       // logic to show admin can be here but activeTab is better
    }
  }, []);

  const showToast = (message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const updateGlobalGameUrl = async (gameId: string, url: string) => {
    setGlobalUrls(prev => ({ ...prev, [gameId]: url }));
    try {
      await setDoc(doc(db, 'game_settings', gameId), { 
        game_id: gameId, 
        game_url: url,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      showToast("গেম URL সফলভাবে আপডেট করা হয়েছে এবং সবার জন্য সেভ হয়েছে", "success");
    } catch (err) {
      console.error(err);
      showToast("ডাটাবেসে সেভ করতে সমস্যা হয়েছে", "error");
      throw err;
    }
  };

  const updateGlobalGameOption = async (gameId: string, option: string) => {
    setGlobalOptions(prev => ({ ...prev, [gameId]: option }));
    try {
      await setDoc(doc(db, 'game_settings', gameId), { 
        game_id: gameId, 
        provider_option: option,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      showToast("গেম অপশন সফলভাবে আপডেট করা হয়েছে এবং সবার জন্য সেভ হয়েছে", "success");
    } catch (err) {
      console.error(err);
      showToast("ডাটাবেসে সেভ করতে সমস্যা হয়েছে", "error");
      throw err;
    }
  };

  const updateAllButtonName = async (name: string) => {
    setAllButtonName(name);
    try {
      await setDoc(doc(db, 'metadata', 'settings'), { 
        allButtonName: name,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      showToast("ALL বাটনের নাম সফলভাবে আপডেট করা হয়েছে এবং সবার জন্য সেভ হয়েছে", "success");
    } catch (err) {
      console.error(err);
      showToast("ডাটাবেসে সেভ করতে সমস্যা হয়েছে", "error");
    }
  };

  const updateCasinoName = async (name: string) => {
    setCasinoName(name);
    try {
      await setDoc(doc(db, 'metadata', 'settings'), { 
        casinoName: name,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      showToast("ক্যাসিনোর নাম সফলভাবে আপডেট করা হয়েছে এবং সবার জন্য সেভ হয়েছে", "success");
    } catch (err) {
      console.error(err);
      showToast("ডাটাবেসে সেভ করতে সমস্যা হয়েছে", "error");
    }
  };

  const handleRefresh = () => {
    loadAllAppConfig();
  };

  const updateBalance = (uid: string, newBalance: number) => {
    handleBalanceUpdate(newBalance);
  };

  const handleEditCasinoName = (name: string) => {
    updateCasinoName(name);
  };

  const logUserActivity = (activity: string) => {
    console.log("Activity Log:", activity);
  };

  const handleBalanceUpdate = async (newBalance: number) => {
    setBalance(newBalance);
    if (isLoggedIn && userData?.id) {
      try {
        await updateDoc(doc(db, 'users', userData.id), { balance: newBalance });
        const updatedUser = { ...userData, balance: newBalance };
        setUserData(updatedUser);
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      } catch (err) {
        console.error("Error updating balance in Firestore:", err);
      }
    }
  };

  const handleUpdateUser = async (updates: any) => {
    if (userData?.id) {
      try {
        const userRef = doc(db, 'users', userData.id);
        await updateDoc(userRef, updates);
        
        const newUserData = { ...userData, ...updates };
        setUserData(newUserData);
        localStorage.setItem('currentUser', JSON.stringify(newUserData));
        if (updates.balance !== undefined) {
          setBalance(updates.balance);
        }
      } catch (e) {
        console.error('Error updating user', e);
        showToast("প্রোফাইল আপডেট করতে সমস্যা হয়েছে", "error");
        throw e;
      }
    }
  };

  const handleAddTransaction = async (transaction: any) => {
    if (userData?.id) {
      try {
        console.log("Attempting to add transaction:", transaction);
        const txData = {
          ...transaction,
          userId: userData.id,
          username: userData.username || 'Anonymous',
          createdAt: serverTimestamp()
        };

        // Create in global transactions for admin to approve
        const globalTxRef = doc(collection(db, 'transactions'));
        console.log("Creating global transaction record at path: transactions/" + globalTxRef.id);
        await setDoc(globalTxRef, txData);

        // Also in user's subcollection for their own history
        const userTxRef = doc(db, 'users', userData.id, 'transactions', globalTxRef.id);
        console.log("Creating user-specific transaction record at path: users/" + userData.id + "/transactions/" + globalTxRef.id);
        await setDoc(userTxRef, txData);
        
        console.log("Transaction records created successfully.");
      } catch (e) {
        console.error('CRITICAL: Error adding transaction to Firestore', e);
        showToast("লেনদেন সংরক্ষণ করতে সমস্যা হয়েছে। দয়া করে আপনার ইন্টারনেট চেক করুন।", "error");
        throw e;
      }
    } else {
      console.error("Critical Error: handleAddTransaction called without userData.id");
    }
  };

  const handleDepositSuccess = async (amount: number, trxId?: string, senderNumber?: string, method?: string) => {
    console.log("Deposit success triggered:", { amount, trxId, senderNumber, method });
    setShowDepositRequired(false);
    
    if (isLoggedIn && auth.currentUser) {
      try {
        const uid = auth.currentUser.uid;
        console.log("Current Auth User UID:", uid);
        
        // Log transaction as pending
        const txData = {
          type: 'deposit',
          amount: amount,
          method: method || 'Direct Payment',
          senderNumber: senderNumber || 'Unknown',
          date: new Date().toISOString(),
          status: 'pending',
          statusColor: 'text-amber-400',
          trxId: trxId || ('DEP_' + Date.now())
        };
        
        await handleAddTransaction(txData);
        
        // Notify Telegram about the deposit request
        try {
          await fetch('/api/telegram/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              message: `💰 <b>New Deposit Request! (পেন্ডিং)</b>\n\n👤 <b>Username:</b> ${userData?.username || 'Unknown'}\n🔢 <b>UID:</b> <code>${uid}</code>\n💵 <b>Amount:</b> ৳${amount}\n🏦 <b>Method:</b> ${method || 'Unknown'}\n📱 <b>Sender:</b> ${senderNumber || 'Unknown'}\n🔖 <b>TxID:</b> <code>${trxId || 'N/A'}</code>`
            })
          });
        } catch (tErr) {
          console.error("Telegram notify failed", tErr);
        }
        
        showToast(`৳${amount} ডিপোজিট রিকোয়েস্ট পাঠানো হয়েছে। অ্যাডমিন অ্যাপ্রুভ করার জন্য অপেক্ষা করুন।`, "success");
      } catch (err: any) {
        console.error("Internal process error during deposit log:", err);
        showToast("ডিপোজিট প্রসেস করতে সমস্যা হয়েছে: " + err.message, "error");
      }
    } else {
      console.warn("Unauthorized deposit attempt detected.");
      showToast("ডিপোজিট করতে লগইন করুন", "error");
    }
  };
   const handleToggleFavorite = (gameId: string) => {
    const newFavorites = favorites.includes(gameId)
      ? favorites.filter(id => id !== gameId)
      : [...favorites, gameId];
    
    setFavorites(newFavorites);
    showToast(favorites.includes(gameId) ? "পছন্দ থেকে সরানো হয়েছে" : "পছন্দে যোগ করা হয়েছে", "info");
    
    if (isLoggedIn && userData) {
      const updatedUser = { ...userData, favorites: newFavorites };
      setUserData(updatedUser);
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
    }
  };

  useEffect(() => {
    const checkDailyReward = async () => {
      if (isLoggedIn && userData) {
        try {
          const idToken = await auth.currentUser?.getIdToken();
          // We can check if already claimed today by looking at userData
          const lastClaimed = userData.lastClaimedReward;
          const today = new Date().toISOString().split('T')[0];
          
          if (lastClaimed !== today) {
             setDailyStreak(userData.dailyStreak || 0);
             setShowDailyReward(true);
          }
        } catch (error) {
          console.error("Error checking daily reward", error);
        }
      }
    };
    
    if (isLoggedIn) {
      checkDailyReward();
    }
  }, [isLoggedIn, userData?.lastClaimedReward]);

  const handleClaimDailyReward = async (amount: number) => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("লগইন করা নেই");
      
      const today = new Date().toISOString().split('T')[0];
      const userRef = doc(db, 'users', user.uid);
      
      const dbInstance = getDb();
      if (!dbInstance) throw new Error("Database not connected");

      await import('firebase/firestore').then(async ({ runTransaction, serverTimestamp }) => {
        await runTransaction(dbInstance, async (transaction) => {
          const userDoc = await transaction.get(userRef);
          if (!userDoc.exists()) throw new Error("User not found");
          const data = userDoc.data();
          
          if (data.lastClaimedReward === today) {
            throw new Error("আজকের রিওয়ার্ড ইতিমধ্যে নেওয়া হয়েছে");
          }
          
          const newBalance = (data.balance || 0) + amount;
          const newStreak = (data.dailyStreak || 0) + 1;
          
          transaction.update(userRef, {
            balance: newBalance,
            lastClaimedReward: today,
            dailyStreak: newStreak,
            updatedAt: serverTimestamp()
          });
          
          // Log reward transaction
          const rxRef = doc(dbInstance, 'transactions', 'REW_' + Date.now() + Math.floor(Math.random()*1000));
          transaction.set(rxRef, {
            type: 'bonus',
            amount: amount,
            status: 'approved',
            statusColor: 'text-green-500',
            userId: user.uid,
            username: data.username || 'Anonymous',
            createdAt: serverTimestamp(),
            date: new Date().toISOString()
          });
        });
      });
      
      showToast(`৳${amount} ডেইলি রিওয়ার্ড দাবি করা হয়েছে!`, "success");
      setBalance(prev => prev + amount);
      setUserData((prev: any) => ({ ...prev, lastClaimedReward: today, dailyStreak: prev.dailyStreak ? prev.dailyStreak + 1 : 1 }));
    } catch (error: any) {
       console.error("Reward error:", error);
       showToast(error.message || "নেটওয়ার্ক সমস্যা", "error");
    }
  };

  useEffect(() => {
    let unsubscribeUser = () => {};
    let unsubscribeNotifications = () => {};
    if (isLoggedIn && userData?.id) {
      const isAdminUser = userData?.role === 'admin' || userData?.isAdmin === true;
      unsubscribeUser = onSnapshot(doc(db, 'users', userData.id), (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          setUserData((prev: any) => ({ ...prev, ...data }));
          setBalance(data.balance || 0);
        }
      }, (error) => {
        console.error("User snapshot error:", error);
      });
      
      const notificationsRef = collection(db, 'users', userData.id, 'notifications');
      unsubscribeNotifications = onSnapshot(notificationsRef, (snapshot) => {
        let unread = 0;
        snapshot.forEach(docSnap => {
          if (!docSnap.data().read) unread++;
        });
        setUnreadNotificationsCount(unread);
      }, (error) => {
        console.error("Notifications snapshot error:", error);
      });
    }

    return () => {
      unsubscribeUser();
      unsubscribeNotifications();
      logUserActivity('session_end');
    };
  }, [isLoggedIn, userData?.id]);

  if (isDataLoading && !showRegistrationSuccess) {
    return (
      <GlobalLoader 
        message="অ্যাকাউন্ট লোড হচ্ছে" 
        subMessage="আপনার প্রোফাইল প্রস্তুত করা হচ্ছে" 
        type="data" 
        onRetry={() => {
          setIsDataLoading(true);
          setDbStatus('testing');
          loadAllAppConfig();
        }}
        showRetry={dbStatus === 'error'}
      />
    );
  }

  return (
    <div className="max-w-[512px] mx-auto bg-[var(--bg-main)] min-h-[100dvh] relative overflow-x-hidden font-sans text-[var(--text-main)] pb-16 flex flex-col safe-top transition-colors duration-300">
      <AnimatePresence>
        {isSidebarOpen && (
          <Sidebar
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
            userData={userData}
            activeTab={activeTab}
            handleTabChange={handleTabChange}
            handleGameSelect={handleGameSelect}
            setIsSupportChatOpen={setIsSupportChatOpen}
            handleLogout={() => {
              handleLogout();
              setIsSidebarOpen(false);
            }}
            showToast={showToast}
            casinoName={casinoName}
            telegramLink={telegramLink}
            theme={theme}
            toggleTheme={toggleTheme}
          />
        )}
      </AnimatePresence>
      {/* Database Status Indicator */}
      <div className={`fixed top-4 right-4 z-[201] w-3 h-3 rounded-full ${
        dbStatus === 'success' ? 'bg-green-500' :
        dbStatus === 'error' ? 'bg-red-500' : 'bg-yellow-500 animate-pulse'
      }`} title={`Firebase: ${dbStatus}`} />

      {/* Tab Loading Progress Bar */}
      <AnimatePresence>
        {isTabLoading && (
          <motion.div 
            initial={{ width: "0%", opacity: 0 }}
            animate={{ width: "100%", opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="fixed top-0 left-0 h-1 bg-gradient-to-r from-yellow-400 to-yellow-600 z-[200] shadow-[0_0_10px_rgba(234,179,8,0.5)]"
          />
        )}
      </AnimatePresence>

      {/* Email Verification Banner */}
      {isLoggedIn && !auth.currentUser?.emailVerified && auth.currentUser?.providerData[0]?.providerId === 'password' && (
        <motion.div 
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          className="bg-rose-500 text-white px-4 py-2 text-[10px] font-bold flex items-center justify-between z-[190] shrink-0"
        >
          <div className="flex items-center gap-2">
            <AlertCircle size={14} />
            <span>অ্যাকাউন্ট ভেরিফাই নেই! এখনই ভেরিফাই করে নিরাপত্তা নিশ্চিত করুন।</span>
          </div>
          <button 
            onClick={() => handleTabChange('profile')}
            className="bg-white text-rose-600 px-3 py-1 rounded-full font-black uppercase text-[8px]"
          >
            Verify Now
          </button>
        </motion.div>
      )}

      {/* Game Loader Overlay */}
      <AnimatePresence>
        {isGameLoading && selectedGame && (
          <GameLoader 
            gameName={globalUrls[selectedGame.id] ? (globalNames[selectedGame.id] || selectedGame.name) : selectedGame.name}
            provider={selectedGame.provider}
            logo={globalLogos[selectedGame.id] || selectedGame.image}
            onClose={() => {
              setIsGameLoading(false);
              setSelectedGame(null);
            }}
          />
        )}
      </AnimatePresence>

      {/* Actual Game View Overlay */}
      <AnimatePresence>
        {!isGameLoading && selectedGame && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="fixed inset-0 z-[100] max-w-[512px] mx-auto bg-black flex flex-col"
          >
            {/* Header for Game View */}
            <div className="flex items-center justify-between p-3 bg-[#111] border-b border-white/10 shrink-0">
               <div className="flex items-center gap-2">
                 <button 
                  onClick={() => setSelectedGame(null)}
                  className="p-1.5 hover:bg-white/10 rounded-full transition-colors text-white"
                >
                  <ChevronLeft size={24} />
                </button>
                <div className="flex flex-col">
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest leading-none">Playing</span>
                  <span className="text-sm font-black text-white italic tracking-tighter uppercase">
                    {globalNames[selectedGame.id] || selectedGame.name}
                  </span>
                </div>
               </div>
               <div className="flex items-center gap-2">
                 <div className="bg-yellow-500/10 px-2 py-1 rounded border border-yellow-500/20">
                   <span className="text-[10px] font-bold text-yellow-500">৳ {balance.toLocaleString()}</span>
                 </div>
                 <button 
                  onClick={() => setSelectedGame(null)}
                  className="p-1.5 hover:bg-red-500/20 rounded-full transition-colors text-gray-400 hover:text-red-400"
                >
                  <X size={20} />
                </button>
               </div>
            </div>

            {/* Game Content */}
            <div className="flex-1 relative bg-[#050505] overflow-hidden">
              {globalUrls[selectedGame.id] ? (
                <iframe 
                  src={globalUrls[selectedGame.id]} 
                  className="w-full h-full border-none"
                  title="Game View"
                  sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center">
                  <div className="w-20 h-20 bg-yellow-500/10 rounded-3xl flex items-center justify-center text-yellow-500 mb-6 border border-yellow-500/20 shadow-[0_0_30px_rgba(234,179,8,0.1)]">
                    <Loader2 size={40} className="animate-spin" />
                  </div>
                  <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter mb-2">গেমে কাজ চলতেছে</h2>
                  <p className="text-gray-500 font-bold uppercase text-[10px] tracking-[0.2em] mb-8">(Work in progress)</p>
                  <p className="text-gray-400 text-sm max-w-xs mx-auto mb-10 leading-relaxed font-medium">
                    এই গেমটির ডেভেলপমেন্ট কাজ চলছে। শীঘ্রই এটি আপনাদের জন্য উন্মুক্ত করা হবে। অনুগ্রহ করে আমাদের অন্য গেমগুলো ট্রাই করুন।
                  </p>
                  <button 
                    onClick={() => setSelectedGame(null)}
                    className="px-10 py-4 bg-yellow-500 text-black font-black italic rounded-2xl hover:bg-yellow-400 transition-all shadow-[0_10px_20px_rgba(234,179,8,0.3)] uppercase tracking-widest text-sm"
                  >
                    ফিরে যান (Back to Home)
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="relative min-h-[calc(100vh-120px)]">
        <AnimatePresence mode="wait">
          {activeTab === 'learning' && (
            <motion.div
              key="learning"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <LearningProgressView userData={userData} />
            </motion.div>
          )}
          {activeTab === 'settings' && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <SettingsView userData={userData} />
            </motion.div>
          )}
          {activeTab === 'faq' && (
            <motion.div
              key="faq"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <FAQView />
            </motion.div>
          )}
          {activeTab === 'terms' && (
            <motion.div
              key="terms"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="p-6 text-white max-w-2xl mx-auto"
            >
              <h1 className="text-2xl font-bold mb-4">শর্তাবলী (Terms & Conditions)</h1>
              <p>আমাদের প্ল্যাটফর্ম ব্যবহার করার মাধ্যমে আপনি আমাদের শর্তাবলীর সাথে সম্মত হচ্ছেন। বিস্তারিত এখানে...</p>
            </motion.div>
          )}
          {activeTab === 'home' && (
            <motion.div
              key="home"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              transition={{ duration: 0.3 }}
            >
              <div id="home-win-ticker-container">
                <WinTicker />
              </div>
              <HomeView 
                userData={userData}
                recentlyPlayed={recentlyPlayed}
                favorites={favorites}
                handleGameSelect={handleGameSelect}
                setShowLeaderboard={setShowLeaderboard}
                setShowGallery={setShowGallery}
                onNavigate={handleNavigate}
                globalLogos={globalLogos}
                globalNames={globalNames}
                globalUrls={globalUrls}
                globalOptions={globalOptions}
                globalImages={globalImages}
                balance={balance}
                isRefreshing={isRefreshing}
                handleRefresh={handleRefresh}
                setIsSidebarOpen={setIsSidebarOpen}
                setIsNotificationCenterOpen={setIsNotificationCenterOpen}
                unreadNotificationsCount={unreadNotificationsCount}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                onOpenLogin={() => setShowLoginModal(true)}
                activeCategory={activeCategory}
                setActiveCategory={setActiveCategory}
                handleToggleFavorite={handleToggleFavorite}
                updateGlobalGameLogo={handleUpdateGlobalGameLogo}
                updateGlobalGameName={handleUpdateGlobalGameName}
                updateGlobalGameUrl={updateGlobalGameUrl}
                updateGlobalGameOption={updateGlobalGameOption}
                updateGlobalImage={handleUpdateGlobalImage}
                allButtonName={allButtonName}
                updateAllButtonName={updateAllButtonName}
                casinoName={casinoName}
                updateCasinoName={updateCasinoName}
                telegramLink={telegramLink}
                whatsappLink={whatsappLink}
                facebookLink={facebookLink}
                noticeText={noticeText}
                showToast={showToast}
                loading={isTabLoading}
                isAdmin={userData?.role === 'admin' || userData?.isAdmin === true}
                setIsSupportChatOpen={setIsSupportChatOpen}
              />
            </motion.div>
          )}
          {activeTab === 'slot' && (
             <motion.div
               key="slot"
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: -20 }}
               transition={{ duration: 0.3 }}
               className="w-full h-full"
             >
               <SlotMachine onBack={() => setActiveTab('home')} />
             </motion.div>
          )}
          {activeTab === 'history' && (
            <motion.div
               key="history"
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: -20 }}
               transition={{ duration: 0.3 }}
             >
               <ActivityHistory />
             </motion.div>
          )}
          {activeTab === 'analytics' && (
            <motion.div
               key="analytics"
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: -20 }}
               transition={{ duration: 0.3 }}
            >
              <AnalyticsView balance={balance} userData={userData} onBack={() => handleTabChange('profile')} />
            </motion.div>
          )}
          {activeTab === 'profile' && (
            <motion.div
               key="profile"
               initial={{ opacity: 0, scale: 0.98 }}
               animate={{ opacity: 1, scale: 1 }}
               exit={{ opacity: 0, scale: 1.02 }}
               transition={{ duration: 0.3 }}
            >
              <ProfileView 
                onTabChange={handleTabChange} 
                initialSubTab={profileSubTab as any}
                balance={balance} 
                userData={userData}
                onUpdateUser={handleUpdateUser}
                onAddTransaction={handleAddTransaction}
                onLogout={handleLogout} 
                showToast={showToast} 
                casinoName={casinoName} 
                onEditCasinoName={handleEditCasinoName}
                globalLogos={globalLogos}
                globalNames={globalNames}
                globalUrls={globalUrls}
                globalOptions={globalOptions}
                updateGlobalGameLogo={handleUpdateGlobalGameLogo}
                updateGlobalGameName={handleUpdateGlobalGameName}
                updateGlobalGameUrl={updateGlobalGameUrl}
                updateGlobalGameOption={updateGlobalGameOption}
                allButtonName={allButtonName}
                updateAllButtonName={updateAllButtonName}
                minWithdraw={minWithdraw}
                loading={isTabLoading}
              />
            </motion.div>
          )}
          {activeTab === 'prize' && (
            <motion.div
              key="prize"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <LeaderboardView />
            </motion.div>
          )}
          {activeTab === 'bonus' && (
            <motion.div
              key="bonus"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <BonusCenter 
                userData={userData} 
                balance={balance} 
                onBalanceUpdate={setBalance} 
                onTabChange={handleTabChange} 
                onUpdateUser={handleUpdateUser}
                onLogout={handleLogout}
                showToast={showToast} 
                welcomeBonus={welcomeBonus} 
                onOpenPromoModal={() => setShowPromoModal(true)}
                onAddTransaction={handleAddTransaction}
              />
            </motion.div>
          )}
          {activeTab === 'invite' && (
            <motion.div
              key="invite"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <InviteView 
                onTabChange={handleTabChange} 
                onBack={() => handleTabChange('home')}
                userData={userData} 
                showToast={showToast} 
                casinoName={casinoName}
                onUpdateUser={handleUpdateUser}
                onAddTransaction={handleAddTransaction}
              />
            </motion.div>
          )}
          {activeTab === 'deposit' && (
            <motion.div
              key="deposit"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <DepositView 
                onTabChange={handleTabChange} 
                balance={balance} 
                onBalanceUpdate={handleBalanceUpdate} 
                userData={userData} 
                showToast={showToast} 
                minDeposit={minDeposit} 
                globalImages={globalImages}
                isAdmin={true}
                onUpdateGlobalImage={handleUpdateGlobalImage}
                onDepositSuccess={handleDepositSuccess}
              />
            </motion.div>
          )}
          {activeTab === 'wallet' && (
            <motion.div
              key="wallet"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              transition={{ duration: 0.3 }}
            >
              <WalletView 
                balance={balance} 
                userData={userData} 
                onTabChange={handleTabChange}
                onSubTabChange={setProfileSubTab}
                showToast={showToast}
                minWithdraw={minWithdraw}
              />
            </motion.div>
          )}
          {activeTab === 'admin' && (
            <motion.div
              key="admin"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 z-[200] bg-black"
            >
              <AdminPanelView
                onBack={() => handleTabChange('home')}
                showToast={showToast}
                userData={userData}
                globalLogos={globalLogos}
                globalNames={globalNames}
                globalUrls={globalUrls}
                globalOptions={{}} // App.tsx doesn't use it right now
                updateGlobalGameLogo={handleUpdateGlobalGameLogo}
                updateGlobalGameName={handleUpdateGlobalGameName}
                updateGlobalGameUrl={async () => {}} // App.tsx doesn't implement it yet
                updateGlobalGameOption={async () => {}} // App.tsx doesn't implement it yet
                casinoName={casinoName}
                updateCasinoName={async() => {}} // Not implemented in app.tsx, handled inside AdminPanelView component anyway
                noticeText={noticeText}
                setNoticeText={setNoticeText}
                allButtonName={allButtonName}
                updateAllButtonName={async() => {}} // Not implemented
                minDeposit={minDeposit}
                setMinDeposit={setMinDeposit}
                minWithdraw={minWithdraw}
                setMinWithdraw={setMinWithdraw}
                welcomeBonus={welcomeBonus}
                setWelcomeBonus={setWelcomeBonus}
                telegramLink={telegramLink}
                setTelegramLink={setTelegramLink}
                updateGlobalImage={handleUpdateGlobalImage}
                onAddUser={async (user) => {
                  try {
                    console.log("Add user from admin:", user);
                  } catch(e) {
                    throw e;
                  }
                }}
                globalImages={globalImages}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Leaderboard Modal */}
      {showLeaderboard && (
        <div className="fixed inset-0 z-[120] bg-black flex flex-col max-w-[512px] mx-auto">
          <div className="flex items-center justify-between p-4 bg-[#1b1b1b] border-b border-white/5">
            <button onClick={() => setShowLeaderboard(false)} className="text-gray-400 hover:text-white p-1">
              <ArrowLeft size={24} />
            </button>
            <h2 className="text-white font-black text-lg italic uppercase tracking-tighter">Winners Board</h2>
            <div className="w-8"></div>
          </div>
          <div className="flex-1 overflow-y-auto bg-[#0b0b0b]">
            <LeaderboardView />
          </div>
        </div>
      )}

      {/* Support Chat */}
      <SupportChat 
        isOpen={isSupportChatOpen} 
        onClose={() => setIsSupportChatOpen(false)} 
        userData={userData} 
        telegramLink={telegramLink}
        whatsappLink={whatsappLink}
        facebookLink={facebookLink}
      />

      {/* AI Assistant */}
      <AIAssistant 
        isOpen={isAIAssistantOpen} 
        onClose={() => setIsAIAssistantOpen(false)} 
        userData={userData} 
      />

      {/* Global Chat */}
      <GlobalChat 
        isOpen={isGlobalChatOpen} 
        onClose={() => setIsGlobalChatOpen(false)} 
        userData={userData} 
      />

      {/* Notification Center */}
      <NotificationCenter 
        isOpen={isNotificationCenterOpen} 
        onClose={() => setIsNotificationCenterOpen(false)} 
        userData={userData}
        onAction={(url) => {
          if (url.startsWith('tab:')) {
            handleTabChange(url.split(':')[1] as any);
          }
        }}
      />

      {/* Global Floating Action Buttons */}
      <div className="fixed bottom-24 right-4 flex flex-col gap-3 z-[110]">
         <a 
           href={telegramLink}
           target="_blank"
           rel="noopener noreferrer"
           className="w-12 h-12 bg-[#14253a] rounded-full flex flex-col items-center justify-center shadow-lg border border-yellow-500/50 group relative"
         >
            <Send size={20} className="text-[#fdd835]" />
            <span className="text-[8px] text-white font-bold tracking-tighter">TELEGRAM</span>
            <div className="absolute -top-1 -right-1 bg-red-600 text-white text-[8px] font-black px-1 rounded-full animate-bounce">1</div>
         </a>
         <button 
           onClick={() => setIsSupportChatOpen(true)}
           className="w-12 h-12 bg-[#0d6efd] rounded-full flex items-center justify-center shadow-lg text-white hover:scale-110 transition-transform active:scale-95"
         >
            <MessageSquare size={24} />
         </button>
      </div>

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      <AnimatePresence>
        {showDailyReward && (
          <DailyRewardPopup 
            currentStreak={dailyStreak}
            onClose={() => setShowDailyReward(false)}
            onClaim={handleClaimDailyReward}
          />
        )}
      </AnimatePresence>

      {/* Bottom Navigation */}
      <BottomNav activeTab={activeTab} onTabChange={handleTabChange} unreadNotificationsCount={unreadNotificationsCount} />


      {isLoggedIn && <PermissionManager />}



      <LoginModal 
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        showToast={showToast}
      />

      <PromoCodeModal 
        isOpen={showPromoModal}
        onClose={() => setShowPromoModal(false)}
        showToast={showToast}
        isAdmin={userData?.role === 'admin' || userData?.isAdmin === true}
        userData={userData}
      />

      <DepositRequiredModal 
        isOpen={showDepositRequired}
        onClose={() => setShowDepositRequired(false)}
        onDeposit={() => {
          setShowDepositRequired(false);
          handleTabChange('deposit');
        }}
      />

      <style>{`
        @keyframes fly-around {
          0% { transform: translate(-100px, 50px) rotate(-45deg) scale(0.3); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translate(150px, -80px) rotate(-45deg) scale(2); opacity: 0; }
        }
        @keyframes fly-path {
          0% { transform: translate(0, 0) rotate(10deg); }
          25% { transform: translate(150px, -20px) rotate(5deg); }
          50% { transform: translate(300px, 10px) rotate(15deg); }
          75% { transform: translate(450px, -10px) rotate(5deg); }
          100% { transform: translate(600px, 20px) rotate(10deg); }
        }
        @keyframes marquee {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        @keyframes loading {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
