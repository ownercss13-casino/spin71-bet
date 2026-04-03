import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Users, DollarSign, Activity, Settings, CreditCard, 
  ShieldAlert, Search, Edit, Trash2, CheckCircle, XCircle, 
  Gamepad2, Bell, BarChart3, Gift, Briefcase, TrendingUp, 
  ShieldCheck, Lock, Unlock, Eye, Download, Filter, ChevronDown, UserCog
} from 'lucide-react';
import { db } from '../firebase';
import { ToastType } from './Toast';
import { collection, getDocs, doc, updateDoc, onSnapshot, query, orderBy, collectionGroup, getDoc, runTransaction, setDoc } from 'firebase/firestore';

export default function AdminPanel({ onBack, showToast }: { onBack: () => void, showToast: (msg: string, type?: ToastType) => void }) {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'games' | 'transactions' | 'security' | 'reports' | 'promotions' | 'agents' | 'settings'>('dashboard');

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: Activity },
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'games', label: 'Game Management', icon: Gamepad2 },
    { id: 'transactions', label: 'Transactions', icon: CreditCard },
    { id: 'security', label: 'Security & Fraud', icon: ShieldAlert },
    { id: 'reports', label: 'Reports & Analytics', icon: BarChart3 },
    { id: 'promotions', label: 'Bonuses & Promos', icon: Gift },
    { id: 'agents', label: 'Agent Management', icon: Briefcase },
    { id: 'settings', label: 'Site Settings', icon: Settings },
  ];

  return (
    <div className="bg-[#0b1120] p-4 md:p-6 rounded-3xl w-full max-w-7xl mx-auto text-white min-h-[85vh] flex flex-col md:flex-row gap-6 border border-teal-900/50 shadow-2xl relative overflow-hidden">
      {/* Sidebar */}
      <div className="w-full md:w-72 flex flex-col gap-2 shrink-0 z-20">
        <div className="flex items-center gap-3 mb-8 px-2">
          <button 
            onClick={onBack} 
            className="p-3 bg-gradient-to-br from-teal-800 to-teal-950 hover:from-teal-700 hover:to-teal-900 rounded-2xl transition-all shadow-lg border border-teal-700/50 group"
          >
            <ArrowLeft size={24} className="text-teal-400 group-hover:-translate-x-1 transition-transform" />
          </button>
          <div>
            <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-yellow-200 to-yellow-600 uppercase tracking-tighter italic">VIP Admin</h2>
            <p className="text-[10px] text-teal-500 font-mono tracking-[0.2em]">SUPERUSER ACCESS</p>
          </div>
        </div>

        <div className="space-y-2 overflow-y-auto pr-2 custom-scrollbar flex-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-black transition-all duration-300 group ${
                  isActive 
                    ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-black shadow-[0_10px_20px_rgba(234,179,8,0.3)] scale-[1.02]' 
                    : 'text-teal-400/70 hover:bg-teal-900/40 hover:text-teal-200'
                }`}
              >
                <div className={`p-2 rounded-xl transition-colors ${isActive ? 'bg-black/20' : 'bg-teal-950/50 group-hover:bg-teal-900'}`}>
                  <Icon size={20} className={isActive ? 'text-black' : 'text-teal-500'} /> 
                </div>
                <span className="text-sm tracking-tight">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 bg-[#0d1525]/80 backdrop-blur-xl rounded-[2.5rem] p-4 md:p-8 border border-teal-900/30 overflow-y-auto shadow-2xl relative z-10">
        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-teal-900/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-yellow-900/5 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="relative z-10">
          {activeTab === 'dashboard' && <DashboardTab />}
          {activeTab === 'users' && <UsersTab showToast={showToast} />}
          {activeTab === 'games' && <GamesTab />}
          {activeTab === 'transactions' && <TransactionsTab showToast={showToast} />}
          {activeTab === 'security' && <SecurityTab />}
          {activeTab === 'reports' && <ReportsTab />}
          {activeTab === 'promotions' && <PromotionsTab />}
          {activeTab === 'agents' && <AgentsTab />}
          {activeTab === 'settings' && <SettingsTab showToast={showToast} />}
        </div>
      </div>
    </div>
  );
}

// --- TABS ---

function DashboardTab() {
  const [stats, setStats] = useState({ users: 0, deposits: 0, withdrawals: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const usersCount = usersSnapshot.size;

        const txSnapshot = await getDocs(collectionGroup(db, 'transactions'));
        let totalDep = 0;
        let totalWith = 0;
        txSnapshot.forEach(doc => {
          const data = doc.data();
          if (data.status === 'approved') {
            const amount = parseFloat(data.amount?.toString().replace(/[^0-9.-]+/g,"") || "0");
            if (data.type === 'deposit') totalDep += amount;
            if (data.type === 'withdraw') totalWith += amount;
          }
        });

        setStats({ users: usersCount, deposits: totalDep, withdrawals: totalWith });
      } catch (error) {
        console.error("Error fetching stats:", error);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h3 className="text-3xl font-black text-white mb-1">Overview</h3>
          <p className="text-teal-500 text-sm">Real-time platform statistics</p>
        </div>
        <div className="flex items-center gap-2 bg-teal-900/30 px-4 py-2 rounded-lg border border-teal-800/50">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          <span className="text-xs font-bold text-teal-300">LIVE</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Users" value={stats.users.toLocaleString()} icon={<Users size={24} className="text-blue-400" />} trend="+12%" />
        <StatCard title="Online Now" value={Math.floor(stats.users * 0.15).toString()} icon={<Activity size={24} className="text-green-400" />} trend="+5%" />
        <StatCard title="Total Deposits" value={`৳ ${stats.deposits.toLocaleString()}`} icon={<DollarSign size={24} className="text-yellow-400" />} trend="+18%" />
        <StatCard title="Total Withdrawals" value={`৳ ${stats.withdrawals.toLocaleString()}`} icon={<CreditCard size={24} className="text-orange-400" />} trend="+8%" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#111a2e] p-6 rounded-2xl border border-teal-800/30 shadow-lg">
          <h4 className="text-lg font-bold text-teal-400 mb-4 flex items-center gap-2">
            <Gamepad2 size={18} /> Live Game Status
          </h4>
          <div className="space-y-4">
            <LiveGameRow name="Aviator" players={450} pool="৳ 125,000" status="Running" />
            <LiveGameRow name="Crazy Time" players={320} pool="৳ 85,000" status="Running" />
            <LiveGameRow name="Sweet Bonanza" players={210} pool="৳ 45,000" status="Running" />
            <LiveGameRow name="Roulette" players={150} pool="৳ 65,000" status="Running" />
          </div>
        </div>

        <div className="bg-[#111a2e] p-6 rounded-2xl border border-teal-800/30 shadow-lg">
          <h4 className="text-lg font-bold text-teal-400 mb-4 flex items-center gap-2">
            <Activity size={18} /> Recent Activity
          </h4>
          <div className="space-y-4">
            <ActivityRow user="84729101" action="deposited" amount="৳5,000" time="2 mins ago" type="deposit" />
            <ActivityRow user="84729102" action="withdrew" amount="৳12,000" time="5 mins ago" type="withdraw" />
            <ActivityRow user="84729103" action="won in Aviator" amount="৳45,000" time="12 mins ago" type="win" />
            <ActivityRow user="84729104" action="registered" amount="" time="15 mins ago" type="register" />
          </div>
        </div>
      </div>
    </div>
  );
}

function UsersTab({ showToast }: { showToast: (msg: string, type?: ToastType) => void }) {
  const [users, setUsers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editField, setEditField] = useState<'balance' | 'username' | 'phone' | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [isUpdatingRole, setIsUpdatingRole] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'users'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsers(usersData);
    });
    return () => unsubscribe();
  }, []);

  const handleUpdateUser = async (userId: string) => {
    if (!editField) return;
    try {
      let value: any = editValue;
      if (editField === 'balance') {
        value = parseFloat(editValue);
        if (isNaN(value)) return;
      }
      
      await updateDoc(doc(db, 'users', userId), { [editField]: value });
      showToast(`${editField.charAt(0).toUpperCase() + editField.slice(1)} updated successfully!`, "success");
      setEditingUserId(null);
      setEditField(null);
    } catch (error) {
      console.error("Error updating user:", error);
      showToast("Update failed.", "error");
    }
  };

  const handleToggleStatus = async (userId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'blocked' ? 'active' : 'blocked';
      await updateDoc(doc(db, 'users', userId), { status: newStatus });
      showToast(`User status updated to ${newStatus}.`, "success");
    } catch (error) {
      console.error("Error updating status:", error);
      showToast("Status update failed.", "error");
    }
  };

  const handleUpdateRole = async (userId: string, newRole: string) => {
    setIsUpdatingRole(userId);
    try {
      await updateDoc(doc(db, 'users', userId), { role: newRole });
      showToast(`User role updated to ${newRole}.`, "success");
    } catch (error) {
      console.error("Error updating role:", error);
      showToast("Role update failed.", "error");
    } finally {
      setIsUpdatingRole(null);
    }
  };

  const filteredUsers = users.filter(u => 
    u.id.includes(searchQuery) || 
    (u.username && u.username.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (u.email && u.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (u.phone && u.phone.includes(searchQuery))
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <h3 className="text-3xl font-black text-white tracking-tight">User Management</h3>
          <p className="text-teal-500 text-sm font-medium">Manage players, balances, and permissions</p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-80">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-teal-600" />
            <input 
              type="text" 
              placeholder="Search by ID, Name, Email, Phone..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-teal-950/50 border border-teal-800/50 rounded-2xl pl-12 pr-4 py-3.5 text-sm text-white focus:outline-none focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/20 transition-all backdrop-blur-sm shadow-inner"
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {filteredUsers.map((user) => (
          <div 
            key={user.id} 
            className="group bg-gradient-to-r from-[#111a2e] to-[#0d1525] rounded-[2rem] border border-teal-800/20 p-6 hover:border-teal-600/40 transition-all duration-500 shadow-xl relative overflow-hidden"
          >
            {/* Background Glow */}
            <div className="absolute -right-20 -top-20 w-40 h-40 bg-teal-500/5 rounded-full blur-3xl group-hover:bg-teal-500/10 transition-colors"></div>
            
            <div className="flex flex-col lg:flex-row lg:items-center gap-8 relative z-10">
              {/* User Identity Section */}
              <div className="flex items-center gap-5 min-w-[250px]">
                <div className="relative">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-800 to-teal-950 flex items-center justify-center font-black text-xl text-yellow-500 border border-teal-700/50 shadow-lg">
                    {user.username ? user.username.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-[#111a2e] ${user.status === 'blocked' ? 'bg-red-500' : 'bg-green-500'}`}></div>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    {editingUserId === user.id && editField === 'username' ? (
                      <div className="flex items-center gap-2">
                        <input 
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="bg-teal-950 border border-teal-700 rounded-lg px-2 py-1 text-sm text-white w-32"
                        />
                        <button onClick={() => handleUpdateUser(user.id)} className="text-green-400"><CheckCircle size={16} /></button>
                        <button onClick={() => setEditingUserId(null)} className="text-red-400"><XCircle size={16} /></button>
                      </div>
                    ) : (
                      <>
                        <h4 className="font-black text-lg text-white tracking-tight">{user.username || 'Unknown'}</h4>
                        <button onClick={() => { setEditingUserId(user.id); setEditField('username'); setEditValue(user.username || ''); }} className="text-teal-600 hover:text-teal-400 transition-colors">
                          <Edit size={14} />
                        </button>
                      </>
                    )}
                  </div>
                  <p className="text-xs text-teal-500 font-mono">ID: {user.id}</p>
                  <p className="text-xs text-teal-600 mt-1">{user.email}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {editingUserId === user.id && editField === 'phone' ? (
                      <div className="flex items-center gap-2">
                        <input 
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="bg-teal-950 border border-teal-700 rounded-lg px-2 py-1 text-xs text-white w-32"
                        />
                        <button onClick={() => handleUpdateUser(user.id)} className="text-green-400"><CheckCircle size={14} /></button>
                      </div>
                    ) : (
                      <>
                        <p className="text-xs text-teal-400">{user.phone || 'No Phone'}</p>
                        <button onClick={() => { setEditingUserId(user.id); setEditField('phone'); setEditValue(user.phone || ''); }} className="text-teal-700 hover:text-teal-500 transition-colors">
                          <Edit size={12} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Stats & Role Section */}
              <div className="flex-1 grid grid-cols-2 md:grid-cols-3 gap-6">
                {/* Balance Check */}
                <div className="bg-black/20 rounded-2xl p-4 border border-white/5 flex flex-col justify-center">
                  <p className="text-[10px] text-teal-500 font-bold uppercase tracking-widest mb-1">Current Balance</p>
                  <div className="flex items-center gap-3">
                    {editingUserId === user.id && editField === 'balance' ? (
                      <div className="flex items-center gap-2">
                        <input 
                          type="number" 
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="bg-teal-950 border border-teal-700 rounded-lg px-2 py-1 text-sm text-white w-24"
                        />
                        <button onClick={() => handleUpdateUser(user.id)} className="text-green-400"><CheckCircle size={18} /></button>
                      </div>
                    ) : (
                      <>
                        <span className="text-2xl font-black text-yellow-500 tracking-tighter">৳ {(user.balance || 0).toLocaleString()}</span>
                        <button onClick={() => { setEditingUserId(user.id); setEditField('balance'); setEditValue(user.balance?.toString() || '0'); }} className="p-1.5 bg-yellow-500/10 rounded-lg hover:bg-yellow-500/20 text-yellow-500 transition-colors">
                          <Edit size={14} />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Role Selector */}
                <div className="flex flex-col justify-center">
                  <p className="text-[10px] text-teal-500 font-bold uppercase tracking-widest mb-2">User Privilege</p>
                  <div className="relative">
                    <select 
                      value={user.role || 'user'}
                      disabled={isUpdatingRole === user.id}
                      onChange={(e) => handleUpdateRole(user.id, e.target.value)}
                      className={`w-full bg-teal-950/50 border border-teal-800 rounded-xl px-4 py-2.5 text-sm font-bold appearance-none cursor-pointer transition-all focus:border-yellow-500/50 ${
                        user.role === 'admin' ? 'text-red-500' : 
                        user.role === 'agent' ? 'text-yellow-500' : 'text-teal-200'
                      }`}
                    >
                      <option value="user">Standard User</option>
                      <option value="agent">VIP Agent</option>
                      <option value="admin">Super Admin</option>
                    </select>
                    <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-teal-600 pointer-events-none" />
                  </div>
                </div>

                {/* Status Toggle */}
                <div className="flex flex-col justify-center col-span-2 md:col-span-1">
                  <p className="text-[10px] text-teal-500 font-bold uppercase tracking-widest mb-2">Account Status</p>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-black px-3 py-1.5 rounded-lg ${user.status === 'blocked' ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'}`}>
                      {user.status === 'blocked' ? 'RESTRICTED' : 'ACTIVE'}
                    </span>
                    <button 
                      onClick={() => handleToggleStatus(user.id, user.status || 'active')}
                      className={`p-2.5 rounded-xl transition-all ${user.status === 'blocked' ? 'bg-green-500/10 text-green-500 hover:bg-green-500/20' : 'bg-red-500/10 text-red-500 hover:bg-red-500/20'}`}
                    >
                      {user.status === 'blocked' ? <Unlock size={18} /> : <Lock size={18} />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex lg:flex-col gap-2">
                <button className="p-3 bg-teal-900/30 text-teal-400 rounded-2xl hover:bg-teal-800/50 hover:text-white transition-all" title="View Logs">
                  <Eye size={20} />
                </button>
                <button className="p-3 bg-teal-900/30 text-teal-400 rounded-2xl hover:bg-teal-800/50 hover:text-white transition-all" title="User Settings">
                  <UserCog size={20} />
                </button>
              </div>
            </div>
          </div>
        ))}

        {filteredUsers.length === 0 && (
          <div className="py-20 text-center bg-[#111a2e] rounded-[2rem] border border-dashed border-teal-800/50">
            <Users size={48} className="mx-auto text-teal-800 mb-4" />
            <p className="text-teal-500 font-bold">No players found matching your search.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function GamesTab() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h3 className="text-2xl font-black text-white">Game Management</h3>
        <p className="text-teal-500 text-sm">Control RTP, bet limits, and game availability</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#111a2e] p-6 rounded-2xl border border-teal-800/30 shadow-lg space-y-6">
          <h4 className="text-lg font-bold text-yellow-400 border-b border-teal-800/50 pb-2">RTP & Algorithm Control</h4>
          
          <div className="space-y-5">
            <RTPControl name="Global Slots RTP" defaultValue={95} />
            <RTPControl name="Aviator Crash Probability" defaultValue={92} label="Win Rate %" />
            <RTPControl name="Live Casino Edge" defaultValue={4} label="House Edge %" max={10} />
          </div>
          <button className="w-full py-3 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 text-white font-bold rounded-xl transition-all shadow-lg">
            Apply Algorithm Changes
          </button>
        </div>

        <div className="bg-[#111a2e] p-6 rounded-2xl border border-teal-800/30 shadow-lg space-y-6">
          <h4 className="text-lg font-bold text-yellow-400 border-b border-teal-800/50 pb-2">Bet Limits & Status</h4>
          
          <div className="space-y-4">
            <GameSettingRow name="Aviator" min="10" max="100,000" active={true} />
            <GameSettingRow name="Crazy Time" min="20" max="50,000" active={true} />
            <GameSettingRow name="Sweet Bonanza" min="5" max="10,000" active={true} />
            <GameSettingRow name="Baccarat" min="100" max="500,000" active={false} />
          </div>
        </div>
      </div>
    </div>
  );
}

function TransactionsTab({ showToast }: { showToast: (msg: string, type?: ToastType) => void }) {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [filter, setFilter] = useState<'pending' | 'all'>('pending');

  useEffect(() => {
    // Fetch all transactions across all users
    const q = query(collectionGroup(db, 'transactions'), orderBy('date', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const txData = snapshot.docs.map(doc => ({
        id: doc.id,
        ref: doc.ref,
        ...doc.data()
      }));
      setTransactions(txData);
    });
    return () => unsubscribe();
  }, []);

  const handleUpdateStatus = async (txRef: any, newStatus: string, txData: any) => {
    try {
      const userId = txRef.parent.parent?.id;
      if (!userId) {
        showToast("এই লেনদেনের জন্য ইউজার আইডি পাওয়া যায়নি।", "error");
        return;
      }

      await runTransaction(db, async (transaction) => {
        const userRef = doc(db, 'users', userId);
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists()) {
          throw new Error("User does not exist!");
        }

        const currentBalance = userDoc.data().balance || 0;
        const amount = parseFloat(txData.amount?.toString().replace(/[^0-9.-]+/g,"") || "0");

        if (newStatus === 'approved' && txData.type === 'deposit') {
          transaction.update(userRef, { balance: currentBalance + amount });
        } else if (newStatus === 'rejected' && txData.type === 'withdraw') {
          // Refund the balance if withdrawal is rejected
          transaction.update(userRef, { balance: currentBalance + amount });
        }

        transaction.update(txRef, { status: newStatus });
      });

      showToast(`লেনদেন ${newStatus} সফল হয়েছে।`, "success");
    } catch (error) {
      console.error("Error updating transaction:", error);
      showToast("লেনদেন আপডেট ব্যর্থ হয়েছে।", "error");
    }
  };

  const displayTx = filter === 'pending' ? transactions.filter(t => t.status === 'pending') : transactions;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h3 className="text-2xl font-black text-white">Payment & Transactions</h3>
        <p className="text-teal-500 text-sm">Manage deposits, withdrawals, and gateways</p>
      </div>

      <div className="flex gap-4 border-b border-teal-800/50 pb-px">
        <button 
          onClick={() => setFilter('pending')}
          className={`px-4 py-2 text-sm font-bold ${filter === 'pending' ? 'text-yellow-400 border-b-2 border-yellow-400' : 'text-teal-500 hover:text-teal-300'}`}
        >
          Pending Requests
        </button>
        <button 
          onClick={() => setFilter('all')}
          className={`px-4 py-2 text-sm font-bold ${filter === 'all' ? 'text-yellow-400 border-b-2 border-yellow-400' : 'text-teal-500 hover:text-teal-300'}`}
        >
          Transaction History
        </button>
      </div>
      
      <div className="space-y-4">
        {displayTx.map((tx) => (
          <div key={tx.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-5 bg-[#111a2e] rounded-2xl border border-teal-800/30 shadow-lg gap-4 hover:border-teal-700/50 transition-colors">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${tx.type === 'withdraw' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' : 'bg-green-500/10 text-green-400 border border-green-500/20'}`}>
                <CreditCard size={24} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-white font-bold text-lg capitalize">{tx.type}</p>
                  <span className={`px-2 py-0.5 text-[10px] uppercase font-bold rounded ${tx.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' : tx.status === 'approved' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                    {tx.status}
                  </span>
                </div>
                <p className="text-sm text-teal-400">
                  User: <span className="text-white font-mono">{tx.ref?.parent?.parent?.id || 'Unknown'}</span> • 
                  Method: <span className="uppercase text-teal-300">{tx.method || 'N/A'}</span>
                </p>
                {tx.trxId && <p className="text-xs text-teal-500">TrxID: {tx.trxId}</p>}
                {tx.number && <p className="text-xs text-teal-500">Number: {tx.number}</p>}
              </div>
            </div>
            <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto">
              <div className="text-right">
                <span className="text-2xl font-black text-yellow-400">{tx.amount}</span>
                <p className="text-xs text-teal-500">
                  {tx.date?.toDate ? tx.date.toDate().toLocaleString() : tx.date}
                </p>
              </div>
              {tx.status === 'pending' && (
                <div className="flex gap-2">
                  <button onClick={() => handleUpdateStatus(tx.ref, 'approved', tx)} className="p-3 bg-green-500/10 text-green-400 rounded-xl hover:bg-green-500/20 hover:scale-105 transition-all" title="Approve">
                    <CheckCircle size={20} />
                  </button>
                  <button onClick={() => handleUpdateStatus(tx.ref, 'rejected', tx)} className="p-3 bg-red-500/10 text-red-400 rounded-xl hover:bg-red-500/20 hover:scale-105 transition-all" title="Reject">
                    <XCircle size={20} />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
        {displayTx.length === 0 && (
          <div className="p-8 text-center text-teal-500 bg-[#111a2e] rounded-2xl border border-teal-800/30">
            No transactions found.
          </div>
        )}
      </div>
    </div>
  );
}

function SecurityTab() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h3 className="text-2xl font-black text-white">Security & Fraud Detection</h3>
        <p className="text-teal-500 text-sm">Monitor suspicious activities and configure anti-bot systems</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#111a2e] p-6 rounded-2xl border border-red-900/30 shadow-lg space-y-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full blur-2xl"></div>
          <h4 className="text-lg font-bold text-red-400 flex items-center gap-2">
            <ShieldAlert size={20} /> Suspicious Activity Alerts
          </h4>
          
          <div className="space-y-3">
            <AlertRow type="Multiple Accounts" desc="3 accounts created from IP 192.168.1.45" severity="high" />
            <AlertRow type="Bot Behavior" desc="Unusual betting pattern detected on User 84729102" severity="medium" />
            <AlertRow type="VPN Detected" desc="User 84729105 logged in from known VPN node" severity="low" />
          </div>
        </div>

        <div className="bg-[#111a2e] p-6 rounded-2xl border border-teal-800/30 shadow-lg space-y-6">
          <h4 className="text-lg font-bold text-teal-400 flex items-center gap-2">
            <Settings size={20} /> Security Settings
          </h4>
          
          <div className="space-y-4">
            <ToggleSetting title="Strict IP Blocking" desc="Automatically block IPs with >3 accounts" defaultChecked={true} />
            <ToggleSetting title="Anti-Bot Captcha" desc="Require captcha for suspicious logins" defaultChecked={true} />
            <ToggleSetting title="VPN/Proxy Blocker" desc="Deny access from known VPNs" defaultChecked={false} />
            <ToggleSetting title="Manual Withdrawal Review" desc="Flag withdrawals over ৳50,000" defaultChecked={true} />
          </div>
        </div>
      </div>
    </div>
  );
}

function ReportsTab() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-2xl font-black text-white">Reports & Analytics</h3>
          <p className="text-teal-500 text-sm">Financial reports and player statistics</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-teal-900/50 text-teal-300 rounded-lg hover:bg-teal-800 transition-colors text-sm font-bold">
          <Download size={16} /> Export CSV
        </button>
      </div>

      <div className="bg-[#111a2e] p-6 rounded-2xl border border-teal-800/30 shadow-lg h-64 flex items-center justify-center">
        <div className="text-center">
          <BarChart3 size={48} className="text-teal-800 mx-auto mb-4" />
          <p className="text-teal-500">Interactive Chart Component Placeholder</p>
          <p className="text-xs text-teal-600 mt-2">Shows Daily Deposits vs Withdrawals</p>
        </div>
      </div>

      <div className="bg-[#111a2e] rounded-2xl border border-teal-800/30 overflow-hidden shadow-lg">
        <div className="p-4 border-b border-teal-800/50 bg-teal-950/30">
          <h4 className="font-bold text-yellow-400">Top Players (This Week)</h4>
        </div>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="text-teal-500 text-xs uppercase tracking-wider">
              <th className="p-4 font-bold">Rank</th>
              <th className="p-4 font-bold">User</th>
              <th className="p-4 font-bold">Total Wagered</th>
              <th className="p-4 font-bold">Net Profit</th>
            </tr>
          </thead>
          <tbody className="text-sm divide-y divide-teal-900/30">
            {[1, 2, 3].map((i) => (
              <tr key={i} className="hover:bg-teal-900/20 transition-colors">
                <td className="p-4">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${i === 1 ? 'bg-yellow-500 text-black' : i === 2 ? 'bg-gray-300 text-black' : 'bg-orange-400 text-black'}`}>
                    {i}
                  </div>
                </td>
                <td className="p-4 font-bold text-white">Player_Pro_{i}</td>
                <td className="p-4 text-teal-300 font-mono">৳ {(1000000 / i).toFixed(2)}</td>
                <td className="p-4 text-green-400 font-mono font-bold">+৳ {(250000 / i).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PromotionsTab() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h3 className="text-2xl font-black text-white">Bonuses & Promotions</h3>
        <p className="text-teal-500 text-sm">Manage promo codes and referral commissions</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#111a2e] p-6 rounded-2xl border border-teal-800/30 shadow-lg space-y-4">
          <h4 className="text-lg font-bold text-yellow-400 border-b border-teal-800/50 pb-2">Generate Promo Code</h4>
          
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-teal-400 mb-1">Code Name</label>
              <input type="text" placeholder="e.g. WELCOME2026" className="w-full bg-teal-950 border border-teal-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-yellow-500" />
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-xs font-bold text-teal-400 mb-1">Bonus Amount (৳)</label>
                <input type="number" placeholder="500" className="w-full bg-teal-950 border border-teal-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-yellow-500" />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-bold text-teal-400 mb-1">Usage Limit</label>
                <input type="number" placeholder="100" className="w-full bg-teal-950 border border-teal-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-yellow-500" />
              </div>
            </div>
            <button className="w-full py-2.5 mt-2 bg-yellow-500 hover:bg-yellow-400 text-black font-black rounded-xl transition-colors">
              Create Code
            </button>
          </div>
        </div>

        <div className="bg-[#111a2e] p-6 rounded-2xl border border-teal-800/30 shadow-lg space-y-4">
          <h4 className="text-lg font-bold text-yellow-400 border-b border-teal-800/50 pb-2">Referral System</h4>
          
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-teal-400 mb-1">Direct Referral Bonus (৳)</label>
              <input type="number" defaultValue={100} className="w-full bg-teal-950 border border-teal-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-yellow-500" />
            </div>
            <div>
              <label className="block text-xs font-bold text-teal-400 mb-1">Deposit Commission (%)</label>
              <input type="number" defaultValue={5} className="w-full bg-teal-950 border border-teal-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-yellow-500" />
            </div>
            <button className="w-full py-2.5 mt-2 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl transition-colors">
              Update Commission Rates
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AgentsTab() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-2xl font-black text-white">Agent Management</h3>
          <p className="text-teal-500 text-sm">Manage sub-admins and agent limits</p>
        </div>
        <button className="px-4 py-2 bg-yellow-500 text-black font-bold rounded-lg hover:bg-yellow-400 transition-colors text-sm">
          + Add New Agent
        </button>
      </div>

      <div className="bg-[#111a2e] rounded-2xl border border-teal-800/30 overflow-hidden shadow-lg">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-teal-950/50 text-teal-400 text-xs uppercase tracking-wider">
              <th className="p-4 font-bold">Agent Name</th>
              <th className="p-4 font-bold">Users Under</th>
              <th className="p-4 font-bold">Credit Limit</th>
              <th className="p-4 font-bold">Commission</th>
              <th className="p-4 font-bold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="text-sm divide-y divide-teal-900/30">
            {[1, 2].map((i) => (
              <tr key={i} className="hover:bg-teal-900/20 transition-colors">
                <td className="p-4 font-bold text-white">Agent_Master_{i}</td>
                <td className="p-4 text-teal-300">{i * 150}</td>
                <td className="p-4 text-yellow-400 font-mono">৳ {(500000 * i).toLocaleString()}</td>
                <td className="p-4 text-green-400">35%</td>
                <td className="p-4 flex justify-end gap-2">
                  <button className="p-2 bg-teal-900/50 text-teal-300 rounded hover:bg-teal-800 transition-colors">Manage</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SettingsTab({ showToast }: { showToast: (msg: string, type?: ToastType) => void }) {
  const [settings, setSettings] = useState({
    maintenanceMode: false,
    minDeposit: 200,
    minWithdraw: 200
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docRef = doc(db, 'metadata', 'settings');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setSettings(docSnap.data() as any);
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await setDoc(doc(db, 'metadata', 'settings'), settings);
      showToast("Settings saved successfully!", "success");
    } catch (error) {
      console.error("Error saving settings:", error);
      showToast("Failed to save settings.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h3 className="text-2xl font-black text-white">Site Settings</h3>
        <p className="text-teal-500 text-sm">Global configuration</p>
      </div>
      
      <div className="space-y-4 max-w-lg">
        <div className="bg-[#111a2e] p-5 rounded-2xl border border-teal-800/30 shadow-lg">
          <ToggleSetting 
            title="Maintenance Mode" 
            desc="Disable access to the site for all users" 
            checked={settings.maintenanceMode} 
            onChange={(checked) => setSettings({ ...settings, maintenanceMode: checked })}
          />
        </div>

        <div className="bg-[#111a2e] p-5 rounded-2xl border border-teal-800/30 shadow-lg space-y-4">
          <div>
            <label className="block mb-2 text-sm font-bold text-teal-400">Minimum Deposit Amount (৳)</label>
            <input 
              type="number" 
              value={settings.minDeposit} 
              onChange={(e) => setSettings({ ...settings, minDeposit: Number(e.target.value) })}
              className="w-full bg-teal-950 border border-teal-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-yellow-500 transition-colors" 
            />
          </div>

          <div>
            <label className="block mb-2 text-sm font-bold text-teal-400">Minimum Withdrawal Amount (৳)</label>
            <input 
              type="number" 
              value={settings.minWithdraw} 
              onChange={(e) => setSettings({ ...settings, minWithdraw: Number(e.target.value) })}
              className="w-full bg-teal-950 border border-teal-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-yellow-500 transition-colors" 
            />
          </div>
        </div>

        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="w-full py-4 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-black font-black rounded-xl transition-all shadow-[0_0_20px_rgba(234,179,8,0.3)] hover:shadow-[0_0_30px_rgba(234,179,8,0.5)] disabled:opacity-50"
        >
          {isSaving ? 'Saving...' : 'Save All Settings'}
        </button>
      </div>
    </div>
  );
}

// --- HELPER COMPONENTS ---

function StatCard({ title, value, icon, trend }: { title: string, value: string, icon: React.ReactNode, trend: string }) {
  const isPositive = trend.startsWith('+');
  return (
    <div className="bg-[#111a2e] p-5 rounded-2xl border border-teal-800/30 flex flex-col relative overflow-hidden shadow-lg group hover:border-teal-600/50 transition-colors">
      <div className="absolute top-4 right-4">
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${isPositive ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
          {trend}
        </span>
      </div>
      <div className="mb-4 p-3 bg-[#0b1120] rounded-xl w-fit border border-teal-900/50 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <div>
        <h4 className="text-teal-500 text-xs font-bold uppercase tracking-wider mb-1">{title}</h4>
        <p className="text-2xl font-black text-white">{value}</p>
      </div>
    </div>
  );
}

function LiveGameRow({ name, players, pool, status }: { name: string, players: number, pool: string, status: string }) {
  return (
    <div className="flex items-center justify-between p-3 bg-[#0b1120] rounded-xl border border-teal-900/50">
      <div>
        <p className="font-bold text-white">{name}</p>
        <p className="text-xs text-teal-500">{players} players active</p>
      </div>
      <div className="text-right">
        <p className="font-mono font-bold text-yellow-400">{pool}</p>
        <p className="text-[10px] text-green-400 uppercase font-bold">{status}</p>
      </div>
    </div>
  );
}

function ActivityRow({ user, action, amount, time, type }: { user: string, action: string, amount: string, time: string, type: 'deposit' | 'withdraw' | 'win' | 'register' }) {
  const colors = {
    deposit: 'text-green-400',
    withdraw: 'text-orange-400',
    win: 'text-yellow-400',
    register: 'text-blue-400'
  };
  
  return (
    <div className="flex items-center gap-3 p-3 bg-[#0b1120] rounded-xl border border-teal-900/50">
      <div className="w-2 h-2 rounded-full bg-teal-500"></div>
      <div className="flex-1">
        <p className="text-sm text-teal-100">
          <span className="font-bold text-white">{user}</span> {action} <span className={`font-bold ${colors[type]}`}>{amount}</span>
        </p>
        <p className="text-xs text-teal-600">{time}</p>
      </div>
    </div>
  );
}

function RTPControl({ name, defaultValue, label = "RTP %", max = 99 }: { name: string, defaultValue: number, label?: string, max?: number }) {
  const [val, setVal] = useState(defaultValue);
  return (
    <div>
      <div className="flex justify-between text-sm mb-2">
        <span className="text-teal-300 font-bold">{name}</span>
        <span className="text-yellow-400 font-black bg-yellow-400/10 px-2 py-0.5 rounded">{val}% {label}</span>
      </div>
      <input 
        type="range" 
        min="1" 
        max={max} 
        value={val}
        onChange={(e) => setVal(Number(e.target.value))}
        className="w-full accent-yellow-500 h-2 bg-teal-950 rounded-lg appearance-none cursor-pointer" 
      />
    </div>
  );
}

function GameSettingRow({ name, min, max, active }: { name: string, min: string, max: string, active: boolean }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-[#0b1120] rounded-xl border border-teal-900/50 gap-4">
      <div className="flex items-center gap-3">
        <div className={`w-3 h-3 rounded-full ${active ? 'bg-green-500 shadow-[0_0_10px_#22c55e]' : 'bg-red-500'}`}></div>
        <span className="font-bold text-white">{name}</span>
      </div>
      <div className="flex gap-4 text-sm">
        <div className="bg-teal-950 px-3 py-1.5 rounded-lg border border-teal-800">
          <span className="text-teal-500 text-xs mr-2">Min:</span>
          <span className="text-white font-mono">৳{min}</span>
        </div>
        <div className="bg-teal-950 px-3 py-1.5 rounded-lg border border-teal-800">
          <span className="text-teal-500 text-xs mr-2">Max:</span>
          <span className="text-white font-mono">৳{max}</span>
        </div>
      </div>
    </div>
  );
}

function AlertRow({ type, desc, severity }: { type: string, desc: string, severity: 'high' | 'medium' | 'low' }) {
  const colors = {
    high: 'bg-red-500/10 text-red-400 border-red-500/30',
    medium: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
    low: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30'
  };
  
  return (
    <div className={`p-3 rounded-xl border ${colors[severity]} flex items-start gap-3`}>
      <ShieldAlert size={18} className="mt-0.5 shrink-0" />
      <div>
        <p className="font-bold text-sm">{type}</p>
        <p className="text-xs opacity-80 mt-0.5">{desc}</p>
      </div>
    </div>
  );
}

function ToggleSetting({ title, desc, checked, onChange, defaultChecked }: { title: string, desc: string, checked?: boolean, onChange?: (checked: boolean) => void, defaultChecked?: boolean }) {
  return (
    <label className="flex items-center justify-between cursor-pointer group">
      <div>
        <p className="text-white font-bold group-hover:text-teal-300 transition-colors">{title}</p>
        <p className="text-xs text-teal-500 mt-0.5">{desc}</p>
      </div>
      <div className="relative">
        <input 
          type="checkbox" 
          checked={checked} 
          defaultChecked={defaultChecked}
          onChange={(e) => onChange?.(e.target.checked)}
          className="sr-only peer" 
        />
        <div className="w-12 h-6 bg-teal-950 border border-teal-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-teal-500 after:border-teal-500 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-500 peer-checked:border-yellow-500"></div>
      </div>
    </label>
  );
}
