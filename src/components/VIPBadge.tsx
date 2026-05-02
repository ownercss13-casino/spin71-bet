import React from 'react';
import { Award, ShieldCheck, Gem, Trophy, Hexagon } from 'lucide-react';
import { VIP_LEVELS } from '../constants/vipLevels';

interface VIPBadgeProps {
  level: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export default function VIPBadge({ level, size = 'md', className = '' }: VIPBadgeProps) {
  const vip = VIP_LEVELS[level] || VIP_LEVELS[0];
  
  const getIcon = () => {
    switch (level) {
      case 0: return <Hexagon size={getIconSize()} />;
      case 1: return <ShieldCheck size={getIconSize()} />;
      case 2: return <Award size={getIconSize()} />;
      case 3: return <Trophy size={getIconSize()} />;
      case 4: return <Gem size={getIconSize()} />;
      default: return <Hexagon size={getIconSize()} />;
    }
  };

  const getIconSize = () => {
    switch (size) {
      case 'sm': return 12;
      case 'md': return 16;
      case 'lg': return 20;
      case 'xl': return 28;
      default: return 16;
    }
  };

  const getFontSize = () => {
    switch (size) {
      case 'sm': return 'text-[8px]';
      case 'md': return 'text-[10px]';
      case 'lg': return 'text-xs';
      case 'xl': return 'text-sm';
      default: return 'text-[10px]';
    }
  };

  const getPadding = () => {
    switch (size) {
      case 'sm': return 'px-1 py-0';
      case 'md': return 'px-2 py-0.5';
      case 'lg': return 'px-3 py-1';
      case 'xl': return 'px-4 py-2';
      default: return 'px-2 py-0.5';
    }
  };

  return (
    <div 
      className={`inline-flex items-center gap-1.5 rounded-full font-black tracking-widest bg-gradient-to-r ${vip.bgGradient} text-white shadow-lg ${getPadding()} ${getFontSize()} ${className}`}
      style={{ boxShadow: `0 4px 12px ${vip.color}44` }}
    >
      {getIcon()}
      <span>{vip.name}</span>
    </div>
  );
}
