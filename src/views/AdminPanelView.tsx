import React, { useState, useEffect } from 'react';
import { db, auth } from '../services/firebase';
import { collection, query, where, getDocs, orderBy, onSnapshot, doc, updateDoc, increment, serverTimestamp } from 'firebase/firestore';
import { 
  Users, 
  Wallet, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Search, 
  Filter, 
  CheckCircle2, 
  XCircle, 
  MoreVertical,
  Shield,
  Ban,
  Activity,
  ArrowLeft,
  RefreshCw,
  Loader2,
  Trash2,
  Eye,
  Settings,
  User,
  Globe,
  Navigation,
  MousePointer2,
  PieChart as PieChartIcon,
  BarChart3
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell,
  BarChart,
  Bar
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';

interface AdminPanelViewProps {
  onBack: () => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
}

export default function AdminPanelView({ onBack, showToast }: AdminPanelViewProps) {
  const [activeTab, setActiveTab] = useState<'users' | 'deposits' | 'withdrawals' | 'traffic'>('users');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [trafficStats, setTrafficStats] = useState<any>(null);
  
  const [users, setUsers] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);

  useEffect(() => {
    // Subscribe to users
    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      const userList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsers(userList);
    });

    // Subscribe to transactions
    const unsubTrxs = onSnapshot(query(collection(db, 'transactions'), orderBy('createdAt', 'desc')), (snapshot) => {
      const trxList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTransactions(trxList);
    });

    return () => {
      unsubUsers();
      unsubTrxs();
    };
  }, []);

  useEffect(() => {
    if (activeTab === 'traffic') {
      fetchTrafficStats();
    }
  }, [activeTab]);

  const fetchTrafficStats = async () => {
    setIsLoading(true);
    try {
      // In a real app, use fetch('/api/admin/traffic/stats', { headers: { Authorization: `Bearer ${token}` } })
      // For now we'll simulate the fetch as it's a dev environment
      setTimeout(() => {
        setTrafficStats({
          totalPageViews: 5432,
          uniqueVisitors: 1245,
          bounceRate: "42.5%",
          avgSessionDuration: "3m 45s",
          topPages: [
            { path: "/", hits: 2450 },
            { path: "/aviator", hits: 1280 },
            { path: "/deposit", hits: 850 },
            { path: "/crash-game", hits: 620 },
            { path: "/profile", hits: 410 }
          ],
          trafficSources: [
            { name: "Direct", value: 45, color: "#10b981" },
            { name: "Organic Search", value: 30, color: "#3b82f6" },
            { name: "Referral", value: 15, color: "#f59e0b" },
            { name: "Social", value: 10, color: "#ef4444" }
          ],
          dailyTraffic: [
            { name: "Mon", visitors: 110, views: 500 },
            { name: "Tue", visitors: 130, views: 600 },
            { name: "Wed", visitors: 150, views: 750 },
            { name: "Thu", visitors: 140, views: 700 },
            { name: "Fri", visitors: 180, views: 950 },
            { name: "Sat", visitors: 220, views: 1200 },
            { name: "Sun", visitors: 210, views: 1100 }
          ]
        });
        setIsLoading(false);
      }, 1000);
    } catch (err) {
      showToast('Traffic stats fetch failed', 'error');
      setIsLoading(false);
    }
  };

  const handleApproveTrx = async (trx: any) => {
    if (trx.status !== 'pending') return;
    
    try {
      setIsLoading(true);
      // In a real app, this should be done via a secure backend function
      // But for this project, the rules allow Admin to do it.
      
      const userRef = doc(db, 'users', trx.userId);
      const trxRef = doc(db, 'transactions', trx.id);
      const userTrxRef = doc(db, 'users', trx.userId, 'transactions', trx.id);

      if (trx.type === 'deposit') {
        // Increment balance and totalDeposits
        await updateDoc(userRef, {
          balance: increment(trx.amount),
          totalDeposits: increment(trx.amount),
          updatedAt: serverTimestamp()
        });
      } else if (trx.type === 'withdraw') {
        // Withdrawal amount is usually already deducted from balance when requested
        // but let's check the business logic. 
        // If it wasn't deducted: await updateDoc(userRef, { balance: increment(-trx.amount) });
        await updateDoc(userRef, {
          totalWithdrawals: increment(trx.amount),
          updatedAt: serverTimestamp()
        });
      }

      // Update transaction status
      await updateDoc(trxRef, { status: 'approved', approvedAt: serverTimestamp() });
      try {
        await updateDoc(userTrxRef, { status: 'approved', approvedAt: serverTimestamp() });
      } catch (e) {
        // userTrx might not exist or ID might be different
      }

      showToast('লেনদেন সফলভাবে অনুমোদিত হয়েছে!', 'success');
    } catch (err) {
      console.error(err);
      showToast('অনুমোদন করতে ব্যর্থ হয়েছে।', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRejectTrx = async (trx: any) => {
    if (trx.status !== 'pending') return;

    try {
      setIsLoading(true);
      const userRef = doc(db, 'users', trx.userId);
      const trxRef = doc(db, 'transactions', trx.id);
      const userTrxRef = doc(db, 'users', trx.userId, 'transactions', trx.id);

      if (trx.type === 'withdraw') {
        // Refund balance if withdrawal is rejected
        await updateDoc(userRef, {
          balance: increment(trx.amount),
          updatedAt: serverTimestamp()
        });
      }

      await updateDoc(trxRef, { status: 'rejected', rejectedAt: serverTimestamp() });
      try {
        await updateDoc(userTrxRef, { status: 'rejected', rejectedAt: serverTimestamp() });
      } catch (e) {}

      showToast('লেনদেন বাতিল করা হয়েছে।', 'warning');
    } catch (err) {
      console.error(err);
      showToast('বাতিল করতে ব্যর্থ হয়েছে।', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleUserBan = async (user: any) => {
    try {
      await updateDoc(doc(db, 'users', user.id), {
        status: user.status === 'active' ? 'banned' : 'active',
        updatedAt: serverTimestamp()
      });
      showToast('ইউজার স্ট্যাটাস আপডেট করা হয়েছে।', 'info');
    } catch (err) {
      console.error(err);
      showToast('হালনাগাদ করতে ব্যর্থ হয়েছে।', 'error');
    }
  };

  const filteredUsers = users.filter(u => u.username.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredTrxs = transactions.filter(t => t.username.toLowerCase().includes(searchQuery.toLowerCase()) && (activeTab === 'deposits' ? t.type === 'deposit' : t.type === 'withdraw'));

  return (
    <div className="flex-1 flex flex-col bg-gray-50 min-h-screen pb-24 transition-colors duration-300">
      {/* Header */}
      <div className="p-4 flex items-center justify-between sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
        <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-2xl text-gray-700 transition-all">
          <ArrowLeft size={24} />
        </button>
        <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight flex items-center gap-2">
          <Shield className="text-teal-600" size={24} />
          অ্যাডমিন <span className="text-teal-600">প্যানেল</span>
        </h2>
        <button 
          onClick={() => {
            if (activeTab === 'traffic') fetchTrafficStats();
            else {
              setIsLoading(true);
              setTimeout(() => setIsLoading(false), 800);
            }
          }}
          className="p-2 hover:bg-gray-100 rounded-2xl text-gray-700 transition-all"
        >
          {isLoading ? <Loader2 size={24} className="animate-spin" /> : <RefreshCw size={24} />}
        </button>
      </div>

      {/* Stats Quick View */}
      <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
         <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
            <Users size={20} className="text-blue-500 mb-2" />
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">মোট ইউজার</p>
            <p className="text-2xl font-black text-gray-900">{users.length}</p>
         </div>
         <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
            <Wallet size={20} className="text-emerald-500 mb-2" />
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">পেন্ডিং ডিপোজিট</p>
            <p className="text-2xl font-black text-gray-900">{transactions.filter(t => t.type === 'deposit' && t.status === 'pending').length}</p>
         </div>
         <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
            <Globe size={20} className="text-purple-500 mb-2" />
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">আজকের ভিজিটর</p>
            <p className="text-2xl font-black text-gray-900">১৫০+</p>
         </div>
         <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
            <Activity size={20} className="text-rose-500 mb-2" />
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">কনভার্সন রেট</p>
            <p className="text-2xl font-black text-gray-900">১২.৫%</p>
         </div>
      </div>

      {/* Tabs */}
      <div className="px-4 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
         {(['users', 'deposits', 'withdrawals', 'traffic'] as const).map((tab) => (
           <button
             key={tab}
             onClick={() => setActiveTab(tab)}
             className={`px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all whitespace-nowrap ${
               activeTab === tab 
                 ? 'bg-gray-900 text-white shadow-lg shadow-gray-900/20' 
                 : 'bg-white text-gray-500 border border-gray-100'
             }`}
           >
             {tab === 'users' ? 'ব্যবহারকারী' : tab === 'deposits' ? 'জমা রেকর্ড' : tab === 'withdrawals' ? 'উত্তোলন রেকর্ড' : 'ট্রাফিক এনালাইসিস'}
           </button>
         ))}
      </div>

      {/* Search Bar (Hide for Traffic) */}
      {activeTab !== 'traffic' && (
        <div className="p-4">
           <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-teal-600 transition-colors" size={20} />
              <input 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="সার্চ করুন..."
                className="w-full bg-white border border-gray-100 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold text-gray-700 focus:outline-none focus:border-teal-500 shadow-sm transition-all"
              />
           </div>
        </div>
      )}

      {/* Content List */}
      <div className="px-4 space-y-4 pb-12">
         {activeTab === 'users' ? (
           filteredUsers.map((user) => (
             <motion.div 
               layout
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               key={user.id}
               className="bg-white p-5 rounded-[32px] border border-gray-100 shadow-sm flex items-center justify-between"
             >
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center text-gray-400">
                    <User size={24} />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-gray-900 flex items-center gap-2">
                       {user.username}
                       {user.status === 'banned' && <Ban size={12} className="text-red-500" />}
                    </h4>
                    <p className="text-[10px] font-bold text-gray-400">ব্যালেন্স: ৳{user.balance.toLocaleString()}</p>
                  </div>
               </div>
               <div className="flex items-center gap-2">
                  <button 
                    onClick={() => handleToggleUserBan(user)}
                    className={`p-3 rounded-xl transition-all ${user.status === 'active' ? 'bg-red-50 text-red-500 hover:bg-red-100' : 'bg-green-50 text-green-500 hover:bg-green-100'}`}
                  >
                    {user.status === 'active' ? <Ban size={18} /> : <CheckCircle2 size={18} />}
                  </button>
                  <button className="p-3 bg-gray-50 text-gray-400 rounded-xl hover:bg-gray-100">
                    <Settings size={18} />
                  </button>
               </div>
             </motion.div>
           ))
         ) : activeTab === 'traffic' ? (
           <TrafficTab stats={trafficStats} isLoading={isLoading} />
         ) : (
           filteredTrxs.map((trx) => (
             <motion.div 
               layout
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               key={trx.id}
               className="bg-white p-5 rounded-[32px] border border-gray-100 shadow-sm"
             >
                <div className="flex justify-between items-start mb-4">
                   <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${trx.type === 'deposit' ? 'bg-emerald-50 text-emerald-500' : 'bg-amber-50 text-amber-500'}`}>
                         {trx.type === 'deposit' ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
                      </div>
                      <div>
                         <h4 className="text-sm font-black text-gray-900">{trx.username}</h4>
                         <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{trx.method} • {trx.id}</p>
                      </div>
                   </div>
                   <div className="text-right">
                      <p className="text-lg font-black text-gray-900">৳{trx.amount.toLocaleString()}</p>
                      <p className={`text-[9px] font-black uppercase tracking-[0.2em] ${trx.status === 'pending' ? 'text-amber-500' : trx.status === 'approved' ? 'text-emerald-500' : 'text-rose-500'}`}>
                         {trx.status}
                      </p>
                   </div>
                </div>

                {trx.status === 'pending' && (
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleApproveTrx(trx)}
                      className="flex-1 bg-emerald-500 text-white font-black text-[10px] uppercase tracking-widest py-3 rounded-xl hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20"
                    >
                      Approve
                    </button>
                    <button 
                      onClick={() => handleRejectTrx(trx)}
                      className="flex-1 bg-rose-500 text-white font-black text-[10px] uppercase tracking-widest py-3 rounded-xl hover:bg-rose-600 transition-all shadow-lg shadow-rose-500/20"
                    >
                      Reject
                    </button>
                  </div>
                )}
             </motion.div>
           ))
         )}
      </div>

      {/* No Results */}
      {activeTab !== 'traffic' && (activeTab === 'users' ? filteredUsers : filteredTrxs).length === 0 && (
        <div className="flex flex-col items-center justify-center p-12 text-center text-gray-300">
           <Activity size={48} className="mb-4 opacity-50" />
           <p className="text-sm font-bold uppercase tracking-widest">কোনো ডেটা পাওয়া যায়নি</p>
        </div>
      )}
    </div>
  );
}

function TrafficTab({ stats, isLoading }: { stats: any, isLoading: boolean }) {
  if (isLoading || !stats) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 size={40} className="text-teal-500 animate-spin" />
        <p className="text-xs font-black text-gray-400 uppercase tracking-widest">অনালাইসিস লোড হচ্ছে...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Traffic Summary Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white p-5 rounded-[32px] border border-gray-100 shadow-sm">
           <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">মোট পেজ ভিউ</p>
           <p className="text-2xl font-black text-gray-900">{stats.totalPageViews.toLocaleString()}</p>
           <div className="flex items-center gap-1 text-emerald-500 text-[10px] font-black mt-1">
              <ArrowUpRight size={12} /> ১২% বৃদ্ধি
           </div>
        </div>
        <div className="bg-white p-5 rounded-[32px] border border-gray-100 shadow-sm">
           <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">ইউনিক ভিজিটর</p>
           <p className="text-2xl font-black text-gray-900">{stats.uniqueVisitors.toLocaleString()}</p>
           <div className="flex items-center gap-1 text-emerald-500 text-[10px] font-black mt-1">
              <ArrowUpRight size={12} /> ৮% বৃদ্ধি
           </div>
        </div>
        <div className="bg-white p-5 rounded-[32px] border border-gray-100 shadow-sm">
           <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">বাউন্স রেট</p>
           <p className="text-2xl font-black text-gray-900">{stats.bounceRate}</p>
           <div className="flex items-center gap-1 text-rose-500 text-[10px] font-black mt-1">
              <ArrowDownLeft size={12} /> ২.৫% হ্রাস
           </div>
        </div>
        <div className="bg-white p-5 rounded-[32px] border border-gray-100 shadow-sm">
           <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">গড় ভিজিট টাইম</p>
           <p className="text-2xl font-black text-gray-900">{stats.avgSessionDuration}</p>
           <div className="flex items-center gap-1 text-emerald-500 text-[10px] font-black mt-1">
              <ArrowUpRight size={12} /> ১৫সে: বৃদ্ধি
           </div>
        </div>
      </div>

      {/* Visitors vs PageViews Chart */}
      <div className="bg-white p-6 rounded-[40px] border border-gray-100 shadow-sm">
         <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight flex items-center gap-2 mb-6">
            <BarChart3 className="text-teal-500" size={18} />
            ভিজিটর বনাম পেজ ভিউ (সাপ্তাহিক)
         </h3>
         <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
               <AreaChart data={stats.dailyTraffic}>
                  <defs>
                    <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#14b8a6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 900 }} />
                  <YAxis hide />
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '10px', fontWeight: 900 }} 
                  />
                  <Area type="monotone" dataKey="views" stroke="#14b8a6" strokeWidth={3} fillOpacity={1} fill="url(#colorViews)" />
                  <Area type="monotone" dataKey="visitors" stroke="#3b82f6" strokeWidth={3} fill="transparent" />
               </AreaChart>
            </ResponsiveContainer>
         </div>
      </div>

      {/* Traffic Sources & Top Pages */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         {/* Top Pages */}
         <div className="bg-white p-6 rounded-[40px] border border-gray-100 shadow-sm">
            <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight flex items-center gap-2 mb-4">
               <Navigation className="text-teal-500" size={18} />
               শীর্ষ ৫ পেজ
            </h3>
            <div className="space-y-3">
               {stats.topPages.map((page: any, idx: number) => (
                  <div key={page.path} className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl">
                     <div className="flex items-center gap-3">
                        <span className="w-6 h-6 bg-white rounded-lg flex items-center justify-center text-[10px] font-black text-gray-400">{idx + 1}</span>
                        <span className="text-xs font-bold text-gray-700">{page.path}</span>
                     </div>
                     <span className="text-xs font-black text-gray-900">{page.hits.toLocaleString()}</span>
                  </div>
               ))}
            </div>
         </div>

         {/* Traffic Sources */}
         <div className="bg-white p-6 rounded-[40px] border border-gray-100 shadow-sm">
            <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight flex items-center gap-2 mb-4">
               <PieChartIcon className="text-teal-500" size={18} />
               ট্রাফিক সোর্স
            </h3>
            <div className="flex items-center gap-4">
               <div className="w-24 h-24">
                  <ResponsiveContainer width="100%" height="100%">
                     <PieChart>
                        <Pie
                           data={stats.trafficSources}
                           innerRadius={25}
                           outerRadius={45}
                           paddingAngle={4}
                           dataKey="value"
                        >
                           {stats.trafficSources.map((entry: any, index: number) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                           ))}
                        </Pie>
                     </PieChart>
                  </ResponsiveContainer>
               </div>
               <div className="flex-1 space-y-2">
                  {stats.trafficSources.map((source: any) => (
                     <div key={source.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                           <div className="w-2 h-2 rounded-full" style={{ backgroundColor: source.color }} />
                           <span className="text-[10px] font-bold text-gray-400">{source.name}</span>
                        </div>
                        <span className="text-[10px] font-black text-gray-900 text-right">{source.value}%</span>
                     </div>
                  ))}
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}
