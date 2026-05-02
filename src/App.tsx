import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from 'motion/react';
import { auth, db } from './services/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, collection, getDocs, onSnapshot, serverTimestamp, increment, query, orderBy, limit } from 'firebase/firestore';
import LoginPage from './views/LoginPage';
import BonusCenter from './views/BonusCenter';
import AdminPanelView from "./views/AdminPanelView";
import AnalyticsView from "./views/AnalyticsView";
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
  Plane as PlaneIcon,
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
  const [globalUrls, setGlobalUrls] = useState<Record<string, string>>({
    '5': 'https://aviator-game-url.com'
  });
  const [globalOptions, setGlobalOptions] = useState<Record<string, string>>({});
  const [globalImages, setGlobalImages] = useState<Record<string, string>>({});
  const [balance, setBalance] = useState(0);
  const [allButtonName, setAllButtonName] = useState<string>("ALL");
  const [casinoName, setCasinoName] = useState<string>("SPIN71.bet");
  const [noticeText, setNoticeText] = useState<string>("আমাদের গেম উপভোগ করুন এবং বড় জয় নিশ্চিত করুন!");
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
      path
    };
    console.error('Firestore Error: ', JSON.stringify(errInfo));
    return errInfo;
  }

  useEffect(() => {
    const testPath = 'config/main';
    getDoc(doc(db, testPath)).then((snapshot) => {
      console.log('Frontend Firestore check successful, doc exists:', snapshot.exists());
      setDbStatus('success');
    }).catch((err) => {
      handleFirestoreError(err, OperationType.GET, testPath);
      setDbStatus('error');
    });
  }, []);
  const [showLoginModal, setShowLoginModal] = useState(false);

  const [activeTab, setActiveTab] = useState<'home' | 'profile' | 'invite' | 'deposit' | 'bonus' | 'wallet' | 'faq' | 'leaderboard' | 'terms' | 'analytics' | 'admin'>('home');
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
      const isNative = !globalUrls[selectedGame.id] && selectedGame.id !== 'aviator' && selectedGame.id !== 'rocket_1' && selectedGame.provider !== 'Generic';
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
    if (logo.startsWith('data:image/') && logo.length > 680000) {
      showToast("ছবি রিসাইজ করা হচ্ছে (Compressing)...", "info");
      finalLogo = await compressImage(logo, 1200, 1200, 0.7);
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

  const syncGameSettings = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'game_settings'));
      const logos: Record<string, string> = {};
      const names: Record<string, string> = {};
      const urls: Record<string, string> = {};
      const options: Record<string, string> = {};

      querySnapshot.forEach((doc) => {
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
    } catch (err) {
      console.error("Error syncing game settings:", err);
    }
  };

  useEffect(() => {
    syncGameSettings();
    
    // Subscribe to real-time changes
    const unsubscribe = onSnapshot(collection(db, 'game_settings'), (snapshot) => {
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
    }, (error) => {
      console.error("game_settings snapshot error:", error);
    });

    // Subscribe to global image changes - now using a collection
    const unsubscribeImages = onSnapshot(collection(db, 'global_images'), (snapshot) => {
      const images: Record<string, string> = {};
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.url) {
          images[doc.id] = data.url;
        }
      });
      setGlobalImages(prev => ({ ...prev, ...images }));
    }, (error) => {
      console.error("global_images snapshot error:", error);
    });

    // Also migrate old images from document to collection if they exist
    const migrateOldImages = async () => {
      try {
        const oldDocRef = doc(db, 'metadata', 'images');
        const oldDoc = await getDoc(oldDocRef);
        if (oldDoc.exists()) {
          const data = oldDoc.data();
          // We only do this if it hasn't been migrated or something
          // This might hit the same error if we try to read it too many times? 
          // No, reading is fine, writing was the problem.
          for (const key in data) {
            if (key !== 'updatedAt') {
              // Only migrate if not already in global_images (avoiding infinite loops/redundancy)
              const newDocRef = doc(db, 'global_images', key);
              const newDoc = await getDoc(newDocRef);
              if (!newDoc.exists()) {
                await setDoc(newDocRef, { 
                  url: data[key],
                  updatedAt: data.updatedAt || new Date().toISOString()
                });
              }
            }
          }
        }
      } catch (err) {
        console.error("Error migrating old images:", err);
      }
    };
    migrateOldImages();

    // Subscribe to general settings
    const unsubscribeSettings = onSnapshot(doc(db, 'metadata', 'settings'), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
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
    }, (error) => {
      console.error("metadata snapshot error:", error);
    });

    return () => {
      unsubscribe();
      unsubscribeImages();
      unsubscribeSettings();
    };
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

  const handleDepositSuccess = async (amount: number, trxId?: string, senderNumber?: string, method?: string) => {
    setShowDepositRequired(false);
    
    if (isLoggedIn && auth.currentUser) {
      try {
        const idToken = await auth.currentUser.getIdToken();
        const response = await fetch('/api/user/deposit/confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount, idToken, trxId, senderNumber, method })
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Failed to confirm deposit with server');
        }

        const result = await response.json();
        
        if (result.success) {
          const newBalance = result.balance;
          setBalance(newBalance);
          
          // Refresh local user data
          const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
          if (userDoc.exists()) {
            const updatedUser = { id: auth.currentUser.uid, ...userDoc.data() };
            setUserData(updatedUser);
            localStorage.setItem('currentUser', JSON.stringify(updatedUser));
          }
          
          showToast(`৳${amount} ডিপোজিট সফল হয়েছে!`, "success");
        }
      } catch (err) {
        console.error("Error confirming deposit:", err);
        showToast("ডিপোজিট প্রসেস করতে সমস্যা হয়েছে", "error");
      }
    } else {
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
    // Keep deposit required open until user interacts
  }, [showDepositRequired]);

  useEffect(() => {
    let unsubscribeUser: () => void;
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
    }

    return () => {
      if (unsubscribeUser) {
        unsubscribeUser();
      }
      logUserActivity('session_end');
    };
  }, [isLoggedIn, userData?.id]);

  if (showSplash) {
    return <GlobalLoader message={casinoName} subMessage="PREPARING YOUR PREMIUM EXPERIENCE" onSkip={() => setShowSplash(false)} />;
  }

  if (isDataLoading && !showRegistrationSuccess) {
    return <GlobalLoader message="অ্যাকাউন্ট লোড হচ্ছে" subMessage="আপনার প্রোফাইল প্রস্তুত করা হচ্ছে" type="data" />;
  }

  if (!isAuthInitialized) {
    return <GlobalLoader message="নিরাপত্তা নিশ্চিত করা হচ্ছে" subMessage="AUTH INITIALIZING..." />;
  }

  // Remove the blocking login page check to allow guest browsing

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
            handleGameSelect={(game) => {
              setSelectedGame(game);
              setIsSidebarOpen(false);
              if (game.url) {
                 window.open(game.url, '_blank');
              } else {
                 setIsGameLoading(true);
              }
            }}
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
            className="fixed inset-0 z-[100] max-w-[512px] mx-auto bg-black flex items-center justify-center p-4"
          >
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white mb-2">গেমে কাজ চলতেছে</h2>
              <p className="text-gray-400">অনুগ্রহ করে পরে আবার চেষ্টা করুন|</p>
              <button 
                onClick={() => setSelectedGame(null)}
                className="mt-6 px-6 py-2 bg-yellow-500 text-black font-bold rounded-full hover:bg-yellow-400 transition-colors"
              >
                ফিরে যান
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="relative min-h-[calc(100vh-120px)]">
        <AnimatePresence mode="wait">
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
              />
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
                balance={balance} 
                userData={userData}
                onUpdateUser={async (updates: any) => {
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
                }}
                onAddTransaction={async (transaction: any) => {
                  if (userData?.id) {
                    try {
                      const txRef = doc(collection(db, 'users', userData.id, 'transactions'));
                      await setDoc(txRef, {
                        ...transaction,
                        createdAt: serverTimestamp()
                      });

                      // Duplicate to global transactions for admin if needed
                      const globalTxRef = doc(collection(db, 'transactions'));
                      await setDoc(globalTxRef, {
                        ...transaction,
                        userId: userData.id,
                        username: userData.username,
                        createdAt: serverTimestamp()
                      });
                    } catch (e) {
                      console.error('Error adding transaction', e);
                      showToast("লেনদেন সংরক্ষণ করতে সমস্যা হয়েছে", "error");
                    }
                  }
                }}
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
                initialSubTab={profileSubTab as any}
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
                onUpdateUser={async (updates: any) => {
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
                      console.error('Error updating user in bonus center', e);
                      showToast("বোনাস আপডেট করতে সমস্যা হয়েছে", "error");
                    }
                  }
                }}
                onLogout={handleLogout}
                showToast={showToast} 
                welcomeBonus={welcomeBonus} 
                onOpenPromoModal={() => setShowPromoModal(true)}
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
                onUpdateUser={async (updates: any) => {
                  if (userData?.id) {
                    const userRef = doc(db, 'users', userData.id);
                    await updateDoc(userRef, updates);
                    setUserData({ ...userData, ...updates });
                  }
                }}
                onAddTransaction={async (transaction: any) => {
                  if (userData?.id) {
                    const txRef = doc(collection(db, 'users', userData.id, 'transactions'));
                    await setDoc(txRef, { ...transaction, createdAt: serverTimestamp() });
                    const globalTxRef = doc(collection(db, 'transactions'));
                    await setDoc(globalTxRef, { ...transaction, userId: userData.id, username: userData.username, createdAt: serverTimestamp() });
                  }
                }}
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

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* Floating Telegram Support */}
      <div className="fixed bottom-20 right-4 md:right-[calc(50%-13rem)] z-40 flex flex-col gap-3">
        {/* Global Chat Trigger */}
        <button 
          onClick={() => setIsGlobalChatOpen(true)}
          className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(79,70,229,0.5)] hover:scale-110 transition-transform border-2 border-indigo-400 group relative"
        >
          <MessageCircle size={24} className="text-white" />
          <span className="absolute right-full mr-3 bg-black text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none font-bold uppercase italic">
            Global Chat
          </span>
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full border border-white flex items-center justify-center animate-pulse">
            <span className="text-[8px] font-bold text-white">●</span>
          </div>
        </button>

        {/* AI Assistant Trigger */}
        <button 
          onClick={() => setIsAIAssistantOpen(true)}
          className="w-12 h-12 bg-gradient-to-br from-teal-600 to-teal-900 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(20,184,166,0.6)] hover:scale-110 transition-transform border-2 border-teal-400/30 group relative"
        >
          <Bot size={24} className="text-teal-100" />
          <span className="absolute right-full mr-3 bg-black text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none font-black italic">
            BET APP AI
          </span>
          {/* Pulsing Dot */}
          <div className="absolute top-0 right-0 w-3 h-3 bg-green-500 rounded-full border border-white animate-pulse"></div>
        </button>

        {/* Bet Slip Trigger */}
        <button 
          onClick={() => setShowPromoModal(true)}
          className="w-12 h-12 bg-teal-500 rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(20,184,166,0.5)] hover:scale-110 transition-transform border-2 border-white/20 group relative"
        >
          <Gift size={24} className="text-white" />
          <span className="absolute right-full mr-3 bg-black/80 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none font-bold">
            Promo Code
          </span>
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 rounded-full border border-white flex items-center justify-center">
            <span className="text-[8px] font-bold text-white">1</span>
          </div>
        </button>

        <a 
          href={telegramLink} 
          target="_blank" 
          rel="noopener noreferrer"
          className="w-12 h-12 bg-[#0088cc] rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(0,136,204,0.5)] hover:scale-110 transition-transform border-2 border-white/20 group relative"
        >
          <svg viewBox="0 0 24 24" className="w-6 h-6 fill-white" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.223-.548.223l.188-2.85 5.18-4.686c.223-.195-.054-.285-.346-.096l-6.405 4.03-2.76-.863c-.6-.188-.61-.6.125-.89l10.78-4.154c.498-.188.938.118.786.914z"/>
          </svg>
          <span className="absolute right-full mr-3 bg-black/80 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            Channel
          </span>
        </a>
        <a 
          href={telegramLink} 
          target="_blank" 
          rel="noopener noreferrer"
          className="w-12 h-12 bg-[#0088cc] rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(0,136,204,0.5)] hover:scale-110 transition-transform border-2 border-white/20 group relative"
        >
          <svg viewBox="0 0 24 24" className="w-6 h-6 fill-white" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.223-.548.223l.188-2.85 5.18-4.686c.223-.195-.054-.285-.346-.096l-6.405 4.03-2.76-.863c-.6-.188-.61-.6.125-.89l10.78-4.154c.498-.188.938.118.786.914z"/>
          </svg>
          <span className="absolute right-full mr-3 bg-black/80 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            Support Bot
          </span>
        </a>
      </div>

      {/* Bottom Navigation */}
      <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />


      {isLoggedIn && <PermissionManager />}

      <AnimatePresence>
        {(showLoginModal || (!isLoggedIn && showRegistrationSuccess)) && (
          <div className="fixed inset-0 z-[150] bg-black max-w-[512px] mx-auto overflow-y-auto">
             <LoginPage 
                onRegisterSuccess={() => {
                  setShowRegistrationSuccess(false);
                  setShowLoginModal(false);
                  showToast("অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে!", "success");
                }} 
                onContinue={() => {
                  setShowRegistrationSuccess(false);
                  setShowLoginModal(false);
                }} 
                onLoginSuccess={(user) => {
                  handleLogin(user);
                  setShowLoginModal(false);
                }}
                showToast={showToast}
                casinoName={casinoName}
                isLoggedIn={isLoggedIn}
                welcomeBonus={welcomeBonus}
              />
          </div>
        )}
      </AnimatePresence>

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
