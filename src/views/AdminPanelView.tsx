import React, { useState, useEffect, useRef } from 'react';
import { db, auth } from '../services/firebase';
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
  arrayUnion,
  writeBatch,
  deleteDoc,
  where,
  limit,
  startAfter
} from 'firebase/firestore';
import { formatDisplayUID } from '../utils/idUtils';
import RetoolAdminSection from '../components/RetoolAdminSection';
import { 
  Users, 
  Database,
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
  Lock,
  Gift,
  Trash2,
  AlertCircle,
  Send,
  X,
  Bell,
  MessageCircle,
  Smartphone,
  ShieldCheck,
  History as HistoryIcon,
  Trash,
  Menu,
  ChevronLeft,
  ChevronRight,
  Power,
  Zap,
  TerminalSquare
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
import { GAME_LOGO_URLS } from '../constants/gameLogos';

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
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'deposits' | 'withdrawals' | 'games' | 'settings' | 'promo' | 'referrals' | 'support' | 'notifications' | 'maintenance' | 'logs' | 'retool'>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  const [users, setUsers] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [usersLastVisible, setUsersLastVisible] = useState<any>(null);
  const [trxsLastVisible, setTrxsLastVisible] = useState<any>(null);
  const [hasMoreUsers, setHasMoreUsers] = useState(true);
  const [hasMoreTrxs, setHasMoreTrxs] = useState(true);
  const PAGE_SIZE_USERS = 50;
  const PAGE_SIZE_TRXS = 50;
  
  const [trafficStats, setTrafficStats] = useState<any>(null);
  const [serverInfo, setServerInfo] = useState<any>(null);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [messagingUser, setMessagingUser] = useState<any>(null);
  const [bonusModalUser, setBonusModalUser] = useState<any>(null);
  const [messageText, setMessageText] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  const [isRefreshingData, setIsRefreshingData] = useState(false);

  const isUserAdmin = props.userData?.role === 'admin' || props.userData?.isAdmin === true || props.userData?.email === 'owner.css13@gmail.com' || props.userData?.email === 'cutelegend7045@gmail.com' || props.userData?.email === 'xsaber7644@gmil.com' || props.userData?.id === 'vxjksOlXuChe3OjfYmpxBsJcwLH2';

  const fetchUsers = async (isFirstLoad = true) => {
    if (!isUserAdmin) return;
    if (isFirstLoad) setIsRefreshingData(true);
    try {
      let q = query(
        collection(db, 'users'), 
        orderBy('createdAt', 'desc'),
        limit(PAGE_SIZE_USERS)
      );

      if (!isFirstLoad && usersLastVisible) {
        q = query(
          collection(db, 'users'), 
          orderBy('createdAt', 'desc'),
          startAfter(usersLastVisible),
          limit(PAGE_SIZE_USERS)
        );
      }

      const snapshot = await getDocs(q);
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      if (isFirstLoad) {
        setUsers(list);
      } else {
        setUsers(prev => [...prev, ...list]);
      }

      setUsersLastVisible(snapshot.docs[snapshot.docs.length - 1]);
      setHasMoreUsers(snapshot.docs.length === PAGE_SIZE_USERS);
    } catch (err) {
      console.error("Fetch users error:", err);
    } finally {
      if (isFirstLoad) setIsRefreshingData(false);
    }
  };

  const fetchTransactions = async (isFirstLoad = true) => {
    if (!isUserAdmin) return;
    if (isFirstLoad) setIsRefreshingData(true);
    try {
      let q = query(
        collection(db, 'transactions'), 
        orderBy('createdAt', 'desc'),
        limit(PAGE_SIZE_TRXS)
      );

      if (!isFirstLoad && trxsLastVisible) {
        q = query(
          collection(db, 'transactions'), 
          orderBy('createdAt', 'desc'),
          startAfter(trxsLastVisible),
          limit(PAGE_SIZE_TRXS)
        );
      }

      const snapshot = await getDocs(q);
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      if (isFirstLoad) {
        setTransactions(list);
      } else {
        setTransactions(prev => [...prev, ...list]);
      }

      setTrxsLastVisible(snapshot.docs[snapshot.docs.length - 1]);
      setHasMoreTrxs(snapshot.docs.length === PAGE_SIZE_TRXS);
    } catch (err) {
      console.error("Fetch transactions error:", err);
    } finally {
      if (isFirstLoad) setIsRefreshingData(false);
    }
  };

  const fetchAdminData = async () => {
    if (!isUserAdmin) return;
    setIsRefreshingData(true);
    try {
      await Promise.all([
        fetchUsers(true),
        fetchTransactions(true),
        fetch('/api/server-info').then(res => res.json()).then(setServerInfo).catch(() => {})
      ]);

      // Restore simulated traffic stats
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
    } catch (error: any) {
      console.error("Admin data fetch error:", error);
      if (error.message.includes('Quota')) {
        showToast("সিস্টেম লিমিট শেষ হয়েছে! কিছুক্ষণ পর আবার চেষ্টা করুন।", "error");
      }
    } finally {
      setIsRefreshingData(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
    
    // Auto refresh every 15 minutes if tab is active (reduced from 5 to save quota)
    const interval = setInterval(fetchAdminData, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, [props.userData]);

  const handleApproveTrx = async (trx: any) => {
    if (trx.status !== 'pending') return;
    setIsLoading(true);
    try {
      const batch = writeBatch(db);
      const userRef = doc(db, 'users', trx.userId);
      const trxRef = doc(db, 'transactions', trx.id);
      const userTrxRef = doc(db, 'users', trx.userId, 'transactions', trx.id);

      const userSnap = await getDoc(userRef);

      if (trx.type === 'deposit') {
        const depositAmount = Number(trx.amount);
        batch.update(userRef, {
          balance: increment(depositAmount),
          requiredTurnover: increment(depositAmount),
          totalDeposits: increment(depositAmount),
          updatedAt: serverTimestamp()
        });

        // Handle Referral Bonus
        if (userSnap.exists()) {
          const userData = userSnap.data();
          if (userData.referredBy) {
            const bonusAmount = depositAmount * 0.1; // 10% bonus
            const referrerRef = doc(db, 'users', userData.referredBy);
            
            batch.update(referrerRef, {
              balance: increment(bonusAmount),
              requiredTurnover: increment(bonusAmount),
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
            batch.set(newBonusRef, bonusTrxData);
            batch.set(doc(db, 'users', userData.referredBy, 'transactions', newBonusRef.id), bonusTrxData);
          }
        }
      } else if (trx.type === 'withdrawal') {
        const withdrawalAmount = Math.abs(Number(trx.amount));
        batch.update(userRef, {
          totalWithdrawals: increment(withdrawalAmount),
          updatedAt: serverTimestamp()
        });
      }

      const updates = { status: 'approved', approvedAt: serverTimestamp() };
      batch.update(trxRef, updates);
      
      // Update in subcollection as well
      batch.set(userTrxRef, updates, { merge: true });

      // Notify user
      const notifRef = doc(collection(db, 'users', trx.userId, 'notifications'));
      batch.set(notifRef, {
        title: trx.type === 'deposit' ? 'ডিপোজিট সফল' : 'উত্তোলন সফল',
        message: trx.type === 'deposit' 
          ? `আপনার ৳${trx.amount} ডিপোজিট সফলভাবে সম্পন্ন হয়েছে।` 
          : `আপনার ৳${Math.abs(trx.amount)} উত্তোলন সফলভাবে সম্পন্ন হয়েছে।`,
        type: 'account',
        read: false,
        createdAt: serverTimestamp()
      });

      // System Log
      const logRef = doc(collection(db, 'system_logs'));
      batch.set(logRef, {
        type: 'transaction',
        action: `approved_${trx.type}`,
        details: { amount: trx.amount, userId: trx.userId, trxId: trx.trxId || trx.id },
        adminId: props.userData?.id || 'unknown',
        createdAt: serverTimestamp()
      });

      await batch.commit();
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
      const batch = writeBatch(db);
      const userRef = doc(db, 'users', trx.userId);
      const trxRef = doc(db, 'transactions', trx.id);
      const userTrxRef = doc(db, 'users', trx.userId, 'transactions', trx.id);

      if (trx.type === 'withdrawal') {
        const refundAmount = Math.abs(Number(trx.amount));
        // Refund balance
        batch.update(userRef, {
          balance: increment(refundAmount),
          updatedAt: serverTimestamp()
        });
      }

      const updates = { status: 'rejected', rejectedAt: serverTimestamp() };
      batch.update(trxRef, updates);

      // Notify user
      const notifRef = doc(collection(db, 'users', trx.userId, 'notifications'));
      batch.set(notifRef, {
        title: trx.type === 'deposit' ? 'ডিপোজিট রিজেক্টেড' : 'উত্তোলন রিজেক্টেড',
        message: trx.type === 'deposit' 
          ? `আপনার ৳${trx.amount} ডিপোজিট রিকোয়েস্ট রিজেক্ট করা হয়েছে।` 
          : `আপনার ৳${Math.abs(trx.amount)} উত্তোলন রিকোয়েস্ট রিজেক্ট করা হয়েছে।`,
        type: 'account',
        read: false,
        createdAt: serverTimestamp()
      });

      // Update in subcollection
      batch.set(userTrxRef, updates, { merge: true });
      
      // System Log
      const logRef = doc(collection(db, 'system_logs'));
      batch.set(logRef, {
        type: 'transaction',
        action: `rejected_${trx.type}`,
        details: { amount: trx.amount, userId: trx.userId, trxId: trx.trxId || trx.id },
        adminId: props.userData?.id || 'unknown',
        createdAt: serverTimestamp()
      });

      await batch.commit();
      showToast('Transaction Rejected', 'warning');
    } catch (err) {
      console.error("Rejection error:", err);
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
      // Refresh user list to reflect the balance change immediately
      fetchUsers(true);
    } catch (err) {
      showToast('Update failed', 'error');
    }
  };

  const handleDeleteAllUsers = async () => {
    if (!window.confirm('WARNING: Are you sure you want to delete ALL users from both Auth and Database? This action is absolutely irreversible.')) return;
    
    setIsLoading(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const response = await fetch('/api/admin/users/delete-all', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to delete users");

      showToast(`All ${data.count} users have been permanently deleted.`, 'success');
      fetchUsers(true);
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Failed to delete users', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('Are you sure you want to delete this user from Auth and Database?')) return;
    
    setIsLoading(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const response = await fetch('/api/admin/users/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ userId })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to delete user");

      showToast('User deleted successfully', 'success');
      setUsers(prev => prev.filter(u => u.id !== userId));
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Failed to delete user', 'error');
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

  const handleSendBonus = async (userId: string, amount: number, description: string) => {
    if (amount <= 0) return;
    setIsLoading(true);
    try {
      const batch = writeBatch(db);
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) throw new Error("User not found");
      const userData = userSnap.data();

      batch.update(userRef, {
        balance: increment(amount),
        requiredTurnover: increment(amount),
        updatedAt: serverTimestamp()
      });

      const bonusTrxData = {
        userId,
        username: userData.username || 'User',
        type: 'bonus',
        amount: amount,
        status: 'approved',
        description: description || 'Admin manual bonus',
        createdAt: serverTimestamp()
      };

      const trxRef = doc(collection(db, 'transactions'));
      batch.set(trxRef, bonusTrxData);
      
      // Also add to user subcollection
      batch.set(doc(db, 'users', userId, 'transactions', trxRef.id), bonusTrxData);

      await batch.commit();
      showToast(`৳${amount} bonus sent to ${userData.username}`, 'success');
      setBonusModalUser(null);
    } catch (err) {
      console.error(err);
      showToast('Failed to send bonus', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pendingDeposits = transactions.filter(t => t.type === 'deposit' && t.status === 'pending');
  const pendingWithdrawals = transactions.filter(t => t.type === 'withdrawal' && t.status === 'pending');

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, group: 'Main' },
    { id: 'retool', label: 'Admin Data', icon: Database, group: 'Main' },
    { id: 'users', label: 'Users', icon: Users, group: 'Management' },
    { id: 'deposits', label: 'Deposits', icon: Wallet, badge: pendingDeposits.length, group: 'Financial' },
    { id: 'withdrawals', label: 'Withdrawals', icon: DollarSign, badge: pendingWithdrawals.length, group: 'Financial' },
    { id: 'promo', label: 'Bonuses', icon: Gift, group: 'Management' },
    { id: 'referrals', label: 'Referrals', icon: UserPlus, group: 'Management' },
    { id: 'notifications', label: 'Push', icon: Bell, group: 'Communication' },
    { id: 'support', label: 'Support', icon: MessageSquare, group: 'Communication' },
    { id: 'games', label: 'Games', icon: Gamepad2, group: 'Settings' },
    { id: 'settings', label: 'System', icon: Settings, group: 'Settings' },
    { id: 'maintenance', label: 'Maintenance', icon: Trash, group: 'Settings' },
    { id: 'logs', label: 'System Logs', icon: TerminalSquare, group: 'Settings' }
  ];

  const groups = ['Main', 'Management', 'Financial', 'Communication', 'Settings'];

  return (
    <div className="flex h-screen bg-[#081a1a] overflow-hidden font-sans text-white">
      {/* Sidebar Navigation */}
      <aside 
        className={`${isSidebarOpen ? 'w-64 translate-x-0' : 'w-20 -translate-x-full lg:translate-x-0'} fixed lg:relative bg-[#061414] flex flex-col h-full z-50 border-r border-white/5 shrink-0 transition-all duration-300 ease-in-out`}
      >
        {/* Toggle Button */}
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="absolute -right-3 top-20 w-6 h-6 bg-[#16a374] rounded-full flex items-center justify-center text-white shadow-lg z-[60] border border-white/10 hover:scale-110 transition-transform"
        >
          {isSidebarOpen ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
        </button>

        {/* Logo Section */}
        <div className={`h-20 flex items-center ${isSidebarOpen ? 'px-6' : 'justify-center'} border-b border-white/5`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#16a374]/20 rounded-xl flex items-center justify-center text-emerald-400 shadow-inner border border-emerald-400/20">
              <Shield size={22} />
            </div>
            {isSidebarOpen && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex flex-col"
              >
                <span className="text-sm font-black tracking-tight text-white uppercase leading-none">Admin Panel</span>
                <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mt-1">Management</span>
              </motion.div>
            )}
          </div>
        </div>

        {/* Navigation Groups */}
        <nav className="flex-1 overflow-y-auto no-scrollbar py-6 space-y-8">
          {groups.map((group) => {
            const items = navItems.filter(i => i.group === group);
            if (items.length === 0) return null;

            return (
              <div key={group} className="px-3">
                {isSidebarOpen && (
                  <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-[10px] font-black text-teal-500/50 uppercase tracking-[0.2em] mb-4 px-3"
                  >
                    {group}
                  </motion.p>
                )}
                <div className="space-y-1">
                  {items.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id as any)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all relative group ${
                        activeTab === item.id 
                          ? 'bg-gradient-to-r from-[#16a374] to-[#10b981] text-white shadow-lg shadow-emerald-500/20' 
                          : 'text-teal-400/60 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <item.icon size={20} className={`shrink-0 ${activeTab === item.id ? 'animate-pulse' : ''}`} />
                      
                      {isSidebarOpen && (
                        <motion.span 
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="text-sm font-bold truncate"
                        >
                          {item.label}
                        </motion.span>
                      )}

                      {item.badge ? (
                        <div className={`absolute ${isSidebarOpen ? 'right-3' : 'top-1 right-1'} bg-rose-500 text-white text-[8px] font-black w-4 h-4 flex items-center justify-center rounded-full border-2 border-[#061414]`}>
                          {item.badge}
                        </div>
                      ) : null}

                      {!isSidebarOpen && (
                        <div className="absolute left-full ml-4 bg-[#0a4a44] text-white text-[10px] px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap font-black uppercase tracking-widest shadow-xl border border-white/10 z-[70]">
                          {item.label}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </nav>

        {/* Bottom Actions */}
        <div className="p-3 border-t border-white/5">
          <button 
            onClick={onBack}
            className={`w-full flex items-center gap-3 p-3 rounded-xl text-rose-400 hover:bg-rose-500/10 transition-all group relative ${!isSidebarOpen ? 'justify-center' : ''}`}
          >
            <LogOut size={20} />
            {isSidebarOpen && <span className="text-sm font-bold">Exit Dashboard</span>}
            {!isSidebarOpen && (
              <div className="absolute left-full ml-4 bg-[#0a4a44] text-white text-[10px] px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap font-black uppercase tracking-widest shadow-xl border border-white/10 z-[70]">
                Logout
              </div>
            )}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden bg-[#0a1f1f]">
        {/* Modern Header */}
        <header className="h-20 bg-[#061414]/50 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-4 md:px-8 shrink-0 z-40">
          <div className="flex items-center gap-3 md:gap-6">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="lg:hidden p-2 bg-white/5 rounded-xl border border-white/5 text-emerald-400 hover:bg-white/10 transition-colors"
            >
              <ChevronRight className={`transition-transform duration-300 ${isSidebarOpen ? 'rotate-180' : ''}`} size={20} />
            </button>
            <div className="flex flex-col">
              <h1 className="text-xl font-black text-white uppercase tracking-tight">
                {navItems.find(i => i.id === activeTab)?.label}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">System Live</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <button 
              onClick={fetchAdminData}
              disabled={isRefreshingData}
              className={`p-3 bg-white/5 rounded-2xl border border-white/5 text-teal-400 hover:bg-white/10 transition-all flex items-center gap-2 group ${isRefreshingData ? 'opacity-50' : ''}`}
            >
              <RefreshCw size={18} className={isRefreshingData ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'} />
              <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Refresh Data</span>
            </button>
            <div className="flex items-center gap-3 px-4 py-2 bg-white/5 rounded-2xl border border-white/5">
              <div className="text-right">
                <p className="text-xs font-black text-white uppercase tracking-tight">{userData?.username || 'Admin'}</p>
                <p className="text-[9px] font-bold text-[#16a374] uppercase tracking-widest">Administrator</p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-xl flex items-center justify-center text-white shadow-lg overflow-hidden border border-white/20">
                {userData?.profilePictureUrl ? (
                  <img src={userData.profilePictureUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <img src="https://www.image2url.com/r2/default/images/1779828873931-409cfe92-d243-4926-91bd-67da3a1e0adc.png" alt="" className="w-full h-full object-cover" />
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 no-scrollbar">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'dashboard' && <DashboardOverview stats={trafficStats} serverInfo={serverInfo} users={users} transactions={transactions} />}
              {activeTab === 'retool' && <RetoolAdminSection showToast={showToast} />}
              {activeTab === 'users' && (
                <UserManagement 
                  users={filteredUsers} 
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  onToggleBan={handleToggleUserBan}
                  onAdjustBalance={handleAdjustBalance}
                  onSendBonus={(user: any) => setBonusModalUser(user)}
                  onUpdateRole={handleUpdateRole}
                  onSelectUser={setSelectedUser}
                  onMessageUser={setMessagingUser}
                  onAddUser={props.onAddUser}
                  onDeleteUser={handleDeleteUser}
                  onDeleteAllUsers={handleDeleteAllUsers}
                  hasMore={hasMoreUsers}
                  onLoadMore={() => fetchUsers(false)}
                  isLoading={isRefreshingData}
                />
              )}
              {activeTab === 'deposits' && (
                <TransactionList 
                  title="Deposit Requests"
                  trxs={transactions.filter(t => t.type === 'deposit')}
                  onApprove={handleApproveTrx}
                  onReject={handleRejectTrx}
                  isLoading={isRefreshingData}
                  hasMore={hasMoreTrxs}
                  onLoadMore={() => fetchTransactions(false)}
                />
              )}
              {activeTab === 'withdrawals' && (
                <TransactionList 
                  title="Withdrawal Requests"
                  trxs={transactions.filter(t => t.type === 'withdrawal')}
                  onApprove={handleApproveTrx}
                  onReject={handleRejectTrx}
                  isLoading={isRefreshingData}
                  hasMore={hasMoreTrxs}
                  onLoadMore={() => fetchTransactions(false)}
                />
              )}
              {activeTab === 'games' && <GameManagement {...props} />}
              {activeTab === 'settings' && <GlobalSettings {...props} />}
              {activeTab === 'promo' && <PromoManagement showToast={showToast} userData={userData} />}
              {activeTab === 'referrals' && <ReferralBoard users={users} transactions={transactions} />}
              {activeTab === 'notifications' && <NotificationManagement showToast={showToast} users={users} />}
              {activeTab === 'support' && <SupportInbox showToast={showToast} userData={props.userData} />}
              {activeTab === 'maintenance' && <MaintenanceTab showToast={showToast} />}
              {activeTab === 'logs' && <SystemLogsTab showToast={showToast} />}
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

      {/* Manual Bonus Modal */}
      <AnimatePresence>
        {bonusModalUser && (
          <AddBonusModal 
            user={bonusModalUser}
            onClose={() => setBonusModalUser(null)}
            onSendBonus={handleSendBonus}
            isLoading={isLoading}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function AddBonusModal({ user, onClose, onSendBonus, isLoading }: any) {
  const [amount, setAmount] = useState<number>(100);
  const [desc, setDesc] = useState('Manual bonus from admin');

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-[#0d9488] w-full max-w-md rounded-[40px] shadow-2xl relative overflow-hidden border border-white/10"
      >
        <div className="p-8 border-b border-white/5 flex items-center justify-between">
          <h3 className="text-xl font-black text-white uppercase tracking-tight">Send User Bonus</h3>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-2xl text-teal-100">
            <X size={24} />
          </button>
        </div>
        <div className="p-8 space-y-6">
          <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
            <p className="text-[10px] font-black text-teal-400 uppercase tracking-widest mb-1">Target User</p>
            <p className="text-lg font-black text-white">{user.username}</p>
          </div>
          
          <div className="space-y-2">
            <label className="text-[10px] font-black text-teal-200 uppercase tracking-widest ml-1">Bonus Amount (৳)</label>
            <div className="relative">
              <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-teal-400" size={18} />
              <input 
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full bg-black/20 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white font-black outline-none focus:border-emerald-500"
                placeholder="500"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-teal-200 uppercase tracking-widest ml-1">Notes / Reason</label>
            <input 
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              className="w-full bg-black/20 border border-white/10 rounded-2xl py-4 px-5 text-white font-bold outline-none focus:border-emerald-500"
              placeholder="Good player bonus..."
            />
          </div>

          <button 
            disabled={isLoading || amount <= 0}
            onClick={() => onSendBonus(user.id, amount, desc)}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white h-16 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all active:scale-95"
          >
            {isLoading ? <Loader2 className="animate-spin" /> : <Gift size={20} />}
            Send Bonus Now
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function DashboardOverview({ stats, users, transactions, serverInfo }: any) {
  const totalBalance = users.reduce((acc: number, u: any) => acc + (u.balance || 0), 0);
  const totalDeposits = transactions.filter((t: any) => t.type === 'deposit' && t.status === 'approved').reduce((acc: number, t: any) => acc + (Number(t.amount) || 0), 0);
  const totalWithdrawals = transactions.filter((t: any) => t.type === 'withdrawal' && t.status === 'approved').reduce((acc: number, t: any) => acc + (Number(t.amount) || 0), 0);
  const netProfit = totalDeposits - totalWithdrawals;

  // Process transactions for daily revenue trend
  const revenueData = React.useMemo(() => {
    const days = 14;
    const data: Record<string, { name: string, deposit: number, withdrawal: number, dateObj: Date }> = {};
    const now = new Date();
    
    // Initialize last X days
    for (let i = 0; i < days; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateKey = d.toISOString().split('T')[0];
      data[dateKey] = {
        name: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        deposit: 0,
        withdrawal: 0,
        dateObj: d
      };
    }

    // Map transactions
    transactions.forEach((trx: any) => {
      if (trx.status !== 'approved') return;
      if (trx.type !== 'deposit' && trx.type !== 'withdrawal') return;
      
      let trxDate: Date;
      if (trx.createdAt?.toDate) {
        trxDate = trx.createdAt.toDate();
      } else if (trx.createdAt?.seconds) {
        trxDate = new Date(trx.createdAt.seconds * 1000);
      } else {
        trxDate = new Date(trx.createdAt);
      }

      const dateKey = trxDate.toISOString().split('T')[0];
      if (data[dateKey]) {
        if (trx.type === 'deposit') {
          data[dateKey].deposit += Number(trx.amount) || 0;
        } else if (trx.type === 'withdrawal') {
          data[dateKey].withdrawal += Math.abs(Number(trx.amount)) || 0;
        }
      }
    });

    return Object.values(data).sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());
  }, [transactions]);

  return (
    <div className="space-y-8">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard label="Total Users" value={users.length} icon={Users} color="bg-blue-600" />
        <MetricCard label="Total Deposits" value={`৳${totalDeposits.toLocaleString()}`} icon={ArrowUpRight} color="bg-emerald-600" />
        <MetricCard label="Total Withdraw" value={`৳${totalWithdrawals.toLocaleString()}`} icon={ArrowDownLeft} color="bg-rose-600" />
        <MetricCard label="Net Profit" value={`৳${netProfit.toLocaleString()}`} icon={DollarSign} color="bg-teal-600" />
        {serverInfo && (
           <div className="bg-[#0e2c2c] p-6 rounded-2xl border border-white/5 flex flex-col justify-between">
             <div className="flex justify-between items-start mb-4">
                 <p className="text-[10px] font-black text-teal-400 uppercase tracking-widest">Hostname</p>
                 <Shield className="text-emerald-500" size={18} />
             </div>
             <p className="text-lg font-black text-white truncate">{serverInfo.hostname}</p>
           </div>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 bg-[#0d9488] p-8 rounded-[32px] shadow-xl border border-white/5">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-2">
              <BarChart3 className="text-emerald-400" size={22} />
              Daily Revenue Trend (Deposit vs Withdrawal)
            </h3>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400"></div>
                <span className="text-[10px] font-bold text-teal-100 uppercase uppercase">Deposit</span>
              </div>
              <div className="flex items-center gap-1.5 ml-3">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-400"></div>
                <span className="text-[10px] font-bold text-teal-100 uppercase uppercase">Withdrawal</span>
              </div>
            </div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorDeposit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorWithdraw" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#99f6e4', fontWeight: 700 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#99f6e4', fontWeight: 700 }} tickFormatter={(val) => `৳${val}`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#061414', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.5)' }} 
                  itemStyle={{ color: '#fff' }}
                  labelStyle={{ color: '#5eead4', fontWeight: 900, fontSize: '12px', marginBottom: '8px' }}
                />
                <Area type="monotone" dataKey="deposit" stroke="#10b981" strokeWidth={4} fillOpacity={1} fill="url(#colorDeposit)" />
                <Area type="monotone" dataKey="withdrawal" stroke="#f43f5e" strokeWidth={4} fillOpacity={1} fill="url(#colorWithdraw)" />
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

function UserManagement({ users, searchQuery, setSearchQuery, onToggleBan, onAdjustBalance, onSendBonus, onUpdateRole, onSelectUser, onMessageUser, onAddUser, onDeleteUser, onDeleteAllUsers, hasMore, onLoadMore, isLoading }: any) {
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
                      <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-teal-300 shrink-0 overflow-hidden border border-white/10">
                        {user.profilePictureUrl ? (
                          <img src={user.profilePictureUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <img src="https://www.image2url.com/r2/default/images/1779828873931-409cfe92-d243-4926-91bd-67da3a1e0adc.png" alt="" className="w-full h-full object-cover" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-black text-white">{user.username}</p>
                        <p className="text-[10px] font-bold text-teal-400 font-mono tracking-tighter opacity-0 group-hover:opacity-100 transition-opacity uppercase">ID: {formatDisplayUID(user.id)}</p>
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
                      <button 
                         onClick={() => onSendBonus(user)}
                         className="p-2 hover:bg-white/10 text-amber-400 hover:text-white rounded-lg transition-all"
                         title="Manual Bonus"
                      >
                        <Gift size={18} />
                      </button>
                      <button 
                         onClick={() => onDeleteUser(user.id)}
                         className="p-2 hover:bg-rose-500/20 text-rose-400 rounded-lg transition-all"
                         title="Permanently Delete User"
                      >
                        <Trash2 size={18} />
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

      {hasMore && (
        <button
          onClick={onLoadMore}
          disabled={isLoading}
          className="w-full py-4 bg-white/5 rounded-2xl border border-white/10 text-teal-400 font-bold uppercase tracking-widest hover:bg-white/10 transition-all disabled:opacity-50 text-xs mt-4"
        >
          {isLoading ? <Loader2 className="animate-spin mx-auto" size={16} /> : 'Load More Users'}
        </button>
      )}
    </div>
  );
}

function UserEditModal({ user, onClose, onSave, onAdjustBalance }: any) {
  const [formData, setFormData] = useState({
    username: user.username || '',
    role: user.role || 'user',
    status: user.status || 'active',
    email: user.email || '',
    phone: user.phone || '',
    fullName: user.fullName || '',
    mobileNumber: user.mobileNumber || ''
  });
  const [adjustAmount, setAdjustAmount] = useState<number>(0);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-[#0d9488] w-full max-w-xl rounded-[40px] shadow-2xl relative overflow-hidden flex flex-col border border-white/10"
      >
        <div className="p-8 border-b border-white/5 flex items-center justify-between bg-black/10">
          <div>
            <h3 className="text-xl font-black text-white uppercase tracking-tight">Edit Profile & Details</h3>
            <p className="text-xs font-bold text-teal-300 uppercase tracking-widest mt-1">User ID: {user.id}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-2xl text-teal-100">
            <X size={24} />
          </button>
        </div>

        <div className="p-8 space-y-6 overflow-y-auto max-h-[75vh] no-scrollbar">
          {/* Stats Section */}
          <div className="grid grid-cols-2 gap-4">
             <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                <p className="text-[9px] font-black text-teal-400 uppercase tracking-widest mb-1">Total Balance</p>
                <p className="text-xl font-black text-emerald-400">৳{(user.balance || 0).toLocaleString()}</p>
             </div>
             <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                <p className="text-[9px] font-black text-teal-400 uppercase tracking-widest mb-1">Total Deposit</p>
                <p className="text-xl font-black text-white">৳{(user.totalDeposits || 0).toLocaleString()}</p>
             </div>
             <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                <p className="text-[9px] font-black text-teal-400 uppercase tracking-widest mb-1">Total Withdraw</p>
                <p className="text-xl font-black text-white">৳{(user.totalWithdrawals || 0).toLocaleString()}</p>
             </div>
             <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                <p className="text-[9px] font-black text-teal-400 uppercase tracking-widest mb-1">Last Withdraw</p>
                <p className="text-xl font-black text-white">৳{(user.lastWithdrawAmount || 0).toLocaleString()}</p>
             </div>
          </div>

          <div className="bg-amber-500/10 p-6 rounded-[32px] border border-amber-500/20 flex flex-col gap-4">
             <p className="text-xs font-black text-amber-200 uppercase tracking-widest text-center">Adjust Balance</p>
             <div className="flex gap-2">
                <div className="relative flex-1">
                  <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-teal-400" size={16} />
                  <input 
                    type="number"
                    placeholder="Enter amount..."
                    className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold font-mono outline-none focus:border-emerald-500 text-white"
                    onChange={(e) => setAdjustAmount(Number(e.target.value))}
                  />
                </div>
                <button 
                   onClick={() => onAdjustBalance(user.id, adjustAmount)}
                   className="px-6 bg-emerald-500 text-white rounded-2xl hover:bg-emerald-600 transition-all font-black text-xs uppercase shadow-lg shadow-emerald-500/20"
                >
                  Add
                </button>
                <button 
                   onClick={() => onAdjustBalance(user.id, -adjustAmount)}
                   className="px-6 bg-rose-500 text-white rounded-2xl hover:bg-rose-600 transition-all font-black text-xs uppercase shadow-lg shadow-rose-500/20"
                >
                  Sub
                </button>
             </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-white/10">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-teal-200 uppercase mb-2 ml-1">Username</label>
                <input 
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm font-bold text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-teal-200 uppercase mb-2 ml-1">Full Name</label>
                <input 
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm font-bold text-white focus:outline-none focus:border-emerald-500"
                  placeholder="Not set"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-teal-200 uppercase mb-2 ml-1">Email (Auth)</label>
                <input 
                  type="text"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm font-bold text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-teal-200 uppercase mb-2 ml-1">Mobile / Phone</label>
                <input 
                  type="text"
                  value={formData.phone || formData.mobileNumber}
                  onChange={(e) => setFormData({...formData, phone: e.target.value, mobileNumber: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm font-bold text-white focus:outline-none focus:border-emerald-500"
                  placeholder="017xxxxxxxx"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-teal-200 uppercase mb-2 ml-1">Role</label>
                <select 
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm font-bold text-white outline-none focus:border-emerald-500 appearance-none bg-[#062e24]"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                  <option value="agent">Agent</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-teal-200 uppercase mb-2 ml-1">Status</label>
                <select 
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm font-bold text-white outline-none focus:border-emerald-500 appearance-none bg-[#062e24]"
                >
                  <option value="active">Active</option>
                  <option value="banned">Banned</option>
                </select>
              </div>
            </div>

            {user.referredBy && (
              <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                 <p className="text-[10px] font-black text-teal-400 uppercase tracking-widest mb-1">Referred By (Uploader ID)</p>
                 <p className="text-sm font-black text-white">{user.referredBy}</p>
              </div>
            )}
          </div>
        </div>

        <div className="p-8 bg-black/20 border-t border-white/5 flex gap-4">
          <button 
             onClick={onClose}
             className="flex-1 bg-white/5 border border-white/10 text-teal-200 font-black py-4 rounded-2xl hover:bg-white/10 transition-all uppercase tracking-widest text-xs"
          >
            Cancel
          </button>
          <button 
             onClick={() => onSave(formData)}
             className="flex-1 bg-emerald-600 text-white font-black py-4 rounded-2xl hover:bg-emerald-700 transition-all uppercase tracking-widest text-xs shadow-xl shadow-emerald-600/20"
          >
            Save Changes
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function ReferralBoard({ users, transactions }: any) {
  const referrers = users.filter((u: any) => (u.totalReferralEarnings || 0) > 0 || users.some((child: any) => child.referredBy === u.id));
  
  const referralBonuses = transactions.filter((t: any) => t.type === 'referral_bonus');
  const totalPlatformEarnings = referralBonuses.reduce((acc: number, t: any) => acc + (t.amount || 0), 0);

  const topReferrers = [...users].sort((a, b) => (b.totalReferralEarnings || 0) - (a.totalReferralEarnings || 0)).slice(0, 10);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
         <MetricCard label="Total Refer Bonus Distributed" value={`৳${totalPlatformEarnings.toLocaleString()}`} icon={Gift} color="bg-indigo-600" />
         <MetricCard label="Active Referrers" value={topReferrers.filter(u => (u.totalReferralEarnings || 0) > 0).length} icon={Users} color="bg-violet-600" />
         <MetricCard label="Total Referrals" value={referralBonuses.length} icon={UserPlus} color="bg-fuchsia-600" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
         <div className="xl:col-span-2 bg-[#0d9488] rounded-[32px] border border-white/10 shadow-xl overflow-hidden">
            <div className="p-6 border-b border-white/5 bg-black/10">
               <h3 className="text-lg font-black text-white uppercase tracking-tight">Top Referrers</h3>
            </div>
            <div className="overflow-x-auto no-scrollbar">
               <table className="w-full text-left">
                  <thead>
                     <tr className="border-b border-white/5">
                        <th className="px-6 py-4 text-[10px] font-black text-teal-300 uppercase tracking-widest">User</th>
                        <th className="px-6 py-4 text-[10px] font-black text-teal-300 uppercase tracking-widest">Earnings</th>
                        <th className="px-6 py-4 text-[10px] font-black text-teal-300 uppercase tracking-widest">Friends Ref</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                     {topReferrers.map((u, idx) => (
                        <tr key={u.id} className="hover:bg-white/5 transition-colors">
                           <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                 <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-[10px] font-black">#{idx+1}</div>
                                 <div className="text-sm font-black text-white">{u.username}</div>
                              </div>
                           </td>
                           <td className="px-6 py-4 text-emerald-400 font-black">৳{(u.totalReferralEarnings || 0).toLocaleString()}</td>
                           <td className="px-6 py-4 text-white font-bold">
                              {users.filter((c: any) => c.referredBy === u.id).length}
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
         </div>

         <div className="bg-[#0d9488] rounded-[32px] border border-white/10 shadow-xl p-6">
            <h3 className="text-lg font-black text-white uppercase tracking-tight mb-6">Recent Refer Bonuses</h3>
            <div className="space-y-4">
               {referralBonuses.slice(0, 10).map((t: any) => (
                  <div key={t.id} className="bg-black/10 p-4 rounded-2xl border border-white/5">
                     <div className="flex justify-between items-start mb-2">
                        <p className="text-xs font-black text-white">{t.username || 'System Bonus'}</p>
                        <p className="text-sm font-black text-emerald-400">+৳{t.amount}</p>
                     </div>
                     <p className="text-[10px] font-bold text-teal-400 uppercase tracking-widest">{t.description}</p>
                  </div>
               ))}
               {referralBonuses.length === 0 && (
                  <div className="text-center py-10 text-teal-400/50 text-xs font-bold uppercase tracking-widest">
                     No referral bonuses yet.
                  </div>
               )}
            </div>
         </div>
      </div>
    </div>
  );
}


function TransactionList({ title, trxs, onApprove, onReject, isLoading, hasMore, onLoadMore }: any) {
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
                    <th className="px-6 py-4 text-[10px] font-black text-teal-300 uppercase tracking-widest">Details (TRX / Sender)</th>
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
                      <td className="px-6 py-4 text-[10px] text-teal-400 font-bold uppercase">
                        {trx.trxId || '---'} / {trx.senderNumber || '---'}
                      </td>
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

      {hasMore && (
        <button
          onClick={onLoadMore}
          disabled={isLoading}
          className="w-full py-4 bg-white/5 rounded-2xl border border-white/10 text-teal-400 font-bold uppercase tracking-widest hover:bg-white/10 transition-all disabled:opacity-50 text-xs mt-4"
        >
          {isLoading ? <Loader2 className="animate-spin mx-auto" size={16} /> : 'Load More Transactions'}
        </button>
      )}
    </div>
  );
}

function GameManagement(props: AdminPanelViewProps) {
  const [selectedProvider, setSelectedProvider] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Helper to parse 'rate:85;max_mult:100' safely with fallbacks
  const parseConfig = (configStr: string) => {
    let rate = 85;
    let max_mult = 100;
    if (configStr) {
      const parts = configStr.split(';');
      for (const part of parts) {
        const [key, val] = part.split(':');
        if (key === 'rate') {
          const parsed = parseInt(val, 10);
          if (!isNaN(parsed)) rate = parsed;
        } else if (key === 'max_mult') {
          const parsed = parseInt(val, 10);
          if (!isNaN(parsed)) max_mult = parsed;
        }
      }
    }
    return { rate, max_mult };
  };

  const updateConfig = async (gameId: string, updates: { rate?: number; max_mult?: number }) => {
    const currentStr = props.globalOptions[gameId] || '';
    const current = parseConfig(currentStr);
    const newRate = updates.rate !== undefined ? updates.rate : current.rate;
    const newMaxMult = updates.max_mult !== undefined ? updates.max_mult : current.max_mult;
    const newStr = `rate:${newRate};max_mult:${newMaxMult}`;
    await props.updateGlobalGameOption(gameId, newStr);
  };

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
        {filteredGames.map(game => {
          const cfg = parseConfig(props.globalOptions[game.id] || '');
          return (
            <div key={game.id} className="bg-[#0d9488] p-6 rounded-[32px] border border-white/10 shadow-xl space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white/5 rounded-2xl overflow-hidden relative border border-white/10 group">
                  {(props.globalLogos[game.id] || GAME_LOGO_URLS[game.id] || game.image) ? (
                    <img src={props.globalLogos[game.id] || GAME_LOGO_URLS[game.id] || game.image} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                     <div className="w-full h-full flex items-center justify-center text-teal-300">
                        <ImageIcon size={24} />
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

              <div className="space-y-4 pt-2">
                <div>
                  <label className="text-[9px] font-black text-teal-200 uppercase tracking-widest block mb-1">গেম লিংক (External URL)</label>
                  <input 
                    defaultValue={props.globalUrls[game.id] || ''}
                    onBlur={(e) => props.updateGlobalGameUrl(game.id, e.target.value)}
                    className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-teal-100 focus:outline-none focus:border-emerald-500"
                    placeholder="https://..."
                  />
                </div>

                {/* Interactive Slider-based Win Rate Config (RTP) */}
                <div className="bg-black/10 p-3 rounded-2xl border border-white/5 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-black text-teal-200 uppercase tracking-widest select-none">উইন রেট (RTP)</span>
                    <span className="text-xs font-black text-amber-300 font-mono bg-amber-400/20 px-2 py-0.5 rounded-lg border border-amber-400/30">
                      {cfg.rate}%
                    </span>
                  </div>
                  
                  <input 
                    type="range"
                    min="0"
                    max="150"
                    value={cfg.rate}
                    onChange={(e) => updateConfig(game.id, { rate: parseInt(e.target.value, 10) })}
                    className="w-full h-1.5 bg-black/30 rounded-lg appearance-none cursor-pointer accent-amber-400"
                  />
                  
                  <div className="flex justify-between text-[8px] font-extrabold text-teal-300 select-none">
                    <span>০% (সব লস)</span>
                    <span>৮৫% (স্বাভাবিক)</span>
                    <span>১৫০% (হাই জ্যাকপট)</span>
                  </div>
                </div>

                {/* Maximum Multiplier Picker */}
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <span className="text-[9px] font-black text-teal-200 uppercase tracking-widest block mb-1">সর্বোচ্চ গুণক (Max Mult)</span>
                    <input 
                      type="number"
                      value={cfg.max_mult}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        updateConfig(game.id, { max_mult: isNaN(val) ? 100 : val });
                      }}
                      className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-1.5 text-xs font-bold text-teal-100 focus:outline-none focus:border-emerald-500 font-mono"
                      placeholder="100"
                    />
                  </div>
                  
                  <div className="w-[100px] flex flex-col items-end justify-center">
                    <span className="text-[9px] font-black text-teal-200 uppercase tracking-widest block mb-1 select-none">চালু / বন্ধ</span>
                    <button 
                      onClick={() => props.updateGlobalGameOption(`${game.id}_active`, props.globalOptions[`${game.id}_active`] === 'false' ? 'true' : 'false')}
                      className={`w-12 h-6 rounded-full relative transition-all ${props.globalOptions[`${game.id}_active`] !== 'false' ? 'bg-emerald-500' : 'bg-rose-500'}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${props.globalOptions[`${game.id}_active`] !== 'false' ? 'right-1' : 'left-1'}`} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
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
          const notifData = {
            title,
            message,
            type,
            url,
            read: false,
            createdAt: serverTimestamp()
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
        const notifData = {
          title,
          message,
          type,
          url,
          read: false,
          createdAt: serverTimestamp()
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
            <option value="promotion">Bonus Center</option>
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
  const [aviatorEnabled, setAviatorEnabled] = useState(false);
  const [aviatorCrashPoint, setAviatorCrashPoint] = useState(2.00);
  const [crashXEnabled, setCrashXEnabled] = useState(false);
  const [crashXCrashPoint, setCrashXCrashPoint] = useState(2.00);
  const [isSavingAviator, setIsSavingAviator] = useState(false);
  const [telegramStatus, setTelegramStatus] = useState<any>(null);

  useEffect(() => {
    const fetchTelegramStatus = async () => {
      try {
        const res = await fetch('/api/telegram/status');
        if (res.ok) {
          const data = await res.json();
          setTelegramStatus(data);
        }
      } catch (e) {}
    };
    fetchTelegramStatus();
  }, [props.globalImages]);

  useEffect(() => {
    const fetchAviatorOverride = async () => {
      try {
        const docSnap = await getDoc(doc(db, 'metadata', 'aviator_override'));
        if (docSnap.exists()) {
          const data = docSnap.data();
          setAviatorEnabled(!!data?.enabled);
          setAviatorCrashPoint(Number(data?.customCrashPoint) || 2.00);
        }
      } catch (err) {
        console.error("Load aviator override error:", err);
      }
    };
    fetchAviatorOverride();
  }, []);

  useEffect(() => {
    const fetchCrashXOverride = async () => {
      try {
        const docSnap = await getDoc(doc(db, 'metadata', 'crashx_override'));
        if (docSnap.exists()) {
          const data = docSnap.data();
          setCrashXEnabled(!!data?.enabled);
          setCrashXCrashPoint(Number(data?.customCrashPoint) || 2.00);
        }
      } catch (err) {
        console.error("Load crashx override error:", err);
      }
    };
    fetchCrashXOverride();
  }, []);

  const handleSaveAviatorOverride = async (enabledVal: boolean, pointVal: number) => {
    setIsSavingAviator(true);
    try {
      await setDoc(doc(db, 'metadata', 'aviator_override'), {
        enabled: enabledVal,
        customCrashPoint: Number(pointVal),
        updatedAt: serverTimestamp()
      }, { merge: true });
      
      // Trigger server-side sync immediately
      try {
        await fetch('/api/aviator/admin/sync-override', { method: 'POST' });
      } catch (fErr) {
        console.warn("Server sync trigger failed, but data was saved to Firestore");
      }
      
      props.showToast(`Aviator কন্ট্রোলার আপডেট করা হয়েছে! (সক্রিয়: ${enabledVal ? 'হ্যাঁ' : 'না'}, ক্র্যাশ পয়েন্ট: ${pointVal}x)`, 'success');
    } catch (err) {
      console.error("Aviator Override Save Failed:", err);
      props.showToast('সংরক্ষণ করতে ব্যর্থ হয়েছে!', 'error');
    } finally {
      setIsSavingAviator(false);
    }
  };

  const handleSaveCrashXOverride = async (enabledVal: boolean, pointVal: number) => {
    setIsSavingAviator(true); // Re-use saving state for UI feedback
    try {
      await setDoc(doc(db, 'metadata', 'crashx_override'), {
        enabled: enabledVal,
        customCrashPoint: Number(pointVal),
        updatedAt: serverTimestamp()
      }, { merge: true });
      
      try {
        await fetch('/api/crashx/admin/sync-override', { method: 'POST' });
      } catch (fErr) {}
      
      props.showToast(`Crash X কন্ট্রোলার আপডেট করা হয়েছে! (সক্রিয়: ${enabledVal ? 'হ্যাঁ' : 'না'}, ক্র্যাশ পয়েন্ট: ${pointVal}x)`, 'success');
    } catch (err) {
      console.error("CrashX Override Save Failed:", err);
      props.showToast('সংরক্ষণ করতে ব্যর্থ হয়েছে!', 'error');
    } finally {
      setIsSavingAviator(false);
    }
  };

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
              <label className="block text-xs font-bold text-teal-200 uppercase mb-2 ml-1">Platform Logo (App Icon)</label>
              <div className="flex items-center gap-4 bg-black/20 p-4 rounded-2xl border border-white/10">
                <div className="w-16 h-16 rounded-2xl bg-[#0d1a29] border border-white/10 overflow-hidden flex items-center justify-center shrink-0">
                  <img src={props.globalImages['app_logo'] || 'https://www.image2url.com/r2/default/images/1781024598371-46bd7cc9-4b5f-49cd-b4b3-60d4d200534a.png'} alt="Logo" className="w-full h-full object-contain" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <p className="text-[10px] font-bold text-teal-400 uppercase tracking-widest">Update platform brand identity</p>
                    <div className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md">
                      <Lock size={8} className="text-amber-500" />
                      <span className="text-[7px] font-black text-amber-500 uppercase">Super Owner Lock</span>
                    </div>
                  </div>
                  <label className="inline-flex items-center gap-2 bg-white/5 hover:bg-white/10 px-4 py-2 rounded-xl text-[10px] font-black text-white uppercase tracking-widest cursor-pointer transition-all border border-white/10">
                    <ImageIcon size={14} />
                    ছবি পরিবর্তন করুন (Change)
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (re) => {
                            if (props.updateGlobalImage) {
                              props.updateGlobalImage('app_logo', re.target?.result as string);
                            }
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                </div>
              </div>
            </div>
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
            <div>
              <label className="block text-xs font-bold text-teal-200 uppercase mb-2 ml-1">Telegram Bot Token (Notifications)</label>
              <div className="relative">
                <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-teal-400" size={20} />
                <input 
                  value={props.globalImages['telegram_bot_token'] || ''}
                  onChange={(e) => props.updateGlobalImage('telegram_bot_token', e.target.value)}
                  className="w-full bg-black/20 border border-white/10 rounded-2xl px-12 py-4 text-sm font-bold text-white focus:outline-none focus:border-emerald-500"
                  placeholder="123456789:ABCDEF..."
                />
                <button 
                  onClick={() => {
                    props.showToast('Please provide your own valid Bot Token from @BotFather', 'info');
                  }}
                  className="mt-2 text-[10px] font-bold text-teal-400 hover:text-teal-300 transition-colors flex items-center gap-1 ml-1"
                >
                  <AlertCircle size={10} />
                  How to get a token?
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-teal-200 uppercase mb-2 ml-1">Admin Chat ID (Notifications)</label>
              <div className="relative">
                <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-teal-400" size={20} />
                <input 
                  value={props.globalImages['telegram_admin_chat_id'] || ''}
                  onChange={(e) => props.updateGlobalImage('telegram_admin_chat_id', e.target.value)}
                  className="w-full bg-black/20 border border-white/10 rounded-2xl px-12 py-4 text-sm font-bold text-white focus:outline-none focus:border-emerald-500"
                  placeholder="-100123456789"
                />
                <button 
                  onClick={() => {
                    props.updateGlobalImage('telegram_admin_chat_id', "6543227982");
                    props.showToast('Chat ID reset to recommended default', 'info');
                  }}
                  className="mt-2 text-[10px] font-bold text-teal-400 hover:text-teal-300 transition-colors flex items-center gap-1 ml-1"
                >
                  <RefreshCw size={10} />
                  Reset to Recommended
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-teal-200 uppercase mb-2 ml-1">SMS Gateway Token (Verification)</label>
              <div className="relative">
                <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 text-teal-400" size={20} />
                <input 
                  value={props.globalImages['sms_gateway_token'] || ''}
                  onChange={(e) => props.updateGlobalImage('sms_gateway_token', e.target.value)}
                  className="w-full bg-black/20 border border-white/10 rounded-2xl px-12 py-4 text-sm font-bold text-white focus:outline-none focus:border-emerald-500"
                  placeholder="Paste your API Token here..."
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
                        setTelegramStatus(data);
                        console.log("Telegram Status:", data);
                        props.showToast(`Admin ID: ${data.configuredAdminId}`, 'info');
                        if (data.lastError) {
                          props.showToast('Error found. Check guidelines below.', 'error');
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

                {telegramStatus?.lastError && (
                  <div className="bg-rose-500/10 border border-rose-500/30 p-3 rounded-xl mb-4 text-xs text-rose-300 space-y-2">
                    <p className="font-bold flex items-center gap-1.5 text-rose-400">
                      <AlertCircle size={14} />
                      টেলিগ্রাম সংযোগ সমস্যা (Delivery Error):
                    </p>
                    <p className="bg-black/20 p-2 rounded-lg text-[11px] font-mono leading-relaxed text-slate-300 break-words">
                      <b>ডিভাইস/চ্যাট আইডি:</b> {telegramStatus.lastError.targetChatId || 'Unknown'} <br/>
                      <b>সমস্যা (Reason):</b> {telegramStatus.lastError.data?.description || 'chat not found'}
                    </p>
                    <div className="text-[11px] space-y-1.5 pl-1.5 pt-1 text-slate-300">
                      <p className="font-semibold text-teal-400 text-left">এটি কীভাবে সমাধান করবেন (Step-by-Step Fix):</p>
                      <ul className="list-disc list-inside space-y-1 text-slate-400 text-left">
                        <li><b>ধাপ ১:</b> আপনার টেলিগ্রাম বটে যান এবং তাকে <b>/start</b> অথবা একটি মেসেজ পাঠিয়ে চালু করুন। (বট আপনার মেসেজ না পেলে আপনাকে মেসেজ পাঠাতে পারবে না)</li>
                        <li><b>ধাপ ২:</b> লক্ষ্য রাখুন আপনি সঠিক <b>Admin Chat ID</b> এবং <b>Bot Token</b> দিয়েছেন কিনা।</li>
                        <li><b>ধাপ ৩:</b> আপনার বট যদি কোনো গ্রুপে মেসেজ পাঠাতে চায়, তবে বটকে অবশ্যই সেই গ্রুপে <b>Admin (এডমিন)</b> হিসেবে যুক্ত করতে হবে।</li>
                      </ul>
                    </div>
                  </div>
                )}

                {telegramStatus?.lastSuccess && !telegramStatus?.lastError && (
                  <div className="bg-emerald-500/10 border border-emerald-500/30 p-3 rounded-xl mb-4 text-xs text-emerald-300">
                    <p className="font-bold flex items-center gap-1.5 text-emerald-400">
                      <ShieldCheck size={14} />
                      টেলিগ্রাম সফলভাবে সংযুক্ত!
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      সর্বশেষ মেসেজ সফলভাবে প্রদান করা হয়েছে। ({new Date(telegramStatus.lastSuccess.timestamp).toLocaleString()})
                    </p>
                  </div>
                )}

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
                      
                      // Refresh status response
                      const statusRes = await fetch('/api/telegram/status');
                      const statusData = await statusRes.json();
                      setTelegramStatus(statusData);

                      if (response.ok) {
                        props.showToast('Test message sent! Check Telegram.', 'success');
                      } else {
                        const details = data.details?.response?.description || data.error || 'Unknown error';
                        props.showToast(`Error: ${details}`, 'error');
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
                  বট এই আইডিতে মেসেজ পাঠাবে: <span className="text-slate-300 select-all font-mono">{props.globalImages['telegram_admin_chat_id'] || 'Not Configured'}</span>
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

         <div className="space-y-6">
            <h3 className="text-[10px] font-black text-orange-500 uppercase tracking-[0.2em] border-b border-white/10 pb-2 flex items-center gap-2">
              <Zap size={14} className="animate-pulse" />
              Aviator Predictor Override (এভিয়েটর সিগন্যাল হ্যাক কন্ট্রোলার)
            </h3>
            
            <div className="bg-[#1a1410] p-6 rounded-[32px] border border-orange-500/20 shadow-2xl space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <label className="text-xs font-black text-white uppercase tracking-tight">সক্রিয় করুন (Enable Override)</label>
                  <p className="text-[10px] font-bold text-orange-400 uppercase tracking-widest">বট সিগন্যাল হ্যাক সক্রিয় করুন</p>
                </div>
                <button 
                  onClick={() => {
                    const nextVal = !aviatorEnabled;
                    setAviatorEnabled(nextVal);
                    handleSaveAviatorOverride(nextVal, aviatorCrashPoint);
                  }}
                  className={`w-14 h-7 rounded-full relative transition-all shadow-inner ${aviatorEnabled ? "bg-orange-500 ring-4 ring-orange-500/20" : "bg-white/10"}`}
                >
                  <div className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-md transition-all ${aviatorEnabled ? "right-1" : "left-1"}`} />
                </button>
              </div>

              <div className="space-y-3">
                 <div className="flex justify-between items-center">
                    <label className="text-xs font-black text-white uppercase tracking-tight">ক্র্যাশ পয়েন্ট সেট করুন (Set Crash Point)</label>
                    <div className="px-4 py-2 bg-orange-500/20 rounded-xl border border-orange-500/30 text-orange-400 font-mono font-black text-lg">
                       {aviatorCrashPoint}x
                    </div>
                 </div>
                 
                 <div className="relative pt-4">
                    <input 
                      type="range"
                      min="1.00"
                      max="100.00"
                      step="0.01"
                      value={aviatorCrashPoint}
                      onChange={(e) => setAviatorCrashPoint(Number(e.target.value))}
                      onMouseUp={() => handleSaveAviatorOverride(aviatorEnabled, aviatorCrashPoint)}
                      className="w-full h-2 bg-black/40 rounded-lg appearance-none cursor-pointer accent-orange-500"
                    />
                    <div className="flex justify-between text-[8px] font-black text-orange-500 uppercase tracking-widest mt-2 px-1">
                      <span>1.0x (Instant)</span>
                      <span>10.0x (Medium)</span>
                      <span>100.0x (Jackpot)</span>
                    </div>
                 </div>
              </div>

              <div className="bg-orange-500/5 border border-orange-500/10 p-4 rounded-2xl">
                 <div className="flex items-start gap-3">
                    <ShieldCheck size={18} className="text-orange-500 shrink-0 mt-0.5" />
                    <p className="text-[10px] font-bold text-orange-300 leading-relaxed">
                      এই অপশনটি চালু করলে এভিয়েটর গেমটি (Aviator) আপনার সেট করা পয়েন্ট ঠিক সেই মুহূর্তে ক্র্যাশ হবে। এটি সিগন্যাল হ্যাক হিসেবে ব্যবহার করা হয়।
                    </p>
                 </div>
              </div>
            </div>
          </div>
       </div>

    </div>
  );
}

function PromoManagement({ showToast, userData }: { showToast: any, userData: any }) {
  const [promoCodes, setPromoCodes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [newPromo, setNewPromo] = useState({ code: '', amount: 0, maxUses: 100, expireDays: 7, active: true });

  useEffect(() => {
    if (userData?.role !== 'admin' && userData?.isAdmin !== true) return;
    
    const unsub = onSnapshot(query(collection(db, 'promo_codes'), limit(100)), (snapshot) => {
      setPromoCodes(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return unsub;
  }, [userData]);

  const handleCreatePromo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPromo.code || newPromo.amount <= 0) return;
    setIsLoading(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const response = await fetch('/api/promo/create', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          code: newPromo.code.toUpperCase(),
          amount: newPromo.amount,
          maxUses: newPromo.maxUses,
          expireDays: newPromo.expireDays,
          active: newPromo.active
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to create promo code");

      showToast('Promo code created!', 'success');
      setNewPromo({ code: '', amount: 0, maxUses: 100, expireDays: 7, active: true });
    } catch (err: any) {
      showToast(err.message || 'Failed to create promo code', 'error');
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

function MaintenanceTab({ showToast }: { showToast: any }) {
  const [isCleaning, setIsCleaning] = useState(false);
  const [currentStep, setCurrentStep] = useState("");

  const handleClearData = async () => {
    const confirmation = window.prompt(
      "⚠️ ডাটাবেস রিসেট অ্যালার্ট! ⚠️\n\n" +
      "এই অ্যাকশনটি সম্পাদন করলে সমস্ত প্লেয়ার একাউন্ট (অ্যাডমিন বাদে), ট্রানজেকশন, গেমের ইতিহাস চিরতরে মুছে যাবে!\n\n" +
      "ডাটাবেসটি স্থায়ীভাবে মুছে ফেলতে চাইলে নিচে ঠিক এভাবে 'CONFIRM_DELETE' টাইপ করুন:"
    );
    
    if (confirmation !== 'CONFIRM_DELETE') {
      showToast('ডাটাবেস ক্লিয়ার করা হয়নি! ভুল পাসওয়ার্ড দিয়েছেন।', 'error');
      return;
    }
    
    setIsCleaning(true);
    setCurrentStep("Initializing...");

    try {
      const collections = [
        'transactions', 'deposits', 'withdrawals', 'daily_rewards', 
        'support_tickets', 'slot_bets', 'otp_verifications', 'notifications', 
        'game_history', 'bets', 'promo_codes', 'user_sessions'
      ];

      for (const colName of collections) {
        setCurrentStep(`Cleaning ${colName}...`);
        try {
          const snap = await getDocs(collection(db, colName));
          const docs = snap.docs;
          if (docs.length === 0) continue;

          for (let i = 0; i < docs.length; i += 500) {
            const batch = writeBatch(db);
            const chunk = docs.slice(i, i + 500);
            chunk.forEach(doc => batch.delete(doc.ref));
            await batch.commit();
            setCurrentStep(`Deleted ${i + chunk.length}/${docs.length} from ${colName}`);
          }
        } catch (e) {
          console.warn(`Could not clear ${colName}:`, e);
        }
      }

      setCurrentStep("Identifying accounts to delete...");
      const usersSnap = await getDocs(collection(db, 'users'));
      const allUsers = usersSnap.docs;
      
      const targets = allUsers.filter(doc => {
        const data = doc.data();
        const isAdmin = 
          data.role === 'admin' || 
          data.username?.toLowerCase() === 'admin' || 
          data.email === 'owner.css13@gmail.com' ||
          data.email === 'cutelegend7045@gmail.com' ||
          data.role === 'agent';
        return !isAdmin;
      });

      if (targets.length > 0) {
        setCurrentStep(`Clearing sub-data for ${targets.length} users...`);
        // Process in smaller chunks to avoid overloading
        const chunkSize = 25;
        for (let i = 0; i < targets.length; i += chunkSize) {
          const chunk = targets.slice(i, i + chunkSize);
          setCurrentStep(`Deep cleaning users ${i + 1}-${Math.min(i + chunkSize, targets.length)}...`);
          
          await Promise.all(chunk.map(async (userDoc) => {
            const subCols = ['transactions', 'notifications', 'used_promos', 'bets'];
            for (const sub of subCols) {
              try {
                const subSnap = await getDocs(collection(db, 'users', userDoc.id, sub));
                if (!subSnap.empty) {
                  const subBatch = writeBatch(db);
                  subSnap.docs.forEach(d => subBatch.delete(d.ref));
                  await subBatch.commit();
                }
              } catch (e) {}
            }
          }));
        }

        setCurrentStep("Removing users...");
        for (let i = 0; i < targets.length; i += 500) {
          const batch = writeBatch(db);
          const chunk = targets.slice(i, i + 500);
          chunk.forEach(doc => batch.delete(doc.ref));
          await batch.commit();
          setCurrentStep(`Removed ${i + chunk.length}/${targets.length} users`);
        }
      }

      showToast(`System Cleaned! Removed ${targets.length} users and all associated data.`, 'success');
      setCurrentStep("");
    } catch (err: any) {
      console.error("Cleanup error:", err);
      showToast(`Cleanup failed: ${err.message}`, 'error');
    } finally {
      setIsCleaning(false);
      setCurrentStep("");
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 p-8">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-rose-500/10 border border-rose-500/20 rounded-[40px] p-10 text-center relative overflow-hidden"
      >
        <div className="w-20 h-20 bg-rose-500 rounded-[28px] flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-rose-500/30 transform rotate-3">
          <Trash size={40} className="text-white" />
        </div>
        <h2 className="text-3xl font-black text-white uppercase tracking-tight mb-3">Master Cleanup</h2>
        <p className="text-teal-200/60 text-sm font-medium mb-10 max-w-md mx-auto leading-relaxed">
           এই মাস্টার ক্লিনআপটি রান করলে আপনার গেম ডাটাবেস থেকে অ্যাডমিন বাদে সকল ইউজারের ডাটা এবং সকল লেনদেনের ইতিহাস চিরতরে মুছে যাবে।
        </p>

        <button 
          onClick={handleClearData}
          disabled={isCleaning}
          className={`w-full py-6 rounded-2xl font-black text-xs uppercase tracking-[0.4em] flex items-center justify-center gap-4 transition-all ${isCleaning ? 'bg-white/5 text-white/20 cursor-not-allowed' : 'bg-gradient-to-r from-rose-600 to-rose-700 text-white shadow-2xl shadow-rose-500/40 hover:scale-[1.01] active:scale-[0.99]'}`}
        >
          {isCleaning ? (
            <>
              <Loader2 className="animate-spin" size={20} />
              {currentStep || "Processing..."}
            </>
          ) : "Execute Master Cleanup"}
        </button>
      </motion.div>

      <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
        <h4 className="text-white font-bold mb-4 flex items-center gap-2">
          <AlertCircle size={18} className="text-rose-500" />
          Important Information
        </h4>
        <ul className="space-y-2 text-sm text-gray-400">
          <li>• Deletes all transaction records (Deposits, Withdrawals, History)</li>
          <li>• Deletes all non-admin user accounts</li>
          <li>• Clears all support tickets and notifications</li>
          <li>• This action is permanent and cannot be undone</li>
        </ul>
      </div>
    </div>
  );
}

function SupportInbox({ showToast, userData }: { showToast: any, userData: any }) {
  const [tickets, setTickets] = useState<any[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [replyText, setReplyText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsub = onSnapshot(query(collection(db, 'support_tickets'), orderBy('updatedAt', 'desc'), limit(100)), (snapshot) => {
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

function SystemLogsTab({ showToast }: { showToast: any }) {
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, 'system_logs'),
      orderBy('createdAt', 'desc'),
      limit(100)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const parsedLogs: any[] = [];
      snapshot.forEach(doc => {
        parsedLogs.push({ id: doc.id, ...doc.data() });
      });
      setLogs(parsedLogs);
      setIsLoading(false);
    }, (err) => {
      console.error(err);
      setIsLoading(false);
      showToast("Failed to fetch logs", "error");
    });

    return () => unsubscribe();
  }, [showToast]);

  const getLogIcon = (type: string) => {
    switch(type) {
      case 'transaction': return <DollarSign size={16} className="text-amber-400" />;
      case 'user': return <UserPlus size={16} className="text-blue-400" />;
      case 'game': return <Gamepad2 size={16} className="text-purple-400" />;
      case 'system': return <Settings size={16} className="text-emerald-400" />;
      default: return <Activity size={16} className="text-gray-400" />;
    }
  };

  const getLogColor = (type: string) => {
    switch(type) {
      case 'transaction': return 'bg-amber-500/10 border-amber-500/20';
      case 'user': return 'bg-blue-500/10 border-blue-500/20';
      case 'game': return 'bg-purple-500/10 border-purple-500/20';
      case 'system': return 'bg-emerald-500/10 border-emerald-500/20';
      default: return 'bg-gray-500/10 border-gray-500/20';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-5 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-white uppercase tracking-tight">System Logs</h2>
          <p className="text-sm font-bold text-teal-400 mt-2">Real-time critical event tracking</p>
        </div>
      </div>

      <div className="bg-black/20 backdrop-blur-xl border border-white/5 rounded-[40px] p-6 shadow-2xl relative overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center p-12">
            <Loader2 size={32} className="animate-spin text-teal-500" />
          </div>
        ) : logs.length > 0 ? (
          <div className="space-y-3">
            {logs.map((log) => (
              <div key={log.id} className={`flex items-center gap-4 p-4 rounded-2xl border ${getLogColor(log.type)}`}>
                <div className="w-10 h-10 rounded-xl bg-black/40 flex items-center justify-center shrink-0">
                  {getLogIcon(log.type)}
                </div>
                <div className="flex-1 min-w-0">
                   <div className="flex items-center justify-between gap-4 mb-1">
                      <p className="text-sm font-bold text-white truncate">{log.action}</p>
                      {log.createdAt && (
                        <p className="text-[10px] font-black text-teal-500/50 uppercase tracking-widest shrink-0">
                          {log.createdAt.toDate ? log.createdAt.toDate().toLocaleString() : new Date(log.createdAt).toLocaleString()}
                        </p>
                      )}
                   </div>
                   <p className="text-xs font-medium text-teal-400/70 truncate">
                      {log.details ? (typeof log.details === 'object' ? JSON.stringify(log.details) : String(log.details)) : 'No details provided.'}
                   </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center p-12">
            <TerminalSquare size={48} className="mx-auto text-white/10 mb-4" />
            <p className="text-sm font-bold text-white/50">No logs found</p>
          </div>
        )}
      </div>
    </div>
  );
}
