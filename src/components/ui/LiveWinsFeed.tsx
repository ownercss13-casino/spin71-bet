import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Star, Zap } from 'lucide-react';

const WINNERS = [
  { name: 'Rafat**', amount: 500, game: 'Slot' },
  { name: 'Sujon**', amount: 1200, game: 'Rocket' },
  { name: 'Admin**', amount: 5000, game: 'Jackpot' },
  { name: 'Mim**', amount: 300, game: 'Slot' },
  { name: 'Arif**', amount: 850, game: 'Rocket' },
];

const LiveWinsFeed: React.FC = () => {
  const [index, setIndex] = React.useState(0);

  React.useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % WINNERS.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const current = WINNERS[index];

  return (
    <div className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 overflow-hidden relative group">
      <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-yellow-500/50 to-transparent"></div>
      
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
           <Trophy size={16} className="text-yellow-500" />
           <span className="text-[10px] font-black uppercase tracking-widest text-white/60">Live Wins</span>
        </div>
        <div className="flex items-center gap-1">
           <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
           <span className="text-[8px] font-bold text-green-500 uppercase">Live</span>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
           key={index}
           initial={{ y: 20, opacity: 0 }}
           animate={{ y: 0, opacity: 1 }}
           exit={{ y: -20, opacity: 0 }}
           className="flex items-center justify-between"
        >
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center border border-white/10 group-hover:border-yellow-500/30 transition-colors">
                {current.game === 'Slot' ? <Zap size={20} className="text-yellow-500" /> : <Star size={20} className="text-red-500" />}
              </div>
              <div>
                 <div className="text-sm font-bold text-white">{current.name}</div>
                 <div className="text-[10px] text-gray-500 uppercase font-black tracking-tighter">{current.game}</div>
              </div>
           </div>

           <div className="text-right">
              <div className="text-sm font-black text-yellow-500">৳{current.amount}</div>
              <div className="text-[8px] text-gray-600 uppercase font-bold">Winning Amount</div>
           </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default LiveWinsFeed;
