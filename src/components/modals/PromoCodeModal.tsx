import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Gift, Check, AlertCircle, Loader2, Plus, Calendar, Trophy, Coins, Users } from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState<'claim' | 'create'>(isAdmin ? 'create' : 'claim');
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [bonusAmount, setBonusAmount] = useState(0);

  // New Promo Code form state
  const [newPromo, setNewPromo] = useState({
    code: '',
    amount: 500,
    maxUses: 100,
    expireDays: 7
  });

  const handleClaim = async () => {
    if (!code.trim() || isLoading || !userData?.id) return;
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/promo/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: code.trim().toUpperCase(),
          userId: userData.id
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "দাবি করতে ব্যর্থ হয়েছে (Failed to claim)");
      }

      setBonusAmount(data.amount);
      setSuccess(true);
      showToast(data.message || "প্রোমো কোড সফলভাবে ব্যবহার করা হয়েছে!", "success");
    } catch (err: any) {
      setError(err.message);
      showToast(err.message, "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreatePromo = async () => {
    if (!newPromo.code.trim() || newPromo.amount <= 0 || isLoading) return;
    setIsLoading(true);
    setError(null);

    try {
      const promoRef = doc(db, 'promo_codes', newPromo.code.toUpperCase());
      await setDoc(promoRef, {
        code: newPromo.code.toUpperCase(),
        amount: Number(newPromo.amount),
        maxUses: Number(newPromo.maxUses),
        expireDays: Number(newPromo.expireDays),
        active: true,
        createdAt: serverTimestamp(),
        usedCount: 0
      });

      showToast(`Promo code "${newPromo.code}" created successfully!`, "success");
      setNewPromo({ code: '', amount: 500, maxUses: 100, expireDays: 7 });
      setActiveTab('claim');
    } catch (err: any) {
      showToast("Failed to create promo code", "error");
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[250] flex items-end sm:items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 100 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 100 }}
            className="w-full max-w-md bg-[#010409] border border-teal-500/20 rounded-[32px] shadow-[0_0_50px_rgba(20,184,166,0.1)] overflow-hidden relative"
          >
            {/* Animated Background Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-teal-500/10 blur-[100px] rounded-full" />

            {/* Header */}
            <div className="p-5 border-b border-white/5 flex items-center justify-between relative z-10 bg-teal-950/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-teal-600/20 border border-teal-500/30 flex items-center justify-center text-teal-400">
                  <Gift size={22} className={isLoading ? "animate-bounce" : ""} />
                </div>
                <div>
                  <h3 className="text-white font-black uppercase tracking-tight text-lg">Bonus Center</h3>
                  <p className="text-[10px] font-bold text-teal-500 uppercase tracking-widest">প্রোমো কোড এবং অফার</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-all border border-white/5"
                disabled={isLoading && !success}
              >
                <X size={20} />
              </button>
            </div>

            {/* Tabs (If Admin) */}
            {isAdmin && !success && (
              <div className="px-6 pt-6 flex gap-2">
                <button
                  onClick={() => setActiveTab('claim')}
                  className={`flex-1 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all font-sans ${activeTab === 'claim' ? 'bg-teal-600 text-white shadow-lg shadow-teal-600/20' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
                >
                  Claim Code
                </button>
                <button
                  onClick={() => setActiveTab('create')}
                  className={`flex-1 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all font-sans ${activeTab === 'create' ? 'bg-teal-600 text-white shadow-lg shadow-teal-600/20' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
                >
                  Admin Create
                </button>
              </div>
            )}

            {/* Content */}
            <div className="p-6">
              {success ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="py-6 flex flex-col items-center text-center space-y-6"
                >
                  <div className="relative">
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 260, damping: 20 }}
                      className="w-24 h-24 rounded-[32px] bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-black shadow-2xl shadow-green-500/30"
                    >
                      <Check size={48} strokeWidth={4} />
                    </motion.div>
                    <motion.div 
                      animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="absolute inset-0 bg-green-500 rounded-[32px] blur-xl -z-10"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="text-white font-black text-3xl italic uppercase tracking-tighter">SUCCESSFUL!</h4>
                    <p className="text-teal-400 text-sm font-bold uppercase tracking-wider">অভিনন্দন! আপনার বোনাস জমা হয়েছে।</p>
                  </div>

                  <div className="w-full bg-white/5 rounded-3xl border border-white/5 p-6 backdrop-blur-md relative overflow-hidden group">
                     <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Trophy size={48} />
                     </div>
                     <p className="text-gray-500 text-[10px] uppercase font-black tracking-[0.2em] mb-2">Total Bonus Received</p>
                     <div className="flex items-center justify-center gap-3">
                        <Coins className="text-yellow-500" size={24} />
                        <span className="text-yellow-500 text-4xl font-black italic tabular-nums">৳{bonusAmount.toLocaleString()}</span>
                     </div>
                  </div>

                  <button 
                    onClick={onClose}
                    className="w-full py-4 bg-white/10 hover:bg-white/20 text-white font-black rounded-2xl transition-all uppercase text-xs tracking-[0.2em] border border-white/5"
                  >
                    Done (ঠিক আছে)
                  </button>
                </motion.div>
              ) : activeTab === 'claim' ? (
                <div className="space-y-6">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center px-1">
                      <label className="text-teal-400 text-[10px] font-black uppercase tracking-widest leading-none">Your Promo Code</label>
                      <span className="text-[10px] text-teal-600 font-bold uppercase tracking-widest italic animate-pulse">Hint: WELCOME500</span>
                    </div>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-teal-500 group-focus-within:text-teal-400 transition-colors">
                        <Gift size={20} />
                      </div>
                      <input 
                        type="text" 
                        value={code}
                        onChange={(e) => setCode(e.target.value.toUpperCase())}
                        className="w-full bg-teal-950/30 border border-teal-500/20 rounded-2xl pl-12 pr-4 py-5 text-white font-black focus:outline-none focus:border-teal-500 transition-all uppercase tracking-[0.3em] font-mono text-lg placeholder:text-teal-900/50"
                        placeholder="ENTER CODE"
                      />
                    </div>
                  </div>

                  {error && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-3 text-rose-400 text-xs bg-rose-500/10 p-4 rounded-2xl border border-rose-500/20"
                    >
                      <div className="w-8 h-8 rounded-lg bg-rose-500/20 flex items-center justify-center shrink-0">
                        <AlertCircle size={16} />
                      </div>
                      <span className="font-bold">{error}</span>
                    </motion.div>
                  )}

                  <button 
                    onClick={handleClaim}
                    disabled={!code.trim() || isLoading}
                    className="w-full h-16 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-400 hover:to-teal-500 text-white font-black rounded-2xl shadow-xl shadow-teal-500/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:grayscale flex items-center justify-center gap-3 uppercase text-xs tracking-[0.2em]"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 size={24} className="animate-spin text-white/50" />
                        যাচাই করা হচ্ছে...
                      </>
                    ) : (
                      <>
                        Claim Bonus Now
                        <div className="bg-white/20 px-2 py-1 rounded-lg text-[8px] font-black uppercase">৳ Free</div>
                      </>
                    )}
                  </button>

                  <p className="text-center text-[10px] text-gray-500 font-bold uppercase tracking-widest leading-relaxed px-4">
                    প্রতিটি প্রোমো কোড শুধুমাত্র একবার ব্যবহার করা যাবে। শর্তাবলি প্রযোজ্য।
                  </p>
                </div>
              ) : (
                // Admin Create Tab
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-5"
                >
                  <div className="space-y-4">
                    <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center gap-3 mb-2">
                       <AlertCircle size={18} className="text-amber-500" />
                       <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest leading-relaxed">Admin restricted: Creating global reward tokens</p>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5 ml-1">Unique Code</label>
                        <div className="relative">
                          <Plus className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                          <input 
                            value={newPromo.code}
                            onChange={(e) => setNewPromo({...newPromo, code: e.target.value.toUpperCase()})}
                            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm font-black text-white focus:border-teal-500 transition-all uppercase tracking-widest font-mono"
                            placeholder="E.G. NEWYEAR2024"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5 ml-1">Bonus TK</label>
                          <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-black text-xs">৳</span>
                            <input 
                              type="number"
                              value={newPromo.amount}
                              onChange={(e) => setNewPromo({...newPromo, amount: Number(e.target.value)})}
                              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-8 pr-4 text-sm font-black text-white focus:border-teal-500 transition-all tabular-nums"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5 ml-1">Max Uses</label>
                          <div className="relative">
                            <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                            <input 
                              type="number"
                              value={newPromo.maxUses}
                              onChange={(e) => setNewPromo({...newPromo, maxUses: Number(e.target.value)})}
                              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm font-black text-white focus:border-teal-500 transition-all tabular-nums"
                            />
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5 ml-1">Expiry Period</label>
                        <div className="relative">
                          <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                          <select 
                            value={newPromo.expireDays}
                            onChange={(e) => setNewPromo({...newPromo, expireDays: Number(e.target.value)})}
                            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm font-black text-white focus:border-teal-500 transition-all outline-none appearance-none cursor-pointer"
                          >
                            <option value={1}>1 Day (Express)</option>
                            <option value={3}>3 Days (Standard)</option>
                            <option value={7}>7 Days (Week)</option>
                            <option value={30}>30 Days (Month)</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={handleCreatePromo}
                    disabled={isLoading || !newPromo.code.trim()}
                    className="w-full py-4 bg-teal-600 hover:bg-teal-500 text-white font-black rounded-xl transition-all shadow-xl shadow-teal-500/20 active:scale-95 uppercase text-[10px] tracking-widest flex items-center justify-center gap-2"
                  >
                    {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
                    Create Global Token
                  </button>
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
