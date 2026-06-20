import React from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface NotificationOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  message: string;
  type: 'success' | 'info' | 'error' | 'warning';
  title?: string;
}

export default function NotificationOverlay({ isOpen, onClose, message, type, title }: NotificationOverlayProps) {
  const getTitle = () => {
    if (title) return title;
    switch (type) {
      case 'success': return 'সফল হয়েছে';
      case 'error': return 'ব্যর্থ হয়েছে';
      case 'warning': return 'সতর্কতা';
      default: return 'নিশ্চিতকরণ';
    }
  };

  const getTitleColor = () => {
    switch (type) {
      case 'success': return 'text-green-500';
      case 'error': return 'text-red-500';
      case 'warning': return 'text-yellow-500';
      default: return 'text-[#48b2ff]';
    }
  };
  
  const getButtonBg = () => {
    switch (type) {
      case 'success': return 'bg-gradient-to-r from-green-500 to-green-600';
      case 'error': return 'bg-gradient-to-r from-red-500 to-red-600';
      case 'warning': return 'bg-gradient-to-r from-yellow-500 to-yellow-600';
      default: return 'bg-gradient-to-r from-[#4fc3f7] to-[#29b6f6]';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[5000] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            className="w-full max-w-[320px] bg-[#282a2f] rounded-[24px] p-6 text-center shadow-2xl border border-white/5"
          >
            <h3 className={`text-xl font-bold mb-4 ${getTitleColor()}`}>
              {getTitle()}
            </h3>

            <p className="text-white text-base font-medium leading-relaxed mb-8">
              {message}
            </p>

            <button 
              onClick={onClose}
              className={`w-full py-3 rounded-full text-white font-bold text-base transition-all active:scale-95 ${getButtonBg()}`}
            >
              ঠিক আছে
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
