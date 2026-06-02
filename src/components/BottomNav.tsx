import React from 'react';
import { Home, Gift, Users, User, Trophy, Wallet, Shield, Bell } from 'lucide-react';

interface TabItem {
  id: string;
  icon: React.ElementType;
  label: string;
  badge?: string | number;
}

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onToggleNotifications: () => void;
  unreadNotificationsCount?: number;
  isAdmin?: boolean;
}

const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange, onToggleNotifications, unreadNotificationsCount, isAdmin }) => {
  const tabs: TabItem[] = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'bonus', icon: Gift, label: 'Bonus Center' },
    { id: 'wallet', icon: Wallet, label: 'Wallet' },
    { id: 'invite', icon: Users, label: 'আমন্ত্রণ' },
    { id: 'profile', icon: User, label: 'Member' },
  ];

  if (isAdmin) {
    tabs.push({ id: 'admin', icon: Shield, label: 'Admin' });
  }

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#14253a] border-t border-[#1e3a5f] shadow-[0_-4px_20px_rgba(0,0,0,0.3)] z-50">
      <div className="flex justify-around items-center h-16">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors relative ${
              activeTab === tab.id ? 'text-[#00e5ff]' : 'text-[#90a4ae] hover:text-white'
            }`}
          >
            <tab.icon size={22} />
            <span className={`text-[10px] font-bold ${activeTab === tab.id ? 'opacity-100' : 'opacity-70'}`}>
              {tab.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default BottomNav;
