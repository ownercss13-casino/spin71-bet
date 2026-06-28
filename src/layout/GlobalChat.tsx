import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Globe, X, ShieldCheck } from 'lucide-react';

export default function GlobalChat({ 
  isOpen, 
  onClose, 
  userData 
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  userData?: any 
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[200]"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 w-full md:w-96 h-full bg-[#061a1a] border-l border-teal-500/20 shadow-2xl z-[210] flex flex-col"
          >
            {/* Header */}
            <div className="p-4 bg-teal-950 border-b border-teal-500/20 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Globe className="text-teal-400 animate-pulse" size={20} />
                <h3 className="text-white font-black italic uppercase tracking-tighter">Global Live Chat</h3>
              </div>
              <button onClick={onClose} className="text-teal-500 p-1 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Iframe Container */}
            <div className="flex-1 w-full bg-[#0c1a1a] relative overflow-hidden">
              <iframe 
                src={`https://49797fcd-e9bd-4be1-a841-3fb9a079aff0-00-8r954i6t6ups.pike.replit.dev/user.html?username=${userData?.username || 'Guest'}`}
                className="w-full h-full border-none"
                title="Live Chat"
                allow="clipboard-read; clipboard-write"
              />
            </div>

            {/* Footer / Safety Note */}
            <div className="p-2 bg-teal-950/80 border-t border-teal-500/10 flex items-center justify-center gap-1 shrink-0">
              <ShieldCheck size={10} className="text-teal-700" />
              <span className="text-[8px] text-teal-700 uppercase font-black tracking-widest">নিরাপদ ও সুশৃঙ্খল চ্যাট বজায় রাখুন</span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
