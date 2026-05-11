import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from 'motion/react';
import { auth, db, getDb, switchToDefaultDb } from './services/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, collection, getDocs, onSnapshot, serverTimestamp, increment, query, orderBy, limit, addDoc } from 'firebase/firestore';
import SlotMachine from './components/SlotMachine/SlotMachine';
import SplashScreen from "./components/ui/SplashScreen";
import DailyRewardPopup from "./components/ui/DailyRewardPopup";
import LoginPage from './views/LoginPage';
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
import { GameGrid, Game } from "./components/ui/GameGrid";
import { CasinoGallery } from "./components/ui/CasinoGallery";
import { GAME_IMAGES } from "./constants/gameAssets";
import GameLoader from "./components/ui/GameLoader";
import GlobalLoader from "./components/ui/GlobalLoader";
import { ToastContainer, ToastType } from "./components/ui/Toast";
import {
  AlertCircle,
  X,
  Menu,
  Search,
  RefreshCw,
  Volume2,
  Mail,
  Flame,
  Gamepad2,
  Hexagon,
  Tv,
  Club,
  ChevronLeft,
  ChevronRight,
  Home,
  Gift,
  Users,
  Wallet,
  User,
  Star,
  Trophy,
  Share2,
  Send,
  Fish,
  Ticket,
  Play,
  Info,
  ArrowLeft,
  LogOut,
  Copy,
  Check,
  Download,
  Bell,
  Moon,
  Sun,
  ArrowDownLeft,
  Zap,
  Loader2,
  Bot,
  MessageCircle,
  MessageSquare
} from "lucide-react";

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [dbStatus, setDbStatus] = useState<'testing' | 'success' | 'error'>('testing');
  const [isAuthInitialized, setIsAuthInitialized] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [isGameLoading, setIsGameLoading] = useState(false);
  const [iframeError, setIframeError] = useState(false);
  const [globalLogos, setGlobalLogos] = useState<Record<string, string>>({});
  const [globalNames, setGlobalNames] = useState<Record<string, string>>({});
  const [globalUrls, setGlobalUrls] = useState<Record<string, string>>({});
  const [globalOptions, setGlobalOptions] = useState<Record<string, string>>({});
  const [globalImages, setGlobalImages] = useState<Record<string, string>>({});
  const [balance, setBalance] = useState(0);
  const [allButtonName, setAllButtonName] = useState<string>("ALL");
  const [casinoName, setCasinoName] = useState<string>("SPIN71.BET");
  const [noticeText, setNoticeText] = useState<string>("আমাদের নতুন স্লট মেশিনে বড় জয় নিশ্চিত করুন!");
  const [toasts, setToasts] = useState<{ id: string; message: string; type: ToastType }[]>([]);

  enum OperationType {
    CREATE = 'create',
    UPDATE = 'update',
    DELETE = 'delete',
    LIST = 'list',
    GET = 'get',
    WRITE = 'write',
  }

  function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
    const errInfo = {
      error: error instanceof Error ? error.message : String(error),
      authInfo: {
        userId: auth.currentUser?.uid,
        email: auth.currentUser?.email,
        emailVerified: auth.currentUser?.emailVerified,
      },
      operationType,
      path,
      projectId: 'gen-lang-client-0089977420' // Hardcoded for debugging
    };
    console.error('Firestore Error Detailed:', JSON.stringify(errInfo));
    return errInfo;
  }

  useEffect(() => {
    const testPath = 'config/main';
    const checkDb = async () => {
      try {
        const snapshot = await getDoc(doc(getDb(), testPath));
        console.log('Frontend Firestore check successful, doc exists:', snapshot.exists());
        setDbStatus('success');
      } catch (err: any) {
        if (err.message.includes('NOT_FOUND') || err.code === 'not-found' || err.message.includes('database was not found') || err.code === 'permission-denied' || err.message.toLowerCase().includes('permission')) {
          console.warn("[App] Database check failed (Not Found or Permission Denied), attempting fallback...");
          try {
            const fallbackDb = switchToDefaultDb();
            const fallbackSnap = await getDoc(doc(fallbackDb, testPath));
            console.log('Frontend Firestore fallback successful:', fallbackSnap.exists());
            setDbStatus('success');
          } catch (fallbackErr) {
            console.error("[App] Database fallback also failed:", fallbackErr);
            handleFirestoreError(fallbackErr, OperationType.GET, testPath);
            setDbStatus('error');
          }
        } else {
          handleFirestoreError(err, OperationType.GET, testPath);
          setDbStatus('error');
        }
      }
    };
    checkDb();
  }, []);
  const [showLoginModal, setShowLoginModal] = useState(false);

  const [activeTab, setActiveTab] = useState<'home' | 'slot' | 'profile' | 'invite' | 'deposit' | 'bonus' | 'wallet' | 'faq' | 'leaderboard' | 'terms' | 'analytics' | 'admin' | 'learning' | 'settings' | 'history'>('home');
  const [profileSubTab, setProfileSubTab] = useState<string>('dashboard');

  // Auto-hide splash screen
  useEffect(() => {
    if (showSplash) {
      const timer = setTimeout(() => {
        setShowSplash(false);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [showSplash]);

  // URL Syncing
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      if (path === '/') {
        setActiveTab('home');
      } else if (path.startsWith('/member/')) {
        const subPath = path.replace('/member/', '');
        if (subPath === 'wallet') {
          setActiveTab('wallet');
        } else if (subPath === 'deposit') {
          setActiveTab('deposit');
        } else if (subPath === 'bonus') {
          setActiveTab('bonus');
        } else if (subPath === 'referral') {
          setActiveTab('invite');
        } else if (subPath === 'learning') {
          setActiveTab('learning');
        } else if (subPath === 'settings') {
          setActiveTab('settings');
        } else {
          setActiveTab('profile');
          setProfileSubTab(subPath || 'dashboard');
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    handlePopState(); // Initial check

    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    let newPath = '/';
    if (activeTab === 'profile') {
      newPath = `/member/${profileSubTab}`;
    } else if (activeTab === 'wallet') {
      newPath = '/member/wallet';
    } else if (activeTab === 'deposit') {
      newPath = '/member/deposit';
    } else if (activeTab === 'bonus') {
      newPath = '/member/bonus';
    } else if (activeTab === 'invite') {
      newPath = '/member/referral';
    } else if (activeTab === 'learning') {
      newPath = '/member/learning';
    } else if (activeTab === 'settings') {
      newPath = '/member/settings';
    } else if (activeTab === 'home') {
      newPath = '/';
    }

    if (window.location.pathname !== newPath) {
      window.history.pushState({}, '', newPath);
    }
  }, [activeTab, profileSubTab]);
  const [activeCategory, setActiveCategory] = useState('সেরা');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [showGallery, setShowGallery] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showPromoModal, setShowPromoModal] = useState(false);
  const [showDailyReward, setShowDailyReward] = useState(false);
  const [dailyStreak, setDailyStreak] = useState(0);
  const [selectedOdds, setSelectedOdds] = useState(2.0);
  const [betGameName, setBetGameName] = useState("Casino Game");

  const [justLoggedIn, setJustLoggedIn] = useState(false);
  const [showDepositRequired, setShowDepositRequired] = useState(false);

  const [isTabLoading, setIsTabLoading] = useState(false);
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState(false);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('theme');
    return (saved as 'light' | 'dark') || 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const handleTabChange = (tab: any) => {
    if (tab === activeTab) return;
    
    // Protect certain tabs
    const protectedTabs = ['profile', 'deposit', 'bonus', 'wallet', 'invite', 'admin'];
    if (!isLoggedIn && protectedTabs.includes(tab)) {
      setShowLoginModal(true);
      showToast("এই অপশনটি ব্যবহার করতে লগইন করুন", "info");
      return;
    }

    setIsTabLoading(true);
    setTimeout(() => {
      setActiveTab(tab);
      if (tab === 'profile') {
        setProfileSubTab('dashboard');
      }
      setIsTabLoading(false);
    }, 500);
  };

  const handleNavigate = (tab: string, subTab?: string) => {
    setActiveTab(tab as any);
    if (subTab) {
      setProfileSubTab(subTab as any);
    }
  };

  const [recentlyPlayed, setRecentlyPlayed] = useState<Game[]>([]);



  const handleGameSelect = async (game: Game | null) => {
    if (game) {
      if (!isLoggedIn) {
        setShowLoginModal(true);
        showToast("গেম খেলতে লগইন করুন", "info");
        return;
      }

      if (game.id === 'native_slot') {
        setActiveTab('slot');
        return;
      }

      const hasDeposited = (userData?.totalDeposits && userData.totalDeposits > 0) || (userData?.balance && userData.balance > 0);
      if (!hasDeposited) {
        setShowDepositRequired(true);
        return;
      }
    }

    setSelectedGame(game);
    setIframeError(false);
    setIsGameLoading(!!game);
    if (game && userData?.id) {
      // Update recently played list
      const updatedList = [game, ...recentlyPlayed.filter(g => g.id !== game.id)].slice(0, 10);
      setRecentlyPlayed(updatedList);
    }
  };

  useEffect(() => {
    if (isGameLoading && selectedGame) {
      const isNative = !globalUrls[selectedGame.id] && selectedGame.id !== 'rocket_1' && selectedGame.provider !== 'Generic';
      // Just simulate load for 3 seconds either way for better UX
      const timer = setTimeout(() => {
        setIsGameLoading(false);
      }, 3000); 
      return () => clearTimeout(timer);
    }
  }, [isGameLoading, selectedGame, globalUrls]);

  useEffect(() => {
    console.log("App booting...");
    
    // Check server health
    fetch('/api/health')
      .then(res => res.json())
      .then(data => console.log('Server Health Check:', data))
      .catch(err => console.error('Server Health Check Failed:', err));

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log("Auth state changed:", user?.uid);
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            let data = userDoc.data();
            
            // Ensure referralCode exists for old users
            if (!data.referralCode) {
              const newRefCode = Math.random().toString(36).substring(2, 8).toUpperCase();
              await updateDoc(doc(db, 'users', user.uid), { referralCode: newRefCode });
              data.referralCode = newRefCode;
            }

            // Upgrade role if the user is owner.css13@gmail.com
            if (user.email === 'owner.css13@gmail.com' && data.role !== 'admin') {
              await updateDoc(doc(db, 'users', user.uid), { role: 'admin' });
              data.role = 'admin';
            }
            
            setUserData({ id: user.uid, ...data });
            setIsLoggedIn(true);
            setBalance(data.balance || 0);
          } else {
            // New user from social login maybe?
            const cleanDisplayName = (user.displayName || 'Guest').replace(/[^a-zA-Z0-9]/g, '').substring(0, 13) || `u${user.uid.substring(0,5)}`;
            const isAdminEmail = user.email === 'owner.css13@gmail.com';
            const newData = {
              username: cleanDisplayName,
              email: user.email || "",
              balance: 507,
              role: isAdminEmail ? 'admin' : 'user',
              createdAt: new Date().toISOString()
            };
            await setDoc(doc(db, 'users', user.uid), newData);
            setUserData({ id: user.uid, ...newData });
            setIsLoggedIn(true);
            setBalance(507);
          }
        } catch (err) {
          console.error("Error fetching user data:", err);
        }
      } else {
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
          setUserData(JSON.parse(savedUser));
          setIsLoggedIn(true);
        } else {
          setIsLoggedIn(false);
          setUserData(null);
        }
      }
      setIsAuthInitialized(true);
    });

    // Safety fallback
    const fallbackTimer = setTimeout(() => {
      setIsAuthInitialized(true);
    }, 5000);

    return () => {
      unsubscribe();
      clearTimeout(fallbackTimer);
    };
  }, []);

  const handleLogin = (user: any) => {
    setUserData(user);
    setIsLoggedIn(true);
    localStorage.setItem('currentUser', JSON.stringify(user));
    
    // Notify Telegram about login
    fetch('/api/telegram/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: `🔑 <b>User Session Started!</b>\n\n👤 <b>Username:</b> ${user.username || 'Unknown'}\n🔢 <b>UID:</b> <code>${user.id || user.uid || 'N/A'}</code>\n🌐 <b>App:</b> JETA9`
      })
    }).catch(e => console.error("Login notify error", e));
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUserData(null);
      setIsLoggedIn(false);
      localStorage.removeItem('currentUser');
      setActiveTab('home');
      showToast("সাফল্যের সাথে লগ আউট করা হয়েছে", "success");
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  const compressImage = (base64Str: string, maxWidth = 1200, maxHeight = 1200, quality = 0.7): Promise<string> => {
    return new Promise((resolve) => {
      // If it's not a data URL (e.g. it's already a link), just return it
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

        // Calculate new dimensions
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
          resolve(base64Str); // Fallback
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Get compressed base64
        const compressed = canvas.toDataURL('image/jpeg', quality);
        
        // Final check: if compressed is still too big, try even lower quality
        if (compressed.length > 1000000) {
          resolve(canvas.toDataURL('image/jpeg', quality * 0.5));
        } else {
          resolve(compressed);
        }
      };
      img.onerror = () => resolve(base64Str);
    });
  };

  const handleUpdateGlobalGameLogo = async (gameId: string, logo: string) => {
    let finalLogo = logo;
    // Check if image is larger than 500KB (approx 680,000 characters in base64)
    if (logo.startsWith('data:image/') && logo.length > 200000) {
      showToast("ছবি রিসাইজ করা হচ্ছে (Compressing)...", "info");
      finalLogo = await compressImage(logo, 300, 400, 0.7); // Game logos in grid don't need to be huge
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

  // Fetch all app config data once
  const loadAllAppConfig = async () => {
    try {
      // Load game settings
      const gameSettingsSnapshot = await getDocs(collection(db, 'game_settings'));
      const logos: Record<string, string> = {};
      const names: Record<string, string> = {};
      const urls: Record<string, string> = {};
      const options: Record<string, string> = {};
      gameSettingsSnapshot.forEach((doc) => {
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

      // Load global images
      const imagesSnapshot = await getDocs(collection(db, 'global_images'));
      const images: Record<string, string> = {};
      imagesSnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.url) {
          images[doc.id] = data.url;
        }
      });
      setGlobalImages(prev => ({ ...prev, ...images }));

      // Load general settings
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
    } catch (err) {
      console.error("Error loading app config:", err);
    }
  };

  useEffect(() => {
    loadAllAppConfig();
    // migrateOldImages() is removed as it was also likely triggering unnecessary reads/writes
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      // User-specific subscriptions or logic can go here
    }
  }, [isLoggedIn]);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSupportChatOpen, setIsSupportChatOpen] = useState(false);
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false);
  const [isGlobalChatOpen, setIsGlobalChatOpen] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showRegistrationSuccess, setShowRegistrationSuccess] = useState(false);
  const [telegramLink, setTelegramLink] = useState<string>("https://t.me/spin71bet_official");
  const [whatsappLink, setWhatsappLink] = useState<string>("https://wa.me/...");
  const [facebookLink, setFacebookLink] = useState<string>("https://facebook.com/...");
  const [supportEmail, setSupportEmail] = useState<string>("support@example.com");
  const [minDeposit, setMinDeposit] = useState<number>(100);
  const [minWithdraw, setMinWithdraw] = useState<number>(100);
  const [welcomeBonus, setWelcomeBonus] = useState<number>(507);

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
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1000);
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

  const [isDataLoading, setIsDataLoading] = useState(false);

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
    
    if (isLoggedIn && !showSplash) {
      checkDailyReward();
    }
  }, [isLoggedIn, showSplash, userData?.lastClaimedReward]);

  const handleClaimDailyReward = async (amount: number) => {
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const response = await fetch('/api/game/rewards/daily', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken })
      });
      const data = await response.json();
      if (data.success) {
        showToast(`৳${amount} ডেইলি রিওয়ার্ড দাবি করা হয়েছে!`, "success");
        setBalance(prev => prev + amount);
        setUserData((prev: any) => ({ ...prev, lastClaimedReward: new Date().toISOString().split('T')[0] }));
      } else {
        showToast(data.error || "রিওয়ার্ড দাবি করতে সমস্যা হয়েছে", "error");
      }
    } catch (error) {
       showToast("নেটওয়ার্ক সমস্যা", "error");
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

  if (showSplash) {
    return <SplashScreen />;
  }

  if (isDataLoading && !showRegistrationSuccess) {
    return <GlobalLoader message="অ্যাকাউন্ট লোড হচ্ছে" subMessage="আপনার প্রোফাইল প্রস্তুত করা হচ্ছে" type="data" />;
  }

  if (!isAuthInitialized) {
    return <GlobalLoader message="নিরাপত্তা নিশ্চিত করা হচ্ছে" subMessage="AUTH INITIALIZING..." />;
  }

  if (!isLoggedIn || showRegistrationSuccess) {
     return (
        <div className="max-w-[512px] mx-auto bg-black min-h-[100dvh] relative">
          <LoginPage 
            onRegisterSuccess={() => {
              setShowRegistrationSuccess(true);
            }} 
            onContinue={() => {
              setShowRegistrationSuccess(false);
            }} 
            onLoginSuccess={(user) => {
              handleLogin(user);
            }}
            showToast={showToast}
            casinoName={casinoName}
            isLoggedIn={isLoggedIn}
            welcomeBonus={welcomeBonus}
          />
          <ToastContainer toasts={toasts} removeToast={removeToast} />
        </div>
     );
  }

  if (activeTab === 'admin' && (userData?.role === 'admin' || userData?.isAdmin === true)) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <AdminPanelView 
          onBack={() => handleTabChange('home')} 
          showToast={showToast} 
          userData={userData}
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
          casinoName={casinoName}
          updateCasinoName={updateCasinoName}
          noticeText={noticeText}
          setNoticeText={setNoticeText}
          minDeposit={minDeposit}
          setMinDeposit={setMinDeposit}
          minWithdraw={minWithdraw}
          setMinWithdraw={setMinWithdraw}
          welcomeBonus={welcomeBonus}
          setWelcomeBonus={setWelcomeBonus}
          telegramLink={telegramLink}
          setTelegramLink={setTelegramLink}
          globalImages={globalImages}
          updateGlobalImage={handleUpdateGlobalImage}
          onAddUser={handleAddUser}
        />
        <ToastContainer toasts={toasts} removeToast={removeToast} />
      </div>
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
                setShowGallery={setShowGallery}
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
          {activeTab === 'leaderboard' && (
            <motion.div
              key="leaderboard"
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
