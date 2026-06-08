import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  ClipboardList, 
  MessageCircle, 
  Check, 
  Copy, 
  ShieldCheck, 
  ArrowRight, 
  Loader2, 
  X, 
  Wallet, 
  AlertTriangle, 
  Clock, 
  Coins, 
  HelpCircle, 
  Activity, 
  Info, 
  Lock,
  ExternalLink
} from 'lucide-react';
import Receipt from '../components/Receipt';
import { motion, AnimatePresence } from 'motion/react';
import { ToastType } from '../components/ui/Toast';
import GlobalImage from '../components/ui/GlobalImage';
import VIPLoader from '../components/ui/VIPLoader';
import { auth, db } from '../services/firebase';
import { collection, query, where, orderBy, getDocs, limit, onSnapshot } from 'firebase/firestore';

const paymentMethods = [
  { 
    id: 'bkash', 
    name: 'Bkash', 
    label: 'বিকাশ',
    logo: 'https://www.image2url.com/r2/default/images/1780940921769-2384e7bb-e411-4886-b24e-cd73b416106f.png',
    number: '01860137045'
  },
  { 
    id: 'nagad', 
    name: 'NAGAD', 
    label: 'নগদ',
    logo: 'https://www.image2url.com/r2/default/images/1780940834051-a83da4c8-921d-40ef-bca3-e8b271ebc2ff.png',
    number: '01789527096'
  },
  { 
    id: 'rocket', 
    name: 'Rocket', 
    label: 'রকেট',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b1/DBBL_Rocket_Logo.png/512px-DBBL_Rocket_Logo.png',
    number: '01860137045'
  },
  { 
    id: 'upi', 
    name: 'UPI', 
    label: 'UPI',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/UPI-Logo.svg/256px-UPI-Logo.svg.png',
    number: 'upi@example'
  },
  { 
    id: 'paytm', 
    name: 'PayTM', 
    label: 'PayTM',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/Paytm_Logo_%28standalone%29.svg/256px-Paytm_Logo_%28standalone%29.svg.png',
    number: 'paytm@example'
  },
  { 
    id: 'googlepay', 
    name: 'Google Pay', 
    label: 'গুগল পে',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c7/Google_Pay_Logo_%282020%29.svg/256px-Google_Pay_Logo_%282020%29.svg.png',
    number: 'gpay@example'
  },
  { 
    id: 'bank', 
    name: 'Bank Transfer', 
    label: 'ব্যাংক ট্রান্সফার',
    logo: 'https://icon-library.com/images/bank-icon-vector/bank-icon-vector-1.jpg',
    number: '123456789'
  }
];

const channels = [
  { id: 'ch1', name: 'M(min.300)' },
  { id: 'ch2', name: 'T(min.200)' },
  { id: 'ch3', name: 'PC(min.200)' },
  { id: 'ch4', name: 'E(min.100)' }
];

const quickAmounts = [300, 500, 1000, 2000, 3000, 5000, 10000];

