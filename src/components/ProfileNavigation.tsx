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
    <div className="flex px-4 mt-4 gap-2 overflow-x-auto no-scrollbar pb-2">
      {tabs.map((tab) => (
        <button 
          key={tab.id}
          onClick={() => handleSubTabChange(tab.id)}
          className={`flex-1 min-w-[80px] py-2 rounded-lg text-sm font-bold transition-colors ${activeSubTab === tab.id ? 'bg-yellow-500 text-black shadow-md' : 'bg-teal-800/50 text-teal-100 border border-teal-700'}`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
