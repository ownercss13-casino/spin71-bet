import React, { useState, useEffect } from 'react';
import { Clock, Trophy, Download, X, RefreshCw, ChevronRight, Play, Wallet, Users, Star, TrendingUp, History, User, Menu, Bell, Search, Volume2, Flame, Gamepad2, Hexagon, Tv, Club, Fish, Ticket, ChevronLeft, Mail, Sparkles, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GAME_IMAGES } from '../constants/gameAssets';
import { GameGrid, games } from "../components/ui/GameGrid";
import GlobalImage from '../components/ui/GlobalImage';
import Skeleton from '../components/ui/Skeleton';
import MarketTicker from '../components/ui/MarketTicker';

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
  casinoName = "NAGAD BET",
  updateCasinoName,
  noticeText = "আমাদের গেম উপভোগ করুন এবং বড় জয় নিশ্চিত করুন!",
  telegramLink,
  whatsappLink,
  facebookLink,
  showToast,
  loading,
  isAdmin = false,
  onNavigate
}: HomeViewProps) {
  const [editingCasinoName, setEditingCasinoName] = React.useState(false);
  const [tempCasinoName, setTempCasinoName] = React.useState(casinoName || "NAGAD BET");

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Main Header */}
      <header className="flex items-center justify-between px-3 py-2 sticky top-0 z-40 bg-[var(--bg-main)] shadow-sm transition-colors duration-300">
        <div className="flex items-center gap-3">
          <button onClick={() => setIsSidebarOpen(true)} className="text-[var(--text-main)] opacity-90 hover:opacity-100 transition-opacity">
            <Menu size={24} />
          </button>
          <div className="flex items-center gap-2">
            {/* LOGO REMOVED PER USER REQUEST */}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-[var(--bg-surface)] rounded-full pl-2 pr-1 py-1 border border-[var(--border-color)] shadow-inner relative transition-colors duration-300">
            <div className="w-2 h-2 rounded-full bg-red-500 border border-red-300 animate-pulse"></div>
            <span className="text-sm font-bold tracking-tight text-[var(--text-main)]">৳ {balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            <button 
              onClick={handleRefresh}
              className="p-0.5 hover:bg-black/10 rounded-full transition-colors"
            >
              <RefreshCw size={14} className={`text-[var(--text-muted)] ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
            <span className="absolute -bottom-1 -left-1 bg-red-600 text-white text-[6px] font-bold px-1 rounded-full animate-pulse">LIVE</span>
          </div>
          <div className="relative">
            <button 
              onClick={() => onNavigate?.('deposit')}
              className="bg-white text-[#16a374] px-4 py-1 rounded-full text-sm font-bold shadow-md hover:scale-105 transition-transform active:scale-95"
            >
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
          <div className="relative">
            <button 
              onClick={() => setIsNotificationCenterOpen(true)}
              className="p-1 text-[var(--text-main)] opacity-90 hover:opacity-100 transition-opacity relative"
            >
              <Bell size={22} />
              {unreadNotificationsCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-red-600 text-white text-[8px] font-bold w-4 h-4 rounded-full flex items-center justify-center border border-[var(--bg-main)] animate-pulse">
                  {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
                </span>
              )}
            </button>
          </div>
          <Search size={22} className="text-[var(--text-main)] opacity-90" />
        </div>
      </header>

      {/* Market Ticker (API Capability Demo) */}
      <div className="px-3 pt-2">
        <MarketTicker />
      </div>

      {/* User Info Bar */}
      <div className="bg-[var(--bg-surface)]/50 px-4 py-2 flex items-center justify-between border-b border-[var(--border-color)] backdrop-blur-sm sticky top-[52px] z-30 transition-colors duration-300">
        <div className="flex items-center gap-2">
          {loading ? (
            <>
              <Skeleton className="w-8 h-8 rounded-full" />
              <div className="flex flex-col gap-1">
                <Skeleton className="h-2 w-16" />
                <Skeleton className="h-3 w-24" />
              </div>
            </>
          ) : (
            <>
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-yellow-400 to-yellow-600 p-0.5 shadow-lg overflow-hidden">
                <div className="w-full h-full bg-[var(--bg-main)] rounded-full flex items-center justify-center border-2 border-white overflow-hidden transition-colors duration-300">
                  {userData?.profilePictureUrl ? (
                    <img src={userData.profilePictureUrl} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <User size={14} className="text-white" />
                  )}
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider leading-none">স্বাগতম (Welcome)</span>
                <span className="text-xs font-black text-[var(--text-main)] tracking-tight">{userData?.username || 'Player'}</span>
              </div>
            </>
          )}
        </div>
        <div className="flex flex-col items-end gap-1">
          {loading ? (
            <>
              <Skeleton className="h-2 w-12" />
              <Skeleton className="h-3 w-20" />
            </>
          ) : (
            <>
              <span className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider leading-none">আইডি (ID)</span>
              <span className="text-xs font-mono text-yellow-400 font-bold">{userData?.numericId || userData?.id?.substring(0, 8) || '84729104'}</span>
            </>
          )}
        </div>
      </div>

      {/* Hero Banner Section */}
      <div className="p-2">
        {loading ? (
          <Skeleton className="w-full h-[220px] rounded-3xl" />
        ) : (
          <div className="relative h-[220px] rounded-3xl overflow-hidden border border-yellow-500/20 shadow-[0_0_30px_rgba(234,179,8,0.15)] group bg-[#050f0f]">
            {/* Main Banner Image */}
            <GlobalImage 
              imageKey="hero_banner_host"
              defaultUrl="https://picsum.photos/seed/casino_banner/800/400"
              currentUrl={globalImages['hero_banner_host']}
              alt="Promo Banner"
              showToast={showToast}
              updateGlobalImage={async (url) => {
                if (updateGlobalImage) await updateGlobalImage('hero_banner_host', url);
              }}
              className="w-full h-full object-fill hover:scale-105 transition-transform duration-700"
              containerClassName="absolute inset-0 w-full h-full pointer-events-auto"
              isAdmin={isAdmin}
            />
            
            {/* Simple Pagination Dots (Decorative) */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2 z-40 pointer-events-none">
              <div className="w-6 h-1.5 rounded-full bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.5)]"></div>
              <div className="w-1.5 h-1.5 rounded-full bg-white/40 backdrop-blur"></div>
              <div className="w-1.5 h-1.5 rounded-full bg-white/40 backdrop-blur"></div>
            </div>
          </div>
        )}
      </div>

      {/* Featured Games Section */}
      <div className="px-2 mt-4 space-y-3">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-2">
             <div className="p-1.5 bg-yellow-500/20 rounded-lg text-yellow-500">
               <Flame size={18} fill="currentColor" />
             </div>
             <h3 className="text-white font-black text-sm uppercase italic tracking-tighter">স্পেশাল গেম (Featured Games)</h3>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 bg-yellow-500/10 border border-yellow-500/20 rounded-full">
            <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(234,179,8,0.8)]"></div>
            <span className="text-[10px] font-black text-yellow-500 uppercase">PROMOTED</span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {loading ? (
            <>
              <Skeleton className="w-full h-36 rounded-2xl" />
              <Skeleton className="w-full h-36 rounded-2xl" />
            </>
          ) : (
            <>
              {/* Aviator Promo Banner */}
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  const game = games.find(g => g.id === '5');
                  if (game) handleGameSelect(game);
                }}
                className="relative h-36 bg-gradient-to-br from-red-900 to-red-950 rounded-2xl overflow-hidden border border-red-500/30 group cursor-pointer shadow-lg shadow-red-900/20"
              >
                <WinAnimation gameId="5" />
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
                
                <div className="relative z-10 flex h-full">
                  <div className="w-[60%] p-5 flex flex-col justify-center">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="text-yellow-400 font-black text-[10px] flex items-center gap-0.5">
                        <Star size={10} fill="currentColor" /> 5.0
                      </div>
                    </div>
                    <h4 className="text-2xl font-black text-white italic leading-tight mb-2 tracking-tighter uppercase drop-shadow-lg">
                      AVIATOR <br/>
                      <span className="text-red-400">CRASH GAME</span>
                    </h4>
                    <div className="flex items-center gap-2">
                       <div className="flex items-center gap-1 px-3 py-1 bg-white/10 rounded-full backdrop-blur-md border border-white/5">
                         <Users size={12} className="text-white/60" />
                         <span className="text-[9px] font-bold text-white">৩,৫০০+ খেলোয়াড়</span>
                       </div>
                       <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center text-white shadow-lg animate-bounce">
                         <Play size={14} fill="currentColor" className="ml-0.5" />
                       </div>
                    </div>
                  </div>
                  
                  <div className="w-[40%] relative">
                    <div className="absolute inset-0 bg-gradient-to-l from-red-600/20 to-transparent"></div>
                    <div className="absolute inset-0 flex items-center justify-center p-4">
                      <motion.img 
                        animate={{ 
                          y: [0, -10, 0],
                          rotate: [0, 2, -2, 0]
                        }}
                        transition={{ 
                          duration: 4, 
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                        src={globalLogos['aviator'] || GAME_IMAGES.AVIATOR_LOGO} 
                        alt="Aviator" 
                        className="w-full h-full object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)]"
                      />
                    </div>
                  </div>
                </div>
                {/* Red Pulsing Aura */}
                <div className="absolute top-1/2 left-0 w-32 h-32 bg-red-600/20 rounded-full blur-3xl -translate-y-1/2 -translate-x-1/2"></div>
              </motion.div>

              {/* Space Rocket Promo Banner */}
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  const game = games.find(g => g.id === 'rocket_1');
                  if (game) handleGameSelect(game);
                }}
                className="relative h-36 bg-gradient-to-br from-indigo-900 to-[#0c0a2e] rounded-2xl overflow-hidden border border-indigo-500/30 group cursor-pointer shadow-lg shadow-indigo-900/20"
              >
                <WinAnimation gameId="rocket_1" />
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
                
                <div className="relative z-10 flex h-full">
                  <div className="w-[60%] p-5 flex flex-col justify-center">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="text-teal-400 font-black text-[10px] flex items-center gap-0.5">
                        <Zap size={10} fill="currentColor" /> X10000
                      </div>
                    </div>
                    <h4 className="text-2xl font-black text-white italic leading-tight mb-2 tracking-tighter uppercase drop-shadow-lg">
                      SPACE ROCKET <br/>
                      <span className="text-teal-400">MEGA MULTIPLIER</span>
                    </h4>
                    <div className="flex items-center gap-2">
                       <div className="flex items-center gap-1 px-3 py-1 bg-white/10 rounded-full backdrop-blur-md border border-white/5">
                         <Users size={12} className="text-white/60" />
                         <span className="text-[9px] font-bold text-white">১,২০০+ খেলোয়াড়</span>
                       </div>
                       <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white shadow-lg animate-pulse">
                         <Play size={14} fill="currentColor" className="ml-0.5" />
                       </div>
                    </div>
                  </div>
                  
                  <div className="w-[40%] relative">
                    <div className="absolute inset-0 bg-gradient-to-l from-teal-500/20 to-transparent"></div>
                    <div className="absolute inset-0 flex items-center justify-center p-4">
                      <motion.div
                        animate={{ 
                          y: [0, -15, 0],
                          scale: [1, 1.05, 1],
                          filter: ["drop-shadow(0 0 10px rgba(45, 212, 191, 0.4))", "drop-shadow(0 0 25px rgba(45, 212, 191, 0.8))", "drop-shadow(0 0 10px rgba(45, 212, 191, 0.4))"]
                        }}
                        transition={{ 
                          duration: 3, 
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                        className="w-full h-full flex items-center justify-center"
                      >
                        <Zap size={60} className="text-teal-400 fill-teal-400 opacity-80" />
                      </motion.div>
                    </div>
                  </div>
                </div>
                {/* Indigo Glow */}
                <div className="absolute bottom-0 right-0 w-48 h-48 bg-teal-500/10 rounded-full blur-[80px] group-hover:bg-teal-500/20 transition-all"></div>
              </motion.div>
            </>
          )}
        </div>
      </div>

      {/* Live Winners Feed */}
      <div className="px-2 mt-2">
        <div className="bg-[#0a1e1e]/40 border border-yellow-500/10 rounded-2xl p-3 backdrop-blur-sm overflow-hidden relative">
          <div className="flex items-center gap-2 mb-3 border-b border-white/5 pb-2">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]"></div>
            <h3 className="text-[10px] font-black text-yellow-500 uppercase tracking-[0.2em]">লাইভ উইনার্স (Live Winners)</h3>
          </div>
          
          <div className="h-24 overflow-hidden relative">
            {loading ? (
              <div className="space-y-2">
                <Skeleton className="w-full h-12 rounded-xl" />
                <Skeleton className="w-full h-12 rounded-xl" />
              </div>
            ) : (
              <div className="animate-[scroll-vertical_15s_linear_infinite] hover:animate-none space-y-2">
                {[
                  { user: 'Pl***82', amount: '৳ ৫,৪০০', game: 'Super Ace' },
                  { user: 'Ka***12', amount: '৳ ১২,০০০', game: 'Fortune Gems' },
                  { user: 'Ab***09', amount: '৳ ২,৫০০', game: 'Aviator' },
                  { user: 'Ro***44', amount: '৳ ৪৫,০০০', game: 'Money Coming' },
                  { user: 'Sa***77', amount: '৳ ৮,৯০০', game: 'Boxing King' },
                  { user: 'Mi***21', amount: '৳ ৩,২০০', game: 'Crazy 777' },
                  { user: 'Ju***55', amount: '৳ ১৫,৬০০', game: 'Roma X' },
                  // Duplicate for seamless scroll
                  { user: 'Pl***82', amount: '৳ ৫,৪০০', game: 'Super Ace' },
                  { user: 'Ka***12', amount: '৳ ১২,০০০', game: 'Fortune Gems' },
                  { user: 'Ab***09', amount: '৳ ২,৫০০', game: 'Aviator' },
                  { user: 'Ro***44', amount: '৳ ৪৫,০০০', game: 'Money Coming' },
                  { user: 'Sa***77', amount: '৳ ৮,৯০০', game: 'Boxing King' },
                  { user: 'Mi***21', amount: '৳ ৩,২০০', game: 'Crazy 777' },
                  { user: 'Ju***55', amount: '৳ ১৫,৬০০', game: 'Roma X' },
                ].map((win, i) => (
                  <div key={i} className="flex items-center justify-between bg-white/5 p-2 rounded-xl border border-white/5">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-yellow-500/10 flex items-center justify-center text-yellow-500 border border-yellow-500/20">
                        <User size={14} />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-white">{win.user}</p>
                        <p className="text-[8px] text-slate-400 font-bold uppercase">{win.game}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-black text-green-400 italic">{win.amount}</p>
                      <p className="text-[8px] text-slate-500 font-bold uppercase">জয়ী</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Referral Program Banner */}
      <div className="px-2 mt-4">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#1a1a1a] to-[#0a0a0a] border border-yellow-500/20 p-4 shadow-xl group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-yellow-500/20 transition-all"></div>
          <div className="relative z-10 flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Users className="text-yellow-500" size={20} />
                <span className="text-[10px] font-black text-yellow-500 uppercase tracking-widest">রেফারেল প্রোগ্রাম</span>
              </div>
              <h4 className="text-lg font-black text-white italic">বন্ধুদের আমন্ত্রণ জানান</h4>
              <p className="text-xs text-slate-400 font-bold">প্রতি রেফারেলে পান <span className="text-yellow-400">৳ ৯৯৯</span> পর্যন্ত বোনাস!</p>
            </div>
            <button 
              onClick={() => onNavigate?.('invite')}
              className="bg-yellow-500 text-black px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-tighter shadow-lg hover:scale-105 active:scale-95 transition-all outline-none"
            >
              শেয়ার করুন
            </button>
          </div>
        </div>
      </div>

      {/* Recently Played Section */}
      {(loading || recentlyPlayed.length > 0) && (
        <div className="px-4 mt-2 mb-6 animate-in fade-in slide-in-from-left-4 duration-500">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-teal-500/20 flex items-center justify-center text-teal-400">
                <Clock size={18} />
              </div>
              <h3 className="text-white font-black text-sm italic uppercase tracking-tight">Recently Played</h3>
            </div>
            <span className="text-[10px] text-teal-500 font-bold uppercase tracking-widest flex items-center gap-1.5">
              {loading ? (
                <div className="flex items-center gap-2 px-2 py-0.5 bg-yellow-500/10 rounded-full border border-yellow-500/20 animate-pulse">
                  <RefreshCw size={10} className="animate-spin text-yellow-500" />
                  <span className="text-[9px] font-black text-yellow-500 uppercase tracking-widest">Updating...</span>
                </div>
              ) : (
                `${recentlyPlayed.length} Games`
              )}
            </span>
          </div>
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
            {loading ? (
              [...Array(4)].map((_, i) => (
                <div key={i} className="flex-shrink-0 w-24 aspect-[3/4] rounded-xl bg-gray-800/50 overflow-hidden relative border border-white/5">
                  <div className="animate-pulse bg-teal-900/30 w-full h-full"></div>
                </div>
              ))
            ) : (
              recentlyPlayed.map((game) => (
                <motion.div
                  key={game.id}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleGameSelect(game)}
                  className="flex-shrink-0 w-24 group cursor-pointer"
                >
                  <div className="relative aspect-[3/4] rounded-xl overflow-hidden border border-white/10 shadow-lg group-hover:border-teal-500/50 transition-all">
                    <GlobalImage 
                      imageKey={game.id === '1' ? 'aviator' : game.id} 
                      defaultUrl={game.image} 
                      currentUrl={globalLogos[game.id === '1' ? 'aviator' : game.id]}
                      updateGlobalImage={async (url) => {
                        await updateGlobalGameLogo(game.id === '1' ? 'aviator' : game.id, url);
                      }}
                      isAdmin={isAdmin}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity pointer-events-none"></div>
                    <div className="absolute bottom-1 left-1 right-1 pointer-events-none">
                      <p className="text-[8px] font-black text-white truncate text-center uppercase tracking-tighter">{globalNames[game.id] || game.name}</p>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Leaderboard Preview */}
      <div className="px-4 mt-2">
        <button 
          onClick={() => setShowLeaderboard(true)}
          className="w-full bg-gradient-to-r from-purple-900/40 to-blue-900/40 border border-white/10 rounded-2xl p-4 flex items-center justify-between group hover:border-white/30 transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center text-yellow-500">
              <Trophy size={20} />
            </div>
            <div className="text-left">
              <p className="text-white font-bold text-sm">Winner's Board</p>
              <p className="text-gray-500 text-[10px] uppercase font-bold">Check top payouts</p>
            </div>
          </div>
          <ChevronRight className="text-gray-500 group-hover:text-white transition-colors" />
        </button>
      </div>

      {/* Marquee Announcement */}
      <div className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--text-muted)] bg-[var(--bg-main)] mt-4 transition-colors duration-300">
        <Volume2 size={18} className="shrink-0 text-[var(--text-muted)]" />
        <div className="overflow-hidden whitespace-nowrap flex-1 relative h-5">
          <p className="absolute animate-marquee text-[13px] text-[var(--text-main)]">
            {noticeText}
          </p>
        </div>
        <div className="relative shrink-0 ml-2">
          <Mail size={22} className="text-[var(--text-main)]" />
          <span className="absolute -top-1.5 -right-2 bg-red-600 text-white text-[9px] px-1 rounded-full border border-[var(--bg-main)]">
            99+
          </span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="px-2 py-2">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input 
            type="text" 
            placeholder="গেম খুঁজুন..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] rounded-full py-2 pl-10 pr-4 text-sm text-[var(--text-main)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--brand-primary)] transition-all duration-300 shadow-inner"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Category Navigation */}
      <div className="flex overflow-x-auto gap-4 px-4 py-3 no-scrollbar bg-[#0a1e1e]/20 border-b border-white/5 sticky top-[92px] z-30 backdrop-blur-md transition-colors duration-300">
        {[
          { id: 'সব', icon: Gamepad2, label: 'সব' },
          { id: 'সেরা', icon: Flame, label: 'সেরা' },
          { id: 'পছন্দ', icon: Star, label: 'পছন্দ' },
          { id: 'স্লট', icon: Gamepad2, label: 'স্লট' },
          { id: 'Live Casino', icon: Tv, label: 'Live Casino' },
          { id: 'Table Games', icon: Club, label: 'Table Games' },
          { id: 'Fishing Games', icon: Fish, label: 'Fishing Games' },
          { id: 'Lottery', icon: Ticket, label: 'Lottery' },
        ].map((cat) => (
          <div 
            key={cat.id}
            role="button"
            tabIndex={0}
            onClick={() => setActiveCategory(cat.id)}
            onKeyDown={(e) => { if(e.key === 'Enter' || e.key === ' ') setActiveCategory(cat.id); }}
            className={`flex flex-col items-center gap-1 min-w-[50px] cursor-pointer transition-all ${activeCategory === cat.id ? 'scale-110 active:scale-100' : 'opacity-60'}`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${activeCategory === cat.id ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-black shadow-lg shadow-yellow-500/20' : 'bg-white/5 text-slate-400'}`}>
              <cat.icon size={20} />
            </div>
            <span className={`text-[10px] font-black uppercase tracking-tighter ${activeCategory === cat.id ? 'text-yellow-500' : 'text-slate-500'}`}>
              {cat.label}
            </span>
          </div>
        ))}
      </div>

      {/* Game Grid Section */}
      <div className="px-2 pt-3 pb-6">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-1.5 text-lg font-bold text-[var(--text-main)]">
            {activeCategory === 'পছন্দ' ? (
              <Star className="text-yellow-400 fill-yellow-400" size={20} />
            ) : activeCategory === 'সব' ? (
              <Gamepad2 className="text-blue-400 fill-blue-400" size={20} />
            ) : (
              <Flame className="text-[var(--brand-primary)] fill-[var(--brand-primary)]" size={20} />
            )} 
            {activeCategory}
          </div>
          <div className="flex items-center gap-1">
            <button className="p-1 rounded bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors duration-300">
              <ChevronLeft size={16} />
            </button>
            <button 
              onClick={() => setActiveCategory('সব')}
              className={`px-4 py-1 rounded text-[13px] font-medium transition-colors duration-300 ${activeCategory === 'সব' ? 'bg-yellow-500 text-black' : 'bg-[var(--bg-surface)] text-[var(--text-muted)] hover:bg-[var(--bg-main)] hover:text-[var(--text-main)]'}`}
            >
              সব
            </button>
            <button className="p-1 rounded bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors duration-300">
              <ChevronRight size={16} />
            </button>
          </div>
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
  @keyframes fly-card {
    0% { transform: translate(-30px, 20px) rotate(-30deg) scale(0.8); opacity: 0; }
    20% { opacity: 1; }
    80% { opacity: 1; }
    100% { transform: translate(40px, -30px) rotate(-30deg) scale(1.2); opacity: 0; }
  }
`;

if (typeof document !== 'undefined') {
  const styleTag = document.createElement('style');
  styleTag.innerHTML = style;
  document.head.appendChild(styleTag);
}
