import React, { useState, useEffect, useRef } from 'react';
import { Star, Plane as PlaneIcon, Info, Camera, Edit2, X } from 'lucide-react';
import Skeleton from './Skeleton';
import { GAME_IMAGES } from '../constants/gameAssets';

export interface Game {
  id: string;
  name: string;
  provider: string;
  image: string;
  category: string;
  isHot?: boolean;
  isFavorite?: boolean;
  isVIP?: boolean;
  bgColor?: string;
  providerColor?: string;
}

export const games: Game[] = [
  // JILI (8)
  { id: 'jili_1', name: 'Super Ace', provider: 'JILI', image: 'https://picsum.photos/seed/jili1/400/600', category: 'স্লট', isHot: true, bgColor: 'from-yellow-600 to-green-600' },
  { id: 'jili_2', name: 'Golden Empire', provider: 'JILI', image: 'https://picsum.photos/seed/jili2/400/600', category: 'স্লট', isHot: true, bgColor: 'from-yellow-500 to-yellow-700' },
  { id: 'jili_3', name: 'Fortune Gems', provider: 'JILI', image: 'https://picsum.photos/seed/jili3/400/600', category: 'স্লট', bgColor: 'from-red-500 to-red-800' },
  { id: 'jili_4', name: 'Boxing King', provider: 'JILI', image: 'https://picsum.photos/seed/jili4/400/600', category: 'স্লট', isHot: true, bgColor: 'from-orange-500 to-red-600' },
  { id: 'jili_5', name: 'Money Coming', provider: 'JILI', image: 'https://picsum.photos/seed/jili5/400/600', category: 'স্লট', bgColor: 'from-green-500 to-green-800' },
  { id: 'jili_6', name: 'Charge Buffalo', provider: 'JILI', image: 'https://picsum.photos/seed/jili6/400/600', category: 'স্লট', bgColor: 'from-yellow-600 to-orange-800' },
  { id: 'jili_7', name: 'Magic Lamp', provider: 'JILI', image: 'https://picsum.photos/seed/jili7/400/600', category: 'স্লট', bgColor: 'from-purple-500 to-purple-800' },
  { id: 'jili_8', name: 'Ali Baba', provider: 'JILI', image: 'https://picsum.photos/seed/jili8/400/600', category: 'স্লট', bgColor: 'from-blue-500 to-blue-800' },

  // PG (8)
  { id: 'pg_1', name: 'Mahjong Ways', provider: 'PG', image: 'https://picsum.photos/seed/pg1/400/600', category: 'স্লট', isHot: true, bgColor: 'from-red-600 to-red-900' },
  { id: 'pg_2', name: 'Mahjong Ways 2', provider: 'PG', image: 'https://picsum.photos/seed/pg2/400/600', category: 'স্লট', isHot: true, bgColor: 'from-red-500 to-red-800' },
  { id: 'pg_3', name: 'Treasure of Aztec', provider: 'PG', image: 'https://picsum.photos/seed/pg3/400/600', category: 'স্লট', bgColor: 'from-yellow-500 to-orange-700' },
  { id: 'pg_4', name: 'Lucky Neko', provider: 'PG', image: 'https://picsum.photos/seed/pg4/400/600', category: 'স্লট', bgColor: 'from-pink-500 to-purple-700' },
  { id: 'pg_5', name: 'Wild Bandito', provider: 'PG', image: 'https://picsum.photos/seed/pg5/400/600', category: 'স্লট', bgColor: 'from-purple-600 to-purple-900' },
  { id: 'pg_6', name: 'Dreams of Macau', provider: 'PG', image: 'https://picsum.photos/seed/pg6/400/600', category: 'স্লট', bgColor: 'from-blue-500 to-blue-800' },
  { id: 'pg_7', name: 'Caishen Wins', provider: 'PG', image: 'https://picsum.photos/seed/pg7/400/600', category: 'স্লট', bgColor: 'from-red-400 to-red-700' },
  { id: 'pg_8', name: 'Egypts Book', provider: 'PG', image: 'https://picsum.photos/seed/pg8/400/600', category: 'স্লট', bgColor: 'from-yellow-600 to-yellow-900' },

  // JBD (8)
  { id: 'jbd_1', name: 'Open Sesame', provider: 'JBD', image: 'https://picsum.photos/seed/jbd1/400/600', category: 'স্লট', bgColor: 'from-purple-500 to-purple-800' },
  { id: 'jbd_2', name: 'Super Niubi', provider: 'JBD', image: 'https://picsum.photos/seed/jbd2/400/600', category: 'স্লট', bgColor: 'from-red-500 to-red-800' },
  { id: 'jbd_3', name: 'Fortune Treasure', provider: 'JBD', image: 'https://picsum.photos/seed/jbd3/400/600', category: 'স্লট', bgColor: 'from-yellow-500 to-yellow-800' },
  { id: 'jbd_4', name: 'Golden Toad', provider: 'JBD', image: 'https://picsum.photos/seed/jbd4/400/600', category: 'স্লট', bgColor: 'from-green-500 to-green-800' },
  { id: 'jbd_5', name: 'Lucky Lion', provider: 'JBD', image: 'https://picsum.photos/seed/jbd5/400/600', category: 'স্লট', bgColor: 'from-red-600 to-red-900' },
  { id: 'jbd_6', name: 'Dragon Ball', provider: 'JBD', image: 'https://picsum.photos/seed/jbd6/400/600', category: 'স্লট', bgColor: 'from-orange-500 to-orange-800' },
  { id: 'jbd_7', name: 'Wealth God', provider: 'JBD', image: 'https://picsum.photos/seed/jbd7/400/600', category: 'স্লট', bgColor: 'from-yellow-600 to-yellow-900' },
  { id: 'jbd_8', name: 'Prosperity', provider: 'JBD', image: 'https://picsum.photos/seed/jbd8/400/600', category: 'স্লট', bgColor: 'from-blue-500 to-blue-800' },

  // SPRIBE (8)
  { id: '5', name: 'Aviator', provider: 'SPRIBE', image: 'https://picsum.photos/seed/spribe1/400/600', category: 'ক্র্যাশ', isHot: true, isVIP: true, bgColor: 'from-gray-800 to-red-900' },
  { id: 'spribe_2', name: 'Mines', provider: 'SPRIBE', image: 'https://picsum.photos/seed/spribe2/400/600', category: 'মিনি গেম', bgColor: 'from-blue-600 to-blue-900' },
  { id: 'spribe_3', name: 'Dice', provider: 'SPRIBE', image: 'https://picsum.photos/seed/spribe3/400/600', category: 'মিনি গেম', bgColor: 'from-purple-500 to-purple-800' },
  { id: 'spribe_4', name: 'Mini Roulette', provider: 'SPRIBE', image: 'https://picsum.photos/seed/spribe4/400/600', category: 'মিনি গেম', bgColor: 'from-green-600 to-green-900' },
  { id: 'spribe_5', name: 'HiLo', provider: 'SPRIBE', image: 'https://picsum.photos/seed/spribe5/400/600', category: 'মিনি গেম', bgColor: 'from-red-500 to-red-800' },
  { id: 'spribe_6', name: 'Plinko', provider: 'SPRIBE', image: 'https://picsum.photos/seed/spribe6/400/600', category: 'মিনি গেম', bgColor: 'from-pink-500 to-pink-800' },
  { id: 'spribe_7', name: 'Goal', provider: 'SPRIBE', image: 'https://picsum.photos/seed/spribe7/400/600', category: 'মিনি গেম', bgColor: 'from-green-500 to-green-800' },
  { id: 'spribe_8', name: 'Keno', provider: 'SPRIBE', image: 'https://picsum.photos/seed/spribe8/400/600', category: 'মিনি গেম', bgColor: 'from-yellow-600 to-yellow-900' },

  // BT GAME (8)
  { id: 'bt_1', name: 'BT Slot 1', provider: 'BT GAME', image: 'https://picsum.photos/seed/bt1/400/600', category: 'স্লট', bgColor: 'from-gray-700 to-gray-900' },
  { id: 'bt_2', name: 'BT Slot 2', provider: 'BT GAME', image: 'https://picsum.photos/seed/bt2/400/600', category: 'স্লট', bgColor: 'from-blue-700 to-blue-900' },
  { id: 'bt_3', name: 'BT Slot 3', provider: 'BT GAME', image: 'https://picsum.photos/seed/bt3/400/600', category: 'স্লট', bgColor: 'from-red-700 to-red-900' },
  { id: 'bt_4', name: 'BT Slot 4', provider: 'BT GAME', image: 'https://picsum.photos/seed/bt4/400/600', category: 'স্লট', bgColor: 'from-green-700 to-green-900' },
  { id: 'bt_5', name: 'BT Slot 5', provider: 'BT GAME', image: 'https://picsum.photos/seed/bt5/400/600', category: 'স্লট', bgColor: 'from-purple-700 to-purple-900' },
  { id: 'bt_6', name: 'BT Slot 6', provider: 'BT GAME', image: 'https://picsum.photos/seed/bt6/400/600', category: 'স্লট', bgColor: 'from-yellow-700 to-yellow-900' },
  { id: 'bt_7', name: 'BT Slot 7', provider: 'BT GAME', image: 'https://picsum.photos/seed/bt7/400/600', category: 'স্লট', bgColor: 'from-pink-700 to-pink-900' },
  { id: 'bt_8', name: 'BT Slot 8', provider: 'BT GAME', image: 'https://picsum.photos/seed/bt8/400/600', category: 'স্লট', bgColor: 'from-indigo-700 to-indigo-900' },
];

