import React, { useState, useEffect } from 'react';
import { Star, Plane as PlaneIcon, Info } from 'lucide-react';
import { GAME_IMAGES } from '../constants/gameAssets';

export interface Game {
  id: string;
  name: string;
  provider: string;
  image: string;
  category: string;
  isHot?: boolean;
  isFavorite?: boolean;
  bgColor?: string;
  providerColor?: string;
}

export const games: Game[] = [
  {
    id: '1',
    name: 'ক্র্যাশ গেম',
    provider: 'CRASH',
    image: GAME_IMAGES.CRASH_GAME,
    category: 'সেরা',
    isHot: true,
    bgColor: 'from-gray-800 to-red-900',
    providerColor: 'text-white'
  },
  {
    id: '2',
    name: 'ম্যাজিক কার্ড',
    provider: 'SLOT',
    image: GAME_IMAGES.SUPER_ACE,
    category: 'সেরা',
    isHot: true,
    bgColor: 'from-yellow-600 to-green-600',
    providerColor: 'text-yellow-300'
  },
  {
    id: '3',
    name: 'ম্যাজিক কার্ড ২',
    provider: 'SLOT',
    image: GAME_IMAGES.SUPER_ACE_2,
    category: 'সেরা',
    isHot: true,
    bgColor: 'from-orange-600 to-red-700',
    providerColor: 'text-yellow-300'
  },
  {
    id: '5',
    name: 'রকেট ফ্লাই',
    provider: 'CRASH',
    image: GAME_IMAGES.WG_PLANE,
    category: 'সেরা',
    isHot: true,
    bgColor: 'from-gray-800 to-gray-900',
    providerColor: 'text-green-400'
  },
  {
    id: '6',
    name: 'অ্যানিমেল রান',
    provider: 'ARCADE',
    image: GAME_IMAGES.CHICKEN_ROAD,
    category: 'সেরা',
    isHot: true,
    bgColor: 'from-orange-400 to-yellow-600',
    providerColor: 'text-white'
  },
  {
    id: '11',
    name: 'স্পিন হুইল',
    provider: 'LIVE',
    image: GAME_IMAGES.CRAZY_TIME,
    category: 'সেরা',
    isHot: true,
    bgColor: 'from-red-600 to-purple-900',
    providerColor: 'text-white'
  },
  {
    id: '14',
    name: 'ফ্রুট স্লট',
    provider: 'SPIN',
    image: 'https://images.unsplash.com/photo-1596838132731-3301c3fd4317?q=80&w=1000&auto=format&fit=crop',
    category: 'সেরা',
    isHot: true,
    bgColor: 'from-orange-500 to-red-600',
    providerColor: 'text-yellow-200'
  },
  {
    id: '4',
    name: 'লাকি কার্ড',
    provider: 'SLOT',
    image: GAME_IMAGES.MAGIC_ACE,
    category: 'স্লট',
    bgColor: 'from-purple-900 to-blue-900',
    providerColor: 'text-white'
  },
  {
    id: '7',
    name: 'লাইভ রুলেট',
    provider: 'LIVE',
    image: GAME_IMAGES.ROULETTE,
    category: 'লাইভ',
    bgColor: 'from-green-800 to-black',
    providerColor: 'text-red-500'
  },
  {
    id: '8',
    name: 'ড্রাগন টাইগার',
    provider: 'KING',
    image: GAME_IMAGES.DRAGON_TIGER,
    category: 'তাস',
    bgColor: 'from-red-800 to-yellow-900',
    providerColor: 'text-yellow-400'
  },
  {
    id: '9',
    name: 'ফিশিং হান্টার',
    provider: 'JILI',
    image: GAME_IMAGES.FISH_HUNTER,
    category: 'ফিশিং',
    bgColor: 'from-blue-600 to-teal-900',
    providerColor: 'text-blue-200'
  },
  {
    id: '10',
    name: 'বুক অফ গোল্ড',
    provider: 'PLSY',
    image: GAME_IMAGES.BOOK_OF_GOLD,
    category: 'স্লট',
    bgColor: 'from-yellow-700 to-yellow-900',
    providerColor: 'text-yellow-400'
  },
  {
    id: '12',
    name: 'মেগা বল',
    provider: 'EVO',
    image: GAME_IMAGES.MEGA_BALL,
    category: 'লটারি',
    bgColor: 'from-blue-500 to-blue-800',
    providerColor: 'text-white'
  },
  {
    id: '13',
    name: 'সিক বো',
    provider: 'KING',
    image: GAME_IMAGES.SIC_BO,
    category: 'তাস',
    bgColor: 'from-red-900 to-black',
    providerColor: 'text-white'
  },
  {
    id: '3a6096455a8aad592c23da2ad11452d8',
    name: 'Kong Invasion',
    provider: 'Ace (AgGaming)',
    image: GAME_IMAGES.KONG_INVASION,
    category: 'সেরা',
    isHot: true,
    bgColor: 'from-green-900 to-black',
    providerColor: 'text-yellow-400'
  },
  {
    id: '8404a0b2d74ae068a04e47a0614910d8',
    name: '9game Game Lobby',
    provider: '9game',
    image: 'https://images.unsplash.com/photo-1518133910546-b6c2fb7d79e3?auto=format&fit=crop&q=80&w=800',
    category: 'সেরা',
    bgColor: 'from-blue-900 to-black',
    providerColor: 'text-blue-400'
  },
  {
    id: '128647a7b008f2a60e2399410ded27f1',
    name: 'Lobby Marble Rush Lobby',
    provider: '9game',
    image: 'https://images.unsplash.com/photo-1596838132731-3301c3fd4317?auto=format&fit=crop&q=80&w=800',
    category: 'সেরা',
    bgColor: 'from-green-900 to-black',
    providerColor: 'text-green-400'
  },
  {
    id: '253130d684c063f74401e4ef77151f92',
    name: 'Lobby Marble - Legendary Circuit',
    provider: '9game',
    image: 'https://images.unsplash.com/photo-1606167668584-78701c57f13d?auto=format&fit=crop&q=80&w=800',
    category: 'সেরা',
    bgColor: 'from-yellow-900 to-black',
    providerColor: 'text-yellow-400'
  },
  {
    id: '52191bf0fbb916f6e9f897b6a53a0bf0',
    name: 'Marble - Extreme',
    provider: '9game',
    image: 'https://images.unsplash.com/photo-1559627814-4d0c75748d2b?auto=format&fit=crop&q=80&w=800',
    category: 'সেরা',
    bgColor: 'from-red-900 to-black',
    providerColor: 'text-red-400'
  },
  {
    id: '6f182636dc75754c60983390ebf2efd9',
    name: 'Crazy Ball Lobby',
    provider: '9game',
    image: 'https://images.unsplash.com/photo-1516733725897-1aa73b87c8e8?auto=format&fit=crop&q=80&w=800',
    category: 'সেরা',
    bgColor: 'from-purple-900 to-black',
    providerColor: 'text-purple-400'
  },
  {
    id: 'fa606a46442f4b263bb309e6791728ab',
    name: 'Lobby Crazy Ball - Legendray',
    provider: '9game',
    image: 'https://images.unsplash.com/photo-1518133910546-b6c2fb7d79e3?auto=format&fit=crop&q=80&w=800',
    category: 'সেরা',
    bgColor: 'from-pink-900 to-black',
    providerColor: 'text-pink-400'
  },
  {
    id: '9921be5d4dd5becee73b106cb285901a',
    name: 'Crazy Ball - Turbo',
    provider: '9game',
    image: 'https://images.unsplash.com/photo-1511193311914-0346f16efe90?auto=format&fit=crop&q=80&w=800',
    category: 'সেরা',
    bgColor: 'from-orange-900 to-black',
    providerColor: 'text-orange-400'
  },
  {
    id: '3eacf3adbff9a5e4f5fbf40fd40ffcb3',
    name: 'Crazy Ball - Lightning',
    provider: '9game',
    image: 'https://images.unsplash.com/photo-1606167668584-78701c57f13d?auto=format&fit=crop&q=80&w=800',
    category: 'সেরা',
    bgColor: 'from-yellow-600 to-black',
    providerColor: 'text-yellow-300'
  },
  {
    id: '7a8a6226e76eeee09909a39f91f299d9',
    name: 'Plinko Lobby',
    provider: '9game',
    image: 'https://images.unsplash.com/photo-1518133835878-5a93cc3f89e5?auto=format&fit=crop&q=80&w=800',
    category: 'সেরা',
    bgColor: 'from-teal-900 to-black',
    providerColor: 'text-teal-400'
  },
  {
    id: 'ef88c31bd1673be60a6bf2d89c5c910c',
    name: 'Lobby Plinko Go',
    provider: '9game',
    image: 'https://images.unsplash.com/photo-1518133910546-b6c2fb7d79e3?auto=format&fit=crop&q=80&w=800',
    category: 'সেরা',
    bgColor: 'from-indigo-900 to-black',
    providerColor: 'text-indigo-400'
  },
  {
    id: '1f581eadeeb24826ca35f0b0d26bb87c',
    name: 'Plinko PLUS',
    provider: '9game',
    image: 'https://images.unsplash.com/photo-1511193311914-0346f16efe90?auto=format&fit=crop&q=80&w=800',
    category: 'সেরা',
    bgColor: 'from-blue-700 to-black',
    providerColor: 'text-blue-300'
  },
  {
    id: 'b697605ec7dd691f307555f5cdba2919',
    name: 'Super Plinko',
    provider: '9game',
    image: 'https://images.unsplash.com/photo-1596838132731-3301c3fd4317?auto=format&fit=crop&q=80&w=800',
    category: 'সেরা',
    bgColor: 'from-green-700 to-black',
    providerColor: 'text-green-300'
  },
  {
    id: 'd23a5345630fb01ff86a6c13a1d1dbeb',
    name: 'Play Girl Lobby',
    provider: '9game',
    image: 'https://images.unsplash.com/photo-1518133835878-5a93cc3f89e5?auto=format&fit=crop&q=80&w=800',
    category: 'সেরা',
    bgColor: 'from-pink-700 to-black',
    providerColor: 'text-pink-300'
  },
  {
    id: 'dc5ed247d813915c1f2305c64c0306b7',
    name: 'Lobby Play Girl',
    provider: '9game',
    image: 'https://images.unsplash.com/photo-1511193311914-0346f16efe90?auto=format&fit=crop&q=80&w=800',
    category: 'সেরা',
    bgColor: 'from-red-700 to-black',
    providerColor: 'text-red-300'
  },
  {
    id: '2d4a275e35692af9e9fa86340484d966',
    name: 'Marble - Lightning',
    provider: '9game',
    image: 'https://images.unsplash.com/photo-1606167668584-78701c57f13d?auto=format&fit=crop&q=80&w=800',
    category: 'সেরা',
    bgColor: 'from-yellow-700 to-black',
    providerColor: 'text-yellow-300'
  },
  {
    id: 'pp1',
    name: 'সুইট বোনানজা',
    provider: 'PP',
    image: 'https://images.unsplash.com/photo-1611996575749-79a3a250f563?auto=format&fit=crop&q=80&w=800',
    category: 'স্লট',
    isHot: true,
    bgColor: 'from-pink-500 to-purple-600',
    providerColor: 'text-pink-200'
  },
  {
    id: 'png1',
    name: 'বুক অফ ডেড',
    provider: 'PNG',
    image: 'https://images.unsplash.com/photo-1533241214477-fe178c187552?auto=format&fit=crop&q=80&w=800',
    category: 'স্লট',
    bgColor: 'from-yellow-700 to-red-800',
    providerColor: 'text-yellow-400'
  },
  {
    id: 'net1',
    name: 'স্টারবার্স্ট',
    provider: 'NET',
    image: 'https://images.unsplash.com/photo-1518133835878-5a93cc3f89e5?auto=format&fit=crop&q=80&w=800',
    category: 'স্লট',
    bgColor: 'from-purple-800 to-blue-900',
    providerColor: 'text-purple-300'
  },
  {
    id: 'mg1',
    name: 'মেগা মুলাহ',
    provider: 'MG',
    image: 'https://images.unsplash.com/photo-1596838132731-3301c3fd4317?auto=format&fit=crop&q=80&w=800',
    category: 'স্লট',
    bgColor: 'from-orange-600 to-yellow-600',
    providerColor: 'text-orange-200'
  },
  {
    id: 'evo2',
    name: 'মনোপলি লাইভ',
    provider: 'EVO',
    image: 'https://images.unsplash.com/photo-1606167668584-78701c57f13d?auto=format&fit=crop&q=80&w=800',
    category: 'লাইভ',
    isHot: true,
    bgColor: 'from-green-600 to-teal-800',
    providerColor: 'text-green-200'
  }
];

