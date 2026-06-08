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

  return null;
}
