import React from 'react';
import { User, Camera, Copy, ChevronLeft, Share2 } from 'lucide-react';

interface ProfileHeaderProps {
  userData: any;
  profilePic: string | null;
  fileInputRef: React.RefObject<HTMLInputElement>;
  handleProfilePicChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBack: () => void;
  onShareProgress?: () => void;
}

export default function ProfileHeader({ userData, profilePic, fileInputRef, handleProfilePicChange, onBack, onShareProgress }: ProfileHeaderProps) {
  const profileData = userData;

  return (
    <div className="bg-gradient-to-b from-[var(--bg-surface)] to-[var(--bg-main)] p-4 pt-6 rounded-b-3xl shadow-md transition-colors duration-300">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-2 bg-black/20 hover:bg-black/30 rounded-full transition-colors text-[var(--text-main)]"
          >
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-xl font-bold text-[var(--text-main)]">আমার প্রোফাইল</h1>
        </div>
        
        {onShareProgress && (
          <button
            onClick={onShareProgress}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-teal-500 to-teal-400 text-black font-bold text-sm rounded-xl shadow-lg hover:scale-105 active:scale-95 transition-all"
          >
            <Share2 size={16} />
            <span className="hidden sm:inline">প্রগ্রেস শেয়ার</span>
          </button>
        )}
      </div>
      <div className="flex items-center gap-6">
        <div className="relative">
          <div className="relative w-24 h-24 rounded-full bg-gradient-to-tr from-yellow-400 to-yellow-600 p-1.5 shadow-xl cursor-pointer" onClick={() => fileInputRef.current?.click()}>
            <div className="w-full h-full bg-[var(--bg-main)] rounded-full flex items-center justify-center border-4 border-white overflow-hidden transition-colors duration-300">
              {profilePic ? (
                <img src={profilePic} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User size={48} className="text-white" />
              )}
            </div>
            <div className="absolute bottom-1 right-1 bg-white p-1.5 rounded-full shadow-lg">
              <Camera size={16} className="text-teal-600" />
            </div>
          </div>
          <input type="file" ref={fileInputRef} onChange={handleProfilePicChange} accept="image/*" className="hidden" />
          <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-yellow-500 to-yellow-700 text-black text-xs font-black px-3 py-1 rounded-full border-2 border-yellow-300 shadow-lg">
            VIP {profileData?.vipLevel || 0}
          </div>
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-black text-[var(--text-main)] drop-shadow-md tracking-tight">{userData?.username || profileData?.username || "Player"}</h2>
            <button 
              onClick={() => {
                navigator.clipboard.writeText(userData?.username || profileData?.username || "Player");
              }}
              className="p-1 bg-white/10 hover:bg-white/20 rounded-md transition-colors text-[var(--text-main)] opacity-70 hover:opacity-100"
              title="Copy Username"
            >
              <Copy size={14} />
            </button>
          </div>
          <p className="text-[var(--text-muted)] text-sm font-medium opacity-90">ID: {userData?.id || profileData?.id || "84729104"}</p>
          <div className="mt-2 flex flex-col gap-1.5">
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-yellow-300 font-black uppercase tracking-widest">VIP Progress</span>
              <span className="text-[10px] text-yellow-300 font-bold">{profileData?.vipProgress || 0}% to VIP {(profileData?.vipLevel || 0) + 1}</span>
            </div>
            <div className="bg-black/30 rounded-full h-2.5 w-full overflow-hidden border border-white/10">
              <div className="bg-gradient-to-r from-yellow-400 to-yellow-200 h-full rounded-full shadow-[0_0_10px_rgba(250,204,21,0.5)]" style={{ width: `${profileData?.vipProgress || 0}%` }}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
