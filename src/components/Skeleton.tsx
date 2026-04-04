import React from 'react';

export default function Skeleton({ className }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-teal-900/30 rounded-lg ${className}`}></div>
  );
}
