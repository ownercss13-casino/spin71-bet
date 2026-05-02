import React, { useState, useEffect } from 'react';
import { 
  Wallet, 
  ArrowUpRight, 
  ArrowDownLeft, 
  History, 
  ChevronRight, 
  RefreshCw, 
  CreditCard, 
  Smartphone, 
  Building2,
  Clock,
  CheckCircle2,
  AlertCircle,
  X,
  ChevronLeft,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Filter,
  ArrowDownUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Skeleton from '../components/ui/Skeleton';
import { db } from '../services/firebase';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';

interface Transaction {
  id: string;
  type: 'deposit' | 'withdrawal' | 'bonus' | 'rebate' | 'bet' | 'win';
  amount: number;
  method?: string;
  status: 'pending' | 'completed' | 'failed' | 'approved' | 'rejected';
  date: string;
  trxId?: string;
  statusColor?: string;
}

interface WalletViewProps {
  balance: number;
  userData: any;
  onTabChange: (tab: any) => void;
  onSubTabChange?: (subTab: any) => void;
  showToast: (msg: string, type?: any) => void;
  minWithdraw?: number;
}

export default function WalletView({ balance, userData, onTabChange, onSubTabChange, showToast }: WalletViewProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'deposit' | 'withdrawal'>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const fetchTransactions = async () => {
      setIsLoading(true);
      if (!userData?.id) return;
      
      try {
        const transRef = collection(db, 'users', userData.id, 'transactions');
        let q = query(transRef, orderBy('createdAt', 'desc'), limit(50));
        
        if (filter !== 'all') {
          q = query(transRef, where('type', '==', filter), orderBy('createdAt', 'desc'), limit(50));
        }
        
        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map(doc => {
          const d = doc.data();
          let dateStr = 'Just now';
          if (d.createdAt) {
            if (typeof d.createdAt.toDate === 'function') {
              dateStr = d.createdAt.toDate().toLocaleString();
            } else {
              dateStr = new Date(d.createdAt).toLocaleString();
            }
          }
          return {
            id: doc.id,
            ...d,
            date: dateStr
          };
        }) as Transaction[];
        
        setTransactions(data);
      } catch (err) {
        console.error("Error fetching transactions from Firestore:", err);
      }
      setIsLoading(false);
    };

    fetchTransactions();
  }, [filter, userData?.id]);


  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      showToast("ব্যালেন্স আপডেট করা হয়েছে", "success");
    }, 800);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'approved':
        return 'text-green-400 bg-green-400/10 border-green-400/20';
      case 'pending':
        return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
      case 'failed':
      case 'rejected':
        return 'text-red-400 bg-red-400/10 border-red-400/20';
      default:
        return 'text-teal-400 bg-teal-400/10 border-teal-400/20';
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'deposit':
        return <ArrowDownLeft className="text-green-400" size={18} />;
      case 'withdrawal':
        return <ArrowUpRight className="text-red-400" size={18} />;
      case 'bonus':
        return <TrendingUp className="text-yellow-400" size={18} />;
      case 'rebate':
        return <TrendingUp className="text-purple-400" size={18} />;
      default:
        return <History className="text-teal-400" size={18} />;
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[var(--bg-main)] min-h-screen pb-24 transition-colors duration-300">
      {/* Header */}
      <div className="bg-[var(--bg-surface)] p-4 pt-6 rounded-b-3xl shadow-lg relative overflow-hidden transition-colors duration-300">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-yellow-400/20 rounded-full blur-3xl"></div>
        
        <div className="flex justify-between items-center relative z-10 mb-6">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => onTabChange('home')}
              className="p-2 bg-black/20 hover:bg-black/40 rounded-full transition-colors text-white backdrop-blur-sm"
            >
              <ChevronLeft size={20} />
            </button>
            <h2 className="text-2xl font-black italic tracking-tighter text-white drop-shadow-md">
              MY <span className="text-yellow-400">WALLET</span>
            </h2>
          </div>
          <button 
            onClick={handleRefresh}
            className={`p-2 bg-black/30 hover:bg-black/50 rounded-full transition-colors text-white backdrop-blur-sm ${isRefreshing ? 'animate-spin' : ''}`}
          >
            <RefreshCw size={20} />
          </button>
        </div>

        {/* Balance Card */}
        <div className="bg-[var(--bg-card)]/50 backdrop-blur-sm rounded-2xl p-6 border border-[var(--border-color)] relative z-10 transition-colors duration-300">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-[var(--text-muted)] text-sm mb-1 font-medium">মোট ব্যালেন্স (Total Balance)</p>
              <h2 className="text-4xl font-black text-[var(--text-main)] italic tracking-tight">
                ৳ {balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h2>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-yellow-500/20 flex items-center justify-center border border-yellow-500/30 shadow-inner">
              <Wallet size={32} className="text-yellow-400" />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3 mt-6">
            <button 
              onClick={() => onTabChange('deposit')}
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-black font-black py-3.5 rounded-xl shadow-lg transition-all active:scale-95"
            >
              <ArrowDownLeft size={20} />
              জমা (Deposit)
            </button>
            <button 
              onClick={() => {
                if (onSubTabChange) {
                  onSubTabChange('withdraw');
                }
                onTabChange('profile');
              }}
              className="flex items-center justify-center gap-2 bg-[var(--bg-surface)] hover:bg-black/10 text-[var(--text-main)] font-black py-3.5 rounded-xl border border-[var(--border-color)] transition-all active:scale-95"
            >
              <ArrowUpRight size={20} />
              উত্তোলন (Withdraw)
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-[var(--bg-card)] p-3 rounded-2xl border border-[var(--border-color)] text-center transition-colors duration-300">
            <p className="text-[var(--text-muted)] text-[10px] uppercase font-bold mb-1">মোট ডিপোজিট</p>
            <p className="text-[var(--text-main)] font-black text-xs">৳ {userData?.totalDeposit?.toLocaleString() || '0'}</p>
          </div>
          <div className="bg-[var(--bg-card)] p-3 rounded-2xl border border-[var(--border-color)] text-center transition-colors duration-300">
            <p className="text-[var(--text-muted)] text-[10px] uppercase font-bold mb-1">মোট উত্তোলন</p>
            <p className="text-[var(--brand-primary)] font-black text-xs">৳ {userData?.totalWithdrawals?.toLocaleString() || '0'}</p>
          </div>
          <div className="bg-[var(--bg-card)] p-3 rounded-2xl border border-[var(--border-color)] text-center transition-colors duration-300">
            <p className="text-[var(--text-muted)] text-[10px] uppercase font-bold mb-1">ভিআইপি</p>
            <p className="text-yellow-500 font-black text-xs">LVL {userData?.vipLevel || '0'}</p>
          </div>
        </div>

        {/* Transaction History Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[var(--text-main)] font-black italic uppercase tracking-tighter flex items-center gap-2">
              <History size={20} className="text-[var(--brand-primary)]" />
              লেনদেনের ইতিহাস (History)
            </h3>
            <div className="flex gap-2">
              <button 
                onClick={() => setFilter('all')}
                className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all ${filter === 'all' ? 'bg-[var(--brand-primary)] text-black' : 'bg-[var(--bg-card)] text-[var(--text-muted)] border border-[var(--border-color)]'}`}
              >
                সব
              </button>
              <button 
                onClick={() => setFilter('deposit')}
                className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all ${filter === 'deposit' ? 'bg-green-500 text-white' : 'bg-[var(--bg-card)] text-[var(--text-muted)] border border-[var(--border-color)]'}`}
              >
                জমা
              </button>
              <button 
                onClick={() => setFilter('withdrawal')}
                className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all ${filter === 'withdrawal' ? 'bg-red-500 text-white' : 'bg-[var(--bg-card)] text-[var(--text-muted)] border border-[var(--border-color)]'}`}
              >
                উত্তোলন
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-20 w-full rounded-2xl" />
              ))}
            </div>
          ) : transactions.length > 0 ? (
            <div className="space-y-3">
              {transactions.map((trx) => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={trx.id} 
                  className="bg-[var(--bg-card)] p-4 rounded-2xl border border-[var(--border-color)] flex items-center justify-between hover:border-[var(--brand-primary)]/30 transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-[var(--bg-surface)] flex items-center justify-center border border-[var(--border-color)] group-hover:scale-110 transition-transform">
                      {getIcon(trx.type)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-black text-[var(--text-main)] uppercase tracking-tight">
                          {trx.type === 'deposit' ? 'জমা (Deposit)' : 
                           trx.type === 'withdrawal' ? 'উত্তোলন (Withdrawal)' : 
                           trx.type === 'bonus' ? 'বোনাস (Bonus)' : 
                           trx.type === 'rebate' ? 'রিবেট (Rebate)' : trx.type}
                        </p>
                        <span className={`text-[8px] px-1.5 py-0.5 rounded-full border font-bold uppercase ${getStatusColor(trx.status)}`}>
                          {trx.status}
                        </span>
                      </div>
                      <p className="text-[10px] text-[var(--text-muted)] flex items-center gap-1 mt-0.5">
                        <Clock size={10} /> {trx.date}
                      </p>
                      {trx.method && (
                        <p className="text-[10px] text-[var(--brand-primary)] font-bold uppercase mt-0.5">
                          {trx.method}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-black italic ${trx.amount > 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {trx.amount > 0 ? '+' : ''}৳{Math.abs(trx.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    {trx.trxId && (
                      <p className="text-[8px] text-[var(--text-muted)] font-mono mt-1">
                        ID: {trx.trxId}
                      </p>
                    )}
                  </div>
                </motion.div>
              ))}
              
              <button 
                onClick={() => {
                  if (onSubTabChange) onSubTabChange(filter === 'withdrawal' ? 'withdrawHistory' : 'history');
                  onTabChange('profile');
                }}
                className="w-full py-4 text-[var(--text-muted)] text-xs font-bold hover:text-[var(--text-main)] transition-colors flex items-center justify-center gap-2"
              >
                সব ইতিহাস দেখুন <ArrowRight size={14} />
              </button>
            </div>
          ) : (
            <div className="bg-[var(--bg-card)] p-12 rounded-3xl border border-[var(--border-color)] text-center transition-colors duration-300">
              <div className="w-16 h-16 bg-[var(--bg-surface)] rounded-full flex items-center justify-center mx-auto mb-4 border border-[var(--border-color)]">
                <History size={32} className="text-[var(--text-muted)] opacity-30" />
              </div>
              <p className="text-[var(--text-muted)] text-sm font-medium">কোনো লেনদেনের ইতিহাস পাওয়া যায়নি</p>
              <button 
                onClick={() => onTabChange('deposit')}
                className="mt-4 text-[var(--brand-primary)] text-xs font-bold hover:underline"
              >
                প্রথম ডিপোজিট করুন
              </button>
            </div>
          )}
        </div>

        {/* Security Info */}
        <div className="bg-blue-500/5 border border-blue-500/20 p-4 rounded-2xl flex items-start gap-3 transition-colors duration-300">
          <ShieldCheck size={20} className="text-blue-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-[var(--text-main)] text-xs font-bold mb-1">নিরাপদ লেনদেন (Secure Transactions)</p>
            <p className="text-[var(--text-muted)] text-[10px] leading-relaxed">
              আপনার সকল লেনদেন এনক্রিপ্টেড এবং সুরক্ষিত। কোনো সমস্যার জন্য আমাদের ২৪/৭ সাপোর্ট টিমের সাথে যোগাযোগ করুন।
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ShieldCheck({ size, className }: { size: number, className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}
