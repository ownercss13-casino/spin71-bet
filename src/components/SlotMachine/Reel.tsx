import React from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface ReelProps {
  symbols: string[];
  isSpinning: boolean;
  result: string;
}

const SYMBOL_MAP: Record<string, string> = {
  '7': '🔥',
  'BAR': '🎰',
  'CHERRY': '🍒',
  'DIAMOND': '💎',
  'GOLD': '💰',
  'BELL': '🔔'
};

const Reel: React.FC<ReelProps> = ({ symbols, isSpinning, result }) => {
  const [displaySymbols, setDisplaySymbols] = React.useState<string[]>([]);

  React.useEffect(() => {
    // Generate a long list of symbols for the spinning effect
    const list = Array.from({ length: 40 }, () => 
      Object.keys(SYMBOL_MAP)[Math.floor(Math.random() * Object.keys(SYMBOL_MAP).length)]
    );
    setDisplaySymbols(list);
  }, []);

  return (
    <div className="relative w-24 h-40 bg-black/40 rounded-lg overflow-hidden border border-white/10 shadow-[inner_0_0_20px_rgba(0,0,0,0.8)]">
      <motion.div
        animate={isSpinning ? { y: [-1600, 0] } : { y: 0 }}
        transition={isSpinning ? { 
          duration: 2 + Math.random(), 
          ease: [0.45, 0.05, 0.55, 0.95],
          repeat: Infinity 
        } : { duration: 0.5 }}
        className="flex flex-col items-center"
      >
        {isSpinning ? (
          displaySymbols.map((s, i) => (
            <div key={i} className="h-40 flex items-center justify-center text-4xl grayscale opacity-40">
              {SYMBOL_MAP[s]}
            </div>
          ))
        ) : (
          <div className="h-40 flex items-center justify-center text-5xl drop-shadow-[0_0_15px_rgba(255,215,0,0.5)]">
            {SYMBOL_MAP[result] || '❓'}
          </div>
        )}
      </motion.div>
      
      {/* Glossy Overlay */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-black/60 via-transparent to-black/60"></div>
    </div>
  );
};

export default Reel;
