import React, { useState, useEffect, useRef } from "react";
import canvasConfetti from 'canvas-confetti';
import { formatDisplayUID } from './utils/idUtils';
import { SoundProvider } from './context/SoundContext';
import { LanguageProvider } from './context/LanguageContext';
import { motion, AnimatePresence } from 'motion/react';
import { auth, getDb, switchToDefaultDb } from './services/firebase';
import { apiService } from './services/apiService';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, deleteDoc, collection, getDocs, onSnapshot, serverTimestamp, increment, query, orderBy, limit, runTransaction } from 'firebase/firestore';
import SlotMachine from './components/SlotMachine/SlotMachine';
import AviatorGame from './components/AviatorGame/AviatorGame';
import DailyRewardPopup from "./components/ui/DailyRewardPopup";
import BonusCenter from './views/BonusCenter';
import AdminPanelView from "./views/AdminPanelView";
import AnalyticsView from "./views/AnalyticsView";
import ActivityHistory from "./views/ActivityHistory";
import ProfileView from "./views/ProfileView";
import InviteView from "./views/InviteView";
import LeaderboardView from "./views/LeaderboardView";
import HomeView from "./views/HomeView";
import LoginPage from "./views/LoginPage";
import DepositView from "./views/DepositView";
import WalletView from "./views/WalletView";
import { AnimatedBalance } from './components/AnimatedBalance';
import SupportChat from "./layout/SupportChat";
import NotificationOverlay from "./components/ui/NotificationOverlay";
import PromoCodeModal from "./components/modals/PromoCodeModal";
import AppInstallModal from "./components/modals/AppInstallModal";
import AutoLogoutModal from "./components/modals/AutoLogoutModal";
import { PWAInstallBanner } from "./components/PWAInstallBanner";

import DepositRequiredModal from "./components/ui/DepositRequiredModal";

import NotificationCenter from "./layout/NotificationCenter";
import FAQView from "./views/FAQView";
import BottomNav from "./components/BottomNav";
import Sidebar from "./layout/Sidebar";
import AIAssistant from "./layout/AIAssistant";
import GlobalChat from "./layout/GlobalChat";
import SettingsView from "./views/SettingsView";
import { Game } from "./components/ui/GameGrid";
import { games } from "./constants/games";
import { GAME_LOGO_URLS } from "./constants/gameLogos";
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
  Gamepad2,
  Info,
} from "lucide-react";
import RecentlyViewed from "./components/RecentlyViewed";

const triggerPushNotification = (title: string, body: string, targetUrl?: string) => {
  const isEnabled = localStorage.getItem('app_push_notif') !== 'false';
  const defaultLogo = 'https://www.image2url.com/r2/default/images/1781024598371-46bd7cc9-4b5f-49cd-b4b3-60d4d200534a.png';
  if (isEnabled && 'Notification' in window && Notification.permission === 'granted') {
    try {
      if (navigator.serviceWorker && navigator.serviceWorker.ready) {
        navigator.serviceWorker.ready.then((registration) => {
          registration.showNotification(title, {
            body: body,
            icon: defaultLogo,
            badge: '/apple-touch-icon.png',
            data: {
              url: targetUrl || '/'
            },
            vibrate: [200, 100, 200]
          } as any);
        });
      } else {
        new Notification(title, {
          body: body,
          icon: defaultLogo
        });
      }
    } catch (e) {
      console.error("[Push Service Error]:", e);
    }
  }
};

