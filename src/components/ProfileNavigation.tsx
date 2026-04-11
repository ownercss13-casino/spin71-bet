import React from 'react';

interface ProfileNavigationProps {
  activeSubTab: string;
  handleSubTabChange: (tab: string) => void;
}

export default function ProfileNavigation({ activeSubTab, handleSubTabChange }: ProfileNavigationProps) {
  const tabs = [
    { id: 'overview', label: 'ড্যাশবোর্ড' },
    { id: 'profile', label: 'প্রোফাইল' },
    { id: 'withdraw', label: 'উত্তোলন' },
    { id: 'history', label: 'লেনদেন ইতিহাস' },
    { id: 'withdrawHistory', label: 'উত্তোলন ইতিহাস' },
    { id: 'links', label: 'আমার লিংক' },
  ];

  return (
    <div className="flex px-4 mt-4 gap-2 overflow-x-auto no-scrollbar pb-2 transition-colors duration-300">
      {tabs.map((tab) => (
        <button 
          key={tab.id}
          onClick={() => handleSubTabChange(tab.id)}
          className={`flex-1 min-w-[80px] py-2 rounded-lg text-sm font-bold transition-all duration-300 ${activeSubTab === tab.id ? 'bg-yellow-500 text-black shadow-md' : 'bg-[var(--bg-surface)] text-[var(--text-muted)] border border-[var(--border-color)]'}`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
