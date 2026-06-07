import React, { useState, useEffect } from 'react';
import { Clock, ChevronRight, X, History } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Home, Wallet, User, Users, BookOpen, Settings, RefreshCw, 
  Shield, Star, HelpCircle, Activity 
} from 'lucide-react';

interface RecentlyViewedProps {
  activeTab: string;
  onNavigate: (tab: string) => void;
}

const TAB_META: Record<string, { label: string, icon: any }> = {
  home: { label: 'হোম (Home)', icon: Home },
  wallet: { label: 'ওয়ালেট (Wallet)', icon: Wallet },
  profile: { label: 'প্রোফাইল (Profile)', icon: User },
  invite: { label: 'আমন্ত্রণ (Invite)', icon: Users },
  learning: { label: 'লার্নিং (Learning)', icon: BookOpen },
  settings: { label: 'সেটিংস (Settings)', icon: Settings },
  deposit: { label: 'জমা (Deposit)', icon: Wallet },
  history: { label: 'ইতিহাস (History)', icon: RefreshCw },
  admin: { label: 'Admin Panel', icon: Shield },
  slot: { label: 'Native Slot', icon: Star },
  aviator: { label: 'Aviator', icon: Star },
  leaderboard: { label: 'লিডারবোর্ড', icon: Star },
  bonus: { label: 'বোনাস (Bonus)', icon: Star },
  analytics: { label: 'অ্যানালিটিক্স', icon: Activity },
  faq: { label: 'FAQ', icon: HelpCircle },
  terms: { label: 'শর্তাবলী', icon: Shield }
};
const IGNORED_TABS = ['admin', 'terms'];

export default function RecentlyViewed({ activeTab, onNavigate }: RecentlyViewedProps) {
  const [history, setHistory] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!activeTab || IGNORED_TABS.includes(activeTab)) return;

    setHistory(prev => {
      // Remove the current tab if it exists in history so we can move it to the front
      const filtered = prev.filter(t => t !== activeTab);
      // Add current tab to the front
      const updated = [activeTab, ...filtered];
      // Keep only last 6 items so we can show 5
      return updated.slice(0, 6);
    });
  }, [activeTab]);

  // The very first item is the CURRENT tab, so recent tabs are index 1 onwards
  const recentTabs = history.slice(1);

  if (recentTabs.length === 0) return null;

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-[85px] left-4 z-[100] w-10 h-10 bg-gray-900/80 backdrop-blur-md border border-white/10 text-white rounded-full flex items-center justify-center shadow-xl hover:bg-gray-800 transition-all mb-safe"
      >
        <Clock size={18} />
      </button>

      {/* Slide-Up Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-[300] backdrop-blur-sm"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 max-w-[512px] mx-auto bg-[#1a1c24] border-t border-white/10 rounded-t-3xl z-[301] p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2 text-white">
                  <History className="text-teal-400" size={20} />
                  <h3 className="font-bold text-lg">Recently Viewed</h3>
                </div>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-gray-400"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-3">
                {recentTabs.map((tabId, idx) => {
                  const meta = TAB_META[tabId] || { label: tabId, icon: Clock };
                  const Icon = meta.icon;
                  return (
                    <button
                      key={`${tabId}-${idx}`}
                      onClick={() => {
                        onNavigate(tabId);
                        setIsOpen(false);
                      }}
                      className="w-full flex items-center gap-4 p-3.5 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 active:scale-[0.98] transition-all group"
                    >
                      <div className="w-10 h-10 rounded-full bg-black/40 border border-white/5 flex items-center justify-center text-gray-400 group-hover:text-teal-400 transition-colors">
                        <Icon size={18} />
                      </div>
                      <span className="flex-1 text-left text-sm font-medium text-gray-200 group-hover:text-white transition-colors">
                        {meta.label}
                      </span>
                      <ChevronRight size={16} className="text-gray-600 group-hover:text-gray-400 transition-colors" />
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
