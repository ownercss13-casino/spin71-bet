import React from 'react';
import { motion } from 'motion/react';
import { ChevronRight, Info, Zap } from 'lucide-react';
import { VIP_LEVELS, getVIPLevel as getVIPLevelByPoints } from '../constants/vipLevels';
import VIPBadge from './VIPBadge';

interface VIPCardProps {
  points: number;
  level: number;
  onClick?: () => void;
}

export default function VIPCard({ points = 0, level = 0, onClick }: VIPCardProps) {
  const currentVIP = VIP_LEVELS[level] || VIP_LEVELS[0];
  const nextVIP = VIP_LEVELS[level + 1];
  
  const pointsToNext = nextVIP ? nextVIP.minPoints - points : 0;
  const progress = nextVIP 
    ? Math.min(100, Math.max(0, ((points - currentVIP.minPoints) / (nextVIP.minPoints - currentVIP.minPoints)) * 100))
    : 100;

  return (
    <motion.div 
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`relative overflow-hidden rounded-3xl p-6 cursor-pointer bg-gradient-to-br ${currentVIP.bgGradient} shadow-2xl border border-white/20`}
    >
      {/* Background decoration */}
      <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-white/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 -ml-8 -mb-8 w-24 h-24 bg-black/10 rounded-full blur-2xl" />
      
      <div className="relative z-10">
        <div className="flex justify-between items-start mb-6">
          <div>
            <p className="text-white/60 text-[10px] uppercase font-bold tracking-widest mb-1 italic">ইউজার লেভেল</p>
            <h3 className="text-white text-2xl font-black italic tracking-tighter leading-none">{currentVIP.name}</h3>
          </div>
          <div className="bg-white/20 p-2 rounded-xl backdrop-blur-md">
            <Zap className="text-white fill-white" size={24} />
          </div>
        </div>

        <div className="mb-6">
          <div className="flex justify-between items-end mb-2">
            <div className="flex items-center gap-2">
              <p className="text-white font-black text-3xl leading-none">{points.toLocaleString()}</p>
              <p className="text-white/60 text-[10px] font-bold uppercase mt-2">VIP পয়েণ্ট</p>
            </div>
            {nextVIP && (
              <p className="text-white/70 text-[10px] font-bold italic tracking-tight">
                পরবর্তী ধাপ: {nextVIP.name}
              </p>
            )}
          </div>
          
          <div className="h-2 w-full bg-black/20 rounded-full overflow-hidden border border-white/10">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              className="h-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)]"
            />
          </div>
          
          {nextVIP && (
            <p className="text-white/50 text-[9px] font-medium mt-2 italic text-right">
              {pointsToNext.toLocaleString()} পয়েন্ট হলে আপনি {nextVIP.name} লেভেলে উন্নীত হবেন
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/10 rounded-2xl p-3 border border-white/10 backdrop-blur-sm">
            <p className="text-white/50 text-[8px] uppercase font-bold mb-1">রিবেট বোনাস</p>
            <p className="text-white font-black text-lg italic leading-none">{currentVIP.rebatePercent}%</p>
          </div>
          <div className="bg-white/10 rounded-2xl p-3 border border-white/10 backdrop-blur-sm">
            <p className="text-white/50 text-[8px] uppercase font-bold mb-1">সর্বোচ্চ উত্তোলন/দিন</p>
            <p className="text-white font-black text-sm italic leading-none">৳{currentVIP.withdrawLimit.toLocaleString()}</p>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between text-white/70 text-[10px] font-bold">
          <div className="flex items-center gap-1.5 bg-black/20 px-3 py-1.5 rounded-full border border-white/5">
            <Info size={12} />
            <span>বিস্তারিত সুবিধা দেখুন</span>
          </div>
          <ChevronRight size={16} />
        </div>
      </div>
    </motion.div>
  );
}
