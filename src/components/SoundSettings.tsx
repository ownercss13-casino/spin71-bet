import React from 'react';
import { useSound } from '../context/SoundContext';
import { Volume2, Music } from 'lucide-react';

export const SoundSettings: React.FC = () => {
  const { bgmVolume, setBgmVolume, sfxVolume, setSfxVolume } = useSound();

  return (
    <div className="p-4 bg-slate-900 rounded-lg space-y-4">
      <h3 className="text-white font-medium mb-2">Sound Settings</h3>
      
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-slate-300 text-sm">
          <Music size={16} /> Background Music
        </label>
        <input 
          type="range" 
          min="0" 
          max="1" 
          step="0.05" 
          value={bgmVolume} 
          onChange={(e) => setBgmVolume(parseFloat(e.target.value))}
          className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
        />
      </div>

      <div className="space-y-2">
        <label className="flex items-center gap-2 text-slate-300 text-sm">
          <Volume2 size={16} /> Sound Effects
        </label>
        <input 
          type="range" 
          min="0" 
          max="1" 
          step="0.05" 
          value={sfxVolume} 
          onChange={(e) => setSfxVolume(parseFloat(e.target.value))}
          className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
        />
      </div>
    </div>
  );
};
