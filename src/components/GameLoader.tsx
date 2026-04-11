import React from 'react';
import { motion } from 'motion/react';
import { Loader2, Crown } from 'lucide-react';

interface GameLoaderProps {
  gameName?: string;
  provider?: string;
  logo?: string;
}

export default function GameLoader({ gameName, provider, logo }: GameLoaderProps) {
  return (
    <div className="absolute inset-0 z-[110] bg-[#0b0b0b] flex flex-col items-center justify-center p-6 text-center">
      {/* Background Glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-teal-500/10 rounded-full blur-[120px]"></div>
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-yellow-500/5 rounded-full blur-[80px]"></div>
      </div>

      <div className="relative z-10 flex flex-col items-center max-w-xs w-full">
        {/* Game Logo/Icon */}
        <div className="relative mb-8">
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-teal-900 to-black border border-teal-500/30 flex items-center justify-center shadow-2xl overflow-hidden">
            {logo ? (
              <img src={logo} alt={gameName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <div className="flex flex-col items-center gap-1">
                <Crown size={32} className="text-yellow-500" />
                <span className="text-[10px] font-black text-teal-400 uppercase tracking-tighter">SPIN71</span>
              </div>
            )}
          </div>
          <div className="absolute -inset-4 bg-teal-500/20 blur-2xl rounded-full -z-10 animate-pulse"></div>
        </div>

        {/* Game Info */}
        <h2 className="text-2xl font-black text-white mb-1 tracking-tight italic uppercase">{gameName || 'Loading Game'}</h2>
        <p className="text-teal-400/60 text-[10px] font-bold uppercase tracking-[0.3em] mb-8">{provider || 'Casino Game'}</p>

        {/* Progress Bar */}
        <div className="w-full h-1.5 bg-gray-900 rounded-full overflow-hidden border border-white/5 shadow-inner mb-4">
          <motion.div 
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ 
              duration: 3, 
              ease: "easeInOut",
              repeat: Infinity,
              repeatType: "loop"
            }}
            className="h-full bg-gradient-to-r from-teal-600 via-teal-400 to-teal-200 shadow-[0_0_15px_rgba(20,184,166,0.5)]"
          ></motion.div>
        </div>

        {/* Loading Message */}
        <div className="flex items-center gap-2 text-white/40 text-[10px] font-bold uppercase tracking-widest animate-pulse">
          <Loader2 size={12} className="animate-spin" />
          গেমটি লোড হচ্ছে...
        </div>

        {/* Tips or Fun Fact */}
        <div className="mt-12 p-4 bg-white/5 rounded-2xl border border-white/5 w-full">
          <p className="text-[9px] text-teal-200/50 font-medium leading-relaxed italic">
            "বড় জয়ের জন্য প্রস্তুত হন এবং ধৈর্য ধরুন। আমাদের গেমগুলো ফেয়ার প্লে নিশ্চিত করে।"
          </p>
        </div>
      </div>
    </div>
  );
}
