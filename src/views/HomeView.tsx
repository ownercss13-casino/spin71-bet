import React, { useState, useEffect } from 'react';
import { AnimatedBalance } from '../components/AnimatedBalance';
import { Clock, Download, X, RefreshCw, ChevronRight, Wallet, Users, Star, TrendingUp, History, User, Menu, Bell, Search, Volume2, Flame, Gamepad2, Hexagon, Tv, Club, Fish, Ticket, ChevronLeft, Mail, Sparkles, Zap, Gift, Send, MessageSquare, Headset, Plane, Smartphone, Trophy } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GAME_IMAGES } from '../constants/gameAssets';
import { GameGrid, games } from "../components/ui/GameGrid";
import GlobalImage from '../components/ui/GlobalImage';
import Skeleton from '../components/ui/Skeleton';
import LiveBetsTicker from '../components/LiveBetsTicker';

import { useLanguage } from '../context/LanguageContext';
import { LOCALIZED_STRINGS } from '../constants/localization';
import { db } from '../services/firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';

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
  globalLogos: Record<string, string>;
  globalNames: Record<string, string>;
  globalUrls: Record<string, string>;
  globalOptions: Record<string, string>;
  globalImages?: Record<string, string>;
  appLogo?: string;
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
  showInstallBanner?: boolean;
  onNavigate?: (tab: string, subTab?: string) => void;
  onOpenLogin?: (mode?: 'login' | 'register') => void;
  setIsSupportChatOpen?: (open: boolean) => void;
  onInstallApp?: () => void;
}

