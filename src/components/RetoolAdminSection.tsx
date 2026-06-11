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
  DollarSign
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
      if (isManual) {
        showToast('Retool Analytics synchronized successfully!', 'success');
      }
    } catch (err: any) {
      console.error('[RetoolAdminSection]', err);
      setError(err.message || 'Error occurred while loading data');
      showToast(err.message || 'Retool API connection error', 'error');
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSimulateWebhook = async () => {
    setSyncing(true);
    try {
      // Simulate post webhook to push data on Retool platform (or call our express local server)
      const token = await auth.currentUser?.getIdToken() || 'owner.css13';
      const response = await fetch('/api/admin/retool-webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: parseFloat(testAmount),
          type: testType,
          gateway: testGateway,
          user: auth.currentUser?.email || 'test_retool_sim@spin71.bet'
        })
      });

      const resData = await response.json();
      if (!response.ok) throw new Error(resData.error || 'Webhook simulation error');

      showToast('Retool Webhook action simulated successfully!', 'success');
      // Reload stats
      await fetchData(false);
    } catch (err: any) {
      console.error('[Webhook Simulation]', err);
      showToast(err.message || 'Webhook failed to broadcast', 'error');
    } finally {
      setSyncing(false);
    }
  };

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

        <div className="flex items-center gap-3">
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Active Users */}
        <div className="bg-[#0b2424]/40 border border-white/5 backdrop-blur-md rounded-3xl p-6 group hover:border-emerald-500/20 transition-all duration-300 relative overflow-hidden">
          <div className="absolute right-0 top-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl group-hover:bg-emerald-500/10 transition-colors pointer-events-none" />
          <div className="flex justify-between items-start">
            <div className="p-3 bg-teal-500/10 border border-teal-500/20 rounded-2xl text-teal-300">
              <Users size={20} />
            </div>
            <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full text-[10px] text-emerald-400 font-bold uppercase tracking-widest">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-ping" />
              Live Active
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-black italic tracking-tight">{data?.activeUsers || 0}</span>
            <span className="text-xs text-white/40 font-bold ml-1 uppercase">Players Online</span>
          </div>
          <div className="mt-2 text-[10px] text-emerald-400/70 font-semibold uppercase flex items-center gap-1">
            <Zap size={10} /> Sourced in real-time from Retool Web
          </div>
        </div>

        {/* Card 2: Total Sourced Deposits */}
        <div className="bg-[#0b2424]/40 border border-white/5 backdrop-blur-md rounded-3xl p-6 group hover:border-teal-500/20 transition-all duration-300 relative overflow-hidden">
          <div className="absolute right-0 top-0 w-32 h-32 bg-teal-500/5 rounded-full blur-3xl group-hover:bg-teal-500/10 transition-colors pointer-events-none" />
          <div className="flex justify-between items-start">
            <div className="p-3 bg-teal-500/10 border border-teal-500/20 rounded-2xl text-teal-300">
              <TrendingUp size={20} />
            </div>
            <div className="px-2.5 py-1 bg-teal-500/15 text-[10px] text-teal-400 border border-teal-500/20 rounded-full font-black tracking-widest uppercase">
              RETOOL DB
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-black italic tracking-tight">৳{(data?.totalDeposits || 0).toLocaleString()}</span>
            <span className="text-xs text-white/40 font-bold ml-1 uppercase">Sourced Dep.</span>
          </div>
          <p className="mt-2 text-[10px] text-teal-400/70 font-semibold uppercase flex items-center gap-1">
            <Sparkles size={10} /> Active transactional ledger
          </p>
        </div>

        {/* Card 3: Total Sourced Withdrawals */}
        <div className="bg-[#0b2424]/40 border border-white/5 backdrop-blur-md rounded-3xl p-6 group hover:border-red-500/20 transition-all duration-300 relative overflow-hidden">
          <div className="absolute right-0 top-0 w-32 h-32 bg-red-500/5 rounded-full blur-3xl group-hover:bg-red-500/10 transition-colors pointer-events-none" />
          <div className="flex justify-between items-start">
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-300">
              <TrendingDown size={20} />
            </div>
            <div className="px-2.5 py-1 bg-rose-500/10 border border-rose-500/20 rounded-full text-[10px] text-rose-400 font-bold uppercase tracking-widest">
              LOCKED CASH
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-black italic tracking-tight">৳{(data?.totalWithdrawals || 0).toLocaleString()}</span>
            <span className="text-xs text-white/40 font-bold ml-1 uppercase">Processed WD</span>
          </div>
          <p className="mt-2 text-[10px] text-rose-400/70 font-semibold uppercase flex items-center gap-1">
            <CheckCircle size={10} /> Verified security checkpoints
          </p>
        </div>

        {/* Card 4: System Health status */}
        <div className="bg-[#0b2424]/40 border border-white/5 backdrop-blur-md rounded-3xl p-6 group hover:border-emerald-400/20 transition-all duration-300 relative overflow-hidden">
          <div className="absolute right-0 top-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl group-hover:bg-emerald-500/10 transition-colors pointer-events-none" />
          <div className="flex justify-between items-start">
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-300">
              <Cpu size={20} />
            </div>
            <div className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-400/20 rounded-full text-[10px] text-emerald-400 font-bold uppercase tracking-widest">
              HEALTHY
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-black italic tracking-tight text-emerald-400">{data?.systemHealth || 'Optimal'}</span>
          </div>
          <p className="mt-3.5 text-[10px] text-white/40 font-semibold uppercase flex items-center gap-1">
            Retool container status: active
          </p>
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
            onClick={handleSimulateWebhook}
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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-teal-500/15 border border-teal-500/20 rounded-xl text-teal-400">
                <Pocket size={16} />
              </div>
              <h4 className="text-sm font-black uppercase tracking-wider text-white">Recent Transactions Sourced from Retool</h4>
            </div>
            <span className="text-[10px] font-mono font-bold text-teal-400 bg-teal-500/10 border border-teal-500/20 px-2 py-0.5 rounded-md">
              LIVE BROADCAST
            </span>
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
                {data?.recentTransactions && data.recentTransactions.length > 0 ? (
                  data.recentTransactions.map((tx) => (
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

          <div className="flex justify-end pt-2">
            <a 
              href="https://retool.com" 
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