const PROVIDERS = [
  { id: 'ALL', name: 'ALL', logo: 'https://placehold.co/100x40/111827/ffffff?text=ALL' },
  { id: 'JILI', name: 'JILI', logo: 'https://placehold.co/100x40/1e3a8a/ffffff?text=JILI' },
  { id: 'PG', name: 'PG', logo: 'https://placehold.co/100x40/ea580c/ffffff?text=PG' },
  { id: 'JBD', name: 'JBD', logo: 'https://placehold.co/100x40/047857/ffffff?text=JBD' },
  { id: 'SPRIBE', name: 'SPRIBE', logo: 'https://placehold.co/100x40/b91c1c/ffffff?text=SPRIBE' },
  { id: 'BT GAME', name: 'BT GAME', logo: 'https://placehold.co/100x40/4338ca/ffffff?text=BT+GAME' },
];

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
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const displayImage = globalLogo || game.image || `https://picsum.photos/seed/${game.id}/400/600`;
  const displayName = globalName || game.name;
  const displayOption = globalOption || game.provider;
  const displayUrl = globalUrl || '#';

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onLogoChange) {
      const reader = new FileReader();
      reader.onerror = () => {
        if (showToast) showToast("ছবিটি পড়তে সমস্যা হয়েছে।", "error");
      };
      reader.onloadend = () => {
        onLogoChange(game.id, reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const isAviator = game.provider === 'CRASH' && game.id === '5';

  return (
    <div 
      onClick={() => onSelect(game)}
      className={`rounded-xl overflow-hidden relative aspect-square bg-gradient-to-b ${game.bgColor || 'from-gray-800 to-gray-900'} shadow-md group cursor-pointer border border-white/10 transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_20px_30px_rgba(0,0,0,0.5),0_0_15px_rgba(255,255,255,0.1)] hover:border-white/30 active:scale-95`}
    >
      {/* Skeleton Loader */}
      {!imageLoaded && !imageError && (
        <div className="absolute inset-0 z-10">
          <Skeleton className="w-full h-full" />
        </div>
      )}
      
      <img
        src={displayImage}
        loading="lazy"
        onLoad={() => setImageLoaded(true)}
        onError={() => setImageError(true)}
        className={`w-full h-full object-cover transition-all duration-700 ${imageLoaded ? 'opacity-90 group-hover:opacity-100 group-hover:scale-110' : 'opacity-0'}`}
        alt={game.name}
        referrerPolicy="no-referrer"
      />
      
      {/* Fallback for error */}
      {imageError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 to-teal-950 text-teal-500 p-4 text-center">
          <div className="w-12 h-12 rounded-full bg-teal-900/50 flex items-center justify-center mb-2">
            <Info size={24} />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest">Preview Unavailable</span>
        </div>
      )}

      {game.isHot && (
        <div className="absolute top-1.5 left-1.5 bg-gradient-to-r from-red-600 to-orange-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded italic shadow-sm z-30">
          HOT
        </div>
      )}
      {game.isVIP && (
        <div className="absolute top-1.5 left-1.5 bg-gradient-to-r from-yellow-400 via-yellow-200 to-yellow-500 text-black text-[9px] font-black px-1.5 py-0.5 rounded italic shadow-[0_0_10px_rgba(234,179,8,0.5)] z-30 border border-yellow-600 animate-pulse">
          VIP
        </div>
      )}
      {isAviator && !game.isVIP && (
        <div className="absolute top-1.5 left-1.5 bg-gradient-to-r from-yellow-400 via-yellow-200 to-yellow-500 text-black text-[9px] font-black px-1.5 py-0.5 rounded italic shadow-[0_0_10px_rgba(234,179,8,0.5)] z-30 border border-yellow-600 animate-pulse">
          VIP
        </div>
      )}
      <div 
        onClick={(e) => onToggleFavorite(e, game.id)}
        className="absolute top-1.5 right-1.5 bg-black/40 rounded-full p-1.5 backdrop-blur-sm z-30 group-hover:bg-black/60 transition-all hover:scale-110 active:scale-90"
      >
        <Star size={14} className={isFavorite ? "text-yellow-400 fill-yellow-400" : "text-gray-300"} />
      </div>
      
      {/* Change Logo Button */}
      {isAdmin && onLogoChange && (
        <div 
          onClick={(e) => {
            e.stopPropagation();
            fileInputRef.current?.click();
          }}
          className="absolute bottom-12 left-1.5 bg-yellow-500 rounded-full p-2 shadow-lg z-30 hover:scale-110 active:scale-90 transition-all border border-yellow-300"
          title="গেম লোগো পরিবর্তন করুন"
        >
          <Camera size={16} className="text-black" />
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            className="hidden" 
            accept="image/*" 
          />
        </div>
      )}

      {isAviator && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="relative group-hover:scale-125 transition-transform duration-500">
            <svg 
              viewBox="0 0 120 80" 
              className="w-20 h-16 drop-shadow-[0_0_15px_rgba(239,68,68,0.8)] animate-[fly-card_3s_linear_infinite]"
            >
              <defs>
                <linearGradient id="planeBodyGradCard" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#ff4d4d" />
                  <stop offset="100%" stopColor="#990000" />
                </linearGradient>
                <linearGradient id="wingGradCard" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#ff6666" />
                  <stop offset="100%" stopColor="#cc0000" />
                </linearGradient>
              </defs>
              
              {/* Main Body */}
              <path d="M10,40 Q30,35 60,35 L100,38 L110,40 L100,42 L60,45 Q30,45 10,40 Z" fill="url(#planeBodyGradCard)" stroke="#fff" strokeWidth="1.5" />
              {/* Cockpit */}
              <path d="M45,35 Q55,25 75,35 Z" fill="#87ceeb" stroke="#fff" strokeWidth="1" opacity="0.9" />
              {/* Main Wing */}
              <path d="M40,40 L20,65 L50,65 L70,40 Z" fill="url(#wingGradCard)" stroke="#fff" strokeWidth="1.5" />
              {/* Tail Wing */}
              <path d="M15,40 L5,25 L25,25 L30,40 Z" fill="url(#wingGradCard)" stroke="#fff" strokeWidth="1.5" />
              {/* Propeller Hub */}
              <circle cx="110" cy="40" r="3" fill="#333" stroke="#fff" strokeWidth="1" />
            </svg>
            <div className="absolute -top-1 -right-1 bg-red-600 text-white text-[7px] font-bold px-1 rounded-sm animate-pulse">REAL</div>
            <div className="absolute -bottom-1 -left-1 bg-yellow-500 text-black text-[7px] font-black px-1 rounded-sm border border-yellow-600">VIP</div>
          </div>
        </div>
      )}
      {/* Change Name/Details Button */}
      {isAdmin && (
        <div 
          onClick={(e) => {
            e.stopPropagation();
            setEditingGame({
              gameId: game.id,
              name: displayName,
              logo: displayImage,
              url: displayUrl,
              option: displayOption
            });
          }}
          className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/95 via-black/80 to-transparent pt-8 pb-2 px-1 flex items-center justify-center gap-1 z-20 group/name cursor-pointer"
        >
          <span className="text-[10px] font-bold text-white drop-shadow-md group-hover:text-yellow-400 transition-colors truncate max-w-[80%] uppercase tracking-tighter">
            {displayName}
          </span>
          <div className="bg-yellow-500/20 p-1 rounded transition-all hover:bg-yellow-500/40">
            <Edit2 size={10} className="text-yellow-400" />
          </div>
        </div>
      )}
      {!isAdmin && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/95 via-black/80 to-transparent pt-8 pb-2 px-1 flex items-center justify-center z-20">
          <span className="text-[10px] font-bold text-white drop-shadow-md truncate max-w-[90%] uppercase tracking-tighter">
            {displayName}
          </span>
        </div>
      )}
      {/* Hover Glow Effect */}
      <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/0 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
    </div>
  );
};

