import React from 'react';
import { Home, Gift, Share2, Wallet, User } from 'lucide-react';

interface TabItem {
  id: string;
  icon: React.ElementType;
  label: string;
  badge?: string | number;
}

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange }) => {
  const tabs: TabItem[] = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'bonus', icon: Gift, label: 'Bonus', badge: 14 },
    { id: 'invite', icon: Share2, label: 'Invite' },
    { id: 'deposit', icon: Wallet, label: 'Deposit', badge: '+5%' },
    { id: 'profile', icon: User, label: 'Profile' },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0d9488] border-t border-white/10 shadow-[0_-4px_20px_rgba(0,0,0,0.1)] z-50">
      <div className="flex justify-around items-center h-16">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors relative ${
                isActive ? 'text-white' : 'text-teal-200 hover:text-white'
              }`}
            >
              <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              <span className={`text-[10px] font-bold ${isActive ? 'opacity-100' : 'opacity-70'}`}>
                {tab.label}
              </span>
              {tab.badge && (
                <div className={`absolute top-2 right-2 ${typeof tab.badge === 'string' ? 'bg-green-500' : 'bg-red-600'} text-white text-[9px] font-black px-1 rounded-full border border-[#062e24] shadow-lg`}>
                  {tab.badge}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNav;
