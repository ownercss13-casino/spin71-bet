import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '../services/firebase';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { Flame, Trophy, User, ArrowUpRight, ArrowDownLeft, TrendingUp, Zap, Clock, ShieldCheck, Ticket, RefreshCw } from 'lucide-react';
import LoadingSpinner from './ui/LoadingSpinner';

interface LiveBetsTickerProps {
  userData: any;
  onOpenLogin?: (mode?: 'login' | 'register') => void;
  showToast: (msg: string, type?: any) => void;
  globalLogos?: Record<string, string>;
  globalNames?: Record<string, string>;
}

interface BetItem {
  id: string | number;
  user: string;
  game: string;
  provider: string;
  betAmount: number;
  multiplier: number;
  winAmount: number;
  time: string;
  isSimulated?: boolean;
}

const POPULAR_GAMES = [
  { id: 'spribe_aviator', name: 'Aviator', provider: 'SPRIBE', logo: '🚀' },
  { id: 'jili_1', name: 'Super Ace', provider: 'JILI', logo: '🃏' },
  { id: 'jili_2', name: 'Golden Empire', provider: 'JILI', logo: '👑' },
  { id: 'jili_3', name: 'Fortune Gems', provider: 'JILI', logo: '💎' },
  { id: 'jili_5', name: 'Money Coming', provider: 'JILI', logo: '💰' },
  { id: 'pg_1', name: 'Mahjong Ways', provider: 'PG', logo: '🀄' },
  { id: 'pg_2', name: 'Mahjong Ways 2', provider: 'PG', logo: '🀄' },
  { id: 'pg_4', name: 'Lucky Neko', provider: 'PG', logo: '🐱' },
  { id: 'pg_3', name: 'Treasure of Aztec', provider: 'PG', logo: '🏰' },
  { id: 'evo_1', name: 'Crazy Time', provider: 'EVOLUTION', logo: '🎡' },
  { id: 'evo_2', name: 'Lightning Roulette', provider: 'EVOLUTION', logo: '⚡' },
  { id: 'evo_4', name: 'Baccarat', provider: 'EVOLUTION', logo: '♣️' },
  { id: 'fish_1', name: 'Mega Fishing', provider: 'JILI', logo: '🐟' },
  { id: 'lottery_8', name: 'Color Game', provider: 'JILI', logo: '🎨' },
];

const BANG_NAMES_PREFIX = ['sh', 'bo', 'ra', 'ma', 'fa', 'ta', 'al', 'sa', 'ro', 'md', 'me', 'ab', 'as', 'ti', 'ki', 'ni', 'jo', 'mo', 're'];
const BANG_NAMES_SUFFIX = ['77', '99', '01', '07', '12', '45', '88', '55', '33', '11', '00', '21', '89', '44', '04', '92', '82', '71', '10', '50'];

function generateSimulatedBet(): BetItem {
  const isWin = Math.random() > 0.45; // 55% win rate for display
  const prefix = BANG_NAMES_PREFIX[Math.floor(Math.random() * BANG_NAMES_PREFIX.length)];
  const suffix = BANG_NAMES_SUFFIX[Math.floor(Math.random() * BANG_NAMES_SUFFIX.length)];
  const obfuscatedUser = `${prefix}***${suffix}`;
  
  const game = POPULAR_GAMES[Math.floor(Math.random() * POPULAR_GAMES.length)];
  const betAmount = [20, 50, 100, 200, 500, 1000, 2000, 5000][Math.floor(Math.random() * 8)];
  
  let multiplier = 0;
  let winAmount = 0;
  
  if (isWin) {
    if (game.name === 'Aviator') {
      multiplier = parseFloat((Math.random() * 9.5 + 1.1).toFixed(2));
    } else {
      multiplier = parseFloat((Math.random() * 4.8 + 1.2).toFixed(2));
      // Ocassionally a massive multiplier
      if (Math.random() > 0.95) {
        multiplier = parseFloat((Math.random() * 50 + 10).toFixed(2));
      }
    }
    winAmount = Math.floor(betAmount * multiplier);
  }

  const date = new Date();
  const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  return {
    id: `sim_${Date.now()}_${Math.random()}`,
    user: obfuscatedUser,
    game: game.name,
    provider: game.provider,
    betAmount,
    multiplier,
    winAmount,
    time,
    isSimulated: true,
  };
}

