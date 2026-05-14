import React, { useState, useEffect, useRef } from 'react';
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
  addDoc,
  getDocs,
  getDoc,
  arrayUnion
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
  LayoutGrid,
  LogOut,
  Image as ImageIcon,
  MessageSquare,
  DollarSign,
  Plus,
  Minus,
  UserPlus,
  Gift,
  Trash2,
  AlertCircle,
  Send,
  X,
  Bell,
  MessageCircle,
  History as HistoryIcon
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
import { games, PROVIDERS } from '../constants/games';

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
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'deposits' | 'withdrawals' | 'games' | 'settings' | 'promo' | 'support' | 'notifications'>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  const [users, setUsers] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [trafficStats, setTrafficStats] = useState<any>(null);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [messagingUser, setMessagingUser] = useState<any>(null);
  const [messageText, setMessageText] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  useEffect(() => {
    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      const userList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsers(userList);
    }, (error) => {
      console.error("Users list onSnapshot error:", error);
    });

    const unsubTrxs = onSnapshot(collection(db, 'transactions'), (snapshot) => {
      const trxList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Sort in memory by createdAt (desc)
      trxList.sort((a: any, b: any) => {
        const timeA = a.createdAt?.seconds || 0;
        const timeB = b.createdAt?.seconds || 0;
        return timeB - timeA;
      });
      setTransactions(trxList);
    }, (error) => {
      console.error("Transactions list onSnapshot error:", error);
      if (error.message.includes('index')) {
        showToast("Firestore Index missing for transactions. Check console for link.", "error");
      }
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
      const userSnap = await getDoc(userRef);
      const trxRef = doc(db, 'transactions', trx.id);
      const userTrxRef = doc(db, 'users', trx.userId, 'transactions', trx.id);

      if (trx.type === 'deposit') {
        const depositAmount = Number(trx.amount);
        await updateDoc(userRef, {
          balance: increment(depositAmount),
          totalDeposits: increment(depositAmount),
          updatedAt: serverTimestamp()
        });

        // Handle Referral Bonus
        if (userSnap.exists()) {
          const userData = userSnap.data();
          if (userData.referredBy) {
            const bonusAmount = depositAmount * 0.1; // 10% bonus
            const referrerRef = doc(db, 'users', userData.referredBy);
            
            await updateDoc(referrerRef, {
              balance: increment(bonusAmount),
              totalReferralEarnings: increment(bonusAmount)
            });

            const bonusTrxData = {
              userId: userData.referredBy,
              username: 'System', 
              type: 'referral_bonus',
              amount: bonusAmount,
              status: 'approved',
              description: `Referral bonus from ${userData.username || trx.userId}`,
              createdAt: serverTimestamp(),
              fromUser: userData.username || trx.userId,
              fromUserId: trx.userId
            };

            const newBonusRef = doc(collection(db, 'transactions'));
            await setDoc(newBonusRef, bonusTrxData);
            await setDoc(doc(db, 'users', userData.referredBy, 'transactions', newBonusRef.id), bonusTrxData);
          }
        }
      } else if (trx.type === 'withdrawal') {
        // Balance already deducted in ProfileView.tsx
        await updateDoc(userRef, {
          totalWithdrawals: increment(trx.amount),
          updatedAt: serverTimestamp()
        });
      }

      const updates = { status: 'approved', approvedAt: serverTimestamp() };
      await updateDoc(trxRef, updates);
      try {
        await updateDoc(userTrxRef, updates);
      } catch (e) {
        // Might fail if not existing in subcollection (legacy)
        console.warn("Sub-collection trx update failed", e);
      }
      
      showToast('Transaction Approved!', 'success');
    } catch (err) {
      console.error("Approval error:", err);
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
      const userTrxRef = doc(db, 'users', trx.userId, 'transactions', trx.id);

      if (trx.type === 'withdrawal') {
        // Refund balance
        await updateDoc(userRef, {
          balance: increment(trx.amount),
          updatedAt: serverTimestamp()
        });
      }

      const updates = { status: 'rejected', rejectedAt: serverTimestamp() };
      await updateDoc(trxRef, updates);
      try {
        await updateDoc(userTrxRef, updates);
      } catch (e) {
        console.warn("Sub-collection trx update failed", e);
      }
      
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

  const handleDeleteAllUsers = async () => {
    if (!window.confirm('WARNING: Are you sure you want to delete ALL users? This action is irreversible.')) return;
    
    setIsLoading(true);
    try {
      const usersSnapshot = await getDocs(collection(db, 'users'));
      for (const userDoc of usersSnapshot.docs) {
        // Here we would ideally delete the user document AND their subcollections.
        // For simplicity, we just delete the main user doc, but be aware this leaves subcollections orphaned.
        // In a real production app, use a Firebase Function for atomic cleanup.
        await updateDoc(userDoc.ref, { status: 'deleted', deletedAt: serverTimestamp() });
        // Instead of outright deletion, setting a status is safer until verified
      }
      showToast('All users have been marked as deleted.', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to delete users', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateRole = async (userId: string, newRole: string) => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        role: newRole,
        updatedAt: serverTimestamp()
      });
      showToast('Role updated successfully', 'success');
    } catch (err) {
      showToast('Failed to update role', 'error');
    }
  };

  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pendingDeposits = transactions.filter(t => t.type === 'deposit' && t.status === 'pending');
  const pendingWithdrawals = transactions.filter(t => t.type === 'withdrawal' && t.status === 'pending');

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutGrid },
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'deposits', label: 'Deposits', icon: Wallet, badge: pendingDeposits.length },
    { id: 'withdrawals', label: 'Withdrawals', icon: DollarSign, badge: pendingWithdrawals.length },
    { id: 'promo', label: 'Promotions', icon: Gift },
    { id: 'notifications', label: 'Push Notifications', icon: Bell },
    { id: 'support', label: 'Support Inbox', icon: MessageSquare },
    { id: 'games', label: 'Game Settings', icon: Gamepad2 },
    { id: 'settings', label: 'Global Setup', icon: Settings }
  ];

  return (
    <div className="flex h-screen bg-[#115e59] overflow-hidden font-sans text-white">
      {/* Slim Sidebar (Icon-only as per screenshot) */}
      <aside className="w-16 md:w-20 bg-[#0a4a44] flex flex-col items-center py-6 z-50 border-r border-white/5 shrink-0">
        <div className="mb-10">
          <div className="w-10 h-10 bg-[#16a374]/20 rounded-xl flex items-center justify-center text-emerald-400 group cursor-pointer hover:bg-[#16a374] hover:text-white transition-all shadow-lg shadow-emerald-500/10 border border-emerald-400/20">
            <Shield size={22} />
          </div>
        </div>

        <nav className="flex-1 w-full px-2 space-y-4 overflow-y-auto no-scrollbar flex flex-col items-center">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-xl transition-all relative group ${
                activeTab === item.id 
                  ? 'bg-[#16a374] text-white shadow-lg shadow-emerald-500/20' 
                  : 'text-teal-300 hover:bg-white/5 hover:text-white'
              }`}
            >
              <item.icon size={20} className="shrink-0" />
              
              {item.badge ? (
                <div className="absolute -top-1 -right-1 bg-rose-500 text-white text-[8px] font-black w-4 h-4 flex items-center justify-center rounded-full border-2 border-[#0a4a44] transition-colors">
                  {item.badge}
                </div>
              ) : null}

              {/* Tooltip on Hover */}
              <div className="absolute left-full ml-4 bg-[#0a4a44] text-white text-[10px] px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap font-black uppercase tracking-widest shadow-xl border border-white/10 z-50">
                {item.label}
              </div>
            </button>
          ))}
        </nav>

        <div className="mt-auto px-2">
          <button 
            onClick={onBack}
            className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-xl text-rose-400 hover:bg-rose-500/10 transition-all group relative"
          >
            <LogOut size={20} />
            <div className="absolute left-full ml-4 bg-[#0a4a44] text-white text-[10px] px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap font-black uppercase tracking-widest shadow-xl border border-white/10 z-50">
              Exit Dashboard
            </div>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 md:h-20 bg-[#0d9488] border-b border-white/10 flex items-center justify-between px-4 md:px-8 shrink-0">
          <div className="flex items-center gap-4">
            <h1 className="text-lg md:text-xl font-black text-white uppercase tracking-tight">
              {navItems.find(i => i.id === activeTab)?.label}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-black text-white uppercase tracking-tight">{userData?.username || 'Admin'}</p>
              <p className="text-[10px] font-bold text-teal-300 uppercase tracking-widest">{userData?.role}</p>
            </div>
            <div className="w-10 h-10 bg-white/10 rounded-full border border-white/10 flex items-center justify-center text-teal-100">
              <User size={20} />
            </div>
          </div>
        </header>

        {/* Scrollable Area */}
        <div className="flex-1 overflow-y-auto p-8 no-scrollbar">
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
                  onUpdateRole={handleUpdateRole}
                  onSelectUser={setSelectedUser}
                  onMessageUser={setMessagingUser}
                  onAddUser={props.onAddUser}
                  onDeleteAllUsers={handleDeleteAllUsers}
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
                  trxs={transactions.filter(t => t.type === 'withdrawal')}
                  onApprove={handleApproveTrx}
                  onReject={handleRejectTrx}
                  isLoading={isLoading}
                />
              )}
              {activeTab === 'games' && <GameManagement {...props} />}
              {activeTab === 'settings' && <GlobalSettings {...props} />}
              {activeTab === 'promo' && <PromoManagement showToast={showToast} />}
              {activeTab === 'notifications' && <NotificationManagement showToast={showToast} users={users} />}
              {activeTab === 'support' && <SupportInbox showToast={showToast} />}
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

      {/* Message User Modal */}
      {messagingUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setMessagingUser(null)} />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-[#0d9488] w-full max-w-lg rounded-[40px] shadow-2xl relative overflow-hidden flex flex-col border border-emerald-500/20"
          >
            <div className="p-8 border-b border-white/5 flex items-center justify-between bg-black/10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                  <MessageCircle size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white uppercase tracking-tight">Direct Message</h3>
                  <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Target: {messagingUser.username}</p>
                </div>
              </div>
              <button 
                onClick={() => setMessagingUser(null)} 
                className="p-2 hover:bg-white/10 rounded-2xl text-teal-100 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-8 space-y-6">
              <div className="space-y-4">
                 <label className="block text-xs font-black text-teal-200 uppercase tracking-[0.2em] ml-1">Your Message Content</label>
                 <textarea 
                   value={messageText}
                   onChange={(e) => setMessageText(e.target.value)}
                   placeholder="Type your private message to the user here..."
                   rows={6}
                   className="w-full bg-black/20 border border-white/10 rounded-3xl px-6 py-5 text-sm font-bold text-white focus:outline-none focus:border-emerald-500 resize-none shadow-inner"
                 />
              </div>

              <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl">
                 <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest leading-relaxed">
                   This message will appear in the user's "Notifications" area. 
                   They will be able to see it the next time they log in or refresh.
                 </p>
              </div>
            </div>

            <div className="p-8 pt-0 flex gap-4">
               <button 
                  onClick={() => setMessagingUser(null)}
                  className="flex-1 px-6 py-4 rounded-2xl border border-white/10 text-teal-200 font-black text-xs uppercase tracking-widest hover:bg-white/5 transition-all"
               >
                 Cancel
               </button>
               <button 
                  disabled={!messageText.trim() || isSendingMessage}
                  onClick={async () => {
                    setIsSendingMessage(true);
                    try {
                      // Send notification to user
                      const notifRef = doc(collection(db, 'users', messagingUser.id, 'notifications'));
                      await setDoc(notifRef, {
                        title: 'Admin Message / অ্যাডমিন মেসেজ',
                        message: messageText.trim(),
                        type: 'message',
                        read: false,
                        createdAt: serverTimestamp()
                      });
                      
                      showToast('Message sent successfully!', 'success');
                      setMessagingUser(null);
                      setMessageText('');
                    } catch (err) {
                      showToast('Failed to send message', 'error');
                    } finally {
                      setIsSendingMessage(false);
                    }
                  }}
                  className="flex-[2] bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
               >
                 {isSendingMessage ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                 Send Message
               </button>
            </div>
          </motion.div>
        </div>
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
        <MetricCard label="Total Users" value={users.length} icon={Users} color="bg-blue-600" />
        <MetricCard label="Users Balance" value={`৳${totalBalance.toLocaleString()}`} icon={Wallet} color="bg-emerald-600" />
        <MetricCard label="Total Revenue" value={`৳${totalDeposits.toLocaleString()}`} icon={DollarSign} color="bg-teal-600" />
        <MetricCard label="Active Sessions" value="42" icon={Activity} color="bg-amber-600" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 bg-[#0d9488] p-8 rounded-[32px] shadow-xl border border-white/5">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-2">
              <BarChart3 className="text-emerald-400" size={22} />
              Traffic Analytics
            </h3>
            <select className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs font-bold text-teal-100 outline-none">
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
            </select>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats?.dailyTraffic}>
                <defs>
                  <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2dd4bf" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#2dd4bf" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#99f6e4', fontWeight: 700 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#99f6e4', fontWeight: 700 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0a4a44', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.5)' }} 
                  itemStyle={{ color: '#fff' }}
                />
                <Area type="monotone" dataKey="views" stroke="#2dd4bf" strokeWidth={3} fillOpacity={1} fill="url(#colorViews)" />
                <Area type="monotone" dataKey="visitors" stroke="#3b82f6" strokeWidth={3} fill="transparent" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-[#0d9488] p-8 rounded-[32px] shadow-xl border border-white/5">
            <h3 className="text-sm font-black text-white uppercase tracking-tight mb-6 flex items-center gap-2">
              <Globe className="text-blue-400" size={18} />
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
                      <span className="text-xs font-bold text-teal-200">{source.name}</span>
                    </div>
                    <span className="text-xs font-black text-white">{source.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#0a4a44] to-black p-8 rounded-[32px] text-white shadow-xl border border-white/5">
             <div className="flex items-center justify-between mb-4">
                <Clock className="text-emerald-400" size={20} />
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">System Pulse</span>
             </div>
             <p className="text-sm font-bold text-teal-100 leading-relaxed">
               All systems are operational. WebSocket latency is currenty <span className="text-white">12ms</span>.
             </p>
             <div className="mt-6 flex gap-2">
                {[1,2,3,4,5,6,7,8,9,10].map(i => (
                  <div key={i} className="flex-1 h-8 bg-white/5 rounded flex items-end overflow-hidden">
                    <div className="w-full bg-[#16a374]" style={{ height: `${Math.random() * 100}%` }}></div>
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
    <div className="bg-[#0d9488] p-6 rounded-[32px] shadow-xl border border-white/5 flex items-center gap-6">
      <div className={`w-14 h-14 ${color} rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg`}>
        <Icon size={24} />
      </div>
      <div>
        <p className="text-[10px] font-black text-teal-200 uppercase tracking-widest mb-1">{label}</p>
        <p className="text-2xl font-black text-white">{value}</p>
      </div>
    </div>
  );
}

function UserManagement({ users, searchQuery, setSearchQuery, onToggleBan, onAdjustBalance, onUpdateRole, onSelectUser, onMessageUser, onAddUser, onDeleteAllUsers }: any) {
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
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-teal-300 group-focus-within:text-emerald-400 transition-colors" size={20} />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Username or User ID..."
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold text-white focus:outline-none focus:border-emerald-500 shadow-sm transition-all placeholder:text-teal-900/50"
            />
          </div>
          <select 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-[#0a4a44] border border-white/10 rounded-2xl px-6 py-4 text-sm font-black text-white focus:outline-none focus:border-emerald-500 shadow-sm transition-all uppercase tracking-widest outline-none appearance-none cursor-pointer"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>
        </div>
        <button 
          onClick={() => setIsAddingUser(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-emerald-500/20"
        >
          <UserPlus size={18} />
          Add New User
        </button>
        <button 
          onClick={onDeleteAllUsers}
          className="bg-rose-600 hover:bg-rose-700 text-white px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-rose-500/20"
        >
          <Trash2 size={18} />
          Delete All Users
        </button>
      </div>

      {isAddingUser && (
        <div className="bg-[#0d9488] p-6 rounded-[32px] border border-white/10 shadow-xl animate-in slide-in-from-top-4 duration-300">
          <form onSubmit={handleAddUser} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <label className="block text-[10px] font-black text-teal-200 uppercase tracking-widest mb-2">Username</label>
              <input 
                value={newUserData.username}
                onChange={(e) => setNewUserData({...newUserData, username: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-emerald-500"
                placeholder="Enter username"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-teal-200 uppercase tracking-widest mb-2">Password</label>
              <input 
                type="password"
                value={newUserData.password}
                onChange={(e) => setNewUserData({...newUserData, password: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-emerald-500"
                placeholder="Enter password"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-teal-200 uppercase tracking-widest mb-2">Role</label>
              <select 
                value={newUserData.role}
                onChange={(e) => setNewUserData({...newUserData, role: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm capitalize text-white outline-none focus:border-emerald-500"
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
                <option value="agent">Agent</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button 
                type="submit"
                className="flex-1 bg-emerald-600 text-white py-3 rounded-xl font-bold text-xs"
              >
                Create Account
              </button>
              <button 
                type="button"
                onClick={() => setIsAddingUser(false)}
                className="px-4 bg-white/10 text-teal-200 py-3 rounded-xl font-bold text-xs"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-[#0d9488] rounded-[32px] border border-white/10 shadow-xl overflow-hidden">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/5">
                <th className="px-6 py-4 text-[10px] font-black text-teal-300 uppercase tracking-widest">User</th>
                <th className="px-6 py-4 text-[10px] font-black text-teal-300 uppercase tracking-widest">Balance</th>
                <th className="px-6 py-4 text-[10px] font-black text-teal-300 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-[10px] font-black text-teal-300 uppercase tracking-widest">Role</th>
                <th className="px-6 py-4 text-[10px] font-black text-teal-300 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {sortedUsers.map((user: any) => (
                <tr key={user.id} className="hover:bg-white/5 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-teal-300 shrink-0">
                        <User size={18} />
                      </div>
                      <div>
                        <p className="text-sm font-black text-white">{user.username}</p>
                        <p className="text-[10px] font-bold text-teal-400 font-mono tracking-tighter opacity-0 group-hover:opacity-100 transition-opacity uppercase">ID: {user.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-black text-emerald-400">৳{(user.balance || 0).toLocaleString()}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${user.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                      {user.status || 'active'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <select
                      value={user.role || 'user'}
                      onChange={(e) => onUpdateRole(user.id, e.target.value)}
                      className="bg-[#0a4a44] border border-white/10 rounded-lg px-3 py-1.5 text-[10px] font-black text-teal-100 uppercase tracking-widest outline-none focus:border-emerald-500 appearance-none cursor-pointer hover:bg-white/5 transition-all"
                    >
                      <option value="user">User</option>
                      <option value="agent">Agent</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => onSelectUser(user)}
                        className="p-2 hover:bg-white/10 text-teal-300 hover:text-white rounded-lg transition-all"
                        title="Edit User"
                      >
                        <Settings size={18} />
                      </button>
                      <button 
                        onClick={() => onMessageUser(user)}
                        className="p-2 hover:bg-white/10 text-emerald-400 hover:text-white rounded-lg transition-all"
                        title="Message User"
                      >
                        <MessageSquare size={18} />
                      </button>
                      <button 
                         onClick={() => onToggleBan(user)}
                         className={`p-2 rounded-lg transition-all ${user.status === 'active' ? 'hover:bg-rose-500/20 text-teal-300 hover:text-rose-400' : 'bg-rose-500/20 text-rose-400'}`}
                         title={user.status === 'active' ? 'Ban User' : 'Unban User'}
                      >
                        <Ban size={18} />
                      </button>
                      <div className="flex gap-1 ml-4 border-l border-white/5 pl-4">
                         <button 
                            onClick={() => onAdjustBalance(user.id, 500)}
                            className="w-10 h-8 flex items-center justify-center bg-emerald-500/20 text-emerald-400 rounded-lg text-[10px] font-black hover:bg-emerald-500/30 transition-all border border-emerald-500/30"
                            title="Add 500"
                         >
                           +500
                         </button>
                         <button 
                            onClick={() => onAdjustBalance(user.id, -500)}
                            className="w-10 h-8 flex items-center justify-center bg-rose-500/20 text-rose-400 rounded-lg text-[10px] font-black hover:bg-rose-500/30 transition-all border border-rose-500/30"
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
            <div className="p-12 text-center text-teal-400 font-bold uppercase tracking-widest text-xs">
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
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-[#0d9488] w-full max-w-lg rounded-[40px] shadow-2xl relative overflow-hidden flex flex-col border border-white/10"
      >
        <div className="p-8 border-b border-white/5 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-black text-white uppercase tracking-tight">Edit Profile</h3>
            <p className="text-xs font-bold text-teal-300 uppercase tracking-widest mt-1">User ID: {user.id}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-2xl text-teal-100">
            <X size={24} />
          </button>
        </div>

        <div className="p-8 space-y-6 overflow-y-auto max-h-[70vh] no-scrollbar">
          <div className="bg-white/5 p-6 rounded-[32px] border border-white/10 flex items-center justify-between">
             <div>
                <p className="text-[10px] font-black text-teal-200 uppercase tracking-widest">Current Balance</p>
                <p className="text-3xl font-black text-emerald-400">৳{user.balance?.toLocaleString()}</p>
             </div>
             <div className="flex gap-2">
                <input 
                  type="number"
                  placeholder="Amount"
                  className="w-24 bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold font-mono outline-none focus:border-emerald-500 text-white"
                  onChange={(e) => setAdjustAmount(Number(e.target.value))}
                />
                <button 
                   onClick={() => onAdjustBalance(user.id, adjustAmount)}
                   className="p-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-all font-black text-xs"
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
              <label className="block text-xs font-bold text-teal-200 uppercase mb-2 ml-1">Username</label>
              <input 
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({...formData, username: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm font-bold text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-teal-200 uppercase mb-2 ml-1">Role</label>
                <select 
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm font-bold text-white outline-none focus:border-emerald-500 appearance-none"
                >
                  <option value="user" className="text-black">User</option>
                  <option value="admin" className="text-black">Admin</option>
                  <option value="agent" className="text-black">Agent</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-teal-200 uppercase mb-2 ml-1">Status</label>
                <select 
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm font-bold text-white outline-none focus:border-emerald-500 appearance-none"
                >
                  <option value="active" className="text-black">Active</option>
                  <option value="banned" className="text-black">Banned</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="p-8 bg-black/20 border-t border-white/5 flex gap-4">
          <button 
             onClick={onClose}
             className="flex-1 bg-white/5 border border-white/10 text-teal-200 font-black py-4 rounded-2xl hover:bg-white/10 transition-all uppercase tracking-widest text-[10px]"
          >
            Cancel
          </button>
          <button 
             onClick={() => onSave(formData)}
             className="flex-1 bg-emerald-600 text-white font-black py-4 rounded-2xl hover:bg-emerald-700 transition-all uppercase tracking-widest text-[10px] shadow-xl shadow-emerald-600/20"
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
        <h2 className="text-xl font-black text-white uppercase tracking-tight">{title}</h2>
        <div className="bg-white/10 px-4 py-2 rounded-xl border border-white/10 text-xs font-bold text-teal-300 uppercase tracking-widest flex items-center gap-2">
          <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse shadow-[0_0_10px_rgba(251,191,36,0.5)]"></div>
          {pending.length} Pending
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-xs font-black text-teal-400 uppercase tracking-widest mb-4">Pending Requests</h3>
        <AnimatePresence>
          {pending.map((trx: any) => (
            <motion.div 
               layout
               initial={{ opacity: 0, x: -10 }}
               animate={{ opacity: 1, x: 0 }}
               exit={{ opacity: 0, scale: 0.95 }}
               key={trx.id}
               className="bg-[#0d9488] p-6 rounded-[32px] border-2 border-amber-500/20 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6"
            >
              <div className="flex items-center gap-5">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${trx.type === 'deposit' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                  {trx.type === 'deposit' ? <ArrowDownLeft size={24} /> : <ArrowUpRight size={24} />}
                </div>
                <div>
                   <h4 className="text-base font-black text-white">{trx.username}</h4>
                   <p className="text-[10px] font-bold text-teal-300 uppercase tracking-widest mt-1">
                      {trx.method} • {trx.trxId || 'No TRX ID'} • {trx.senderNumber}
                   </p>
                   <div className="flex items-center gap-2 mt-2">
                      <span className="text-[9px] font-black bg-white/5 text-teal-400 py-1 px-2 rounded-full uppercase tracking-[0.1em]">User ID: {trx.userId}</span>
                      <span className="text-[9px] font-black bg-emerald-500/20 text-emerald-400 py-1 px-2 rounded-full uppercase tracking-[0.1em]">{new Date(trx.createdAt?.seconds * 1000).toLocaleString()}</span>
                   </div>
                </div>
              </div>

              <div className="flex flex-col items-end gap-3 min-w-[150px]">
                <p className="text-3xl font-black text-white tracking-tight">৳{trx.amount.toLocaleString()}</p>
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
          <div className="bg-white/5 border border-dashed border-white/10 rounded-[32px] p-12 text-center text-teal-400/50 text-sm font-bold uppercase tracking-widest">
            All requests processed.
          </div>
        )}
      </div>

      <div className="space-y-4">
        <h3 className="text-xs font-black text-teal-400 uppercase tracking-widest mb-4">Recent Activity</h3>
        <div className="bg-[#0d9488] rounded-[32px] border border-white/10 shadow-xl overflow-hidden">
           <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="px-6 py-4 text-[10px] font-black text-teal-300 uppercase tracking-widest">User</th>
                    <th className="px-6 py-4 text-[10px] font-black text-teal-300 uppercase tracking-widest">Amount</th>
                    <th className="px-6 py-4 text-[10px] font-black text-teal-300 uppercase tracking-widest">Method</th>
                    <th className="px-6 py-4 text-[10px] font-black text-teal-300 uppercase tracking-widest">Status</th>
                    <th className="px-6 py-4 text-[10px] font-black text-teal-300 uppercase tracking-widest">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {past.map((trx: any) => (
                    <tr key={trx.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm font-black text-white">{trx.username}</p>
                          <p className="text-[10px] font-bold text-teal-400 font-mono">ID: {trx.userId}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-black text-emerald-400">৳{trx.amount.toLocaleString()}</td>
                      <td className="px-6 py-4 text-xs font-bold text-teal-300 uppercase">{trx.method}</td>
                      <td className="px-6 py-4">
                        <span className={`text-[9px] font-black px-2 py-1 rounded-full uppercase tracking-widest ${trx.status === 'approved' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                          {trx.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-[10px] text-teal-400 font-bold uppercase">
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
  const [selectedProvider, setSelectedProvider] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredGames = games.filter(game => {
    const matchesProvider = selectedProvider === 'ALL' || game.provider === selectedProvider;
    const matchesSearch = game.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          game.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesProvider && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col gap-4 mb-8">
        <div className="relative group">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-teal-400 group-focus-within:text-emerald-400 transition-colors">
            <Search size={18} />
          </div>
          <input 
            type="text"
            placeholder="গেমের নাম বা আইডি দিয়ে খুঁজুন..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#0d9488]/50 border border-white/10 rounded-2xl pl-12 pr-6 py-4 text-sm font-bold text-white placeholder-teal-300 focus:outline-none focus:border-emerald-500 transition-all shadow-inner"
          />
        </div>

        <div className="flex overflow-x-auto gap-2 pb-2 no-scrollbar">
          {PROVIDERS.map(p => (
            <button
              key={p.id}
              onClick={() => setSelectedProvider(p.id)}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all shrink-0 ${
                selectedProvider === p.id 
                ? 'bg-yellow-500 text-black shadow-[0_0_15px_rgba(234,179,8,0.3)]' 
                : 'bg-white/5 text-teal-300 hover:bg-white/10'
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredGames.map(game => (
          <div key={game.id} className="bg-[#0d9488] p-6 rounded-[32px] border border-white/10 shadow-xl space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/5 rounded-2xl overflow-hidden relative border border-white/10 group">
                {props.globalLogos[game.id] ? (
                  <img src={props.globalLogos[game.id]} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                   <div className="w-full h-full flex items-center justify-center text-teal-300">
                      <ImageIcon size={24} />
                      <img src={game.image} alt="Ref" className="absolute inset-0 opacity-20 pointer-events-none object-cover" />
                   </div>
                )}
                <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
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
                  defaultValue={props.globalNames[game.id] || game.name}
                  onBlur={(e) => props.updateGlobalGameName(game.id, e.target.value)}
                  className="w-full bg-transparent border-b border-white/10 focus:border-emerald-500 text-sm font-black text-white uppercase tracking-tight outline-none py-1"
                  placeholder="Game Name"
                />
                <p className="text-[10px] font-bold text-teal-400 mt-1 uppercase">ID: {game.id}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[9px] font-black text-teal-300 uppercase tracking-widest block mb-1">Game URL (External)</label>
                <input 
                  defaultValue={props.globalUrls[game.id] || ''}
                  onBlur={(e) => props.updateGlobalGameUrl(game.id, e.target.value)}
                  className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-teal-100 focus:outline-none focus:border-emerald-500"
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className="text-[9px] font-black text-teal-300 uppercase tracking-widest block mb-1">Win Logic Config</label>
                <input 
                   defaultValue={props.globalOptions[game.id] || ''}
                   onBlur={(e) => props.updateGlobalGameOption(game.id, e.target.value)}
                   className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-teal-100 focus:outline-none focus:border-emerald-500"
                   placeholder="e.g. rate:85;max_mult:100"
                />
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-white/10">
                <span className="text-[10px] font-black text-teal-300 uppercase tracking-widest">Active Status</span>
                <button 
                  onClick={() => props.updateGlobalGameOption(`${game.id}_active`, props.globalOptions[`${game.id}_active`] === 'false' ? 'true' : 'false')}
                  className={`w-12 h-6 rounded-full relative transition-all ${props.globalOptions[`${game.id}_active`] !== 'false' ? 'bg-emerald-500' : 'bg-rose-500'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${props.globalOptions[`${game.id}_active`] !== 'false' ? 'right-1' : 'left-1'}`} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-amber-500/10 border border-amber-500/20 p-6 rounded-[32px] flex flex-col md:flex-row items-center gap-6">
         <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-amber-500/20">
            <Shield size={24} />
         </div>
         <div>
            <h4 className="text-sm font-black text-amber-200 uppercase tracking-tight">Advanced Provider Simulation</h4>
            <p className="text-xs font-bold text-teal-300 mt-1">Changes made here are global and affect all users instantly. Use responsibly to manage game risk and RTP (Return to Player) rates.</p>
         </div>
      </div>
    </div>
  );
}

function NotificationManagement({ showToast, users }: { showToast: any, users: any[] }) {
  const [targetUserId, setTargetUserId] = useState<string>('all');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState('info');
  const [url, setUrl] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      showToast('Title and message are required', 'error');
      return;
    }
    
    setIsSending(true);
    try {
      if (targetUserId === 'all') {
        // Global notification
        const usersSnapshot = await getDocs(collection(db, 'users'));
        let count = 0;
        const promises = [];
        for (const userDoc of usersSnapshot.docs) {
          const timestamp = new Date().toISOString();
          const notifData = {
            title,
            message,
            type,
            url,
            read: false,
            createdAt: timestamp,
            date: timestamp
          };
          const notifRef = doc(collection(db, 'users', userDoc.id, 'notifications'));
          promises.push(setDoc(notifRef, notifData));
          
          count++;
          if (count % 100 === 0) {
            await Promise.all(promises);
            promises.length = 0;
          }
        }
        if (promises.length > 0) {
          await Promise.all(promises);
        }
      } else {
        // Personal notification
        const timestamp = new Date().toISOString();
        const notifData = {
          title,
          message,
          type,
          url,
          read: false,
          createdAt: timestamp,
          date: timestamp
        };
        const notifRef = doc(collection(db, 'users', targetUserId, 'notifications'));
        await setDoc(notifRef, notifData);
      }
      
      showToast('Notification sent successfully', 'success');
      setTitle('');
      setMessage('');
      setUrl('');
    } catch (err: any) {
      showToast(err.message || "Failed to send notification", 'error');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="bg-[#0d9488] p-6 rounded-[32px] shadow-xl border border-white/5 max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-6 pb-4 border-b border-white/10">
        <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-teal-300">
          <Bell size={24} />
        </div>
        <div>
          <h2 className="text-xl font-black text-white italic uppercase tracking-tighter">Send Notifications</h2>
          <p className="text-teal-200 text-xs font-bold">Broadcast alerts, bonuses, and updates to users.</p>
        </div>
      </div>

      <form onSubmit={handleSend} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-teal-200 mb-1 uppercase tracking-widest">Target User</label>
          <select 
            value={targetUserId}
            onChange={(e) => setTargetUserId(e.target.value)}
            className="w-full bg-[#062e24] text-white p-3 rounded-xl border border-white/10 focus:outline-none focus:border-white/30"
          >
            <option value="all">All Users (Broadcast)</option>
            {users.map(u => (
              <option key={u.id} value={u.id}>{u.username || u.phone || u.email || u.id}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-teal-200 mb-1 uppercase tracking-widest">Notification Type</label>
          <select 
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full bg-[#062e24] text-white p-3 rounded-xl border border-white/10 focus:outline-none focus:border-white/30"
          >
            <option value="info">Info</option>
            <option value="bonus">Bonus / Gift</option>
            <option value="promotion">Promotion</option>
            <option value="account">Account Alert</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-teal-200 mb-1 uppercase tracking-widest">Title</label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full bg-[#062e24] text-white p-3 rounded-xl border border-white/10 focus:outline-none focus:border-white/30"
            placeholder="e.g. You received a Bonus!"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-teal-200 mb-1 uppercase tracking-widest">Message</label>
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            className="w-full bg-[#062e24] text-white p-3 rounded-xl border border-white/10 focus:outline-none focus:border-white/30 min-h-[100px]"
            placeholder="Write your message here..."
            required
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-teal-200 mb-1 uppercase tracking-widest">Action URL (Optional)</label>
          <input
            type="text"
            value={url}
            onChange={e => setUrl(e.target.value)}
            className="w-full bg-[#062e24] text-white p-3 rounded-xl border border-white/10 focus:outline-none focus:border-white/30"
            placeholder="e.g. /member/wallet or tab:deposit"
          />
        </div>

        <button
          type="submit"
          disabled={isSending}
          className="w-full bg-yellow-500 hover:bg-yellow-400 text-black py-4 rounded-xl font-bold italic uppercase transition-colors"
        >
          {isSending ? 'Sending...' : 'Send Notification'}
        </button>
      </form>
    </div>
  );
}

function GlobalSettings(props: AdminPanelViewProps) {
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await setDoc(doc(db, 'metadata', 'settings'), {
        casinoName: props.casinoName,
        noticeText: props.noticeText,
        minDeposit: props.minDeposit,
        minWithdraw: props.minWithdraw,
        welcomeBonus: props.welcomeBonus,
        telegramLink: props.telegramLink,
        updatedAt: serverTimestamp()
      }, { merge: true });
      
      try {
        await setDoc(doc(db, 'config', 'main'), {
          casinoName: props.casinoName,
          noticeText: props.noticeText,
          updatedAt: serverTimestamp()
        }, { merge: true });
      } catch (e) {
        console.warn("Could not save config/main", e);
      }
      
      props.showToast('Global settings updated!', 'success');
    } catch (err) {
      console.error("Save settings error:", err);
      props.showToast('Save failed', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-[#0d9488] p-10 rounded-[48px] border border-white/10 shadow-2xl max-w-4xl mx-auto space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
         <h2 className="text-2xl font-black text-white uppercase tracking-tight">Platform Configuration</h2>
         <button 
           onClick={handleSave}
           disabled={isSaving}
           className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-500/20 transition-all flex items-center gap-3"
         >
           {isSaving ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
           Commit Changes
         </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <div className="space-y-6">
          <h3 className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em] border-b border-white/10 pb-2">Branding & UI</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-teal-200 uppercase mb-2 ml-1">Platform Name</label>
              <input 
                value={props.casinoName}
                onChange={(e) => props.updateCasinoName(e.target.value)}
                className="w-full bg-black/20 border border-white/10 rounded-2xl px-5 py-4 text-sm font-bold text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-teal-200 uppercase mb-2 ml-1">Global Notice (Bengali)</label>
              <textarea 
                value={props.noticeText}
                onChange={(e) => props.setNoticeText(e.target.value)}
                rows={4}
                className="w-full bg-black/20 border border-white/10 rounded-2xl px-5 py-4 text-sm font-bold text-white focus:outline-none focus:border-emerald-500 resize-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-teal-200 uppercase mb-2 ml-1">Official WhatsApp</label>
              <input 
                value={process.env.WHATSAPP_LINK || ''}
                readOnly
                className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-sm font-bold text-teal-500 focus:outline-none cursor-not-allowed"
                placeholder="Managed in App config"
              />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <h3 className="text-[10px] font-black text-rose-400 uppercase tracking-[0.2em] border-b border-white/10 pb-2">Economy & Finance</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-teal-200 uppercase mb-2 ml-1">Min Deposit</label>
              <input 
                type="number"
                value={props.minDeposit}
                onChange={(e) => props.setMinDeposit(Number(e.target.value))}
                className="w-full bg-black/20 border border-white/10 rounded-2xl px-5 py-4 text-sm font-bold text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-teal-200 uppercase mb-2 ml-1">Min Withdraw</label>
              <input 
                type="number"
                value={props.minWithdraw}
                onChange={(e) => props.setMinWithdraw(Number(e.target.value))}
                className="w-full bg-black/20 border border-white/10 rounded-2xl px-5 py-4 text-sm font-bold text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-xs font-bold text-teal-200 uppercase mb-2 ml-1">Welcome Bonus (TK)</label>
              <input 
                type="number"
                value={props.welcomeBonus}
                onChange={(e) => props.setWelcomeBonus(Number(e.target.value))}
                className="w-full bg-black/20 border border-white/10 rounded-2xl px-5 py-4 text-sm font-bold text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        <div className="space-y-6">
           <h3 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] border-b border-white/10 pb-2">Communications</h3>
           <div>
              <label className="block text-xs font-bold text-teal-200 uppercase mb-2 ml-1">Telegram Official URL</label>
              <div className="relative">
                <MessageSquare className="absolute left-4 top-1/2 -translate-y-1/2 text-teal-400" size={20} />
                <input 
                  value={props.telegramLink}
                  onChange={(e) => props.setTelegramLink(e.target.value)}
                  className="w-full bg-black/20 border border-white/10 rounded-2xl px-12 py-4 text-sm font-bold text-white focus:outline-none focus:border-emerald-500"
                  placeholder="https://t.me/..."
                />
              </div>
            </div>
            {/* Telegram Bot Tester */}
            <div className="pt-2 space-y-4">
              <div className="bg-slate-900/50 p-4 rounded-xl border border-white/5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Telegram Connection</h3>
                  <button 
                    onClick={async () => {
                      try {
                        const response = await fetch('/api/telegram/status');
                        const data = await response.json();
                        console.log("Telegram Status:", data);
                        props.showToast(`Admin ID: ${data.configuredAdminId}`, 'info');
                        if (data.lastError) {
                          alert(`Last Error: ${JSON.stringify(data.lastError, null, 2)}`);
                        } else if (data.lastSuccess) {
                          props.showToast('Last send was successful!', 'success');
                        }
                      } catch (e) {
                         props.showToast('Failed to fetch status', 'error');
                      }
                    }}
                    className="text-[10px] font-bold text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1"
                  >
                    <Activity size={12} />
                    Check Status
                  </button>
                </div>
                <button 
                  onClick={async () => {
                    try {
                      props.showToast('Sending test message...', 'info');
                      const response = await fetch('/api/telegram/send', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ message: `🔔 <b>Test Notification from Admin Panel!</b>\n\n🕒 <b>Time:</b> ${new Date().toLocaleString()}\n✅ Your Telegram Bot is properly connected to this ID.` })
                      });
                      
                      const data = await response.json();
                      if (response.ok) {
                        props.showToast('Test message sent! Check Telegram.', 'success');
                      } else {
                        const details = data.details?.response?.description || data.error || 'Unknown error';
                        props.showToast(`Error: ${details}`, 'error');
                        alert(`Telegram details: ${JSON.stringify(data.details, null, 2)}`);
                      }
                    } catch (e) {
                      props.showToast('Connection error while sending test message.', 'error');
                    }
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
                >
                  <Send size={16} />
                  Ping Telegram Bot
                </button>
                <p className="text-[10px] text-slate-500 mt-3 text-center italic">
                  Bot will send to ID: <span className="text-slate-300 select-all font-mono">-6543227982</span>
                </p>
              </div>
            </div>
        </div>

        <div className="space-y-6">
           <h3 className="text-[10px] font-black text-amber-400 uppercase tracking-[0.2em] border-b border-white/10 pb-2">Payment Gateways</h3>
           <div className="space-y-4">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
               <div>
                  <label className="block text-xs font-bold text-teal-200 uppercase mb-2 ml-1">Nagad</label>
                  <input 
                    value={props.globalImages['payment_number_nagad'] || ''}
                    onChange={(e) => props.updateGlobalImage('payment_number_nagad', e.target.value)}
                    className="w-full bg-black/20 border border-white/10 rounded-2xl px-5 py-4 text-sm font-bold text-white focus:outline-none focus:border-emerald-500"
                    placeholder="017xxxxxxxx"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-teal-200 uppercase mb-2 ml-1">Bkash</label>
                  <input 
                    value={props.globalImages['payment_number_bkash'] || ''}
                    onChange={(e) => props.updateGlobalImage('payment_number_bkash', e.target.value)}
                    className="w-full bg-black/20 border border-white/10 rounded-2xl px-5 py-4 text-sm font-bold text-white focus:outline-none focus:border-emerald-500"
                    placeholder="018xxxxxxxx"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-teal-200 uppercase mb-2 ml-1">Rocket</label>
                  <input 
                    value={props.globalImages['payment_number_rocket'] || ''}
                    onChange={(e) => props.updateGlobalImage('payment_number_rocket', e.target.value)}
                    className="w-full bg-black/20 border border-white/10 rounded-2xl px-5 py-4 text-sm font-bold text-white focus:outline-none focus:border-emerald-500"
                    placeholder="019xxxxxxxx"
                  />
                </div>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
               <div>
                  <label className="block text-xs font-bold text-teal-200 uppercase mb-2 ml-1">UPI ID</label>
                  <input 
                    value={props.globalImages['payment_number_upi'] || ''}
                    onChange={(e) => props.updateGlobalImage('payment_number_upi', e.target.value)}
                    className="w-full bg-black/20 border border-white/10 rounded-2xl px-5 py-4 text-sm font-bold text-white focus:outline-none focus:border-emerald-500"
                    placeholder="upi@example"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-teal-200 uppercase mb-2 ml-1">PayTM</label>
                  <input 
                    value={props.globalImages['payment_number_paytm'] || ''}
                    onChange={(e) => props.updateGlobalImage('payment_number_paytm', e.target.value)}
                    className="w-full bg-black/20 border border-white/10 rounded-2xl px-5 py-4 text-sm font-bold text-white focus:outline-none focus:border-emerald-500"
                    placeholder="Number"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-teal-200 uppercase mb-2 ml-1">Google Pay</label>
                  <input 
                    value={props.globalImages['payment_number_googlepay'] || ''}
                    onChange={(e) => props.updateGlobalImage('payment_number_googlepay', e.target.value)}
                    className="w-full bg-black/20 border border-white/10 rounded-2xl px-5 py-4 text-sm font-bold text-white focus:outline-none focus:border-emerald-500"
                    placeholder="Info"
                  />
                </div>
             </div>
             <div>
                <label className="block text-xs font-bold text-teal-200 uppercase mb-2 ml-1">Bank Info</label>
                <textarea 
                  value={props.globalImages['payment_number_bank'] || ''}
                  onChange={(e) => props.updateGlobalImage('payment_number_bank', e.target.value)}
                  rows={3}
                  className="w-full bg-black/20 border border-white/10 rounded-2xl px-5 py-4 text-sm font-bold text-white focus:outline-none focus:border-emerald-500 resize-none"
                  placeholder="Acc: 123456789, IFSC: SBIN000123"
                />
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}

function PromoManagement({ showToast }: { showToast: any }) {
  const [promoCodes, setPromoCodes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [newPromo, setNewPromo] = useState({ code: '', amount: 0, maxUses: 100, expireDays: 7, active: true });

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'promo_codes'), (snapshot) => {
      setPromoCodes(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return unsub;
  }, []);

  const handleCreatePromo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPromo.code || newPromo.amount <= 0) return;
    setIsLoading(true);
    try {
      await setDoc(doc(db, 'promo_codes', newPromo.code.toUpperCase()), {
        ...newPromo,
        code: newPromo.code.toUpperCase(),
        createdAt: serverTimestamp(),
        usedCount: 0
      });
      showToast('Promo code created!', 'success');
      setNewPromo({ code: '', amount: 0, maxUses: 100, expireDays: 7, active: true });
    } catch (err) {
      showToast('Failed to create promo code', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeletePromo = async (id: string) => {
    if (!window.confirm('Delete this promo code?')) return;
    try {
      await updateDoc(doc(db, 'promo_codes', id), { active: false });
      showToast('Promo code deactivated', 'info');
    } catch (err) {
      showToast('Action failed', 'error');
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black text-white uppercase tracking-tight">Promo Code Management</h2>
      </div>

      <div className="bg-[#0d9488] p-6 rounded-[32px] border border-white/10 shadow-xl">
        <h3 className="text-xs font-black text-teal-300 uppercase tracking-widest mb-4">Create New Code</h3>
        <form onSubmit={handleCreatePromo} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
          <div>
            <label className="block text-[10px] font-black text-teal-200 uppercase tracking-widest mb-2">Code</label>
            <input 
              value={newPromo.code}
              onChange={(e) => setNewPromo({...newPromo, code: e.target.value.toUpperCase()})}
              className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white outline-none focus:border-emerald-500"
              placeholder="WELCOME500"
            />
          </div>
          <div>
            <label className="block text-[10px] font-black text-teal-200 uppercase tracking-widest mb-2">Bonus (TK)</label>
            <input 
              type="number"
              value={newPromo.amount}
              onChange={(e) => setNewPromo({...newPromo, amount: Number(e.target.value)})}
              className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white outline-none focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="block text-[10px] font-black text-teal-200 uppercase tracking-widest mb-2">Max Uses</label>
            <input 
              type="number"
              value={newPromo.maxUses}
              onChange={(e) => setNewPromo({...newPromo, maxUses: Number(e.target.value)})}
              className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white outline-none focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="block text-[10px] font-black text-teal-200 uppercase tracking-widest mb-2">Expiry (Days)</label>
            <input 
              type="number"
              value={newPromo.expireDays}
              onChange={(e) => setNewPromo({...newPromo, expireDays: Number(e.target.value)})}
              className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white outline-none focus:border-emerald-500"
            />
          </div>
          <button 
            type="submit"
            disabled={isLoading}
            className="bg-emerald-600 hover:bg-emerald-700 text-white h-[46px] rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-emerald-500/20 transition-all"
          >
            Create Code
          </button>
        </form>
      </div>

      <div className="bg-[#0d9488] rounded-[32px] border border-white/10 shadow-xl overflow-hidden">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/5">
                <th className="px-6 py-4 text-[10px] font-black text-teal-300 uppercase tracking-widest">Code</th>
                <th className="px-6 py-4 text-[10px] font-black text-teal-300 uppercase tracking-widest">Bonus</th>
                <th className="px-6 py-4 text-[10px] font-black text-teal-300 uppercase tracking-widest">Usage</th>
                <th className="px-6 py-4 text-[10px] font-black text-teal-300 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-[10px] font-black text-teal-300 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {promoCodes.map((promo) => (
                <tr key={promo.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4">
                    <span className="text-sm font-black text-white font-mono tracking-widest">{promo.code}</span>
                  </td>
                  <td className="px-6 py-4 text-sm font-black text-emerald-400">৳{promo.amount}</td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="text-[10px] font-bold text-teal-400">{promo.usedCount || 0} / {promo.maxUses}</div>
                      <div className="w-24 h-1 bg-white/10 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-emerald-500" 
                          style={{ width: `${Math.min(100, ((promo.usedCount || 0) / promo.maxUses) * 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-[9px] font-black px-2 py-1 rounded-full uppercase tracking-widest ${promo.active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/10 text-teal-400'}`}>
                      {promo.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button 
                      onClick={() => handleDeletePromo(promo.id)}
                      className="p-2 hover:bg-rose-500/20 text-teal-300 hover:text-rose-400 rounded-lg transition-all"
                    >
                      <Ban size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function SupportInbox({ showToast }: { showToast: any }) {
  const [tickets, setTickets] = useState<any[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [replyText, setReplyText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsub = onSnapshot(query(collection(db, 'support_tickets'), orderBy('updatedAt', 'desc')), (snapshot) => {
      const ticketList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTickets(ticketList);
      
      // Update selected ticket if it's currently open
      if (selectedTicket) {
        const updated = ticketList.find(t => t.id === selectedTicket.id);
        if (updated) setSelectedTicket(updated);
      }
    });
    return unsub;
  }, [selectedTicket?.id]);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [selectedTicket?.messages]);

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedTicket || isSending) return;
    setIsSending(true);

    const agentMsg = {
      id: Date.now().toString(),
      text: replyText.trim(),
      sender: 'agent',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    try {
      await updateDoc(doc(db, 'support_tickets', selectedTicket.id), {
        messages: arrayUnion(agentMsg),
        lastMessage: replyText.trim(),
        updatedAt: serverTimestamp(),
        status: 'open'
      });
      setReplyText("");
    } catch (err) {
      showToast('Reply failed to send', 'error');
    } finally {
      setIsSending(false);
    }
  };

  const closeTicket = async (id: string) => {
    try {
      await updateDoc(doc(db, 'support_tickets', id), { status: 'closed', updatedAt: serverTimestamp() });
      showToast('Ticket closed', 'info');
    } catch (err) {
      showToast('Action failed', 'error');
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black text-white uppercase tracking-tight">Support Inbox</h2>
        <div className="flex gap-2">
           <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/20 px-3 py-1 rounded-full uppercase border border-emerald-500/30">Live Session</span>
           <span className="text-[10px] font-black text-amber-400 bg-amber-500/20 px-3 py-1 rounded-full uppercase border border-amber-500/30">{tickets.length} Tickets</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Tickets List */}
        <div className="md:col-span-1 bg-[#0d9488] rounded-[32px] border border-white/10 shadow-xl overflow-hidden flex flex-col h-[600px]">
          <div className="p-6 border-b border-white/5 flex items-center justify-between bg-black/10">
            <h3 className="text-xs font-black text-teal-300 uppercase tracking-widest">Recent Chats</h3>
            <span className="bg-rose-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-lg shadow-rose-500/20">
              {tickets.filter(t => t.status === 'open').length}
            </span>
          </div>
          <div className="flex-1 overflow-y-auto no-scrollbar">
             {tickets.length === 0 ? (
               <div className="p-12 text-center text-teal-400/50 text-xs font-bold uppercase py-20">
                 No active support tickets.
               </div>
             ) : (
               tickets.map(ticket => (
                <button 
                  key={ticket.id} 
                  onClick={() => setSelectedTicket(ticket)}
                  className={`w-full text-left p-4 border-b border-white/5 transition-all flex items-center gap-3 ${selectedTicket?.id === ticket.id ? 'bg-white/10 border-l-4 border-l-emerald-500 pl-3' : 'hover:bg-white/5'}`}
                >
                   <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${selectedTicket?.id === ticket.id ? 'bg-emerald-500 text-white' : 'bg-white/5 text-teal-400'}`}>
                      <User size={18} />
                   </div>
                   <div className="flex-1 overflow-hidden">
                      <div className="flex justify-between items-center mb-0.5">
                         <span className={`text-sm font-black truncate ${selectedTicket?.id === ticket.id ? 'text-white' : 'text-teal-100'}`}>{ticket.username || 'Anonymous'}</span>
                         <span className="text-[8px] text-teal-400 font-bold uppercase">
                           {ticket.updatedAt?.seconds ? new Date(ticket.updatedAt.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                         </span>
                      </div>
                      <p className={`text-[10px] truncate ${selectedTicket?.id === ticket.id ? 'text-emerald-400' : 'text-teal-400'}`}>{ticket.lastMessage || '...'}</p>
                   </div>
                </button>
               ))
             )}
          </div>
        </div>

        {/* Chat Window */}
        <div className="md:col-span-2 bg-[#0d9488] rounded-[32px] border border-white/10 shadow-xl flex flex-col h-[600px] overflow-hidden">
           {selectedTicket ? (
             <>
               {/* Chat Header */}
               <div className="p-6 border-b border-white/5 flex items-center justify-between bg-black/10 z-10">
                  <div className="flex items-center gap-4">
                     <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-white">
                        <User size={24} />
                     </div>
                     <div>
                        <h4 className="text-sm font-black text-white uppercase tracking-tight">{selectedTicket.username}</h4>
                        <div className="flex items-center gap-2 mt-0.5">
                           <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div>
                           <p className="text-[10px] font-bold text-teal-400 uppercase tracking-widest">Active ID: {selectedTicket.userId}</p>
                        </div>
                     </div>
                  </div>
                  <div className="flex gap-2">
                     <button 
                        onClick={() => closeTicket(selectedTicket.id)}
                        className="p-2 text-rose-400 hover:bg-rose-500/20 rounded-xl transition-all"
                        title="Close Ticket"
                     >
                        <Ban size={20} />
                     </button>
                  </div>
               </div>

               {/* Chat Messages */}
               <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-black/10 no-scrollbar">
                  {selectedTicket.messages?.map((msg: any) => (
                    <div key={msg.id} className={`flex ${msg.sender === 'agent' ? 'justify-end' : 'justify-start'}`}>
                       <div className={`max-w-[70%] p-4 rounded-2xl text-sm shadow-lg ${msg.sender === 'agent' ? 'bg-[#0a4a44] text-white rounded-tr-none border border-emerald-500/20' : 'bg-white/5 text-white border border-white/10 rounded-tl-none'}`}>
                          <p className="font-medium leading-relaxed">{msg.text}</p>
                          <div className={`text-[8px] mt-2 font-bold uppercase ${msg.sender === 'agent' ? 'text-teal-400 text-right' : 'text-teal-500'}`}>
                             {msg.time}
                          </div>
                       </div>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
               </div>

               {/* Chat Footer */}
               <div className="p-6 border-t border-white/5 bg-black/20">
                  <form onSubmit={handleSendReply} className="flex gap-4">
                     <input 
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Type your reply to the user..."
                        className="flex-1 bg-black/20 border border-white/10 rounded-2xl px-6 py-4 text-sm font-bold text-white focus:outline-none focus:border-emerald-500 shadow-inner"
                     />
                     <button 
                        type="submit"
                        disabled={!replyText.trim() || isSending}
                        className="px-8 bg-emerald-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-teal-600 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                     >
                        {isSending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                     </button>
                  </form>
               </div>
             </>
           ) : (
             <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-6">
                <div className="w-24 h-24 bg-white/5 rounded-[40px] flex items-center justify-center text-teal-400/50 shadow-inner">
                   <MessageSquare size={40} />
                </div>
                <div>
                   <h3 className="text-xl font-black text-white uppercase tracking-tight">Select a conversation</h3>
                   <p className="text-sm font-bold text-teal-400 mt-2 max-w-xs mx-auto">Click on a user profile from the sidebar to view their messages and respond to their inquiries.</p>
                </div>
             </div>
           )}
        </div>
      </div>
    </div>
  );
}
