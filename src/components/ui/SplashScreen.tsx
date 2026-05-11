import React from 'react';
import { motion } from 'motion/react';
import { Zap } from 'lucide-react';

const SplashScreen: React.FC = () => {
  return (
    <div className="fixed inset-0 z-[200] bg-[#0a0505] flex flex-col items-center justify-center overflow-hidden">
      {/* Background Particles */}
      <div className="absolute inset-0 opacity-20">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ 
              opacity: [0, 1, 0], 
              scale: [0, 1, 0],
              x: Math.random() * 400 - 200,
              y: Math.random() * 400 - 200
            }}
            transition={{ 
              duration: 2 + Math.random() * 2, 
              repeat: Infinity,
              delay: Math.random() * 2
            }}
            className="absolute w-1 h-1 bg-yellow-500 rounded-full"
            style={{ 
              left: `${Math.random() * 100}%`, 
              top: `${Math.random() * 100}%` 
            }}
          />
        ))}
      </div>

      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1, ease: "easeOut" }}
        className="relative"
      >
        <div className="w-24 h-24 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-3xl flex items-center justify-center p-1 shadow-[0_0_50px_rgba(234,179,8,0.4)]">
          <div className="w-full h-full bg-[#0a0505] rounded-[22px] flex items-center justify-center">
            <Zap size={48} className="text-yellow-500 fill-yellow-500 animate-pulse" />
          </div>
        </div>
        
        {/* Ring Animation */}
        <motion.div
          animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute inset-0 border-2 border-yellow-500 rounded-3xl"
        />
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.8 }}
        className="mt-8 text-center"
      >
        <h1 className="text-3xl font-black italic text-white tracking-tighter uppercase">
          NEON <span className="text-yellow-500">GOLD</span> SLOT
        </h1>
        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.3em] mt-2">
          Premium Casino Experience
        </p>
      </motion.div>

      <div className="absolute bottom-12 w-48 h-1 bg-white/5 rounded-full overflow-hidden">
        <motion.div
          initial={{ x: "-100%" }}
          animate={{ x: "100%" }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-full h-full bg-gradient-to-r from-transparent via-yellow-500 to-transparent"
        />
      </div>
    </div>
  );
};

export default SplashScreen;
