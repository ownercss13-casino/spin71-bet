import React, { useState, useEffect } from 'react';
import { ArrowDownLeft, X, Clock, RefreshCw } from 'lucide-react';
import { db } from '../services/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import LoadingSpinner from './ui/LoadingSpinner';

interface DepositHistorySectionProps {
  userData: any;
}

export default function DepositHistorySection({ userData }: DepositHistorySectionProps) {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userData?.id) {
       setIsLoading(false);
       return;
    }
    const q = query(
      collection(db, 'transactions'),
      where('userId', '==', userData.id)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const trxs: any[] = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        let dateStr = 'Just now';
        let timestamp = 0;
        
        const createdAt = data.createdAt;
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

        if (data.type === 'deposit') {
          trxs.push({ 
            id: doc.id, 
            ...data,
            date: dateStr,
            _timestamp: timestamp
          });
        }
      });
      // Sort in descending order
      trxs.sort((a, b) => b._timestamp - a._timestamp);
      setTransactions(trxs);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [userData?.id]);

  if (isLoading) {
    return (
      <div className="p-10">
        <LoadingSpinner size="md" message="ডেটা লোড হচ্ছে..." />
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      <h3 className="text-lg font-black text-white italic uppercase tracking-tighter flex items-center gap-2">
        <ArrowDownLeft size={20} className="text-green-400" />
        জমা ইতিহাস (Deposit History)
      </h3>

      {transactions.length > 0 ? (
        <div className="overflow-x-auto rounded-[24px] border border-stone-800 bg-stone-900 shadow-lg">
          <table className="w-full text-xs text-left">
            <thead className="bg-stone-950 text-stone-400 font-bold uppercase tracking-widest text-[10px]">
              <tr>
                <th className="px-4 py-3">Method</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map(trx => (
                <tr key={trx.id} className="border-b border-stone-800 hover:bg-stone-800 transition-colors">
                  <td className="px-4 py-3 font-bold text-white">{trx.method}</td>
                  <td className="px-4 py-3 text-stone-300 font-medium whitespace-nowrap">{trx.date}</td>
                  <td className="px-4 py-3 font-black text-green-400 italic">
                    +{trx.amount}৳
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest inline-flex items-center ${
                      trx.status === 'completed' || trx.status === 'approved' ? 'bg-green-500/10 text-green-400' : 
                      trx.status === 'pending' ? 'bg-orange-500/10 text-orange-400' : 
                      'bg-red-500/10 text-red-400'
                    }`}>
                      {trx.status}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-stone-900 p-8 rounded-[24px] border border-stone-800 text-center">
          <p className="text-stone-500 text-sm font-medium">কোনো ডিপোজিট রেকর্ড নেই</p>
        </div>
      )}
    </div>
  );
}
