import React, { useRef } from 'react';
import { X } from 'lucide-react';
import { motion, useScroll, useTransform } from 'motion/react';
import { GAME_IMAGES } from '../../constants/gameAssets';

interface CasinoGalleryProps {
  onClose: () => void;
}

const CASINO_IMAGES = [
  {
    title: 'Real Slot Machine',
    url: GAME_IMAGES.CRASH_GAME,
    description: 'High-quality slot machine visual'
  },
  {
    title: 'Professional Roulette',
    url: GAME_IMAGES.CRASH_GAME,
    description: 'Classic roulette table'
  },
  {
    title: 'Poker & Cards',
    url: GAME_IMAGES.CRASH_GAME,
    description: 'Professional card game setup'
  },
  {
    title: 'Casino Dice (Sic Bo)',
    url: GAME_IMAGES.CRASH_GAME,
    description: 'High-stakes dice game'
  },
  {
    title: 'Casino Interior',
    url: GAME_IMAGES.CRASH_GAME,
    description: 'Luxury casino atmosphere'
  },
  {
    title: 'Crash Game Plane',
    url: GAME_IMAGES.CRASH_GAME,
    description: 'Modern aircraft for Crash game'
  }
];

const ParallaxCard: React.FC<{ img: typeof CASINO_IMAGES[0], index: number }> = ({ img, index }) => {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  });

  const y = useTransform(scrollYProgress, [0, 1], ["-15%", "15%"]);

  return (
    <div ref={ref} className="bg-gray-900 rounded-xl overflow-hidden border border-gray-800 group relative">
      <div className="relative aspect-video overflow-hidden">
        <motion.img 
          src={img.url} 
          alt={img.title}
          style={{ y, scale: 1.2 }}
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex items-end p-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * (index % 2) }}
          >
            <h3 className="text-xl font-black text-white italic tracking-tighter mb-1">{img.title}</h3>
            <p className="text-sm text-yellow-500/80 font-medium">{img.description}</p>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export const CasinoGallery: React.FC<CasinoGalleryProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col overflow-y-auto no-scrollbar">
      {/* Background Video */}
      <div className="fixed inset-0 z-0 bg-black pointer-events-none overflow-hidden h-screen w-screen">
        <video 
          autoPlay 
          loop 
          muted 
          playsInline
          className="absolute min-w-full min-h-full object-cover opacity-30 select-none scale-110 blur-sm pointer-events-none"
        >
          <source src={GAME_IMAGES.CASINO_VIDEO_URL} type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-br from-teal-900/60 via-black/80 to-red-900/60 mix-blend-multiply" />
      </div>

      <div className="flex justify-between items-center p-6 sticky top-0 bg-black/40 backdrop-blur-xl z-50 border-b border-white/5">
        <div className="flex flex-col">
          <h2 className="text-2xl font-black text-yellow-500 italic tracking-tighter leading-none">REAL CASINO</h2>
          <span className="text-[10px] text-teal-400 font-bold tracking-[0.2em] uppercase mt-1">Assets Preview Gallery</span>
        </div>
        <button 
          onClick={onClose}
          className="w-10 h-10 bg-red-600/20 border border-red-500/50 rounded-full flex items-center justify-center text-red-500 hover:bg-red-600 hover:text-white transition-all active:scale-90"
        >
          <X size={20} />
        </button>
      </div>

      <div className="p-4 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-8 pb-20 relative z-10">
        {CASINO_IMAGES.map((img, index) => (
          <ParallaxCard key={index} img={img} index={index} />
        ))}
      </div>
      
      <div className="mt-auto p-8 relative z-10">
        <div className="bg-teal-900/30 backdrop-blur-sm p-8 rounded-3xl border border-yellow-500/30 text-center shadow-2xl">
          <div className="w-16 h-1 bg-yellow-500 mx-auto mb-6 rounded-full opacity-50" />
          <p className="text-teal-100 text-lg mb-8 leading-relaxed max-w-md mx-auto">
            আপনি কি এই হাই-কোয়ালিটি অ্যাসেটগুলো আপনার গেমে ব্যবহার করতে চান? 
            আমি এগুলোকে আপনার প্ল্যাটফর্মে ইন্টিগ্রেট করে দিতে পারি।
          </p>
          <button 
            onClick={onClose}
            className="w-full max-w-xs px-10 py-4 bg-yellow-500 text-black font-black rounded-2xl hover:bg-yellow-400 transition-all shadow-[0_10px_20px_rgba(234,179,8,0.3)] active:scale-95"
          >
            গ্যালারি বন্ধ করুন
          </button>
        </div>
      </div>
    </div>
  );
};
