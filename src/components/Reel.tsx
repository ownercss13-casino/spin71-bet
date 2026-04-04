import React from 'react';
import { motion } from 'motion/react';

interface ReelProps {
  key?: any;
  symbols: string[];
  isSpinning: boolean;
}

export default function Reel({ symbols, isSpinning }: ReelProps) {
  return (
    <div className="flex flex-col gap-2">
      {symbols.map((symbol, j) => (
        <motion.div 
          key={j}
          animate={isSpinning ? { y: [0, 100], opacity: [1, 0.5, 1] } : { y: 0, opacity: 1 }}
          transition={isSpinning ? { duration: 0.1, repeat: Infinity, ease: "linear" } : { duration: 0.5 }}
          className="h-20 bg-gradient-to-b from-gray-700 to-gray-800 rounded-lg flex items-center justify-center text-4xl shadow-inner border border-white/5"
        >
          {symbol}
        </motion.div>
      ))}
    </div>
  );
}
