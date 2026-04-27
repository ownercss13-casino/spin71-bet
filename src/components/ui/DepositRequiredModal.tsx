import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Wallet } from 'lucide-react';

interface DepositRequiredModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDeposit: () => void;
}

export default function DepositRequiredModal({ isOpen, onClose, onDeposit }: DepositRequiredModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            onClick={onClose} 
            className="absolute inset-0 bg-black/80 backdrop-blur-sm" 
          />
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }} 
            animate={{ scale: 1, opacity: 1, y: 0 }} 
            exit={{ scale: 0.9, opacity: 0, y: 20 }} 
            className="relative bg-white border border-gray-100 rounded-3xl p-8 w-full max-w-sm shadow-2xl text-center"
          >
            <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-4">
              <Wallet size={32} />
            </div>
            <h3 className="text-xl font-black text-gray-900 mb-2">ডিপোজিট প্রয়োজন</h3>
            <p className="text-gray-500 text-sm mb-6">গেম খেলার জন্য আপনাকে অন্তত একবার ডিপোজিট করতে হবে।</p>
            <button 
              onClick={onDeposit}
              className="w-full bg-[#333] text-white font-black py-4 rounded-xl hover:bg-black transition-all"
            >
              ডিপোজিট করুন
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
