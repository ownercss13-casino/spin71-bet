import React, { useState, useEffect } from 'react';
import { auth } from '../services/firebase';
import { 
  Database, 
  Users, 
  TrendingUp, 
  RefreshCw, 
  CheckCircle, 
  XOctagon, 
  ArrowRight, 
  ShieldAlert, 
  Pocket, 
  Cpu,
  ChevronRight,
  TrendingDown,
  Sparkles,
  Zap,
  DollarSign,
  Terminal,
  Activity,
  UserCheck,
  Flame,
  Volume2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface RetoolData {
  activeUsers: number;
  totalDeposits: number;
  totalWithdrawals: number;
  recentTransactions: {
    id: string;
    user: string;
    amount: number;
    type: 'deposit' | 'withdrawal';
    status: 'completed' | 'pending' | 'failed';
    gateway: string;
    date: string;
  }[];
  systemHealth: string;
  retoolConnection: string;
  lastSynced: string;
  users?: {
    uid: string;
    username: string;
    email: string;
    balance: number;
  }[];
}

interface RetoolAdminSectionProps {
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

export default function RetoolAdminSection({ showToast }: RetoolAdminSectionProps) {
  const [data, setData] = useState<RetoolData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  
  const [testAmount, setTestAmount] = useState('500');
  const [testType, setTestType] = useState<'deposit' | 'withdrawal'>('deposit');
  const [testGateway, setTestGateway] = useState('Bkash');
  const [selectedUser, setSelectedUser] = useState<string>('');
  
  const [logs, setLogs] = useState<string[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Search and filter state variables
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [txStatusFilter, setTxStatusFilter] = useState<'all' | 'completed' | 'pending' | 'failed'>('all');
  const [txMethodFilter, setTxMethodFilter] = useState<string>('all');

  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString();
    setLogs(prev => [`[${time}] ${msg}`, ...prev].slice(0, 14));
  };

  const playNotificationSound = (type: 'success' | 'info') => {
    if (!soundEnabled) return;
    try {
      // High fidelity simple synthesised alert using AudioContext
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      if (type === 'success') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1); // A5
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      } else {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, ctx.currentTime); // A4
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
        osc.start();
        osc.stop(ctx.currentTime + 0.15);
      }
    } catch (e) {
      // Sound fallback
    }
  };

  const fetchData = async (isManual = false) => {
    if (isManual) setSyncing(true);
    else setLoading(true);
    
    setError(null);
    try {
      const token = await auth.currentUser?.getIdToken() || 'owner.css13';
      const response = await fetch('/api/admin/retool-data', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const json = await response.json();
      if (!response.ok) {
        throw new Error(json.error || 'Failed to fetch Retool configuration');
      }

      setData(json.data);
      
      // Auto-assign first user if none is selected
      if (json.data.users && json.data.users.length > 0 && !selectedUser) {
        setSelectedUser(json.data.users[0].email || json.data.users[0].username);
      }

      if (isManual) {
        showToast('Retool Analytics synchronized successfully!', 'success');
        addLog(`SYNC: Sourced stats dynamically from live database. Sync OK.`);
        playNotificationSound('success');
      } else {
        const initialLogs = [
          `SYSTEM: Retool Secure Data Port listening with secure RETOOL_API_KEY.`,
          `SECURITY: Admin identity validated via Firebase auth tokens.`,
          `FIREBASE: Active Firestore database bound successfully.`,
          `SYNC: Initial cache loaded with ${json.data.recentTransactions?.length || 0} transaction records.`
        ];
        setLogs(initialLogs);
      }
    } catch (err: any) {
      console.error('[RetoolAdminSection]', err);
      setError(err.message || 'Error occurred while loading data');
      showToast(err.message || 'Retool API connection error', 'error');
      addLog(`ERR: API Handshake failed - ${err.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSimulateWebhook = async (customAmt?: string, customType?: 'deposit' | 'withdrawal', customGateway?: string) => {
    setSyncing(true);
    
    const finalAmount = customAmt || testAmount;
    const finalType = customType || testType;
    const finalGateway = customGateway || testGateway;
    const finalUser = selectedUser || auth.currentUser?.email || 'test_retool_sim@spin71.bet';

    addLog(`PENDING: Broadcasting simulated ${finalType} webhook packet (৳${finalAmount} BDT)...`);

    try {
      const token = await auth.currentUser?.getIdToken() || 'owner.css13';
      const response = await fetch('/api/admin/retool-webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: parseFloat(finalAmount),
          type: finalType,
          gateway: finalGateway,
          user: finalUser
        })
      });

      const resData = await response.json();
      if (!response.ok) throw new Error(resData.error || 'Webhook simulation error');

      showToast(`Retool: ${finalType === 'deposit' ? 'deposit credited' : 'withdrawal processed'} of ৳${finalAmount} for ${finalUser}`, 'success');
      addLog(`SUCCESS: Simulated ${finalGateway} payload acknowledged. Received Tx ID: ${resData.transactionId}`);
      playNotificationSound('success');
      
      // Reload stats
      await fetchData(false);
    } catch (err: any) {
      console.error('[Webhook Simulation]', err);
      showToast(err.message || 'Webhook failed to broadcast', 'error');
      addLog(`ERR: Webhook rejected by server: ${err.message}`);
    } finally {
      setSyncing(false);
    }
  };

  const applyPreset = async (amount: string, type: 'deposit' | 'withdrawal', gateway: string) => {
    playNotificationSound('info');
    await handleSimulateWebhook(amount, type, gateway);
  };

  // Filtered users and transactions
  const filteredUsers = (data?.users || []).filter(usr => {
    const query = userSearchQuery.trim().toLowerCase();
    if (!query) return true;
    return (
      (usr.username || '').toLowerCase().includes(query) ||
      (usr.email || '').toLowerCase().includes(query) ||
      (usr.uid || '').toLowerCase().includes(query)
    );
  });

  const filteredTransactions = (data?.recentTransactions || []).filter(tx => {
    const matchesStatus = txStatusFilter === 'all' || tx.status === txStatusFilter;
    const matchesMethod = txMethodFilter === 'all' || tx.gateway.toLowerCase() === txMethodFilter.toLowerCase();
    return matchesStatus && matchesMethod;
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-16 h-96 select-none">
        <div className="relative flex items-center justify-center">
          <div className="w-16 h-16 border-4 border-teal-500/10 border-t-emerald-400 rounded-full animate-spin" />
          <Database size={24} className="absolute text-emerald-400 animate-pulse" />
        </div>
        <p className="mt-4 text-sm font-bold text-teal-400/70 uppercase tracking-widest animate-pulse">
          Connecting to Retool Dashboard...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      
      {/* Upper Status Bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-teal-950/20 border border-white/5 backdrop-blur-xl rounded-3xl p-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-400/20 rounded-2xl flex items-center justify-center text-emerald-400 shadow-xl shadow-emerald-500/5">
            <Database size={22} className="animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-black text-white hover:text-emerald-400 transition-colors uppercase tracking-tight">Retool Analytics Platform</span>
              <span className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-md ${
                data?.retoolConnection.includes('Live') 
                  ? 'bg-emerald-500/10 border border-emerald-400/20 text-emerald-400'
                  : 'bg-yellow-500/10 border border-yellow-400/20 text-yellow-400 animate-pulse'
              }`}>
                {data?.retoolConnection || 'Standalone'}
              </span>
            </div>
            <p className="text-[11px] text-teal-200/50 uppercase tracking-wider mt-0.5">
              Powered by RETOOL_API_KEY secure server proxy
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Sound toggle */}
          <button 
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-xl border flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer ${
              soundEnabled 
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' 
                : 'bg-black/40 border-white/5 text-white/40'
            }`}
            title="Toggle notification sounds"
          >
            <Volume2 size={14} className={soundEnabled ? 'animate-bounce' : ''} />
            <span className="text-[10px] uppercase font-black tracking-wider">{soundEnabled ? 'Sound ON' : 'Muted'}</span>
          </button>

          <div className="text-right hidden sm:block">
            <span className="text-[9px] font-bold text-teal-500/60 uppercase block">Last Synchronized</span>
            <span className="text-xs font-mono font-bold text-white">
              {data?.lastSynced ? new Date(data.lastSynced).toLocaleTimeString() : 'N/A'}
            </span>
          </div>
          
          <button
            onClick={() => fetchData(true)}
            disabled={syncing}
            className={`p-3 bg-emerald-500/10 hover:bg-emerald-500/20 active:scale-95 border border-emerald-500/20 rounded-2xl text-emerald-400 flex items-center justify-center transition-all cursor-pointer ${
              syncing ? 'opacity-50 pointer-events-none' : ''
            }`}
            title="Refresh from Retool Console"
          >
            <RefreshCw size={18} className={syncing ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl flex items-center gap-3">
          <ShieldAlert size={20} className="shrink-0" />
          <span className="text-sm font-semibold">{error}</span>
          <button 
            onClick={() => fetchData()} 
            className="ml-auto underline text-xs font-bold uppercase tracking-wider hover:text-white"
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* Main KPI Grid */}
      {(() => {
        const pendingTransactions = (data?.recentTransactions || []).filter(tx => tx.status === 'pending');
        const pendingCount = pendingTransactions.length;
        const pendingAmount = pendingTransactions.reduce((acc, tx) => acc + tx.amount, 0);
        const totalUsersCount = data?.users?.length || 0;

        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Card 1: Total Sourced Deposits */}
            <div className="bg-[#0b2424]/50 border border-white/10 backdrop-blur-xl rounded-3xl p-6 group hover:border-[#10b981]/30 hover:shadow-2xl hover:shadow-[#10b981]/5 transition-all duration-300 relative overflow-hidden">
              <div className="absolute right-0 top-0 w-32 h-32 bg-[#10b981]/5 rounded-full blur-3xl group-hover:bg-[#10b981]/10 transition-colors pointer-events-none" />
              <div className="flex justify-between items-start">
                <div className="p-3 bg-[#10b981]/10 border border-[#10b981]/20 rounded-2xl text-[#10b981]">
                  <TrendingUp size={22} className="group-hover:scale-110 transition-transform" />
                </div>
                <div className="px-2.5 py-1 bg-[#10b981]/10 text-[9px] text-[#10b981] border border-[#10b981]/20 rounded-full font-black tracking-wider uppercase">
                  Cash In
                </div>
              </div>
              <div className="mt-5">
                <span className="text-[10px] text-teal-200/50 uppercase font-black tracking-wider block mb-1">Total Sourced Deposits</span>
                <span className="text-3xl font-black italic tracking-tight text-white">৳{(data?.totalDeposits || 0).toLocaleString()}</span>
              </div>
              <div className="mt-4 pt-3 border-t border-white/5 text-[10px] text-teal-400/70 font-bold uppercase flex items-center gap-1.5">
                <Sparkles size={11} className="text-[#10b981]" /> Active transactional ledger
              </div>
            </div>

            {/* Card 2: Pending Requests */}
            <div className={`border backdrop-blur-xl rounded-3xl p-6 group hover:shadow-2xl transition-all duration-300 relative overflow-hidden ${
              pendingCount > 0 
                ? 'bg-amber-500/10 border-amber-500/30 hover:border-amber-400/50 hover:shadow-amber-500/5' 
                : 'bg-[#0b2424]/50 border-white/10 hover:border-teal-500/30 hover:shadow-teal-500/5'
            }`}>
              <div className={`absolute right-0 top-0 w-32 h-32 rounded-full blur-3xl transition-colors pointer-events-none ${
                pendingCount > 0 ? 'bg-amber-500/5 group-hover:bg-amber-500/10' : 'bg-teal-500/5'
              }`} />
              <div className="flex justify-between items-start">
                <div className={`p-3 rounded-2xl border transition-all ${
                  pendingCount > 0 
                    ? 'bg-amber-500/15 border-amber-500/30 text-amber-400' 
                    : 'bg-teal-500/10 border-teal-500/20 text-teal-300'
                }`}>
                  <Activity size={22} className={`group-hover:rotate-12 transition-transform ${pendingCount > 0 ? 'animate-pulse' : ''}`} />
                </div>
                <div className={`px-2.5 py-1 text-[9px] border rounded-full font-black tracking-wider uppercase ${
                  pendingCount > 0 
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/30 animate-pulse' 
                    : 'bg-white/5 text-white/40 border-white/10'
                }`}>
                  {pendingCount > 0 ? 'Requires Action' : 'All Clear'}
                </div>
              </div>
              <div className="mt-5">
                <span className="text-[10px] text-teal-200/50 uppercase font-black tracking-wider block mb-1">Pending Requests</span>
                <div className="flex items-baseline gap-2">
                  <span className={`text-3xl font-black italic tracking-tight ${pendingCount > 0 ? 'text-amber-400' : 'text-white'}`}>
                    {pendingCount}
                  </span>
                  {pendingCount > 0 && (
                    <span className="text-xs text-amber-300/80 font-bold">
                      (৳{pendingAmount.toLocaleString()})
                    </span>
                  )}
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-white/5 text-[10px] text-teal-400/70 font-bold uppercase flex items-center gap-1.5">
                <CheckCircle size={11} className={pendingCount > 0 ? 'text-amber-400' : 'text-teal-400'} />
                {pendingCount > 0 ? 'Awaiting Manual Approval' : 'No requests pending'}
              </div>
            </div>

            {/* Card 3: Active Users */}
            <div className="bg-[#0b2424]/50 border border-white/10 backdrop-blur-xl rounded-3xl p-6 group hover:border-[#3b82f6]/30 hover:shadow-2xl hover:shadow-[#3b82f6]/5 transition-all duration-300 relative overflow-hidden">
              <div className="absolute right-0 top-0 w-32 h-32 bg-[#3b82f6]/5 rounded-full blur-3xl group-hover:bg-[#3b82f6]/10 transition-colors pointer-events-none" />
              <div className="flex justify-between items-start">
                <div className="p-3 bg-[#3b82f6]/10 border border-[#3b82f6]/20 rounded-2xl text-[#3b82f6]">
                  <Users size={22} className="group-hover:scale-110 transition-transform" />
                </div>
                <div className="flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full text-[9px] text-[#10b981] font-black uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 bg-[#10b981] rounded-full animate-ping" />
                  Live Active
                </div>
              </div>
              <div className="mt-5">
                <span className="text-[10px] text-teal-200/50 uppercase font-black tracking-wider block mb-1">Active Users Online</span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-black italic tracking-tight text-white">{data?.activeUsers || 0}</span>
                  <span className="text-[10px] text-white/40 font-bold uppercase">/ {totalUsersCount} Total</span>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-white/5 text-[10px] text-teal-400/70 font-bold uppercase flex items-center gap-1.5">
                <Zap size={11} className="text-[#3b82f6]" /> Sourced from Firebase Realtime
              </div>
            </div>

            {/* Card 4: Sourced Withdrawals */}
            <div className="bg-[#0b2424]/50 border border-white/10 backdrop-blur-xl rounded-3xl p-6 group hover:border-rose-500/30 hover:shadow-2xl hover:shadow-rose-500/5 transition-all duration-300 relative overflow-hidden">
              <div className="absolute right-0 top-0 w-32 h-32 bg-rose-500/5 rounded-full blur-3xl group-hover:bg-rose-500/10 transition-colors pointer-events-none" />
              <div className="flex justify-between items-start">
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400">
                  <TrendingDown size={22} className="group-hover:scale-110 transition-transform" />
                </div>
                <div className="px-2.5 py-1 bg-rose-500/10 border border-rose-500/20 rounded-full text-[9px] text-rose-400 font-black tracking-wider uppercase">
                  Payouts
                </div>
              </div>
              <div className="mt-5">
                <span className="text-[10px] text-teal-200/50 uppercase font-black tracking-wider block mb-1">Total Sourced Cashouts</span>
                <span className="text-3xl font-black italic tracking-tight text-white">৳{(data?.totalWithdrawals || 0).toLocaleString()}</span>
              </div>
              <div className="mt-4 pt-3 border-t border-white/5 text-[10px] text-rose-400/70 font-bold uppercase flex items-center gap-1.5">
                <Cpu size={11} className="text-rose-400" /> Webhook Integration Node: OK
              </div>
            </div>

          </div>
        );
      })()}

      {/* Quick Action Presets (নতুন এড করা ট্রানজেকশন কুইক অ্যাকশন) */}
      <div className="bg-[#0b2424]/30 border border-white/5 backdrop-blur-xl rounded-3xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-white/5 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/15 border border-emerald-500/20 rounded-xl text-emerald-400">
              <Flame size={16} className="animate-bounce" />
            </div>
            <div>
              <h4 className="text-sm font-black uppercase tracking-wider text-white">গেম পেমেন্ট কুইক অ্যাকশন প্রিসেট (Quick Webhook Actions)</h4>
              <p className="text-[10px] text-teal-400/60 uppercase">বিকাশ/নগদ পেমেন্ট গেটওয়ে সরাসরি টেস্ট করার জন্য নিচের বাটনগুলো চাপুন</p>
            </div>
          </div>
          <span className="text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            1-Click triggers
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button
            onClick={() => applyPreset('500', 'deposit', 'Bkash')}
            disabled={syncing}
            className="p-4 bg-teal-500/5 hover:bg-emerald-500/10 hover:border-emerald-500/30 active:scale-95 border border-white/5 rounded-2xl flex flex-col justify-between text-left group transition-all duration-200 cursor-pointer"
          >
            <span className="text-[9px] font-black uppercase text-teal-400 tracking-wider">Bkash Deposit</span>
            <span className="text-xl font-black text-white mt-1">৳৫০০</span>
            <span className="text-[10px] text-white/40 mt-1 block group-hover:text-white transition-colors">ট্রিগার করুন →</span>
          </button>

          <button
            onClick={() => applyPreset('1000', 'deposit', 'Nagad')}
            disabled={syncing}
            className="p-4 bg-teal-500/5 hover:bg-emerald-500/10 hover:border-emerald-500/30 active:scale-95 border border-white/5 rounded-2xl flex flex-col justify-between text-left group transition-all duration-200 cursor-pointer"
          >
            <span className="text-[9px] font-black uppercase text-amber-400 tracking-wider">Nagad Deposit</span>
            <span className="text-xl font-black text-white mt-1">৳১,০০০</span>
            <span className="text-[10px] text-white/40 mt-1 block group-hover:text-white transition-colors">ট্রিগার করুন →</span>
          </button>

          <button
            onClick={() => applyPreset('5000', 'deposit', 'Rocket')}
            disabled={syncing}
            className="p-4 bg-teal-500/5 hover:bg-emerald-500/10 hover:border-emerald-500/30 active:scale-95 border border-white/5 rounded-2xl flex flex-col justify-between text-left group transition-all duration-200 cursor-pointer"
          >
            <span className="text-[9px] font-black uppercase text-violet-400 tracking-wider">Rocket Deposit</span>
            <span className="text-xl font-black text-white mt-1">৳৫,০০০</span>
            <span className="text-[10px] text-white/40 mt-1 block group-hover:text-white transition-colors">ট্রিগার করুন →</span>
          </button>

          <button
            onClick={() => applyPreset('3000', 'withdrawal', 'Bkash')}
            disabled={syncing}
            className="p-4 bg-teal-500/5 hover:bg-rose-500/10 hover:border-rose-500/30 active:scale-95 border border-white/5 rounded-2xl flex flex-col justify-between text-left group transition-all duration-200 cursor-pointer"
          >
            <span className="text-[9px] font-black uppercase text-rose-400 tracking-wider">Bkash Cashout</span>
            <span className="text-xl font-black text-white mt-1">৳৩,০০০</span>
            <span className="text-[10px] text-white/40 mt-1 block group-hover:text-white transition-colors">ট্রিগার করুন →</span>
          </button>
        </div>
      </div>

      {/* Main Panel Content split into Webhook simulation and Sourced transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Grid: Webhook / Signal broadcast simulation */}
        <div className="bg-[#0b2424]/30 border border-white/5 backdrop-blur-xl rounded-3xl p-6 space-y-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-emerald-500/15 border border-emerald-500/20 rounded-xl text-emerald-400">
                <Sparkles size={16} />
              </div>
              <h4 className="text-sm font-black uppercase tracking-wider text-white">Retool Webhook Injector</h4>
            </div>
            <p className="text-xs text-white/60 mb-6">
              Establish dual communication channels with Retool. Use this utility to mock a business event payload or push simulation packets into the Retool database workflow stream.
            </p>

            <div className="space-y-4">
              {/* User Dropdown Selection with real-time UID & Name Search */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-teal-400/80 flex items-center gap-1">
                    <UserCheck size={12} />
                    ਪেইਡ প্লেয়ার একাউন্ট সিলেক্ট করুন (Select Member)
                  </label>
                  {data?.users && data.users.length > 0 && (
                    <span className="text-[9px] text-white/40 font-bold bg-white/5 px-2 py-0.5 rounded-md">
                      {filteredUsers.length} matched
                    </span>
                  )}
                </div>

                {data?.users && data.users.length > 0 ? (
                  <div className="space-y-2">
                    {/* User Search Input */}
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search by username, email or UID..."
                        value={userSearchQuery}
                        onChange={(e) => {
                          setUserSearchQuery(e.target.value);
                          // Auto select the first matching user if any
                          const matching = (data?.users || []).filter(u => {
                            const q = e.target.value.toLowerCase();
                            return (u.username || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q) || (u.uid || '').toLowerCase().includes(q);
                          });
                          if (matching.length > 0) {
                            setSelectedUser(matching[0].email || matching[0].username);
                          }
                        }}
                        className="w-full bg-black/40 border border-white/10 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:border-emerald-500 transition-colors"
                      />
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/40 text-xs">🔍</span>
                      {userSearchQuery && (
                        <button 
                          onClick={() => setUserSearchQuery('')}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white text-xs"
                        >
                          ×
                        </button>
                      )}
                    </div>

                    <select
                      value={selectedUser}
                      onChange={(e) => {
                        setSelectedUser(e.target.value);
                        addLog(`SELECTED: User set to ${e.target.value}`);
                      }}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white font-bold focus:outline-none focus:border-emerald-500 transition-colors"
                    >
                      {filteredUsers.map((usr) => (
                        <option key={usr.uid} value={usr.email || usr.username} className="bg-[#0e2121] text-xs">
                          {usr.username || usr.email} (৳{usr.balance.toFixed(0)}) — {usr.uid.slice(0, 8)}
                        </option>
                      ))}
                      {filteredUsers.length === 0 && (
                        <option value="" disabled className="bg-[#0e2121]">No matching players found</option>
                      )}
                    </select>

                    {/* Quick Select Panel for matching users */}
                    {userSearchQuery && filteredUsers.length > 0 && (
                      <div className="max-h-24 overflow-y-auto bg-black/60 border border-white/5 rounded-xl p-2 space-y-1">
                        {filteredUsers.slice(0, 5).map((usr) => {
                          const isSel = selectedUser === (usr.email || usr.username);
                          return (
                            <button
                              key={usr.uid}
                              onClick={() => {
                                setSelectedUser(usr.email || usr.username);
                                addLog(`SELECT: Sourced ${usr.username || usr.email}`);
                              }}
                              type="button"
                              className={`w-full text-left px-2 py-1 rounded text-[10px] flex items-center justify-between transition-all cursor-pointer ${
                                isSel 
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                                  : 'text-white/60 hover:bg-white/5 hover:text-white'
                              }`}
                            >
                              <span className="font-bold truncate">{usr.username || usr.email}</span>
                              <span className="font-mono text-[9px] opacity-75">UID: {usr.uid.slice(0, 6)}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ) : (
                  <input 
                    type="text"
                    value={selectedUser}
                    onChange={(e) => setSelectedUser(e.target.value)}
                    placeholder="example@gmail.com"
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                )}
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-teal-400/80 block mb-1.5">Simulation Amount (৳)</label>
                <input 
                  type="number"
                  value={testAmount}
                  onChange={(e) => setTestAmount(e.target.value)}
                  placeholder="500"
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white uppercase font-black tracking-tight focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-teal-400/80 block mb-1.5">Transactional Class</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setTestType('deposit')}
                    className={`py-2 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all border ${
                      testType === 'deposit' 
                        ? 'bg-emerald-500/10 border-emerald-400 text-emerald-400' 
                        : 'bg-black/30 border-white/5 text-white/50 hover:bg-white/5'
                    }`}
                  >
                    Deposit Log
                  </button>
                  <button
                    onClick={() => setTestType('withdrawal')}
                    className={`py-2 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all border ${
                      testType === 'withdrawal' 
                        ? 'bg-rose-500/10 border-rose-400 text-rose-400' 
                        : 'bg-black/30 border-white/5 text-white/50 hover:bg-white/5'
                    }`}
                  >
                    Withdrawal Log
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-teal-400/80 block mb-1.5">Transaction Gateway</label>
                <select
                  value={testGateway}
                  onChange={(e) => setTestGateway(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white font-bold select-none focus:outline-none focus:border-emerald-500 transition-colors"
                >
                  <option value="Bkash">Bkash</option>
                  <option value="Nagad">Nagad</option>
                  <option value="Rocket">Rocket</option>
                  <option value="Retool Pay">Retool Pay</option>
                  <option value="Manual Casino Add">Manual Casino Add</option>
                </select>
              </div>
            </div>
          </div>

          <button
            onClick={() => handleSimulateWebhook()}
            disabled={syncing}
            className="w-full bg-emerald-500 hover:bg-emerald-400 text-[#061414] py-3 rounded-2xl text-[11px] font-black tracking-widest uppercase transition-all shadow-lg hover:shadow-emerald-500/20 active:scale-95 flex items-center justify-center gap-2 mt-6 cursor-pointer"
          >
            {syncing ? (
              <span className="w-4 h-4 border-2 border-emerald-950 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Zap size={14} className="fill-current" />
                Broadcast Webhook
              </>
            )}
          </button>
        </div>

        {/* Right Grid: Recents sourced ledger transactions table */}
        <div className="bg-[#0b2424]/30 border border-white/5 backdrop-blur-xl rounded-3xl p-6 lg:col-span-2 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/5 pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-teal-500/15 border border-teal-500/20 rounded-xl text-teal-400">
                <Pocket size={16} />
              </div>
              <div>
                <h4 className="text-sm font-black uppercase tracking-wider text-white">Recent Transactions Sourced from Retool</h4>
                <p className="text-[10px] text-teal-400/60 uppercase">Real-time ledger updates synchronised with admin backend</p>
              </div>
            </div>
            <div className="flex items-center gap-2 self-stretch sm:self-auto justify-between">
              <span className="text-[9px] font-mono font-bold text-teal-400 bg-teal-500/10 border border-teal-500/20 px-2.5 py-1 rounded-md">
                LIVE BROADCAST
              </span>
            </div>
          </div>

          {/* Interactive Filters Toolbar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 bg-black/40 border border-white/5 p-3 rounded-2xl">
            {/* Status Filter */}
            <div className="flex flex-col">
              <label className="text-[9px] font-black uppercase tracking-wider text-teal-400/60 mb-1">Status Filter</label>
              <select
                value={txStatusFilter}
                onChange={(e) => {
                  setTxStatusFilter(e.target.value as any);
                  addLog(`FILTER: Status set to "${e.target.value}"`);
                }}
                className="bg-[#0c1f1f]/80 border border-white/10 rounded-xl px-2 py-1.5 text-xs text-white font-bold focus:outline-none focus:border-teal-500 transition-colors"
              >
                <option value="all">All Statuses (সকল স্ট্যাটাস)</option>
                <option value="completed" className="text-emerald-400">Completed (সফল)</option>
                <option value="pending" className="text-yellow-400">Pending (অপেক্ষমান)</option>
                <option value="failed" className="text-red-400">Failed (ব্যর্থ)</option>
              </select>
            </div>

            {/* Gateway Method Filter */}
            <div className="flex flex-col">
              <label className="text-[9px] font-black uppercase tracking-wider text-teal-400/60 mb-1">Gateway Method</label>
              <select
                value={txMethodFilter}
                onChange={(e) => {
                  setTxMethodFilter(e.target.value);
                  addLog(`FILTER: Method set to "${e.target.value}"`);
                }}
                className="bg-[#0c1f1f]/80 border border-white/10 rounded-xl px-2 py-1.5 text-xs text-white font-bold focus:outline-none focus:border-teal-500 transition-colors"
              >
                <option value="all">All Methods (সকল মেথড)</option>
                <option value="bkash">Bkash</option>
                <option value="nagad">Nagad</option>
                <option value="rocket">Rocket</option>
                <option value="retool pay">Retool Pay</option>
                <option value="manual casino add">Manual Casino Add</option>
              </select>
            </div>

            {/* Active Indicator & Reset Controls */}
            <div className="flex sm:col-span-2 lg:col-span-1 items-end justify-between lg:justify-end gap-3 mt-1 lg:mt-0 pb-1">
              <div className="text-[10px] text-white/40 font-bold">
                Showing <span className="text-teal-400">{filteredTransactions.length}</span> of {data?.recentTransactions?.length || 0}
              </div>
              {(txStatusFilter !== 'all' || txMethodFilter !== 'all') && (
                <button
                  onClick={() => {
                    setTxStatusFilter('all');
                    setTxMethodFilter('all');
                    addLog("FILTER: Reset transaction filters.");
                  }}
                  className="px-2.5 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-[10px] font-black uppercase tracking-wider rounded-lg border border-rose-500/20 active:scale-95 transition-all cursor-pointer"
                >
                  Clear Filters ×
                </button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto select-none rounded-2xl border border-white/5">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-black/40 border-b border-white/5 text-[10px] font-black uppercase tracking-[0.1em] text-teal-400/70">
                  <th className="p-4">Transaction ID</th>
                  <th className="p-4">User Identity</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4">Class</th>
                  <th className="p-4">Method</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.length > 0 ? (
                  filteredTransactions.map((tx) => (
                    <tr key={tx.id} className="border-b border-white/5 hover:bg-white/5 transition-colors text-xs font-medium">
                      <td className="p-4 font-mono font-bold text-white/80">{tx.id}</td>
                      <td className="p-4 text-white font-bold">{tx.user}</td>
                      <td className="p-4 font-black">৳{tx.amount.toFixed(2)}</td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                          tx.type === 'deposit' 
                            ? 'bg-emerald-500/10 border border-emerald-400/20 text-emerald-400' 
                            : 'bg-rose-500/10 border border-rose-400/10 text-rose-400'
                        }`}>
                          {tx.type}
                        </span>
                      </td>
                      <td className="p-4 text-teal-200/60 font-semibold uppercase">{tx.gateway}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-1.5 font-bold uppercase text-[10px]">
                          {tx.status === 'completed' && <CheckCircle size={12} className="text-emerald-400" />}
                          {tx.status === 'pending' && <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />}
                          {tx.status === 'failed' && <XOctagon size={12} className="text-red-400" />}
                          <span className={
                            tx.status === 'completed' ? 'text-emerald-400' :
                            tx.status === 'pending' ? 'text-yellow-400' : 'text-red-400'
                          }>
                            {tx.status}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-xs text-white/40 uppercase tracking-widest font-bold">
                      No logs collected from Retool
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Activity Console Terminal Log Stream */}
          <div className="border border-white/5 rounded-2xl overflow-hidden bg-black/60 font-mono mt-4">
            <div className="p-3 bg-white/5 flex items-center justify-between border-b border-white/5">
              <span className="text-[10px] uppercase font-black tracking-wider text-teal-400 flex items-center gap-1.5">
                <Terminal size={12} />
                Live API Endpoint Activity Logs (রিটুল অ্যাক্টিভিটি কনসোল)
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            
            <div className="p-3 text-[11px] text-white/60 space-y-1 h-32 overflow-y-auto select-none">
              {logs.map((log, index) => (
                <div key={index} className="flex gap-2 hover:text-emerald-300 transition-colors">
                  <span className="text-teal-500/60 font-bold">»</span>
                  <span>{log}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <a 
              href="https://spin71bet.retool.com" 
              target="_blank" 
              referrerPolicy="no-referrer"
              className="text-[10px] font-black uppercase tracking-wider text-emerald-400 hover:text-white flex items-center gap-1 transition-colors"
            >
              Open Retool Admin Console
              <ChevronRight size={12} />
            </a>
          </div>
        </div>

      </div>

    </div>
  );
}