export default function HomeView({ 
  userData, 
  recentlyPlayed, 
  favorites, 
  handleGameSelect, 
  globalLogos,
  globalNames,
  globalUrls,
  globalOptions,
  globalImages = {},
  appLogo,
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
  casinoName = "SPIN71 BET✨",
  updateCasinoName,
  noticeText = "আমাদের গেম উপভোগ করুন এবং বড় জয় নিশ্চিত করুন!",
  telegramLink,
  whatsappLink,
  facebookLink,
  showToast,
  loading,
  isAdmin = false,
  showInstallBanner = false,
  onNavigate,
  onOpenLogin,
  setIsSupportChatOpen,
  onInstallApp
}: HomeViewProps) {
  const { strings } = useLanguage();
  const [editingCasinoName, setEditingCasinoName] = React.useState(false);
  const [tempCasinoName, setTempCasinoName] = React.useState(casinoName || "SPIN71BET1");
  const [currentSlide, setCurrentSlide] = useState(0);

  const bannerSlides = [
    {
      id: 'banner1',
      image: "https://www.image2url.com/r2/default/images/1780756072411-5bf24ebb-fb2f-467a-a559-8875dfb29a60.png",
      title: strings.heroCasinoTitle,
      desc: strings.heroCasinoDesc,
      isDefault: true,
      action: () => onNavigate?.('invite')
    },
    {
      id: 'banner2',
      image: "/src/assets/images/casino_hero_banner_2_1780243907033.png",
      title: strings.heroAviatorTitle,
      desc: strings.heroAviatorDesc,
      isDefault: false,
      action: () => onNavigate?.('aviator')
    },
    {
      id: 'banner3',
      image: "/src/assets/images/casino_hero_banner_3_1780243929232.png",
      title: strings.heroJackpotTitle,
      desc: strings.heroJackpotDesc,
      isDefault: false,
      action: () => onNavigate?.('deposit')
    }
  ];

  // Sync current slide with category selection if user manually switches tabs
  useEffect(() => {
    if (activeCategory === 'ক্র্যাশ') {
      setCurrentSlide(1);
    } else if (activeCategory === 'স্লট') {
      setCurrentSlide(2);
    } else {
      setCurrentSlide(0);
    }
  }, [activeCategory]);

  // Set up auto rotation every 5 seconds (5000ms)
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % 3);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const trackBannerClick = async (slide: typeof bannerSlides[0]) => {
    try {
      await addDoc(collection(db, 'banner_clicks'), {
        bannerId: slide.id,
        bannerTitle: slide.title || 'Welcome Promo Bonus Banner',
        userId: userData?.uid || userData?.id || 'anonymous',
        username: userData?.username || 'anonymous',
        timestamp: serverTimestamp()
      });
      console.log(`[HomeView] Tracked banner click engagement: ${slide.id}`);
    } catch (err) {
      console.error('[HomeView] Failed to track banner click:', err);
    }
  };

  const categories = [
    { id: 'সব', icon: Gamepad2, label: strings.catAll },
    { id: 'সেরা', icon: Flame, label: strings.catHot },
    { id: 'ক্র্যাশ', icon: TrendingUp, label: strings.catCrash },
    { id: 'পছন্দ', icon: Star, label: strings.catFav },
    { id: 'স্লট', icon: Gamepad2, label: strings.catSlot },
    { id: 'Live Casino', icon: Tv, label: strings.catLive },
    { id: 'Table Games', icon: Club, label: strings.catTable },
    { id: 'Fishing Games', icon: Fish, label: strings.catFishing },
    { id: 'Lottery', icon: Ticket, label: strings.catLottery },
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
      {/* Main Header - SPIN71BET1 Style */}
      <header className="flex items-center justify-between px-4 py-3 bg-[#0d1a29] sticky top-0 z-[110] border-b border-[#1e3a5f] shadow-lg backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button 
            className="text-[#90a4ae] hover:text-[#00e5ff] transition-colors p-1" 
            onClick={() => setIsSidebarOpen(true)}
          >
            <Menu size={26} />
          </button>
          <div className="flex items-center ml-2">
            <img 
              src={appLogo || 'https://www.image2url.com/r2/default/images/1781024598371-46bd7cc9-4b5f-49cd-b4b3-60d4d200534a.png'} 
              onError={(e) => {
                e.currentTarget.src = 'https://www.image2url.com/r2/default/images/1781024598371-46bd7cc9-4b5f-49cd-b4b3-60d4d200534a.png';
              }}
              alt="Logo" 
              className="h-9 max-w-[130px] object-contain cursor-pointer hover:scale-105 transition-all"
              onClick={() => onNavigate?.('home')}
            />
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {!userData ? (
            <div className="flex items-center gap-2">
              <button 
                onClick={() => onOpenLogin?.('login')}
                className="bg-transparent border border-[#1e3a5f] px-4 py-2 rounded-xl text-[10px] font-black text-[#90a4ae] hover:text-white transition-colors"
              >
                {strings.btnLogin}
              </button>
              <button 
                onClick={() => onOpenLogin?.('register')}
                className="bg-gradient-to-r from-yellow-400 to-yellow-600 px-5 py-2 rounded-xl text-[10px] font-black text-black hover:scale-105 transition-transform"
              >
                {strings.btnRegister}
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div 
                className="flex items-center gap-2 bg-gradient-to-r from-[#14253a] to-[#0d1a29] px-3 py-1.5 rounded-2xl border border-yellow-500/30 shadow-[0_0_15px_rgba(0,0,0,0.5)] active:scale-95 transition-transform cursor-pointer"
                onClick={() => onNavigate?.('wallet')}
              >
                <div className="flex flex-col items-end">
                  <span className="text-[10px] text-gray-500 font-black tracking-tighter leading-none">{strings.lblBalance}</span>
                  <AnimatedBalance value={balance} decimals={0} className="text-sm font-black text-[#fdd835] tracking-tight" />
                </div>
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 p-[1px] shadow-lg overflow-hidden">
                  <div 
                    className="w-full h-full rounded-full bg-[#0d1a29] flex items-center justify-center text-[#fdd835] font-black text-xs overflow-hidden"
                  >
                    {userData.profilePictureUrl ? (
                      <img src={userData.profilePictureUrl} alt="ছবি" className="w-full h-full object-cover" />
                    ) : (
                      <img src="https://www.image2url.com/r2/default/images/1779828873931-409cfe92-d243-4926-91bd-67da3a1e0adc.png" alt="ছবি" className="w-full h-full object-cover" />
                    )}
                  </div>
                </div>
              </div>
              <button 
                className="w-10 h-10 flex items-center justify-center text-[#90a4ae] hover:text-[#00e5ff] transition-colors relative"
                onClick={() => window.dispatchEvent(new CustomEvent('openSupportChat'))}
              >
                <Headset size={22} className="animate-pulse" />
              </button>
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

      {/* Premium Hero Slider with 5-Second Auto Rotation */}
      <div className="px-3 pt-3">
        <div 
          onClick={() => {
            trackBannerClick(bannerSlides[currentSlide]);
            bannerSlides[currentSlide].action();
          }}
          className="relative w-full aspect-[2.65/1] md:aspect-auto md:h-64 rounded-2xl overflow-hidden shadow-2xl border border-white/5 bg-[#14253a] cursor-pointer"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={bannerSlides[currentSlide].id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="absolute inset-0"
            >
              <img 
                src={bannerSlides[currentSlide].image} 
                alt="Casino Banner" 
                className="w-full h-full object-fill md:object-cover"
              />
              
              {/* Only show text overlay if NOT the default 'সেরা' category banner, as the default banner already has the beautifully formatted Bengali text and CTA buttons baked directly into it */}
              {!bannerSlides[currentSlide].isDefault ? (
                <>
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0d1a29] via-transparent to-transparent opacity-60"></div>
                  
                  <div className="absolute bottom-3 left-3 sm:bottom-4 sm:left-4 z-10 w-3/4">
                    <motion.div 
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.3 }}
                    >
                      <h2 className="text-sm sm:text-lg md:text-2xl lg:text-3xl font-black text-white italic leading-tight drop-shadow-lg scale-y-110 tracking-tight">
                        {bannerSlides[currentSlide].title}
                      </h2>
                      <p className="text-[8px] sm:text-[10px] md:text-sm text-yellow-400 font-bold uppercase tracking-widest mt-0.5 sm:mt-1">
                        {bannerSlides[currentSlide].desc}
                      </p>
                    </motion.div>
                    
                    <motion.button 
                      initial={{ y: 10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.5 }}
                      className="mt-1.5 sm:mt-3 bg-gradient-to-r from-yellow-400 to-yellow-600 text-black px-4 py-1.5 sm:px-6 sm:py-2 rounded-lg sm:rounded-xl text-[8px] sm:text-[10px] font-black uppercase tracking-widest shadow-lg shadow-yellow-600/30 active:scale-95 transition-all"
                    >
                      {strings.btnDepositNow}
                    </motion.button>
                  </div>
                </>
              ) : (
                // For 'সেরা', we still show a very subtle drop shadow overlay around the bottom to blend nicely, keeping the baked-in brand designs fully crisp and clean
                <div className="absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-[#0d1a29]/40 to-transparent pointer-events-none"></div>
              )}
            </motion.div>
          </AnimatePresence>
          
          {/* Slider Indicators */}
          <div className="absolute bottom-4 right-4 flex gap-1.5 z-10">
            {bannerSlides.map((_, i) => (
              <button 
                key={i} 
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentSlide(i);
                }}
                className={`w-1.5 h-1.5 rounded-full ${i === currentSlide ? 'bg-yellow-400 w-4' : 'bg-white/30'} transition-all`} 
              />
            ))}
          </div>
        </div>
      </div>

      {/* Scrolling Notice Bar */}
      <div className="bg-[#1a2f4a] px-3 py-2 flex items-center gap-2 border-b border-[#1e3a5f]">
        <div className="text-gray-400 group-hover:text-white"><Volume2 size={18}/></div>
        <div className="flex-1 overflow-hidden relative h-4">
          <div className="absolute whitespace-nowrap animate-marquee text-white text-xs font-bold">
            {strings.scrollingNotice} {noticeText}
          </div>
        </div>
        <div className="flex items-center gap-3 text-red-500">
           <Gift size={18} className="cursor-pointer hover:scale-110 active:scale-95 transition-transform" onClick={() => onNavigate?.('bonus')} />
           <Mail size={18} className="cursor-pointer hover:scale-110 active:scale-95 transition-transform" onClick={() => setIsNotificationCenterOpen(true)} />
        </div>
      </div>

      {/* Leaderboard Quick Access Card */}
      <div className="px-3 py-4">
        <motion.div 
          whileTap={{ scale: 0.98 }}
          onClick={() => onNavigate?.('leaderboard')}
          className="bg-gradient-to-r from-teal-900 to-blue-900 p-5 rounded-[28px] border border-white/10 shadow-xl flex items-center justify-between group overflow-hidden relative"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:scale-150 transition-transform duration-1000" />
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-12 h-12 bg-yellow-500/20 rounded-2xl flex items-center justify-center text-yellow-500 backdrop-blur-md border border-yellow-500/20 group-hover:rotate-12 transition-transform">
              <Trophy size={26} />
            </div>
            <div className="text-left">
              <span className="text-lg font-black text-white italic tracking-tighter block uppercase">{strings.leaderboardTitle}</span>
              <span className="text-[9px] font-bold text-teal-300 uppercase tracking-widest leading-none">{strings.leaderboardDesc}</span>
            </div>
          </div>
          <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white shrink-0 group-hover:translate-x-1 transition-transform">
            <ChevronRight size={20} />
          </div>
        </motion.div>
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
            placeholder={strings.searchPlaceholder}
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
              {cat.label}
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
                {activeCategory === 'সব' ? strings.catAll : activeCategory === 'সেরা' ? strings.catHot : activeCategory === 'পছন্দ' ? strings.catFav : activeCategory}
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
          globalLogos={globalLogos}
          globalNames={globalNames}
        />
      </div>

        {/* Referral Program Banner - Simplified */}
      <div className="px-3 mt-4">
        <div 
          className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-900 via-blue-900 to-indigo-900 border border-indigo-500/30 p-5 cursor-pointer shadow-lg shadow-indigo-900/20"
          onClick={() => onNavigate?.('invite')}
        >
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              <h4 className="text-xl font-black text-white italic tracking-tight">Refer & Earn</h4>
              <p className="text-[10px] text-indigo-200 font-bold">Invite friends and get ৳108 bonus per person!</p>
            </div>
            <button className="bg-[#fdd835] text-black px-4 py-2 rounded-lg text-[10px] font-black uppercase shadow-lg shadow-yellow-500/20 active:scale-95 transition-all">Invite</button>
          </div>
        </div>
      </div>

      {/* Customer Support Section */}
      <div className="px-3 mt-4 mb-10">
        <h4 className="text-sm font-black text-white italic mb-3 flex items-center gap-2">
            <MessageSquare size={16} className="text-blue-400" />
            Customer Support
        </h4>
        <div className="grid grid-cols-2 gap-2">
          <a href={telegramLink} target="_blank" rel="noopener noreferrer" className="bg-[#0088cc] flex flex-col items-center justify-center p-3 rounded-2xl gap-1 hover:scale-105 transition-transform overflow-hidden relative group">
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <Send size={20} className="text-white relative z-10" />
              <span className="text-[8px] font-black text-white uppercase relative z-10">Telegram</span>
          </a>
          <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="bg-[#25D366] flex flex-col items-center justify-center p-3 rounded-2xl gap-1 hover:scale-105 transition-transform overflow-hidden relative group">
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <MessageSquare size={20} className="text-white relative z-10" />
              <span className="text-[8px] font-black text-white uppercase relative z-10">WhatsApp</span>
          </a>
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
