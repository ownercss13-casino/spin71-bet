import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldAlert, Clock, LogOut, CheckCircle2 } from 'lucide-react';

interface AutoLogoutModalProps {
  isOpen: boolean;
  onKeepLoggedIn: () => void;
  onLogout: () => void;
  secondsLeft: number;
}

export default function AutoLogoutModal({ 
  isOpen, 
  onKeepLoggedIn, 
  onLogout, 
  secondsLeft 
}: AutoLogoutModalProps) {
  
  // Calculate percentage of remaining time (out of 60 seconds)
  const percentLeft = Math.max(0, Math.min(100, (secondsLeft / 60) * 100));

  return (
    <AnimatePresence>
      {isOpen && (
        <div id="auto-logout-overlay" className="fixed inset-0 z-[120] flex items-center justify-center px-4">
          {/* Backdrop */}
          <motion.div
            id="auto-logout-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onKeepLoggedIn}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />
          
          {/* Modal Container */}
          <motion.div
            id="auto-logout-container"
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-md bg-[#0d1a29] rounded-[40px] overflow-hidden border border-[#23354b] shadow-2xl z-10"
          >
            {/* Header */}
            <div className="p-6 border-b border-[#1e2f42] flex items-center gap-3 bg-gradient-to-r from-red-500/10 to-transparent">
              <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center text-red-400">
                <ShieldAlert size={22} className="animate-pulse" />
              </div>
              <div>
                <h2 className="text-xl font-black text-white italic tracking-tight">
                  নিষ্ক্রিয়তার সতর্কতা!
                </h2>
                <p className="text-xs text-red-300 font-bold uppercase tracking-widest mt-0.5">
                  Security Session Timeout
                </p>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              <div className="space-y-3 text-center">
                <p className="text-gray-300 text-sm font-medium leading-relaxed">
                  আপনি শেষ <span className="text-yellow-400 font-bold">২৯ মিনিট</span> ধরে নিষ্ক্রিয় রয়েছেন। অতিরিক্ত নিরাপত্তার স্বার্থে ৩০ মিনিট পর স্বয়ংক্রিয়ভাবে লগআউট করা হয়।
                </p>
                <div className="p-3.5 bg-yellow-500/10 rounded-2xl border border-yellow-500/20 flex gap-3 items-center justify-center">
                  <Clock size={18} className="text-yellow-400 shrink-0" />
                  <p className="text-yellow-300 text-xs font-bold font-mono">
                    স্বয়ংক্রিয় লগআউট হতে বাকি: <span className="text-white text-sm tracking-widest font-black">{secondsLeft}</span> সেকেন্ড
                  </p>
                </div>
              </div>

              {/* Progress Bar Container */}
              <div className="w-full bg-[#14253a] h-2.5 rounded-full overflow-hidden border border-[#23354b]">
                <motion.div 
                  id="auto-logout-progress-bar"
                  className={`h-full rounded-full transition-all duration-1000 ${
                    secondsLeft <= 15 
                      ? 'bg-gradient-to-r from-red-500 to-rose-600 animate-pulse' 
                      : secondsLeft <= 30 
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500' 
                      : 'bg-gradient-to-r from-teal-400 to-emerald-500'
                  }`}
                  style={{ width: `${percentLeft}%` }}
                />
              </div>

              <div className="text-[11px] text-gray-400 leading-snug space-y-1.5 p-3.5 bg-[#14253a]/20 rounded-2xl border border-[#1e2f42]/50">
                <div className="flex gap-2 items-start text-xs font-semibold text-gray-300">
                  <span className="w-1.5 h-1.5 mt-1.5 rounded-full bg-teal-400 shrink-0" />
                  <span>কোনো গেম সেশন বা লেনদেনের সুরক্ষার স্বার্থে এই নিয়ম প্রযোজ্য।</span>
                </div>
                <div className="flex gap-2 items-start text-xs font-semibold text-gray-300">
                  <span className="w-1.5 h-1.5 mt-1.5 rounded-full bg-teal-400 shrink-0" />
                  <span>সেশন ধরে রাখতে চাইলে নিচে লগইন বজায় রাখুন ক্লিক করুন।</span>
                </div>
              </div>
            </div>

            {/* Actions/Footer */}
            <div className="p-6 bg-[#14253a]/60 border-t border-[#1e2f42] flex flex-col gap-2.5 sm:flex-row sm:justify-between sm:items-center">
              <button 
                id="btn-auto-logout"
                onClick={onLogout}
                className="px-5 py-3 bg-red-500/10 hover:bg-red-500/20 active:scale-95 text-red-400 hover:text-red-300 text-xs font-black uppercase rounded-2xl transition-all flex items-center justify-center gap-1.5 border border-red-500/20 w-full sm:w-auto"
              >
                <LogOut size={14} /> এখনই লগআউট
              </button>
              
              <button 
                id="btn-keep-logged-in"
                onClick={onKeepLoggedIn}
                className="px-6 py-3.5 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 active:scale-95 text-white text-xs font-black uppercase rounded-2xl transition-all shadow-md shadow-teal-500/20 flex items-center justify-center gap-1.5 w-full sm:w-auto"
              >
                <CheckCircle2 size={14} /> লগইন বজায় রাখুন
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