export default function App() {
  const db = getDb();
  const [dbStatus, setDbStatus] = useState<'testing' | 'success' | 'error'>('testing');
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [showRegistrationSuccess, setShowRegistrationSuccess] = useState(false);
  const [supportEmail, setSupportEmail] = useState<string>("support@spin71.bet");
  const [isGameLoading, setIsGameLoading] = useState(false);
  const [notification, setNotification] = useState<{isOpen: boolean; message: string; type: 'success' | 'info' | 'error'}>({ isOpen: false, message: '', type: 'info' });
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
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showExitPopup, setShowExitPopup] = useState(false);
  const [activeTab, setActiveTab] = useState<'home' | 'slot' | 'aviator' | 'profile' | 'invite' | 'deposit' | 'bonus' | 'wallet' | 'faq' | 'leaderboard' | 'terms' | 'analytics' | 'admin' | 'settings' | 'history' | 'register' | 'login'>(() => {
    const rawPath = window.location.pathname.replace(/^\/+|$/g, '').split('/')[0];
    const validTabs: any[] = ['home', 'slot', 'aviator', 'profile', 'invite', 'deposit', 'bonus', 'wallet', 'faq', 'leaderboard', 'terms', 'analytics', 'admin', 'settings', 'history', 'register', 'login'];
    if (validTabs.includes(rawPath)) {
      if (rawPath === 'register' || rawPath === 'login') return 'home';
      return rawPath as any;
    }
    return 'home';
  });

  const [profileSubTab, setProfileSubTab] = useState<string>('dashboard');
  const [recentlyPlayed, setRecentlyPlayed] = useState<Game[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);

  useEffect(() => {
    if (!['aviator', 'slot', 'crashx'].includes(activeTab) && !selectedGame) {
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(e => console.log(e));
      }
    }
  }, [activeTab, selectedGame]);
  const [activeCategory, setActiveCategory] = useState('সেরা');
  const [searchQuery, setSearchQuery] = useState("");
  const [showPromoModal, setShowPromoModal] = useState(false);
  const [showDailyReward, setShowDailyReward] = useState(false);
  const [dailyStreak, setDailyStreak] = useState(0);
  const [isTabLoading, setIsTabLoading] = useState(false);
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState(false);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [activePopupMessage, setActivePopupMessage] = useState<{ id: string; title: string; message: string; sender?: string } | null>(null);

  const handleMarkNotifAsRead = async (id: string) => {
    if (!userData?.id) return;
    try {
      await updateDoc(doc(db, 'users', userData.id, 'notifications', id), { read: true });
    } catch (e) { console.error("Notif update failed", e); }
  };

  const handleDeleteNotif = async (id: string) => {
    if (!userData?.id) return;
    try {
      await deleteDoc(doc(db, 'users', userData.id, 'notifications', id));
    } catch (e) { console.error("Notif delete failed", e); }
  };
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSupportChatOpen, setIsSupportChatOpen] = useState(false);
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false);
  const [isGlobalChatOpen, setIsGlobalChatOpen] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [telegramLink, setTelegramLink] = useState<string>("https://t.me/spin71_predictor_bot");
  const [whatsappLink, setWhatsappLink] = useState<string>("https://wa.me/...");
  const [facebookLink, setFacebookLink] = useState<string>("https://facebook.com/...");
  const [minDeposit, setMinDeposit] = useState<number>(100);
  const [minWithdraw, setMinWithdraw] = useState<number>(100);
  const [welcomeBonus, setWelcomeBonus] = useState<number>(507);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [showDepositRequired, setShowDepositRequired] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginModalMode, setLoginModalMode] = useState<'login' | 'register'>('login');
  const [userData, setUserData] = useState<any>(null); // State to store user info from DB
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  // Auto-logout inactivity states
  const [showAutoLogoutWarning, setShowAutoLogoutWarning] = useState(false);
  const [autoLogoutCountdown, setAutoLogoutCountdown] = useState(60);
  const lastActivityTime = useRef<number>(Date.now());

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    const handleOpenSupportChat = () => {
      if (!auth.currentUser) {
        showToast("চ্যাট করতে লগইন করুন", "info");
        setShowLoginModal(true);
      } else {
        if ((window as any).$crisp) {
          (window as any).$crisp.push(["do", "chat:show"]);
          (window as any).$crisp.push(["do", "chat:open"]);
        } else {
          setIsSupportChatOpen(true);
        }
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('openSupportChat', handleOpenSupportChat);

    // Hide default Crisp launcher icon (it covers UI) so we can use our custom button
    let crispInterval = setInterval(() => {
      if ((window as any).$crisp) {
        (window as any).$crisp.push(["do", "chat:hide"]);
        (window as any).$crisp.push(["on", "chat:closed", () => {
          (window as any).$crisp.push(["do", "chat:hide"]);
        }]);
        clearInterval(crispInterval);
      }
    }, 1000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('openSupportChat', handleOpenSupportChat);
      clearInterval(crispInterval);
    };
  }, []);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  useEffect(() => {
    const rawPath = window.location.pathname.replace(/^\/+|$/g, '').split('/')[0];
    const validTabs: any[] = ['home', 'slot', 'aviator', 'profile', 'invite', 'deposit', 'bonus', 'wallet', 'faq', 'leaderboard', 'terms', 'analytics', 'admin', 'settings', 'history', 'register', 'login'];
    const tabToUse = validTabs.includes(rawPath) ? (rawPath === 'register' || rawPath === 'login' ? 'home' : rawPath) : 'home';

    if (rawPath === 'register') {
      setLoginModalMode('register');
      setShowLoginModal(true);
    } else if (rawPath === 'login') {
      setLoginModalMode('login');
      setShowLoginModal(true);
    }

    // Check if we are already dealing with our structured history (e.g., hot refresh)
    if (!window.history.state || window.history.state.tab !== tabToUse) {
      // Setup the initial trap state backwards
      const displayPath = rawPath || (tabToUse === 'home' ? '' : tabToUse);
      window.history.replaceState({ page: 'exit-trap' }, '', `/${displayPath}${window.location.search}`);
      window.history.pushState({ page: 'tab', tab: tabToUse }, '', `/${displayPath}${window.location.search}`);
    }

    const handlePopState = (event: PopStateEvent) => {
      const state = event.state;
      
      // Close any open full-screen overlays when back is pressed
      setSelectedGame(null);
      setShowLoginModal(false);
      
      if (state && state.page === 'exit-trap') {
        setShowExitPopup(true);
        // Put the state back so user doesn't actually exit yet
        const currentPath = window.location.pathname.replace(/^\/+|$/g, '').split('/')[0] || 'home';
        window.history.pushState({ page: 'tab', tab: currentPath }, '', `/${currentPath}`);
      } else if (state && (state.tab || state.path)) {
        const targetTab = state.tab || 'home';
        setActiveTab(targetTab);
        setShowExitPopup(false);
      } else {
        // Fallback
        const path = window.location.pathname.replace(/^\/+|$/g, '').split('/')[0];
        if (validTabs.includes(path)) {
          setActiveTab(path === 'register' || path === 'login' ? 'home' : path as any);
          if (path === 'register') {
            setLoginModalMode('register');
            setShowLoginModal(true);
          } else if (path === 'login') {
            setLoginModalMode('login');
            setShowLoginModal(true);
          }
        } else {
          setActiveTab('home');
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Synchronize URL pathname with activeTab state automatically
  useEffect(() => {
    const rawPath = window.location.pathname.replace(/^\/+|$/g, '').split('/')[0];
    if (rawPath !== activeTab) {
      const displayPath = activeTab === 'home' ? '' : activeTab;
      window.history.pushState({ page: 'tab', tab: activeTab }, '', `/${displayPath}${window.location.search}`);
    }
  }, [activeTab]);

  const handleTabChange = (tab: any) => {
    if (!isLoggedIn && tab !== 'home') {
      showToast("এই পেজটি দেখতে দয়া করে নিবন্ধন করুন", "info");
      setLoginModalMode('register');
      setShowLoginModal(true);
      return;
    }

    // Lock games behind a deposit requirement
    if (tab === 'slot' || tab === 'aviator') {
      // Require at least one approved deposit to play games
      const isAdmin = userData?.role === 'admin' || userData?.isAdmin === true;
      if (!isAdmin && (!userData?.totalDeposits || userData.totalDeposits <= 0)) {
        setShowDepositRequired(true);
        return;
      }
    }

    if (tab === activeTab) return;

    const displayPath = tab === 'home' ? '' : tab;
    window.history.pushState({ page: 'tab', tab: tab }, '', `/${displayPath}${window.location.search}`);
    setIsTabLoading(true);
    // Professional delay to ensure smooth transition and show the loading state
    setTimeout(() => {
      setActiveTab(tab);
      // Small buffer to let the new view render
      setTimeout(() => {
        setIsTabLoading(false);
      }, 400);
    }, 700);
  };
  
  const handleLogout = async () => {
    try {
      await auth.signOut();
      setIsLoggedIn(false);
      setUserData(null);
      setBalance(0);
      localStorage.removeItem('currentUser');
      showToast("লগআউট সফল হয়েছে", "info");
      setActiveTab('home');
    } catch (err) {
      console.error("Logout error:", err);
      showToast("লগআউট করতে সমস্যা হয়েছে", "error");
    }
  };

  // Auto-logout inactivity tracking hook (30 minutes)
  useEffect(() => {
    if (!isLoggedIn) {
      setShowAutoLogoutWarning(false);
      return;
    }

    lastActivityTime.current = Date.now();

    const handleUserActivity = () => {
      lastActivityTime.current = Date.now();
      // Reset is triggered on any basic interaction
      setShowAutoLogoutWarning(prev => {
        if (prev) return false;
        return prev;
      });
    };

    const activityEvents = [
      'mousemove',
      'mousedown',
      'keypress',
      'scroll',
      'touchstart',
      'click'
    ];

    activityEvents.forEach(event => {
      window.addEventListener(event, handleUserActivity, { passive: true });
    });

    const checkInterval = setInterval(() => {
      const inactiveMs = Date.now() - lastActivityTime.current;
      const warningThreshold = 29 * 60 * 1000; // Warning at 29 minutes
      const logoutThreshold = 30 * 60 * 1000;  // Logout at 30 minutes

      if (inactiveMs >= logoutThreshold) {
        clearInterval(checkInterval);
        handleLogout();
      } else if (inactiveMs >= warningThreshold) {
        setShowAutoLogoutWarning(true);
        const secRemaining = Math.max(0, Math.ceil((logoutThreshold - inactiveMs) / 1000));
        setAutoLogoutCountdown(secRemaining);
      } else {
        setShowAutoLogoutWarning(false);
      }
    }, 1000);

    return () => {
      activityEvents.forEach(event => {
        window.removeEventListener(event, handleUserActivity);
      });
      clearInterval(checkInterval);
    };
  }, [isLoggedIn]);

  const handleUpdateGlobalGameLogo = async (gameId: string, logo: string) => {
    let finalLogo = logo;
    if (logo.startsWith('data:image/') && logo.length > 200000) {
      showToast("ছবি রিসাইজ করা হচ্ছে (Compressing)...", "info");
      finalLogo = await compressImage(logo, 300, 400, 0.7);
    }

    setGlobalLogos(prev => {
      const newLogos = { ...prev, [gameId]: finalLogo };
      try { localStorage.setItem('game_logos_cache', JSON.stringify(newLogos)); } catch(e){}
      return newLogos;
    });
    
    try {
      await setDoc(doc(db, 'game_settings', gameId), { 
        game_id: gameId, 
        logo_url: finalLogo,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      showToast("গেম লোগো সফলভাবে আপডেট করা হয়েছে এবং সবার জন্য সেভ হয়েছে", "success");
    } catch (err: any) {
      console.error("Error persisting logo:", err);
      if (err.message && err.message.includes('Quota')) {
        showToast("ডাটাবেসের লিমিট ক্রস হয়েছে, কিন্তু লোগো আপনার ব্রাউজারে অফলাইনে সেভ হয়েছে।", "error");
      } else {
        showToast("ডাটাবেসে সেভ করতে সমস্যা হয়েছে", "error");
      }
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

  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBanner(true);
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setShowInstallBanner(false);
      showToast("আপনার ফোনে অ্যাপটি সফলভাবে ইনস্টল করা হয়েছে!", "success");
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallApp = async () => {
    setIsInstallModalOpen(true);
  };

  const triggerImmediatePwaInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setShowInstallBanner(false);
      setIsInstallModalOpen(false);
    }
  };

  const handleUpdateGlobalImage = async (imageKey: string, url: string) => {
    let finalUrl = url;
    if (url.startsWith('data:image/') && url.length > 680000) {
      showToast("ছবি রিসাইজ করা হচ্ছে (Compressing)...", "info");
      finalUrl = await compressImage(url, 1200, 1200, 0.7);
    }
    setGlobalImages(prev => {
       const newImages = { ...prev, [imageKey]: finalUrl };
       try { localStorage.setItem('global_images_cache', JSON.stringify(newImages)); } catch(e){}
       return newImages;
    });
    try {
      await setDoc(doc(db, 'global_images', imageKey), { 
        url: finalUrl,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      showToast("লোগো/ছবি সফলভাবে আপডেট করা হয়েছে এবং সবার জন্য সেভ হয়েছে", "success");
    } catch (err: any) {
      console.error("Error persisting global image:", err);
      if (err.message && err.message.includes('Quota')) {
        showToast("ডাটাবেসের লিমিট ক্রস হয়েছে, কিন্তু লোগো আপনার ব্রাউজারে অফলাইনে সেভ হয়েছে।", "error");
      } else {
        showToast("ডাটাবেসে সেভ করতে সমস্যা হয়েছে", "error");
      }
      throw err;
    }
  };

  const handleAddUser = async (user: any) => {
    try {
      const token = await auth.currentUser?.getIdToken();
      const response = await fetch('/api/admin/users/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(user)
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to create user");

      showToast("ইউজার সফলভাবে তৈরি করা হয়েছে", "success");
    } catch (err: any) {
      console.error("Add user error:", err);
      showToast(err.message || "ইউজার তৈরি করতে সমস্যা হয়েছে", "error");
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
    handleTabChange(tab as any);
    if (subTab) {
      setProfileSubTab(subTab as any);
    }
  };

  const handleGameSelect = async (game: Game | null) => {
    if (game) {
      if (!isLoggedIn) {
        showToast("গেম খেলতে নিবন্ধন করুন", "info");
        setLoginModalMode('register');
        setShowLoginModal(true);
        return;
      }

      // GLOBAL DEPOSIT CHECK - Requirement: At least one deposit to play any game
      const isAdmin = userData?.role === 'admin' || userData?.isAdmin === true;
      if (!isAdmin && (!userData?.totalDeposits || userData.totalDeposits <= 0)) {
        showToast("গেম খেলতে হলে আগে অন্তত একবার ডিপোজিট করতে হবে", "warning");
        setShowDepositRequired(true);
        return;
      }

      if (balance <= 0) {
        showToast("আপনার ব্যালেন্স যথেষ্ট নয়", "error");
        return;
      }

      // Start loading sequence
      setIsTabLoading(true);

      // Attempt App Fullscreen immediately
      const elem = document.documentElement;
      if (elem.requestFullscreen) {
        elem.requestFullscreen().catch(e => console.log("Fullscreen request failed:", e));
      }

      // Notify Telegram
      try {
        fetch('/api/telegram/event', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'Game Entry',
            userId: userData?.id,
            username: userData?.username,
            balance: balance,
            gameName: game.name
          })
        }).catch(e => console.warn("Telegram notify skipped or offline:", e));
      } catch (e) {
        console.warn("Telegram notify skipped or offline:", e);
      }

      // System Log for game launch
      try {
        const logRef = doc(collection(getDb(), 'system_logs'));
        setDoc(logRef, {
          type: 'game',
          action: 'game_launched',
          details: { gameId: game.id, gameName: game.name },
          userId: userData?.id || 'unknown',
          createdAt: serverTimestamp()
        }).catch(err => console.error("Game log error", err));
      } catch(e) {
        console.warn("System Log skipped:", e);
      }

      setTimeout(() => {
        if (game.id === 'spribe_aviator') {
          if (userData?.id) {
            const updatedList = [game, ...recentlyPlayed.filter(g => g.id !== game.id)].slice(0, 10);
            setRecentlyPlayed(updatedList);
          }
          setActiveTab('aviator');
          setTimeout(() => setIsTabLoading(false), 500);
          return;
        }

        window.history.pushState({ page: 'game', tab: activeTab }, '');
        setSelectedGame(game);
        setIsGameLoading(!!game);
        if (game && userData?.id) {
          // Update recently played list
          const updatedList = [game, ...recentlyPlayed.filter(g => g.id !== game.id)].slice(0, 10);
          setRecentlyPlayed(updatedList);
        }
        setIsTabLoading(false);
      }, 800);
    } else {
      setSelectedGame(null);
      setIsGameLoading(false);
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

  // Removed auto-showing login modal to allow guest home page access

  // Auth listener
  useEffect(() => {
    let userUnsubscribe: (() => void) | undefined;
    let notificationsUnsubscribe: (() => void) | undefined;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log("[App] Auth state changed:", user ? `LoggedIn: ${user.uid}` : "LoggedOut");
      
      // Cleanup previous listeners
      if (userUnsubscribe) userUnsubscribe();
      if (notificationsUnsubscribe) notificationsUnsubscribe();
      userUnsubscribe = undefined;
      notificationsUnsubscribe = undefined;
      
      const processUserSession = async (retryCount = 0) => {
        try {
          if (user) {
            setIsLoggedIn(true);
            
            // Set up consolidated real-time listener for user document
            const userRef = doc(db, 'users', user.uid);
            userUnsubscribe = onSnapshot(userRef, (snapshot) => {
              if (snapshot.exists()) {
                const data = snapshot.data();
                console.log("[App] Real-time user update received", user.uid, "New Balance:", data.balance);
                
                const isAdmin = data.role === 'admin' || data.isAdmin === true || user.email === 'owner.css13@gmail.com' || user.email === 'cutelegend7045@gmail.com' || user.email === 'xsaber7644@gmil.com' || user.uid === 'vxjksOlXuChe3OjfYmpxBsJcwLH2';
                
                // Ensure existing user has a referralCode
                if (!data.referralCode) {
                  const newCode = data.username ? data.username.toLowerCase().substring(0, 4) + Math.floor(1000 + Math.random() * 9000) : Math.random().toString(36).substring(2, 8).toUpperCase();
                  updateDoc(userRef, { referralCode: newCode }).catch(e => console.error("Referral code fixup failed:", e));
                  data.referralCode = newCode;
                }

                const profileObj = { id: user.uid, ...data, isAdmin };
                setUserData(profileObj);
                setBalance(data.balance || 0);
                
                // Persist profile to cache
                try {
                  localStorage.setItem('cached_user_profile', JSON.stringify(profileObj));
                  localStorage.setItem('offline_balance_cache', (data.balance || 0).toString());
                } catch(e) {}
              } else {
                console.log("[App] User document not found, initializing...", user.uid);
                const isAdmin = user.email === 'owner.css13@gmail.com' || user.email === 'cutelegend7045@gmail.com' || user.email === 'xsaber7644@gmil.com' || user.uid === 'vxjksOlXuChe3OjfYmpxBsJcwLH2';
                const baseName = user.displayName || user.email?.split('@')[0] || 'User';
                const referralCode = baseName.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 4) + Math.floor(1000 + Math.random() * 9000);
                
                const newUser = {
                  id: user.uid,
                  username: baseName,
                  balance: 500,
                  vipLevel: 0,
                  createdAt: serverTimestamp(),
                  lastLogin: serverTimestamp(),
                  isAdmin,
                  referralCode,
                  referralCount: 0,
                  referredBy: null,
                  totalReferralEarnings: 0,
                  profilePictureUrl: "https://www.image2url.com/r2/default/images/1779828873931-409cfe92-d243-4926-91bd-67da3a1e0adc.png"
                };
                setDoc(userRef, newUser).catch(e => console.error("Initial doc creation failed:", e));
                setUserData(newUser);
                setBalance(500);
                try {
                  localStorage.setItem('cached_user_profile', JSON.stringify(newUser));
                  localStorage.setItem('offline_balance_cache', '500');
                } catch(e) {}
              }
              setIsDataLoading(false);
              setDbStatus('success');
            }, (error) => {
               console.error("[App] User listener error:", error);
               
               // Load from cache as fallback on error (like Quota Exceeded)
               try {
                 const cached = localStorage.getItem('cached_user_profile');
                 if (cached) {
                   console.log("[App] Loading user data from local cache due to Firestore error");
                   const profile = JSON.parse(cached);
                   setUserData(profile);
                   setBalance(profile.balance || 0);
                   showToast("সিস্টেম লিমিট শেষ! ক্যাশ থেকে প্রোফাইল লোড করা হয়েছে।", "warning");
                 }
               } catch(e) {}

               if (error.code === 'permission-denied' && auth.currentUser) {
                  console.warn("[App] User listener permission denied");
               }
               setIsDataLoading(false);
               setDbStatus('success');
            });

            // Set up notifications listener
            const notificationsRef = collection(db, 'users', user.uid, 'notifications');
            notificationsUnsubscribe = onSnapshot(notificationsRef, (snapshot) => {
              const localSeeded = localStorage.getItem('notifications_seeded_' + user.uid);
              if (snapshot.empty) {
                if (localSeeded === 'true' || (userData && userData.notificationsSeeded === true)) {
                  setNotifications([]);
                  setUnreadNotificationsCount(0);
                  return;
                }
                const SEED_NOTIFICATIONS = [
                  {
                    title: "দৈনিক পরিশোধ",
                    message: "আপনার অ্যাকাউন্ট এ দৈনিক ক্যাসিনো কমিশন এবং গেম রেট কমিশন সফলভাবে ক্রেডিট করা হয়েছে। নিয়মিত গেম খেলুন ও কমিশন উপভোগ করুন!",
                    sender: "XX999",
                    type: "bonus",
                    read: false,
                    createdAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString()
                  },
                  {
                    title: "✨✨【VIP এক্সক্লুসিভ সুবিধা】✨✨",
                    message: "অভিনন্দন! আপনার ভিআইপি মেম্বারশিপ এর লেভেল-আপ এক্সক্লুসিভ বোনাস ৩৯৯ টাকা সফলভাবে যুক্ত করা হয়েছে।",
                    sender: "ck41bdts2",
                    type: "promotion",
                    read: false,
                    createdAt: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString()
                  },
                  {
                    title: "দৈনিক পরিশোধ",
                    message: "আপনার রেফারেল কমিশন ক্যাশব্যাক সফলভাবে যোগ হয়েছে। এখনই রিচার্জ করে অতিরিক্ত বোনাস পান!",
                    sender: "XX999",
                    type: "bonus",
                    read: false,
                    createdAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString()
                  },
                  {
                    title: "দৈনিক পরিশোধ",
                    message: "ডেইলি রিকভারি লস কমিশন সম্পন্ন হয়েছে। আপনার ব্যালেন্স চেক করে খেলা চালিয়ে যান।",
                    sender: "XX999",
                    type: "bonus",
                    read: false,
                    createdAt: new Date(Date.now() - 1.5 * 24 * 3600 * 1000).toISOString()
                  },
                  {
                    title: "দৈনিক পরিশোধ",
                    message: "আপনার অ্যাকাউন্ট ক্যাশব্যাক ১০০ টাকা সেভ ও ট্র্যান্সফার করা হয়েছে।",
                    sender: "XX999",
                    type: "bonus",
                    read: false,
                    createdAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString()
                  },
                  {
                    title: "দৈনিক পরিশোধ",
                    message: "কমিশন ও উইকলি ট্রানজেকশন বোনাস সফলভাবে অ্যাকাউন্ট ফান্ডে যুক্ত করা হয়েছে।",
                    sender: "XX999",
                    type: "bonus",
                    read: false,
                    createdAt: new Date(Date.now() - 2.2 * 24 * 3600 * 1000).toISOString()
                  },
                  {
                    title: "✨✨【VIP এক্সক্লুসিভ সুবিধা】✨✨",
                    message: "স্পিন৭১ এর ভিআইপি বোনাস ও স্পেশাল সুযোগ নিয়ে এসেছে দুর্দান্ত লাকি ড্র ইভেন্ট!",
                    sender: "ck41bdts2",
                    type: "promotion",
                    read: false,
                    createdAt: new Date(Date.now() - 2.4 * 24 * 3600 * 1000).toISOString()
                  },
                  {
                    title: "✨✨【VIP এক্সক্লুসিভ সুবিধা】✨✨",
                    message: "আপনার প্রথম ডিপোজিট বোনাস ও রেফার লিংক শেয়ার বোনাস ক্লেইম করুন!",
                    sender: "ck41bdts2",
                    type: "promotion",
                     read: false,
                    createdAt: new Date(Date.now() - 2.6 * 24 * 3600 * 1000).toISOString()
                  },
                  {
                    title: "👉 নতুন অংশীদার ঘোষণা 👈",
                    message: "মহাসুসংবাদ! SPIN71 এর নতুন অফিসিয়াল এজেন্ট ও প্রমোশনাল অংশীদার যুক্ত হয়েছে।",
                    sender: "প্ল্যাটফর্ম",
                    type: "info",
                    read: true,
                    createdAt: new Date(Date.now() - 2.8 * 24 * 3600 * 1000).toISOString()
                  }
                ];
                SEED_NOTIFICATIONS.forEach((notif) => {
                  const docRef = doc(collection(db, 'users', user.uid, 'notifications'));
                  setDoc(docRef, notif).catch(e => console.error("Error seeding custom notification list:", e));
                });
                updateDoc(doc(db, 'users', user.uid), { notificationsSeeded: true }).catch(err => {});
                localStorage.setItem('notifications_seeded_' + user.uid, 'true');
                return;
              }
              let unread = 0;
              const notifs: any[] = [];
              snapshot.forEach(docSnap => {
                const data = docSnap.data();
                if (!data.read) unread++;
                notifs.push({
                  id: docSnap.id,
                  ...data,
                  createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : (data.createdAt ? new Date(data.createdAt) : new Date())
                });
              });
              
              // Sort by date desc
              notifs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
              setNotifications(notifs);
              
              snapshot.docChanges().forEach((change) => {
                if (change.type === "added") {
                  const data = change.doc.data();
                  if (!data.read) {
                    const now = Date.now();
                    const createdAt = data.createdAt?.seconds ? data.createdAt.seconds * 1000 : (data.createdAt ? new Date(data.createdAt).getTime() : now);
                    if (now - createdAt < 10000) {
                      // Trigger custom styled pop message matching 3rd screenshot
                      setActivePopupMessage({
                        id: change.doc.id,
                        title: data.title || "নতুন মেসেজ",
                        message: data.message || "দৈনিক পরিশোধ",
                        sender: data.sender || "প্ল্যাটফর্ম"
                      });
                      
                      // Explicitly trigger a real browser native push notification
                      triggerPushNotification(
                        data.title || "Spin71.bet Alert",
                        data.message || "New activity notification",
                        data.url || "/"
                      );

                      if (data.title === "ডিপোজিট সফল" || data.title?.includes("সফল")) {
                        canvasConfetti({
                          particleCount: 150,
                          spread: 70,
                          origin: { y: 0.6 }
                        });
                      }
                    }
                  }
                }
              });
              setUnreadNotificationsCount(unread);
            }, (error) => {
              console.error("[App] Notifications listener error:", error);
            });

          } else {
            setIsLoggedIn(false);
            setUserData(null);
            setIsDataLoading(false);
            setDbStatus('testing');
          }
        } catch (err: any) {
          console.error(`[App] Auth state process error (Attempt ${retryCount + 1}):`, err.message);
          if (retryCount < 3 && (err.message === 'TIMEOUT' || err.message.includes('offline'))) {
             setTimeout(() => processUserSession(retryCount + 1), 1000);
             return;
          }
          setIsDataLoading(false);
          setDbStatus('error');
        }
      };

      processUserSession();
    });
    
    return () => {
      unsubscribe();
      if (userUnsubscribe) userUnsubscribe();
      if (notificationsUnsubscribe) notificationsUnsubscribe();
      logUserActivity('session_end');
    };
  }, [db]);

  // Real-time listener for app config to ensure logos and names are always synced
  useEffect(() => {
    console.log("[App] Initializing real-time game_settings listener...");
    
    const unsubscribe = onSnapshot(collection(db, 'game_settings'), (snapshot) => {
      const logos: Record<string, string> = {};
      const names: Record<string, string> = {};
      const urls: Record<string, string> = {};
      const options: Record<string, string> = {};

      if (snapshot.empty) {
        console.log("[App] game_settings empty, seeding will happen in loadAllAppConfig...");
        return;
      }

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
      
      localStorage.setItem('game_logos_cache', JSON.stringify({ logos, names, urls, options }));
      console.log("[App] Game settings synced real-time from Firestore");
    }, (err) => {
      console.error("[App] Game settings sync error:", err);
    });

    return () => unsubscribe();
  }, [db]);

  // Real-time listener for global images (app logo, etc.) to ensure instant dynamic updates
  useEffect(() => {
    console.log("[App] Initializing real-time global_images listener...");
    
    const unsubscribe = onSnapshot(collection(db, 'global_images'), (snapshot) => {
      const images: Record<string, string> = {};
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.url) images[doc.id] = data.url;
      });
      
      setGlobalImages(prev => ({ ...prev, ...images }));
      localStorage.setItem('global_images_cache', JSON.stringify(images));
      console.log("[App] Global images synced real-time from Firestore:", images);
    }, (err) => {
      console.error("[App] Global images sync error:", err);
    });

    return () => unsubscribe();
  }, [db]);

  // Real-time automatic cleanup of notifications older than 3 days
  useEffect(() => {
    if (!userData?.id || notifications.length === 0) return;
    
    const lastCleanup = localStorage.getItem('last_cleanup_' + userData.id);
    const now = Date.now();
    // Run cleanup at most once every 30 minutes to optimize Firestore reads/writes
    if (lastCleanup && now - parseInt(lastCleanup) < 30 * 60 * 1000) {
      return;
    }
    
    const cleanupOldNotifs = async () => {
      localStorage.setItem('last_cleanup_' + userData.id, now.toString());
      const threeDaysAgo = now - 3 * 24 * 60 * 60 * 1000;
      const oldNotifs = notifications.filter(notif => {
        const dateVal = notif.createdAt instanceof Date ? notif.createdAt.getTime() : new Date(notif.createdAt).getTime();
        return dateVal < threeDaysAgo;
      });

      if (oldNotifs.length > 0) {
        console.log(`[Auto-Cleanup] Deleting ${oldNotifs.length} expired notifications (older than 3 days)...`);
        for (const old of oldNotifs) {
          if (old.id) {
            try {
              await deleteDoc(doc(db, 'users', userData.id, 'notifications', old.id));
              console.log(`[Auto-Cleanup] Permanently deleted expired notification: ${old.id}`);
            } catch (err) {
              console.error("[Auto-Cleanup] Delete error:", err);
            }
          }
        }
      }
    };
    
    cleanupOldNotifs();
  }, [userData?.id, notifications]);

  // Fetch all app config data once
  const loadAllAppConfig = async (retryCount = 0, force = false) => {
    try {
      console.log(`[App] Starting loadAllAppConfig... (Attempt ${retryCount + 1}, force=${force})`);
      setIsRefreshing(true);
      
      const CACHE_KEY = 'app_config_cache_ts';
      const CACHE_EXPIRY = 60 * 60 * 1000; // Increase to 60 minutes
      const now = Date.now();
      const lastFetch = localStorage.getItem(CACHE_KEY);
      
      const shouldFetchFromNetwork = force || !lastFetch || (now - parseInt(lastFetch) > CACHE_EXPIRY) || (retryCount > 0 && retryCount < 3);

      // Use parallel fetching with individual try-catches
      const fetchGameSettings = async () => {
        try {
          const cached = localStorage.getItem('game_logos_cache');
          if (cached) {
            const data = JSON.parse(cached);
            setGlobalLogos(prev => ({ ...prev, ...data.logos }));
            setGlobalNames(prev => ({ ...prev, ...data.names }));
            setGlobalUrls(prev => ({ ...prev, ...data.urls }));
            setGlobalOptions(prev => ({ ...prev, ...data.options }));
          }
          
          if (!shouldFetchFromNetwork && cached) return true;

          const snapshot = await getDocs(collection(db, 'game_settings'));
          const logos: Record<string, string> = {};
          const names: Record<string, string> = {};
          const urls: Record<string, string> = {};
          const options: Record<string, string> = {};

          if (snapshot.empty) {
            console.log("[App] game_settings collection is empty in Firestore. Seeding default game settings with premium logos...");
            
            // Seed each default game settings doc in firestore
            for (const game of games) {
              const defaultLogo = GAME_LOGO_URLS[game.id] || game.image || '';
              const defaultUrl = game.id === 'spribe_aviator' ? 'aviator' : '#';
              const docRef = doc(db, 'game_settings', game.id);
              
              let customName = game.name;
              let customLogo = defaultLogo;
              
              // Apply specific customizations as seen in the user's production screenshots
              if (game.id === 'jili_2') {
                customName = 'SUPER ACE 2';
              } else if (game.id === 'spribe_6') {
                customName = 'PLINK';
              } else if (game.id === 'jili_10') {
                customName = 'FORTUNE COIN';
              } else if (game.id === 'jili_9') {
                customName = 'MONEY POT';
              } else if (game.id === 'jili_12') {
                customName = 'GO RUSH';
              } else if (game.id === 'pg_18') {
                customName = 'FORTUNE OX';
                customLogo = GAME_LOGO_URLS['pg_fortune_ox'] || defaultLogo;
              }

              await setDoc(docRef, {
                game_id: game.id,
                name: customName,
                logo_url: customLogo,
                game_url: defaultUrl,
                provider_option: game.provider,
                updatedAt: new Date().toISOString()
              });

              logos[game.id] = customLogo;
              names[game.id] = customName;
              urls[game.id] = defaultUrl;
              options[game.id] = game.provider;
            }
            console.log("[App] Successfully seeded default game settings in Firestore");
          } else {
            snapshot.forEach((doc) => {
              const item = doc.data();
              if (item.logo_url) logos[item.game_id] = item.logo_url;
              if (item.name) names[item.game_id] = item.name;
              if (item.game_url) urls[item.game_id] = item.game_url;
              if (item.provider_option) options[item.game_id] = item.provider_option;
            });
          }
          
          setGlobalLogos(prev => ({ ...prev, ...logos }));
          setGlobalNames(prev => ({ ...prev, ...names }));
          setGlobalUrls(prev => ({ ...prev, ...urls }));
          setGlobalOptions(prev => ({ ...prev, ...options }));
          
          localStorage.setItem('game_logos_cache', JSON.stringify({ logos, names, urls, options }));
          return true;
        } catch (e: any) {
          console.error("[App] Game settings fetch failed", e);
          return false;
        }
      };

      const fetchGlobalImages = async () => {
        try {
          const cached = localStorage.getItem('global_images_cache');
          if (cached) {
            let images = JSON.parse(cached);
            
            // CACHE INVALIDATION: If cache contains any legacy logo, clear it to force-fetch our new custom logo
            const correctLogoFragment = "1781024598371"; 
            if (images['app_logo'] && !images['app_logo'].includes(correctLogoFragment)) {
               console.log("[App] Detected legacy logo in cache, purging...");
               localStorage.removeItem('global_images_cache');
            } else {
               setGlobalImages(images);
            }
          }
          
          if (!shouldFetchFromNetwork && cached) return true;

          const snapshot = await getDocs(collection(db, 'global_images'));
          const images: Record<string, string> = {};
          snapshot.forEach((doc) => {
            const data = doc.data();
            if (data.url) images[doc.id] = data.url;
          });
          setGlobalImages(images);
          localStorage.setItem('global_images_cache', JSON.stringify(images));
          return true;
        } catch (e: any) {
          console.error("[App] Global images fetch failed", e);
          return false;
        }
      };

      const fetchMetadataSettings = async () => {
        try {
          const cached = localStorage.getItem('metadata_settings_cache');
          if (cached) {
            const data = JSON.parse(cached);
            if (data.allButtonName) setAllButtonName(data.allButtonName);
            if (data.casinoName) setCasinoName(data.casinoName);
            if (data.noticeText) setNoticeText(data.noticeText);
            if (data.telegramLink) setTelegramLink(data.telegramLink);
            if (data.whatsappLink) setWhatsappLink(data.whatsappLink);
            if (data.facebookLink) setFacebookLink(data.facebookLink);
            if (data.supportEmail) setSupportEmail(data.supportEmail);
            if (data.minDeposit) setMinDeposit(data.minDeposit);
            if (data.minWithdraw) setMinWithdraw(data.minWithdraw);
            if (data.welcomeBonus) setWelcomeBonus(data.welcomeBonus);
          }

          if (!shouldFetchFromNetwork && cached) return true;

          const settingsDoc = await getDoc(doc(db, 'metadata', 'settings'));
          if (settingsDoc.exists()) {
            const data = settingsDoc.data();
            if (data.allButtonName) setAllButtonName(data.allButtonName);
            if (data.casinoName) setCasinoName(data.casinoName);
            if (data.noticeText) setNoticeText(data.noticeText);
            if (data.telegramLink) setTelegramLink(data.telegramLink);
            if (data.whatsappLink) setWhatsappLink(data.whatsappLink);
            if (data.facebookLink) setFacebookLink(data.facebookLink);
            if (data.supportEmail) setSupportEmail(data.supportEmail);
            if (data.minDeposit !== undefined) setMinDeposit(data.minDeposit);
            if (data.minWithdraw !== undefined) setMinWithdraw(data.minWithdraw);
            if (data.welcomeBonus !== undefined) setWelcomeBonus(data.welcomeBonus);
            localStorage.setItem('metadata_settings_cache', JSON.stringify(data));
          }
          return true;
        } catch (e: any) {
          console.error("[App] Metadata settings fetch failed", e);
          return false;
        }
      };

      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('TIMEOUT')), 15000));
      const fetchPromise = Promise.all([
        fetchGameSettings(),
        fetchGlobalImages(),
        fetchMetadataSettings()
      ]);

      await Promise.race([fetchPromise, timeoutPromise]);
      
      localStorage.setItem(CACHE_KEY, now.toString());
      setDbStatus('success');
    } catch (err: any) {
      if (err.message.includes('Quota') || err.message.includes('Resource exhausted') || err.message.includes('Limit')) {
        console.warn("[App] Firestore quota exceeded. Using cached data.");
        setDbStatus('success');
        setIsDataLoading(false);
        setIsRefreshing(false);
        return; 
      }
      console.error(`[App] Error loading app config (Attempt ${retryCount + 1}):`, err.message);
      if (retryCount < 2) {
        setTimeout(() => loadAllAppConfig(retryCount + 1), 5000);
      }
      setDbStatus('success'); // Still allow app to run if we have cached data
    } finally {
      setIsRefreshing(false);
      setIsDataLoading(false);
    }
  };

  useEffect(() => {
    loadAllAppConfig();

    // Auto-setup of web push notifications
    if ('Notification' in window) {
      const savedPushNotif = localStorage.getItem('app_push_notif');
      if (savedPushNotif === null) {
        localStorage.setItem('app_push_notif', 'true');
      }
      
      // Prompt for notifications gracefully 7 seconds after load
      if (Notification.permission === 'default') {
        setTimeout(() => {
          Notification.requestPermission()
            .then(p => console.log("[Push Notification] Permission status:", p))
            .catch(e => console.warn("[Push Notification] Failed to inquire permission:", e));
        }, 7000);
      }
    }
  }, []);

  // Referral tracking and Admin tab switch
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref) {
      localStorage.setItem('referralCode', ref);
      try {
        window.name = `ref_code:${ref}`; // Cross-domain persistence hack for redirects
      } catch (e) {}
      
      // Clean up URL but keep it for visual confirmation if needed, or slightly delay it.
      // Actually, removing it is fine as long as it's captured in localStorage.
      // The user specially asked for it to "stay" so let's keep it in the URL if it's the landing.
      // console.log("Captured referral code:", ref);
      // const newUrl = window.location.pathname + window.location.search.replace(/[?&]ref=[^&]*/, '');
      // window.history.replaceState({}, '', newUrl);
    }
    
    // Admin tab switch
    const tab = params.get('tab');
    if (tab === 'admin') {
       // logic to show admin can be here but activeTab is better
    }
  }, []);

  // Auto-dismiss activePopupMessage after 6 seconds
  useEffect(() => {
    if (activePopupMessage) {
      const timer = setTimeout(() => {
        setActivePopupMessage(null);
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [activePopupMessage]);

  const showNotification = (message: string, type: 'success' | 'info' | 'error' = 'info') => {
    setNotification({ isOpen: true, message, type });
  };

  const showToast = (message: string, type: ToastType = 'info', critical = false) => {
    if (critical || type === 'error') {
      showNotification(message, type === 'error' ? 'error' : 'info');
      return;
    }
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
    loadAllAppConfig(0, true);
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

  const handleBalanceUpdate = async (newBalance: number, persist = true) => {
    console.log(`[Aviator Debug V2] App.tsx handleBalanceUpdate: Setting balance to: ${newBalance}, Persist: ${persist}`);
    setBalance(newBalance);
    if (isLoggedIn && userData?.id && persist) {
      try {
        console.log(`[Aviator Debug V2] App.tsx handleBalanceUpdate: Updating Firebase for user ${userData.id}...`);
        await updateDoc(doc(db, 'users', userData.id), { balance: newBalance });
        
        const updatedUser = { ...userData, balance: newBalance };
        setUserData(updatedUser);
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
        console.log(`[Aviator Debug V2] App.tsx handleBalanceUpdate: Firebase update successful!`);
      } catch (err) {
        console.error("[Aviator Debug V2] App.tsx handleBalanceUpdate: Error updating balance in Firestore:", err);
      }
    } else {
      console.log(`[Aviator Debug V2] App.tsx handleBalanceUpdate: Not persisting. Persist flag: ${persist}, isLoggedIn: ${isLoggedIn}, userId: ${userData?.id}`);
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
    
    if (isLoggedIn) {
      if (auth.currentUser) {
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
                message: `💰 <b>New Deposit Request! (পেন্ডিং)</b>\n\n👤 <b>Username:</b> ${userData?.username || 'Unknown'}\n🔢 <b>UID:</b> <code>${formatDisplayUID(uid)}</code>\n💵 <b>Amount:</b> ৳${amount}\n🏦 <b>Method:</b> ${method || 'Unknown'}\n📱 <b>Sender:</b> ${senderNumber || 'Unknown'}\n🔖 <b>TxID:</b> <code>${trxId || 'N/A'}</code>`
              })
            });
          } catch (tErr) {
            console.warn("Telegram notify skipped or offline:", tErr);
          }
          
          showToast(`৳${amount} ডিপোজিট রিকোয়েস্ট পাঠানো হয়েছে। অ্যাডমিন অ্যাপ্রুভ করার জন্য অপেক্ষা করুন।`, "success");
        } catch (err: any) {
          console.error("Internal process error during deposit log:", err);
          showToast("ডিপোজিট প্রসেস করতে সমস্যা হয়েছে: " + err.message, "error");
        }
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
            requiredTurnover: (data.requiredTurnover || 0) + amount,
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
    // Redundant listeners removed. Consolidated in auth effect.
    return () => {};
  }, [isLoggedIn, userData?.id]);



  if (!isOnline) {
    return (
      <div className="fixed inset-0 z-[9999] bg-[#111] flex flex-col items-center justify-center p-6 text-center select-none font-sans">
        <div className="w-24 h-24 mb-6 text-red-500 bg-red-500/10 rounded-full flex items-center justify-center animate-pulse">
          <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238L3 3M2.93 2.93l18.385 18.385" /></svg>
        </div>
        <h2 className="text-2xl font-black text-white mb-2">সংযোগ বিচ্ছিন্ন</h2>
        <p className="text-gray-400 font-medium mb-8 max-w-[280px]">এই অ্যাপটি ব্যবহার করতে ইন্টারনেট সংযোগ প্রয়োজন। দয়া করে আপনার নেটওয়ার্ক কানেকশন চেক করুন।</p>
        <button 
          onClick={() => window.location.reload()}
          className="bg-yellow-500 text-black px-8 py-3 rounded-full font-black uppercase tracking-wider transform hover:scale-105 transition-all shadow-[0_0_20px_rgba(234,179,8,0.3)] active:scale-95"
        >
          পুনরায় চেষ্টা করুন
        </button>
      </div>
    );
  }

  if (isDataLoading && !showRegistrationSuccess) {
    return (
      <GlobalLoader 
        message="অ্যাকাউন্ট লোড হচ্ছে" 
        subMessage="আপনার প্রোফাইল প্রস্তুত করা হচ্ছে" 
        type="data" 
        appLogo={globalImages['app_logo'] || 'https://www.image2url.com/r2/default/images/1781024598371-46bd7cc9-4b5f-49cd-b4b3-60d4d200534a.png'}
        onRetry={() => {
          setIsDataLoading(true);
          setDbStatus('testing');
          loadAllAppConfig();
        }}
        showRetry={dbStatus === 'error'}
      />
    );
  }

  const handleOpenLogin = (mode: 'login' | 'register' = 'login') => {
    setLoginModalMode(mode);
    setShowLoginModal(true);
  };

  return (
    <LanguageProvider>
      <SoundProvider>
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
            appLogo={globalImages['app_logo'] || 'https://www.image2url.com/r2/default/images/1781024598371-46bd7cc9-4b5f-49cd-b4b3-60d4d200534a.png'}
            onInstallApp={handleInstallApp}
          />
        )}
      </AnimatePresence>
      {/* Database Status Indicator */}
      <div className={`fixed top-4 right-4 z-[201] w-3 h-3 rounded-full ${
        dbStatus === 'success' ? 'bg-green-500' :
        dbStatus === 'error' ? 'bg-red-500' : 'bg-yellow-500 animate-pulse'
      }`} title={`Firebase: ${dbStatus}`} />

      {/* Tab Loading Progress Bar & Full Screen Overlay */}
      <AnimatePresence>
        {isTabLoading && (
          <>
            <motion.div 
              initial={{ width: "0%", opacity: 0 }}
              animate={{ width: "100%", opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="fixed top-0 left-0 h-1 bg-gradient-to-r from-yellow-300 via-yellow-500 to-yellow-600 z-[2000] shadow-[0_0_15px_rgba(234,179,8,0.8)]"
            />
            {/* High-quality full-screen loader for perceived processing */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[1999] bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-6"
            >
              <div className="relative flex flex-col items-center max-w-[280px] w-full">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="mb-8"
                >
                  <span className="text-4xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 via-yellow-500 to-yellow-600 drop-shadow-[0_0_15px_rgba(253,216,53,0.6)]">
                    SPIN71.BET
                  </span>
                </motion.div>
                
                <div className="w-16 h-16 border-[3px] border-yellow-500/20 border-t-yellow-500 rounded-full animate-spin shadow-[0_0_30px_rgba(234,179,8,0.3)]"></div>
                
                <motion.p 
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="mt-6 text-yellow-500 text-[11px] font-black uppercase tracking-[0.3em]"
                >
                  সার্ভার কানেক্ট হচ্ছে... (Loading)
                </motion.p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Game Loader Overlay */}
      <AnimatePresence>
        {isGameLoading && selectedGame && (
          <GameLoader 
            gameName={globalUrls[selectedGame.id] ? (globalNames[selectedGame.id] || selectedGame.name) : selectedGame.name}
            provider={selectedGame.provider}
            logo={globalLogos[selectedGame.id] || GAME_LOGO_URLS[selectedGame.id] || selectedGame.image}
            onClose={() => {
              setIsGameLoading(false);
              window.history.back();
            }}
            onLoadComplete={() => setIsGameLoading(false)}
          />
        )}
      </AnimatePresence>

      {/* Actual Game View Overlay */}
      <AnimatePresence>
        {(!isLoggedIn && showLoginModal) && (
          <LoginPage 
            initialMode={loginModalMode}
            onRegisterSuccess={() => {
              setIsLoggedIn(true);
              setShowLoginModal(false);
            }}
            onContinue={() => setShowLoginModal(false)}
            onLoginSuccess={(user) => { 
                setIsLoggedIn(true);
                setShowLoginModal(false);
                setUserData(user);
            }}
            showToast={showToast}
            showNotification={showNotification}
            appLogo={globalImages['app_logo'] || 'https://www.image2url.com/r2/default/images/1781024598371-46bd7cc9-4b5f-49cd-b4b3-60d4d200534a.png'}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {!isGameLoading && selectedGame && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="fixed inset-0 z-[1000] max-w-[512px] mx-auto bg-black flex flex-col"
          >
            {/* Header for Game View */}
            <div className="flex items-center justify-between p-3 bg-[#111] border-b border-white/10 shrink-0">
               <div className="flex items-center gap-2">
                 <button 
                  onClick={() => window.history.back()}
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
                   <AnimatedBalance value={balance} decimals={0} className="text-[10px] font-bold text-yellow-500" />
                 </div>
                 <button 
                  onClick={() => window.history.back()}
                  className="w-10 h-10 flex items-center justify-center bg-red-600/10 hover:bg-red-600/20 rounded-full transition-all text-red-500 shadow-lg border border-red-500/20"
                >
                  <X size={24} />
                </button>
               </div>
            </div>

            {/* Game Content */}
            <div className="flex-1 relative bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#1a1c29] via-[#0b0c10] to-black overflow-hidden flex flex-col items-center justify-center">
                {/* Visual Background Effects */}
                <div className="absolute inset-0 z-0 opacity-30">
                  <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-yellow-500 rounded-full mix-blend-screen filter blur-[100px] animate-pulse"></div>
                  <div className="absolute bottom-1/4 right-1/4 w-32 h-32 bg-blue-500 rounded-full mix-blend-screen filter blur-[100px] animate-pulse delay-700"></div>
                </div>

                <div className="relative z-10 flex flex-col items-center justify-center h-full space-y-6 text-center px-4">
                  
                  {/* Glowing Game Logo */}
                  <div className="relative group perspective-1000">
                    <div className="absolute inset-0 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-3xl blur-xl opacity-40 group-hover:opacity-70 transition-opacity duration-500"></div>
                    <div className="w-32 h-32 bg-white/10 rounded-3xl flex items-center justify-center mb-2 border-2 border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.5)] overflow-hidden relative z-10 transform transition-transform duration-500 group-hover:rotate-x-12 group-hover:-translate-y-2">
                      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/20"></div>
                      <img 
                        src={globalLogos[selectedGame.id] || GAME_LOGO_URLS[selectedGame.id] || selectedGame.image} 
                        alt={selectedGame.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-white text-3xl font-black uppercase tracking-[0.2em] drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
                      {globalNames[selectedGame.id] || selectedGame.name}
                    </h3>
                    <p className="text-yellow-400 text-sm font-bold tracking-widest uppercase mb-4">Are you ready?</p>
                  </div>
                  
                  <div className="px-6 py-2 rounded-full border border-yellow-500/30 bg-yellow-500/10 backdrop-blur-md">
                    <p className="text-yellow-200 text-xs font-semibold tracking-wider flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-yellow-400 animate-ping"></span> 
                      Secure Server Active
                    </p>
                  </div>

                  <button 
                    onClick={async () => {
                      if (!isLoggedIn) {
                        showToast("গেম খেলতে লগইন করুন (Please login to play)", "error");
                        setSelectedGame(null);
                        setShowLoginModal(true);
                        return;
                      }
                      
                      if (selectedGame?.id === 'native_slot') {
                        setActiveTab('slot');
                        setSelectedGame(null);
                        return;
                      }

                      try {
                        const token = await auth.currentUser?.getIdToken();
                        if (!token) return;

                        setIsTabLoading(true); // Show loader during real network request
                        
                        const res = await fetch("/api/game/launch", {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ 
                            gameId: selectedGame.id, 
                            provider: selectedGame.provider,
                            idToken: token
                          })
                        });
                        
                        const data = await res.json();
                        if (data.success && data.url) {
                          window.open(data.url, '_blank');
                        } else {
                          // Note: Error handled by backend, but if no URL, try globalUrls as last resort
                          if (globalUrls[selectedGame.id]) {
                            window.open(globalUrls[selectedGame.id], '_blank');
                          } else {
                            showToast(data.error || "Failed to launch game", "error");
                          }
                        }
                      } catch (err: any) {
                        console.error('Launch Error:', err);
                        // Fallback to static if API fails
                        if (globalUrls[selectedGame.id]) {
                          window.open(globalUrls[selectedGame.id], '_blank');
                        } else {
                          showToast("Failed to connect to game server", "error");
                        }
                      } finally {
                        setIsTabLoading(false); // Hide the loader, since game is opened in new tab or failed
                      }
                    }}
                    className="relative overflow-hidden group mt-8 bg-gradient-to-r from-yellow-500 via-orange-500 to-yellow-600 text-black font-black uppercase tracking-[0.2em] px-12 py-5 rounded-full text-lg shadow-[0_0_30px_rgba(245,158,11,0.4)] hover:shadow-[0_0_50px_rgba(245,158,11,0.6)] active:scale-95 transition-all"
                  >
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,transparent,rgba(255,255,255,0.4),transparent)] -translate-x-[150%] skew-x-[-30deg] group-hover:translate-x-[150%] transition-transform duration-1000"></div>
                    <span className="relative z-10 flex items-center justify-center gap-2">
                       Play Now <Gamepad2 size={24} className="group-hover:animate-bounce" />
                    </span>
                  </button>
                  
                </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="relative min-h-[calc(100vh-120px)]">
        <AnimatePresence mode="wait">
          {activeTab === 'settings' && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <SettingsView userData={userData} onUpdateUser={handleUpdateUser} showToast={showToast} />
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
              <HomeView 
                userData={userData}
                recentlyPlayed={recentlyPlayed}
                favorites={favorites}
                handleGameSelect={handleGameSelect}
                setShowGallery={setShowGallery}
                onNavigate={handleNavigate}
                globalLogos={globalLogos}
                globalNames={globalNames}
                globalUrls={globalUrls}
                globalOptions={globalOptions}
                globalImages={globalImages}
                appLogo={globalImages['app_logo'] || 'https://www.image2url.com/r2/default/images/1781024598371-46bd7cc9-4b5f-49cd-b4b3-60d4d200534a.png'}
                balance={balance}
                isRefreshing={isRefreshing}
                handleRefresh={handleRefresh}
                setIsSidebarOpen={setIsSidebarOpen}
                setIsNotificationCenterOpen={setIsNotificationCenterOpen}
                unreadNotificationsCount={unreadNotificationsCount}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                onOpenLogin={handleOpenLogin}
                showInstallBanner={showInstallBanner}
                onInstallApp={handleInstallApp}
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
               <SlotMachine 
                 onBack={() => setActiveTab('home')} 
                 balance={balance}
                 onBalanceUpdate={handleBalanceUpdate}
                 showToast={showToast}
                 userData={userData}
               />
             </motion.div>
          )}
          {activeTab === 'aviator' && (
             <motion.div
               key="aviator"
               initial={{ opacity: 0, scale: 0.9 }}
               animate={{ opacity: 1, scale: 1 }}
               exit={{ opacity: 0, scale: 0.9 }}
               transition={{ duration: 0.3 }}
               className="w-full h-full"
             >
               <AviatorGame 
                 balance={balance}
                 onBalanceUpdate={handleBalanceUpdate}
                 showToast={showToast}
                 onClose={() => setActiveTab('home')}
                 userData={userData}
                 globalLogos={globalLogos}
                 globalNames={globalNames}
               />
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
          {activeTab === 'leaderboard' && (
            <motion.div
              key="leaderboard"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.3 }}
            >
              <LeaderboardView onBack={() => setActiveTab('home')} />
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
                onInstallApp={handleInstallApp}
                telegramLink={telegramLink}
                whatsappLink={whatsappLink}
              />
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
                globalOptions={globalOptions}
                updateGlobalGameLogo={handleUpdateGlobalGameLogo}
                updateGlobalGameName={handleUpdateGlobalGameName}
                updateGlobalGameUrl={updateGlobalGameUrl}
                updateGlobalGameOption={updateGlobalGameOption}
                casinoName={casinoName}
                updateCasinoName={handleUpdateCasinoName} 
                noticeText={noticeText}
                setNoticeText={setNoticeText}
                allButtonName={allButtonName}
                updateAllButtonName={updateAllButtonName}
                minDeposit={minDeposit}
                setMinDeposit={setMinDeposit}
                minWithdraw={minWithdraw}
                setMinWithdraw={setMinWithdraw}
                welcomeBonus={welcomeBonus}
                setWelcomeBonus={setWelcomeBonus}
                telegramLink={telegramLink}
                setTelegramLink={setTelegramLink}
                updateGlobalImage={handleUpdateGlobalImage}
                onAddUser={handleAddUser}
                globalImages={globalImages}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Support Chat */}
      <SupportChat 
        isOpen={isSupportChatOpen} 
        onClose={() => setIsSupportChatOpen(false)} 
        userData={userData} 
        telegramLink={telegramLink}
        whatsappLink={whatsappLink}
        facebookLink={facebookLink}
      />

      <PWAInstallBanner 
        deferredPrompt={deferredPrompt} 
        onInstall={triggerImmediatePwaInstall}
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
        notifications={notifications}
        onMarkAsRead={handleMarkNotifAsRead}
        onDelete={handleDeleteNotif}
        showToast={showToast}
        appLogo={globalImages['app_logo'] || 'https://www.image2url.com/r2/default/images/1781024598371-46bd7cc9-4b5f-49cd-b4b3-60d4d200534a.png'}
        onAction={(url) => {
          if (url.startsWith('tab:')) {
            handleTabChange(url.split(':')[1] as any);
          }
        }}
      />
      
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

      {/* Auto Logout Warning Modal */}
      <AutoLogoutModal 
        isOpen={showAutoLogoutWarning}
        onKeepLoggedIn={() => {
          lastActivityTime.current = Date.now();
          setShowAutoLogoutWarning(false);
        }}
        onLogout={handleLogout}
        secondsLeft={autoLogoutCountdown}
      />

      {!['aviator', 'slot'].includes(activeTab) && !selectedGame && (
        <div className="fixed bottom-[85px] right-3 z-[110]">
            <button 
               onClick={() => window.dispatchEvent(new CustomEvent('openSupportChat'))}
               className="w-14 h-14 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-[0_8px_30px_rgb(0,0,0,0.5)] text-white hover:scale-110 transition-transform active:scale-95 border-2 border-white/20"
             >
                <MessageSquare size={26} className="animate-pulse" />
             </button>
         </div>
      )}

      {/* Recently Viewed Feature */}
      {!['aviator', 'slot'].includes(activeTab) && !selectedGame && (
        <RecentlyViewed activeTab={activeTab} onNavigate={handleTabChange} />
      )}

      {/* Bottom Navigation */}
      {!['aviator', 'slot'].includes(activeTab) && !selectedGame && (
        <BottomNav activeTab={activeTab} onTabChange={handleTabChange} onToggleNotifications={() => setIsNotificationCenterOpen(!isNotificationCenterOpen)} unreadNotificationsCount={unreadNotificationsCount} isAdmin={userData?.isAdmin} />
      )}








      <PromoCodeModal 
        isOpen={showPromoModal}
        onClose={() => setShowPromoModal(false)}
        showToast={showToast}
        isAdmin={userData?.role === 'admin' || userData?.isAdmin === true}
        userData={userData}
      />

      {/* Floating Pop's Message matching 3rd screenshot */}
      <AnimatePresence>
        {activePopupMessage && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -30, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-[380px] z-[9999] bg-white rounded-2xl shadow-[0_15px_40px_rgba(0,0,0,0.25)] border-l-[6px] border-[#00d0f5] flex items-start gap-3.5 p-5 cursor-pointer hover:bg-gray-50 active:scale-[0.99] transition-all overflow-hidden"
            onClick={async () => {
              const msgId = activePopupMessage.id;
              if (msgId && userData?.id) {
                try {
                  await updateDoc(doc(db, 'users', userData.id, 'notifications', msgId), { read: true });
                } catch (e) { console.error(e); }
              }
              setActivePopupMessage(null);
              setIsNotificationCenterOpen(true);
            }}
          >
            {/* Dynamic Game/App Logo framing and container */}
            <div className="w-[44px] h-[44px] rounded-full overflow-hidden border border-gray-200 shrink-0 flex items-center justify-center bg-[#1c1c1c] shadow-sm">
              <img 
                src={globalImages['app_logo'] || 'https://www.image2url.com/r2/default/images/1781024598371-46bd7cc9-4b5f-49cd-b4b3-60d4d200534a.png'} 
                alt="Logo" 
                className="w-full h-full object-cover" 
              />
            </div>

            {/* Notification content */}
            <div className="flex-1 min-w-0 pr-6 select-none text-left">
              <h4 className="text-gray-900 font-extrabold text-sm sm:text-base leading-snug">
                নতুন মেসেজ
              </h4>
              <p className="text-gray-500 font-bold text-xs sm:text-sm mt-0.5 line-clamp-1">
                {activePopupMessage.title}
              </p>
              <p className="text-gray-400 text-[10px] font-semibold mt-1">
                প্রেরক: {activePopupMessage.sender || 'প্ল্যাটফর্ম'}
              </p>
            </div>

            {/* Close button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setActivePopupMessage(null);
              }}
              className="absolute top-4 right-4 p-1 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-950 transition-colors"
            >
              <X size={16} strokeWidth={2.5} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <NotificationOverlay 
        isOpen={notification.isOpen} 
        message={notification.message} 
        type={notification.type} 
        onClose={() => setNotification(prev => ({...prev, isOpen: false}))}
      />

      <AnimatePresence>
        {showExitPopup && (
          <div className="fixed inset-0 z-[2500] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.5, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.5, opacity: 0, y: 50 }}
              className="relative bg-gradient-to-b from-[#2a2b2d] to-[#1e1e1e] border-t-4 border-t-red-500 rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl overflow-hidden"
            >
              <div className="relative z-10">
                <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_20px_rgba(239,68,68,0.3)]">
                  <motion.div
                    initial={{ rotate: -90, scale: 0 }}
                    animate={{ rotate: 0, scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15 }}
                  >
                    <AlertCircle size={36} className="text-red-500" />
                  </motion.div>
                </div>
                
                <h2 className="text-2xl font-black text-white mb-3">আপনি কি গেম থেকে বের হতে চান?</h2>
                <p className="text-gray-300 font-medium text-sm mb-8">Are you sure you want to quit?</p>
                
                <div className="flex gap-4">
                  <button 
                    onClick={() => {
                        window.history.pushState({ page: 'tab', tab: activeTab }, '');
                        setShowExitPopup(false);
                    }} 
                    className="flex-1 font-bold py-3.5 rounded-full transition-all bg-white/10 text-white hover:bg-white/20 active:scale-95 border border-white/10"
                  >
                    না (Stay)
                  </button>
                  <button 
                    onClick={() => {
                      // Attempt to close or go back cleanly
                      try {
                          window.history.go(-2);
                          setTimeout(() => window.close(), 300);
                      } catch(e){}
                    }} 
                    className="flex-1 font-bold py-3.5 rounded-full transition-all bg-gradient-to-r from-red-600 to-red-500 text-white hover:scale-[1.02] active:scale-95 shadow-[0_4px_15px_rgba(239,68,68,0.4)] border border-red-500/50"
                  >
                    হ্যাঁ (Quit)
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AppInstallModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
        deferredPrompt={deferredPrompt}
        onInstall={triggerImmediatePwaInstall}
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
      </SoundProvider>
    </LanguageProvider>
  );
}
