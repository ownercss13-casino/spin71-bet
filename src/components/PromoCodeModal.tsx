import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Gift, Check, AlertCircle, Loader2 } from 'lucide-react';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { doc, collection, serverTimestamp, runTransaction } from 'firebase/firestore';
import { createPromoCode } from '../services/firebaseService';

interface PromoCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  showToast: (msg: string, type?: any) => void;
  isAdmin?: boolean;
}

export default function PromoCodeModal({ isOpen, onClose, showToast, isAdmin }: PromoCodeModalProps) {
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [bonusAmount, setBonusAmount] = useState(0);

  const handleClaim = async () => {
    if (!code.trim() || !auth.currentUser || isLoading) return;
    setIsLoading(true);
    setError(null);
    
    try {
      const promoCode = code.trim().toUpperCase();
      const userId = auth.currentUser.uid;
      let claimedAmount = 0;
      let isAdminGranted = false;
      
      // Check for Admin Code
      const adminCode = (import.meta as any).env?.VITE_ADMIN_CODE?.toUpperCase() || "ADMIN123";
      if (promoCode === adminCode && auth.currentUser.email === 'owner.css13@gmail.com') {
        const { updateDoc } = await import('firebase/firestore');
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, { role: 'admin' });
        isAdminGranted = true;
      } else {
        await runTransaction(db, async (transaction) => {
          const promoRef = doc(db, 'promo_codes', promoCode);
          const promoDoc = await transaction.get(promoRef);
          
          if (!promoDoc.exists()) {
            throw new Error("ভুল প্রোমো কোড (Invalid promo code)");
          }
          
          const promoData = promoDoc.data();
          
          if (!promoData.isActive) {
            throw new Error("এই প্রোমো কোডটি আর সক্রিয় নেই (Promo code is inactive)");
          }
          
          if (promoData.maxUses > 0 && promoData.usedCount >= promoData.maxUses) {
            throw new Error("এই প্রোমো কোডটির ব্যবহারের সীমা শেষ (Usage limit reached)");
          }
          
          // Check if user already used it
          const usageRef = doc(db, `users/${userId}/used_promos/${promoCode}`);
          const usageDoc = await transaction.get(usageRef);
          
          if (usageDoc.exists() && !promoData.allowMultiUse) {
            throw new Error("আপনি ইতিমধ্যে এই প্রোমো কোডটি ব্যবহার করেছেন (Already used)");
          }
          
          // Apply bonus
          claimedAmount = promoData.amount || 0;
          const requiredTurnover = claimedAmount * (promoData.turnoverMultiplier || 5);
          
          const userRef = doc(db, 'users', userId);
          const userDoc = await transaction.get(userRef);
          
          if (!userDoc.exists()) {
            throw new Error("User not found");
          }
          
          const currentBalance = userDoc.data().balance || 0;
          const currentTurnover = userDoc.data().requiredTurnover || 0;
          
          transaction.update(userRef, {
            balance: currentBalance + claimedAmount,
            requiredTurnover: currentTurnover + requiredTurnover
          });
          
          transaction.update(promoRef, {
            usedCount: (promoData.usedCount || 0) + 1
          });
          
          transaction.set(usageRef, {
            claimedAt: serverTimestamp(),
            amount: claimedAmount
          });
          
          // Add transaction record
          const trxRef = doc(collection(db, `users/${userId}/transactions`));
          transaction.set(trxRef, {
            type: 'bonus',
            amount: claimedAmount,
            method: 'Promo Code',
            status: 'সম্পন্ন',
            date: serverTimestamp(),
            trxId: `PROMO-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
            statusColor: 'bg-green-500/20 text-green-500'
          });
        });
      }
      
      if (isAdminGranted) {
        showToast("অ্যাডমিন অ্যাক্সেস সফলভাবে দেওয়া হয়েছে!", "success");
        onClose();
        setCode('');
      } else {
        setBonusAmount(claimedAmount);
        setSuccess(true);
        showToast("প্রোমো কোড সফলভাবে ব্যবহার করা হয়েছে!", "success");
        
        setTimeout(() => {
          onClose();
          setSuccess(false);
          setCode('');
        }, 3000);
      }
      
    } catch (err: any) {
      console.error(err);
      setError(err.message || "প্রোমো কোড ক্লেইম করতে সমস্যা হয়েছে");
      if (err.message && !err.message.includes("ভুল") && !err.message.includes("সক্রিয়") && !err.message.includes("সীমা") && !err.message.includes("ইতিমধ্যে")) {
         handleFirestoreError(err, OperationType.WRITE, 'promo_codes');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[250] flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 100 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 100 }}
            className="w-full max-w-md bg-[#0b1120] border border-teal-900/50 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 bg-teal-950/50 border-b border-teal-900/30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-teal-500/20 flex items-center justify-center text-teal-500">
                  <Gift size={18} />
                </div>
                <h3 className="text-white font-bold">প্রোমো কোড (Promo Code)</h3>
              </div>
              <button 
                onClick={onClose}
                className="p-2 text-teal-500 hover:text-white transition-colors"
                disabled={isLoading && !success}
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {success ? (
                <div className="py-10 flex flex-col items-center text-center space-y-6">
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 260, damping: 20 }}
                    className="w-20 h-20 rounded-full bg-green-500 flex items-center justify-center text-black shadow-lg shadow-green-500/20"
                  >
                    <motion.div
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={{ pathLength: 1, opacity: 1 }}
                      transition={{ duration: 0.5, delay: 0.2 }}
                    >
                      <Check size={40} strokeWidth={4} />
                    </motion.div>
                  </motion.div>
                  
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <h4 className="text-white font-black text-2xl italic uppercase tracking-tight">অভিনন্দন!</h4>
                    <p className="text-teal-400 text-sm mt-2 font-medium">আপনি সফলভাবে বোনাস পেয়েছেন।</p>
                    
                    <div className="mt-6 p-4 bg-white/5 rounded-2xl border border-white/5 inline-block">
                      <p className="text-gray-400 text-[10px] uppercase font-bold tracking-widest">বোনাস পরিমাণ</p>
                      <p className="text-yellow-500 text-xl font-black italic">৳ {bonusAmount.toLocaleString()}</p>
                    </div>
                  </motion.div>
                </div>
              ) : (
                <>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <label className="text-teal-400 text-sm font-bold">প্রোমো কোড লিখুন</label>
                      <span className="text-[10px] text-teal-600 font-bold uppercase tracking-widest">Hint: WELCOME500</span>
                    </div>
                    <div className="relative">
                      <input 
                        type="text" 
                        value={code}
                        onChange={(e) => setCode(e.target.value.toUpperCase())}
                        className="w-full bg-teal-950 border border-teal-800 rounded-2xl px-4 py-4 text-white font-bold focus:outline-none focus:border-teal-500 transition-colors uppercase tracking-widest"
                        placeholder="e.g. WELCOME500"
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-red-400 text-xs bg-red-500/10 p-3 rounded-xl border border-red-500/20">
                        <AlertCircle size={14} />
                        <span>{error}</span>
                      </div>
                      {isAdmin && error.includes("ভুল") && (
                        <button 
                          onClick={async () => {
                            setIsLoading(true);
                            try {
                        await createPromoCode("WELCOME500", 500, 100, 5, true);
                        await createPromoCode("SPIN71", 1000, 50, 7, true);
                              showToast("ডিফল্ট প্রোমো কোডগুলো তৈরি হয়েছে", "success");
                              setError(null);
                            } catch (e) {
                              console.error(e);
                            } finally {
                              setIsLoading(false);
                            }
                          }}
                          className="w-full py-2 bg-teal-500/10 text-teal-400 text-[10px] font-bold rounded-lg border border-teal-500/20 hover:bg-teal-500/20 transition-all"
                        >
                          ডিফল্ট কোডগুলো তৈরি করুন (Admin Only)
                        </button>
                      )}
                    </div>
                  )}

                  <button 
                    onClick={handleClaim}
                    disabled={!code.trim() || isLoading}
                    className="w-full py-4 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-400 hover:to-teal-500 text-white font-black rounded-2xl shadow-lg shadow-teal-500/20 transition-all active:scale-95 disabled:opacity-50 disabled:grayscale flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 size={20} className="animate-spin" />
                        যাচাই করা হচ্ছে...
                      </>
                    ) : (
                      'বোনাস নিন'
                    )}
                  </button>
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
