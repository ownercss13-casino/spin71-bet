import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const BANNERS = [
  {
    id: 1,
    image: 'https://images.unsplash.com/photo-1518623489648-a173ef7824f3?auto=format&fit=crop&w=800&q=80',
    title: 'Super Earning APP',
    offer: 'Get ৳108',
    subtitle: 'Per Referral',
    color: 'from-blue-600 to-indigo-900',
    textPrimary: '#00e5ff',
    textSecondary: '#fdd835'
  },
  {
    id: 2,
    image: 'https://images.unsplash.com/photo-1596838132731-dd36a18d04b2?auto=format&fit=crop&w=800&q=80',
    title: '১০০% বোনাস পান',
    offer: 'ডাবল অফার',
    subtitle: 'প্রথম বার ডিপোজিটেই বোনাস!',
    color: 'from-purple-600 to-indigo-900',
    textPrimary: '#ffffff',
    textSecondary: '#fdd835'
  }
];

const Banner: React.FC = () => {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % BANNERS.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const next = () => setCurrent((prev) => (prev + 1) % BANNERS.length);
  const prev = () => setCurrent((prev) => (prev - 1 + BANNERS.length) % BANNERS.length);

  return (
    <div className="relative w-full h-44 rounded-2xl overflow-hidden group">
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.5 }}
          className={`absolute inset-0 bg-gradient-to-br ${BANNERS[current].color} flex items-center p-6`}
        >
          {/* Custom SPIN71.BET Banner Content */}
          <div className="flex-1 space-y-1 relative z-10">
            <motion.p 
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="text-lg font-black italic tracking-tighter"
              style={{ color: BANNERS[current].textPrimary }}
            >
              {BANNERS[current].title}
            </motion.p>
            <motion.h2 
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-4xl font-black italic tracking-tighter leading-none"
              style={{ color: BANNERS[current].textSecondary }}
            >
              {BANNERS[current].offer}
            </motion.h2>
            <motion.p 
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-xl font-black italic tracking-tighter"
              style={{ color: BANNERS[current].textPrimary }}
            >
              {BANNERS[current].subtitle}
            </motion.p>
          </div>
          
          <div className="absolute right-0 top-0 bottom-0 w-2/3 flex items-end justify-end pointer-events-none pr-4 pb-2">
             <img src="https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=300&q=80" alt="Model" className="h-[140%] object-contain -mr-10 z-10 drop-shadow-2xl" />
             <img src="https://images.unsplash.com/photo-1544256718-3bcf237f3974?auto=format&fit=crop&w=200&q=80" alt="Pig" className="h-16 w-16 object-cover rounded-full mb-4 border-2 border-yellow-500 z-20" />
          </div>

          <div className="absolute top-4 left-4">
             <div className="bg-yellow-500 rounded-full p-1 shadow-lg">
                <svg viewBox="0 0 24 24" className="w-4 h-4 text-black fill-current"><path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z"/></svg>
             </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Controls */}
      <button onClick={prev} className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
        <ChevronLeft size={20} />
      </button>
      <button onClick={next} className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
        <ChevronRight size={20} />
      </button>

      {/* Indicators */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
        {BANNERS.map((_, i) => (
          <div 
            key={i} 
            className={`h-1 rounded-full transition-all ${current === i ? 'w-6 bg-white' : 'w-2 bg-white/40'}`} 
          />
        ))}
      </div>
    </div>
  );
};

export default Banner;
