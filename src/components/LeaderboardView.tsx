import React from 'react';
import { Trophy } from 'lucide-react';

export default function LeaderboardView() {
  return (
    <div className="p-4 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-gradient-to-r from-yellow-600 to-yellow-800 p-4 rounded-2xl shadow-lg flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Trophy className="text-white" size={32} />
          <div>
            <h2 className="text-white font-black text-xl italic uppercase tracking-tighter">Leaderboard</h2>
            <p className="text-yellow-200 text-[10px] font-bold">Top Winners of the Week</p>
          </div>
        </div>
        <div className="bg-black/20 px-3 py-1 rounded-full border border-white/10">
          <span className="text-white font-black text-sm italic">৳ 5.2M Pool</span>
        </div>
      </div>

      <div className="bg-[#1b1b1b] rounded-2xl border border-white/5 overflow-hidden">
        {[
          { name: "Sabbir_99", win: "৳ 1,24,500", game: "Aviator", rank: 1 },
          { name: "Rakib_H", win: "৳ 98,200", game: "Super Ace", rank: 2 },
          { name: "Mitu_Khan", win: "৳ 85,400", game: "Magic Card", rank: 3 },
          { name: "Arif_77", win: "৳ 62,100", game: "Crazy Time", rank: 4 },
          { name: "Sumon_Pro", win: "৳ 45,800", game: "Aviator", rank: 5 },
          { name: "Nila_22", win: "৳ 38,900", game: "Super Ace 2", rank: 6 },
          { name: "Joy_Bet", win: "৳ 32,400", game: "Aviator", rank: 7 },
          { name: "Emon_X", win: "৳ 28,500", game: "Slot Master", rank: 8 },
        ].map((winner, i) => (
          <div key={i} className="flex items-center justify-between p-4 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
            <div className="flex items-center gap-4">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm ${
                winner.rank === 1 ? 'bg-yellow-500 text-black shadow-[0_0_10px_rgba(234,179,8,0.5)]' :
                winner.rank === 2 ? 'bg-gray-300 text-black' :
                winner.rank === 3 ? 'bg-orange-500 text-black' :
                'bg-gray-800 text-gray-400'
              }`}>
                {winner.rank}
              </div>
              <div>
                <p className="text-white font-bold text-sm">{winner.name}</p>
                <p className="text-gray-500 text-[10px] uppercase font-bold">{winner.game}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-green-400 font-black text-sm">{winner.win}</p>
              <p className="text-gray-600 text-[9px] font-bold">2 mins ago</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
