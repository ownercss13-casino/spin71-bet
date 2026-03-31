import React, { useState, useEffect } from "react";
import { doc, getDoc, setDoc, updateDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { signInWithPopup, onAuthStateChanged, signOut } from 'firebase/auth';
import { db, auth, googleProvider, handleFirestoreError, OperationType } from './firebase';
import LoginPage from './LoginPage';
import BonusCenter from './BonusCenter';
import ProfileView from "./components/ProfileView";
import InviteView from "./components/InviteView";
import DepositView from "./components/DepositView";
import AviatorGame from "./components/AviatorGame";
import SupportChat from "./components/SupportChat";
import { GameGrid, Game } from "./components/GameGrid";
import { CasinoGallery } from "./components/CasinoGallery";
import { saveItem, getSavedItems, removeItem, updateUserProfile, updateFavorites, updateBalance } from './services/firebaseService';
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
  Download
} from "lucide-react";

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'home' | 'profile' | 'invite' | 'deposit' | 'bonus'>('home');
  const [activeCategory, setActiveCategory] = useState('সেরা');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [showGallery, setShowGallery] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [showDepositRequired, setShowDepositRequired] = useState(false);

  const handleTabChange = (tab: any) => {
    setIsLoading(true);
    setTimeout(() => {
      setActiveTab(tab);
      setIsLoading(false);
    }, 990);
  };

  const handleGameSelect = (game: Game | null) => {
    if (game && !userData?.hasMadeDeposit) {
      setShowDepositRequired(true);
      return;
    }
    setIsLoading(true);
    setTimeout(() => {
      setSelectedGame(game);
      setIsLoading(false);
    }, 990);
  };

  useEffect(() => {
    if (isLoggedIn && userData?.id) {
      updateFavorites(userData.id, favorites);
    }
  }, [favorites, isLoggedIn, userData?.id]);
  const [balance, setBalance] = useState(24590.50);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSupportChatOpen, setIsSupportChatOpen] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 990);
  };

  useEffect(() => {
    let unsubscribeDoc: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const firebaseUid = user.uid;
        
        // Initial fetch to create user if not exists
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUid));
          if (!userDoc.exists()) {
            const newUser = {
              username: user.displayName || 'Player',
              phoneNumber: '01XXXXXXXXX',
              password: 'google-auth',
              balance: 0,
              createdAt: serverTimestamp(),
              gmail: user.email,
              isGmailLinked: true,
              favorites: []
            };
            await setDoc(doc(db, 'users', firebaseUid), newUser);
          }
          
          // Clean up previous listener if any
          if (unsubscribeDoc) unsubscribeDoc();

          // Set up real-time listener
          unsubscribeDoc = onSnapshot(doc(db, 'users', firebaseUid), (docSnap) => {
            if (docSnap.exists()) {
              const data = docSnap.data();
              setUserData({ ...data, id: firebaseUid });
              setBalance(data.balance || 0);
              setFavorites(data.favorites || []);
              setIsLoggedIn(true);
            }
          }, (error) => {
            handleFirestoreError(error, OperationType.GET, `users/${firebaseUid}`);
          });
        } catch (e) {
          console.error("Failed to fetch/create user data", e);
        }
      } else {
        if (unsubscribeDoc) unsubscribeDoc();
        unsubscribeDoc = null;
        setIsLoggedIn(false);
        setUserData(null);
        setFavorites([]);
      }
    });

    // Hide splash screen after 0.99 seconds
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 990);

    return () => {
      clearTimeout(timer);
      unsubscribeAuth();
      if (unsubscribeDoc) unsubscribeDoc();
    };
  }, []);

  useEffect(() => {
    // Save balance changes to localStorage
    if (isLoggedIn && userData) {
      const updatedUser = { ...userData, balance };
      localStorage.setItem('spin71_user', JSON.stringify(updatedUser));
    }
  }, [balance, isLoggedIn, userData]);

  const handleLogout = () => {
    signOut(auth);
    setIsLoggedIn(false);
    setUserData(null);
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
    if (isLoggedIn && userData?.id) {
      updateFavorites(userData.id, newFavorites).catch(err => {
        console.error("Failed to update favorites in Firestore:", err);
      });
    }
  };

  if (showSplash) {
    return (
      <div className="max-w-md mx-auto bg-gradient-to-b from-[#1a5b3d] via-[#228b22] to-[#1a5b3d] min-h-screen relative overflow-hidden flex flex-col items-center justify-center font-sans">
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

        {/* Loading Text */}
        <div className="absolute bottom-10 text-green-200 text-sm font-medium animate-pulse">
          লোডিং...
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return <LoginPage />;
  }

  return (
    <div className="max-w-md mx-auto bg-[#16a374] min-h-screen relative overflow-x-hidden font-sans text-white pb-16 flex flex-col">
      {activeTab === 'home' && (
        <>
          {/* Top App Download Banner */}
      <div className="bg-[#128a61] px-2 py-1.5 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <button className="text-teal-200">
            <X size={14} />
          </button>
          <div className="flex items-center gap-1">
            <span className="bg-gradient-to-b from-yellow-400 to-yellow-600 text-black px-1 rounded text-[10px] font-bold border border-yellow-300">
              SPIN71BET.com
            </span>
            <span className="text-teal-50">দৈনিক বিনামূল্যের অ্যাপ বোনাস</span>
          </div>
        </div>
        <button 
          onClick={() => window.open('#', '_blank')}
          className="bg-[#16a374] border border-teal-500 px-3 py-1 rounded text-[10px] font-medium text-white shadow-sm flex items-center gap-1"
        >
          <Download size={10} />
          ডাউনলোড করুন
        </button>
      </div>

      {/* Main Header */}
      <header className="flex items-center justify-between px-3 py-2 sticky top-0 z-40 bg-[#16a374] shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={() => setIsSidebarOpen(true)} className="text-teal-50 hover:text-white transition-colors">
            <Menu size={24} />
          </button>
          <div className="text-2xl font-black italic tracking-tighter bg-gradient-to-b from-yellow-200 via-yellow-400 to-yellow-600 text-transparent bg-clip-text drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
            SPIN71<span className="text-green-300">BET</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-[#128a61] rounded-full pl-2 pr-1 py-1 border border-teal-600 shadow-inner relative">
            <div className="w-2 h-2 rounded-full bg-red-500 border border-red-300 animate-pulse"></div>
            <span className="text-sm font-bold tracking-tight">৳ {balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            <button 
              onClick={handleRefresh}
              className="p-0.5 hover:bg-teal-700 rounded-full transition-colors"
            >
              <RefreshCw size={14} className={`text-teal-100 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
            <span className="absolute -bottom-1 -left-1 bg-red-600 text-white text-[6px] font-bold px-1 rounded-full animate-pulse">LIVE</span>
          </div>
          <div className="relative">
            <button className="bg-white text-[#16a374] px-4 py-1 rounded-full text-sm font-bold shadow-md">
              জমা
            </button>
            <span className="absolute -top-2 -right-2 bg-red-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full border border-white">
              +5%
            </span>
          </div>
          <div className="relative">
            <button 
              onClick={() => setShowGallery(true)}
              className="p-2.5 bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-600 rounded-full text-black shadow-[0_0_15px_rgba(234,179,8,0.7)] hover:scale-110 active:scale-95 transition-all flex items-center justify-center border-2 border-yellow-200/50"
              title="Real Assets Gallery"
            >
              <Star size={20} className="fill-black" />
            </button>
            <span className="absolute -bottom-1 -right-1 bg-red-600 text-white text-[7px] font-bold px-1 rounded-full border border-white animate-bounce">REAL</span>
          </div>
          <Search size={22} className="text-teal-50" />
        </div>
      </header>

      {/* User Info Bar */}
      <div className="bg-[#128a61]/50 px-4 py-2 flex items-center justify-between border-b border-teal-700/30 backdrop-blur-sm sticky top-[52px] z-30">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-yellow-400 to-yellow-600 p-0.5 shadow-lg">
            <div className="w-full h-full bg-[#16a374] rounded-full flex items-center justify-center border-2 border-white">
              <User size={14} className="text-white" />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-teal-200 font-bold uppercase tracking-wider leading-none">স্বাগতম (Welcome)</span>
            <span className="text-xs font-black text-white tracking-tight">{userData?.username || 'Player_SPIN71'}</span>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[10px] text-teal-200 font-bold uppercase tracking-wider leading-none">আইডি (ID)</span>
          <span className="text-xs font-mono text-yellow-400 font-bold">{userData?.id || '84729104'}</span>
        </div>
      </div>

      {/* Hero Banner */}
      <div className="p-2">
        <div className="w-full h-40 rounded-2xl bg-gradient-to-br from-[#1a1a1a] via-[#2d2d2d] to-[#1a1a1a] relative overflow-hidden flex items-center shadow-2xl border border-white/10 group">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, gold 1px, transparent 0)',
            backgroundSize: '24px 24px'
          }}></div>
          
          {/* Casino Background Image */}
          <img
            src="https://images.unsplash.com/photo-1596838132731-3301c3fd4317?auto=format&fit=crop&q=80&w=800"
            alt="Casino Background"
            className="absolute inset-0 w-full h-full object-cover opacity-30 mix-blend-overlay scale-110 group-hover:scale-100 transition-transform duration-1000"
            referrerPolicy="no-referrer"
          />

          {/* Girl Image (Casino Host) */}
          <div className="absolute right-0 bottom-0 w-1/2 h-full z-20 pointer-events-none">
            <img 
              src="https://images.unsplash.com/photo-1541271696563-3be2f99a3e1c?q=80&w=1000&auto=format&fit=crop" 
              alt="Casino Host" 
              className="w-full h-full object-contain object-bottom transform scale-125 group-hover:scale-130 transition-transform duration-500 drop-shadow-[0_20px_40px_rgba(0,0,0,0.9)]"
              referrerPolicy="no-referrer"
            />
            {/* Glow behind girl */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
          </div>

          {/* Floating Casino Elements */}
          {/* Casino Chips */}
          <div className="absolute right-1/4 top-10 z-30 animate-[bounce_4s_ease-in-out_infinite] opacity-90">
            <div className="w-8 h-8 rounded-full border-4 border-dashed border-yellow-400 bg-red-600 shadow-lg flex items-center justify-center">
              <div className="w-4 h-4 rounded-full border-2 border-white"></div>
            </div>
          </div>
          <div className="absolute right-1/3 bottom-4 z-30 animate-[float_5s_ease-in-out_infinite] opacity-70">
            <div className="w-6 h-6 rounded-full border-4 border-dashed border-white bg-blue-600 shadow-lg flex items-center justify-center">
              <div className="w-3 h-3 rounded-full border-2 border-white"></div>
            </div>
          </div>

          {/* Dice */}
          <div className="absolute left-1/3 top-1/2 z-30 animate-[spin_10s_linear_infinite] opacity-80">
            <div className="w-6 h-6 bg-white rounded-md shadow-xl flex items-center justify-center transform rotate-45">
              <div className="grid grid-cols-2 gap-1 p-1">
                <div className="w-1 h-1 bg-black rounded-full"></div>
                <div className="w-1 h-1 bg-black rounded-full"></div>
                <div className="w-1 h-1 bg-black rounded-full"></div>
                <div className="w-1 h-1 bg-black rounded-full"></div>
              </div>
            </div>
          </div>

          {/* Floating Playing Cards */}
          <div className="absolute left-1/2 top-10 z-30 animate-[bounce_3s_ease-in-out_infinite] opacity-80">
            <div className="relative w-8 h-12 bg-white rounded-sm border border-gray-200 shadow-lg transform rotate-12 flex items-center justify-center">
              <span className="text-red-600 text-xs font-bold">A♥</span>
            </div>
            <div className="absolute -left-4 top-2 w-8 h-12 bg-white rounded-sm border border-gray-200 shadow-lg transform -rotate-12 flex items-center justify-center">
              <span className="text-black text-xs font-bold">K♠</span>
            </div>
          </div>

          {/* Banner Content */}
          <div className="z-30 pl-5 w-1/2 relative">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-xl font-black leading-tight text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                কেসিনো <span className="text-yellow-400 italic">লাইভ</span> গেম 🔥
              </h2>
              <span className="bg-red-600 text-white text-[8px] font-black px-2 py-0.5 rounded-full animate-pulse shadow-lg border border-red-400">REAL</span>
            </div>
            
            <div className="space-y-1">
              <p className="text-xs text-yellow-100 font-medium drop-shadow-md flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-ping"></span>
                সেরা গেমিং অভিজ্ঞতা
              </p>
              <div className="relative inline-block">
                <p className="text-sm font-black text-white drop-shadow-lg uppercase tracking-wider italic">
                  নিশ্চিত বিনোদন
                </p>
                <div className="absolute -bottom-1 left-0 w-full h-1 bg-gradient-to-r from-yellow-400 to-transparent rounded-full"></div>
              </div>
            </div>

            {/* CTA Button in Banner */}
            <button className="mt-3 bg-gradient-to-r from-yellow-400 to-yellow-600 text-black text-[10px] font-black px-4 py-1.5 rounded-full shadow-lg hover:scale-105 active:scale-95 transition-all border border-yellow-200 uppercase tracking-tighter">
              এখনই খেলুন
            </button>
          </div>

          {/* Pagination Dots */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-40">
            <div className="w-4 h-1.5 rounded-full bg-white"></div>
            <div className="w-1.5 h-1.5 rounded-full bg-white/50"></div>
            <div className="w-1.5 h-1.5 rounded-full bg-white/50"></div>
            <div className="w-1.5 h-1.5 rounded-full bg-white/50"></div>
          </div>
        </div>
      </div>

      {/* Promo Cards */}
      <div className="grid grid-cols-3 gap-2 px-2">
        <div className="bg-gradient-to-br from-teal-900 to-teal-800 rounded-lg p-2 relative h-20 overflow-hidden shadow-md border border-teal-700">
          <span className="text-[11px] font-bold relative z-10 leading-tight block text-teal-50">
            আমন্ত্রণ<br />পুরস্কার
          </span>
          <span className="text-yellow-400 font-bold text-sm relative z-10">
            ৳৯৯৯
          </span>
          <div className="absolute bottom-1 left-1 z-10 bg-yellow-500 rounded-full p-0.5">
            <Share2 size={12} className="text-black" />
          </div>
          <img
            src="https://picsum.photos/seed/goddess/100/100"
            className="absolute right-0 bottom-0 w-14 h-14 object-cover opacity-80"
            alt="promo"
          />
        </div>
        <div className="bg-gradient-to-br from-teal-900 to-teal-800 rounded-lg p-2 relative h-20 overflow-hidden shadow-md border border-teal-700">
          <span className="text-[11px] font-bold relative z-10 leading-tight block text-teal-50">
            অংশীদার
          </span>
          <span className="text-orange-400 font-black text-lg italic relative z-10 drop-shadow-md">
            F999
          </span>
          <span className="absolute top-1 right-1 bg-red-600 text-white text-[9px] px-1 rounded-full z-10">
            1
          </span>
          <img
            src="https://picsum.photos/seed/slots/100/100"
            className="absolute right-0 bottom-0 w-14 h-14 object-cover opacity-80"
            alt="promo"
          />
        </div>
        <div className="bg-gradient-to-br from-gray-900 to-black rounded-lg p-2 relative h-20 overflow-hidden shadow-md border border-gray-800">
          <span className="text-[11px] font-bold relative z-10 leading-tight block text-orange-200">
            অংশীদার
          </span>
          <span className="text-white font-black text-lg italic relative z-10 drop-shadow-md">
            G777
          </span>
          <span className="absolute top-1 right-1 bg-red-600 text-white text-[9px] px-1 rounded-full z-10">
            1
          </span>
          <img
            src="https://picsum.photos/seed/casino2/100/100"
            className="absolute right-0 bottom-0 w-14 h-14 object-cover opacity-80"
            alt="promo"
          />
        </div>
      </div>

      {/* Marquee Announcement */}
      <div className="flex items-center gap-2 px-3 py-2 text-sm text-teal-100 bg-[#16a374]">
        <Volume2 size={18} className="shrink-0 text-teal-200" />
        <div className="overflow-hidden whitespace-nowrap flex-1 relative h-5">
          <p className="absolute animate-marquee text-[13px]">
            বোনাস এবং একাধিক ডিপোজিট অফার অফার করি। আমরা আশা করি আপনি আমাদের সাথে উপভোগ করবেন!
          </p>
        </div>
        <div className="relative shrink-0 ml-2">
          <Mail size={22} className="text-white" />
          <span className="absolute -top-1.5 -right-2 bg-red-600 text-white text-[9px] px-1 rounded-full border border-[#16a374]">
            99+
          </span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="px-2 py-2">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-teal-400" />
          <input 
            type="text" 
            placeholder="গেম খুঁজুন..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#128a61] border border-teal-600/50 rounded-full py-2 pl-10 pr-4 text-sm text-white placeholder-teal-300 focus:outline-none focus:border-teal-400 transition-colors"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-teal-300"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Category Navigation */}
      <div className="flex overflow-x-auto gap-6 px-4 py-2 no-scrollbar text-[13px] font-medium border-b border-teal-600/50">
        {[
          { id: 'সেরা', icon: Flame, label: 'সেরা' },
          { id: 'পছন্দ', icon: Star, label: 'পছন্দ' },
          { id: 'স্লট', icon: Gamepad2, label: 'স্লট' },
          { id: 'ব্লকচেইন', icon: Hexagon, label: 'ব্লকচেইন' },
          { id: 'লাইভ', icon: Tv, label: 'লাইভ' },
          { id: 'তাস', icon: Club, label: 'তাস' },
          { id: 'ফিশিং', icon: Fish, label: 'ফিশিং' },
          { id: 'লটারি', icon: Ticket, label: 'লটারি' },
        ].map((cat) => (
          <div 
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-colors ${activeCategory === cat.id ? 'text-white' : 'text-teal-200'}`}
          >
            <cat.icon size={16} className={activeCategory === cat.id ? 'text-teal-100' : ''} /> {cat.label}
          </div>
        ))}
      </div>

      {/* Game Grid Section */}
      <div className="px-2 pt-3 pb-6">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-1.5 text-lg font-bold text-teal-50">
            {activeCategory === 'পছন্দ' ? (
              <Star className="text-yellow-400 fill-yellow-400" size={20} />
            ) : (
              <Flame className="text-teal-200 fill-teal-200" size={20} />
            )} 
            {activeCategory}
          </div>
          <div className="flex items-center gap-1">
            <button className="p-1 rounded bg-[#128a61] text-teal-200 hover:text-white transition-colors">
              <ChevronLeft size={16} />
            </button>
            <button 
              onClick={() => setActiveCategory('সব')}
              className={`px-4 py-1 rounded text-[13px] font-medium transition-colors ${activeCategory === 'সব' ? 'bg-yellow-500 text-black' : 'bg-[#128a61] text-teal-50 hover:bg-[#0f7552]'}`}
            >
              সব
            </button>
            <button className="p-1 rounded bg-[#128a61] text-teal-200 hover:text-white transition-colors">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Grid */}
        <GameGrid 
          category={activeCategory} 
          searchQuery={searchQuery} 
          onGameSelect={handleGameSelect} 
          favorites={favorites}
          onToggleFavorite={handleToggleFavorite}
        />
      </div>

      {/* Game Play Modal */}
      {selectedGame && selectedGame.id === '1' ? (
        <AviatorGame 
          onClose={() => handleGameSelect(null)} 
          userBalance={balance}
          onBalanceUpdate={handleBalanceUpdate}
        />
      ) : selectedGame && (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col max-w-md mx-auto">
          {/* Game Header */}
          <div className="flex items-center justify-between p-4 bg-teal-900 border-b border-teal-800">
            <button 
              onClick={() => handleGameSelect(null)}
              className="text-white p-1 hover:bg-teal-800 rounded-full transition-colors"
            >
              <ArrowLeft size={24} />
            </button>
            <div className="flex flex-col items-center">
              <h3 className="text-white font-bold text-sm">{selectedGame.name}</h3>
              <span className="text-teal-300 text-[10px] uppercase tracking-widest">{selectedGame.provider}</span>
            </div>
            <button className="text-white p-1 hover:bg-teal-800 rounded-full transition-colors">
              <Info size={20} />
            </button>
          </div>

          {/* Game Viewport (Simulated) */}
          <div className="flex-1 relative bg-gray-900 flex flex-col items-center justify-center overflow-hidden">
            <img 
              src={selectedGame.image} 
              className="absolute inset-0 w-full h-full object-cover opacity-20 blur-xl"
              alt="Background"
            />
            
            <div className="relative z-10 flex flex-col items-center text-center p-6">
              <div className={`w-48 h-64 rounded-2xl bg-gradient-to-b ${selectedGame.bgColor} shadow-2xl border-2 border-white/20 mb-8 overflow-hidden transform hover:scale-105 transition-transform duration-500 relative`}>
                <img src={selectedGame.image} className="w-full h-full object-cover opacity-80 mix-blend-overlay" alt={selectedGame.name} />
                <div className="absolute top-2 right-2 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse shadow-lg">REAL</div>
                <div className="absolute inset-0 flex items-center justify-center">
                   <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30">
                      <Play size={32} className="text-white fill-white ml-1" />
                   </div>
                </div>
              </div>
              
              <h2 className="text-3xl font-black text-white mb-2 drop-shadow-lg">{selectedGame.name}</h2>
              <p className="text-teal-200 mb-8 max-w-[250px]">গেমটি লোড হচ্ছে... দয়া করে অপেক্ষা করুন এবং বড় জয়ের জন্য প্রস্তুত হন!</p>
              
              <div className="w-64 h-2 bg-teal-900 rounded-full overflow-hidden mb-12">
                <div className="h-full bg-yellow-500 animate-[loading_3s_ease-in-out_infinite]" style={{ width: '60%' }}></div>
              </div>

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
          </div>

          {/* Game Footer */}
          <div className="p-4 bg-teal-950 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-teal-800 flex items-center justify-center">
                <Wallet size={16} className="text-yellow-400" />
              </div>
              <div>
                <p className="text-[10px] text-teal-400 uppercase font-bold">ব্যালেন্স</p>
                <p className="text-white font-bold text-sm">৳ {balance.toLocaleString()}</p>
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
      </>
      )}

      {/* Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        >
          <div 
            className="absolute left-0 top-0 bottom-0 w-64 bg-[#128a61] shadow-2xl animate-in slide-in-from-left duration-300 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Sidebar Header */}
            <div className="p-6 bg-gradient-to-b from-[#0f766e] to-[#128a61] border-b border-teal-600/50">
              <div className="flex items-center justify-between mb-6">
                <div className="text-2xl font-black italic tracking-tighter bg-gradient-to-b from-yellow-200 via-yellow-400 to-yellow-600 text-transparent bg-clip-text">
                  SPIN71<span className="text-green-300">BET</span>
                </div>
                <button onClick={() => setIsSidebarOpen(false)} className="text-teal-200 hover:text-white">
                  <X size={24} />
                </button>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-teal-800 border-2 border-yellow-500 flex items-center justify-center">
                  <User size={24} className="text-white" />
                </div>
                <div>
                  <p className="text-white font-bold text-sm">{userData?.username || 'Player_SPIN71'}</p>
                  <p className="text-teal-300 text-[10px]">ID: {userData?.id || '84729104'}</p>
                </div>
              </div>
            </div>

            {/* Sidebar Links */}
            <nav className="flex-1 p-4 space-y-2">
              {[
                { id: 'home', icon: Home, label: 'বাড়ি (Home)' },
                { id: 'profile', icon: User, label: 'প্রোফাইল (Profile)' },
                { id: 'invite', icon: Users, label: 'আমন্ত্রণ (Invite)' },
                { id: 'telegram', icon: Send, label: 'টেলিগ্রাম (Telegram)' },
              ].map((link) => (
                <button
                  key={link.id}
                  onClick={() => {
                    if (link.id === 'telegram') {
                      setIsSupportChatOpen(true);
                    } else {
                      handleTabChange(link.id as any);
                    }
                    setIsSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${activeTab === link.id ? 'bg-yellow-500 text-black font-bold shadow-lg' : 'text-teal-100 hover:bg-teal-800/50'}`}
                >
                  <link.icon size={20} className={link.id === 'telegram' ? 'text-blue-400' : ''} />
                  <span>{link.label}</span>
                </button>
              ))}
              <div className="h-px bg-teal-600/30 my-4"></div>
              <button 
                onClick={() => {
                  handleTabChange('deposit');
                  setIsSidebarOpen(false);
                }}
                className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-teal-100 hover:bg-teal-800/50 transition-all"
              >
                <Wallet size={20} />
                <span>জমা (Deposit)</span>
              </button>
              <button className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-teal-100 hover:bg-teal-800/50 transition-all">
                <RefreshCw size={20} />
                <span>ইতিহাস (History)</span>
              </button>
            </nav>

            {/* Sidebar Footer */}
            <div className="p-4 border-t border-teal-600/50">
              <button 
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 py-3 text-red-400 font-bold hover:bg-red-900/20 rounded-xl transition-all"
              >
                <LogOut size={18} />
                <span>লগ আউট</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'profile' && <ProfileView onTabChange={handleTabChange} balance={balance} userData={userData} onLogout={handleLogout} setIsLoading={setIsLoading} />}
      {activeTab === 'bonus' && <BonusCenter userData={userData} balance={balance} onBalanceUpdate={setBalance} setIsLoading={setIsLoading} onTabChange={handleTabChange} />}
      {activeTab === 'invite' && <InviteView onTabChange={handleTabChange} setIsLoading={setIsLoading} userData={userData} />}
      {activeTab === 'deposit' && <DepositView onTabChange={handleTabChange} balance={balance} setIsLoading={setIsLoading} userData={userData} />}

      {/* Support Chat */}
      <SupportChat isOpen={isSupportChatOpen} onClose={() => setIsSupportChatOpen(false)} />

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-[#16a374] border-t border-teal-600/50 flex justify-between px-6 py-2 text-[11px] text-teal-200 z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
        <div 
          onClick={() => handleTabChange('home')}
          className={`flex flex-col items-center gap-1 cursor-pointer transition-colors ${activeTab === 'home' ? 'text-white' : 'hover:text-white'}`}
        >
          <Home size={22} />
          <span>বাড়ি</span>
        </div>
        <div 
          onClick={() => handleTabChange('bonus')}
          className={`flex flex-col items-center gap-1 cursor-pointer transition-colors ${activeTab === 'bonus' ? 'text-white' : 'hover:text-white'}`}
        >
          <Gift size={22} />
          <span>বোনাস</span>
        </div>
        <div 
          onClick={() => handleTabChange('invite')}
          className={`flex flex-col items-center gap-1 cursor-pointer transition-colors ${activeTab === 'invite' ? 'text-white' : 'hover:text-white'}`}
        >
          <Users size={22} />
          <span>আমন্ত্রণ</span>
        </div>
        <div 
          onClick={() => handleTabChange('deposit')}
          className={`flex flex-col items-center gap-1 relative cursor-pointer transition-colors ${activeTab === 'deposit' ? 'text-white' : 'hover:text-white'}`}
        >
          <Wallet size={22} />
          <span>জমা</span>
          <span className="absolute -top-1 -right-3 bg-red-600 text-white text-[9px] font-bold px-1 rounded-full border border-[#16a374]">
            +5%
          </span>
        </div>
        <div 
          onClick={() => handleTabChange('profile')}
          className={`flex flex-col items-center gap-1 cursor-pointer transition-colors ${activeTab === 'profile' ? 'text-white' : 'hover:text-white'}`}
        >
          <User size={22} />
          <span>প্রোফাইল</span>
        </div>
      </div>

      {/* Deposit Required Popup */}
      {showDepositRequired && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[200] p-6 animate-in fade-in duration-300">
          <div className="bg-teal-900 p-8 rounded-3xl text-center relative shadow-2xl border-2 border-yellow-500 max-w-sm w-full animate-in zoom-in duration-300">
            <button onClick={() => setShowDepositRequired(false)} className="absolute top-4 right-4 text-teal-300 hover:text-white">
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

      {isLoading && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
          <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin shadow-[0_0_15px_rgba(20,184,166,0.5)]"></div>
        </div>
      )}

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
