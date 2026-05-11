import React from 'react';
import { Home, Gift, Users, User, Trophy } from 'lucide-react';

interface TabItem {
  id: string;
  icon: React.ElementType;
  label: string;
  badge?: string | number;
}

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  unreadNotificationsCount?: number;
}

const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange, unreadNotificationsCount }) => {
  const tabs: TabItem[] = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'bonus', icon: Gift, label: 'Promotion' },
    { id: 'invite', icon: Users, label: 'Agent' },
    { id: 'prize', icon: Trophy, label: 'Prize' },
    { id: 'profile', icon: User, label: 'Member' },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#14253a] border-t border-[#1e3a5f] shadow-[0_-4px_20px_rgba(0,0,0,0.3)] z-50">
      <div className="flex justify-around items-center h-16">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const isAgent = tab.id === 'invite';
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors relative ${
                isActive ? 'text-[#00e5ff]' : 'text-[#90a4ae] hover:text-white'
              }`}
            >
              <Icon size={isAgent ? 26 : 22} className={isAgent ? "text-[#fdd835]" : ""} />
              <span className={`text-[10px] font-bold ${isActive ? 'opacity-100' : 'opacity-70'}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNav;
