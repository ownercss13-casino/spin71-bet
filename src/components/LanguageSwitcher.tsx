import React from 'react';
import { motion } from 'motion/react';
import { useLanguage } from '../context/LanguageContext';
import { Globe } from 'lucide-react';

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10 overflow-hidden">
      <button
        onClick={() => setLanguage('bn')}
        className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center gap-2 ${
          language === 'bn' 
            ? 'bg-white text-black shadow-lg' 
            : 'text-gray-400 hover:text-white'
        }`}
      >
        <span className="text-base leading-none">🇧🇩</span> BN
      </button>
      <button
        onClick={() => setLanguage('en')}
        className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center gap-2 ${
          language === 'en' 
            ? 'bg-white text-black shadow-lg' 
            : 'text-gray-400 hover:text-white'
        }`}
      >
        <span className="text-base leading-none">🇺🇸</span> EN
      </button>
    </div>
  );
}
