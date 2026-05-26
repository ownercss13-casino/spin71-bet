import React, { useState, useEffect } from 'react';
import { Clock, Trophy, Download, X, RefreshCw, ChevronRight, Play, Wallet, Users, Star, TrendingUp, History, User, Menu, Bell, Search, Volume2, Flame, Gamepad2, Hexagon, Tv, Club, Fish, Ticket, ChevronLeft, Mail, Sparkles, Zap, Gift, Send, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GAME_IMAGES } from '../constants/gameAssets';
import { GameGrid, games } from "../components/ui/GameGrid";
import GlobalImage from '../components/ui/GlobalImage';
import Skeleton from '../components/ui/Skeleton';
import LiveBetsTicker from '../components/LiveBetsTicker';

function WinAnimation({ gameId }: { gameId: string }) {
  const [wins, setWins] = useState<{ id: number; amount: string; x: number; y: number }[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.7) {
        const id = Date.now();
        const amount = `+৳ ${(Math.floor(Math.random() * 5000) + 1000).toLocaleString()}`;
        const x = Math.random() * 60 + 20; // 20% to 80%
        const y = Math.random() * 60 + 20;
        setWins(prev => [...prev.slice(-4), { id, amount, x, y }]);
        setTimeout(() => {
          setWins(prev => prev.filter(w => w.id !== id));
        }, 3000);
      }
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden">
      <AnimatePresence>
        {wins.map(win => (
          <motion.div
            key={win.id}
            initial={{ opacity: 0, y: 20, scale: 0.5, x: `${win.x}%`, top: `${win.y}%` }}
            animate={{ opacity: 1, y: -100, scale: 1.5 }}
            exit={{ opacity: 0, scale: 2 }}
            transition={{ duration: 2.5, ease: "easeOut" }}
            className="absolute text-yellow-400 font-black text-xl italic drop-shadow-[0_2px_4px_rgba(0,0,0,1)] flex items-center gap-1"
          >
            <Sparkles size={20} className="fill-yellow-400" />
            {win.amount}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

interface HomeViewProps {
  userData: any;
  recentlyPlayed: any[];
  favorites: string[];
  handleGameSelect: (game: any) => void;
  setShowLeaderboard: (show: boolean) => void;
  globalLogos: Record<string, string>;
  globalNames: Record<string, string>;
  globalUrls: Record<string, string>;
  globalOptions: Record<string, string>;
  globalImages?: Record<string, string>;
  balance: number;
  isRefreshing: boolean;
  handleRefresh: () => void;
  setIsSidebarOpen: (open: boolean) => void;
  setIsNotificationCenterOpen: (open: boolean) => void;
  unreadNotificationsCount: number;
  setShowGallery: (show: boolean) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  activeCategory: string;
  setActiveCategory: (category: string) => void;
  handleToggleFavorite: (gameId: string) => void;
  updateGlobalGameLogo: (gameId: string, logo: string) => Promise<void>;
  updateGlobalGameName: (gameId: string, name: string) => Promise<void>;
  updateGlobalGameUrl: (gameId: string, url: string) => Promise<void>;
  updateGlobalGameOption: (gameId: string, option: string) => Promise<void>;
  updateGlobalImage?: (imageKey: string, url: string) => Promise<void>;
  allButtonName?: string;
  updateAllButtonName?: (newName: string) => void;
  casinoName?: string;
  updateCasinoName?: (newName: string) => void;
  noticeText?: string;
  telegramLink?: string;
  whatsappLink?: string;
  facebookLink?: string;
  showToast: (msg: string, type?: any) => void;
  loading?: boolean;
  isAdmin?: boolean;
  onNavigate?: (tab: string, subTab?: string) => void;
  onOpenLogin?: (mode?: 'login' | 'register') => void;
  setIsSupportChatOpen?: (open: boolean) => void;
}

export default function HomeView({ 
  userData, 
  recentlyPlayed, 
  favorites, 
  handleGameSelect, 
  setShowLeaderboard,
  globalLogos,
  globalNames,
  globalUrls,
  globalOptions,
  globalImages = {},
  balance,
  isRefreshing,
  handleRefresh,
  setIsSidebarOpen,
  setIsNotificationCenterOpen,
  unreadNotificationsCount,
  setShowGallery,
  searchQuery,
  setSearchQuery,
  activeCategory,
  setActiveCategory,
  handleToggleFavorite,
  updateGlobalGameLogo,
  updateGlobalGameName,
  updateGlobalGameUrl,
  updateGlobalGameOption,
  updateGlobalImage,
  allButtonName,
  updateAllButtonName,
  casinoName = "SPIN71.bet",
  updateCasinoName,
  noticeText = "আমাদের গেম উপভোগ করুন এবং বড় জয় নিশ্চিত করুন!",
  telegramLink,
  whatsappLink,
  facebookLink,
  showToast,
  loading,
  isAdmin = false,
  onNavigate,
  onOpenLogin,
  setIsSupportChatOpen
}: HomeViewProps) {
  const [editingCasinoName, setEditingCasinoName] = React.useState(false);
  const [tempCasinoName, setTempCasinoName] = React.useState(casinoName || "SPIN71.bet");

  const categories = [
    { id: 'সব', icon: Gamepad2, label: 'সব' },
    { id: 'সেরা', icon: Flame, label: 'সেরা' },
    { id: 'ক্র্যাশ', icon: TrendingUp, label: 'ক্র্যাশ' },
    { id: 'পছন্দ', icon: Star, label: 'পছন্দ' },
    { id: 'স্লট', icon: Gamepad2, label: 'স্লট' },
    { id: 'Live Casino', icon: Tv, label: 'Live Casino' },
    { id: 'Table Games', icon: Club, label: 'Table Games' },
    { id: 'Fishing Games', icon: Fish, label: 'Fishing Games' },
    { id: 'Lottery', icon: Ticket, label: 'Lottery' },
  ];

  const handleSwipe = (event: any, info: any) => {
    const swipeThreshold = 50;
    const currentIndex = categories.findIndex(c => c.id === activeCategory);

    if (info.offset.x < -swipeThreshold) {
      // Swipe Left -> Next Category
      const nextIndex = Math.min(currentIndex + 1, categories.length - 1);
      if (nextIndex !== currentIndex) {
        setActiveCategory(categories[nextIndex].id);
      }
    } else if (info.offset.x > swipeThreshold) {
      // Swipe Right -> Previous Category
      const prevIndex = Math.max(currentIndex - 1, 0);
      if (prevIndex !== currentIndex) {
        setActiveCategory(categories[prevIndex].id);
      }
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-x-hidden pb-20">
      {/* Main Header - SPIN71.BET Style */}
      <header className="flex items-center justify-between px-4 py-3 bg-[#0d1a29] sticky top-0 z-[110] border-b border-[#1e3a5f] shadow-lg backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button 
            className="text-[#90a4ae] hover:text-[#00e5ff] transition-colors p-1" 
            onClick={() => setIsSidebarOpen(true)}
          >
            <Menu size={26} />
          </button>
          <div className="flex flex-col items-center justify-center ml-2 pt-2 pb-1 gap-3">
            <img 
              src="/apple-touch-icon.png?v=6" 
              alt="Logo"
              className="h-[60px] md:h-[70px] w-auto object-contain drop-shadow-[0_0_10px_rgba(253,216,53,0.4)] transform scale-125" 
              referrerPolicy="no-referrer"
            />
            <span className="text-[12px] md:text-[14px] font-black text-transparent bg-clip-text bg-gradient-to-r from-[#fdd835] via-white to-[#fdd835] tracking-[0.2em] drop-shadow-md">
              SPIN71
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {!userData ? (
            <div className="flex items-center gap-2">
              <button 
                onClick={() => onOpenLogin?.('login')}
                className="bg-transparent border border-[#1e3a5f] px-4 py-2 rounded-xl text-[10px] font-black text-[#90a4ae] hover:text-white transition-colors"
              >
                LOGIN
              </button>
              <button 
                onClick={() => onOpenLogin?.('register')}
                className="bg-gradient-to-r from-yellow-400 to-yellow-600 px-5 py-2 rounded-xl text-[10px] font-black text-black hover:scale-105 transition-transform"
              >
                JOIN NOW
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div 
                className="flex items-center gap-2 bg-gradient-to-r from-[#14253a] to-[#0d1a29] px-3 py-1.5 rounded-2xl border border-yellow-500/30 shadow-[0_0_15px_rgba(0,0,0,0.5)] active:scale-95 transition-transform cursor-pointer"
                onClick={() => onNavigate?.('wallet')}
              >
                <div className="flex flex-col items-end">
                  <span className="text-[10px] text-gray-500 font-black tracking-tighter leading-none">BALANCE</span>
                  <p className="text-sm font-black text-[#fdd835] tracking-tight">৳ {balance.toLocaleString()}</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 p-[1px] shadow-lg">
                  <div 
                    className="w-full h-full rounded-full bg-[#0d1a29] flex items-center justify-center text-[#fdd835] font-black text-xs"
                  >
                    {userData.username?.[0]?.toUpperCase() || 'U'}
                  </div>
                </div>
              </div>
              <button 
                className="w-10 h-10 flex items-center justify-center text-[#90a4ae] hover:text-[#00e5ff] transition-colors relative"
                onClick={() => setIsNotificationCenterOpen(true)}
              >
                <Bell size={22} />
                {unreadNotificationsCount > 0 && (
                  <span className="absolute top-2 right-2 w-4 h-4 bg-red-600 text-white text-[8px] font-black flex items-center justify-center rounded-full border border-[#0d1a29]">
                    {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
                  </span>
                )}
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Hero Banner Area */}
      {/* Banner removed as requested */}

      {/* Scrolling Notice Bar */}
      <div className="bg-[#1a2f4a] px-3 py-2 flex items-center gap-2 border-b border-[#1e3a5f]">
        <div className="text-gray-400 group-hover:text-white"><Volume2 size={18}/></div>
        <div className="flex-1 overflow-hidden relative h-4">
          <div className="absolute whitespace-nowrap animate-marquee text-white text-xs font-bold">
            🏆 SPIN71.BET 🏆 ⭐ প্রথম জমার জন্য ১০০% বোনাস! ⭐ {noticeText}
          </div>
        </div>
        <div className="flex items-center gap-3 text-red-500">
           <Gift size={18} />
           <Mail size={18} />
        </div>
      </div>

      {/* Game Search Bar */}
      <div className="px-3 pt-3 pb-1 bg-[#0d1a29]">
        <div className="relative flex items-center">
          <div className="absolute left-3.5 text-gray-400 pointer-events-none">
            <Search size={16} />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="গেম বা প্রোভাইডার সার্চ করুন (যেমন: Aviator, JILI)..."
            className="w-full bg-[#14253a] border border-[#1e3a5f] hover:border-[#00e5ff]/50 focus:border-[#00e5ff] text-white pl-10 pr-10 py-2.5 rounded-xl text-xs font-bold focus:outline-none focus:ring-1 focus:ring-[#00e5ff]/30 placeholder-gray-500 transition-all shadow-[0_4px_12px_rgba(0,0,0,0.3)]"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3.5 text-gray-400 hover:text-white transition-colors"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Category Navigation - Circular Tabs */}
      <div className="flex overflow-x-auto gap-4 px-3 py-4 no-scrollbar bg-[#0d1a29] border-b border-[#1e3a5f] sticky top-[53px] z-30 backdrop-blur-sm">
        {categories.map((cat, index) => (
          <div 
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`flex flex-col items-center gap-1 min-w-[60px] cursor-pointer transition-all ${activeCategory === cat.id ? 'opacity-100' : 'opacity-60'}`}
          >
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all border ${activeCategory === cat.id ? 'border-[#00e5ff] text-[#00e5ff] shadow-[0_0_10px_rgba(0,229,255,0.2)]' : 'border-[#1e3a5f] bg-[#14253a] text-[#90a4ae]'}`}>
              <cat.icon size={24} />
            </div>
            <span className={`text-[10px] font-bold ${activeCategory === cat.id ? 'text-[#00e5ff]' : 'text-[#90a4ae]'}`}>
              {cat.id === 'স্লট' ? 'Slots' : cat.id === 'Live Casino' ? 'Live' : cat.id === 'Fishing Games' ? 'Fishing' : cat.id === 'ক্র্যাশ' ? 'Crash' : cat.label}
            </span>
            {activeCategory === cat.id && (
              <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[4px] border-t-[#00e5ff]"></div>
            )}
          </div>
        ))}
      </div>

      {/* Game Grid Section */}
      <motion.div 
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        onDragEnd={handleSwipe}
        className="px-3 pt-4 pb-6"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={activeCategory}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
          >
            {/* Section Header */}
            <div className="flex items-center gap-2 text-lg font-black text-white mb-4">
               <Flame className="text-orange-600 fill-orange-600" size={24} />
               {activeCategory === 'সব' ? 'All Games' : activeCategory === 'সেরা' ? 'Hot Games' : activeCategory === 'পছন্দ' ? 'Favs' : activeCategory}
            </div>

            {/* Grid */}
            <GameGrid 
              category={activeCategory} 
              setActiveCategory={setActiveCategory}
              searchQuery={searchQuery} 
              onGameSelect={handleGameSelect} 
              favorites={favorites}
              onToggleFavorite={handleToggleFavorite}
              globalLogos={globalLogos}
              globalNames={globalNames}
              globalUrls={globalUrls}
              globalOptions={globalOptions}
              loading={loading}
              allButtonName={allButtonName}
              showToast={showToast}
              isAdmin={isAdmin}
              onAllButtonNameChange={async (newName) => {
                if (updateAllButtonName) {
                  await updateAllButtonName(newName);
                }
              }}
              onGameLogoChange={async (gameId, newLogo) => {
                if (updateGlobalGameLogo) {
                  await updateGlobalGameLogo(gameId, newLogo);
                }
              }}
              onGameNameChange={async (gameId, newName) => {
                if (updateGlobalGameName) {
                  await updateGlobalGameName(gameId, newName);
                }
              }}
              onGameUrlChange={async (gameId, newUrl) => {
                if (updateGlobalGameUrl) {
                  await updateGlobalGameUrl(gameId, newUrl);
                }
              }}
              onGameOptionChange={async (gameId, newOption) => {
                if (updateGlobalGameOption) {
                  await updateGlobalGameOption(gameId, newOption);
                }
              }}
            />
          </motion.div>
        </AnimatePresence>
      </motion.div>

      {/* Live Bets and High Rollers Ticker */}
      <div className="px-3">
        <LiveBetsTicker 
          userData={userData} 
          onOpenLogin={onOpenLogin} 
          showToast={showToast} 
        />
      </div>

      {/* Referral Program Banner - Simplified */}
      <div className="px-3 mt-4">
        <div 
          className="relative overflow-hidden rounded-2xl bg-[#14253a] border border-[#1e3a5f] p-5 cursor-pointer"
          onClick={() => onNavigate?.('invite')}
        >
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              <h4 className="text-xl font-black text-white italic tracking-tight">Refer & Earn</h4>
              <p className="text-[10px] text-[#90a4ae] font-bold">Invite friends and get ৳108 bonus per person!</p>
            </div>
            <button className="bg-[#fdd835] text-black px-4 py-2 rounded-lg text-[10px] font-black uppercase">Invite</button>
          </div>
        </div>
      </div>

      {/* Edit Casino Name Modal */}
      {editingCasinoName && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[200] p-4">
          <div className="bg-teal-900 p-6 rounded-2xl w-full max-w-sm border border-teal-700 shadow-2xl">
            <h3 className="text-xl font-bold mb-4 text-white">ক্যাসিনোর নাম পরিবর্তন করুন</h3>
            <input
              type="text"
              value={tempCasinoName}
              onChange={(e) => setTempCasinoName(e.target.value)}
              className="w-full bg-black/50 border border-teal-700 rounded-lg p-3 text-white mb-6 focus:outline-none focus:border-yellow-500"
              placeholder="নতুন নাম লিখুন"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setEditingCasinoName(false)}
                className="flex-1 py-3 rounded-lg font-bold bg-gray-700 text-white hover:bg-gray-600 transition-colors"
              >
                বাতিল
              </button>
              <button
                onClick={async () => {
                  if (updateCasinoName) {
                    await updateCasinoName(tempCasinoName);
                  }
                  setEditingCasinoName(false);
                }}
                className="flex-1 py-3 rounded-lg font-bold bg-gradient-to-r from-yellow-400 to-yellow-600 text-black hover:from-yellow-300 hover:to-yellow-500 transition-colors"
              >
                সেভ করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const style = `
  @keyframes scroll-vertical {
    0% { transform: translateY(0); }
    100% { transform: translateY(-50%); }
  }
  .animate-scroll-vertical {
    animation: scroll-vertical 15s linear infinite;
  }
  .animate-scroll-vertical:hover {
    animation-play-state: paused;
  }
`;

if (typeof document !== 'undefined') {
  const styleTag = document.createElement('style');
  styleTag.innerHTML = style;
  document.head.appendChild(styleTag);
}
