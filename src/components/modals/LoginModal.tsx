import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '../../services/firebase';
import { LogIn, Crown, ShieldCheck, Zap, Sparkles, X } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  showToast: (message: string, type: any) => void;
}

export default function LoginModal({ isOpen, onClose, showToast }: LoginModalProps) {
  if (!isOpen) return null;

  const handleGoogleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      showToast("সফলভাবে লগইন হয়েছে!", "success");
      onClose();
    } catch (error: any) {
      console.error("Login error:", error);
      if (error.code === 'auth/cancelled-popup-request') {
        showToast("লগইন বাতিল করা হয়েছে", "info");
      } else {
        showToast("লগইন করতে সমস্যা হয়েছে", "error");
      }
    }
  };

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
        className="relative bg-gradient-to-b from-[#14253a] to-[#0d1a29] border border-yellow-500/30 p-8 rounded-[48px] w-full max-w-sm overflow-hidden shadow-[0_0_100px_rgba(234,179,8,0.2)]"
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

        {/* VIP Pattern Background */}
        <div className="absolute inset-0 opacity-[0.05] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #eab308 1.5px, transparent 0)', backgroundSize: '32px 32px' }} />

        <div className="text-center mb-12 relative">
          <motion.div 
            animate={{ 
              y: [0, -8, 0],
              rotate: [0, 5, -5, 0],
              scale: [1, 1.05, 1]
            }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="inline-block p-5 rounded-[32px] bg-gradient-to-br from-yellow-300 via-yellow-500 to-yellow-600 mb-8 shadow-[0_20px_40px_rgba(234,179,8,0.4)] relative"
          >
            <Crown size={40} className="text-black fill-black/10" />
            <div className="absolute -top-1 -right-1">
              <Sparkles size={20} className="text-white animate-pulse" />
            </div>
          </motion.div>
          <h2 className="text-5xl font-black text-white italic uppercase tracking-tighter leading-none mb-3">
            VIP <span className="text-yellow-500">ZONE</span>
          </h2>
          <div className="flex items-center justify-center gap-2 mb-1">
            <div className="h-[1px] w-8 bg-gradient-to-r from-transparent to-yellow-500/50" />
            <p className="text-yellow-500/80 text-[10px] font-black uppercase tracking-[0.3em]">Premium Gaming Royale</p>
            <div className="h-[1px] w-8 bg-gradient-to-l from-transparent to-yellow-500/50" />
          </div>
        </div>

        <div className="space-y-4 mb-12">
          {[
            { icon: Zap, text: "Instant Deposits", desc: "No waiting, play instantly." },
            { icon: ShieldCheck, text: "Safe & Secure", desc: "Military grade data encryption." },
          ].map((item, i) => (
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + (i * 0.1) }}
              key={i} 
              className="flex items-start gap-4 bg-black/40 p-5 rounded-3xl border border-yellow-500/10 hover:border-yellow-500/30 transition-colors group"
            >
              <div className="w-10 h-10 rounded-2xl bg-yellow-500/10 flex items-center justify-center text-yellow-500 group-hover:scale-110 transition-transform">
                <item.icon size={22} className="fill-yellow-500/10" />
              </div>
              <div>
                <p className="text-xs font-black text-white uppercase tracking-tight">{item.text}</p>
                <p className="text-[10px] text-gray-500 font-bold uppercase">{item.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <button
          onClick={handleGoogleLogin}
          className="group relative w-full overflow-hidden py-6 bg-white text-black font-black uppercase tracking-[0.2em] rounded-[24px] hover:bg-yellow-400 transition-all active:scale-[0.97] shadow-[0_20px_40px_rgba(255,255,255,0.15)] flex items-center justify-center gap-3"
        >
          {/* Shine effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
          
          <div className="w-6 h-6 bg-[#4285F4] rounded-full flex items-center justify-center shrink-0 shadow-sm">
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="white">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
          </div>
          <span className="relative z-10 text-xs">Login with Google</span>
        </button>

        <div className="mt-10 flex flex-col items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest">
              Server Status: <span className="text-green-500">Stable</span>
            </p>
          </div>
          <p className="text-gray-600 text-[9px] text-center uppercase font-bold tracking-tight opacity-50 px-10 leading-relaxed">
            Safe gaming environment verified by <span className="text-gray-400">Google Security</span>
          </p>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-0 right-0 p-6 opacity-[0.03] pointer-events-none">
          <Zap size={120} className="text-yellow-500 rotate-12" />
        </div>
        <div className="absolute bottom-0 left-0 p-6 opacity-[0.03] pointer-events-none">
          <ShieldCheck size={120} className="text-teal-500 -rotate-12" />
        </div>
      </motion.div>
    </motion.div>
  );
}
