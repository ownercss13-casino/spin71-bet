import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Settings, Bell, Moon, Sun, Monitor, BellRing, BellOff, Volume2, VolumeX, Shield, Save } from 'lucide-react';
import { useSound } from '../context/SoundContext';

interface SettingsViewProps {
  userData: any;
  onUpdateUser: (updates: any) => Promise<void>;
  showToast: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
}

export default function SettingsView({ userData, onUpdateUser, showToast }: SettingsViewProps) {
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('dark');
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const { soundEnabled, toggleSound } = useSound();
  const [bgMusicVolume, setBgMusicVolume] = useState(70);
  const [gameSoundVolume, setGameSoundVolume] = useState(100);
  const [dailyBetLimit, setDailyBetLimit] = useState(userData?.dailyBetLimit || 0);

  const handleSaveLimit = async () => {
    try {
      await onUpdateUser({ dailyBetLimit: Number(dailyBetLimit) });
      showToast("Daily bet limit updated!", "success");
    } catch (e) {
      console.error(e);
      showToast("Failed to update limit", "error");
    }
  };

  useEffect(() => {
    // Load settings from local storage
    const savedTheme = localStorage.getItem('app_theme');
    if (savedTheme) setTheme(savedTheme as 'light' | 'dark' | 'system');

    const savedEmailNotif = localStorage.getItem('app_email_notif');
    if (savedEmailNotif) setEmailNotifications(savedEmailNotif === 'true');

    const savedPushNotif = localStorage.getItem('app_push_notif');
    if (savedPushNotif) setPushNotifications(savedPushNotif === 'true');

    const savedBgVolume = localStorage.getItem('app_bg_volume');
    if (savedBgVolume) setBgMusicVolume(Number(savedBgVolume));

    const savedGameVolume = localStorage.getItem('app_game_volume');
    if (savedGameVolume) setGameSoundVolume(Number(savedGameVolume));
  }, []);

  useEffect(() => {
    const applyTheme = (currentTheme: 'light' | 'dark' | 'system') => {
      const isDark = currentTheme === 'dark' || (currentTheme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };

    applyTheme(theme);

    // Listener for system changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const listener = () => {
      if (theme === 'system') {
        applyTheme('system');
      }
    };
    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  }, [theme]);

  const handleSave = () => {
    localStorage.setItem('app_theme', theme);
    localStorage.setItem('app_email_notif', String(emailNotifications));
    localStorage.setItem('app_push_notif', String(pushNotifications));
    localStorage.setItem('app_bg_volume', String(bgMusicVolume));
    localStorage.setItem('app_game_volume', String(gameSoundVolume));
    showToast("Settings saved successfully!", "success");
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 p-4 pb-20 min-h-[calc(100vh-120px)]">
      
      {/* Header */}
      <div className="bg-gradient-to-br from-teal-900 to-teal-950 rounded-[40px] p-8 border border-teal-700/50 shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/5 rounded-full blur-[100px] -mr-32 -mt-32 transition-all duration-1000 group-hover:bg-teal-500/10"></div>
        <div className="relative z-10 flex items-center gap-6">
          <div className="w-20 h-20 rounded-[28px] bg-teal-900/50 flex items-center justify-center border border-teal-500/20 shrink-0 text-teal-400">
            <Settings size={36} />
          </div>
          <div>
            <h2 className="text-3xl font-black text-white italic tracking-tight">সেটিংস</h2>
            <p className="text-teal-400 text-xs font-bold uppercase tracking-widest mt-1">App Configurations</p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        
        {/* Appearance Settings */}
        <div className="bg-teal-900/20 border border-teal-800/30 rounded-[28px] overflow-hidden">
          <div className="p-5 border-b border-teal-800/30 flex items-center gap-3 bg-teal-900/30">
            <Sun className="text-teal-500" size={20} />
            <h3 className="text-lg font-black text-white italic tracking-tight">অ্যাপিয়ারেন্স (Appearance)</h3>
          </div>
          <div className="p-5 space-y-4 text-white">
            <p className="text-sm text-gray-400 font-bold">থিম নির্বাচন করুন</p>
            <div className="grid grid-cols-3 gap-3">
              <button 
                onClick={() => setTheme('light')}
                className={`py-3 flex flex-col items-center justify-center gap-2 rounded-xl border transition-all ${theme === 'light' ? 'bg-teal-500 text-black border-teal-500' : 'bg-black/20 text-gray-400 border-white/5 hover:border-teal-500/50'}`}
              >
                <Sun size={20} />
                <span className="text-xs font-bold text-center">লাইট</span>
              </button>
              <button 
                onClick={() => setTheme('dark')}
                className={`py-3 flex flex-col items-center justify-center gap-2 rounded-xl border transition-all ${theme === 'dark' ? 'bg-teal-500 text-black border-teal-500' : 'bg-black/20 text-gray-400 border-white/5 hover:border-teal-500/50'}`}
              >
                <Moon size={20} />
                <span className="text-xs font-bold text-center">ডার্ক</span>
              </button>
              <button 
                onClick={() => setTheme('system')}
                className={`py-3 flex flex-col items-center justify-center gap-2 rounded-xl border transition-all ${theme === 'system' ? 'bg-teal-500 text-black border-teal-500' : 'bg-black/20 text-gray-400 border-white/5 hover:border-teal-500/50'}`}
              >
                <Monitor size={20} />
                <span className="text-xs font-bold text-center">সিস্টেম</span>
              </button>
            </div>
          </div>
        </div>

        {/* Notfication Settings */}
        <div className="bg-teal-900/20 border border-teal-800/30 rounded-[28px] overflow-hidden">
          <div className="p-5 border-b border-teal-800/30 flex items-center gap-3 bg-teal-900/30">
            <Bell className="text-teal-500" size={20} />
            <h3 className="text-lg font-black text-white italic tracking-tight">নোটিফিকেশন (Notifications)</h3>
          </div>
          <div className="p-5 space-y-4">
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-black/20 flex items-center justify-center text-gray-400 border border-white/5">
                  <BellRing size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">পুশ নোটিফিকেশন</h4>
                  <p className="text-[10px] text-gray-500 font-bold">নতুন গেম এবং বোনাস অ্যালার্ট</p>
                </div>
              </div>
              <button 
                onClick={async () => {
                  const nextValue = !pushNotifications;
                  setPushNotifications(nextValue);
                  localStorage.setItem('app_push_notif', String(nextValue));
                  try {
                    await onUpdateUser({ pushNotifications: nextValue });
                    showToast("Push notifications preference updated!", "success");
                  } catch (e) {
                    showToast("Failed to save preference", "error");
                  }
                }}
                className={`w-12 h-6 rounded-full p-1 transition-colors ${pushNotifications ? 'bg-teal-500' : 'bg-gray-600'}`}
              >
                <motion.div 
                  className="w-4 h-4 rounded-full bg-white"
                  animate={{ x: pushNotifications ? 24 : 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              </button>
            </div>

            <div className="h-px w-full bg-white/5"></div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-black/20 flex items-center justify-center text-gray-400 border border-white/5">
                  <Shield size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">ইমেইল নোটিফিকেশন</h4>
                  <p className="text-[10px] text-gray-500 font-bold">লগইন সতর্কতা এবং রিসিপ্ট</p>
                </div>
              </div>
              <button 
                onClick={() => setEmailNotifications(!emailNotifications)}
                className={`w-12 h-6 rounded-full p-1 transition-colors ${emailNotifications ? 'bg-teal-500' : 'bg-gray-600'}`}
              >
                <motion.div 
                  className="w-4 h-4 rounded-full bg-white"
                  animate={{ x: emailNotifications ? 24 : 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              </button>
            </div>
            
          </div>
        </div>

        {/* Audio Settings */}
        <div className="bg-teal-900/20 border border-teal-800/30 rounded-[28px] overflow-hidden">
          <div className="p-5 border-b border-teal-800/30 flex items-center gap-3 bg-teal-900/30">
            <Volume2 className="text-teal-500" size={20} />
            <h3 className="text-lg font-black text-white italic tracking-tight">অডিও (Audio)</h3>
          </div>
          <div className="p-5 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-black/20 flex items-center justify-center text-gray-400 border border-white/5">
                  {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">সাউন্ড ইফেক্ট</h4>
                </div>
              </div>
              <button 
                onClick={toggleSound}
                className={`w-12 h-6 rounded-full p-1 transition-colors ${soundEnabled ? 'bg-teal-500' : 'bg-gray-600'}`}
              >
                <motion.div 
                  className="w-4 h-4 rounded-full bg-white"
                  animate={{ x: soundEnabled ? 24 : 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              </button>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs text-gray-400 font-bold">
                <span>Background Music</span>
                <span>{bgMusicVolume}%</span>
              </div>
              <input 
                type="range"
                min="0"
                max="100"
                value={bgMusicVolume}
                onChange={(e) => setBgMusicVolume(Number(e.target.value))}
                className="w-full h-2 bg-black/20 rounded-lg appearance-none cursor-pointer accent-teal-500"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs text-gray-400 font-bold">
                <span>Game Sound Effects</span>
                <span>{gameSoundVolume}%</span>
              </div>
              <input 
                type="range"
                min="0"
                max="100"
                value={gameSoundVolume}
                onChange={(e) => setGameSoundVolume(Number(e.target.value))}
                className="w-full h-2 bg-black/20 rounded-lg appearance-none cursor-pointer accent-teal-500"
              />
            </div>
          </div>
        </div>

        {/* Daily Bet Limit */}
        <div className="bg-teal-900/20 border border-teal-800/30 rounded-[28px] overflow-hidden p-5">
           <h3 className="text-lg font-black text-white italic tracking-tight mb-4">ডেইলি বেট লিমিট</h3>
           <div className="flex items-center gap-4">
             <input 
               type="number"
               value={dailyBetLimit}
               onChange={(e) => setDailyBetLimit(Number(e.target.value))}
               className="flex-1 bg-black/20 text-white p-3 rounded-xl border border-white/10"
               placeholder="Enter daily limit"
             />
             <button 
               onClick={handleSaveLimit}
               className="bg-teal-500 text-black font-black px-6 py-3 rounded-xl"
             >
               সেভ
             </button>
           </div>
        </div>

        <button 
          onClick={handleSave}
          className="w-full bg-gradient-to-r from-teal-500 to-emerald-500 text-black font-black text-lg py-4 rounded-2xl flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(20,184,166,0.3)] hover:shadow-[0_0_30px_rgba(20,184,166,0.5)] transition-all transform hover:scale-[1.02] active:scale-[0.98]"
        >
          <Save size={20} />
          সেভ করুন (Save Settings)
        </button>

      </div>
    </div>
  );
}
