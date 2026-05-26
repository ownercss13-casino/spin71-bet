import React from 'react';
import { auth } from '../../services/firebase';
import { motion, AnimatePresence } from 'motion/react';
import { LogIn, Crown, ShieldCheck, Zap, Sparkles, X } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  showToast: (message: string, type: any) => void;
}

export default function LoginModal({ isOpen, onClose, showToast }: LoginModalProps) {
  if (!isOpen) return null;

  const isAuth = auth.currentUser;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl"
    >
      {/* Background Glows */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-yellow-500/5 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-teal-500/5 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
      </div>
      
      <motion.div 
        initial={{ scale: 0.95, y: 30, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        className="relative bg-gradient-to-b from-gray-900 to-black border border-white/10 p-8 rounded-[48px] w-full max-w-sm overflow-hidden shadow-[0_0_100px_rgba(255,255,255,0.05)]"
      >
        {/* Close button - only show if user is already logged in (e.g. changing account) */}
        {isAuth && (
           <button 
             onClick={onClose}
             className="absolute top-6 right-6 p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors text-white/50 hover:text-white"
           >
             <X size={20} />
           </button>
        )}
      </motion.div>
    </motion.div>
  );
}
