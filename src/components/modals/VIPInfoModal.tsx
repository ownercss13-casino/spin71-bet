import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Trophy, CheckCircle2, Star, ShieldCheck, Gem, Hexagon, Zap, Award } from 'lucide-react';
import { VIP_LEVELS } from '../../constants/vipLevels';
import VIPBadge from '../VIPBadge';

interface VIPInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPoints: number;
  currentLevel: number;
}

export default function VIPInfoModal({ isOpen, onClose, currentPoints, currentLevel }: VIPInfoModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-lg bg-[var(--bg-deep)] rounded-[40px] overflow-hidden border border-[var(--border-color)] shadow-2xl"
          >
            {/* Header */}
            <div className="p-8 border-b border-[var(--border-color)] flex justify-between items-center bg-gradient-to-r from-yellow-500/10 to-transparent">
              <div>
                <h2 className="text-2xl font-black text-[var(--text-main)] italic tracking-tighter flex items-center gap-3">
                  <Trophy className="text-yellow-500" />
                  VIP লেভেল গাইড
                </h2>
                <p className="text-[var(--text-muted)] text-[10px] font-bold uppercase tracking-widest mt-1">লেভেল অনুযায়ী বিশেষ সুবিধাগুলো দেখুন</p>
              </div>
              <button 
                onClick={onClose}
                className="p-3 bg-[var(--bg-card)] rounded-2xl text-[var(--text-muted)] hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="p-6 max-h-[60vh] overflow-y-auto space-y-4 custom-scrollbar">
              <div className="bg-blue-500/10 p-4 rounded-2xl border border-blue-500/20 mb-4">
                <div className="flex gap-3">
                  <div className="bg-blue-500 p-2 rounded-xl h-fit">
                    <Zap className="text-white fill-white" size={16} />
                  </div>
                  <div>
                    <h4 className="text-blue-400 font-black text-sm uppercase italic">পয়েন্ট আয় করার নিয়ম</h4>
                    <p className="text-[var(--text-muted)] text-[10px] font-medium leading-relaxed mt-1">
                      প্রতি <span className="text-white font-bold">৳১০০</span> ডিপোজিটে আপনি পাবেন <span className="text-white font-bold">১টি VIP পয়েন্ট</span>। পয়েন্ট যত বেশি হবে, আপনার VIP লেভেল তত উপরে উঠবে এবং বেনিফিটগুলো বৃদ্ধি পাবে।
                    </p>
                  </div>
                </div>
              </div>

              {VIP_LEVELS.map((vip, index) => {
                const isCurrent = currentLevel === vip.id;
                const isUnlocked = currentPoints >= vip.minPoints;

                return (
                  <div 
                    key={vip.id}
                    className={`relative p-5 rounded-3xl border transition-all duration-300 ${
                      isCurrent 
                        ? 'bg-[var(--bg-card)] border-yellow-500/50 shadow-[0_0_20px_rgba(234,179,8,0.1)]' 
                        : isUnlocked
                          ? 'bg-[var(--bg-card)] border-[var(--border-color)] opacity-100'
                          : 'bg-[var(--bg-card)] border-[var(--border-color)] opacity-60 grayscale-[0.5]'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl bg-gradient-to-br ${vip.bgGradient}`}>
                          {vip.id === 0 && <Hexagon className="text-white" size={18} />}
                          {vip.id === 1 && <ShieldCheck className="text-white" size={18} />}
                          {vip.id === 2 && <Award className="text-white" size={18} />}
                          {vip.id === 3 && <Trophy className="text-white" size={18} />}
                          {vip.id === 4 && <Gem className="text-white" size={18} />}
                        </div>
                        <div>
                          <h3 className="text-[var(--text-main)] font-black italic tracking-tight">{vip.name}</h3>
                          <p className="text-[var(--text-muted)] text-[10px] font-bold">নুন্যতম পয়েন্ট: {vip.minPoints.toLocaleString()}</p>
                        </div>
                      </div>
                      {isCurrent && (
                        <div className="bg-yellow-500 text-black text-[8px] font-black px-2 py-1 rounded-full uppercase tracking-widest">আপনার লেভেল</div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center gap-2 bg-[var(--bg-deep)] p-2 rounded-xl border border-[var(--border-color)]">
                        <CheckCircle2 size={12} className="text-green-500" />
                        <span className="text-[10px] text-[var(--text-muted)] font-bold">রিবেট: <span className="text-white">{vip.rebatePercent}%</span></span>
                      </div>
                      <div className="flex items-center gap-2 bg-[var(--bg-deep)] p-2 rounded-xl border border-[var(--border-color)]">
                        <CheckCircle2 size={12} className="text-green-500" />
                        <span className="text-[10px] text-[var(--text-muted)] font-bold">উত্তোলন: <span className="text-white">৳{vip.withdrawLimit / 1000}k/দিন</span></span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="p-6 bg-[var(--bg-card)] border-t border-[var(--border-color)]">
              <button 
                onClick={onClose}
                className="w-full py-4 bg-gradient-to-r from-yellow-500 to-yellow-600 text-black font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-yellow-500/20 active:scale-95 transition-all text-sm"
              >
                ঠিক আছে
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
