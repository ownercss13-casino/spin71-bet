import React, { useState, useEffect } from 'react';
import { User } from 'lucide-react';

interface PlayerBet {
  name: string;
  amount: number;
  multiplier?: number;
}

export default function DummyPlayersList({ gameState, currentMultiplier }: { gameState: string, currentMultiplier: number }) {
  const [players, setPlayers] = useState<PlayerBet[]>([]);

  useEffect(() => {
    if (gameState === 'waiting') {
      // generate new random players
      const newPlayers: PlayerBet[] = Array.from({ length: 15 }, () => ({
        name: `***${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
        amount: Math.floor(Math.random() * 500) + 10,
      }));
      setPlayers(newPlayers);
    } else if (gameState === 'in_progress') {
       // randomly cashout players based on multiplier
       setPlayers(prev => prev.map(p => {
         if (!p.multiplier && Math.random() < 0.05 * currentMultiplier) {
           return { ...p, multiplier: currentMultiplier };
         }
         return p;
       }));
    }
  }, [gameState, currentMultiplier]);

  return (
    <div className="w-80 hidden lg:flex flex-col bg-[#141414] border-r border-white/5 h-full">
      <div className="p-3 border-b border-white/5 flex items-center justify-between">
        <h3 className="text-white font-bold text-sm">All Bets</h3>
        <span className="text-gray-400 text-sm">{players.length}</span>
      </div>
      <div className="flex-1 overflow-y-auto no-scrollbar p-2 space-y-1">
        {players.sort((a,b) => (b.multiplier || 0) - (a.multiplier || 0)).map((p, i) => (
          <div key={i} className={`flex items-center justify-between p-2 rounded-lg ${p.multiplier ? 'bg-[#ff5722]/10 border border-[#ff5722]/20' : 'bg-white/5 border border-transparent'}`}>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-black/50 flex items-center justify-center">
                <User size={12} className="text-gray-400" />
              </div>
              <span className="text-xs text-gray-300">{p.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-right">
                <div className="text-xs text-white">৳{p.amount.toFixed(2)}</div>
              </div>
              <div className="w-12 text-right">
                {p.multiplier && (
                  <span className="text-xs font-black text-[#ff5722]">{p.multiplier.toFixed(2)}x</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
