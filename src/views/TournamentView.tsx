import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, 
  Target, 
  Crown, 
  Timer, 
  History, 
  Star, 
  Zap, 
  ChevronRight, 
  Info,
  Users,
  Coins,
  ArrowUpRight,
  Medal,
  Calendar,
  X,
  Plus
} from 'lucide-react';

import { ToastType } from '../types';

interface TournamentViewProps {
  userData: any;
  onBack: () => void;
  showToast: (msg: string, type?: ToastType) => void;
  onNavigate: (tab: string) => void;
}

export default function TournamentView({ userData, onBack, showToast, onNavigate }: TournamentViewProps) {
  const [activeTournament, setActiveTournament] = useState<'daily' | 'weekly' | 'grand'>('daily');
  const [timeLeft, setTimeLeft] = useState("05:24:12");

  // Mock tournament data
  const tournaments = {
    daily: {
      name: "Daily Spin Masters",
      prize: "৳ 50,000",
      participants: 1240,
      minBet: "৳ 10",
      ends: "12:00 AM",
      leaderboard: [
        { rank: 1, name: "Sakib_77", score: "৳ 1,45,200", reward: "৳ 15,000", user: false },
        { rank: 2, name: "Rifat_Khan", score: "৳ 98,540", reward: "৳ 10,000", user: false },
        { rank: 3, name: "Rony_Pilot", score: "৳ 72,100", reward: "৳ 7,500", user: false },
        { rank: 4, name: "Ayan_Pro", score: "৳ 55,200", reward: "৳ 4,000", user: false },
        { rank: 12, name: userData?.username || "You", score: "৳ 4,200", reward: "৳ 0", user: true },
      ]
    },
    weekly: {
      name: "Weekly High Roller",
      prize: "৳ 2,50,000",
      participants: 5820,
      minBet: "৳ 50",
      ends: "Sunday",
      leaderboard: [
        { rank: 1, name: "King_Ali", score: "৳ 12,45,000", reward: "৳ 75,000", user: false },
        { rank: 2, name: "Nayeem_22", score: "৳ 8,24,000", reward: "৳ 50,000", user: false },
        { rank: 3, name: "Hasan_VIP", score: "৳ 5,12,000", reward: "৳ 30,000", user: false },
      ]
    },
    grand: {
      name: "Grand Jackpot Tournament",
      prize: "৳ 10,00,000",
      participants: 15400,
      minBet: "৳ 100",
      ends: "Monthly",
      leaderboard: []
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[#0d1a29] overflow-y-auto pb-24">
      {/* Header Sticky */}
      <div className="sticky top-0 z-50 bg-[#0d1a29]/80 backdrop-blur-xl border-b border-white/5 p-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-yellow-500/10 rounded-2xl text-yellow-500 ring-1 ring-yellow-500/20">
            <Trophy size={22} className="drop-shadow-[0_0_8px_rgba(234,179,8,0.5)]" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white italic uppercase tracking-tighter leading-none">টুরনামেন্ট</h1>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Tournaments & Challenges</p>
          </div>
        </div>
        <button onClick={onBack} className="p-2 bg-white/5 rounded-xl text-white">
          <X size={20} />
        </button>
      </div>

      <div className="p-6 space-y-8">
        {/* Active Tabs */}
        <div className="flex bg-white/5 p-1.5 rounded-[24px] border border-white/10">
          {['daily', 'weekly', 'grand'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTournament(tab as any)}
              className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all ${
                activeTournament === tab 
                  ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/20' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {tab === 'daily' && 'Daily'}
              {tab === 'weekly' && 'Weekly'}
              {tab === 'grand' && 'Grand'}
            </button>
          ))}
        </div>

        {/* Feature Banner */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTournament}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="relative p-8 rounded-[40px] overflow-hidden border border-white/10"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/20 via-transparent to-transparent opacity-50"></div>
            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="flex items-center gap-2 bg-black/40 px-4 py-2 rounded-full mb-6 border border-white/10">
                <Timer size={14} className="text-yellow-500" />
                <span className="text-[10px] font-black text-white tracking-widest uppercase italic">{timeLeft} Remaining</span>
              </div>
              
              <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter mb-2 drop-shadow-2xl">{tournaments[activeTournament].name}</h2>
              <p className="text-[#90a4ae] text-xs font-bold uppercase tracking-widest mb-8">Prize Pool</p>
              
              <div className="text-6xl font-black text-yellow-500 italic drop-shadow-[0_0_20px_rgba(234,179,8,0.3)] mb-10">
                {tournaments[activeTournament].prize}
              </div>

              <div className="grid grid-cols-3 gap-3 w-full max-w-sm mb-10">
                <div className="bg-white/5 rounded-3xl p-4 border border-white/5">
                  <p className="text-[9px] text-gray-500 font-bold uppercase mb-1">Players</p>
                  <p className="text-sm font-black text-white italic">{tournaments[activeTournament].participants}</p>
                </div>
                <div className="bg-white/5 rounded-3xl p-4 border border-white/5">
                  <p className="text-[9px] text-gray-500 font-bold uppercase mb-1">Min Bet</p>
                  <p className="text-sm font-black text-white italic">{tournaments[activeTournament].minBet}</p>
                </div>
                <div className="bg-white/5 rounded-3xl p-4 border border-white/5">
                  <p className="text-[9px] text-gray-500 font-bold uppercase mb-1">Rating</p>
                  <p className="text-sm font-black text-white italic">Elite</p>
                </div>
              </div>

              <button 
                onClick={() => onNavigate('slot')}
                className="group relative w-full max-w-xs bg-white text-black font-black italic uppercase tracking-widest py-5 rounded-[24px] shadow-2xl flex items-center justify-center gap-3 overflow-hidden transform active:scale-95 transition-all"
              >
                 <div className="absolute inset-0 bg-yellow-500 transform translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-500"></div>
                 <span className="relative z-10 transition-colors group-hover:text-black">অংশ নিন (Join Now)</span>
                 <Zap size={18} className="relative z-10 text-yellow-500 group-hover:text-black" />
              </button>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* My Status */}
        <div className="bg-[#1a2c42] rounded-[32px] p-6 border border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-white border border-white/10">
              <Crown size={22} />
            </div>
            <div>
              <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">আপনার লেভেল</p>
              <h4 className="text-sm font-black text-white italic">অপ্রশিক্ষিত (Entry Level)</h4>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">লিডারবোর্ড</p>
            <h4 className="text-sm font-black text-yellow-500 italic">Rank #124</h4>
          </div>
        </div>

        {/* Leaderboard Table */}
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2 px-2">
            <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2 italic">
              <Zap size={14} className="text-yellow-500" /> সেরা খেলোয়াড়বৃন্দ
            </h3>
            <span className="text-[9px] text-gray-500 font-bold uppercase">Real-time update</span>
          </div>

          <div className="space-y-2">
            {tournaments[activeTournament].leaderboard.map((item: any, i: number) => (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                key={i}
                className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                  item.user 
                    ? 'bg-yellow-500/10 border-yellow-500/50 shadow-lg shadow-yellow-500/5' 
                    : 'bg-white/5 border-white/10'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black italic ${
                    item.rank === 1 ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/20' :
                    item.rank === 2 ? 'bg-gray-300 text-black' :
                    item.rank === 3 ? 'bg-yellow-700 text-white' :
                    'bg-white/10 text-gray-400 font-sans'
                  }`}>
                    {item.rank}
                  </div>
                  <div>
                    <h5 className={`text-xs font-black italic ${item.user ? 'text-yellow-500' : 'text-white'}`}>{item.name}</h5>
                    <p className="text-[9px] text-gray-500 font-bold uppercase">{item.score}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-green-500 italic">+{item.reward}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {tournaments[activeTournament].leaderboard.length === 0 && (
            <div className="text-center py-10 opacity-30">
              <Target size={40} className="mx-auto mb-4 text-gray-500" />
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">টুরনামেন্ট এখনো শুরু হয়নি</p>
            </div>
          )}
        </div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-2 gap-3 pb-6">
          <div className="bg-gradient-to-br from-blue-900/50 to-blue-950/50 p-6 rounded-[32px] border border-blue-500/20">
            <Star className="text-blue-400 mb-4" size={24} />
            <h4 className="text-xs font-black text-white uppercase italic leading-tight mb-2">লেভেল আপ (Level Up)</h4>
            <p className="text-[9px] text-gray-400 font-medium leading-relaxed">টুরনামেন্টে ভালো খেলে আপনার VIP লেভেল দ্রুত বাড়ান।</p>
          </div>
          <div className="bg-gradient-to-br from-green-900/50 to-green-950/50 p-6 rounded-[32px] border border-green-500/20">
            <Coins className="text-green-400 mb-4" size={24} />
            <h4 className="text-xs font-black text-white uppercase italic leading-tight mb-2">ক্যাশ প্রাইজ (Cash)</h4>
            <p className="text-[9px] text-gray-400 font-medium leading-relaxed">সেরা ৫ জন খেলোয়াড় সরাসরি উইথড্রযোগ্য ক্যাশ বোনাস পাবেন।</p>
          </div>
        </div>
      </div>
    </div>
  );
}
