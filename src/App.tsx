import React, { useState, useEffect } from "react";
import { doc, getDoc, setDoc, updateDoc, onSnapshot, serverTimestamp, runTransaction, increment, collection, query, where, getDocs, Timestamp, documentId } from 'firebase/firestore';
import { signInWithPopup, onAuthStateChanged, signOut } from 'firebase/auth';
import { motion, AnimatePresence } from 'motion/react';
import { db, auth, googleProvider, handleFirestoreError, OperationType } from './firebase';
import LoginPage from './LoginPage';
import LogoPreview from './components/LogoPreview';
import BonusCenter from './components/BonusCenter';
import ProfileView from "./components/ProfileView";
import InviteView from "./components/InviteView";
import HomeView from "./components/HomeView";
import DepositView from "./components/DepositView";
import WalletView from "./components/WalletView";
import AviatorGame from "./components/AviatorGame";
import SupportChat from "./components/SupportChat";
import SlotGame from "./components/SlotGame";
import PromoCodeModal from "./components/PromoCodeModal";
import PermissionManager from "./components/PermissionManager";
import NotificationCenter from "./components/NotificationCenter";
import AdminPanel from "./components/admin/AdminPanel";
import FAQView from "./components/FAQView";
import Sidebar from "./components/Sidebar";
import LeaderboardView from "./components/LeaderboardView";
import { GameGrid, Game } from "./components/GameGrid";
import { CasinoGallery } from "./components/CasinoGallery";
import { GAME_IMAGES } from "./constants/gameAssets";
import { saveItem, getSavedItems, removeItem, updateUserProfile, updateFavorites, updateBalance, updateGlobalGameLogo, updateGlobalGameName, updateGlobalGameUrl, updateGlobalGameOption, updateAllButtonName, updateCasinoName, logUserActivity } from './services/firebaseService';
import GameLoader from "./components/GameLoader";
import { ToastContainer, ToastType } from "./components/Toast";
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
  Trophy,
  Bell,
  Moon,
  Sun,
  ArrowDownLeft,
  Zap
} from "lucide-react";

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'home' | 'profile' | 'invite' | 'deposit' | 'bonus' | 'admin' | 'wallet' | 'faq'>('home');
  const [profileSubTab, setProfileSubTab] = useState<string>('dashboard');

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
      } else if (path === '/admin') {
        setActiveTab('admin');
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
    } else if (activeTab === 'admin') {
      newPath = '/admin';
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
    setIsTabLoading(true);
    logUserActivity('page_view', { from: activeTab, to: tab });
    setTimeout(() => {
      setActiveTab(tab);
      setIsTabLoading(false);
    }, 500);
  };

  const [recentlyPlayed, setRecentlyPlayed] = useState<Game[]>([]);



  const handleGameSelect = async (game: Game | null) => {
    setSelectedGame(game);
    if (game) {
      setIsGameLoading(true);
      logUserActivity('game_selection', { gameId: game.id, gameName: game.name });
    }
    if (game && userData?.id) {
      // Update recently played list
      const updatedList = [game, ...recentlyPlayed.filter(g => g.id !== game.id)].slice(0, 10);
      setRecentlyPlayed(updatedList);
      
      // Persist to Firestore
      try {
        const userRef = doc(db, 'users', userData.id);
        await updateDoc(userRef, {
          recentlyPlayedIds: updatedList.map(g => g.id)
        });
      } catch (err) {
        console.error("Failed to update recently played:", err);
      }
    }
  };

  useEffect(() => {
    if (isLoggedIn && userData?.id) {
      updateFavorites(userData.id, favorites);
    }
  }, [favorites, isLoggedIn, userData?.id]);

  useEffect(() => {
    if (!userData?.id || !isLoggedIn) return;

    const path = `users/${userData.id}/notifications`;
    const q = query(collection(db, path), where('read', '==', false));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setUnreadNotificationsCount(snapshot.size);
      
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          const data = change.doc.data();
          const createdAt = data.createdAt?.toDate();
          if (createdAt && (new Date().getTime() - createdAt.getTime() < 10000)) {
            showToast(data.title, "info");
          }
        }
      });
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });

    return () => unsubscribe();
  }, [userData?.id, isLoggedIn]);
  const [balance, setBalance] = useState(24590.50);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSupportChatOpen, setIsSupportChatOpen] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showRegistrationSuccess, setShowRegistrationSuccess] = useState(false);
  const [showLogoPreview, setShowLogoPreview] = useState(false);
  const [aviatorLogo, setAviatorLogo] = useState<string | null>('https://storage.googleapis.com/genai-studio-user-uploads/projects/ais-dev-wxllhxlbpwpt7cv6zg665n/uploads/1743526563604-image.png');
  const [globalLogos, setGlobalLogos] = useState<Record<string, string>>({});
  const [globalNames, setGlobalNames] = useState<Record<string, string>>({});
  const [globalUrls, setGlobalUrls] = useState<Record<string, string>>({});
  const [isGameLoading, setIsGameLoading] = useState(false);

  useEffect(() => {
    if (isGameLoading && selectedGame) {
      // If it's an iframe game, the onLoad handler will set isGameLoading to false.
      // For other games (Aviator, Slot, or placeholder), we simulate a loading time.
      if (!globalUrls[selectedGame.id]) {
        const timer = setTimeout(() => {
          setIsGameLoading(false);
        }, 3000);
        return () => clearTimeout(timer);
      } else if (selectedGame.id === '5' || selectedGame.provider === 'CRASH' || selectedGame.category === 'স্লট') {
        const timer = setTimeout(() => {
          setIsGameLoading(false);
        }, 3000);
        return () => clearTimeout(timer);
      }
    }
  }, [isGameLoading, selectedGame, globalUrls]);
  const [globalOptions, setGlobalOptions] = useState<Record<string, string>>({});
  const [allButtonName, setAllButtonName] = useState<string>("ALL");
  const [casinoName, setCasinoName] = useState<string>("SPIN71BET");
  const [telegramLink, setTelegramLink] = useState<string>("https://t.me/spin71bet_official");
  const [whatsappLink, setWhatsappLink] = useState<string>("https://wa.me/...");
  const [facebookLink, setFacebookLink] = useState<string>("https://facebook.com/...");
  const [supportEmail, setSupportEmail] = useState<string>("support@example.com");
  const [minDeposit, setMinDeposit] = useState<number>(100);
  const [minWithdraw, setMinWithdraw] = useState<number>(500);
  const [welcomeBonus, setWelcomeBonus] = useState<number>(507);
  const [noticeText, setNoticeText] = useState<string>("আমাদের গেম উপভোগ করুন এবং বড় জয় নিশ্চিত করুন!");
  const [toasts, setToasts] = useState<{ id: string; message: string; type: ToastType }[]>([]);

  // Referral tracking
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref) {
      localStorage.setItem('referralCode', ref);
    }
    
    // Admin tab switch
    const tab = params.get('tab');
    if (tab === 'admin') {
      setActiveTab('admin');
    }
  }, []);

  useEffect(() => {
    if (!isLoggedIn) return;
    const path = `global_config/ui_settings`;
    const unsubscribe = onSnapshot(doc(db, path), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.allButtonName) {
          setAllButtonName(data.allButtonName);
        }
        if (data.casinoName) {
          setCasinoName(data.casinoName);
        }
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    });

    return () => unsubscribe();
  }, [isLoggedIn]);

  useEffect(() => {
    if (!isLoggedIn) return;
    const path = `global_config/app_settings`;
    const unsubscribe = onSnapshot(doc(db, path), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.casinoName) setCasinoName(data.casinoName);
        if (data.telegramLink) setTelegramLink(data.telegramLink);
        if (data.whatsappLink) setWhatsappLink(data.whatsappLink);
        if (data.facebookLink) setFacebookLink(data.facebookLink);
        if (data.supportEmail) setSupportEmail(data.supportEmail);
        if (data.minDeposit) setMinDeposit(data.minDeposit);
        if (data.minWithdraw) setMinWithdraw(data.minWithdraw);
        if (data.welcomeBonus) setWelcomeBonus(data.welcomeBonus);
        if (data.noticeText) setNoticeText(data.noticeText);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    });

    return () => unsubscribe();
  }, [isLoggedIn]);

  useEffect(() => {
    if (!isLoggedIn) return;
    const path = `global_config/game_logos`;
    const unsubscribe = onSnapshot(doc(db, path), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setGlobalLogos(data as Record<string, string>);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    });

    return () => unsubscribe();
  }, [isLoggedIn]);

  useEffect(() => {
    if (!isLoggedIn) return;
    const path = `global_config/game_names`;
    const unsubscribe = onSnapshot(doc(db, path), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setGlobalNames(data as Record<string, string>);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    });

    return () => unsubscribe();
  }, [isLoggedIn]);

  useEffect(() => {
    if (!isLoggedIn) return;
    const path = `global_config/game_urls`;
    const unsubscribe = onSnapshot(doc(db, path), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setGlobalUrls(data as Record<string, string>);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    });

    return () => unsubscribe();
  }, [isLoggedIn]);

  useEffect(() => {
    if (!isLoggedIn) return;
    const path = `global_config/game_options`;
    const unsubscribe = onSnapshot(doc(db, path), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setGlobalOptions(data as Record<string, string>);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    });

    return () => unsubscribe();
  }, [isLoggedIn]);

  const showToast = (message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const handleLogoSelect = (logo: string) => {
    setAviatorLogo(logo);
    if (userData?.id) {
      updateDoc(doc(db, 'users', userData.id), {
        aviatorLogo: logo
      }).catch(err => handleFirestoreError(err, OperationType.UPDATE, `users/${userData.id}`));
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      showToast("ব্যালেন্স আপডেট করা হয়েছে", "success");
    }, 800);
  };

  const handleUpdateGlobalGameLogo = async (gameId: string, logo: string) => {
    await updateGlobalGameLogo(gameId, logo, userData?.role === 'admin');
    if (userData?.role !== 'admin') {
      showToast("পরিবর্তনের অনুরোধ পাঠানো হয়েছে। অ্যাডমিন অ্যাপ্রুভ করলে আপডেট হবে।", "success");
    } else {
      showToast("গেম লোগো আপডেট হয়েছে", "success");
    }
  };

  const handleUpdateGlobalGameName = async (gameId: string, name: string) => {
    await updateGlobalGameName(gameId, name, userData?.role === 'admin');
    if (userData?.role !== 'admin') {
      showToast("পরিবর্তনের অনুরোধ পাঠানো হয়েছে। অ্যাডমিন অ্যাপ্রুভ করলে আপডেট হবে।", "success");
    } else {
      showToast("গেমের নাম আপডেট হয়েছে", "success");
    }
  };

  const [isAuthInitialized, setIsAuthInitialized] = useState(false);

  useEffect(() => {
    let unsubscribeDoc: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setIsAuthInitialized(true);
      if (user) {
        const firebaseUid = user.uid;
        
        try {
          // Check if user exists first
          const userRef = doc(db, 'users', firebaseUid);
          const userDoc = await getDoc(userRef);
          
          if (!userDoc.exists()) {
            console.log("User does not exist in Firestore, creating...");
            
            // 1. Handle referral code query OUTSIDE transaction
            const savedReferralCode = localStorage.getItem('referralCode');
            let referredBy = null;
            
            // Security Checks: Device ID and IP
            let deviceId = localStorage.getItem('deviceId');
            if (!deviceId) {
              deviceId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
              localStorage.setItem('deviceId', deviceId);
            }
            
            // Non-blocking IP fetch
            let userIp = 'unknown';
            fetch('https://api.ipify.org?format=json')
              .then(res => res.json())
              .then(data => { userIp = data.ip; })
              .catch(e => console.error('Failed to fetch IP', e));

            if (savedReferralCode) {
              const usersRef = collection(db, 'users');
              const q = query(usersRef, where('referralCode', '==', savedReferralCode));
              const agentSnapshot = await getDocs(q);
              if (!agentSnapshot.empty) {
                const agentDoc = agentSnapshot.docs[0];
                const agentData = agentDoc.data();
                
                // Prevent self-referral abuse
                if (agentData.deviceId !== deviceId && agentData.ip !== userIp) {
                  referredBy = agentDoc.id;
                } else {
                  console.warn('Self-referral detected and blocked.');
                }
              }
            }

            // 2. Perform transaction to create user
            try {
              await runTransaction(db, async (transaction) => {
                const metadataRef = doc(db, 'metadata', 'users');
                const metadataDoc = await transaction.get(metadataRef);
                
                let nextId = 101;
                if (metadataDoc.exists()) {
                  nextId = (metadataDoc.data().userCount || 100) + 1;
                }
                
                const username = `K71${nextId}`;
                
                const newUser: any = {
                  username: username,
                  numericId: nextId.toString(),
                  referralCode: username,
                  phoneNumber: 'Not Provided',
                  password: user.isAnonymous ? 'anonymous-auth' : 'email-auth',
                  balance: 0,
                  turnover: 0,
                  requiredTurnover: 1100,
                  createdAt: serverTimestamp(),
                  role: 'user',
                  isGmailLinked: false,
                  favorites: [],
                  vipLevel: 0,
                  vipProgress: 0,
                  profilePictureUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
                  deviceId: deviceId,
                  ip: userIp
                };
                
                if (referredBy) {
                  newUser.referredBy = referredBy;
                  const referralRef = doc(collection(db, 'users', referredBy, 'referrals'));
                  transaction.set(referralRef, {
                    referredUserId: firebaseUid,
                    referredUsername: username,
                    joinedAt: serverTimestamp(),
                    earningsGenerated: 0,
                    status: 'active'
                  });
                  const agentRef = doc(db, 'users', referredBy);
                  transaction.update(agentRef, {
                    referralCount: increment(1)
                  });
                }
                
                if (user.email) {
                  newUser.gmail = user.email;
                  newUser.isGmailLinked = true;
                }
                
                transaction.set(userRef, newUser);
                transaction.set(metadataRef, { userCount: nextId });
              });
              console.log("User created successfully in Firestore.");
            } catch (transactionError) {
              console.error("Transaction failed:", transactionError);
              throw transactionError;
            }
          }
          
          // Set up real-time listener
          unsubscribeDoc = onSnapshot(doc(db, 'users', firebaseUid), (docSnap) => {
            if (docSnap.exists()) {
              const data = docSnap.data();
              
              // Lazy migration for numericId
              if (!data.numericId) {
                const numericPart = data.username?.replace('K71', '');
                if (numericPart && !isNaN(Number(numericPart))) {
                  updateDoc(doc(db, 'users', firebaseUid), { numericId: numericPart });
                } else {
                  // Fallback: generate a random 8-digit ID if username doesn't follow pattern
                  const randomId = Math.floor(10000000 + Math.random() * 90000000).toString();
                  updateDoc(doc(db, 'users', firebaseUid), { numericId: randomId });
                }
              }

              setUserData({ ...data, id: firebaseUid });
              setBalance(data.balance || 0);
              setFavorites(data.favorites || []);
              setAviatorLogo(data.aviatorLogo || null);
              if (justLoggedIn) {
                showToast("লগইন সফল হয়েছে! (Login successful!)", "success");
                setJustLoggedIn(false);
              }
              setIsLoggedIn(true);
            }
          }, (error) => {
            handleFirestoreError(error, OperationType.GET, `users/${firebaseUid}`);
            showToast("ডেটা লোড করতে ব্যর্থ হয়েছে। (Failed to load data.)", "error");
          });
        } catch (e) {
          console.error("Failed to fetch/create user data", e);
          showToast("অ্যাকাউন্ট তৈরি বা লোড করতে সমস্যা হয়েছে। (Error loading account.)", "error");
        }
      } else {
        if (unsubscribeDoc) unsubscribeDoc();
        unsubscribeDoc = null;
        setIsLoggedIn(false);
        setUserData(null);
        setFavorites([]);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeDoc) unsubscribeDoc();
    };
  }, []);

  // Update splash screen logic
  useEffect(() => {
    if (isAuthInitialized) {
      setShowSplash(false);
    }
  }, [isAuthInitialized]);

  useEffect(() => {
    // Save balance changes to localStorage
    if (isLoggedIn && userData) {
      const updatedUser = { ...userData, balance };
      localStorage.setItem('spin71_user', JSON.stringify(updatedUser));
    }
  }, [balance, isLoggedIn, userData]);

  const handleEditCasinoName = async (newName: string) => {
    if (!userData || (userData.role !== 'admin' && userData.role !== 'agent')) {
      showToast("আপনার এই পরিবর্তনের অনুমতি নেই (Permission Denied)", "error");
      return;
    }
    try {
      await updateCasinoName(newName);
      setCasinoName(newName);
      showToast("ক্যাসিনো নাম সফলভাবে পরিবর্তন করা হয়েছে", "success");
    } catch (error) {
      console.error("Failed to update casino name:", error);
      showToast("পরিবর্তন করতে ব্যর্থ হয়েছে", "error");
    }
  };

  const handleLogout = () => {
    logUserActivity('session_end');
    signOut(auth);
    setIsLoggedIn(false);
    setUserData(null);
    showToast("লগ আউট সফল হয়েছে। (Logged out.)", "info");
  };

  const handleBalanceUpdate = (newBalance: number) => {
    setBalance(newBalance);
    if (isLoggedIn && userData?.id) {
      updateBalance(userData.id, newBalance);
    }
  };

  const handleToggleFavorite = (gameId: string) => {
    const newFavorites = favorites.includes(gameId)
      ? favorites.filter(id => id !== gameId)
      : [...favorites, gameId];
    
    setFavorites(newFavorites);
    const userId = auth.currentUser?.uid;
    if (isLoggedIn && userId) {
      updateFavorites(userId, newFavorites).then(() => {
        showToast(favorites.includes(gameId) ? "পছন্দ থেকে সরানো হয়েছে" : "পছন্দে যোগ করা হয়েছে", "info");
      }).catch(err => {
        console.error("Failed to update favorites in Firestore:", err);
        showToast("পছন্দ আপডেট করতে ব্যর্থ হয়েছে", "error");
      });
    }
  };

  useEffect(() => {
    if (showDepositRequired) {
      const timer = setTimeout(() => {
        setShowDepositRequired(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showDepositRequired]);

  useEffect(() => {
    if (isLoggedIn && userData?.id) {
      logUserActivity('session_start');
    }
  }, [isLoggedIn, userData?.id]);

  if (showSplash) {
    return (
      <div className="max-w-md mx-auto bg-gradient-to-b from-[#1a5b3d] via-[#228b22] to-[#1a5b3d] min-h-[100dvh] relative overflow-hidden flex flex-col items-center justify-center font-sans safe-top safe-bottom">
        {/* Background Curtains/Lines Effect */}
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 10px, rgba(255,255,255,0.1) 10px, rgba(255,255,255,0.1) 20px)'
        }}></div>

        {/* Glowing Rings */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full border-2 border-green-400/50 shadow-[0_0_50px_rgba(74,222,128,0.5)]"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full border border-green-300/30"></div>

        {/* Logo */}
        <div className="absolute top-24 z-20 text-5xl font-black italic tracking-tighter drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)] flex items-center">
          <div className="relative">
            <span className="bg-gradient-to-b from-yellow-200 via-yellow-400 to-yellow-600 text-transparent bg-clip-text" style={{ WebkitTextStroke: '1px #b45309' }}>
              SPIN71
            </span>
            <div className="absolute -top-4 -left-4 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse shadow-lg z-40">REAL</div>
            {/* Improved Flying Plane with Trail */}
            <div className="absolute -top-16 -right-16 animate-[fly-around_4s_linear_infinite] pointer-events-none z-30">
              <div className="relative">
                {/* Smoke Trail */}
                <div className="absolute right-full top-1/2 -translate-y-1/2 w-64 h-3 bg-gradient-to-l from-white/40 to-transparent blur-lg transform origin-right rotate-12"></div>
                {/* Improved Stylized Plane SVG */}
                <svg 
                  viewBox="0 0 100 100" 
                  className="w-24 h-24 drop-shadow-[0_0_20px_rgba(239,68,68,0.8)] transform -rotate-45"
                >
                  <defs>
                    <linearGradient id="planeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#ef4444" />
                      <stop offset="100%" stopColor="#991b1b" />
                    </linearGradient>
                  </defs>
                  {/* Plane Body */}
                  <path 
                    d="M15,50 L45,45 L85,25 L90,30 L55,50 L90,70 L85,75 L45,55 Z" 
                    fill="url(#planeGrad)" 
                    stroke="white" 
                    strokeWidth="1.5"
                  />
                  {/* Cockpit */}
                  <path d="M45,45 L50,35 L60,35 L55,45 Z" fill="#fee2e2" opacity="0.8" />
                  {/* Propeller/Nose Glow */}
                  <circle cx="15" cy="50" r="4" fill="#fca5a5">
                    <animate attributeName="opacity" values="0.5;1;0.5" dur="0.5s" repeatCount="indefinite" />
                  </circle>
                </svg>
                <div className="absolute -top-2 -right-2 bg-red-600 text-white text-[8px] font-bold px-1 rounded-sm animate-pulse">LIVE</div>
                <div className="absolute -bottom-2 -left-2 bg-yellow-500 text-black text-[8px] font-black px-1 rounded-sm border border-yellow-600 shadow-lg">VIP</div>
              </div>
            </div>
          </div>
          <span className="bg-gradient-to-b from-green-300 via-green-400 to-green-500 text-transparent bg-clip-text ml-1" style={{ WebkitTextStroke: '1px #064e3b' }}>
            BET
          </span>
        </div>

        <button 
          onClick={() => setShowSplash(false)}
          className="absolute top-6 right-6 z-30 bg-black/40 text-white/70 text-xs px-3 py-1 rounded-full border border-white/10 hover:bg-black/60 transition-colors"
        >
          SKIP
        </button>

        {/* Center Stage Elements */}
        <div className="relative z-10 mt-20 flex flex-col items-center">
          {/* Stage Base */}
          <div className="absolute bottom-0 w-64 h-16 bg-green-600 rounded-[100%] blur-sm opacity-50"></div>
          <div className="absolute bottom-2 w-56 h-12 bg-gradient-to-b from-green-400 to-green-700 rounded-[100%] border-t border-green-300 shadow-[0_0_30px_rgba(74,222,128,0.8)]"></div>

          {/* Coins Stack */}
          <div className="absolute bottom-6 flex gap-1">
            <div className="w-16 h-4 bg-yellow-500 rounded-[100%] border border-yellow-300 relative">
               <div className="absolute -top-2 w-16 h-4 bg-yellow-400 rounded-[100%] border border-yellow-200"></div>
               <div className="absolute -top-4 w-16 h-4 bg-yellow-300 rounded-[100%] border border-yellow-100"></div>
            </div>
            <div className="w-16 h-4 bg-yellow-500 rounded-[100%] border border-yellow-300 relative">
               <div className="absolute -top-2 w-16 h-4 bg-yellow-400 rounded-[100%] border border-yellow-200"></div>
               <div className="absolute -top-4 w-16 h-4 bg-yellow-300 rounded-[100%] border border-yellow-100"></div>
            </div>
          </div>

          {/* Main Crown/Jester Hat */}
          <div className="relative z-20 mb-8 transform hover:scale-105 transition-transform duration-700 animate-bounce" style={{ animationDuration: '3s' }}>
            <svg width="180" height="150" viewBox="0 0 200 180" className="drop-shadow-2xl">
              <defs>
                <linearGradient id="gold" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#fef08a" />
                  <stop offset="50%" stopColor="#eab308" />
                  <stop offset="100%" stopColor="#a16207" />
                </linearGradient>
                <linearGradient id="red" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#fca5a5" />
                  <stop offset="50%" stopColor="#ef4444" />
                  <stop offset="100%" stopColor="#991b1b" />
                </linearGradient>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>
              
              {/* Base */}
              <path d="M40 140 Q100 160 160 140 L150 160 Q100 170 50 160 Z" fill="url(#gold)" stroke="#fff" strokeWidth="2"/>
              
              {/* Left Point */}
              <path d="M45 140 Q30 90 20 60 Q50 80 70 145 Z" fill="url(#gold)" stroke="#fff" strokeWidth="2"/>
              <path d="M48 138 Q35 90 25 65 Q45 80 65 142 Z" fill="url(#red)"/>
              <circle cx="20" cy="55" r="12" fill="url(#gold)" stroke="#fff" strokeWidth="2" filter="url(#glow)"/>
              
              {/* Right Point */}
              <path d="M155 140 Q170 90 180 60 Q150 80 130 145 Z" fill="url(#gold)" stroke="#fff" strokeWidth="2"/>
              <path d="M152 138 Q165 90 175 65 Q155 80 135 142 Z" fill="url(#red)"/>
              <circle cx="180" cy="55" r="12" fill="url(#gold)" stroke="#fff" strokeWidth="2" filter="url(#glow)"/>
              
              {/* Center Point */}
              <path d="M70 145 Q100 40 100 20 Q100 40 130 145 Z" fill="url(#gold)" stroke="#fff" strokeWidth="2"/>
              <path d="M75 142 Q100 45 100 25 Q100 45 125 142 Z" fill="url(#red)"/>
              <circle cx="100" cy="15" r="15" fill="url(#gold)" stroke="#fff" strokeWidth="2" filter="url(#glow)"/>
            </svg>
          </div>

          {/* Floating Elements */}
          <div className="absolute -left-12 bottom-10 transform -rotate-12 z-30">
            <div className="w-16 h-20 bg-gradient-to-br from-yellow-100 to-yellow-400 rounded border-2 border-yellow-200 shadow-lg flex flex-col items-center justify-center p-1">
              <span className="text-red-600 font-black text-xl">WILD</span>
              <div className="w-8 h-8 bg-red-500 rotate-45 mt-1"></div>
            </div>
          </div>

          <div className="absolute -right-10 bottom-12 transform rotate-12 z-30">
            <div className="w-16 h-16 bg-gradient-to-br from-yellow-300 to-yellow-600 rounded-full border-2 border-yellow-200 shadow-lg flex items-center justify-center">
              <div className="w-12 h-12 border border-yellow-200 rounded-full flex items-center justify-center">
                <span className="text-yellow-100 text-xs">🦁</span>
              </div>
            </div>
          </div>

          {/* Plane */}
          <div className="absolute -right-16 top-0 transform -rotate-45 z-10 animate-pulse">
            <svg width="60" height="60" viewBox="0 0 24 24" fill="#ef4444" className="drop-shadow-lg">
              <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
            </svg>
          </div>

          {/* Floating Coins */}
          <div className="absolute -left-20 top-10 w-8 h-8 bg-yellow-400 rounded-full border-2 border-yellow-200 shadow-[0_0_15px_rgba(250,204,21,0.6)]"></div>
          <div className="absolute -right-4 -bottom-16 w-10 h-10 bg-yellow-400 rounded-full border-2 border-yellow-200 shadow-[0_0_15px_rgba(250,204,21,0.6)] transform rotate-45"></div>
        </div>

        {/* Loading Section */}
        <div className="absolute bottom-20 w-full px-12 flex flex-col items-center gap-4">
          <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5 p-[1px]">
            <motion.div 
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 2, ease: "easeInOut" }}
              className="h-full bg-gradient-to-r from-yellow-600 via-yellow-400 to-yellow-200 rounded-full shadow-[0_0_10px_rgba(234,179,8,0.5)]"
            />
          </div>
          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-2 text-yellow-500/60 text-[10px] font-black uppercase tracking-[0.3em] animate-pulse">
              <RefreshCw size={12} className="animate-spin" />
              লোডিং হচ্ছে... (Loading...)
            </div>
            <p className="text-[8px] text-white/20 font-bold uppercase tracking-widest">
              Preparing your premium experience
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!isLoggedIn || showRegistrationSuccess) {
    return (
      <LoginPage 
        onRegisterSuccess={() => {
          setShowRegistrationSuccess(true);
          showToast("অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে!", "success");
        }} 
        onContinue={() => setShowRegistrationSuccess(false)} 
        onLoginSuccess={() => setJustLoggedIn(true)}
        showToast={showToast}
        casinoName={casinoName}
        isLoggedIn={isLoggedIn}
        welcomeBonus={welcomeBonus}
      />
    );
  }

  return (
    <div className="max-w-md mx-auto bg-[var(--bg-main)] min-h-[100dvh] relative overflow-x-hidden font-sans text-[var(--text-main)] pb-16 flex flex-col safe-top transition-colors duration-300">
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

      {/* Main Content Area */}
      <div className="relative min-h-[calc(100vh-120px)]">
        {activeTab === 'faq' && (
          <FAQView />
        )}
        {activeTab === 'admin' && (userData?.role === 'admin' || userData?.email === 'owner.css13@gmail.com') && (
          <AdminPanel showToast={showToast} />
        )}
        {activeTab === 'home' && (
          <HomeView 
            userData={userData}
            recentlyPlayed={recentlyPlayed}
            favorites={favorites}
            handleGameSelect={handleGameSelect}
            setShowLeaderboard={setShowLeaderboard}
            globalLogos={globalLogos}
            globalNames={globalNames}
            globalUrls={globalUrls}
            globalOptions={globalOptions}
            balance={balance}
            isRefreshing={isRefreshing}
            handleRefresh={handleRefresh}
            setIsSidebarOpen={setIsSidebarOpen}
            setIsNotificationCenterOpen={setIsNotificationCenterOpen}
            unreadNotificationsCount={unreadNotificationsCount}
            setShowGallery={setShowGallery}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            activeCategory={activeCategory}
            setActiveCategory={setActiveCategory}
            handleToggleFavorite={handleToggleFavorite}
            updateGlobalGameLogo={handleUpdateGlobalGameLogo}
            updateGlobalGameName={handleUpdateGlobalGameName}
            updateGlobalGameUrl={updateGlobalGameUrl}
            updateGlobalGameOption={updateGlobalGameOption}
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
          />
        )}

      {/* Game Play Modal */}
      <AnimatePresence>
        {isGameLoading && selectedGame && selectedGame.provider !== 'JILI' && (
          <GameLoader 
            gameName={globalNames[selectedGame.id] || selectedGame.name}
            provider={globalOptions[selectedGame.id] || selectedGame.provider}
            logo={globalLogos[selectedGame.id] || selectedGame.image}
          />
        )}
      </AnimatePresence>

      {selectedGame && globalUrls[selectedGame.id] ? (
        <div className="full-display-game flex flex-col safe-top safe-bottom">
          {/* Game Header */}
          <div className="flex items-center justify-between p-4 bg-teal-900 border-b border-teal-800 shrink-0">
            <button 
              onClick={() => handleGameSelect(null)}
              className="text-white p-1 hover:bg-teal-800 rounded-full transition-colors"
            >
              <ArrowLeft size={24} />
            </button>
            <div className="flex flex-col items-center">
              <h3 className="text-white font-bold text-sm">{globalNames[selectedGame.id] || selectedGame.name}</h3>
              <span className="text-teal-300 text-[10px] uppercase tracking-widest">{globalOptions[selectedGame.id] || selectedGame.provider}</span>
            </div>
            <div className="w-8"></div>
          </div>

          {/* Game Viewport */}
          <div className="flex-1 relative bg-black flex flex-col items-center justify-center overflow-hidden w-full h-full">
            {selectedGame.provider === 'JILI' && isGameLoading && (
              <div className="absolute inset-0 z-[110] bg-[#050505] flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-500 overflow-hidden">
                {/* Background Glow */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-yellow-500/10 rounded-full blur-[120px] animate-pulse"></div>
                  <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-teal-500/5 rounded-full blur-[100px] animate-pulse delay-700"></div>
                </div>

                {/* Close Button at Top Left */}
                <button 
                  onClick={() => handleGameSelect(null)}
                  className="absolute top-6 left-6 w-10 h-10 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/10 hover:bg-black/60 transition-all active:scale-90 z-[120]"
                >
                  <X size={24} />
                </button>

                <div className="relative z-10 flex flex-col items-center max-w-xs w-full">
                  {/* Golden JILI Logo */}
                  <div className="relative mb-12 group">
                    <motion.h1 
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="text-8xl font-black tracking-tighter italic bg-gradient-to-b from-yellow-200 via-yellow-400 to-yellow-600 text-transparent bg-clip-text drop-shadow-[0_5px_25px_rgba(234,179,8,0.8)]" 
                      style={{ fontFamily: 'serif' }}
                    >
                      JILI
                    </motion.h1>
                    <div className="absolute -inset-8 bg-yellow-500/20 blur-3xl rounded-full -z-10 animate-pulse"></div>
                    
                    {/* Floating Particles */}
                    <div className="absolute -top-4 -right-4 w-2 h-2 bg-yellow-400 rounded-full animate-ping"></div>
                    <div className="absolute -bottom-2 -left-6 w-1.5 h-1.5 bg-yellow-200 rounded-full animate-bounce"></div>
                  </div>

                  {/* Game Info */}
                  <h2 className="text-2xl font-black text-white mb-1 tracking-tight italic uppercase">{globalNames[selectedGame.id] || selectedGame.name}</h2>
                  <p className="text-yellow-500/60 text-[10px] font-bold uppercase tracking-[0.4em] mb-10">JILI PREMIUM SLOTS</p>

                  {/* Progress Bar */}
                  <div className="w-full h-2.5 bg-gray-900/80 rounded-full overflow-hidden border border-white/5 shadow-inner mb-6 relative p-[1px]">
                    <motion.div 
                      initial={{ width: "0%" }}
                      animate={{ width: "100%" }}
                      transition={{ 
                        duration: 8, 
                        ease: "linear",
                        repeat: Infinity,
                        repeatType: "loop"
                      }}
                      className="h-full bg-gradient-to-r from-yellow-600 via-yellow-400 to-yellow-200 shadow-[0_0_15px_rgba(234,179,8,0.6)] rounded-full"
                    >
                      <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.3)_50%,transparent_75%,transparent_100%)] bg-[length:20px_20px] animate-[shimmer_1s_linear_infinite]"></div>
                    </motion.div>
                  </div>
                  
                  <div className="flex flex-col items-center gap-3">
                    <div className="flex items-center gap-2 text-yellow-500/40 text-[10px] font-bold uppercase tracking-[0.2em] animate-pulse">
                      <RefreshCw size={12} className="animate-spin" />
                      Loading Premium Assets...
                    </div>
                    
                    {/* Rotating Tips for JILI */}
                    <p className="text-[9px] text-white/20 font-medium italic max-w-[200px]">
                      "বড় জয়ের জন্য প্রস্তুত হন! JILI স্লট গেমগুলোতে আপনার ভাগ্য পরীক্ষা করুন।"
                    </p>
                  </div>

                  {/* Fun Tip */}
                  <div className="mt-16 p-4 bg-yellow-500/5 rounded-2xl border border-yellow-500/10 w-full backdrop-blur-sm">
                    <div className="flex items-center gap-2 mb-2 justify-center">
                      <Zap size={12} className="text-yellow-500" />
                      <span className="text-[8px] font-black text-yellow-500/60 uppercase tracking-widest">Pro Tip</span>
                    </div>
                    <p className="text-[10px] text-yellow-200/40 font-medium leading-relaxed italic">
                      "JILI স্লট গেমগুলোতে বড় জয়ের সুযোগ থাকে। আপনার ভাগ্য পরীক্ষা করুন!"
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            <iframe 
              src={globalUrls[selectedGame.id]} 
              className={`w-full h-full border-none transition-opacity duration-500 ${isGameLoading || selectedGame.provider === 'JILI' ? 'opacity-0' : 'opacity-100'}`}
              title={selectedGame.name}
              allowFullScreen
              onLoad={() => setIsGameLoading(false)}
            />
          </div>
        </div>
      ) : selectedGame && (selectedGame.id === '5' || selectedGame.provider === 'CRASH') ? (
        <AviatorGame 
          onClose={() => handleGameSelect(null)} 
          userBalance={userData?.balance || 0}
          onBalanceUpdate={(newBalance) => {
            if (userData?.id) updateBalance(userData.id, newBalance);
          }}
          logo={globalLogos['5'] || globalLogos.aviator || aviatorLogo}
          onLogoChange={async (newLogo) => {
            if (userData?.id) {
              await handleUpdateGlobalGameLogo('5', newLogo);
            }
          }}
          showToast={showToast}
          referredBy={userData?.referredBy}
          globalName={globalNames[selectedGame.id]}
        />
      ) : selectedGame && selectedGame.category === 'স্লট' ? (
        <SlotGame 
          game={selectedGame}
          globalLogo={globalLogos[selectedGame.id]}
          globalName={globalNames[selectedGame.id]}
          onClose={() => handleGameSelect(null)} 
          userBalance={userData?.balance || 0}
          onBalanceUpdate={(newBalance) => {
            if (userData?.id) updateBalance(userData.id, newBalance);
          }}
          referredBy={userData?.referredBy}
        />
      ) : selectedGame && (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col max-w-md mx-auto min-h-[100dvh] safe-top safe-bottom">
          {/* Game Header */}
          <div className="flex items-center justify-between p-4 bg-teal-900 border-b border-teal-800">
            <button 
              onClick={() => handleGameSelect(null)}
              className="text-white p-1 hover:bg-teal-800 rounded-full transition-colors"
            >
              <ArrowLeft size={24} />
            </button>
            <div className="flex flex-col items-center">
              <h3 className="text-white font-bold text-sm">{globalNames[selectedGame.id] || selectedGame.name}</h3>
              <span className="text-teal-300 text-[10px] uppercase tracking-widest">{globalOptions[selectedGame.id] || selectedGame.provider}</span>
            </div>
            <div className="w-8"></div>
          </div>

          {/* Game Viewport */}
          <div className="flex-1 relative bg-gray-900 flex flex-col items-center justify-center overflow-hidden">
            <>
              <img 
                src={globalLogos[selectedGame.id] || selectedGame.image} 
                className="absolute inset-0 w-full h-full object-cover opacity-20 blur-xl"
                alt="Background"
              />
              
              <div className="relative z-10 flex flex-col items-center text-center p-6">
                <div className={`w-48 h-64 rounded-2xl bg-gradient-to-b ${selectedGame.bgColor} shadow-2xl border-2 border-white/20 mb-8 overflow-hidden transform hover:scale-105 transition-transform duration-500 relative`}>
                  <img src={globalLogos[selectedGame.id] || selectedGame.image} className="w-full h-full object-cover opacity-80 mix-blend-overlay" alt={globalNames[selectedGame.id] || selectedGame.name} />
                  <div className="absolute top-2 right-2 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse shadow-lg">REAL</div>
                  <div className="absolute inset-0 flex items-center justify-center">
                     <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30">
                        <Play size={32} className="text-white fill-white ml-1" />
                     </div>
                  </div>
                </div>
                
                <h2 className="text-3xl font-black text-white mb-2 drop-shadow-lg">{globalNames[selectedGame.id] || selectedGame.name}</h2>
                <p className="text-teal-200 mb-8 max-w-[250px]">গেমটি প্রস্তুত! নিচে ক্লিক করে খেলা শুরু করুন এবং বড় জয়ের জন্য প্রস্তুত হন!</p>
                
                <button 
                  className="bg-gradient-to-b from-yellow-400 to-yellow-600 text-black font-black px-12 py-3 rounded-full text-lg shadow-[0_4px_15px_rgba(234,179,8,0.4)] hover:scale-105 transition-transform active:scale-95"
                >
                  খেলুন
                </button>
              </div>

              {/* Floating Particles/Effects */}
              <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-yellow-400 rounded-full animate-ping"></div>
              <div className="absolute bottom-1/3 right-1/4 w-3 h-3 bg-teal-400 rounded-full animate-pulse"></div>
              <div className="absolute top-1/2 right-10 w-1 h-1 bg-white rounded-full animate-bounce"></div>
            </>
          </div>

          {/* Game Footer */}
          <div className="p-4 bg-teal-950 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-teal-800 flex items-center justify-center">
                <Wallet size={16} className="text-yellow-400" />
              </div>
              <div>
                <p className="text-[10px] text-teal-400 uppercase font-bold">ব্যালেন্স</p>
                <p className="text-white font-bold text-sm">৳ {userData?.balance?.toLocaleString() || '0'}</p>
              </div>
            </div>
            <button 
              onClick={() => handleTabChange('deposit')}
              className="bg-teal-800 text-white px-4 py-1.5 rounded-lg text-xs font-bold border border-teal-700"
            >
              জমা করুন
            </button>
          </div>
        </div>
      )}

      {/* Casino Gallery Modal */}
      {showGallery && (
        <CasinoGallery onClose={() => setShowGallery(false)} />
      )}

      {/* Sidebar Overlay */}
      <Sidebar 
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        userData={userData}
        activeTab={activeTab}
        handleTabChange={handleTabChange}
        setIsSupportChatOpen={setIsSupportChatOpen}
        setShowLogoPreview={setShowLogoPreview}
        handleLogout={handleLogout}
        showToast={showToast}
        casinoName={casinoName}
        telegramLink={telegramLink}
        whatsappLink={whatsappLink}
        facebookLink={facebookLink}
        theme={theme}
        toggleTheme={toggleTheme}
      />

      {activeTab === 'profile' && (
        <ProfileView 
          onTabChange={handleTabChange} 
          balance={balance} 
          userData={userData} 
          onLogout={handleLogout} 
          showToast={showToast} 
          casinoName={casinoName} 
          onEditCasinoName={handleEditCasinoName}
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
          initialSubTab={profileSubTab as any}
          minWithdraw={minWithdraw}
        />
      )}
      {activeTab === 'bonus' && (
        <BonusCenter 
          userData={userData} 
          balance={balance} 
          onBalanceUpdate={setBalance} 
          onTabChange={handleTabChange} 
          showToast={showToast} 
          welcomeBonus={welcomeBonus} 
          onOpenPromoModal={() => setShowPromoModal(true)}
        />
      )}
      {activeTab === 'invite' && <InviteView onTabChange={handleTabChange} userData={userData} showToast={showToast} />}
      {activeTab === 'deposit' && <DepositView onTabChange={handleTabChange} balance={balance} onBalanceUpdate={handleBalanceUpdate} userData={userData} showToast={showToast} minDeposit={minDeposit} />}
      {activeTab === 'wallet' && (
        <WalletView 
          balance={balance} 
          userData={userData} 
          onTabChange={handleTabChange}
          onSubTabChange={setProfileSubTab}
          showToast={showToast}
          minWithdraw={minWithdraw}
        />
      )}
      </div>

      {/* Leaderboard Modal */}
      {showLeaderboard && (
        <div className="fixed inset-0 z-[120] bg-black flex flex-col max-w-md mx-auto">
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

      {/* Logo Preview Modal */}
      {showLogoPreview && (
        <div className="fixed inset-0 z-[150] bg-black flex flex-col max-w-md mx-auto">
          <LogoPreview onClose={() => setShowLogoPreview(false)} onSelect={handleLogoSelect} />
        </div>
      )}

      {/* Floating Telegram Support */}
      <div className="fixed bottom-20 right-4 md:right-[calc(50%-13rem)] z-40 flex flex-col gap-3">
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
      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-[#062e24] border-t border-white/5 flex justify-between px-4 py-2 text-[10px] text-white/40 z-50 shadow-[0_-4px_10px_rgba(0,0,0,0.3)]">
        <div 
          onClick={() => handleTabChange('home')}
          className={`flex flex-col items-center gap-1 cursor-pointer transition-colors ${activeTab === 'home' ? 'text-teal-400' : 'hover:text-white'}`}
        >
          <Home size={20} />
          <span>বাড়ি</span>
        </div>
        <div 
          onClick={() => handleTabChange('bonus')}
          className={`flex flex-col items-center gap-1 cursor-pointer transition-colors relative ${activeTab === 'bonus' ? 'text-teal-400' : 'hover:text-white'}`}
        >
          <Gift size={20} />
          <span>অফার</span>
          <div className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] font-bold px-1 rounded-full border border-[#062e24]">
            4
          </div>
        </div>
        <div 
          onClick={() => handleTabChange('invite')}
          className={`flex flex-col items-center gap-1 cursor-pointer transition-colors ${activeTab === 'invite' ? 'text-teal-400' : 'hover:text-white'}`}
        >
          <Users size={20} />
          <span>প্রচার</span>
        </div>
        <div 
          onClick={() => handleTabChange('deposit')}
          className={`flex flex-col items-center gap-1 relative cursor-pointer transition-colors ${activeTab === 'deposit' ? 'text-teal-400' : 'hover:text-white'}`}
        >
          <Wallet size={20} />
          <span>জমা</span>
          <div className="absolute -top-1 -right-3 bg-red-500 text-white text-[8px] font-bold px-1 rounded-lg border border-[#062e24]">
            +5%
          </div>
        </div>
        <div 
          onClick={() => handleTabChange('profile')}
          className={`flex flex-col items-center gap-1 cursor-pointer transition-colors ${activeTab === 'profile' ? 'text-teal-400' : 'hover:text-white'}`}
        >
          <User size={20} />
          <span>প্রোফাইল</span>
        </div>
      </div>

      {/* Deposit Required Popup */}
      {showDepositRequired && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[200] p-6 animate-in fade-in duration-300">
          <div className="bg-teal-900 p-8 rounded-3xl text-center relative shadow-2xl border-2 border-yellow-500 max-w-sm w-full animate-in zoom-in duration-300">
            <button onClick={() => setShowDepositRequired(false)} className="absolute top-4 left-4 text-teal-300 hover:text-white">
              <X size={24} />
            </button>
            <div className="w-20 h-20 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(234,179,8,0.4)]">
              <AlertCircle size={40} className="text-black" />
            </div>
            <h3 className="text-2xl font-black mb-2 text-white italic">ডিপোজিট আবশ্যক! (Deposit Required!)</h3>
            <p className="text-teal-200 text-lg mb-6">গেম খেলতে আপনাকে অন্তত একটি সর্বনিম্ন ডিপোজিট করতে হবে।</p>
            <div className="flex flex-col gap-3">
              <button 
                onClick={() => {
                  setShowDepositRequired(false);
                  handleTabChange('deposit');
                }}
                className="w-full bg-yellow-500 text-black font-black py-3 rounded-xl hover:bg-yellow-400 transition-colors shadow-lg"
              >
                ডিপোজিট করুন (Deposit Now)
              </button>
              <button 
                onClick={() => setShowDepositRequired(false)}
                className="w-full bg-teal-800 text-white font-bold py-2 rounded-xl hover:bg-teal-700 transition-colors"
              >
                পরে করব (Later)
              </button>
            </div>
          </div>
        </div>
      )}

      {isLoggedIn && <PermissionManager />}

      <PromoCodeModal 
        isOpen={showPromoModal}
        onClose={() => setShowPromoModal(false)}
        showToast={showToast}
        isAdmin={userData?.role === 'admin'}
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
