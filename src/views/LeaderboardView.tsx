import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, 
  ChevronLeft, 
  Crown, 
  Medal, 
  TrendingUp, 
  ChevronRight, 
  Star, 
  Target, 
  Zap, 
  History,
  ArrowUpRight,
  User as UserIcon,
  RefreshCw,
  Search
} from 'lucide-react';
import { db } from '../services/firebase';
import { collection, query, orderBy, limit, onSnapshot, getDocs, where } from 'firebase/firestore';

interface LeaderboardUser {
  id: string;
  username: string;
  totalReferralEarnings?: number;
  balance?: number;
  totalDeposits?: number;
  profit?: number;
  avatar?: string;
  vipLevel?: number;
}

export default function LeaderboardView({ onBack }: { onBack: () => void }) {
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<'earning' | 'balance' | 'deposits'>('earning');
  const [timeframe, setTimeframe] = useState<'daily' | 'weekly' | 'all'>('all');

  useEffect(() => {
    setLoading(true);
    const usersRef = collection(db, 'users');
    
    let sortField = 'totalReferralEarnings';
    if (activeCategory === 'balance') sortField = 'balance';
    if (activeCategory === 'deposits') sortField = 'totalDeposits';

    const q = query(usersRef, orderBy(sortField, 'desc'), limit(15));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as LeaderboardUser[];
      
      setUsers(usersData);
      setLoading(false);
    }, (error) => {
      console.error("Leaderboard fetch error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [activeCategory, timeframe]);

  const categories = [
    { id: 'earning', label: 'আয় (Earnings)', icon: TrendingUp },
    { id: 'balance', label: 'ব্যালেন্স', icon: Star },
    { id: 'deposits', label: 'ডিপোজিট', icon: Target },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[#0d1a29] text-white pb-20">
      {/* Header */}
      <div className="bg-[#14253a] pt-12 pb-6 px-6 sticky top-0 z-20 border-b border-[#1e3a5f] shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <button onClick={onBack} className="p-2 bg-white/5 rounded-2xl hover:bg-white/10 transition-colors">
            <ChevronLeft size={24} />
          </button>
          <div className="flex flex-col items-center">
            <h2 className="text-2xl font-black italic tracking-tighter uppercase flex items-center gap-2">
              <Trophy className="text-yellow-500" size={24} /> লিডারবোর্ড
            </h2>
            <p className="text-[10px] font-bold text-teal-400 uppercase tracking-widest">Global Top Winners</p>
          </div>
          <button className="p-2 bg-white/5 rounded-2xl opacity-0">
            <RefreshCw size={24} />
          </button>
        </div>

        {/* Categories Tab */}
        <div className="flex bg-black/20 p-1 rounded-2xl overflow-x-auto no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id as any)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl transition-all whitespace-nowrap ${
                activeCategory === cat.id 
                  ? 'bg-yellow-500 text-black font-bold shadow-lg' 
                  : 'text-teal-400 hover:text-white font-medium'
              }`}
            >
              <cat.icon size={16} />
              <span className="text-xs uppercase tracking-tighter">{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Top 3 Winners */}
      {!loading && users.length >= 3 && (
        <div className="px-6 pt-10 pb-6 grid grid-cols-3 gap-3 items-end">
          {/* Rank 2 */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center gap-3 pb-4"
          >
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-4 border-gray-400 overflow-hidden bg-white/10 shadow-lg shadow-gray-400/20">
                <img 
                   src={users[1]?.avatar || "https://www.image2url.com/r2/default/images/1779828873931-409cfe92-d243-4926-91bd-67da3a1e0adc.png"} 
                   className="w-full h-full object-cover" 
                   alt="Rank 2"
                />
              </div>
              <div className="absolute -bottom-2 translate-x-1/2 right-1/2 w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center text-black font-black text-xs border-4 border-[#0d1a29]">
                2
              </div>
            </div>
            <div className="text-center">
              <p className="text-xs font-bold truncate max-w-[80px]">{users[1]?.username}</p>
              <p className="text-[10px] text-teal-400 font-black">৳{Math.floor(users[1]?.[activeCategory === 'earning' ? 'totalReferralEarnings' : activeCategory === 'balance' ? 'balance' : 'totalDeposits'] || 0).toLocaleString()}</p>
            </div>
          </motion.div>

          {/* Rank 1 */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center gap-4 relative z-10"
          >
            <div className="absolute -top-10 scale-150">
               <Crown className="text-yellow-500 fill-yellow-500/20 animate-bounce" size={40} />
            </div>
            <div className="relative">
              <div className="w-24 h-24 rounded-full border-4 border-yellow-500 overflow-hidden bg-white/10 shadow-2xl shadow-yellow-500/30">
                <img 
                   src={users[0]?.avatar || "https://www.image2url.com/r2/default/images/1779828873931-409cfe92-d243-4926-91bd-67da3a1e0adc.png"} 
                   className="w-full h-full object-cover" 
                   alt="Rank 1"
                />
              </div>
              <div className="absolute -bottom-3 translate-x-1/2 right-1/2 w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center text-black font-black text-lg border-4 border-[#0d1a29]">
                1
              </div>
            </div>
            <div className="text-center">
              <p className="text-sm font-black truncate max-w-[100px] uppercase italic text-yellow-500">{users[0]?.username}</p>
              <p className="text-xs text-white font-black">৳{Math.floor(users[0]?.[activeCategory === 'earning' ? 'totalReferralEarnings' : activeCategory === 'balance' ? 'balance' : 'totalDeposits'] || 0).toLocaleString()}</p>
            </div>
          </motion.div>

          {/* Rank 3 */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center gap-3 pb-4"
          >
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-4 border-amber-800 overflow-hidden bg-white/10 shadow-lg shadow-amber-800/20">
                <img 
                   src={users[2]?.avatar || "https://www.image2url.com/r2/default/images/1779828873931-409cfe92-d243-4926-91bd-67da3a1e0adc.png"} 
                   className="w-full h-full object-cover" 
                   alt="Rank 3"
                />
              </div>
              <div className="absolute -bottom-2 translate-x-1/2 right-1/2 w-8 h-8 bg-amber-800 rounded-full flex items-center justify-center text-black font-black text-xs border-4 border-[#0d1a29]">
                3
              </div>
            </div>
            <div className="text-center">
              <p className="text-xs font-bold truncate max-w-[80px]">{users[2]?.username}</p>
              <p className="text-[10px] text-teal-400 font-black">৳{Math.floor(users[2]?.[activeCategory === 'earning' ? 'totalReferralEarnings' : activeCategory === 'balance' ? 'balance' : 'totalDeposits'] || 0).toLocaleString()}</p>
            </div>
          </motion.div>
        </div>
      )}

      {/* Main List */}
      <div className="flex-1 mt-4 px-4">
        <div className="bg-[#14253a]/50 rounded-[40px] border border-[#1e3a5f]/30 overflow-hidden">
          <div className="p-6 border-b border-[#1e3a5f]/30 flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-[#90a4ae]">ইউজার তালিকা (Top 15 Users)</span>
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          </div>

          {loading ? (
            <div className="p-20 flex flex-col items-center gap-4">
              <RefreshCw className="text-yellow-500 animate-spin" size={40} />
              <p className="text-teal-400 text-xs font-bold animate-pulse">ডেটা লোড হচ্ছে...</p>
            </div>
          ) : (
            <div className="divide-y divide-[#1e3a5f]/20">
              {users.slice(3).map((user, idx) => (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.05 }}
                  key={user.id}
                  className="p-5 flex items-center gap-4 hover:bg-white/5 transition-colors group"
                >
                  <span className="text-xs font-black text-teal-400 w-6 italic">#{idx + 4}</span>
                  <div className="w-10 h-10 rounded-xl overflow-hidden border border-white/10 group-hover:scale-110 transition-transform">
                    <img 
                       src={user.avatar || "https://www.image2url.com/r2/default/images/1779828873931-409cfe92-d243-4926-91bd-67da3a1e0adc.png"} 
                       className="w-full h-full object-cover" 
                       alt="Avatar"
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold h-5 flex items-center gap-2">
                       {user.username}
                       {user.vipLevel && user.vipLevel > 0 && <Crown size={10} className="text-yellow-500" />}
                    </p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Target size={10} className="text-teal-700" />
                      <span className="text-[9px] text-teal-700 font-bold uppercase">UID: {user.id.substring(0,6)}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-white italic">৳{Math.floor(user[activeCategory === 'earning' ? 'totalReferralEarnings' : activeCategory === 'balance' ? 'balance' : 'totalDeposits'] || 0).toLocaleString()}</p>
                    <p className="text-[8px] font-black text-green-400 flex items-center justify-end gap-1 uppercase">
                      <ArrowUpRight size={8} /> LIVE
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
