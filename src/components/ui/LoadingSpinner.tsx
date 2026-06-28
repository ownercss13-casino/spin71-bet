import React from 'react';
import { motion } from 'motion/react';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function LoadingSpinner({ message = "ডেটা লোড হচ্ছে...", size = 'md' }: LoadingSpinnerProps) {
  const spinnerSize = size === 'sm' ? 'w-10 h-10' : size === 'lg' ? 'w-24 h-24' : 'w-16 h-16';
  const innerSize = size === 'sm' ? 'w-6 h-6' : size === 'lg' ? 'w-14 h-14' : 'w-10 h-10';

  return (
    <div className="flex flex-col items-center justify-center p-6 text-center select-none">
      {/* Enhanced Concentric Circular Spinners */}
      <div className={`relative ${spinnerSize} flex items-center justify-center mb-4`}>
        <div className="absolute inset-0 border-4 border-yellow-500/10 rounded-full"></div>
        <div className="absolute inset-0 border-4 border-t-yellow-500 border-r-amber-500 rounded-full animate-spin shadow-[0_0_15px_rgba(234,179,8,0.4)]"></div>
        <div 
          className={`absolute ${innerSize} border-2 border-b-yellow-400 border-l-yellow-600 rounded-full animate-spin opacity-70`} 
          style={{ animationDirection: 'reverse', animationDuration: '1.2s' }}
        ></div>
      </div>
      
      {message && (
        <motion.p 
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
          className="text-teal-400 text-xs font-bold tracking-[0.05em] mt-2"
        >
          {message}
        </motion.p>
      )}
    </div>
  );
}
