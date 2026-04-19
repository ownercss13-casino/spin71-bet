import React from 'react';
import { motion } from 'motion/react';
import { LayoutDashboard, User, Wallet, History, CreditCard, Link as LinkIcon, Shield, UserPlus } from 'lucide-react';

interface ProfileNavigationProps {
  activeSubTab: string;
  handleSubTabChange: (tab: string) => void;
}

export default function ProfileNavigation({ activeSubTab, handleSubTabChange }: ProfileNavigationProps) {
  const tabs = [
    { id: 'dashboard', label: 'ড্যাশবোর্ড', icon: LayoutDashboard },
    { id: 'profile', label: 'প্রোফাইল', icon: User },
    { id: 'withdraw', label: 'উত্তোলন', icon: Wallet },
    { id: 'history', label: 'লেনদেন', icon: History },
    { id: 'withdrawHistory', label: 'উত্তোলন ইতিহাস', icon: CreditCard },
    { id: 'invite', label: 'আমন্ত্রণ', icon: UserPlus },
    { id: 'links', label: 'আমার লিংক', icon: LinkIcon },
    { id: 'security', label: 'নিরাপত্তা', icon: Shield },
  ];

  return (
    <div className="flex px-4 mt-4 gap-3 overflow-x-auto no-scrollbar pb-4">
      {tabs.map((tab) => (
        <motion.button 
          key={tab.id}
          onClick={() => handleSubTabChange(tab.id)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`relative flex flex-col items-center justify-center min-w-[90px] py-3 px-2 rounded-2xl text-[10px] font-black uppercase tracking-tighter transition-all duration-300 gap-1.5 ${
            activeSubTab === tab.id 
              ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-black shadow-[0_8px_20px_rgba(234,179,8,0.3)]' 
              : 'bg-teal-900/40 text-teal-300 border border-teal-700/50 hover:bg-teal-800/60'
          }`}
        >
          <tab.icon size={18} className={activeSubTab === tab.id ? 'text-black' : 'text-teal-400'} />
          <span className="whitespace-nowrap">{tab.label}</span>
          {activeSubTab === tab.id && (
            <motion.div
              className="absolute bottom-1 w-1.5 h-1.5 bg-black rounded-full"
              layoutId="nav-pill"
            />
          )}
        </motion.button>
      ))}
    </div>
  );
}
