import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Star, Info, Camera, Edit2, X, Upload, Send } from 'lucide-react';
import Skeleton from './Skeleton';
import { GAME_IMAGES } from '../../constants/gameAssets';
import { GAME_LOGO_URLS } from '../../constants/gameLogos';
import GlobalImage from './GlobalImage';

import { Game, games, PROVIDERS } from '../../constants/games';

export { games };
export type { Game };

interface GameCardProps {
  game: Game;
  isFavorite: boolean;
  onSelect: (game: Game) => void;
  onToggleFavorite: (e: React.MouseEvent, gameId: string) => void;
  globalLogo?: string;
  onLogoChange?: (gameId: string, newLogo: string) => void;
  globalName?: string;
  onNameChange?: (gameId: string, newName: string) => void;
  globalUrl?: string;
  onUrlChange?: (gameId: string, newUrl: string) => void;
  globalOption?: string;
  onOptionChange?: (gameId: string, newOption: string) => void;
  setEditingGame: (game: any) => void;
  showToast?: (message: string, type: 'success' | 'error') => void;
  isAdmin?: boolean;
}

const GameCard: React.FC<GameCardProps> = ({ 
  game, 
  isFavorite, 
  onSelect, 
  onToggleFavorite, 
  globalLogo, 
  onLogoChange, 
  globalName, 
  onNameChange,
  globalUrl,
  onUrlChange,
  globalOption,
  onOptionChange,
  setEditingGame,
  showToast,
  isAdmin = false
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  const displayImage = globalLogo || GAME_LOGO_URLS[game.id] || game.image || `https://picsum.photos/seed/${game.id}/400/600`;
  
  useEffect(() => {
    if (!globalLogo) {
      console.log(`[Debug] Game ${game.id} logo is missing from Firestore, using default: ${displayImage}`);
    }
  }, [game.id, globalLogo, displayImage]);
  
  const displayName = globalName || game.name;
  const displayOption = globalOption || game.provider;
  const displayUrl = globalUrl || '#';

  // Specific gradients for SPIN71 layout
  const getGradient = () => {
    if (game.id.includes('jili_1')) return 'from-[#d81b60] to-[#ad1457]'; // Super Ace
    if (game.id.includes('spribe_12') || game.name === 'Aviator') return 'from-[#43a047] to-[#2e7d32]';
    if (game.id.includes('jili_22')) return 'from-[#039be5] to-[#0277bd]'; // Pirate Legends equivalent
    return game.bgColor || 'from-[#14253a] to-[#0d1a29]';
  };

  return (
    <div 
      onClick={() => onSelect(game)}
      className="flex flex-col gap-1 cursor-pointer group"
    >
      <div className={`relative aspect-square rounded-2xl overflow-hidden bg-gradient-to-b ${getGradient()} border border-white/5 shadow-lg shadow-black/20`}>
        <div className="absolute inset-0 flex items-center justify-center">
          <GlobalImage 
            imageKey={`game_logo_${game.id}`}
            defaultUrl={displayImage}
            currentUrl={globalLogo}
            alt={game.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            isAdmin={isAdmin}
            updateGlobalImage={async (url) => { if (onLogoChange) onLogoChange(game.id, url); }}
          />
        </div>

        {/* Tags and Icons */}
        <div className="absolute top-2 right-2 z-10 text-[#90a4ae] group-hover:text-white transition-colors" onClick={(e) => onToggleFavorite(e, game.id)}>
          <Star size={14} className={isFavorite ? "text-yellow-400 fill-yellow-400" : ""} />
        </div>

        {game.id.includes('jili') && (
          <div className="absolute bottom-1 right-2 text-[8px] font-black text-red-500 italic z-10">JILI</div>
        )}

        {game.id.includes('jili_22') && (
          <div className="absolute top-0 right-0 bg-purple-800 text-white text-[8px] font-bold px-2 py-0.5 rounded-bl-lg z-10">B BUY</div>
        )}


      </div>

      <div className="text-center px-1">
        <p className="text-[11px] font-bold text-white truncate truncate leading-tight uppercase tracking-tighter">{displayName}</p>
        <p className="text-[8px] text-[#90a4ae] truncate leading-tight">{displayOption}</p>
      </div>
    </div>
  );
};

interface GameGridProps {
  category: string;
  setActiveCategory?: (category: string) => void;
  searchQuery?: string;
  onGameSelect: (game: Game) => void;
  favorites: string[];
  onToggleFavorite: (gameId: string) => void;
  globalLogos?: Record<string, string>;
  onGameLogoChange?: (gameId: string, newLogo: string) => void;
  globalNames?: Record<string, string>;
  onGameNameChange?: (gameId: string, newName: string) => void;
  globalUrls: Record<string, string>;
  globalOptions: Record<string, string>;
  onGameUrlChange?: (gameId: string, newUrl: string) => void;
  onGameOptionChange?: (gameId: string, newOption: string) => void;
  loading?: boolean;
  allButtonName?: string;
  onAllButtonNameChange?: (newName: string) => void;
  showToast?: (message: string, type: 'success' | 'error') => void;
  isAdmin?: boolean;
}

export const GameGrid: React.FC<GameGridProps> = ({ 
  category, 
  setActiveCategory,
  searchQuery = "", 
  onGameSelect, 
  favorites, 
  onToggleFavorite, 
  globalLogos = {}, 
  onGameLogoChange, 
  globalNames = {}, 
  onGameNameChange,
  globalUrls,
  globalOptions,
  onGameUrlChange,
  onGameOptionChange,
  loading: externalLoading,
  allButtonName,
  onAllButtonNameChange,
  showToast,
  isAdmin = false
}) => {
  const [selectedProvider, setSelectedProvider] = useState<string>('ALL');
  const [editingAllButton, setEditingAllButton] = useState(false);
  const [tempAllButtonName, setTempAllButtonName] = useState("");
  const [editingGame, setEditingGame] = useState<{
    gameId: string;
    name: string;
    logo: string;
    url: string;
    option: string;
  } | null>(null);

  const [internalLoading, setInternalLoading] = useState(false);

  const isLoading = externalLoading || internalLoading;

  useEffect(() => {
    setInternalLoading(true);
    const timer = setTimeout(() => {
      setInternalLoading(false);
    }, 50);
    return () => clearTimeout(timer);
  }, [category, selectedProvider]);

  const toggleFavorite = (e: React.MouseEvent, gameId: string) => {
    e.stopPropagation();
    onToggleFavorite(gameId);
  };

  const filteredGames = games.filter(game => {
    const isFav = favorites.includes(game.id);
    const matchesProvider = selectedProvider === 'ALL' || game.provider === selectedProvider;
    
    // Admin can see disabled games too for management
    const isActive = globalOptions[`${game.id}_active`] !== 'false';
    const matchesActivity = isActive || isAdmin;
    
    const matchesCategory = 
      category === 'সব' || 
      game.category === category || 
      (category === 'নতুন' && game.isHot) || 
      (category === 'হট গেম' && game.isHot) || 
      (category === 'সেরা' && game.isHot) ||
      (category === 'পছন্দ' && isFav) ||
      (category === 'প্রিয়' && isFav);
    
    const matchesSearch = game.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          game.provider.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch && matchesProvider && matchesActivity;
  });

  return (
    <div className="flex flex-col gap-4">
      {/* Provider Filter */}
      <div className="flex overflow-x-auto gap-3 pb-2 no-scrollbar snap-x snap-mandatory scroll-smooth">
        {PROVIDERS.map(provider => {
          const isAll = provider.id === 'ALL';
          const displayName = isAll ? (allButtonName || 'ALL') : provider.name;
          const displayLogo = isAll ? `https://placehold.co/100x40/111827/ffffff?text=${encodeURIComponent(displayName)}` : provider.logo;

          return (
            <div key={provider.id} className="relative group shrink-0 snap-start">
              <button
                onClick={() => {
                  setSelectedProvider(selectedProvider === provider.id ? 'ALL' : provider.id);
                  if (provider.id === 'ALL' && setActiveCategory) {
                    setActiveCategory('সব');
                  }
                }}
                className={`rounded-lg overflow-hidden border-2 transition-all block h-full ${
                  selectedProvider === provider.id 
                    ? 'border-yellow-400 scale-105 shadow-[0_0_10px_rgba(250,204,21,0.5)]' 
                    : 'border-transparent opacity-70 hover:opacity-100'
                }`}
              >
                <img src={displayLogo} alt={displayName} className="h-8 object-cover" />
              </button>
              {isAll && isAdmin && onAllButtonNameChange && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setTempAllButtonName(displayName);
                    setEditingAllButton(true);
                  }}
                  className="absolute -top-2 -right-2 bg-yellow-500 text-black p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
                >
                  <Edit2 size={12} />
                </button>
              )}
            </div>
          );
        })}
        {/* Live Support Quick Access */}
        <div className="shrink-0 snap-start h-8">
             <button
                onClick={() => window.open('https://t.me/Spin71bot', '_blank')}
                className="h-full rounded-lg bg-gradient-to-tr from-[#00d0f5] to-[#0080ff] px-3 flex items-center gap-1.5 shadow-[0_4px_12px_rgba(0,128,255,0.3)] active:scale-95 transition-all group border border-white/10"
              >
                <div className="relative">
                  <Send size={12} className="text-white group-hover:rotate-12 transition-transform" />
                  <span className="absolute -top-1.5 -right-1.5 w-2 h-2 bg-emerald-500 rounded-full border border-[#0d1a29] animate-pulse"></span>
                </div>
                <span className="text-[9px] font-black text-white italic uppercase tracking-tighter whitespace-nowrap">Live Chat</span>
              </button>
        </div>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-2">
        {isLoading ? (
          [...Array(24)].map((_, i) => (
            <div key={i} className="aspect-square rounded-xl bg-[#0d1525] border border-teal-900/20 overflow-hidden relative shadow-sm animate-pulse">
              {/* Image Area Skeleton */}
              <div className="absolute inset-0 bg-teal-900/10">
                <Skeleton className="w-full h-full rounded-none" />
              </div>
              
              {/* Top Right Star Skeleton */}
              <div className="absolute top-1.5 right-1.5 bg-black/20 rounded-full p-1.5 w-6 h-6">
                <Skeleton className="w-full h-full rounded-full" shimmer={false} />
              </div>

              {/* Bottom Gradient Overlay Skeleton */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent pt-8 pb-3 px-2 flex flex-col justify-end items-center gap-1.5">
                <Skeleton className="h-3 w-4/5 rounded-full opacity-60" />
                <Skeleton className="h-2 w-2/5 rounded-full opacity-40" />
              </div>
            </div>
          ))
        ) : filteredGames.length > 0 ? (
          filteredGames.map(game => (
            <GameCard 
              key={game.id} 
              game={game} 
              isFavorite={favorites.includes(game.id)}
              onSelect={onGameSelect} 
              onToggleFavorite={toggleFavorite}
              globalLogo={globalLogos[game.id]}
              onLogoChange={onGameLogoChange}
              globalName={globalNames[game.id]}
              onNameChange={onGameNameChange}
              globalUrl={globalUrls[game.id]}
              onUrlChange={onGameUrlChange}
              globalOption={globalOptions[game.id]}
              onOptionChange={onGameOptionChange}
              setEditingGame={setEditingGame}
              showToast={showToast}
              isAdmin={isAdmin}
            />
          ))
        ) : (
          <div className="col-span-3 sm:col-span-4 md:col-span-5 lg:col-span-6 xl:col-span-8 py-10 text-center text-teal-300">
            {category === 'পছন্দ' ? 'আপনার কোনো পছন্দের গেম নেই' : 'কোনো গেম পাওয়া যায়নি'}
          </div>
        )}
      </div>

      {/* Global Edit Modal */}
      {editingGame && (
        <div className="fixed inset-0 z-[120] bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-[#1b1b1b] rounded-3xl p-6 max-w-sm w-full border border-yellow-500/30 shadow-[0_0_50px_rgba(234,179,8,0.2)] animate-in zoom-in duration-300">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black text-white italic tracking-tighter">গেম এডিট করুন</h2>
              <button onClick={() => setEditingGame(null)} className="p-2 bg-white/5 rounded-full text-gray-400 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Name */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-yellow-500 uppercase tracking-widest ml-1">গেমের নাম</label>
                <input 
                  type="text"
                  value={editingGame.name}
                  onChange={(e) => setEditingGame({ ...editingGame, name: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-yellow-500 transition-all font-bold"
                />
              </div>

              {/* Option (Provider) */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-yellow-500 uppercase tracking-widest ml-1">অপশন (প্রোভাইডার)</label>
                <input 
                  type="text"
                  value={editingGame.option}
                  onChange={(e) => setEditingGame({ ...editingGame, option: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-yellow-500 transition-all font-bold"
                />
              </div>

              {/* Logo URL */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-yellow-500 uppercase tracking-widest ml-1">লোগো/ছবি URL</label>
                <div className="flex gap-2">
                  <input 
                    type="text"
                    value={editingGame.logo}
                    onChange={(e) => setEditingGame({ ...editingGame, logo: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-yellow-500 transition-all font-mono text-xs"
                    placeholder="URL অথবা গ্যালারি থেকে আপলোড করুন"
                  />
                  <button
                    onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = 'image/*';
                      input.onchange = (e: any) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setEditingGame({ ...editingGame, logo: reader.result as string });
                          };
                          reader.readAsDataURL(file);
                        }
                      };
                      input.click();
                    }}
                    className="bg-yellow-500 text-black px-4 rounded-xl font-bold hover:bg-yellow-400 transition-colors flex items-center justify-center shrink-0"
                    title="গ্যালারি থেকে আপলোড করুন"
                  >
                    <Upload size={18} />
                  </button>
                </div>
              </div>

              {/* Game URL */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-yellow-500 uppercase tracking-widest ml-1">গেম URL</label>
                <input 
                  type="text"
                  value={editingGame.url}
                  onChange={(e) => setEditingGame({ ...editingGame, url: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-yellow-500 transition-all font-mono text-xs"
                />
              </div>
            </div>

            <button 
              onClick={() => {
                if (onGameNameChange) onGameNameChange(editingGame.gameId, editingGame.name);
                if (onGameLogoChange) onGameLogoChange(editingGame.gameId, editingGame.logo);
                if (onGameUrlChange) onGameUrlChange(editingGame.gameId, editingGame.url);
                if (onGameOptionChange) onGameOptionChange(editingGame.gameId, editingGame.option);
                setEditingGame(null);
              }}
              className="w-full bg-gradient-to-r from-yellow-400 to-yellow-600 text-black font-black py-4 rounded-2xl mt-8 shadow-lg shadow-yellow-500/20 active:scale-95 transition-all"
            >
              সেভ করুন (সবার জন্য)
            </button>
          </div>
        </div>
      )}
      {editingAllButton && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-gray-900 border border-white/10 p-6 rounded-2xl w-full max-w-sm">
            <h3 className="text-lg font-bold text-white mb-4">ALL বাটনের নাম পরিবর্তন করুন</h3>
            <input
              type="text"
              value={tempAllButtonName}
              onChange={(e) => setTempAllButtonName(e.target.value)}
              className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white mb-4"
              placeholder="নতুন নাম দিন"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setEditingAllButton(false)}
                className="flex-1 py-3 rounded-xl bg-gray-800 text-white font-bold"
              >
                বাতিল
              </button>
              <button
                onClick={() => {
                  if (onAllButtonNameChange) {
                    onAllButtonNameChange(tempAllButtonName);
                  }
                  setEditingAllButton(false);
                }}
                className="flex-1 py-3 rounded-xl bg-yellow-500 text-black font-bold"
              >
                সেভ করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GameGrid;
