import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { History, Search, Filter, ArrowUpRight, ArrowDownLeft, Clock, Zap, Star } from 'lucide-react';
import { collection, query, where, orderBy, limit, getDocs, startAfter } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useFirebase } from '../hooks/useFirebase';

const ActivityHistory: React.FC = () => {
  const { user } = useFirebase();
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'win' | 'loss'>('all');
  const [lastVisible, setLastVisible] = useState<any>(null);
  const [hasMore, setHasMore] = useState(true);
  const PAGE_SIZE = 15;

  const fetchHistory = async (isFirstLoad = true) => {
    if (!user) return;
    if (isFirstLoad) setLoading(true);
    
    try {
      let q = query(
        collection(db, 'bets'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc'),
        limit(PAGE_SIZE)
      );

      if (!isFirstLoad && lastVisible) {
        q = query(
          collection(db, 'bets'),
          where('userId', '==', user.uid),
          orderBy('createdAt', 'desc'),
          startAfter(lastVisible),
          limit(PAGE_SIZE)
        );
      }

      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      if (isFirstLoad) {
        setHistory(data);
      } else {
        setHistory(prev => [...prev, ...data]);
      }

      setLastVisible(querySnapshot.docs[querySnapshot.docs.length - 1]);
      setHasMore(querySnapshot.docs.length === PAGE_SIZE);
    } catch (error) {
      console.error("Error fetching history:", error);
    } finally {
      if (isFirstLoad) setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory(true);
  }, [user]);

  const loadMore = () => {
    if (!loading && hasMore) {
      fetchHistory(false);
    }
  };

  const filteredHistory = history.filter(item => {
    if (filter === 'win') return item.winAmount > 0;
    if (filter === 'loss') return item.winAmount === 0;
    return true;
  });

  return (
    <div className="min-h-screen bg-[#0a0505] p-4 text-white pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-yellow-500/20 rounded-xl flex items-center justify-center text-yellow-500 border border-yellow-500/30">
            <History size={20} />
          </div>
          <div>
            <h1 className="text-xl font-black italic uppercase italic tracking-tighter">Activity History</h1>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest leading-none">Your betting records</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        {['all', 'win', 'loss'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f as any)}
            className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${filter === f ? 'bg-yellow-500 border-yellow-400 text-black shadow-[0_0_15px_rgba(234,179,8,0.3)]' : 'bg-white/5 border-white/5 text-gray-500'}`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="space-y-3">
        {loading && history.length === 0 ? (
          [...Array(6)].map((_, i) => (
            <div key={i} className="h-20 bg-white/5 rounded-2xl animate-pulse border border-white/5" />
          ))
        ) : filteredHistory.length === 0 ? (
          <div className="py-20 text-center space-y-4">
             <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto">
               <Search size={32} className="text-gray-700" />
             </div>
             <p className="text-gray-500 text-xs font-bold uppercase">No records found</p>
          </div>
        ) : (
          <>
            {filteredHistory.map((item) => (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                key={item.id}
                className="bg-black/40 border border-white/5 p-4 rounded-2xl flex items-center justify-between group hover:border-yellow-500/20 transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${item.winAmount > 0 ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
                    {item.gameType === 'slot' ? <Zap size={24} /> : <Star size={24} />}
                  </div>
                  <div>
                    <div className="text-sm font-black text-white italic uppercase tracking-tighter">{item.gameType}</div>
                    <div className="flex items-center gap-1.5 text-[10px] text-gray-500 font-bold uppercase">
                      <Clock size={10} />
                      {item.createdAt?.toDate ? item.createdAt.toDate().toLocaleString() : 'Recent'}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className={`text-sm font-black ${item.winAmount > 0 ? 'text-green-500' : 'text-red-500/50'}`}>
                    {item.winAmount > 0 ? `+৳${item.winAmount}` : `-৳${item.betAmount}`}
                  </div>
                  <div className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">
                    {item.winAmount > 0 ? 'Won' : 'Lost'}
                  </div>
                </div>
              </motion.div>
            ))}

            {hasMore && (
              <button
                onClick={loadMore}
                disabled={loading}
                className="w-full py-4 bg-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-400 hover:bg-white/10 transition-all disabled:opacity-50"
              >
                {loading ? 'Loading...' : 'Load More Records'}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ActivityHistory;
