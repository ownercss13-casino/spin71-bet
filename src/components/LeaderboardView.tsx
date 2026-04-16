import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Medal, Crown, Star, TrendingUp, User, Award } from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { LeaderboardEntry } from '../services/firebaseService';

export default function LeaderboardView() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const leaderboardRef = collection(db, 'leaderboard');
    const q = query(leaderboardRef, orderBy('totalWinnings', 'desc'), limit(20));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => doc.data() as LeaderboardEntry);
      setEntries(data);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'leaderboard');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0: return <Crown className="w-6 h-6 text-yellow-400" />;
      case 1: return <Medal className="w-6 h-6 text-gray-300" />;
      case 2: return <Medal className="w-6 h-6 text-amber-600" />;
      default: return <span className="text-gray-400 font-bold w-6 text-center">{index + 1}</span>;
    }
  };

  const getAchievementBadge = (achievement: string) => {
    switch (achievement) {
      case 'Big Winner': return <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />;
      case 'High Roller': return <TrendingUp className="w-3 h-3 text-green-400" />;
      case 'Pro Player': return <Award className="w-3 h-3 text-blue-400" />;
      default: return null;
    }
  };

  return (
    <div className="p-4 space-y-6 pb-24">
      <div className="bg-gradient-to-r from-yellow-600 to-yellow-800 p-4 rounded-2xl shadow-lg flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Trophy className="text-white" size={32} />
          <div>
            <h2 className="text-white font-black text-xl italic uppercase tracking-tighter">লিডারবোর্ড</h2>
            <p className="text-yellow-200 text-[10px] font-bold">সেরা খেলোয়াড়দের তালিকা (Top Winners)</p>
          </div>
        </div>
        <div className="bg-black/20 px-3 py-1 rounded-full border border-white/10">
          <span className="text-white font-black text-sm italic">Real-Time</span>
        </div>
      </div>

      <div className="bg-[#1a1b23] rounded-2xl border border-white/5 overflow-hidden">
        {loading ? (
          <div className="p-8 flex justify-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-8 h-8 border-2 border-yellow-500 border-t-transparent rounded-full"
            />
          </div>
        ) : entries.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto">
              <Trophy className="w-8 h-8 text-gray-600" />
            </div>
            <p className="text-gray-400">এখনও কোনো তথ্য নেই</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            <AnimatePresence mode="popLayout">
              {entries.map((entry, index) => (
                <motion.div
                  key={entry.userId}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.05 }}
                  className={`flex items-center gap-4 p-4 ${index < 3 ? 'bg-white/[0.02]' : ''}`}
                >
                  <div className="flex-shrink-0 w-8 flex justify-center">
                    {getRankIcon(index)}
                  </div>

                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-500/20 to-amber-500/20 border border-white/10 flex items-center justify-center overflow-hidden">
                      {entry.avatarUrl ? (
                        <img 
                          src={entry.avatarUrl} 
                          alt={entry.username} 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <User className="w-6 h-6 text-gray-400" />
                      )}
                    </div>
                    {index === 0 && (
                      <div className="absolute -top-1 -right-1">
                        <Crown className="w-4 h-4 text-yellow-400 drop-shadow-lg" />
                      </div>
                    )}
                  </div>

                  <div className="flex-grow min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-medium text-white truncate">
                        {entry.username}
                      </h3>
                      <div className="flex gap-1">
                        {entry.achievements?.slice(0, 3).map((ach, i) => (
                          <div key={i} title={ach}>
                            {getAchievementBadge(ach)}
                          </div>
                        ))}
                      </div>
                    </div>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider">
                      {index === 0 ? 'Grand Champion' : index === 1 ? 'Elite Player' : index === 2 ? 'Rising Star' : 'Contender'}
                    </p>
                  </div>

                  <div className="text-right">
                    <div className="text-sm font-bold text-yellow-500">
                      ৳ {entry.totalWinnings.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-gray-500">মোট জয়</div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Top 3 Podium (Visual) */}
      {!loading && entries.length >= 3 && (
        <div className="grid grid-cols-3 gap-4 items-end pt-4">
          {/* 2nd Place */}
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-full border-2 border-gray-300 overflow-hidden">
              <img src={entries[1].avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${entries[1].username}`} alt="" referrerPolicy="no-referrer" />
            </div>
            <div className="w-full h-16 bg-gray-300/10 rounded-t-lg flex items-center justify-center">
              <span className="text-xl font-bold text-gray-300">2</span>
            </div>
          </div>
          
          {/* 1st Place */}
          <div className="flex flex-col items-center gap-2">
            <Crown className="w-6 h-6 text-yellow-400" />
            <div className="w-16 h-16 rounded-full border-2 border-yellow-400 overflow-hidden -mt-2">
              <img src={entries[0].avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${entries[0].username}`} alt="" referrerPolicy="no-referrer" />
            </div>
            <div className="w-full h-24 bg-yellow-400/10 rounded-t-lg flex items-center justify-center border-x border-t border-yellow-400/20">
              <span className="text-3xl font-bold text-yellow-400">1</span>
            </div>
          </div>

          {/* 3rd Place */}
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-full border-2 border-amber-600 overflow-hidden">
              <img src={entries[2].avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${entries[2].username}`} alt="" referrerPolicy="no-referrer" />
            </div>
            <div className="w-full h-12 bg-amber-600/10 rounded-t-lg flex items-center justify-center">
              <span className="text-xl font-bold text-amber-600">3</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
