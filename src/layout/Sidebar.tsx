import React from 'react';
import { X, User, Copy, Home, Users, Send, Star, Wallet, RefreshCw, LogOut, Moon, Sun, MessageCircle, Facebook, Shield, BookOpen, Settings, Headset, MessageSquare } from 'lucide-react';
import { motion } from 'motion/react';

import { useLanguage } from '../context/LanguageContext';
import { LOCALIZED_STRINGS } from '../constants/localization';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  userData: any;
  activeTab: string;
  handleTabChange: (tab: any) => void;
  handleGameSelect: (game: any) => void;
  handleLogout: () => void;
  showToast: (msg: string, type?: any) => void;
  casinoName?: string;
  telegramLink?: string;
  whatsappLink?: string;
  facebookLink?: string;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  appLogo?: string;
  onInstallApp?: () => void;
}

export default function Sidebar({
  isOpen,
  onClose,
  userData,
  activeTab,
  handleTabChange,
  handleGameSelect,
  handleLogout,
  showToast,
  casinoName = "SPIN71 BET✨",
  telegramLink = "",
  whatsappLink = "",
  facebookLink = "",
  theme,
  toggleTheme,
  appLogo,
  onInstallApp
}: SidebarProps) {
  const { language: lang, strings } = useLanguage();

  const games = [
    { id: '2', name: 'Rocket', icon: Star },
    { id: '3', name: 'Slots', icon: Star },
  ];

  const DownloadIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
  );

  return (
    <div 
      className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm transition-opacity"
      onClick={onClose}
    >
      <motion.div 
        initial={{ x: -300 }}
        animate={{ x: 0 }}
        exit={{ x: -300 }}
        className="absolute left-0 top-0 bottom-0 w-64 bg-[var(--bg-card)] shadow-2xl flex flex-col transition-colors duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sidebar Header */}
        <div className="p-6 bg-gradient-to-b from-[#0f766e] to-[var(--bg-card)] border-b border-teal-600/50">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <img 
                src={appLogo || 'https://www.image2url.com/r2/default/images/1781024598371-46bd7cc9-4b5f-49cd-b4b3-60d4d200534a.png'} 
                onError={(e) => {
                  e.currentTarget.src = 'https://www.image2url.com/r2/default/images/1781024598371-46bd7cc9-4b5f-49cd-b4b3-60d4d200534a.png';
                }}
                alt="Logo" 
                className="h-8 max-w-[140px] object-contain cursor-pointer hover:scale-105 transition-all"
              />
            </div>
            <button onClick={onClose} className="text-teal-200 hover:text-white">
              <X size={24} />
            </button>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-teal-800 border-2 border-yellow-500 flex items-center justify-center overflow-hidden">
              {userData?.profilePictureUrl ? (
                <img src={userData.profilePictureUrl} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User size={24} className="text-white" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <p className="text-[var(--text-main)] font-bold text-sm truncate max-w-[100px]">{userData?.username || 'Player_SPIN71'}</p>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(userData?.username || 'Player_SPIN71');
                    showToast("ইউজারনেম কপি করা হয়েছে", "success");
                  }}
                  className="p-1 bg-white/10 hover:bg-white/20 rounded transition-colors text-teal-200"
                  title="Copy Username"
                >
                  <Copy size={12} />
                </button>
              </div>
              <p className="text-[var(--text-muted)] text-[10px]">ID: {userData?.numericId || userData?.id?.substring(0, 8) || '84729104'}</p>
            </div>
          </div>
        </div>

        {/* Sidebar Links */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto no-scrollbar">
          <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-4 mb-2">
            Navigation
          </p>
          {[
            { id: 'home', icon: Home, label: strings.navHome },
            { id: 'wallet', icon: Wallet, label: strings.navWallet },
            { id: 'profile', icon: User, label: strings.navProfile },
            { id: 'invite', icon: Users, label: strings.navInvite },
            { id: 'chat', icon: MessageSquare, label: lang === 'bn' ? 'কমিউনিটি চ্যাট (Chat)' : 'Community Chat' },
            { id: 'support', icon: Headset, label: lang === 'bn' ? 'লাইভ সাপোর্ট (Live Chat)' : 'Live Chat' },
            { id: 'learning', icon: BookOpen, label: 'Learning' },
            { id: 'settings', icon: 'Settings', label: 'Settings' },
          ].map((link: any) => {
             const Icon = link.icon === 'Settings' ? Settings : link.icon;
             return (
               <button
                 key={link.id}
                 onClick={() => {
                   if (link.id === 'telegram') {
                     window.open(telegramLink, '_blank');
                   } else if (link.id === 'chat') {
                     window.dispatchEvent(new CustomEvent('openGlobalChat'));
                   } else if (link.id === 'support') {
                     window.dispatchEvent(new CustomEvent('openSupportChat'));
                   } else if (link.id === 'whatsapp') {
                     window.open(whatsappLink, '_blank');
                   } else if (link.id === 'facebook') {
                     window.open(facebookLink, '_blank');
                   } else {
                     handleTabChange(link.id as any);
                   }
                   onClose();
                 }}
                 className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${activeTab === link.id ? 'bg-yellow-500 text-black font-bold shadow-lg' : 'text-[var(--text-muted)] hover:bg-white/10 hover:text-[var(--text-main)]'}`}
               >
                 <Icon size={20} className={link.id === 'telegram' ? 'text-blue-400' : link.id === 'whatsapp' ? 'text-green-500' : link.id === 'facebook' ? 'text-blue-600' : ''} />
                 <span>{link.label}</span>
               </button>
             )
          })}



          <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-4 mt-6 mb-2">
            {lang === 'bn' ? 'আমাদের গেমস (Our Games)' : 'Our Games'}
          </p>
          {games.map((game) => (
            <button
              key={game.id}
              onClick={() => {
                handleGameSelect(game);
                onClose();
              }}
              className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-[var(--text-muted)] hover:bg-white/10 hover:text-[var(--text-main)] transition-all"
            >
              <game.icon size={20} />
              <span>{game.name}</span>
            </button>
          ))}
          
          <div className="h-px bg-teal-600/30 my-4"></div>
          
          <button 
            onClick={() => {
              handleTabChange('deposit');
              onClose();
            }}
            className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-[var(--text-muted)] hover:bg-white/10 hover:text-[var(--text-main)] transition-all"
          >
            <Wallet size={20} />
            <span>{lang === 'bn' ? 'জমা (Deposit)' : 'Deposit'}</span>
          </button>
          
          <button 
            onClick={() => {
              handleTabChange('history');
              onClose();
            }}
            className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-[var(--text-muted)] hover:bg-white/10 hover:text-[var(--text-main)] transition-all"
          >
            <RefreshCw size={20} />
            <span>{lang === 'bn' ? 'ইতিহাস (History)' : 'History'}</span>
          </button>
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-teal-600/50 space-y-3">


          {/* Theme Switcher */}
          <button 
            onClick={toggleTheme}
            className="w-full flex items-center gap-4 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-[var(--text-muted)] hover:bg-white/10 hover:text-[var(--text-main)] transition-all"
          >
            {theme === 'dark' ? <Sun size={20} className="text-yellow-400" /> : <Moon size={20} className="text-indigo-600" />}
            <span className="font-bold">
              {theme === 'dark' 
                ? (lang === 'bn' ? 'লাইট মোড' : 'Light Mode') 
                : (lang === 'bn' ? 'ডার্ক মোড' : 'Dark Mode')}
            </span>
          </button>

          {(userData?.role === 'admin' || userData?.isAdmin === true || ['owner.css13@gmail.com', 'cutelegend7045@gmail.com'].includes(userData?.email)) && (
            <button
              onClick={() => {
                handleTabChange('admin');
                onClose();
              }}
              className="w-full flex items-center gap-4 px-4 py-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 font-bold hover:bg-rose-500/20 hover:text-rose-300 transition-all"
            >
              <Shield size={20} />
              <span className="font-bold">Admin Panel</span>
            </button>
          )}

          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-red-600/20 to-red-900/20 text-red-500 font-bold hover:from-red-600/30 hover:to-red-900/30 rounded-xl border border-red-500/20 transition-all"
          >
            <LogOut size={18} />
            <span>{lang === 'bn' ? 'লগ আউট' : 'Log Out'}</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}

