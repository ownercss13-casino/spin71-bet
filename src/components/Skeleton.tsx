import React from 'react';

export default function Skeleton({ className, shimmer = true }: { className?: string, shimmer?: boolean }) {
  return (
    <div 
      className={`relative overflow-hidden bg-teal-900/20 rounded-lg ${className}`}
    >
      {shimmer && (
        <div 
          className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent"
        />
      )}
    </div>
  );
}
