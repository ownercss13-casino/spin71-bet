import React, { useEffect } from 'react';
import { motion } from 'motion/react';

interface GameAnimationProps {
  onComplete: () => void;
}

export default function GameAnimation({ onComplete }: GameAnimationProps) {
  useEffect(() => {
    const timer = setTimeout(onComplete, 3000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div 
      className="fixed inset-0 z-[1000] bg-[#050e05] flex flex-col items-center justify-center p-0 font-sans"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&q=80&w=1000')] bg-cover bg-center opacity-20"></div>
      
      <div className="relative z-10 flex flex-col items-center w-full max-w-sm px-6">
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-white text-6xl font-black mb-8 tracking-tighter"
        >
          GT<span className="text-green-500">99</span>
        </motion.div>

        <motion.div
           initial={{ scale: 0.8, opacity: 0 }}
           animate={{ scale: 1, opacity: 1 }}
           transition={{ duration: 0.8 }}
           className="mb-8"
        >
          <img 
            src="https://img.freepik.com/free-vector/tiger-cartoon-character_1308-41584.jpg?t=st=1715425600~exp=1715429200~hmac=62d85b1a03f8e5d3c8c7d6b5a49f874938a16c7a40b37f48e24c575d3"
            alt="Tiger"
            className="w-64 h-64 object-contain"
          />
        </motion.div>
        
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="w-full bg-black/40 border border-green-500/20 backdrop-blur-md p-4 rounded-xl flex items-center justify-center gap-3 text-white"
        >
            <div className="w-5 h-5 border-2 border-t-green-500 border-white/20 rounded-full animate-spin"></div>
            <span className="font-bold">Loading...</span>
        </motion.div>
      </div>
    </motion.div>
  );
}