interface GameGridProps {
  category: string;
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

  const isLoading = externalLoading !== undefined ? externalLoading : internalLoading;

  useEffect(() => {
    setInternalLoading(true);
    const timer = setTimeout(() => {
      setInternalLoading(false);
    }, 600);
    return () => clearTimeout(timer);
  }, [category, selectedProvider]);

  const toggleFavorite = (e: React.MouseEvent, gameId: string) => {
    e.stopPropagation();
    onToggleFavorite(gameId);
  };

  const filteredGames = games.filter(game => {
    const isFav = favorites.includes(game.id);
    const matchesProvider = selectedProvider === 'ALL' || game.provider === selectedProvider;
    
    const matchesCategory = 
      selectedProvider !== 'ALL' || // Ignore category filter if a specific provider is selected
      category === 'সব' || 
      game.category === category || 
      (category === 'সেরা' && game.isHot) ||
      (category === 'পছন্দ' && isFav);
    
    const matchesSearch = game.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          game.provider.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch && matchesProvider;
  });

  return (
    <div className="flex flex-col gap-4">
      {/* Provider Filter */}
      <div className="flex overflow-x-auto gap-3 pb-2 no-scrollbar">
        {PROVIDERS.map(provider => {
          const isAll = provider.id === 'ALL';
          const displayName = isAll ? (allButtonName || 'ALL') : provider.name;
          const displayLogo = isAll ? `https://placehold.co/100x40/111827/ffffff?text=${encodeURIComponent(displayName)}` : provider.logo;

          return (
            <div key={provider.id} className="relative group shrink-0">
              <button
                onClick={() => setSelectedProvider(selectedProvider === provider.id ? 'ALL' : provider.id)}
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
      </div>

      <div className="grid grid-cols-3 gap-2">
        {isLoading ? (
          [...Array(9)].map((_, i) => (
            <div key={i} className="aspect-square rounded-xl bg-gradient-to-b from-teal-900/40 to-teal-950/60 overflow-hidden relative border border-white/5 shadow-sm">
              <Skeleton className="w-full h-full rounded-none opacity-50" />
              
              {/* Top Right Star Skeleton */}
              <div className="absolute top-1.5 right-1.5 bg-black/20 rounded-full p-1.5 w-6 h-6">
                <Skeleton className="w-full h-full rounded-full" shimmer={false} />
              </div>

              {/* Bottom Gradient Overlay */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent pt-8 pb-2 px-2 flex flex-col justify-end items-center gap-1">
                <Skeleton className="h-2.5 w-3/4" />
                <Skeleton className="h-2 w-1/2 opacity-60" />
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
          <div className="col-span-3 py-10 text-center text-teal-300">
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
                <input 
                  type="text"
                  value={editingGame.logo}
                  onChange={(e) => setEditingGame({ ...editingGame, logo: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-yellow-500 transition-all font-mono text-xs"
                />
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

const style = `
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