const PROVIDERS = [
  { id: 'ALL', name: 'সব', logo: 'https://placehold.co/100x40/111827/ffffff?text=ALL' },
  { id: 'SPRIBE', name: 'Spribe', logo: 'https://placehold.co/100x40/b91c1c/ffffff?text=SPRIBE' },
  { id: 'JILI', name: 'JILI', logo: 'https://placehold.co/100x40/1e3a8a/ffffff?text=JILI' },
  { id: 'EVO', name: 'Evolution', logo: 'https://placehold.co/100x40/831843/ffffff?text=EVO' },
  { id: 'PG', name: 'PG Soft', logo: 'https://placehold.co/100x40/ea580c/ffffff?text=PG' },
  { id: 'PP', name: 'Pragmatic', logo: 'https://placehold.co/100x40/0f766e/ffffff?text=PP' },
  { id: 'PNG', name: "Play'n GO", logo: 'https://placehold.co/100x40/4338ca/ffffff?text=PNG' },
  { id: 'NET', name: 'NetEnt', logo: 'https://placehold.co/100x40/047857/ffffff?text=NET' },
  { id: 'MG', name: 'Microgaming', logo: 'https://placehold.co/100x40/b45309/ffffff?text=MG' },
  { id: '9game', name: '9game', logo: 'https://placehold.co/100x40/be185d/ffffff?text=9game' },
];

