import React from 'react';
import { X } from 'lucide-react';

interface CasinoGalleryProps {
  onClose: () => void;
}

const CASINO_IMAGES = [
  {
    title: 'Real Slot Machine',
    url: 'https://images.unsplash.com/photo-1596838132731-3301c3fd4317?q=80&w=800&auto=format&fit=crop',
    description: 'High-quality slot machine visual'
  },
  {
    title: 'Professional Roulette',
    url: 'https://images.unsplash.com/photo-1606167668584-78701c57f13d?q=80&w=800&auto=format&fit=crop',
    description: 'Classic roulette table'
  },
  {
    title: 'Poker & Cards',
    url: 'https://images.unsplash.com/photo-1511193311914-0346f16efe90?q=80&w=800&auto=format&fit=crop',
    description: 'Professional card game setup'
  },
  {
    title: 'Casino Dice (Sic Bo)',
    url: 'https://images.unsplash.com/photo-1518133835878-5a93cc3f89e5?q=80&w=800&auto=format&fit=crop',
    description: 'High-stakes dice game'
  },
  {
    title: 'Casino Interior',
    url: 'https://images.unsplash.com/photo-1518133910546-b6c2fb7d79e3?q=80&w=800&auto=format&fit=crop',
    description: 'Luxury casino atmosphere'
  },
  {
    title: 'Aviator Style Plane',
    url: 'https://images.unsplash.com/photo-1569154941061-e231b4725ef1?q=80&w=800&auto=format&fit=crop',
    description: 'Modern aircraft for Aviator game'
  }
];

export const CasinoGallery: React.FC<CasinoGalleryProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col p-4 overflow-y-auto">
      <div className="flex justify-between items-center mb-6 sticky top-0 bg-black/95 py-2 z-10">
        <h2 className="text-2xl font-bold text-yellow-400 italic">REAL CASINO ASSETS PREVIEW</h2>
        <button 
          onClick={onClose}
          className="p-2 bg-red-600 rounded-full text-white hover:bg-red-700 transition-colors"
        >
          <X size={24} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-10">
        {CASINO_IMAGES.map((img, index) => (
          <div key={index} className="bg-gray-900 rounded-xl overflow-hidden border border-gray-800 group">
            <div className="relative aspect-video overflow-hidden">
              <img 
                src={img.url} 
                alt={img.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-4">
                <div>
                  <h3 className="text-lg font-bold text-white">{img.title}</h3>
                  <p className="text-sm text-gray-300">{img.description}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-auto text-center p-6 bg-gray-900/50 rounded-xl border border-yellow-500/30">
        <p className="text-yellow-200 text-sm mb-4">
          আপনি কি এই ছবিগুলো আপনার গেমে ব্যবহার করতে চান? 
          যদি চান, তবে আমি এগুলোকে বর্তমান গেম কার্ডগুলোতে সেট করে দিতে পারি।
        </p>
        <button 
          onClick={onClose}
          className="px-8 py-3 bg-gradient-to-r from-yellow-400 to-yellow-600 text-black font-bold rounded-full hover:scale-105 transition-transform"
        >
          গ্যালারি বন্ধ করুন
        </button>
      </div>
    </div>
  );
};