export default function LiveBetsTicker({ userData, onOpenLogin, showToast, globalLogos, globalNames }: LiveBetsTickerProps) {
  const [activeTab, setActiveTab] = useState<'live' | 'high' | 'my'>('live');
  const [liveBets, setLiveBets] = useState<BetItem[]>([]);
  const [highRollers, setHighRollers] = useState<BetItem[]>([]);
  const [myBets, setMyBets] = useState<BetItem[]>([]);
  const [loadingMyBets, setLoadingMyBets] = useState(false);

  // Helper to get consistent game info
  const getGameInfo = (gameName: string) => {
    const gameId = POPULAR_GAMES.find(g => g.name === gameName)?.id;
    const displayName = (gameId && globalNames?.[gameId]) || gameName;
    const displayLogo = (gameId && globalLogos?.[gameId]) || null;
    return { id: gameId, name: displayName, logo: displayLogo };
  };

  // Initialize live bets slider
  useEffect(() => {
    // Generate initial 8 bets
    const initialBets = Array.from({ length: 8 }, () => generateSimulatedBet());
    setLiveBets(initialBets);

    // Filter big wins for High Rollers (>2.5x and amount > ৳100 or win > ৳1000)
    const initialHigh = initialBets.filter(b => b.winAmount >= 1000 || b.multiplier >= 5);
    // If empty, generate some high rollers specifically
    while (initialHigh.length < 5) {
      const b = generateSimulatedBet();
      if (b.winAmount >= 1000) {
        initialHigh.push(b);
      }
    }
    setHighRollers(initialHigh.slice(0, 10));

    // Live update interval
    const interval = setInterval(() => {
      const newBet = generateSimulatedBet();
      
      // Update Live Bets tab
      setLiveBets(prev => {
        const updated = [newBet, ...prev];
        return updated.slice(0, 8); // Keep 8 items
      });

      // Update High Rollers tab if it's a big win
      if (newBet.winAmount >= 1200 || newBet.multiplier >= 8) {
        setHighRollers(prev => {
          const updated = [newBet, ...prev];
          return updated.slice(0, 8);
        });
      }
    }, 3200);

    return () => clearInterval(interval);
  }, []);

  // Sync real-time My Bets from Firestore if user is logged in
  useEffect(() => {
    if (!userData?.id || activeTab !== 'my') return;

    setLoadingMyBets(true);
    const betsRef = collection(db, 'bets');
    const q = query(
      betsRef,
      where('userId', '==', userData.id),
      orderBy('createdAt', 'desc'),
      limit(10)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: BetItem[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        const date = data.createdAt?.toDate ? data.createdAt.toDate() : new Date();
        const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        
        list.push({
          id: doc.id,
          user: userData.username || 'My Bet',
          game: data.gameName || data.gameType || 'Crash/Slots',
          provider: data.gameType === 'aviator' ? 'SPRIBE' : 'CASINO',
          betAmount: data.betAmount || 0,
          multiplier: data.multiplier || (data.winAmount > 0 ? parseFloat((data.winAmount / data.betAmount).toFixed(2)) : 0),
          winAmount: data.winAmount || 0,
          time: timeStr,
        });
      });
      setMyBets(list);
      setLoadingMyBets(false);
    }, (error) => {
      console.error("Error reading live user bets:", error);
      setLoadingMyBets(false);
    });

    return () => unsubscribe();
  }, [userData?.id, activeTab]);

  const currentBets = activeTab === 'live' ? liveBets : activeTab === 'high' ? highRollers : myBets;

  return (
    <div className="bg-[#0b1622] border border-[#1e3a5f]/40 rounded-2xl overflow-hidden shadow-2xl p-4 mt-6">
      {/* Header and Live Status */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="relative flex items-center justify-center p-2 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-500">
            <TrendingUp size={18} className="animate-pulse" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-500 rounded-full animate-ping" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-500 rounded-full border border-[#0d1a29]" />
          </div>
          <div>
            <h3 className="text-base font-black italic tracking-tight text-white uppercase">রিয়েল-টাইম বেটস</h3>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Live platform wins & telemetry</p>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="grid grid-cols-3 bg-[#132236] p-1 rounded-xl w-full sm:w-auto text-[10px] font-black uppercase tracking-wider">
          <button
            onClick={() => setActiveTab('live')}
            className={`px-3 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'live'
                ? 'bg-gradient-to-r from-orange-500 to-red-650 text-white shadow-md font-black'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Flame size={12} />
            সকল বেট
          </button>
          <button
            onClick={() => setActiveTab('high')}
            className={`px-3 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'high'
                ? 'bg-gradient-to-r from-yellow-500 to-amber-600 text-black shadow-md font-black'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Trophy size={12} />
            বড় জয়
          </button>
          <button
            onClick={() => setActiveTab('my')}
            className={`px-3 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'my'
                ? 'bg-[#1c324e] text-yellow-400 border border-yellow-500/20 font-black'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <User size={12} />
            আমার বেট
          </button>
        </div>
      </div>

      {/* Main Content Pane */}
      <div className="overflow-x-auto rounded-xl border border-[#1e3a5f]/35 bg-[#0e1b2b]">
        <table className="w-full text-left border-collapse min-w-[500px]">
          <thead>
            <tr className="border-b border-[#1e3a5f]/50 text-[10px] text-gray-500 font-black uppercase tracking-widest bg-[#09121e]">
              <th className="py-2.5 px-4">গেমে নাম</th>
              <th className="py-2.5 px-4">প্লেয়ার</th>
              <th className="py-2.5 px-4 text-center">প্লে টাইম</th>
              <th className="py-2.5 px-4">বেট পরিমাণ</th>
              <th className="py-2.5 px-4 text-center">মাল্টিপ্লায়ার</th>
              <th className="py-2.5 px-4 text-right">পে-আউট</th>
            </tr>
          </thead>
          <tbody>
            {activeTab === 'my' && !userData ? (
              <tr>
                <td colSpan={6} className="py-12 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <ShieldCheck size={36} className="text-gray-600" />
                    <p className="text-xs text-gray-400 font-bold uppercase">দয়া করে আপনার উইন ও বেট হিস্ট্রি দেখতে লগইন করুন</p>
                    <button
                      onClick={() => onOpenLogin?.('login')}
                      className="px-6 py-2 rounded-xl bg-gradient-to-r from-yellow-400 to-yellow-600 text-black text-[10px] font-black uppercase hover:scale-105 transition-transform"
                    >
                      লগইন করুন
                    </button>
                  </div>
                </td>
              </tr>
            ) : loadingMyBets ? (
              <tr>
                <td colSpan={6} className="py-12">
                  <LoadingSpinner size="sm" message="ডেটা লোড হচ্ছে..." />
                </td>
              </tr>
            ) : currentBets.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-16 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <Ticket size={32} className="text-gray-700" />
                    <p className="text-xs text-gray-500 font-bold uppercase">কোন বেটার তথ্য পাওয়া যায়নি</p>
                  </div>
                </td>
              </tr>
            ) : (
              <AnimatePresence initial={false}>
                {currentBets.map((bet) => {
                  const gameTheme = bet.winAmount > 0 
                    ? bet.winAmount >= 5000 
                      ? 'border-yellow-500/20 bg-yellow-500/5' 
                      : 'border-green-500/10 hover:bg-[#12241e]' 
                    : 'border-transparent hover:bg-white/[0.01]';
                    
                  return (
                    <motion.tr
                      key={bet.id}
                      initial={activeTab === 'live' ? { opacity: 0, y: -15 } : { opacity: 0 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.35, ease: 'easeOut' }}
                      className={`border-b border-[#1e3a5f]/20 transition-all text-xs font-bold text-white ${gameTheme}`}
                    >
                      {/* Game name & Provider */}
                      <td className="py-3 px-4 flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-[#14253a] border border-[#1e3a5f]/40 flex items-center justify-center text-base shadow-inner overflow-hidden">
                          {getGameInfo(bet.game).logo ? (
                            <img src={getGameInfo(bet.game).logo!} alt="Game" className="w-full h-full object-cover" />
                          ) : (
                            POPULAR_GAMES.find(g => g.name === bet.game)?.logo || '🎰'
                          )}
                        </div>
                        <div>
                          <p className="text-[11px] font-black text-white tracking-tight">{getGameInfo(bet.game).name}</p>
                          <p className={`text-[8px] font-black uppercase px-1 rounded inline-block ${
                            bet.provider === 'SPRIBE' 
                              ? 'bg-red-500/10 text-red-500 border border-red-500/20' 
                              : bet.provider === 'JILI'
                              ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                              : bet.provider === 'PG'
                              ? 'bg-orange-500/10 text-orange-500 border border-orange-500/20'
                              : 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20'
                          }`}>
                            {bet.provider}
                          </p>
                        </div>
                      </td>

                      {/* Player obfuscated nickname */}
                      <td className="py-3 px-4 font-mono text-gray-300">
                        {bet.user}
                      </td>

                      {/* Timestamp */}
                      <td className="py-3 px-4 font-mono text-gray-500 text-center text-[10px]">
                        <span className="flex items-center justify-center gap-1">
                          <Clock size={10} />
                          {bet.time}
                        </span>
                      </td>

                      {/* Bet amount in BDT */}
                      <td className="py-3 px-4 font-mono font-medium text-gray-300">
                        ৳ {bet.betAmount.toLocaleString()}
                      </td>

                      {/* Multiplier achieved */}
                      <td className="py-3 px-4 text-center">
                        {bet.winAmount > 0 ? (
                          <span className={`inline-block px-2 py-0.5 rounded font-mono font-black text-[10px] ${
                            bet.multiplier >= 15 
                              ? 'bg-[#ffebee] text-[#d32f2f] border border-[#d32f2f]/35 shadow-sm animate-pulse'
                              : bet.multiplier >= 5
                              ? 'bg-yellow-400/20 text-yellow-400 border border-yellow-500/20'
                              : 'bg-green-500/20 text-green-400'
                          }`}>
                            {bet.multiplier.toFixed(2)}x
                          </span>
                        ) : (
                          <span className="font-mono text-gray-500">0.00x</span>
                        )}
                      </td>

                      {/* Payout BDT */}
                      <td className={`py-3 px-4 text-right font-mono font-black ${
                        bet.winAmount > 0 
                          ? bet.winAmount >= 5000
                            ? 'text-yellow-400 font-extrabold text-xs drop-shadow-[0_0_8px_rgba(253,216,53,0.3)]'
                            : 'text-green-400' 
                          : 'text-gray-500'
                      }`}>
                        {bet.winAmount > 0 ? (
                          <span className="flex items-center justify-end gap-0.5">
                            <ArrowUpRight size={12} className="shrink-0" />
                            ৳ {bet.winAmount.toLocaleString()}
                          </span>
                        ) : (
                          <span className="flex items-center justify-end gap-0.5 opacity-50">
                            <ArrowDownLeft size={12} className="shrink-0" />
                            ৳ 0.00
                          </span>
                        )}
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
