import React, { useState, useEffect } from 'react';
import { Star, Plane as PlaneIcon } from 'lucide-react';
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
    name: 'পাইলট',
    provider: 'SPRIBE',
    image: GAME_IMAGES.AVIATOR,
    category: 'সেরা',
    isHot: true,
    bgColor: 'from-gray-800 to-red-900',
    providerColor: 'text-white'
  },
  {
    id: '2',
    name: 'সুপার এস',
    provider: 'JILI',
    image: GAME_IMAGES.SUPER_ACE,
    category: 'সেরা',
    isHot: true,
    bgColor: 'from-yellow-600 to-green-600',
    providerColor: 'text-yellow-300'
  },
  {
    id: '3',
    name: 'সুপার এস দ্বিতীয়',
    provider: 'JILI',
    image: GAME_IMAGES.SUPER_ACE_2,
    category: 'সেরা',
    isHot: true,
    bgColor: 'from-orange-600 to-red-700',
    providerColor: 'text-yellow-300'
  },
  {
    id: '5',
    name: 'WG Plane',
    provider: 'WG',
    image: GAME_IMAGES.WG_PLANE,
    category: 'সেরা',
    isHot: true,
    bgColor: 'from-gray-800 to-gray-900',
    providerColor: 'text-green-400'
  },
  {
    id: '6',
    name: 'চিকেন রোড',
    provider: 'IN',
    image: GAME_IMAGES.CHICKEN_ROAD,
    category: 'সেরা',
    isHot: true,
    bgColor: 'from-orange-400 to-yellow-600',
    providerColor: 'text-white'
  },
  {
    id: '11',
    name: 'ক্রেজি টাইম',
    provider: 'EVO',
    image: GAME_IMAGES.CRAZY_TIME,
    category: 'সেরা',
    isHot: true,
    bgColor: 'from-red-600 to-purple-900',
    providerColor: 'text-white'
  },
  {
    id: '14',
    name: 'PG Game',
    provider: 'PG',
    image: 'https://images.unsplash.com/photo-1596838132731-3301c3fd4317?q=80&w=1000&auto=format&fit=crop',
    category: 'সেরা',
    isHot: true,
    bgColor: 'from-orange-500 to-red-600',
    providerColor: 'text-yellow-200'
  },
  {
    id: '4',
    name: 'ম্যাজিক এস',
    provider: 'JILI',
    image: GAME_IMAGES.MAGIC_ACE,
    category: 'স্লট',
    bgColor: 'from-purple-900 to-blue-900',
    providerColor: 'text-white'
  },
  {
    id: '7',
    name: 'লাইভ রুলেট',
    provider: 'EVO',
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
  }
];

interface GameCardProps {
  game: Game;
  isFavorite: boolean;
  onSelect: (game: Game) => void;
  onToggleFavorite: (e: React.MouseEvent, gameId: string) => void;
}

const GameCard: React.FC<GameCardProps> = ({ game, isFavorite, onSelect, onToggleFavorite }) => {
  const isAviator = game.provider === 'SPRIBE' && game.id === '1';

  return (
    <div 
      onClick={() => onSelect(game)}
      className={`rounded-xl overflow-hidden relative aspect-[3/4] bg-gradient-to-b ${game.bgColor || 'from-gray-800 to-gray-900'} shadow-md group cursor-pointer border border-white/10 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_10px_20px_rgba(0,0,0,0.4)] hover:border-white/30`}
    >
      <img
        src={game.image}
        className="w-full h-full object-cover opacity-80 group-hover:scale-110 group-hover:opacity-100 transition-all duration-500"
        alt={game.name}
        referrerPolicy="no-referrer"
      />
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
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-20">
          <div className="relative group-hover:scale-125 transition-transform duration-500">
            <svg 
              viewBox="0 0 100 100" 
              className="w-16 h-16 drop-shadow-[0_0_15px_rgba(239,68,68,0.8)] animate-[fly-card_3s_linear_infinite]"
            >
              <defs>
                <linearGradient id="planeGradCard" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#ef4444" />
                  <stop offset="100%" stopColor="#991b1b" />
                </linearGradient>
              </defs>
              <path 
                d="M15,50 L45,45 L85,25 L90,30 L55,50 L90,70 L85,75 L45,55 Z" 
                fill="url(#planeGradCard)" 
                stroke="white" 
                strokeWidth="2"
              />
              <circle cx="15" cy="50" r="4" fill="#fca5a5" />
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
}

export const GameGrid: React.FC<GameGridProps> = ({ category, searchQuery = "", onGameSelect }) => {
  const [favorites, setFavorites] = useState<string[]>(() => {
    const saved = localStorage.getItem('favoriteGames');
    return saved ? JSON.parse(saved) : ['2', '5', '11']; // Default favorites
  });

  useEffect(() => {
    localStorage.setItem('favoriteGames', JSON.stringify(favorites));
  }, [favorites]);

  const toggleFavorite = (e: React.MouseEvent, gameId: string) => {
    e.stopPropagation();
    setFavorites(prev => 
      prev.includes(gameId) 
        ? prev.filter(id => id !== gameId) 
        : [...prev, gameId]
    );
  };

  const filteredGames = games.filter(game => {
    const isFav = favorites.includes(game.id);
    const matchesCategory = 
      category === 'সব' || 
      game.category === category || 
      (category === 'সেরা' && game.isHot) ||
      (category === 'পছন্দ' && isFav);
    
    const matchesSearch = game.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          game.provider.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="grid grid-cols-3 gap-2">
      {filteredGames.length > 0 ? (
        filteredGames.map(game => (
          <GameCard 
            key={game.id} 
            game={game} 
            isFavorite={favorites.includes(game.id)}
            onSelect={onGameSelect} 
            onToggleFavorite={toggleFavorite}
          />
        ))
      ) : (
        <div className="col-span-3 py-10 text-center text-teal-300">
          {category === 'পছন্দ' ? 'আপনার কোনো পছন্দের গেম নেই' : 'কোনো গেম পাওয়া যায়নি'}
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
