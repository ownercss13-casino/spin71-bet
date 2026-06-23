import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
  Wallet, 
  Building2, 
  Plus, 
  Check, 
  Target, 
  CheckCircle2, 
  RefreshCw, 
  Lock, 
  Eye, 
  EyeOff, 
  Loader2, 
  AlertCircle,
  Clock,
  ShieldCheck,
  CreditCard,
  Banknote
} from 'lucide-react';
import { getAuth } from 'firebase/auth';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';
import { getBackendUrl } from '../config';
import { AnimatedBalance } from '../components/AnimatedBalance';
import VIPLoader from '../components/ui/VIPLoader';
import BankCardModal from '../components/BankCardModal';

interface WithdrawViewProps {
  onTabChange: (tab: any) => void;
  onSubTabChange?: (subTab: any) => void;
  balance: number;
  userData: any;
  showToast: (message: string, type: any) => void;
  minWithdraw?: number;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export default function WithdrawView({
  onTabChange,
  onSubTabChange,
  balance: propBalance,
  userData: propUserData,
  showToast,
  minWithdraw = 500,
  onRefresh: propOnRefresh,
  isRefreshing: propIsRefreshing
}: WithdrawViewProps) {
  const auth = getAuth();
  const user = auth.currentUser;

  const [balance, setBalance] = useState(propBalance);
  const [userData, setUserData] = useState(propUserData);
  const [amount, setAmount] = useState('');
  const [transactionPassword, setTransactionPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [showBankCardModal, setShowBankCardModal] = useState(false);
  const [isTurnoverInfoModalOpen, setIsTurnoverInfoModalOpen] = useState(false);

  useEffect(() => {
    setBalance(propBalance);
  }, [propBalance]);

  useEffect(() => {
    setUserData(propUserData);
  }, [propUserData]);

  const onRefresh = async () => {
    if (propOnRefresh) {
      propOnRefresh();
      return;
    }
    
    if (!user) return;
    setIsRefreshing(true);
    try {
      const docSnap = await getDoc(doc(db, 'users', user.uid));
      if (docSnap.exists()) {
        const data = docSnap.data();
        setUserData(data);
        setBalance(data.balance || 0);
      }
      showToast('Balance updated', 'success');
    } catch (err) {
      console.error(err);
    } finally {
      setTimeout(() => setIsRefreshing(false), 800);
    }
  };

  const handleWithdraw = async () => {
    if (!user) return;
    
    const withdrawAmount = parseFloat(amount);
    if (isNaN(withdrawAmount) || withdrawAmount < minWithdraw) {
      showToast(`Minimum withdrawal amount is ৳${minWithdraw}`, 'error');
      return;
    }

    if (withdrawAmount > balance) {
      showToast('Insufficient balance', 'error');
      return;
    }

    const bankCards = userData?.bankCards || [];
    if (bankCards.length === 0) {
      showToast('Please add a bank card first', 'error');
      return;
    }

    if (!transactionPassword.trim()) {
      showToast('Please enter your password', 'error');
      return;
    }

    // Turnover check (Client side)
    const requiredTurnover = userData?.requiredTurnover || 0;
    const currentTurnover = userData?.turnover || 0;
    if (currentTurnover < requiredTurnover) {
      showToast(`Turnover not complete. Need ৳${(requiredTurnover - currentTurnover).toFixed(2)} more.`, 'error');
      return;
    }

    setShowConfirmationModal(true);
  };

  const submitWithdrawRequest = async () => {
    if (!user) return;
    setIsSubmitting(true);
    setShowConfirmationModal(false);

    try {
      const bankCards = userData?.bankCards || [];
      const selectedCard = bankCards[currentCardIndex] || bankCards[0];
      
      const idToken = await user.getIdToken(true); // Force refresh token
      
      const response = await fetch(`${getBackendUrl()}/api/withdraw/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({
          amount: parseFloat(amount),
          bankCardId: selectedCard.id,
          transactionPassword: transactionPassword
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to submit withdrawal request');
      }

      showToast('Withdrawal request submitted successfully!', 'success');
      setAmount('');
      setTransactionPassword('');
      
      // Auto switch to history tab after success
      if (onSubTabChange) {
        setTimeout(() => {
          onTabChange('profile');
          onSubTabChange('withdrawHistory');
        }, 2000);
      } else {
        setTimeout(() => onTabChange('profile'), 2000);
      }
    } catch (error: any) {
      console.error("Withdraw Error:", error);
      // Detailed error logging for debugging the "7 PERMISSION_DENIED" issue
      if (error.message.includes('PERMISSION_DENIED') || error.message.includes('permission')) {
         showToast('পরিচালক পারমিশন এর জন্য আবেদন করা হয়েছে। দয়া করে কিছুক্ষণ অপেক্ষা করুন। (Permission issue, please wait)', 'error');
      } else {
         showToast(error.message || 'Something went wrong', 'error');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const bankCards = userData?.bankCards || [];

  return (
    <div className="min-h-screen bg-[#13615e] pb-24">
      {/* Header */}
      <div className="bg-[#1a7a76] p-4 flex items-center gap-4 sticky top-0 z-50 shadow-lg">
        <button 
          onClick={() => onTabChange('profile')}
          className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-bold text-white uppercase tracking-tight">Withdraw Funds</h1>
      </div>

      <div className="p-4 max-w-lg mx-auto space-y-6">
        {/* Balance Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-[#1d7470] to-[#155a57] p-6 rounded-3xl border border-white/10 shadow-xl relative overflow-hidden"
        >
          <div className="relative z-10">
            <p className="text-white/70 text-sm font-bold uppercase tracking-wider mb-1">Available Balance</p>
            <div className="flex items-center gap-3">
              <span className="text-3xl font-black text-white italic tracking-tighter">৳</span>
              <AnimatedBalance value={balance} className="text-4xl font-black text-white italic tracking-tighter" />
              <button 
                onClick={onRefresh}
                className={`ml-2 text-white/50 hover:text-white transition-all ${(isRefreshing || propIsRefreshing) ? 'animate-spin' : ''}`}
              >
                <RefreshCw size={20} />
              </button>
            </div>
          </div>
          <div className="absolute right-4 bottom-4 text-white/5 opacity-20">
            <Wallet size={120} />
          </div>
        </motion.div>

        {/* Turnover Progress */}
        {(userData?.requiredTurnover || 0) > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            onClick={() => setIsTurnoverInfoModalOpen(true)}
            className="bg-[#1a7a76] p-5 rounded-2xl border border-white/10 shadow-lg cursor-pointer"
          >
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-teal-500/20 flex items-center justify-center text-teal-300">
                  <Target size={18} />
                </div>
                <h3 className="text-white font-bold text-sm">Withdrawal Turnover</h3>
              </div>
              <span className="text-xs font-black text-teal-200 bg-teal-900/40 px-2.5 py-1 rounded-full border border-teal-500/20">
                ৳{Math.min(userData?.turnover || 0, userData?.requiredTurnover || 0).toFixed(2)} / ৳{(userData?.requiredTurnover || 0).toFixed(2)}
              </span>
            </div>
            
            <div className="w-full bg-black/30 h-3 rounded-full overflow-hidden border border-white/5">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, ((userData?.turnover || 0) / (userData?.requiredTurnover || 1)) * 100)}%` }}
                transition={{ duration: 1.2, ease: "easeOut" }}
                className={`h-full rounded-full transition-all duration-500 ${((userData?.turnover || 0) >= (userData?.requiredTurnover || 1)) ? 'bg-gradient-to-r from-emerald-400 to-green-500 shadow-[0_0_10px_rgba(52,211,153,0.3)]' : 'bg-gradient-to-r from-teal-400 to-teal-300 shadow-[0_0_10px_rgba(45,212,191,0.2)]'}`}
              />
            </div>
            
            <div className="mt-3 flex justify-between items-center">
              {((userData?.requiredTurnover || 0) > (userData?.turnover || 0)) ? (
                <p className="text-red-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                  <AlertCircle size={12} />
                  আরো ৳{((userData?.requiredTurnover || 0) - (userData?.turnover || 0)).toFixed(2)} বাজি ধরতে হবে
                </p>
              ) : (
                <p className="text-emerald-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                  <CheckCircle2 size={12} />
                  টার্নওভার সম্পূর্ণ! আপনি টাকা তুলতে পারেন
                </p>
              )}
              <span className="text-[10px] text-white/40 font-bold uppercase underline">বিস্তারিত দেখুন</span>
            </div>
          </motion.div>
        )}

        {/* Bank Cards Section */}
        <section className="space-y-4">
          <div className="flex justify-between items-center text-white px-1">
             <h3 className="font-black text-sm uppercase tracking-widest flex items-center gap-2">
               <CreditCard size={18} className="text-yellow-500" />
               Select Payment Method
             </h3>
             <span className="text-[10px] font-bold bg-[#1d7470] px-3 py-1 rounded-full border border-white/10">{bankCards.length} / 5 Linked</span>
          </div>
          
          <div className="space-y-3">
            {bankCards.length > 0 ? (
              <>
                {bankCards.map((card: any, idx: number) => (
                  <motion.div 
                    key={card.id} 
                    onClick={() => setCurrentCardIndex(idx)}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    className={`relative p-5 rounded-2xl flex items-center justify-between text-white border-2 transition-all cursor-pointer ${currentCardIndex === idx ? 'bg-[#186a67] border-yellow-500 shadow-xl' : 'bg-[#1d7470] border-transparent hover:border-white/10'}`}
                  >
                    <div className="flex items-center gap-4">
                       <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${currentCardIndex === idx ? 'bg-yellow-500 shadow-lg' : 'bg-white shadow-md'}`}>
                         <Building2 size={24} className={currentCardIndex === idx ? 'text-black' : 'text-[#13615e]'} />
                       </div>
                       <div>
                          <p className="font-black text-sm uppercase tracking-tight">{card.bankName}</p>
                          <p className="text-xs font-mono text-white/60 tracking-wider mt-0.5">{card.accountNumber}</p>
                       </div>
                    </div>
                    {currentCardIndex === idx && (
                      <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center shadow-lg border-2 border-[#13615e]">
                        <Check size={14} className="text-black stroke-[4]" />
                      </div>
                    )}
                  </motion.div>
                ))}
                {bankCards.length < 5 && (
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowBankCardModal(true)}
                    className="w-full p-5 bg-[#1d7470]/40 rounded-2xl border-2 border-dashed border-white/10 flex items-center justify-center text-white/50 gap-2 hover:bg-[#1d7470]/60 transition-all border-teal-500/20"
                  >
                    <Plus size={20} />
                    <span className="text-sm font-bold uppercase tracking-widest">নতুন কার্ড যুক্ত করুন</span>
                  </motion.button>
                )}
              </>
            ) : (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={() => setShowBankCardModal(true)}
                className="p-8 bg-[#1d7470]/40 rounded-3xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center text-white/50 gap-4 cursor-pointer hover:bg-[#1d7470]/60 transition-all"
              >
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
                  <CreditCard size={32} />
                </div>
                <div className="text-center">
                  <p className="text-sm font-black uppercase tracking-[2px]">No Linked Cards</p>
                  <p className="text-[10px] text-white/30 uppercase mt-1">Please add a bank card to withdraw</p>
                </div>
                <button className="px-6 py-2.5 bg-yellow-500 text-black font-black text-xs rounded-full uppercase tracking-widest hover:bg-yellow-400 transition-colors mt-2">
                  Add Now
                </button>
              </motion.div>
            )}
          </div>
        </section>

        {/* Withdrawal Form */}
        <section className="space-y-4">
          <div className="bg-[#1a7a76] p-6 rounded-3xl border border-white/10 shadow-lg space-y-6">
            {/* Amount Input */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-black text-white/60 uppercase tracking-[2px]">Amount to Withdraw</label>
                <button 
                  onClick={() => setAmount(balance.toString())}
                  className="text-[10px] font-black text-yellow-500 uppercase tracking-widest hover:text-yellow-400 transition-colors"
                >
                  Max Limit
                </button>
              </div>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-yellow-500 font-black text-xl italic group-focus-within:scale-110 transition-transform">৳</div>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-black/20 rounded-2xl py-5 px-6 pl-12 text-2xl font-black text-white italic tracking-tighter focus:outline-none focus:ring-2 ring-yellow-500/50 transition-all placeholder:text-white/10"
                />
              </div>
              <div className="flex justify-between text-[8px] font-black text-white/40 uppercase tracking-widest px-2">
                <span>Minimum: ৳{minWithdraw}</span>
                <span>Currency: BDT</span>
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-3">
              <label className="text-[10px] font-black text-white/60 uppercase tracking-[2px]">Login Password</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-white/60 transition-colors">
                  <Lock size={20} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={transactionPassword}
                  onChange={(e) => setTransactionPassword(e.target.value)}
                  placeholder="********"
                  className="w-full bg-black/20 rounded-2xl py-4 px-6 pl-12 pr-12 text-white font-bold focus:outline-none focus:ring-2 ring-white/20 transition-all placeholder:text-white/10"
                />
                <button 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={handleWithdraw}
              disabled={isSubmitting}
              className={`w-full py-5 rounded-2xl text-white font-black text-lg uppercase tracking-[3px] shadow-2xl transition-all flex justify-center items-center gap-3 ${
                isSubmitting ? 'bg-orange-600/50 cursor-not-allowed opacity-70' : 'bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 active:scale-[0.98]'
              }`}
            >
              {isSubmitting ? <Loader2 size={24} className="animate-spin" /> : (
                <>
                  <Banknote size={24} />
                  Submit Withdraw
                </>
              )}
            </motion.button>
          </div>

          <div className="bg-yellow-500/5 border border-yellow-500/10 p-5 rounded-2xl space-y-3">
             <div className="flex items-start gap-3">
                <ShieldCheck size={18} className="text-yellow-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                   <p className="text-[10px] font-black text-yellow-500 uppercase tracking-widest">Withdrawal Policy</p>
                   <p className="text-[10px] font-bold text-white/50 leading-relaxed uppercase">
                     টাকা উত্তোলনের সময় আপনার দেওয়া তথ্যগুলো অবশ্যই সঠিক হতে হবে। ভুল তথ্যের কারণে লেনদেন ব্যর্থ হলে আমরা দায়ী থাকব না।
                   </p>
                </div>
             </div>
             <div className="flex items-start gap-3">
                <Clock size={18} className="text-yellow-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                   <p className="text-[10px] font-black text-yellow-500 uppercase tracking-widest">Processing Time</p>
                   <p className="text-[10px] font-bold text-white/50 leading-relaxed uppercase">
                     টাকা উত্তোলন সফল হলে ১০-৩০ মিনিটের মধ্যে আপনার একাউন্টে জমা হবে। কারিগরি সমস্যার ক্ষেত্রে ২ ঘন্টা পর্যন্ত সময় লাগতে পারে।
                   </p>
                </div>
             </div>
          </div>
        </section>
      </div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirmationModal && (
          <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-6 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-[#1d7470] rounded-3xl p-8 w-full max-w-md border border-white/10 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)]"
            >
              <div className="text-center mb-8">
                <div className="w-20 h-20 bg-yellow-500/20 text-yellow-500 rounded-full flex items-center justify-center mx-auto mb-5 shadow-inner border border-yellow-500/20">
                  <AlertCircle size={40} />
                </div>
                <h3 className="text-2xl font-black text-white italic tracking-tight uppercase">Confirm Withdrawal</h3>
                <p className="text-white/50 text-xs font-bold uppercase tracking-widest mt-2">আপনার নিম্নোক্ত তথ্যগুলো যাচাই করুন</p>
              </div>

              <div className="bg-[#155a57] rounded-2xl p-6 space-y-4 mb-8 border border-white/5">
                <div className="flex justify-between items-end border-b border-white/5 pb-4">
                  <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Total Amount</span>
                  <span className="text-2xl font-black text-yellow-500 italic tracking-tighter">৳ {amount ? parseFloat(amount).toLocaleString() : '0'}</span>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-[9px] font-black text-white/30 uppercase tracking-widest">Bank Name</p>
                    <p className="text-sm font-black text-white uppercase">{bankCards[currentCardIndex]?.bankName || 'N/A'}</p>
                  </div>
                  <div className="space-y-1 text-right">
                    <p className="text-[9px] font-black text-white/30 uppercase tracking-widest">Method</p>
                    <p className="text-sm font-black text-blue-400 uppercase">E-Wallet</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] font-black text-white/30 uppercase tracking-widest">Number</p>
                    <p className="text-sm font-black text-white font-mono tracking-wider">{bankCards[currentCardIndex]?.accountNumber || 'N/A'}</p>
                  </div>
                  <div className="space-y-1 text-right">
                    <p className="text-[9px] font-black text-white/30 uppercase tracking-widest">Status</p>
                    <p className="text-sm font-black text-emerald-400 uppercase">Verified</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={() => setShowConfirmationModal(false)}
                  className="flex-1 py-4 rounded-2xl text-white font-black uppercase text-sm border border-white/10 hover:bg-white/5 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={submitWithdrawRequest}
                  disabled={isSubmitting}
                  className="flex-1 py-4 rounded-2xl text-black font-black uppercase text-sm bg-yellow-500 hover:bg-yellow-400 transition-all shadow-xl shadow-yellow-500/20"
                >
                  Confirm
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Turnover Info Modal */}
      <AnimatePresence>
        {isTurnoverInfoModalOpen && (
          <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-6 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="bg-[#1d7470] rounded-3xl p-8 w-full max-w-sm border border-white/10 shadow-2xl"
            >
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-teal-500/20 text-teal-400 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Target size={32} />
                </div>
                <h3 className="text-xl font-bold text-white">টানওভার কি? (What is Turnover?)</h3>
              </div>
              
              <div className="space-y-4 text-white/70 text-xs leading-relaxed font-medium text-center">
                <p>
                  টার্নওভার হলো মোট বাজির পরিমাণ। আপনি যখন বোনাস বা ডিপোজিট করেন, তখন টাকা তোলার আগে আপনাকে একটি নির্দিষ্ট পরিমাণ বাজি ধরতে হয়।
                </p>
                <p className="bg-black/20 p-4 rounded-xl text-teal-300 italic">
                  উদাহরণ: আপনার টার্গেট ১০০০ টাকা এবং আপনি ৫০০ টাকা বাজি ধরেছেন, তাহলে আপনার টার্নওভার হবে ৫০০/১০০০।
                </p>
                <p>
                  পুরো টার্নওভার শেষ না করে টাকা উত্তোলনের আবেদন করা যাবে না।
                </p>
              </div>

              <button 
                onClick={() => setIsTurnoverInfoModalOpen(false)}
                className="w-full mt-8 py-4 bg-teal-500 text-white font-bold rounded-2xl hover:bg-teal-400 transition-colors"
              >
                বুঝেছি (Got it)
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <VIPLoader isVisible={isSubmitting} type="withdraw" />
      
      {showBankCardModal && (
        <BankCardModal 
          isOpen={showBankCardModal} 
          onClose={() => setShowBankCardModal(false)} 
          userId={user?.uid || ''} 
        />
      )}
    </div>
  );
}
