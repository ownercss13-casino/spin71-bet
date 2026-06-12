import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { getDb, handleFirestoreError, OperationType } from '../../services/firebase';

interface LiveBet {
  id: string;
  username: string;
  amount: number;
  multiplier?: number;
  timestamp: any;
}

export default function LiveBetsList() {
  const [bets, setBets] = useState<LiveBet[]>([]);

  useEffect(() => {
    const db = getDb();
    if (!db) {
       console.error("Firestore not initialized");
       return;
    }
    const q = query(collection(db, 'game_live_bets'), orderBy('timestamp', 'desc'), limit(10));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newBets = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as LiveBet[];
      setBets(newBets);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'game_live_bets');
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="flex flex-col gap-2 p-2 w-48 text-white h-full bg-[#141414] border-r border-white/5">
      <h3 className="text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1">Live Bets</h3>
      <div className="flex flex-col gap-1">
        {bets.map(bet => (
          <div key={bet.id} className="text-[10px] bg-white/5 p-1.5 rounded flex justify-between items-center text-gray-300">
            <span className="font-semibold">{bet.username}</span>
            <span className="font-black text-orange-500">${bet.amount.toFixed(2)}</span>
            {bet.multiplier && <span className="font-bold text-white italic">{bet.multiplier.toFixed(2)}x</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