interface GameCardProps {
  game: Game;
  isFavorite: boolean;
  onSelect: (game: Game) => void;
  onToggleFavorite: (e: React.MouseEvent, gameId: string) => void;
  onShowDetails: (e: React.MouseEvent, game: Game) => void;
}

const GameCard: React.FC<GameCardProps> = ({ game, isFavorite, onSelect, onToggleFavorite, onShowDetails }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const isAviator = game.provider === 'SPRIBE' && game.id === '1';

  return (
    <div 
      onClick={() => onSelect(game)}
      className={`rounded-xl overflow-hidden relative aspect-[3/4] bg-gradient-to-b ${game.bgColor || 'from-gray-800 to-gray-900'} shadow-md group cursor-pointer border border-white/10 transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_20px_30px_rgba(0,0,0,0.5),0_0_15px_rgba(255,255,255,0.1)] hover:border-white/30`}
    >
      {/* Skeleton Loader */}
      {!imageLoaded && !imageError && (
        <div className="absolute inset-0 z-10 animate-pulse bg-gray-800">
          <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-800"></div>
        </div>
      )}
      
      <img
        src={game.image}
        loading="lazy"
        onLoad={() => setImageLoaded(true)}
        onError={() => setImageError(true)}
        className={`w-full h-full object-cover transition-all duration-700 ${imageLoaded ? 'opacity-90 group-hover:opacity-100 group-hover:scale-110' : 'opacity-0'}`}
        alt={game.name}
        referrerPolicy="no-referrer"
      />
      
      {/* Fallback for error */}
      {imageError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 text-gray-500 text-xs p-2 text-center">
          Image Unavailable
        </div>
      )}

      {game.isHot && (
        <div className="absolute top-1.5 left-1.5 bg-gradient-to-r from-red-600 to-orange-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded italic shadow-sm z-30">
          HOT
        </div>
      )}
      {isAviator && (
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
      
      {/* Info Button */}
      <div 
        onClick={(e) => onShowDetails(e, game)}
        className="absolute bottom-10 right-1.5 bg-black/40 rounded-full p-1.5 backdrop-blur-sm z-30 group-hover:bg-black/60 transition-all hover:scale-110 active:scale-90"
      >
        <Info size={14} className="text-white" />
      </div>

      <div className="absolute top-6 left-1/2 -translate-x-1/2 w-full text-center z-20">
        <span className={`${game.providerColor || 'text-white'} font-black italic text-sm tracking-wider drop-shadow-lg group-hover:scale-110 transition-transform inline-block`}>
          {game.provider}
        </span>
      </div>
      {game.id === '5' && (
        <div className="absolute inset-0 flex items-center justify-center">
          <PlaneIcon className="text-pink-600 w-16 h-16 drop-shadow-lg transform -rotate-12 group-hover:scale-125 transition-transform" />
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
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent pt-8 pb-2 px-1 text-center z-20">
        <span className="text-xs font-bold text-white drop-shadow-md group-hover:text-yellow-400 transition-colors">
          {game.name}
        </span>
      </div>
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
}

export const GameGrid: React.FC<GameGridProps> = ({ category, searchQuery = "", onGameSelect, favorites, onToggleFavorite }) => {
  const [selectedProvider, setSelectedProvider] = useState<string>('ALL');
  const [selectedGameForDetails, setSelectedGameForDetails] = useState<Game | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      setLoading(false);
    }, 600);
    return () => clearTimeout(timer);
  }, [category, selectedProvider]);

  const toggleFavorite = (e: React.MouseEvent, gameId: string) => {
    e.stopPropagation();
    onToggleFavorite(gameId);
  };

  const handleShowDetails = (e: React.MouseEvent, game: Game) => {
    e.stopPropagation();
    setSelectedGameForDetails(game);
  };

  const filteredGames = games.filter(game => {
    const isFav = favorites.includes(game.id);
    const matchesCategory = 
      category === 'সব' || 
      game.category === category || 
      (category === 'সেরা' && game.isHot) ||
      (category === 'পছন্দ' && isFav);
    
    const matchesProvider = selectedProvider === 'ALL' || game.provider === selectedProvider;
    
    const matchesSearch = game.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          game.provider.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch && matchesProvider;
  });

  return (
    <div className="flex flex-col gap-4">
      {/* Provider Filter */}
      <div className="flex overflow-x-auto gap-3 pb-2 no-scrollbar">
        {PROVIDERS.map(provider => (
          <button
            key={provider.id}
            onClick={() => setSelectedProvider(provider.id)}
            className={`shrink-0 rounded-lg overflow-hidden border-2 transition-all ${
              selectedProvider === provider.id 
                ? 'border-yellow-400 scale-105 shadow-[0_0_10px_rgba(250,204,21,0.5)]' 
                : 'border-transparent opacity-70 hover:opacity-100'
            }`}
          >
            <img src={provider.logo} alt={provider.name} className="h-8 object-cover" />
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-2">
        {loading ? (
          [...Array(9)].map((_, i) => (
            <div key={i} className="aspect-[3/4] rounded-xl bg-gray-800 animate-pulse shadow-md"></div>
          ))
        ) : filteredGames.length > 0 ? (
          filteredGames.map(game => (
            <GameCard 
              key={game.id} 
              game={game} 
              isFavorite={favorites.includes(game.id)}
              onSelect={onGameSelect} 
              onToggleFavorite={toggleFavorite}
              onShowDetails={handleShowDetails}
            />
          ))
        ) : (
          <div className="col-span-3 py-10 text-center text-teal-300">
            {category === 'পছন্দ' ? 'আপনার কোনো পছন্দের গেম নেই' : 'কোনো গেম পাওয়া যায়নি'}
          </div>
        )}
      </div>

      {/* Game Details Modal */}
      {selectedGameForDetails && (
        <div className="fixed inset-0 z-[110] bg-black/80 flex items-center justify-center p-4" onClick={() => setSelectedGameForDetails(null)}>
          <div className="bg-teal-900 rounded-2xl p-6 max-w-sm w-full border border-teal-700 shadow-2xl" onClick={e => e.stopPropagation()}>
            <h2 className="text-2xl font-bold text-white mb-2">{selectedGameForDetails.name}</h2>
            <p className="text-teal-300 text-sm mb-4">প্রোভাইডার: {selectedGameForDetails.provider}</p>
            <p className="text-white text-sm mb-6">এটি একটি চমৎকার গেম! এই গেমে আপনি অনেক মজা পাবেন এবং বড় জয়ের সুযোগ রয়েছে।</p>
            <button 
              onClick={() => setSelectedGameForDetails(null)}
              className="w-full bg-yellow-500 text-black font-bold py-2 rounded-lg hover:bg-yellow-400 transition-colors"
            >
              বন্ধ করুন
            </button>
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
