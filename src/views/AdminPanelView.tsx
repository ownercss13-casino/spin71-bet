import React, { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  doc, 
  updateDoc, 
  increment, 
  serverTimestamp,
  setDoc,
  getDocs,
  getDoc
} from 'firebase/firestore';
import { 
  Users, 
  Wallet, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Search, 
  CheckCircle2, 
  Shield, 
  Ban, 
  Activity, 
  ArrowLeft, 
  RefreshCw, 
  Loader2, 
  Settings, 
  User, 
  Globe, 
  Navigation, 
  BarChart3,
  Gamepad2,
  Clock,
  LayoutDashboard,
  LogOut,
  Image as ImageIcon,
  MessageSquare,
  DollarSign,
  Plus,
  Minus,
  UserPlus
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
  Cell
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';

interface AdminPanelViewProps {
  onBack: () => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
  userData: any;
  globalLogos: Record<string, string>;
  globalNames: Record<string, string>;
  globalUrls: Record<string, string>;
  globalOptions: Record<string, string>;
  updateGlobalGameLogo: (id: string, logo: string) => Promise<void>;
  updateGlobalGameName: (id: string, name: string) => Promise<void>;
  updateGlobalGameUrl: (id: string, url: string) => Promise<void>;
  updateGlobalGameOption: (id: string, opt: string) => Promise<void>;
  allButtonName: string;
  updateAllButtonName: (name: string) => Promise<void>;
  casinoName: string;
  updateCasinoName: (name: string) => Promise<void>;
  noticeText: string;
  setNoticeText: (text: string) => void;
  minDeposit: number;
  setMinDeposit: (val: number) => void;
  minWithdraw: number;
  setMinWithdraw: (val: number) => void;
  welcomeBonus: number;
  setWelcomeBonus: (val: number) => void;
  telegramLink: string;
  setTelegramLink: (val: string) => void;
  globalImages: Record<string, string>;
  updateGlobalImage: (key: string, url: string) => Promise<void>;
  onAddUser: (user: any) => Promise<void>;
}

export default function AdminPanelView(props: AdminPanelViewProps) {
  const { onBack, showToast, userData } = props;
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'deposits' | 'withdrawals' | 'games' | 'settings'>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  const [users, setUsers] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [trafficStats, setTrafficStats] = useState<any>(null);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  useEffect(() => {
    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      const userList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsers(userList);
    }, (error) => {
      console.error("Users list onSnapshot error:", error);
    });

    const unsubTrxs = onSnapshot(query(collection(db, 'transactions'), orderBy('createdAt', 'desc')), (snapshot) => {
      const trxList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTransactions(trxList);
    }, (error) => {
      console.error("Transactions list onSnapshot error:", error);
    });

    // Simulated traffic stats
    setTrafficStats({
      totalPageViews: 5432,
      uniqueVisitors: 1245,
      bounceRate: "42.5%",
      avgSessionDuration: "3m 45s",
      dailyTraffic: [
        { name: "Mon", visitors: 110, views: 500 },
        { name: "Tue", visitors: 130, views: 600 },
        { name: "Wed", visitors: 150, views: 750 },
        { name: "Thu", visitors: 140, views: 700 },
        { name: "Fri", visitors: 180, views: 950 },
        { name: "Sat", visitors: 220, views: 1200 },
        { name: "Sun", visitors: 210, views: 1100 }
      ],
      trafficSources: [
        { name: "Direct", value: 45, color: "#10b981" },
        { name: "Search", value: 30, color: "#3b82f6" },
        { name: "Referral", value: 15, color: "#f59e0b" },
        { name: "Social", value: 10, color: "#ef4444" }
      ]
    });

    return () => {
      unsubUsers();
      unsubTrxs();
    };
  }, []);

  const handleApproveTrx = async (trx: any) => {
    if (trx.status !== 'pending') return;
    setIsLoading(true);
    try {
      const userRef = doc(db, 'users', trx.userId);
      const trxRef = doc(db, 'transactions', trx.id);

      if (trx.type === 'deposit') {
        await updateDoc(userRef, {
          balance: increment(trx.amount),
          totalDeposits: increment(trx.amount),
          updatedAt: serverTimestamp()
        });
      } else if (trx.type === 'withdraw') {
        await updateDoc(userRef, {
          totalWithdrawals: increment(trx.amount),
          updatedAt: serverTimestamp()
        });
      }

      await updateDoc(trxRef, { status: 'approved', approvedAt: serverTimestamp() });
      showToast('Transaction Approved!', 'success');
    } catch (err) {
      showToast('Approval failed', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRejectTrx = async (trx: any) => {
    if (trx.status !== 'pending') return;
    setIsLoading(true);
    try {
      const userRef = doc(db, 'users', trx.userId);
      const trxRef = doc(db, 'transactions', trx.id);

      if (trx.type === 'withdraw') {
        await updateDoc(userRef, {
          balance: increment(trx.amount),
          updatedAt: serverTimestamp()
        });
      }

      await updateDoc(trxRef, { status: 'rejected', rejectedAt: serverTimestamp() });
      showToast('Transaction Rejected', 'warning');
    } catch (err) {
      showToast('Rejection failed', 'error');
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
      showToast(`User ${user.status === 'active' ? 'banned' : 'unbanned'}`, 'info');
    } catch (err) {
      showToast('Action failed', 'error');
    }
  };

  const handleAdjustBalance = async (userId: string, amount: number) => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        balance: increment(amount),
        updatedAt: serverTimestamp()
      });
      showToast('Balance updated', 'success');
    } catch (err) {
      showToast('Update failed', 'error');
    }
  };

  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pendingDeposits = transactions.filter(t => t.type === 'deposit' && t.status === 'pending');
  const pendingWithdrawals = transactions.filter(t => t.type === 'withdraw' && t.status === 'pending');

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'deposits', label: 'Deposits', icon: Wallet, badge: pendingDeposits.length },
    { id: 'withdrawals', label: 'Withdrawals', icon: DollarSign, badge: pendingWithdrawals.length },
    { id: 'games', label: 'Game Settings', icon: Gamepad2 },
    { id: 'settings', label: 'Global Setup', icon: Settings }
  ];

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className={`${isSidebarOpen ? 'w-64' : 'w-20'} bg-gray-900 transition-all duration-300 flex flex-col z-50`}>
        <div className="p-6 flex items-center gap-3 border-b border-gray-800">
          <div className="w-10 h-10 bg-teal-500 rounded-xl flex items-center justify-center shadow-lg shadow-teal-500/20 shrink-0">
            <Shield className="text-white" size={20} />
          </div>
          {isSidebarOpen && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="overflow-hidden whitespace-nowrap">
              <h2 className="text-white font-black text-lg tracking-tight uppercase">Admin<span className="text-teal-500">Panel</span></h2>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Management Suite</p>
            </motion.div>
          )}
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all relative group ${
                activeTab === item.id 
                  ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/20' 
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <item.icon size={20} className="shrink-0" />
              {isSidebarOpen && <span className="font-bold text-sm">{item.label}</span>}
              {item.badge ? (
                <div className={`absolute right-2 bg-rose-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full border-2 border-gray-900 group-hover:border-gray-800 transition-colors ${!isSidebarOpen && 'scale-75 -top-1 -right-1'}`}>
                  {item.badge}
                </div>
              ) : null}
              {!isSidebarOpen && (
                <div className="absolute left-full ml-4 bg-gray-900 text-white text-[10px] px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap font-black uppercase tracking-widest shadow-xl border border-gray-800">
                  {item.label}
                </div>
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-800">
          <button 
            onClick={onBack}
            className="w-full flex items-center gap-3 p-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-all font-bold text-sm"
          >
            <LogOut size={20} />
            {isSidebarOpen && <span>Exit Dashboard</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-20 bg-white border-b border-gray-200 flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-500"
            >
              <ArrowLeft className={`transition-transform duration-300 ${!isSidebarOpen && 'rotate-180'}`} size={20} />
            </button>
            <h1 className="text-xl font-black text-gray-900 uppercase tracking-tight">
              {navItems.find(i => i.id === activeTab)?.label}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-black text-gray-900 uppercase tracking-tight">{userData?.username || 'Admin'}</p>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{userData?.role}</p>
            </div>
            <div className="w-10 h-10 bg-gray-100 rounded-full border border-gray-200 flex items-center justify-center text-gray-400">
              <User size={20} />
            </div>
          </div>
        </header>

        {/* Scrollable Area */}
        <div className="flex-1 overflow-y-auto p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'dashboard' && <DashboardOverview stats={trafficStats} users={users} transactions={transactions} />}
              {activeTab === 'users' && (
                <UserManagement 
                  users={filteredUsers} 
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  onToggleBan={handleToggleUserBan}
                  onAdjustBalance={handleAdjustBalance}
                  onSelectUser={setSelectedUser}
                  onAddUser={props.onAddUser}
                />
              )}
              {activeTab === 'deposits' && (
                <TransactionList 
                  title="Deposit Requests"
                  trxs={transactions.filter(t => t.type === 'deposit')}
                  onApprove={handleApproveTrx}
                  onReject={handleRejectTrx}
                  isLoading={isLoading}
                />
              )}
              {activeTab === 'withdrawals' && (
                <TransactionList 
                  title="Withdrawal Requests"
                  trxs={transactions.filter(t => t.type === 'withdraw')}
                  onApprove={handleApproveTrx}
                  onReject={handleRejectTrx}
                  isLoading={isLoading}
                />
              )}
              {activeTab === 'games' && <GameManagement {...props} />}
              {activeTab === 'settings' && <GlobalSettings {...props} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* User Quick Edit Modal */}
      {selectedUser && (
        <UserEditModal 
          user={selectedUser} 
          onClose={() => setSelectedUser(null)} 
          onSave={async (updates) => {
            try {
              await updateDoc(doc(db, 'users', selectedUser.id), updates);
              showToast('User updated successfully', 'success');
              setSelectedUser(null);
            } catch (err) {
              showToast('Failed to update user', 'error');
            }
          }}
          onAdjustBalance={handleAdjustBalance}
        />
      )}
    </div>
  );
}

function DashboardOverview({ stats, users, transactions }: any) {
  const totalBalance = users.reduce((acc: number, u: any) => acc + (u.balance || 0), 0);
  const totalDeposits = transactions.filter((t: any) => t.type === 'deposit' && t.status === 'approved').reduce((acc: number, t: any) => acc + t.amount, 0);

  return (
    <div className="space-y-8">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard label="Total Users" value={users.length} icon={Users} color="bg-blue-500" />
        <MetricCard label="Users Balance" value={`৳${totalBalance.toLocaleString()}`} icon={Wallet} color="bg-teal-500" />
        <MetricCard label="Total Revenue (Approved)" value={`৳${totalDeposits.toLocaleString()}`} icon={DollarSign} color="bg-emerald-500" />
        <MetricCard label="Active Sessions" value="42" icon={Activity} color="bg-orange-500" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 bg-white p-8 rounded-[32px] shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight flex items-center gap-2">
              <BarChart3 className="text-teal-500" size={22} />
              Traffic Analytics
            </h3>
            <select className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-xs font-bold text-gray-500 outline-none">
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
            </select>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats?.dailyTraffic}>
                <defs>
                  <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#14b8a6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 700 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 700 }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} 
                />
                <Area type="monotone" dataKey="views" stroke="#14b8a6" strokeWidth={3} fillOpacity={1} fill="url(#colorViews)" />
                <Area type="monotone" dataKey="visitors" stroke="#3b82f6" strokeWidth={3} fill="transparent" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100">
            <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight mb-6 flex items-center gap-2">
              <Globe className="text-blue-500" size={18} />
              Traffic Sources
            </h3>
            <div className="flex items-center gap-6">
              <div className="w-24 h-24">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={stats?.trafficSources} innerRadius={25} outerRadius={45} paddingAngle={4} dataKey="value">
                      {stats?.trafficSources.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-2">
                {stats?.trafficSources.map((source: any) => (
                  <div key={source.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: source.color }} />
                      <span className="text-xs font-bold text-gray-400">{source.name}</span>
                    </div>
                    <span className="text-xs font-black text-gray-900">{source.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-gray-900 to-black p-8 rounded-[32px] text-white shadow-xl">
             <div className="flex items-center justify-between mb-4">
                <Clock className="text-teal-400" size={20} />
                <span className="text-[10px] font-black uppercase tracking-widest text-teal-400">System Pulse</span>
             </div>
             <p className="text-sm font-bold text-gray-400 leading-relaxed">
               All systems are operational. WebSocket latency is currenty <span className="text-white">12ms</span>.
             </p>
             <div className="mt-6 flex gap-2">
                {[1,2,3,4,5,6,7,8,9,10].map(i => (
                  <div key={i} className="flex-1 h-8 bg-gray-800 rounded flex items-end overflow-hidden">
                    <div className="w-full bg-teal-500" style={{ height: `${Math.random() * 100}%` }}></div>
                  </div>
                ))}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, icon: Icon, color }: any) {
  return (
    <div className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100 flex items-center gap-6">
      <div className={`w-14 h-14 ${color} rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-gray-200`}>
        <Icon size={24} />
      </div>
      <div>
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{label}</p>
        <p className="text-2xl font-black text-gray-900">{value}</p>
      </div>
    </div>
  );
}

function UserManagement({ users, searchQuery, setSearchQuery, onToggleBan, onAdjustBalance, onSelectUser, onAddUser }: any) {
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [newUserData, setNewUserData] = useState({ username: '', password: '', role: 'user', balance: 0 });
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest');

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserData.username || !newUserData.password) return;
    try {
      await onAddUser(newUserData);
      setIsAddingUser(false);
      setNewUserData({ username: '', password: '', role: 'user', balance: 0 });
    } catch (err) {
      console.error("Error adding user:", err);
    }
  };

  const sortedUsers = [...users].sort((a, b) => {
    const dateA = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
    const dateB = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
    
    if (sortBy === 'newest') {
      return dateB - dateA;
    } else {
      return dateA - dateB;
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col md:flex-row flex-1 max-w-2xl gap-4">
          <div className="relative group flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-teal-600 transition-colors" size={20} />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Username or User ID..."
              className="w-full bg-white border border-gray-100 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold text-gray-700 focus:outline-none focus:border-teal-500 shadow-sm transition-all"
            />
          </div>
          <select 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-white border border-gray-100 rounded-2xl px-6 py-4 text-sm font-black text-gray-700 focus:outline-none focus:border-teal-500 shadow-sm transition-all uppercase tracking-widest outline-none appearance-none cursor-pointer"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>
        </div>
        <button 
          onClick={() => setIsAddingUser(true)}
          className="bg-gray-900 text-white px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2"
        >
          <UserPlus size={18} />
          Add New User
        </button>
      </div>

      {isAddingUser && (
        <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm animate-in slide-in-from-top-4 duration-300">
          <form onSubmit={handleAddUser} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Username</label>
              <input 
                value={newUserData.username}
                onChange={(e) => setNewUserData({...newUserData, username: e.target.value})}
                className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm"
                placeholder="Enter username"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Password</label>
              <input 
                type="password"
                value={newUserData.password}
                onChange={(e) => setNewUserData({...newUserData, password: e.target.value})}
                className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm"
                placeholder="Enter password"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Role</label>
              <select 
                value={newUserData.role}
                onChange={(e) => setNewUserData({...newUserData, role: e.target.value})}
                className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm capitalize"
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
                <option value="agent">Agent</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button 
                type="submit"
                className="flex-1 bg-teal-600 text-white py-3 rounded-xl font-bold text-xs"
              >
                Create Account
              </button>
              <button 
                type="button"
                onClick={() => setIsAddingUser(false)}
                className="px-4 bg-gray-100 text-gray-500 py-3 rounded-xl font-bold text-xs"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-50">
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">User</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Balance</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Role</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {sortedUsers.map((user: any) => (
                <tr key={user.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400 shrink-0">
                        <User size={18} />
                      </div>
                      <div>
                        <p className="text-sm font-black text-gray-900">{user.username}</p>
                        <p className="text-[10px] font-bold text-gray-400 font-mono tracking-tighter opacity-0 group-hover:opacity-100 transition-opacity uppercase">ID: {user.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-black text-gray-900">৳{(user.balance || 0).toLocaleString()}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${user.status === 'active' ? 'bg-emerald-50 text-emerald-500' : 'bg-rose-50 text-rose-500'}`}>
                      {user.status || 'active'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-bold text-gray-500 uppercase">{user.role || 'user'}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => onSelectUser(user)}
                        className="p-2 hover:bg-teal-50 text-gray-400 hover:text-teal-600 rounded-lg transition-all"
                        title="Edit User"
                      >
                        <Settings size={18} />
                      </button>
                      <button 
                         onClick={() => onToggleBan(user)}
                         className={`p-2 rounded-lg transition-all ${user.status === 'active' ? 'hover:bg-rose-50 text-gray-400 hover:text-rose-500' : 'bg-rose-50 text-rose-500'}`}
                         title={user.status === 'active' ? 'Ban User' : 'Unban User'}
                      >
                        <Ban size={18} />
                      </button>
                      <div className="flex gap-1 ml-4 border-l border-gray-100 pl-4">
                         <button 
                            onClick={() => onAdjustBalance(user.id, 500)}
                            className="w-8 h-8 flex items-center justify-center bg-emerald-50 text-emerald-600 rounded-lg text-xs font-black hover:bg-emerald-100 transition-all"
                            title="Add 500"
                         >
                           +500
                         </button>
                         <button 
                            onClick={() => onAdjustBalance(user.id, -500)}
                            className="w-8 h-8 flex items-center justify-center bg-rose-50 text-rose-600 rounded-lg text-xs font-black hover:bg-rose-100 transition-all"
                            title="Sub 500"
                         >
                           -500
                         </button>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {users.length === 0 && (
            <div className="p-12 text-center text-gray-400 font-bold uppercase tracking-widest text-xs">
              No users found matching your criteria.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function UserEditModal({ user, onClose, onSave, onAdjustBalance }: any) {
  const [formData, setFormData] = useState({
    username: user.username,
    role: user.role || 'user',
    status: user.status || 'active'
  });
  const [adjustAmount, setAdjustAmount] = useState<number>(0);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={onClose} />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white w-full max-w-lg rounded-[40px] shadow-2xl relative overflow-hidden flex flex-col"
      >
        <div className="p-8 border-b border-gray-50 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">Edit Profile</h3>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">User ID: {user.id}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-2xl text-gray-400">
            <ArrowLeft size={24} />
          </button>
        </div>

        <div className="p-8 space-y-6 overflow-y-auto max-h-[70vh]">
          <div className="bg-gray-50 p-6 rounded-[32px] border border-gray-100 flex items-center justify-between">
             <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Current Balance</p>
                <p className="text-3xl font-black text-gray-900">৳{user.balance?.toLocaleString()}</p>
             </div>
             <div className="flex gap-2">
                <input 
                  type="number"
                  placeholder="Amount"
                  className="w-24 bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold font-mono outline-none focus:border-teal-500"
                  onChange={(e) => setAdjustAmount(Number(e.target.value))}
                />
                <button 
                   onClick={() => onAdjustBalance(user.id, adjustAmount)}
                   className="p-3 bg-teal-500 text-white rounded-xl hover:bg-teal-600 transition-all font-black text-xs"
                >
                  <Plus size={16} />
                </button>
                <button 
                   onClick={() => onAdjustBalance(user.id, -adjustAmount)}
                   className="p-3 bg-rose-500 text-white rounded-xl hover:bg-rose-600 transition-all font-black text-xs"
                >
                  <Minus size={16} />
                </button>
             </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2 ml-1">Username</label>
              <input 
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({...formData, username: e.target.value})}
                className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-sm font-bold text-gray-700 focus:outline-none focus:border-teal-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2 ml-1">Role</label>
                <select 
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-sm font-bold text-gray-700 outline-none focus:border-teal-500 appearance-none"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                  <option value="agent">Agent</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2 ml-1">Status</label>
                <select 
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-sm font-bold text-gray-700 outline-none focus:border-teal-500 appearance-none"
                >
                  <option value="active">Active</option>
                  <option value="banned">Banned</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="p-8 bg-gray-50 border-t border-gray-100 flex gap-4">
          <button 
             onClick={onClose}
             className="flex-1 bg-white border border-gray-200 text-gray-500 font-black py-4 rounded-2xl hover:bg-gray-100 transition-all uppercase tracking-widest text-[10px]"
          >
            Cancel
          </button>
          <button 
             onClick={() => onSave(formData)}
             className="flex-1 bg-gray-900 text-white font-black py-4 rounded-2xl hover:bg-black transition-all uppercase tracking-widest text-[10px] shadow-xl shadow-gray-900/20"
          >
            Save Changes
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function TransactionList({ title, trxs, onApprove, onReject, isLoading }: any) {
  const pending = trxs.filter((t: any) => t.status === 'pending');
  const past = trxs.filter((t: any) => t.status !== 'pending').slice(0, 50);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">{title}</h2>
        <div className="bg-white px-4 py-2 rounded-xl border border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
          <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
          {pending.length} Pending
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Pending Requests</h3>
        <AnimatePresence>
          {pending.map((trx: any) => (
            <motion.div 
               layout
               initial={{ opacity: 0, x: -10 }}
               animate={{ opacity: 1, x: 0 }}
               exit={{ opacity: 0, scale: 0.95 }}
               key={trx.id}
               className="bg-white p-6 rounded-[32px] border-2 border-amber-50 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6"
            >
              <div className="flex items-center gap-5">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${trx.type === 'deposit' ? 'bg-emerald-50 text-emerald-500' : 'bg-amber-50 text-amber-500'}`}>
                  {trx.type === 'deposit' ? <ArrowDownLeft size={24} /> : <ArrowUpRight size={24} />}
                </div>
                <div>
                   <h4 className="text-base font-black text-gray-900">{trx.username}</h4>
                   <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                      {trx.method} • {trx.trxId || 'No TRX ID'} • {trx.senderNumber}
                   </p>
                   <div className="flex items-center gap-2 mt-2">
                      <span className="text-[9px] font-black bg-gray-100 text-gray-500 py-1 px-2 rounded-full uppercase tracking-[0.1em]">User ID: {trx.userId}</span>
                      <span className="text-[9px] font-black bg-teal-50 text-teal-600 py-1 px-2 rounded-full uppercase tracking-[0.1em]">{new Date(trx.createdAt?.seconds * 1000).toLocaleString()}</span>
                   </div>
                </div>
              </div>

              <div className="flex flex-col items-end gap-3 min-w-[150px]">
                <p className="text-3xl font-black text-gray-900 tracking-tight">৳{trx.amount.toLocaleString()}</p>
                <div className="flex gap-2 w-full">
                   <button 
                      onClick={() => onApprove(trx)}
                      disabled={isLoading}
                      className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-[10px] uppercase tracking-widest py-3 px-4 rounded-xl transition-all shadow-lg shadow-emerald-500/20"
                   >
                     Approve
                   </button>
                   <button 
                      onClick={() => onReject(trx)}
                      disabled={isLoading}
                      className="flex-1 bg-rose-500 hover:bg-rose-600 text-white font-black text-[10px] uppercase tracking-widest py-3 px-4 rounded-xl transition-all shadow-lg shadow-rose-500/20"
                   >
                     Reject
                   </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {pending.length === 0 && (
          <div className="bg-gray-50 border border-dashed border-gray-200 rounded-[32px] p-12 text-center text-gray-400 text-sm font-bold uppercase tracking-widest">
            All requests processed.
          </div>
        )}
      </div>

      <div className="space-y-4">
        <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Recent Activity</h3>
        <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
           <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-50">
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">User</th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Amount</th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Method</th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {past.map((trx: any) => (
                    <tr key={trx.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm font-black text-gray-900">{trx.username}</p>
                          <p className="text-[10px] font-bold text-gray-400 font-mono">ID: {trx.userId}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-black text-gray-900">৳{trx.amount.toLocaleString()}</td>
                      <td className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">{trx.method}</td>
                      <td className="px-6 py-4">
                        <span className={`text-[9px] font-black px-2 py-1 rounded-full uppercase tracking-widest ${trx.status === 'approved' ? 'bg-emerald-50 text-emerald-500' : 'bg-rose-50 text-rose-500'}`}>
                          {trx.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-[10px] text-gray-400 font-bold uppercase">
                        {trx.createdAt?.seconds ? new Date(trx.createdAt.seconds * 1000).toLocaleDateString() : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
           </div>
        </div>
      </div>
    </div>
  );
}

function GameManagement(props: AdminPanelViewProps) {
  const games = [
    { id: '1', title: 'Aviator', defaultIcon: 'Plane' },
    { id: '2', title: 'Rocket', defaultIcon: 'Zap' },
    { id: '3', title: 'Slots', defaultIcon: 'Gamepad2' },
    { id: '4', title: 'Crash', defaultIcon: 'Activity' },
    { id: '5', title: 'Aviator Premium', defaultIcon: 'Shield' }
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {games.map(game => (
          <div key={game.id} className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gray-50 rounded-2xl overflow-hidden relative border border-gray-100 group">
                {props.globalLogos[game.id] ? (
                  <img src={props.globalLogos[game.id]} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                   <div className="w-full h-full flex items-center justify-center text-gray-300">
                      <ImageIcon size={24} />
                   </div>
                )}
                <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                  <Plus className="text-white" size={20} />
                  <input 
                    type="file" 
                    className="hidden" 
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (re) => props.updateGlobalGameLogo(game.id, re.target?.result as string);
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </label>
              </div>
              <div className="flex-1">
                <input 
                  defaultValue={props.globalNames[game.id] || game.title}
                  onBlur={(e) => props.updateGlobalGameName(game.id, e.target.value)}
                  className="w-full bg-transparent border-b border-transparent focus:border-teal-500 text-sm font-black text-gray-900 uppercase tracking-tight outline-none"
                  placeholder="Game Name"
                />
                <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase">ID: {game.id}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">Game URL (External)</label>
                <input 
                  defaultValue={props.globalUrls[game.id] || ''}
                  onBlur={(e) => props.updateGlobalGameUrl(game.id, e.target.value)}
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-xs font-bold text-gray-600 focus:outline-none focus:border-teal-500"
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">Win Logic Config</label>
                <input 
                  defaultValue={props.globalOptions[game.id] || ''}
                  onBlur={(e) => props.updateGlobalGameOption(game.id, e.target.value)}
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-xs font-bold text-gray-600 focus:outline-none focus:border-teal-500"
                  placeholder="e.g. rate:85;max_mult:100"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-amber-50 border border-amber-200 p-6 rounded-[32px] flex flex-col md:flex-row items-center gap-6">
         <div className="w-12 h-12 bg-amber-400 rounded-2xl flex items-center justify-center text-white shrink-0">
            <Shield size={24} />
         </div>
         <div>
            <h4 className="text-sm font-black text-amber-900 uppercase tracking-tight">Advanced Provider Simulation</h4>
            <p className="text-xs font-bold text-amber-700/70 mt-1">Changes made here are global and affect all users instantly. Use responsibly to manage game risk and RTP (Return to Player) rates.</p>
         </div>
      </div>
    </div>
  );
}

function GlobalSettings(props: AdminPanelViewProps) {
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateDoc(doc(db, 'metadata', 'settings'), {
        casinoName: props.casinoName,
        noticeText: props.noticeText,
        minDeposit: props.minDeposit,
        minWithdraw: props.minWithdraw,
        welcomeBonus: props.welcomeBonus,
        telegramLink: props.telegramLink,
        updatedAt: serverTimestamp()
      });
      props.showToast('Global settings updated!', 'success');
    } catch (err) {
      console.error("Save settings error:", err);
      props.showToast('Save failed', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white p-10 rounded-[48px] border border-gray-100 shadow-sm max-w-4xl mx-auto space-y-10">
      <div className="flex items-center justify-between">
         <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Platform Configuration</h2>
         <button 
           onClick={handleSave}
           disabled={isSaving}
           className="bg-gray-900 hover:bg-black text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-gray-900/20 transition-all flex items-center gap-3"
         >
           {isSaving ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
           Commit Changes
         </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <div className="space-y-6">
          <h3 className="text-[10px] font-black text-teal-600 uppercase tracking-[0.2em] border-b border-teal-100 pb-2">Branding & UI</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2 ml-1">Platform Name</label>
              <input 
                value={props.casinoName}
                onChange={(e) => props.updateCasinoName(e.target.value)}
                className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-sm font-bold text-gray-700 focus:outline-none focus:border-teal-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2 ml-1">Global Notice (Bengali)</label>
              <textarea 
                value={props.noticeText}
                onChange={(e) => props.setNoticeText(e.target.value)}
                rows={4}
                className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-sm font-bold text-gray-700 focus:outline-none focus:border-teal-500 resize-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2 ml-1">Official WhatsApp</label>
              <input 
                value={process.env.WHATSAPP_LINK || ''}
                readOnly
                className="w-full bg-gray-100 border border-gray-200 rounded-2xl px-5 py-4 text-sm font-bold text-gray-400 focus:outline-none cursor-not-allowed"
                placeholder="Managed in App config"
              />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <h3 className="text-[10px] font-black text-rose-600 uppercase tracking-[0.2em] border-b border-rose-100 pb-2">Economy & Finance</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2 ml-1">Min Deposit</label>
              <input 
                type="number"
                value={props.minDeposit}
                onChange={(e) => props.setMinDeposit(Number(e.target.value))}
                className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-sm font-bold text-gray-700 focus:outline-none focus:border-teal-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2 ml-1">Min Withdraw</label>
              <input 
                type="number"
                value={props.minWithdraw}
                onChange={(e) => props.setMinWithdraw(Number(e.target.value))}
                className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-sm font-bold text-gray-700 focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2 ml-1">Welcome Bonus (TK)</label>
              <input 
                type="number"
                value={props.welcomeBonus}
                onChange={(e) => props.setWelcomeBonus(Number(e.target.value))}
                className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-sm font-bold text-gray-700 focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>
        </div>

        <div className="space-y-6">
           <h3 className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] border-b border-blue-100 pb-2">Communications</h3>
           <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2 ml-1">Telegram Official URL</label>
              <div className="relative">
                <MessageSquare className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
                <input 
                  value={props.telegramLink}
                  onChange={(e) => props.setTelegramLink(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-12 py-4 text-sm font-bold text-gray-700 focus:outline-none focus:border-teal-500"
                  placeholder="https://t.me/..."
                />
              </div>
            </div>
        </div>

        <div className="space-y-6">
           <h3 className="text-[10px] font-black text-amber-600 uppercase tracking-[0.2em] border-b border-amber-100 pb-2">Payment Gateways</h3>
           <div className="space-y-4">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
               <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2 ml-1">Nagad Number</label>
                  <input 
                    value={props.globalImages['payment_number_nagad'] || ''}
                    onChange={(e) => props.updateGlobalImage('payment_number_nagad', e.target.value)}
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-sm font-bold text-gray-700 focus:outline-none focus:border-teal-500"
                    placeholder="017xxxxxxxx"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2 ml-1">Bkash Number</label>
                  <input 
                    value={props.globalImages['payment_number_bkash'] || ''}
                    onChange={(e) => props.updateGlobalImage('payment_number_bkash', e.target.value)}
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-sm font-bold text-gray-700 focus:outline-none focus:border-teal-500"
                    placeholder="018xxxxxxxx"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2 ml-1">Rocket Number</label>
                  <input 
                    value={props.globalImages['payment_number_rocket'] || ''}
                    onChange={(e) => props.updateGlobalImage('payment_number_rocket', e.target.value)}
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-sm font-bold text-gray-700 focus:outline-none focus:border-teal-500"
                    placeholder="019xxxxxxxx"
                  />
                </div>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
               <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2 ml-1">UPI ID</label>
                  <input 
                    value={props.globalImages['payment_number_upi'] || ''}
                    onChange={(e) => props.updateGlobalImage('payment_number_upi', e.target.value)}
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-sm font-bold text-gray-700 focus:outline-none focus:border-teal-500"
                    placeholder="upi@example"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2 ml-1">PayTM Number</label>
                  <input 
                    value={props.globalImages['payment_number_paytm'] || ''}
                    onChange={(e) => props.updateGlobalImage('payment_number_paytm', e.target.value)}
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-sm font-bold text-gray-700 focus:outline-none focus:border-teal-500"
                    placeholder="Enter PayTM Number"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2 ml-1">Google Pay</label>
                  <input 
                    value={props.globalImages['payment_number_googlepay'] || ''}
                    onChange={(e) => props.updateGlobalImage('payment_number_googlepay', e.target.value)}
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-sm font-bold text-gray-700 focus:outline-none focus:border-teal-500"
                    placeholder="Enter Google Pay info"
                  />
                </div>
             </div>
             <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2 ml-1">Bank Transfer Info</label>
                <textarea 
                  value={props.globalImages['payment_number_bank'] || ''}
                  onChange={(e) => props.updateGlobalImage('payment_number_bank', e.target.value)}
                  rows={3}
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-sm font-bold text-gray-700 focus:outline-none focus:border-teal-500 resize-none"
                  placeholder="Acc: 123456789, IFSC: SBIN000123"
                />
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
