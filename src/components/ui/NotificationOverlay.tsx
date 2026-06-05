import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

interface NotificationOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  message: string;
  type: 'success' | 'info' | 'error';
}

export default function NotificationOverlay({ isOpen, onClose, message, type }: NotificationOverlayProps) {
  const config = {
    success: { icon: CheckCircle2, color: 'text-[#4ade80]', bg: 'bg-green-500/10' },
    info: { icon: Info, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    error: { icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-500/10' },
  };

  const { icon: Icon, color, bg } = config[type];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className={`relative bg-[#1e1e1e] border border-white/10 rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl`}
          >
            <button onClick={onClose} className="absolute top-4 right-4 text-white/50 hover:text-white">
              <X size={20} />
            </button>
            <div className={`w-16 h-16 ${bg} rounded-full flex items-center justify-center mx-auto mb-6`}>
              <Icon size={32} className={color} />
            </div>
            <p className="text-white text-lg font-bold">
              {message}
            </p>
            <button 
              onClick={onClose}
              className="mt-6 w-full font-bold py-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all"
            >
              বন্ধ করুন
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
