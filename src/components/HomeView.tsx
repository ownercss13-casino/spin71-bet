import React from 'react';
import { Clock, Trophy, Download, X, RefreshCw, ChevronRight, Play, Wallet, Users, Star, TrendingUp, History, User, Menu, Bell, Search, Volume2, Flame, Gamepad2, Hexagon, Tv, Club, Fish, Ticket, ChevronLeft, Mail } from 'lucide-react';
import { motion } from 'motion/react';
import { GAME_IMAGES } from '../constants/gameAssets';
import { GameGrid } from "./GameGrid";

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
  allButtonName?: string;
  updateAllButtonName?: (newName: string) => void;
  casinoName?: string;
  updateCasinoName?: (newName: string) => void;
  showToast: (msg: string, type?: any) => void;
  loading?: boolean;
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
  allButtonName,
  updateAllButtonName,
  casinoName = "SPIN71BET",
  updateCasinoName,
  showToast,
  loading
}: HomeViewProps) {
  const [editingCasinoName, setEditingCasinoName] = React.useState(false);
  const [tempCasinoName, setTempCasinoName] = React.useState(casinoName || "SPIN71BET");

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Top App Download Banner */}
      <div className="bg-[#128a61] px-2 py-1.5 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <button className="text-teal-200">
            <X size={14} />
          </button>
          <div className="flex items-center gap-1">
            <span className="bg-gradient-to-b from-yellow-400 to-yellow-600 text-black px-1 rounded text-[10px] font-bold border border-yellow-300">
              {casinoName}.com
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
          <div 
            onClick={() => {
              setTempCasinoName(casinoName || "SPIN71BET");
              setEditingCasinoName(true);
            }}
            className="text-2xl font-black italic tracking-tighter bg-gradient-to-b from-yellow-200 via-yellow-400 to-yellow-600 text-transparent bg-clip-text drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] cursor-pointer"
            title="নাম পরিবর্তন করতে ক্লিক করুন"
          >
            {casinoName}
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
          <div className="relative">
            <button 
              onClick={() => setIsNotificationCenterOpen(true)}
              className="p-1 text-teal-50 hover:text-white transition-colors relative"
            >
              <Bell size={22} />
              {unreadNotificationsCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-red-600 text-white text-[8px] font-bold w-4 h-4 rounded-full flex items-center justify-center border border-[#16a374] animate-pulse">
                  {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
                </span>
              )}
            </button>
          </div>
          <Search size={22} className="text-teal-50" />
        </div>
      </header>

      {/* User Info Bar */}
      <div className="bg-[#128a61]/50 px-4 py-2 flex items-center justify-between border-b border-teal-700/30 backdrop-blur-sm sticky top-[52px] z-30">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-yellow-400 to-yellow-600 p-0.5 shadow-lg overflow-hidden">
            <div className="w-full h-full bg-[#16a374] rounded-full flex items-center justify-center border-2 border-white overflow-hidden">
              {userData?.profilePictureUrl ? (
                <img src={userData.profilePictureUrl} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User size={14} className="text-white" />
              )}
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

      {/* Hero Banner Section */}
      <div className="p-2">
        <div className="relative h-44 bg-gradient-to-br from-teal-800 to-teal-900 rounded-3xl overflow-hidden border border-white/10 shadow-2xl group">
          {/* Animated Background Elements */}
          <div className="absolute inset-0 z-0">
            <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
            <div className="absolute -right-20 -top-20 w-64 h-64 bg-yellow-500/10 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl animate-pulse delay-700"></div>
          </div>

          {/* Character Image */}
          <div className="absolute right-0 bottom-0 w-1/2 h-full z-20 pointer-events-none">
            <img 
              src={GAME_IMAGES.CRASH_GAME} 
              alt="Casino Host" 
              className="w-full h-full object-contain object-bottom transform scale-125 group-hover:scale-130 transition-transform duration-500 drop-shadow-[0_20px_40px_rgba(0,0,0,0.9)]"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
          </div>

          {/* Floating Casino Elements */}
          <div className="absolute right-1/4 top-10 z-30 animate-[bounce_4s_ease-in-out_infinite] opacity-90">
            <div className="w-8 h-8 rounded-full border-4 border-dashed border-yellow-400 bg-red-600 shadow-lg flex items-center justify-center">
              <div className="w-4 h-4 rounded-full border-2 border-white"></div>
            </div>
          </div>

          {/* Banner Content */}
          <div className="z-30 pl-5 w-1/2 relative h-full flex flex-col justify-center">
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

            <button className="mt-3 bg-gradient-to-r from-yellow-400 to-yellow-600 text-black text-[10px] font-black px-4 py-1.5 rounded-full shadow-lg hover:scale-105 active:scale-95 transition-all border border-yellow-200 uppercase tracking-tighter w-fit">
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
            <span className="text-[10px] text-teal-500 font-bold uppercase tracking-widest">{loading ? 'Loading...' : `${recentlyPlayed.length} Games`}</span>
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
                    <img 
                      src={globalLogos[game.id === '1' ? 'aviator' : game.id] || game.image} 
                      alt={game.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity"></div>
                    <div className="absolute bottom-1 left-1 right-1">
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
      <div className="flex items-center gap-2 px-3 py-2 text-sm text-teal-100 bg-[#16a374] mt-4">
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
          globalLogos={globalLogos}
          globalNames={globalNames}
          globalUrls={globalUrls}
          globalOptions={globalOptions}
          loading={loading}
          allButtonName={allButtonName}
          showToast={showToast}
          isAdmin={userData?.role === 'admin'}
          onAllButtonNameChange={async (newName) => {
            if (updateAllButtonName) {
              try {
                await updateAllButtonName(newName);
                showToast("ALL বাটনের নাম সফলভাবে আপডেট করা হয়েছে", "success");
              } catch (err) {
                console.error("Failed to update all button name:", err);
                showToast("নাম আপডেট করতে সমস্যা হয়েছে", "error");
              }
            }
          }}
          onGameLogoChange={async (gameId, newLogo) => {
            if (userData?.id) {
              try {
                await updateGlobalGameLogo(gameId, newLogo);
                showToast("গেম কভার সফলভাবে আপডেট করা হয়েছে এবং সবার জন্য সেভ হয়েছে", "success");
              } catch (err) {
                console.error("Failed to update global logo:", err);
                showToast("কভার আপডেট করতে সমস্যা হয়েছে", "error");
              }
            }
          }}
          onGameNameChange={async (gameId, newName) => {
            if (userData?.id) {
              try {
                await updateGlobalGameName(gameId, newName);
                showToast("গেমের নাম সফলভাবে আপডেট করা হয়েছে এবং সবার জন্য সেভ হয়েছে", "success");
              } catch (err) {
                console.error("Failed to update global name:", err);
                showToast("নাম আপডেট করতে সমস্যা হয়েছে", "error");
              }
            }
          }}
          onGameUrlChange={async (gameId, newUrl) => {
            if (userData?.id) {
              try {
                await updateGlobalGameUrl(gameId, newUrl);
                showToast("গেম URL সফলভাবে আপডেট করা হয়েছে এবং সবার জন্য সেভ হয়েছে", "success");
              } catch (err) {
                console.error("Failed to update global url:", err);
                showToast("URL আপডেট করতে সমস্যা হয়েছে", "error");
              }
            }
          }}
          onGameOptionChange={async (gameId, newOption) => {
            if (userData?.id) {
              try {
                await updateGlobalGameOption(gameId, newOption);
                showToast("গেম অপশন সফলভাবে আপডেট করা হয়েছে এবং সবার জন্য সেভ হয়েছে", "success");
              } catch (err) {
                console.error("Failed to update global option:", err);
                showToast("অপশন আপডেট করতে সমস্যা হয়েছে", "error");
              }
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
                    try {
                      await updateCasinoName(tempCasinoName);
                      showToast("ক্যাসিনোর নাম সফলভাবে আপডেট করা হয়েছে", "success");
                    } catch (error) {
                      showToast("নাম আপডেট করতে সমস্যা হয়েছে", "error");
                    }
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
