import React, { useState, useEffect } from 'react';
import { X, Clock, ArrowUpRight, History, Filter, ArrowDownUp, FileSearch } from 'lucide-react';
import { db } from '../services/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';

interface Withdrawal {
  id: string;
  amount: number;
  status: 'pending' | 'completed' | 'failed' | 'approved' | 'rejected' | 'success';
  date: string;
  method?: string;
  trxId?: string;
  accountNumber?: string;
  _timestamp: number;
}

interface WithdrawalHistoryTabProps {
  userData: any;
  onBack: () => void;
}

export default function WithdrawalHistoryTab({ userData, onBack }: WithdrawalHistoryTabProps) {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTrx, setSelectedTrx] = useState<Withdrawal | null>(null);
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc'>('date_desc');

  useEffect(() => {
    if (!userData?.id) {
       setIsLoading(false);
       return;
    }

    const q = query(
      collection(db, 'transactions'), 
      where('userId', '==', userData.id),
      where('type', '==', 'withdrawal')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => {
        const d = doc.data();
        let dateStr = 'Just now';
        let timestamp = 0;
        
        const createdAt = d.createdAt;
        if (createdAt) {
          if (typeof createdAt.toDate === 'function') {
            const date = createdAt.toDate();
            dateStr = date.toLocaleString();
            timestamp = date.getTime();
          } else {
            const date = new Date(createdAt);
            dateStr = date.toLocaleString();
            timestamp = date.getTime();
          }
        }

        return {
          id: doc.id,
          amount: d.amount,
          status: d.status,
          date: dateStr,
          method: d.method,
          trxId: d.trxId,
          accountNumber: d.accountNumber,
          _timestamp: timestamp
        } as Withdrawal;
      });

      setWithdrawals(data);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching withdrawals:", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [userData?.id]);

  const filteredAndSortedWithdrawals = React.useMemo(() => {
    let result = [...withdrawals];
    
    result.sort((a, b) => {
      if (sortBy === 'date_desc') return b._timestamp - a._timestamp;
      if (sortBy === 'date_asc') return a._timestamp - b._timestamp;
      if (sortBy === 'amount_desc') return b.amount - a.amount;
      if (sortBy === 'amount_asc') return a.amount - b.amount;
      return 0;
    });
    
    return result;
  }, [withdrawals, sortBy]);

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'completed':
      case 'approved':
      case 'success':
        return 'bg-green-500/10 text-green-400 border border-green-500/20';
      case 'pending': 
        return 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20';
      case 'rejected':
      case 'failed': 
        return 'bg-red-500/10 text-red-400 border border-red-500/20';
      default: 
        return 'bg-gray-500/10 text-gray-400 border border-gray-500/20';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
      case 'success': return 'সম্পন্ন (Success)';
      case 'approved': return 'অনুমোদিত (Approved)';
      case 'pending': return 'প্রক্রিয়াধীন (Pending)';
      case 'rejected': return 'বাতিল (Rejected)';
      case 'failed': return 'ব্যর্থ (Failed)';
      default: return status;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 p-4 pb-20 min-h-screen">
      <div className="bg-gradient-to-br from-teal-900 to-teal-950 rounded-[40px] p-8 border border-teal-700/50 shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/5 rounded-full blur-[100px] -mr-32 -mt-32 transition-all duration-1000 group-hover:bg-orange-500/10"></div>
        <div className="relative z-10 flex justify-between items-start">
          <div>
            <div className="w-16 h-16 rounded-2xl bg-orange-500/20 flex items-center justify-center text-orange-500 mb-4 shadow-xl border border-orange-500/20 group-hover:scale-110 transition-transform">
              <History size={32} />
            </div>
            <h2 className="text-3xl font-black text-white italic tracking-tight">উত্তোলন ইতিহাস</h2>
            <p className="text-teal-400 text-xs font-bold uppercase tracking-widest mt-2">{userData?.username}'s Withdrawal History</p>
          </div>
          <button 
            onClick={onBack}
            className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center text-white hover:bg-red-500 transition-all border border-white/10 shadow-lg"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-teal-500" size={16} />
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value as any)}
            className="w-full bg-teal-900/40 border border-teal-700/50 text-white text-xs font-bold rounded-2xl pl-12 pr-4 py-4 appearance-none focus:outline-none focus:border-orange-500/50 transition-all uppercase tracking-widest"
          >
            <option value="date_desc">নতুন থেকে পুরানো (Newest First)</option>
            <option value="date_asc">পুরানো থেকে নতুন (Oldest First)</option>
            <option value="amount_desc">পরিমাণ: বেশি (High Amount)</option>
            <option value="amount_asc">পরিমাণ: কম (Low Amount)</option>
          </select>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-teal-500">
            <ArrowDownUp size={16} />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-teal-900/20 rounded-[32px] p-5 border border-teal-800/30 h-24 animate-pulse"></div>
            ))}
          </div>
        ) : filteredAndSortedWithdrawals.length > 0 ? (
          filteredAndSortedWithdrawals.map((w, idx) => (
            <motion.div 
              key={w.id} 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              onClick={() => setSelectedTrx(w)}
              className="bg-gradient-to-r from-teal-900/40 to-teal-950/40 p-5 rounded-[28px] border border-teal-800/30 flex items-center justify-between group hover:border-orange-500/40 transition-all shadow-lg active:scale-95 cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-orange-500/10 text-orange-400 flex items-center justify-center border border-orange-500/20 group-hover:rotate-12 transition-transform">
                  <ArrowUpRight size={22} />
                </div>
                <div>
                  <p className="text-base font-black text-white italic tracking-tight">{w.method || 'Bkash'}</p>
                  <p className="text-[10px] text-teal-500 font-bold mt-0.5">{w.date}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-black text-white tracking-tighter">৳{w.amount.toLocaleString()}</p>
                <div className={`mt-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest inline-flex items-center gap-1.5 ${getStatusStyle(w.status)}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${
                    w.status === 'completed' || w.status === 'success' || w.status === 'approved' ? 'bg-green-500' : 
                    w.status === 'pending' ? 'bg-yellow-500 animate-pulse' : 'bg-red-500'
                  }`} />
                  {getStatusText(w.status)}
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="bg-teal-900/20 p-12 rounded-[40px] border border-teal-800/30 text-center shadow-inner">
            <div className="w-20 h-20 bg-teal-950 rounded-full flex items-center justify-center mx-auto mb-4 border border-teal-800/50">
              <History size={40} className="text-teal-800" />
            </div>
            <p className="text-teal-500 font-black text-sm uppercase tracking-widest">কোনো উত্তোলনের ইতিহাস নেই</p>
            <p className="text-teal-700 text-[10px] mt-2">আপনার সকল উত্তোলন সফলভাবে এখানে জমা হবে।</p>
          </div>
        )}
      </div>

      {/* Details Modal */}
      <AnimatePresence>
        {selectedTrx && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedTrx(null)}>
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-[#0b5c4b] border border-teal-700/50 rounded-[40px] p-8 w-full max-w-sm relative shadow-2xl overflow-hidden shadow-orange-500/5"
              onClick={e => e.stopPropagation()}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
              <button 
                onClick={() => setSelectedTrx(null)}
                className="absolute top-6 right-6 text-teal-400 hover:text-white p-2 rounded-xl bg-white/5 transition-all"
              >
                <X size={20} />
              </button>

              <h3 className="text-xl font-black italic text-white flex items-center gap-2 mb-8">
                <FileSearch className="text-orange-500" size={24} /> 
                উত্তোলনের তথ্য
              </h3>

              <div className="flex flex-col items-center gap-2 mb-8 pb-8 border-b border-teal-800/50">
                <div className="w-20 h-20 bg-orange-500/10 rounded-[32px] flex items-center justify-center text-orange-500 mb-2 border border-orange-500/20">
                  <ArrowUpRight size={40} />
                </div>
                <p className="text-3xl font-black text-white italic tracking-tighter">৳{selectedTrx.amount.toLocaleString()}</p>
                <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 mt-1 ${getStatusStyle(selectedTrx.status)}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${
                    selectedTrx.status === 'completed' || selectedTrx.status === 'success' || selectedTrx.status === 'approved' ? 'bg-green-500' : 
                    selectedTrx.status === 'pending' ? 'bg-yellow-500 animate-pulse' : 'bg-red-500'
                  }`} />
                  {getStatusText(selectedTrx.status)}
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center text-sm border-b border-teal-800/30 pb-3">
                  <span className="text-teal-400 font-bold uppercase text-[10px] tracking-widest">Transaction ID</span>
                  <span className="font-mono text-xs text-white bg-black/20 px-2 py-1 rounded-lg">{selectedTrx.id}</span>
                </div>
                <div className="flex justify-between items-center text-sm border-b border-teal-800/30 pb-3">
                  <span className="text-teal-400 font-bold uppercase text-[10px] tracking-widest">পদ্ধতি (Method)</span>
                  <span className="font-black text-white uppercase">{selectedTrx.method || 'Bank'}</span>
                </div>
                {selectedTrx.accountNumber && (
                   <div className="flex justify-between items-center text-sm border-b border-teal-800/30 pb-3">
                     <span className="text-teal-400 font-bold uppercase text-[10px] tracking-widest">Account</span>
                     <span className="font-mono text-xs text-white">{selectedTrx.accountNumber}</span>
                   </div>
                )}
                <div className="flex justify-between items-center text-sm">
                  <span className="text-teal-400 font-bold uppercase text-[10px] tracking-widest">তারিখ (Date)</span>
                  <span className="font-bold text-teal-100 text-xs">{selectedTrx.date}</span>
                </div>
              </div>

              <button 
                onClick={() => setSelectedTrx(null)}
                className="w-full mt-10 bg-orange-600 hover:bg-orange-500 text-white font-black py-4 rounded-2xl transition-all active:scale-95 shadow-xl shadow-orange-950/20 uppercase tracking-widest text-xs"
              >
                বন্ধ করুন (Close)
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
