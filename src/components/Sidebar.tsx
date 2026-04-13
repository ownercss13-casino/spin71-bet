import React from 'react';
import { X, User, Copy, Home, Users, Send, Star, Wallet, RefreshCw, LogOut, Moon, Sun, MessageCircle, Facebook } from 'lucide-react';
import { motion } from 'motion/react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  userData: any;
  activeTab: string;
  handleTabChange: (tab: any) => void;
  setIsSupportChatOpen: (open: boolean) => void;
  setShowLogoPreview: (show: boolean) => void;
  handleLogout: () => void;
  showToast: (msg: string, type?: any) => void;
  casinoName?: string;
  telegramLink?: string;
  whatsappLink?: string;
  facebookLink?: string;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

export default function Sidebar({
  isOpen,
  onClose,
  userData,
  activeTab,
  handleTabChange,
  setIsSupportChatOpen,
  setShowLogoPreview,
  handleLogout,
  showToast,
  casinoName = "SPIN71BET",
  telegramLink = "https://t.me/spin71bet_official",
  whatsappLink = "https://wa.me/...",
  facebookLink = "https://facebook.com/...",
  theme,
  toggleTheme
}: SidebarProps) {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm transition-opacity"
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
            <div className="text-2xl font-black italic tracking-tighter bg-gradient-to-b from-yellow-200 via-yellow-400 to-yellow-600 text-transparent bg-clip-text">
              {casinoName}
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
          {[
            { id: 'home', icon: Home, label: 'বাড়ি (Home)' },
            ...(userData?.role === 'admin' || userData?.email === 'owner.css13@gmail.com' ? [{ id: 'admin', icon: Users, label: 'অ্যাডমিন প্যানেল (Admin)' }] : []),
            { id: 'wallet', icon: Wallet, label: 'ওয়ালেট (Wallet)' },
            { id: 'profile', icon: User, label: 'প্রোফাইল (Profile)' },
            { id: 'invite', icon: Users, label: 'আমন্ত্রণ (Invite)' },
            { id: 'telegram', icon: Send, label: 'টেলিগ্রাম (Telegram)' },
            { id: 'whatsapp', icon: MessageCircle, label: 'হোয়াটসঅ্যাপ (WhatsApp)' },
            { id: 'facebook', icon: Facebook, label: 'ফেসবুক (Facebook)' },
            { id: 'logo', icon: Star, label: 'লোগো জেনারেটর (Logo Generator)' },
          ].map((link) => (
            <button
              key={link.id}
              onClick={() => {
                if (link.id === 'telegram') {
                  window.open(telegramLink, '_blank');
                } else if (link.id === 'whatsapp') {
                  window.open(whatsappLink, '_blank');
                } else if (link.id === 'facebook') {
                  window.open(facebookLink, '_blank');
                } else if (link.id === 'logo') {
                  setShowLogoPreview(true);
                } else {
                  handleTabChange(link.id as any);
                }
                onClose();
              }}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${activeTab === link.id ? 'bg-yellow-500 text-black font-bold shadow-lg' : 'text-[var(--text-muted)] hover:bg-white/10 hover:text-[var(--text-main)]'}`}
            >
              <link.icon size={20} className={link.id === 'telegram' ? 'text-blue-400' : link.id === 'whatsapp' ? 'text-green-500' : link.id === 'facebook' ? 'text-blue-600' : ''} />
              <span>{link.label}</span>
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
            <span>জমা (Deposit)</span>
          </button>
          
          <button className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-[var(--text-muted)] hover:bg-white/10 hover:text-[var(--text-main)] transition-all">
            <RefreshCw size={20} />
            <span>ইতিহাস (History)</span>
          </button>

          <div className="h-px bg-teal-600/30 my-4"></div>

          {/* Theme Switcher */}
          <button 
            onClick={toggleTheme}
            className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-[var(--text-muted)] hover:bg-white/10 hover:text-[var(--text-main)] transition-all"
          >
            {theme === 'dark' ? <Sun size={20} className="text-yellow-400" /> : <Moon size={20} className="text-indigo-600" />}
            <span>{theme === 'dark' ? 'লাইট মোড (Light Mode)' : 'ডার্ক মোড (Dark Mode)'}</span>
          </button>
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-teal-600/50">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-3 text-red-400 font-bold hover:bg-red-900/20 rounded-xl transition-all"
          >
            <LogOut size={18} />
            <span>লগ আউট</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