export default function DepositView({ 
  onTabChange, 
  balance, 
  onBalanceUpdate, 
  userData, 
  showToast, 
  minDeposit = 100, 
  globalImages = {}, 
  isAdmin = false,
  onUpdateGlobalImage,
  onDepositSuccess
}: { 
  onTabChange: (tab: any) => void, 
  balance: number, 
  onBalanceUpdate: (amount: number) => void, 
  userData: any, 
  showToast: (msg: string, type?: ToastType) => void, 
  minDeposit?: number, 
  globalImages?: Record<string, string>, 
  isAdmin?: boolean,
  onUpdateGlobalImage?: (key: string, url: string) => Promise<void>,
  onDepositSuccess?: (amount: number, trxId?: string, senderNumber?: string, method?: string) => void
}) {
  const [step, setStep] = useState(1);
  const [selectedMethod, setSelectedMethod] = useState('nagad');
  const [selectedChannel, setSelectedChannel] = useState('ch1');
  const [amount, setAmount] = useState('300');
  const [selectedBonus, setSelectedBonus] = useState('none');
  const [trxId, setTrxId] = useState('');
  const [senderNumber, setSenderNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [deposits, setDeposits] = useState<any[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [showTrxTutorial, setShowTrxTutorial] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState<any>(null);

  const copyToClipboard = (text: string) => {
    const fallbackCopy = (val: string) => {
      const textArea = document.createElement("textarea");
      textArea.value = val;
      // Position out of sight securely
      textArea.style.position = "fixed";
      textArea.style.top = "0";
      textArea.style.left = "0";
      textArea.style.opacity = "0";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        const successful = document.execCommand('copy');
        if (successful) {
          setIsCopied(true);
          showToast('নাম্বার কপি করা হয়েছে!', 'success');
          setTimeout(() => setIsCopied(false), 2000);
        } else {
          showToast('কপি ব্যর্থ হয়েছে! অনুগ্রহ করে ম্যানুয়ালি কপি করুন।', 'warning');
        }
      } catch (err) {
        console.error('Fallback copy failed:', err);
        showToast('কপি ব্যর্থ হয়েছে!', 'error');
      }
      document.body.removeChild(textArea);
    };

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text)
        .then(() => {
          setIsCopied(true);
          showToast('নাম্বার কপি করা হয়েছে!', 'success');
          setTimeout(() => setIsCopied(false), 2000);
        })
        .catch((err) => {
          console.warn('Navigator clipboard failed, trying fallback:', err);
          fallbackCopy(text);
        });
    } else {
      fallbackCopy(text);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialLoading(false);
    }, 1200);
    
    // Real-time listener for deposit history
    if (userData?.id) {
      const q = query(
        collection(db, 'users', userData.id, 'transactions'), 
        orderBy('createdAt', 'desc'), 
        limit(50)
      );
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const history = snapshot.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data()
          }))
          .filter((t: any) => t.type === 'deposit');
        setDeposits(history);
      }, (error) => {
        console.error("Deposit History Listener Error:", error);
      });
      
      return () => unsubscribe();
    }
    
    return () => {
      clearTimeout(timer);
    };
  }, [userData?.id]);

  // Countdown timer effect
  useEffect(() => {
    if (step === 2) {
      setTimeLeft(600); // reset to 10 minutes (600 seconds)
      const interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [step]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  const handleNextStep = () => {
    const depositAmount = parseFloat(amount);
    if (isNaN(depositAmount) || depositAmount < minDeposit) {
      showToast(`সর্বনিম্ন ডিপোজিট ${minDeposit} টাকা`, 'warning');
      return;
    }
    setStep(2);
  };

  const [newAccountNumber, setNewAccountNumber] = useState(paymentMethods.find(m => m.id === selectedMethod)?.number || '');

  useEffect(() => {
    const globalNum = globalImages[`payment_number_${selectedMethod}`];
    if (globalNum) {
      setNewAccountNumber(globalNum);
    } else {
      setNewAccountNumber(paymentMethods.find(m => m.id === selectedMethod)?.number || '');
    }
  }, [selectedMethod, globalImages]);

  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const handleDeposit = async () => {
    if (!senderNumber.trim()) {
      showToast('আপনার মোবাইল নাম্বার দিন', 'warning');
      return;
    }
    if (!trxId.trim()) {
      showToast('Transaction ID is required', 'warning');
      return;
    }
    setShowConfirmModal(true);
  };

  const confirmDeposit = async () => {
    setShowConfirmModal(false);
    setIsSubmitting(true);
    
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Not authenticated");
      
      // Artificial deluxe processing delay to let the VIP payment gateway animations play smoothly
      await new Promise(resolve => setTimeout(resolve, 3200));
      
      // Notify Telegram
      await fetch('/api/telegram/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'Deposit',
          userId: user.uid,
          username: userData.username,
          balance: userData.balance + parseFloat(amount),
          details: `Amount: ${parseFloat(amount)}, Method: ${selectedMethod}`
        })
      });

      if (onDepositSuccess) {
        await onDepositSuccess(parseFloat(amount), trxId, senderNumber, selectedMethod);
      } else {
        // Fallback testing
        showToast('Deposit confirmed! / ডিপোজিট সফল হয়েছে!', 'success');
      }
      
      setReceiptData({ type: 'deposit', amount: parseFloat(amount), trxId, date: new Date().toLocaleString(), status: 'Pending' });
      setShowReceipt(true);
      
      setIsSubmitting(false);
      setTrxId('');
      setStep(1);
      setShowHistory(true);

    } catch (err: any) {
      setIsSubmitting(false);
      showToast(err.message || 'Deposit failed!', 'error');
    }
  };

  const isNextEnabled = amount !== '' && parseFloat(amount) >= minDeposit;

  // Real-time Number validation helper
  // Custom App Launcher Logic
  const handleAppLaunch = () => {
    const isAndroid = /android/i.test(navigator.userAgent || '');
    let url = '';
    let androidIntent = '';

    switch (selectedMethod) {
      case 'bkash':
        url = 'bkash://';
        androidIntent = `intent://#Intent;scheme=bkash;package=com.bKash.customerapp;S.browser_fallback_url=https://play.google.com/store/apps/details?id=com.bKash.customerapp;end`;
        break;
      case 'nagad':
        url = 'nagad://';
        androidIntent = `intent://#Intent;scheme=nagad;package=com.konasl.nagad;S.browser_fallback_url=https://play.google.com/store/apps/details?id=com.konasl.nagad;end`;
        break;
      case 'rocket':
        url = 'rocket://';
        androidIntent = `intent://#Intent;scheme=rocket;package=com.dbbl.mbs.apps.main;S.browser_fallback_url=https://play.google.com/store/apps/details?id=com.dbbl.mbs.apps.main;end`;
        break;
      case 'upi':
        url = `upi://pay?pa=${newAccountNumber}&pn=Merchant&am=${amount}`;
        androidIntent = `intent://pay?pa=${newAccountNumber}&pn=Merchant&am=${amount}#Intent;scheme=upi;package=com.google.android.apps.nbu.paisa.user;S.browser_fallback_url=https://play.google.com/store/apps/details?id=com.google.android.apps.nbu.paisa.user;end`;
        break;
      case 'paytm':
        url = `paytmmp://pay?pa=${newAccountNumber}&pn=Merchant&am=${amount}`;
        androidIntent = `intent://pay?pa=${newAccountNumber}&pn=Merchant&am=${amount}#Intent;scheme=paytmmp;package=net.one97.paytm;S.browser_fallback_url=https://play.google.com/store/apps/details?id=net.one97.paytm;end`;
        break;
      default:
        return;
    }

    if (isAndroid && androidIntent) {
      window.location.href = androidIntent;
    } else {
      window.location.href = url;
    }
  };

  const isSenderValid = () => {
    const clean = senderNumber.trim();
    if (selectedMethod === 'upi') return clean.length > 3;
    if (selectedMethod === 'bank') return clean.length >= 8;
    return clean.length === 11 && clean.startsWith('01');
  };

  if (isInitialLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#111] relative select-none font-sans overflow-hidden">
        {/* Luxury Background Graphics */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(33,129,125,0.15)_0%,transparent_70%)]" />
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#21817d]/30 to-transparent" />
        
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative mb-8"
        >
          {/* Animated Glow Rings */}
          <div className="absolute inset-0 bg-emerald-500/10 blur-[90px] animate-pulse rounded-full" />
          <div className="absolute inset-0 -m-8 border border-[#21817d]/20 rounded-full animate-[spin_12s_linear_infinite]" />
          <div className="absolute inset-0 -m-12 border border-[#21817d]/10 rounded-full animate-[spin_18s_linear_infinite_reverse]" />
          
          {/* Central Logo/Icon Container */}
          <div className="relative w-28 h-28 bg-gradient-to-br from-[#1d7470] to-[#0a4a44] rounded-[32px] p-0.5 shadow-2xl border border-white/10 flex items-center justify-center">
            <div className="absolute inset-0 bg-emerald-500/5 rounded-[30px]" />
            <Wallet className="text-[#3ed0ca] relative z-10 animate-bounce" size={48} strokeWidth={1.5} />
            
            {/* Spinning Arc */}
            <svg className="absolute inset-0 w-full h-full -rotate-90">
              <circle
                cx="56"
                cy="56"
                r="50"
                fill="none"
                stroke="white"
                strokeWidth="2"
                strokeOpacity="0.05"
              />
              <motion.circle
                cx="56"
                cy="56"
                r="50"
                fill="none"
                stroke="#3ed0ca"
                strokeWidth="2.5"
                strokeDasharray="100 200"
                animate={{ strokeDashoffset: [0, -300] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: "linear" }}
              />
            </svg>
          </div>
        </motion.div>

        <div className="text-center space-y-3 z-10 px-6">
          <motion.h2 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-white text-xl font-black uppercase tracking-[0.25em]"
          >
            Securing Connection
          </motion.h2>
          
          <motion.div 
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             transition={{ delay: 0.4 }}
             className="flex items-center justify-center gap-2"
          >
            <span className="w-2 h-2 rounded-full bg-[#3ed0ca] animate-bounce [animation-delay:-0.3s]" />
            <span className="w-2 h-2 rounded-full bg-[#3ed0ca] animate-bounce [animation-delay:-0.15s]" />
            <span className="w-2 h-2 rounded-full bg-[#3ed0ca] animate-bounce" />
          </motion.div>

          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-teal-300/60 text-[10px] font-black uppercase tracking-widest leading-relaxed"
          >
            Encrypting Gateway Session...
          </motion.p>
        </div>
      </div>
    );
  }

  if (showHistory) {
    return (
      <div className="flex flex-col min-h-screen bg-[#111] font-sans text-white relative">
        <header className="bg-[#1a1a1a] border-b border-white/5 p-4 flex items-center justify-between sticky top-0 z-50">
          <div className="flex items-center gap-4 w-full relative">
            <button 
              onClick={() => setShowHistory(false)} 
              className="absolute left-0 p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-full transition-all"
            >
              <ChevronLeft size={24} />
            </button>
            <h1 className="text-lg font-black text-center w-full uppercase tracking-wider">Deposit History</h1>
          </div>
        </header>

        <div className="flex bg-[#161616] border-b border-white/5 p-1 sticky top-[57px] z-45">
          <button 
            onClick={() => setShowHistory(false)} 
            className="flex-1 py-3 text-xs font-black uppercase tracking-wider text-gray-500 hover:text-white transition-all rounded-xl"
          >
            Deposit Form
          </button>
          <button 
            className="flex-1 py-3 text-xs font-black uppercase tracking-wider text-[#3ed0ca] bg-white/5 rounded-xl border border-[#3ed0ca]/15 shadow-inner"
          >
            History List
          </button>
        </div>

        <main className="p-4 space-y-3 flex-1 overflow-y-auto">
          {deposits.length > 0 ? (
            deposits.map(d => (
              <div 
                key={d.id} 
                className="p-4 bg-gradient-to-r from-white/5 to-transparent border border-white/5 hover:border-white/10 rounded-2xl flex justify-between items-center transition-all"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-sm uppercase text-gray-200">
                      {paymentMethods.find(m => m.id === d.method)?.label || d.method}
                    </span>
                    <span className="text-[9px] font-black tracking-widest text-[#3ed0ca] bg-[#3ed0ca]/10 px-2 py-0.5 rounded border border-[#3ed0ca]/10 uppercase">
                      {d.method}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="font-mono text-[10px] text-gray-500 break-all">{d.trxId}</p>
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(d.trxId);
                        showToast('TrxID কপি করা হয়েছে!', 'success');
                      }}
                      className="text-gray-500 hover:text-[#3ed0ca] transition-colors"
                    >
                      <Copy size={12} />
                    </button>
                  </div>
                  {d.senderNumber && (
                    <p className="text-[10px] text-gray-400">
                      From: <span className="font-mono text-gray-300 font-bold">{d.senderNumber}</span>
                    </p>
                  )}
                  {d.date && (
                    <p className="text-[9px] text-gray-600 font-medium">
                      {new Date(d.date).toLocaleString('bn-BD')}
                    </p>
                  )}
                </div>
                <div className="text-right space-y-1">
                  <p className="font-black text-base text-[#3ed0ca]">৳{d.amount}</p>
                  <p className={`text-[10px] font-black tracking-wider uppercase px-2 py-0.5 rounded-full inline-block ${
                    d.status === 'approved' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 
                    d.status === 'rejected' ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 
                    'bg-amber-500/10 text-amber-500 border border-amber-500/20 animate-pulse'
                  }`}>
                    {d.status === 'approved' ? 'সফল' : d.status === 'rejected' ? 'বাতিল' : 'পেন্ডিং'}
                  </p>
                  {d.status === 'pending' && (
                    <div className="w-full bg-white/5 rounded-full h-1 mt-1 overflow-hidden">
                      <motion.div 
                        initial={{ width: "0%" }}
                        animate={{ width: "100%" }}
                        transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
                        className="bg-amber-500 h-1 rounded-full"
                      />
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-24 space-y-3">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto text-gray-500">
                <ClipboardList size={32} />
              </div>
              <p className="text-sm font-bold text-gray-500 tracking-wide">কোনো ডিপোজিট ইতিহাস পাওয়া যায়নি</p>
            </div>
          )}
        </main>
        {showReceipt && receiptData && (
          <Receipt 
            {...receiptData} 
            onClose={() => setShowReceipt(false)} 
          />
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#111] font-sans text-white select-none">
      {/* Header */}
      <header className="bg-[#161616] border-b border-white/5 p-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-4 w-full relative">
          <button 
            onClick={() => step === 2 ? setStep(1) : onTabChange('home')} 
            className="absolute left-0 p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-full transition-all"
          >
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-md font-black uppercase tracking-widest text-center w-full">
            {step === 1 ? 'Deposit Portal' : 'Payment Verification'}
          </h1>
        </div>
      </header>

      {step === 1 && (
        <div className="flex bg-[#161616] border-b border-white/5 p-1 sticky top-[57px] z-45">
          <button 
            className="flex-1 py-3 text-xs font-black uppercase tracking-wider text-[#3ed0ca] bg-white/5 rounded-xl border border-[#3ed0ca]/15 shadow-inner"
          >
            Deposit Form
          </button>
          <button 
            onClick={() => setShowHistory(true)} 
            className="flex-1 py-3 text-xs font-black uppercase tracking-wider text-gray-500 hover:text-white transition-all rounded-xl"
          >
            Deposit History
          </button>
        </div>
      )}

      <main className="flex-1 overflow-y-auto pb-24">
        {step === 1 ? (
          <div className="p-4 space-y-4">
            {/* Step indicators */}
            <div className="flex items-center justify-between px-3 py-1.5 bg-white/5 rounded-xl border border-white/5">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#3ed0ca] text-black font-black text-[10px] flex items-center justify-center">1</span>
                <span className="text-[10px] font-black uppercase tracking-wider text-[#3ed0ca]">ডিপোজিট বিবরণ</span>
              </div>
              <div className="w-6 h-[1px] bg-white/10" />
              <div className="flex items-center gap-2 opacity-50">
                <span className="w-5 h-5 rounded-full bg-white/10 text-gray-400 font-bold text-[10px] flex items-center justify-center">2</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">লেনদেন নিশ্চিতকরণ</span>
              </div>
            </div>

            {/* Payment Method Selection Group */}
            <div className="space-y-2">
              <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-widest block ml-1">১. পেমেন্ট মেথড নির্বাচন করুন</h3>
              <div className="grid grid-cols-2 gap-2.5">
                {paymentMethods.map((method) => {
                  const isActive = selectedMethod === method.id;
                  let brandBorder = isActive ? 'border-[#3ed0ca] bg-[#142121]' : 'border-white/5 bg-[#161616] hover:border-white/10 hover:bg-[#1a1a1a]';
                  let textStyle = isActive ? 'text-[#3ed0ca]' : 'text-gray-400';
                  
                  if (method.id === 'bkash') {
                    brandBorder = isActive ? 'border-[#e2125a] bg-[#1e0f14]' : brandBorder;
                    textStyle = isActive ? 'text-[#e2125a]' : textStyle;
                  } else if (method.id === 'nagad') {
                    brandBorder = isActive ? 'border-[#f47321] bg-[#22120a]' : brandBorder;
                    textStyle = isActive ? 'text-[#f47321]' : textStyle;
                  } else if (method.id === 'rocket') {
                    brandBorder = isActive ? 'border-[#8c2d82] bg-[#1a0f19]' : brandBorder;
                    textStyle = isActive ? 'text-[#8c2d82]' : textStyle;
                  } else if (isActive) {
                    brandBorder = 'border-[#ffd15c] bg-[#1c1a13]';
                    textStyle = 'text-[#ffd15c]';
                  }

                  return (
                    <div
                      key={method.id}
                      onClick={() => setSelectedMethod(method.id)}
                      className={`relative p-2.5 rounded-2xl border-2 transition-all duration-300 cursor-pointer flex flex-col items-center justify-center gap-1.5 h-20 group overflow-hidden ${brandBorder}`}
                    >
                      {isActive && (
                        <div className="absolute top-1.5 right-1.5 w-3.5 h-3.5 rounded-full flex items-center justify-center bg-current z-10" style={{ color: method.id === 'bkash' ? '#e2125a' : method.id === 'nagad' ? '#f47321' : method.id === 'rocket' ? '#8c2d82' : '#3ed0ca' }}>
                          <Check size={8} className="text-white animate-scale-in" strokeWidth={5} />
                        </div>
                      )}
                      
                      <div className="relative w-12 h-9 flex items-center justify-center p-0.5 group-hover:scale-105 transition-all">
                        <GlobalImage 
                          imageKey={`payment_logo_${method.id}`}
                          defaultUrl={method.logo}
                          currentUrl={globalImages[`payment_logo_${method.id}`]}
                          alt={method.name}
                          showToast={showToast}
                          className="w-full h-full object-contain filter drop-shadow-[0_1.5px_3px_rgba(0,0,0,0.6)]"
                          isAdmin={false}
                          updateGlobalImage={(url) => onUpdateGlobalImage ? onUpdateGlobalImage(`payment_logo_${method.id}`, url) : Promise.resolve()}
                        />
                      </div>
                      
                      <div className="text-center">
                        <p className={`text-[11px] font-black uppercase tracking-wider ${textStyle}`}>
                          {method.label}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Payment Channel */}
            <div className="space-y-1.5 border-t border-white/5 pt-3.5">
              <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-widest block ml-1">২. গেটওয়ে চ্যানেল নির্বাচন</h3>
              <div className="grid grid-cols-4 gap-2">
                {channels.map((channel) => {
                  const isActive = selectedChannel === channel.id;
                  return (
                    <button
                      key={channel.id}
                      onClick={() => setSelectedChannel(channel.id)}
                      className={`py-2 px-1 rounded-xl border-2 text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1 ${
                        isActive 
                          ? 'border-[#3ed0ca] text-[#3ed0ca] bg-[#3ed0ca]/15 shadow-[0_0_10px_rgba(62,208,202,0.15)] bg-emerald-500/5' 
                          : 'border-white/5 text-gray-400 bg-[#161616] hover:text-white hover:border-white/10'
                      }`}
                    >
                      {isActive && <Check size={10} strokeWidth={4} />}
                      {channel.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Deposit Amount Input */}
            <div className="space-y-2.5 border-t border-white/5 pt-3.5">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-widest">৩. ডিপোজিট পরিমাণ</h3>
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">সর্বনিম্ন: ৳{minDeposit}</span>
              </div>
              
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-base font-black text-gray-500">৳</span>
                <input
                  type="number"
                  pattern="[0-9]*"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder={`${minDeposit} - 30,000`}
                  className="w-full bg-[#161616] border border-white/5 focus:border-[#3ed0ca]/30 rounded-xl py-3 pl-9 pr-6 text-white font-black text-lg focus:outline-none placeholder:text-gray-700 tracking-wider"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-amber-500">*</span>
              </div>

              {/* Quick selectors */}
              <div className="grid grid-cols-4 gap-2">
                {quickAmounts.map((amt) => {
                  const isActive = amount === amt.toString();
                  return (
                    <button
                      key={amt}
                      onClick={() => setAmount(amt.toString())}
                      className={`py-1.5 rounded-lg border text-[10px] font-black transition-all ${
                        isActive 
                          ? 'border-[#ffc107] text-[#ffc107] bg-[#ffc107]/5 font-black' 
                          : 'border-white/5 text-gray-400 bg-[#161616] hover:text-white hover:border-white/10'
                      }`}
                    >
                      ৳{amt}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Offer / Claim bonus */}
            <div className="space-y-2 border-t border-white/5 pt-3.5">
              <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-widest block ml-1">৪. বোনাস অফার চয়ন করুন</h3>
              
              <div className="space-y-2">
                <button 
                  onClick={() => setSelectedBonus('daily8')}
                  className={`w-full p-2.5 rounded-xl border-2 flex items-start gap-2.5 transition-all text-left relative overflow-hidden ${
                    selectedBonus === 'daily8' 
                      ? 'border-[#ffc107] bg-[#ffc107]/5' 
                      : 'border-white/5 bg-[#161616] hover:bg-[#1a1a1a]'
                  }`}
                >
                  <div className={`w-4.5 h-4.5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    selectedBonus === 'daily8' ? 'border-[#ffc107]' : 'border-gray-600'
                  }`}>
                    {selectedBonus === 'daily8' && <div className="w-2.5 h-2.5 rounded-full bg-[#ffc107]"></div>}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center">
                      <span className={`block font-black text-xs ${selectedBonus === 'daily8' ? 'text-[#ffc107]' : 'text-gray-200'}`}>
                        Daily Deposit Reward 100%
                      </span>
                      <span className="text-[9px] font-black text-yellow-500 bg-yellow-500/10 px-1.5 py-0.5 rounded border border-yellow-500/20">
                        b=200
                      </span>
                    </div>
                    <p className="text-gray-500 text-[10px] mt-0.5 leading-normal">
                      প্রথম দৈনিক ডিপোজিট অফারে ১০০% অতিরিক্ত বোনাস উপভোগ করুন।
                    </p>
                  </div>
                </button>

                <button 
                  onClick={() => setSelectedBonus('none')}
                  className={`w-full py-2.5 rounded-xl border-2 flex items-center justify-center gap-2 transition-all relative ${
                    selectedBonus === 'none' 
                      ? 'border-white/20 bg-white/5' 
                      : 'border-white/5 bg-[#161616] hover:bg-[#1a1a1a]'
                  }`}
                >
                  <div className="absolute left-3">
                    <div className={`w-4.5 h-4.5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                      selectedBonus === 'none' ? 'border-white' : 'border-gray-600'
                    }`}>
                      {selectedBonus === 'none' && <div className="w-2.5 h-2.5 rounded-full bg-white"></div>}
                    </div>
                  </div>
                  <span className={`font-black text-[10px] uppercase tracking-widest ${selectedBonus === 'none' ? 'text-white' : 'text-gray-500'}`}>
                    বোনাস ছাড়া খেলবো (Disclaim Bonus)
                  </span>
                </button>
              </div>
            </div>

            {/* Next trigger CTA */}
            <div className="pt-2">
              <button 
                onClick={handleNextStep}
                disabled={!isNextEnabled}
                className={`w-full py-3 font-black text-xs uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg active:scale-95 ${
                  isNextEnabled 
                    ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-black shadow-[0_4px_12px_rgba(234,179,8,0.2)]' 
                    : 'bg-white/5 text-gray-600 cursor-not-allowed border border-white/5 shadow-inner'
                }`}
              >
                <span>নিশ্চিত করুন এবং পরবর্তী ধাপে যান</span>
                <ArrowRight size={14} strokeWidth={3} />
              </button>
            </div>
          </div>
        ) : (
          <div className="p-4 space-y-4">
            {/* Step indicators */}
            <div className="flex items-center justify-between px-3 py-1.5 bg-white/5 rounded-xl border border-white/5">
              <div className="flex items-center gap-2 opacity-50">
                <span className="w-5 h-5 rounded-full bg-white/10 text-gray-500 font-bold text-[10px] flex items-center justify-center">1</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">ডিপোজিট বিবরণ</span>
              </div>
              <div className="w-6 h-[1px] bg-white/10" />
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#3ed0ca] text-black font-black text-[10px] flex items-center justify-center">2</span>
                <span className="text-[10px] font-black uppercase tracking-wider text-[#3ed0ca]">লেনদেন নিশ্চিতকরণ</span>
              </div>
            </div>

            {/* Premium Countdown Clock */}
            <div className="bg-[#1c1c1c] border border-white/5 rounded-2xl p-3 flex items-center justify-between relative overflow-hidden">
              <div className="absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-[#3ed0ca]/5 to-transparent pointer-events-none" />
              <div className="space-y-0.5">
                <p className="text-[9px] text-gray-500 uppercase font-black tracking-widest">অর্ডার পরিশোধের সুনির্দিষ্ট সময়</p>
                <p className="text-gray-300 text-[10px] font-semibold">অনুগ্রহ করে নিম্নোক্ত সময়ের মধ্যে ক্যাশআউট করুন</p>
              </div>
              
              <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl border ${
                timeLeft < 120 
                  ? 'bg-red-500/10 border-red-500/20 text-red-400 animate-pulse' 
                  : 'bg-[#3ed0ca]/10 border-[#3ed0ca]/20 text-[#3ed0ca]'
              }`}>
                <Clock size={12} className={timeLeft < 120 ? 'animate-bounce' : ''} />
                <span className="font-mono text-sm font-black tracking-wider">{formatTime(timeLeft)}</span>
              </div>
            </div>

            {/* Error Rules Warnings */}
            <div className="border border-red-500/20 bg-red-500/5 rounded-2xl p-2.5 flex items-start gap-2.5">
              <AlertTriangle className="text-red-500 flex-shrink-0 mt-0.5" size={16} />
              <div className="space-y-0.5">
                <p className="text-red-400 font-black text-[11px] leading-normal">
                  সতর্কতা: টাকার পরিমাণ কম বা বেশি ক্যাশআউট করবেন না!
                </p>
                <p className="text-[9px] text-gray-400 leading-normal">
                  আপনি যদি টাকার পরিমাণ পরিবর্তন করেন (৳{amount}-এর পরিবর্তে অন্য কোনো অঙ্ক পাঠান), তাহলে পেমেন্ট স্বয়ংক্রিয় প্রসেস হবে না।
                </p>
              </div>
            </div>

            {/* Prominent Receipt/Voucher Summary card */}
            <div className="bg-gradient-to-b from-[#222] to-[#1c1c1c] border border-white/10 rounded-2xl overflow-hidden shadow-xl relative">
              <div className="p-3 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-white rounded-full p-1 flex items-center justify-center shadow-lg">
                    <GlobalImage 
                      imageKey={`payment_logo_${selectedMethod}`}
                      defaultUrl={paymentMethods.find(m => m.id === selectedMethod)?.logo || ''}
                      currentUrl={globalImages[`payment_logo_${selectedMethod}`]}
                      alt="Logo"
                      showToast={showToast}
                      className="w-full h-full object-contain"
                      isAdmin={false}
                    />
                  </div>
                  <span className="text-[11px] font-black uppercase tracking-widest text-white">
                    {paymentMethods.find(m => m.id === selectedMethod)?.name} Deposit Order
                  </span>
                </div>
                
                <span className="text-[8px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded-full uppercase tracking-widest">
                  Active Order
                </span>
              </div>

              <div className="p-4 text-center space-y-0.5 bg-black/20">
                <span className="text-[9px] text-gray-500 uppercase font-black tracking-widest">সঠিক ক্যাশআউট পরিমাণ</span>
                <p className="text-3xl font-black text-[#ffc107] tracking-tight">৳ {amount}</p>
              </div>
            </div>

            {/* Cashout Account Details Area */}
            <div className="bg-[#161616] border border-white/5 rounded-2xl p-4 space-y-3">
              <div className="space-y-0.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                    <span>১. নিচে দেয়া নাম্বারে ক্যাশআউট করুন</span>
                    <span className="text-[8px] text-yellow-500 bg-yellow-500/10 px-1.5 py-0.5 rounded font-black border border-yellow-500/20 uppercase tracking-tight">শুধুমাত্র ক্যাশআউট</span>
                  </span>
                </div>
                
                <p className="text-[9px] text-gray-500 leading-normal">
                  {selectedMethod === 'bank' 
                    ? 'এই ব্যাংক একাউন্টে টাকা পাঠান' 
                    : selectedMethod === 'upi' 
                      ? 'এই UPI ID-তে পেমেন্ট করুন' 
                      : `এই ${paymentMethods.find(m => m.id === selectedMethod)?.name} নাম্বারে শুধুমাত্র ক্যাশআউট গ্রহণ করা হয়`}
                </p>
              </div>

              <div 
                onClick={() => copyToClipboard(newAccountNumber)}
                className="flex items-center justify-between gap-2.5 bg-black/40 hover:bg-black/60 border border-white/5 hover:border-white/10 p-3 rounded-xl cursor-pointer transition-all duration-200 active:scale-[0.99] group"
                title="কপি করতে ক্লিক করুন"
              >
                <div className="flex flex-col">
                  <span className="text-base font-black text-red-500 tracking-wider break-all select-all font-mono group-hover:text-red-400 dynamic-number">
                    {newAccountNumber}
                  </span>
                  <span className="text-[8px] text-gray-500 group-hover:text-gray-400 font-bold transition-colors">
                    কপি করতে ক্লিক করুন (Click to copy)
                  </span>
                </div>
                
                <button 
                  onClick={(e) => {
                    e.stopPropagation(); // Avoid double copying when clicking button
                    copyToClipboard(newAccountNumber);
                  }}
                  className={`px-3 py-1.5 border rounded-lg font-bold text-[10px] flex items-center gap-1 transition-all active:scale-95 shrink-0 ${
                    isCopied 
                      ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400' 
                      : 'border-white/15 bg-white/5 hover:bg-white/10 text-white'
                  }`}
                >
                  {isCopied ? <Check size={10} strokeWidth={3} /> : <Copy size={10} />}
                  <span>{isCopied ? 'কপি হয়েছে' : 'কপি করুন'}</span>
                </button>
              </div>

              {/* Seamless App Launcher */}
              {['bkash', 'nagad', 'rocket', 'upi', 'paytm'].includes(selectedMethod) && (
                <button 
                  onClick={handleAppLaunch}
                  className="w-full flex justify-center items-center gap-1.5 py-2.5 px-3 bg-gradient-to-r from-[#3ed0ca]/10 to-transparent border border-[#3ed0ca]/20 rounded-xl text-[#3ed0ca] font-black text-[10px] uppercase tracking-wider hover:bg-[#3ed0ca]/20 transition-all active:scale-95 shadow-[0_3px_10px_rgba(62,208,202,0.08)]"
                >
                  <ExternalLink size={12} strokeWidth={2.5} />
                  <span>Open {paymentMethods.find(m => m.id === selectedMethod)?.name} App & Pay ৳{amount}</span>
                </button>
              )}
            </div>

            {/* Inputs Area */}
            <div className="bg-[#161616] border border-white/5 rounded-2xl p-4 space-y-4">
              {/* Sender Number Field */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center ml-1">
                  <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest">
                    ২. আপনার পেমেন্ট নম্বর <span className="text-red-500 font-bold">*</span>
                  </label>
                  {isSenderValid() && (
                    <span className="text-[8px] font-black text-emerald-400 bg-emerald-500/10 px-1 py-0.5 rounded border border-emerald-500/20 uppercase tracking-tight flex items-center gap-0.5">
                      <Check size={8} strokeWidth={4} /> Validated
                    </span>
                  )}
                </div>
                <input 
                  type="text" 
                  pattern="[0-9]*"
                  value={senderNumber}
                  onChange={(e) => setSenderNumber(e.target.value)}
                  placeholder="যে নাম্বার থেকে টাকা পাঠিয়েছেন (১১ ডিজিট)"
                  className="w-full p-2.5 bg-black/30 border border-white/5 focus:border-[#3ed0ca]/30 focus:outline-none rounded-xl text-sm font-black text-gray-100 placeholder:text-gray-700 tracking-wider text-center font-mono"
                />
              </div>

              {/* Transaction ID Field */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center ml-1">
                  <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest">
                    ৩. ট্রানজেকশন আইডি (TrxID) <span className="text-red-500 font-bold">*</span>
                  </label>
                  {trxId.trim().length >= 8 && (
                    <span className="text-[8px] font-black text-[#ffc107] bg-yellow-500/10 px-1 py-0.5 rounded border border-yellow-500/20 uppercase tracking-tight flex items-center gap-0.5 animate-pulse">
                      Ready
                    </span>
                  )}
                </div>

                <div className="relative">
                  <input 
                    type="text" 
                    value={trxId}
                    onChange={(e) => setTrxId(e.target.value)}
                    placeholder="এখানে ৮ থেকে ১০ ডিজিটের TrxID দিন"
                    className="w-full p-2.5 bg-black/30 border-2 border-red-500/30 focus:border-red-500 focus:outline-none rounded-xl text-sm font-black text-red-500 placeholder:text-gray-700 tracking-wider text-center uppercase font-mono transition-colors"
                  />
                </div>

                {/* Tutorial Accordion Block Header clickable */}
                <div 
                  onClick={() => setShowTrxTutorial(!showTrxTutorial)}
                  className="bg-white/5 rounded-xl p-2 flex items-center justify-between cursor-pointer border border-white/5 hover:bg-white/10 transition-all mt-1"
                >
                  <span className="text-[9px] font-black uppercase text-gray-300 tracking-wider flex items-center gap-1">
                    <HelpCircle size={12} className="text-[#3ed0ca]" />
                    <span>কিভাবে TrxID খুঁজে বের করবেন? (নির্দেশিকা)</span>
                  </span>
                  
                  <span className="text-[9px] font-black text-teal-400 uppercase">
                    {showTrxTutorial ? 'লুকান ▲' : 'দেখুন ▼'}
                  </span>
                </div>

                {/* Tutorial Body Content */}
                <AnimatePresence>
                  {showTrxTutorial && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden bg-[#181818]/60 border border-white/5 rounded-2xl"
                    >
                      <div className="p-4 space-y-4 text-xs text-gray-400 leading-relaxed font-black">
                        <div className="space-y-1.5">
                          <p className="text-[#ffc107] uppercase text-[10px] block font-black">বিকাশ (bKash) মোবাইল অ্যাপ:</p>
                          <p className="font-medium text-[11px] text-gray-300">
                            ১. ক্যাশআউট শেষ হলে স্ক্রিনে '১-অঙ্কের TrxID' দেখতে পাবেন।
                          </p>
                          <p className="font-medium text-[11px] text-gray-300">
                            ২. অথবা বিকাশ অ্যাপের মেনু (উপরের ডান কোণায়) থেকে "লেনদেন" নির্বাচন করুন।
                          </p>
                        </div>
                        
                        <div className="h-[1px] bg-white/5" />

                        <div className="space-y-1.5">
                          <p className="text-[#ffc107] uppercase text-[10px] block font-black">নগদ (Nagad) মোবাইল অ্যাপ:</p>
                          <p className="font-medium text-[11px] text-gray-300">
                            ১. লেনদেন শেষে রিসিটের উপরে 'TrxID' বা ট্রানজেকশন আইডি দেখতে পরবেন।
                          </p>
                          <p className="font-medium text-[11px] text-gray-300">
                            ২. অথবা নগদ মেনু থেকে "ইতিহাস বা লেনদেন" ক্লিক করলেই ট্রানজেকশন আইডি দেখতে পাবেন।
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Confirm Payment Submission CTA */}
            <div className="pt-2">
              <button 
                disabled={isSubmitting || !senderNumber.trim() || !trxId.trim()}
                onClick={handleDeposit}
                className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 disabled:from-white/5 disabled:to-white/5 text-black disabled:text-gray-600 rounded-xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-1.5 shadow-[0_4px_12px_rgba(16,185,129,0.1)]"
              >
                {isSubmitting ? (
                  <Loader2 className="animate-spin text-gray-500" size={16} />
                ) : (
                  <>
                    <ShieldCheck size={14} strokeWidth={3} />
                    <span>পেমেন্ট রিকোয়েস্ট সাবমিট করুন</span>
                  </>
                )}
              </button>
            </div>

            {/* Privacy Shield footer block */}
            <div className="pt-2 border-t border-white/5 space-y-1.5">
              <div className="flex items-center gap-1.5 text-emerald-400">
                <ShieldCheck size={16} />
                <h4 className="text-[10px] font-black uppercase tracking-wider">Privacy & Security Shield</h4>
              </div>
              <p className="text-gray-500 text-[9px] leading-relaxed">
                আপনার পেমেন্ট নিরাপদ রাখতে সর্বদা সঠিক এবং নিজের ব্যবহৃত <span className="font-black text-red-500">Transaction ID</span> এবং <span className="font-black text-red-400">পেমেন্ট নম্বর</span> প্রদান করবেন। ভুল তথ্য প্রদান করলে ডিপোজিট সফল হবে না।
              </p>
              
              {/* Support Telegram option */}
              <div className="bg-white/5 border border-white/5 p-3 rounded-2xl mt-4 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8.5 h-8.5 bg-[#3ed0ca]/10 border border-[#3ed0ca]/15 rounded-full flex items-center justify-center text-[#3ed0ca] shrink-0">
                    <MessageCircle size={18} />
                  </div>
                  <div className="text-left">
                    <p className="font-black text-gray-200 text-[11px] uppercase tracking-wider">Live Support</p>
                    <p className="text-gray-500 text-[9px] font-semibold">পেমেন্ট সম্পর্কিত যেকোনো প্রয়োজনে চ্যাট করুণ</p>
                  </div>
                </div>
                <button 
                  onClick={() => window.open(globalImages['telegram_link'] || 'https://t.me/your_support', '_blank')}
                  className="bg-[#3ed0ca] text-black hover:bg-[#32b5af] px-3.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all active:scale-95"
                >
                  Live Telegram
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-[6022] bg-black/85 flex items-center justify-center p-4 backdrop-blur-sm select-none">
          <div className="bg-[#1a1a1a] border border-white/5 rounded-3xl w-full max-w-xs overflow-hidden flex flex-col items-center shadow-2xl animate-[scaleIn_0.2s_ease-out]">
            <div className="p-6 text-center space-y-3.5">
              <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mx-auto text-red-500 animate-pulse">
                <AlertTriangle size={24} />
              </div>
              <div className="space-y-1.5">
                <p className="text-gray-200 font-black text-xs leading-normal">
                  এই পেমেন্ট রিকোয়েস্টটি শুধুমাত্র একবার জমা দেওয়া যাবে!
                </p>
                <p className="text-gray-400 text-[10px] leading-normal font-medium">
                  অনুগ্রহ করে নিশ্চিত করুন যে আপনার ট্রানজেকশন আইডি (TrxID): <span className="text-red-500 font-mono font-black break-all select-all">{trxId}</span> সঠিক!
                </p>
              </div>
            </div>
            <div className="flex border-t border-white/5 w-full">
              <button 
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-4 text-center text-xs font-black uppercase tracking-widest text-gray-500 hover:text-white hover:bg-white/5 transition-all"
              >
                বাতিল (Cancel)
              </button>
              <button 
                onClick={confirmDeposit}
                className="flex-1 py-4 text-center text-xs font-black uppercase tracking-widest text-[#3ed0ca] hover:bg-white/5 border-l border-white/5 transition-all"
              >
                জমা (Confirm)
              </button>
            </div>
          </div>
        </div>
      )}
      
      <VIPLoader isVisible={isSubmitting} type="deposit" />
    </div>
  );
}
