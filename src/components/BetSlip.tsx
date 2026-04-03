import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Wallet, Ticket, Check, AlertCircle, Loader2 } from 'lucide-react';
import { updateBalance, updateTurnover } from '../services/firebaseService';
import { db, auth } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

interface BetSlipProps {
  isOpen: boolean;
  onClose: () => void;
  userBalance: number;
  onBalanceUpdate: (newBalance: number) => void;
  selectedOdds?: number;
  gameName?: string;
  showToast: (msg: string, type?: any) => void;
}

export default function BetSlip({ 
  isOpen, 
  onClose, 
  userBalance, 
  onBalanceUpdate, 
  selectedOdds = 2.0, 
  gameName = "Casino Game",
  showToast
}: BetSlipProps) {
  const [betAmount, setBetAmount] = useState<number>(100);
  const [odds, setOdds] = useState<number>(selectedOdds);
  const [isPlacingBet, setIsPlacingBet] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const potentialPayout = betAmount * odds;

  useEffect(() => {
    setOdds(selectedOdds);
  }, [selectedOdds]);

  useEffect(() => {
    if (betAmount > userBalance) {
      setError("Insufficient balance");
    } else if (betAmount <= 0) {
      setError("Invalid bet amount");
    } else {
      setError(null);
    }
  }, [betAmount, userBalance]);

  const handlePlaceBet = async () => {
    if (error || !auth.currentUser || isPlacingBet) return;

    setIsPlacingBet(true);
    const newBalance = userBalance - betAmount;
    
    // Immediate visual feedback: deduct balance in UI
    onBalanceUpdate(newBalance);

    try {
      // Record the bet in Firestore
      const path = `users/${auth.currentUser.uid}/transactions`;
      await addDoc(collection(db, path), {
        type: 'bet',
        amount: -betAmount,
        game: gameName,
        odds: odds,
        potentialPayout,
        status: 'pending',
        date: serverTimestamp(),
        method: 'Wallet',
        trxId: `BET-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        statusColor: 'bg-yellow-500/20 text-yellow-500'
      });

      // Update user balance in database
      await updateBalance(auth.currentUser.uid, newBalance);
      
      // Update turnover in database
      await updateTurnover(auth.currentUser.uid, betAmount);
      
      setIsConfirmed(true);
      showToast("Bet placed successfully!", "success");
      
      // Close after a short delay
      setTimeout(() => {
        onClose();
        setIsConfirmed(false);
        setIsPlacingBet(false);
      }, 2500);

    } catch (err) {
      console.error("Error placing bet:", err);
      // Revert balance in UI if the transaction failed
      onBalanceUpdate(userBalance);
      showToast("Failed to place bet. Please try again.", "error");
      setIsPlacingBet(false);
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
                <div className="w-8 h-8 rounded-lg bg-yellow-500/20 flex items-center justify-center text-yellow-500">
                  <Ticket size={18} />
                </div>
                <h3 className="text-white font-bold">Bet Slip</h3>
              </div>
              <button 
                onClick={onClose}
                className="p-2 text-teal-500 hover:text-white transition-colors"
                disabled={isPlacingBet && !isConfirmed}
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {isConfirmed ? (
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
                    <h4 className="text-white font-black text-2xl italic uppercase tracking-tight">Bet Confirmed!</h4>
                    <p className="text-teal-400 text-sm mt-2 font-medium">Good luck! Your bet has been placed successfully.</p>
                    
                    <div className="mt-6 p-4 bg-white/5 rounded-2xl border border-white/5 inline-block">
                      <p className="text-gray-400 text-[10px] uppercase font-bold tracking-widest">Potential Payout</p>
                      <p className="text-yellow-500 text-xl font-black italic">৳ {potentialPayout.toLocaleString()}</p>
                    </div>
                  </motion.div>
                </div>
              ) : (
                <>
                  {/* Game Info */}
                  <div className="bg-teal-900/20 p-4 rounded-2xl border border-teal-800/30">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-teal-400 text-xs font-bold uppercase tracking-wider">{gameName}</p>
                        <p className="text-white font-bold mt-1">Match Winner</p>
                      </div>
                      <div className="bg-yellow-500/20 text-yellow-500 px-2 py-1 rounded text-xs font-black">
                        {odds.toFixed(2)}x
                      </div>
                    </div>
                  </div>

                  {/* Odds Selection */}
                  <div className="space-y-3">
                    <label className="text-teal-400 text-sm font-bold">Select Odds</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[1.5, 2.0, 3.5].map(odd => (
                        <button 
                          key={odd}
                          onClick={() => setOdds(odd)}
                          className={`py-2 rounded-xl text-sm font-black border transition-all ${
                            odds === odd 
                              ? 'bg-yellow-500 border-yellow-500 text-black' 
                              : 'bg-teal-900/30 border-teal-800 text-teal-300 hover:border-teal-600'
                          }`}
                        >
                          {odd.toFixed(2)}x
                        </button>
                      ))}
                    </div>
                    <div className="relative">
                      <input 
                        type="number" 
                        step="0.1"
                        value={odds}
                        onChange={(e) => setOdds(Number(e.target.value))}
                        className="w-full bg-teal-950 border border-teal-800 rounded-2xl px-4 py-3 text-white font-bold focus:outline-none focus:border-yellow-500 transition-colors text-center"
                        placeholder="Custom Odds"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-teal-500 font-bold">x</span>
                    </div>
                  </div>

                  {/* Bet Input */}
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-teal-400 font-bold">Bet Amount</span>
                      <span className="text-white flex items-center gap-1">
                        <Wallet size={14} className="text-yellow-500" />
                        ৳ {userBalance.toLocaleString()}
                      </span>
                    </div>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-teal-500 font-bold">৳</span>
                      <input 
                        type="number" 
                        value={betAmount}
                        onChange={(e) => setBetAmount(Number(e.target.value))}
                        className="w-full bg-teal-950 border border-teal-800 rounded-2xl pl-8 pr-4 py-4 text-white font-bold focus:outline-none focus:border-yellow-500 transition-colors"
                        placeholder="Enter amount"
                      />
                    </div>
                    
                    {/* Quick Amounts */}
                    <div className="grid grid-cols-4 gap-2">
                      {[100, 500, 1000, 5000].map(amt => (
                        <button 
                          key={amt}
                          onClick={() => setBetAmount(amt)}
                          className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                            betAmount === amt 
                              ? 'bg-yellow-500 border-yellow-500 text-black' 
                              : 'bg-teal-900/30 border-teal-800 text-teal-300 hover:border-teal-600'
                          }`}
                        >
                          {amt}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="space-y-2 pt-2 border-t border-teal-900/30">
                    <div className="flex justify-between text-sm">
                      <span className="text-teal-500">Total Stake</span>
                      <span className="text-white font-bold">৳ {betAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-teal-500">Potential Payout</span>
                      <span className="text-yellow-500 font-black">৳ {potentialPayout.toLocaleString()}</span>
                    </div>
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 text-red-400 text-xs bg-red-500/10 p-3 rounded-xl border border-red-500/20">
                      <AlertCircle size={14} />
                      <span>{error}</span>
                    </div>
                  )}

                  <button 
                    onClick={handlePlaceBet}
                    disabled={!!error || isPlacingBet}
                    className="w-full py-4 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-black font-black rounded-2xl shadow-lg shadow-yellow-500/20 transition-all active:scale-95 disabled:opacity-50 disabled:grayscale flex items-center justify-center gap-2"
                  >
                    {isPlacingBet ? (
                      <>
                        <Loader2 size={20} className="animate-spin" />
                        Placing Bet...
                      </>
                    ) : (
                      'Place Bet'
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
