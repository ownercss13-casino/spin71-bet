import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Gift, Check, AlertCircle, Loader2 } from 'lucide-react';
import { db } from '../../services/firebase';
import { doc, getDoc, updateDoc, increment, serverTimestamp, setDoc } from 'firebase/firestore';

interface PromoCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  showToast: (msg: string, type?: any) => void;
  isAdmin?: boolean;
  userData?: any;
}

export default function PromoCodeModal({ isOpen, onClose, showToast, isAdmin, userData }: PromoCodeModalProps) {
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [bonusAmount, setBonusAmount] = useState(0);

  const handleClaim = async () => {
    if (!code.trim() || isLoading || !userData?.id) return;
    setIsLoading(true);
    setError(null);
    
    try {
      const promoCodeId = code.trim().toUpperCase();
      const promoRef = doc(db, 'promo_codes', promoCodeId);
      const promoSnap = await getDoc(promoRef);

      if (!promoSnap.exists()) {
        throw new Error("ভুল প্রোমো কোড (Invalid promo code)");
      }

      const promoData = promoSnap.data();
      if (!promoData.active) {
        throw new Error("এই প্রোমো কোডটি আর সচল নেই (Promo code is inactive)");
      }

      if (promoData.usedCount >= promoData.maxUses) {
        throw new Error("এই কোডটির ব্যবহারের সীমা শেষ হয়ে গেছে (Usage limit reached)");
      }

      // Check if user already used it (optional, would need a separate collection or array)
      
      // Update user balance
      const userRef = doc(db, 'users', userData.id);
      await updateDoc(userRef, {
        balance: increment(promoData.amount),
        updatedAt: serverTimestamp()
      });

      // Update promo used count
      await updateDoc(promoRef, {
        usedCount: increment(1)
      });

      // Notify Telegram
      try {
        await fetch('/api/telegram/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: `🎁 <b>Promo Code Used!</b>\n\n👤 <b>User:</b> <code>${userData?.username || 'Unknown'}</code> (UID: <code>${userData?.id}</code>)\n🎟️ <b>Code:</b> <code>${promoCodeId}</code>\n💰 <b>Bonus:</b> ৳${promoData.amount}`
          })
        });
      } catch (err) {
        console.error("Telegram notification error", err);
      }

      setBonusAmount(promoData.amount);
      setSuccess(true);
      showToast("প্রোমো কোড সফলভাবে ব্যবহার করা হয়েছে!", "success");
    } catch (err: any) {
      setError(err.message);
      showToast(err.message, "error");
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
                              const codes = [
                                { code: "WELCOME500", amount: 500, maxUses: 100, expireDays: 5, active: true },
                                { code: "SPIN71", amount: 1000, maxUses: 50, expireDays: 7, active: true }
                              ];
                              for (const c of codes) {
                                await setDoc(doc(db, 'promo_codes', c.code), {
                                  ...c,
                                  createdAt: serverTimestamp(),
                                  usedCount: 0
                                });
                              }
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
