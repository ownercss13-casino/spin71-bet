import React, { useState, useEffect } from 'react';
import { db, auth, handleFirestoreError, OperationType } from '../../firebase';
import { collection, query, onSnapshot, doc, updateDoc, increment, deleteDoc, serverTimestamp, setDoc, orderBy, collectionGroup, where, limit } from 'firebase/firestore';
import { Settings, Users, History, Activity, Gift, Image as ImageIcon, Check, X, Trash2, Plus, Bot, Sparkles, KeyRound, LayoutDashboard, Bell, AlertCircle, CheckCircle2, MessageCircle, ChevronLeft, ArrowDownLeft, Bug, Zap, Clock, Globe, User as UserIcon } from 'lucide-react';
import AdminAIChat from './AdminAIChat';
import AdminChat from './AdminChat';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { createPromoCode, updateGlobalGameLogo, updateGlobalGameName, updateGlobalGameUrl, updateGlobalGameOption, updateGlobalAppSettings } from '../../services/firebaseService';
import { games as defaultGames } from '../GameGrid';

interface User {
  id: string;
  username: string;
  password?: string;
  email?: string;
  phone?: string;
  balance: number;
  role: string;
  ipAddress?: string;
  deposit?: number;
  withdrawal?: number;
  betting?: number;
}

const UserDetailModal = ({ user, onClose, onUpdate, showToast }: { user: User, onClose: () => void, onUpdate: (userId: string, data: Partial<User>) => void, showToast: (msg: string, type: 'success' | 'error') => void }) => {
  const [formData, setFormData] = useState<Partial<User>>(user);

  const fields: (keyof User)[] = ['username', 'password', 'email', 'phone', 'balance', 'deposit', 'withdrawal', 'betting', 'ipAddress', 'role'];

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[100] p-2">
      <div className="bg-gray-900 p-4 rounded-2xl w-full max-w-sm border border-white/10 max-h-[95vh] overflow-y-auto">
        <h2 className="text-lg font-bold mb-4 text-yellow-500">ইউজার এডিট: {user.username}</h2>
        <div className="space-y-2">
          {fields.map((key) => (
            <div key={key}>
              <label className="text-[10px] text-gray-400 uppercase font-bold">{key}</label>
              <input
                type={key === 'balance' || key === 'deposit' || key === 'withdrawal' || key === 'betting' ? 'number' : 'text'}
                value={formData[key] || ''}
                onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
                className="w-full bg-gray-800 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white"
              />
            </div>
          ))}
        </div>
        <div className="flex gap-2 mt-4">
          <button onClick={onClose} className="flex-1 bg-gray-700 py-2 rounded-lg font-bold text-sm">বাতিল</button>
          <button onClick={() => { onUpdate(user.id, formData); onClose(); }} className="flex-1 bg-yellow-500 text-black py-2 rounded-lg font-bold text-sm">সেভ করুন</button>
        </div>
      </div>
    </div>
  );
};

interface Transaction {
  id: string;
  userId: string;
  type: string;
  amount: number;
  timestamp: any;
}

interface PromoCode {
  id: string;
  amount: number;
  maxUses: number;
  usedCount: number;
  isActive: boolean;
  turnoverMultiplier: number;
}

interface LogoRequest {
  id: string;
  gameId: string;
  type: 'logo' | 'name';
  value: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedBy: string;
  requestedAt: any;
}

interface SystemAlert {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  read: boolean;
  timestamp: any;
}

export default function AdminPanel({ showToast, onBack }: { showToast: (msg: string, type: 'success' | 'error') => void, onBack?: () => void }) {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'transactions' | 'withdrawals' | 'analytics' | 'promos' | 'requests' | 'games' | 'settings' | 'api_tokens' | 'chat' | 'errors'>('dashboard');
  const [showAIChat, setShowAIChat] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [promos, setPromos] = useState<PromoCode[]>([]);
  const [requests, setRequests] = useState<LogoRequest[]>([]);
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [systemErrors, setSystemErrors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // App Settings State
  const [appSettings, setAppSettings] = useState({
    casinoName: '',
    telegramLink: '',
    whatsappLink: '',
    facebookLink: '',
    supportEmail: '',
    minDeposit: 100,
    minWithdraw: 500,
    welcomeBonus: 507,
    noticeText: ''
  });

  const [globalGameNames, setGlobalGameNames] = useState<Record<string, string>>({});
  const [globalGameLogos, setGlobalGameLogos] = useState<Record<string, string>>({});
  const [globalGameUrls, setGlobalGameUrls] = useState<Record<string, string>>({});
  const [globalGameOptions, setGlobalGameOptions] = useState<Record<string, string>>({});
  const [editingGame, setEditingGame] = useState<string | null>(null);
  const [editGameForm, setEditGameForm] = useState({ name: '', logo: '', url: '', provider: '' });

  // Promo Form State
  const [newPromo, setNewPromo] = useState({ code: '', amount: 500, maxUses: 100, turnover: 5 });

  const [apiTokens, setApiTokens] = useState<any[]>([]);
  const [newTokenName, setNewTokenName] = useState('');
  const [newTokenExpiration, setNewTokenExpiration] = useState('');
  const [showTokenForm, setShowTokenForm] = useState(false);

  useEffect(() => {
    const settingsPath = `global_config/app_settings`;
    const unsubscribeSettings = onSnapshot(doc(db, settingsPath), (docSnap) => {
      if (docSnap.exists()) {
        setAppSettings(docSnap.data() as any);
      }
    });

    const tokensQuery = query(collection(db, 'api_tokens'));
    const unsubscribeTokens = onSnapshot(tokensQuery, (snapshot) => {
      setApiTokens(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const usersQuery = query(collection(db, 'users'));
    const unsubscribeUsers = onSnapshot(usersQuery, (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
      setUsers(usersData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'users');
      showToast("ইউজার লোড করতে সমস্যা হয়েছে", "error");
    });

    const trxQuery = query(collectionGroup(db, 'transactions'));
    const unsubscribeTrx = onSnapshot(trxQuery, (snapshot) => {
      const trxData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
      setTransactions(trxData);
      
      // Filter pending withdrawals for the withdrawals tab
      const pendingWithdrawals = trxData.filter(t => t.type === 'withdraw' && (t as any).status === 'pending' || (t as any).status === 'প্রক্রিয়াধীন');
      setWithdrawals(pendingWithdrawals);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'transactions');
      showToast("ট্রানজেকশন লোড করতে সমস্যা হয়েছে", "error");
    });

    const promoQuery = query(collection(db, 'promo_codes'));
    const unsubscribePromos = onSnapshot(promoQuery, (snapshot) => {
      const promoData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PromoCode));
      setPromos(promoData);
    });

    const requestQuery = query(collection(db, 'logo_requests'));
    const unsubscribeRequests = onSnapshot(requestQuery, (snapshot) => {
      const requestData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LogoRequest));
      setRequests(requestData.filter(r => r.status === 'pending'));
    });

    const unsubscribeGameNames = onSnapshot(doc(db, 'global_config', 'game_names'), (docSnap) => {
      if (docSnap.exists()) setGlobalGameNames(docSnap.data());
    });
    const unsubscribeGameLogos = onSnapshot(doc(db, 'global_config', 'game_logos'), (docSnap) => {
      if (docSnap.exists()) setGlobalGameLogos(docSnap.data());
    });
    const unsubscribeGameUrls = onSnapshot(doc(db, 'global_config', 'game_urls'), (docSnap) => {
      if (docSnap.exists()) setGlobalGameUrls(docSnap.data());
    });
    const unsubscribeGameOptions = onSnapshot(doc(db, 'global_config', 'game_options'), (docSnap) => {
      if (docSnap.exists()) setGlobalGameOptions(docSnap.data());
    });

    const alertsQuery = query(collection(db, 'system_alerts'), orderBy('timestamp', 'desc'));
    const unsubscribeAlerts = onSnapshot(alertsQuery, (snapshot) => {
      setAlerts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SystemAlert)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'system_alerts');
    });

    const errorsQuery = query(collection(db, 'system_errors'), where('resolved', '==', false), orderBy('timestamp', 'desc'));
    const unsubscribeErrors = onSnapshot(errorsQuery, (snapshot) => {
      setSystemErrors(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'system_errors');
    });

    return () => {
      unsubscribeSettings();
      unsubscribeUsers();
      unsubscribeTrx();
      unsubscribePromos();
      unsubscribeRequests();
      unsubscribeGameNames();
      unsubscribeGameLogos();
      unsubscribeGameUrls();
      unsubscribeGameOptions();
      unsubscribeTokens();
      unsubscribeAlerts();
      unsubscribeErrors();
    };
  }, []);

  const handleUpdateUser = async (userId: string, data: Partial<User>) => {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, data as any);
      showToast("ইউজার আপডেট সফল হয়েছে", "success");
    } catch (error) {
      console.error("Error updating user:", error);
      showToast("ইউজার আপডেট করতে সমস্যা হয়েছে", "error");
    }
  };

  const handleResolveError = async (errorId: string) => {
    try {
      await updateDoc(doc(db, 'system_errors', errorId), { 
        resolved: true,
        resolvedAt: serverTimestamp(),
        resolvedBy: auth.currentUser?.email
      });
      showToast("এররটি সমাধান করা হয়েছে হিসেবে চিহ্নিত করা হয়েছে", "success");
    } catch (error) {
      console.error("Error resolving system error:", error);
      showToast("এরর আপডেট করতে সমস্যা হয়েছে", "error");
    }
  };

  const handleUpdateWithdrawalStatus = async (userId: string, transactionId: string, newStatus: string) => {
    try {
      const trxRef = doc(db, 'users', userId, 'transactions', transactionId);
      await updateDoc(trxRef, { 
        status: newStatus,
        statusColor: newStatus === 'approved' || newStatus === 'সম্পন্ন' ? 'text-green-500' : 'text-red-500'
      });
      showToast(`উত্তোলন অনুরোধ ${newStatus} করা হয়েছে`, "success");
    } catch (error) {
      console.error("Error updating withdrawal:", error);
      showToast("স্ট্যাটাস আপডেট করতে সমস্যা হয়েছে", "error");
    }
  };

  const handleUpdateRole = async (userId: string, newRole: string) => {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, { role: newRole });
      showToast(`ইউজার রোল '${newRole}' এ আপডেট হয়েছে`, "success");
    } catch (error) {
      console.error("Error updating role:", error);
      showToast("রোল আপডেট করতে সমস্যা হয়েছে", "error");
    }
  };

  const handleUpdateBalance = async (userId: string, amount: number) => {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, { balance: increment(amount) });
      showToast("ব্যালেন্স আপডেট সফল হয়েছে", "success");
    } catch (error) {
      console.error("Error updating balance:", error);
      showToast("ব্যালেন্স আপডেট করতে সমস্যা হয়েছে", "error");
    }
  };

  const analyticsData = users.slice(0, 10).map(u => ({ name: u.username, balance: u.balance }));

  const totalDeposits = transactions.filter(t => t.type === 'deposit').reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  const totalWithdrawals = transactions.filter(t => t.type === 'withdraw').reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  const totalBetting = transactions.filter(t => t.type === 'bet').reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  const handleMarkAlertAsRead = async (alertId: string) => {
    try {
      await updateDoc(doc(db, 'system_alerts', alertId), { read: true });
    } catch (error) {
      console.error("Error marking alert as read:", error);
      showToast("অ্যালার্ট আপডেট করতে সমস্যা হয়েছে", "error");
    }
  };

  const handleClearAllAlerts = async () => {
    try {
      const unreadAlerts = alerts.filter(a => !a.read);
      await Promise.all(unreadAlerts.map(a => updateDoc(doc(db, 'system_alerts', a.id), { read: true })));
      showToast("সব অ্যালার্ট পড়া হয়েছে হিসেবে মার্ক করা হয়েছে", "success");
    } catch (error) {
      showToast("অ্যালার্ট ক্লিয়ার করতে সমস্যা হয়েছে", "error");
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      {onBack && (
        <button onClick={onBack} className="flex items-center gap-2 text-yellow-500 mb-6 font-bold hover:text-yellow-400 transition-colors">
          <ChevronLeft size={20} /> ফিরে যান
        </button>
      )}
      <h1 className="text-3xl font-black italic mb-8">অ্যাডমিন প্যানেল</h1>
      
      <div className="flex gap-4 mb-8 overflow-x-auto pb-2 no-scrollbar">
        <button onClick={() => setActiveTab('dashboard')} className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 shrink-0 ${activeTab === 'dashboard' ? 'bg-yellow-500 text-black' : 'bg-gray-800'}`}>
          <LayoutDashboard size={20} /> ড্যাশবোর্ড
        </button>
        <button onClick={() => setActiveTab('users')} className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 shrink-0 ${activeTab === 'users' ? 'bg-yellow-500 text-black' : 'bg-gray-800'}`}>
          <Users size={20} /> ইউজার ম্যানেজমেন্ট
        </button>
        <button onClick={() => setActiveTab('transactions')} className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 shrink-0 ${activeTab === 'transactions' ? 'bg-yellow-500 text-black' : 'bg-gray-800'}`}>
          <History size={20} /> ট্রানজেকশন হিস্ট্রি
        </button>
        <button onClick={() => setActiveTab('withdrawals')} className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 shrink-0 ${activeTab === 'withdrawals' ? 'bg-yellow-500 text-black' : 'bg-gray-800'}`}>
          <ArrowDownLeft size={20} /> উত্তোলন অনুরোধ {withdrawals.length > 0 && <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{withdrawals.length}</span>}
        </button>
        <button onClick={() => setActiveTab('promos')} className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 shrink-0 ${activeTab === 'promos' ? 'bg-yellow-500 text-black' : 'bg-gray-800'}`}>
          <Gift size={20} /> প্রোমো কোড
        </button>
        <button onClick={() => setActiveTab('requests')} className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 shrink-0 ${activeTab === 'requests' ? 'bg-yellow-500 text-black' : 'bg-gray-800'}`}>
          <ImageIcon size={20} /> লোগো রিকোয়েস্ট {requests.length > 0 && <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{requests.length}</span>}
        </button>
        <button onClick={() => setActiveTab('analytics')} className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 shrink-0 ${activeTab === 'analytics' ? 'bg-yellow-500 text-black' : 'bg-gray-800'}`}>
          <Activity size={20} /> অ্যানালিটিক্স
        </button>
        <button onClick={() => setActiveTab('games')} className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 shrink-0 ${activeTab === 'games' ? 'bg-yellow-500 text-black' : 'bg-gray-800'}`}>
          <Plus size={20} /> গেম সেটিংস
        </button>
        <button onClick={() => setActiveTab('errors')} className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 shrink-0 ${activeTab === 'errors' ? 'bg-yellow-500 text-black' : 'bg-gray-800'}`}>
          <Bug size={20} /> সিস্টেম এরর {systemErrors.length > 0 && <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{systemErrors.length}</span>}
        </button>
        <button onClick={() => setActiveTab('settings')} className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 shrink-0 ${activeTab === 'settings' ? 'bg-yellow-500 text-black' : 'bg-gray-800'}`}>
          <Settings size={20} /> অ্যাপ সেটিংস
        </button>
        <button onClick={() => setActiveTab('api_tokens')} className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 shrink-0 ${activeTab === 'api_tokens' ? 'bg-yellow-500 text-black' : 'bg-gray-800'}`}>
          <KeyRound size={20} /> API Tokens
        </button>
        <button onClick={() => setActiveTab('chat')} className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 shrink-0 ${activeTab === 'chat' ? 'bg-yellow-500 text-black' : 'bg-gray-800'}`}>
          <MessageCircle size={20} /> চ্যাট
        </button>
        <button 
          onClick={() => setShowAIChat(true)} 
          className="px-6 py-3 rounded-xl font-bold flex items-center gap-2 shrink-0 bg-gradient-to-r from-teal-600 to-blue-600 text-white shadow-lg shadow-teal-500/20 hover:scale-105 transition-all"
        >
          <Bot size={20} /> AI Assistant
        </button>
      </div>

      <AdminAIChat isOpen={showAIChat} onClose={() => setShowAIChat(false)} />

      {activeTab === 'chat' && (
        <AdminChat showToast={showToast} />
      )}

      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gray-900 p-6 rounded-2xl border border-white/10">
                  <p className="text-gray-400 text-xs uppercase font-bold">Total Users</p>
                  <p className="text-2xl font-black mt-1">{users.length}</p>
                </div>
                <div className="bg-gray-900 p-6 rounded-2xl border border-white/10">
                  <p className="text-gray-400 text-xs uppercase font-bold">Total Deposits</p>
                  <p className="text-2xl font-black mt-1 text-green-400">৳{totalDeposits}</p>
                </div>
                <div className="bg-gray-900 p-6 rounded-2xl border border-white/10">
                  <p className="text-gray-400 text-xs uppercase font-bold">Total Withdrawals</p>
                  <p className="text-2xl font-black mt-1 text-red-400">৳{totalWithdrawals}</p>
                </div>
                <div className="bg-gray-900 p-6 rounded-2xl border border-white/10">
                  <p className="text-gray-400 text-xs uppercase font-bold">Total Betting</p>
                  <p className="text-2xl font-black mt-1 text-blue-400">৳{totalBetting}</p>
                </div>
              </div>

              <div className="bg-gray-900 p-6 rounded-2xl border border-white/10">
                <h3 className="font-bold mb-4 flex items-center gap-2"><Zap size={18} className="text-yellow-500" /> কুইক অ্যাকশন (Quick Actions)</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <button onClick={() => setActiveTab('withdrawals')} className="bg-white/5 hover:bg-white/10 p-4 rounded-xl border border-white/5 transition-all text-center group">
                    <ArrowDownLeft className="mx-auto mb-2 text-red-400 group-hover:scale-110 transition-transform" size={24} />
                    <p className="text-xs font-bold">উত্তোলন অনুমোদন</p>
                  </button>
                  <button onClick={() => setActiveTab('promos')} className="bg-white/5 hover:bg-white/10 p-4 rounded-xl border border-white/5 transition-all text-center group">
                    <Gift className="mx-auto mb-2 text-yellow-500 group-hover:scale-110 transition-transform" size={24} />
                    <p className="text-xs font-bold">প্রোমো কোড যোগ</p>
                  </button>
                  <button onClick={() => setActiveTab('users')} className="bg-white/5 hover:bg-white/10 p-4 rounded-xl border border-white/5 transition-all text-center group">
                    <Users className="mx-auto mb-2 text-blue-400 group-hover:scale-110 transition-transform" size={24} />
                    <p className="text-xs font-bold">ইউজার ম্যানেজমেন্ট</p>
                  </button>
                  <button onClick={() => setActiveTab('chat')} className="bg-white/5 hover:bg-white/10 p-4 rounded-xl border border-white/5 transition-all text-center group">
                    <MessageCircle className="mx-auto mb-2 text-green-400 group-hover:scale-110 transition-transform" size={24} />
                    <p className="text-xs font-bold">সাপোর্ট চ্যাট</p>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-900 p-6 rounded-2xl border border-white/10">
                  <h3 className="font-bold mb-4">Recent Deposits</h3>
                  {transactions.filter(t => t.type === 'deposit').sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0)).slice(0, 5).map(t => (
                    <div key={t.id} className="flex justify-between py-2 border-b border-white/5">
                      <span className="text-xs text-gray-400">{t.userId?.slice(0, 8) || 'Unknown'}...</span>
                      <span className="text-green-400 font-bold">+{t.amount}</span>
                    </div>
                  ))}
                </div>
                <div className="bg-gray-900 p-6 rounded-2xl border border-white/10">
                  <h3 className="font-bold mb-4">Recent Withdrawals</h3>
                  {transactions.filter(t => t.type === 'withdraw').sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0)).slice(0, 5).map(t => (
                    <div key={t.id} className="flex justify-between py-2 border-b border-white/5">
                      <span className="text-xs text-gray-400">{t.userId?.slice(0, 8) || 'Unknown'}...</span>
                      <span className="text-red-400 font-bold">-{t.amount}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-gray-900 p-6 rounded-2xl border border-white/10">
                <h3 className="font-bold mb-4">Ongoing Promotions</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {promos.map(promo => (
                    <div key={promo.id} className="bg-gray-800 p-4 rounded-xl flex justify-between items-center">
                      <div>
                        <p className="font-bold text-yellow-500">{promo.id}</p>
                        <p className="text-xs text-gray-400">Bonus: ৳{promo.amount}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold">{promo.usedCount} / {promo.maxUses} Uses</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Notification Center Widget */}
            <div className="bg-gray-900 rounded-2xl border border-white/10 flex flex-col h-[500px]">
              <div className="p-4 border-b border-white/10 flex justify-between items-center">
                <h3 className="font-bold flex items-center gap-2">
                  <Bell size={18} className="text-yellow-500" /> সিস্টেম অ্যালার্ট
                  {alerts.filter(a => !a.read).length > 0 && (
                    <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full animate-pulse">
                      {alerts.filter(a => !a.read).length}
                    </span>
                  )}
                </h3>
                <button 
                  onClick={handleClearAllAlerts}
                  className="text-[10px] text-gray-500 hover:text-white transition-colors uppercase font-bold"
                >
                  সব ক্লিয়ার করুন
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
                {alerts.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-gray-600 space-y-2">
                    <CheckCircle2 size={32} />
                    <p className="text-xs font-bold">কোনো নতুন অ্যালার্ট নেই</p>
                  </div>
                ) : (
                  alerts.map(alert => (
                    <div 
                      key={alert.id} 
                      className={`p-3 rounded-xl border transition-all ${alert.read ? 'bg-black/20 border-white/5 opacity-60' : 'bg-white/5 border-white/10'}`}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex gap-2">
                          <div className={`mt-1 shrink-0 ${alert.type === 'error' ? 'text-red-500' : alert.type === 'warning' ? 'text-yellow-500' : 'text-blue-500'}`}>
                            {alert.type === 'error' ? <AlertCircle size={14} /> : alert.type === 'warning' ? <AlertCircle size={14} /> : <Bell size={14} />}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-white leading-tight">{alert.title}</p>
                            <p className="text-[10px] text-gray-400 mt-1 leading-relaxed">{alert.message}</p>
                            <p className="text-[8px] text-gray-600 mt-2 uppercase font-bold">
                              {alert.timestamp?.toDate ? alert.timestamp.toDate().toLocaleString() : 'Just now'}
                            </p>
                          </div>
                        </div>
                        {!alert.read && (
                          <button 
                            onClick={() => handleMarkAlertAsRead(alert.id)}
                            className="p-1 hover:bg-white/10 rounded transition-colors text-gray-500 hover:text-white"
                          >
                            <Check size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="bg-gray-900 rounded-2xl p-6 border border-white/10">
          <h2 className="text-xl font-bold mb-4">ইউজার তালিকা</h2>
          <div className="space-y-4">
            {users.map(user => (
              <div key={user.id} className="bg-gray-800 p-4 rounded-xl border border-white/10 flex items-center justify-between">
                <div>
                  <p className="font-bold">{user.username}</p>
                  <p className="text-xs text-gray-400">{user.email || 'No Email'}</p>
                </div>
                <button onClick={() => setEditingUser(user)} className="bg-yellow-500 text-black px-4 py-2 rounded-lg font-bold text-xs">এডিট</button>
              </div>
            ))}
          </div>
          {editingUser && <UserDetailModal user={editingUser} onClose={() => setEditingUser(null)} onUpdate={handleUpdateUser} showToast={showToast} />}
        </div>
      )}

      {activeTab === 'withdrawals' && (
        <div className="bg-gray-900 rounded-2xl p-6 border border-white/10">
          <h2 className="text-xl font-bold mb-4">পেন্ডিং উত্তোলন অনুরোধ</h2>
          <div className="space-y-4">
            {withdrawals.length === 0 ? (
              <p className="text-gray-500 text-center py-8">কোনো পেন্ডিং অনুরোধ নেই</p>
            ) : (
              withdrawals.map(withdraw => (
                <div key={withdraw.id} className="bg-gray-800 p-4 rounded-xl border border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <p className="text-xs text-yellow-500 font-bold uppercase tracking-widest">User ID: {withdraw.userId}</p>
                    <p className="text-lg font-black">৳{withdraw.amount}</p>
                    <p className="text-sm text-gray-400">মেথড: {withdraw.method}</p>
                    <p className="text-[10px] text-gray-500">সময়: {withdraw.date?.toDate?.().toLocaleString() || 'N/A'}</p>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleUpdateWithdrawalStatus(withdraw.userId, withdraw.id, 'approved')}
                      className="flex-1 md:flex-none px-6 py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-500 transition-all flex items-center justify-center gap-2"
                    >
                      <Check size={18} /> অনুমোদন
                    </button>
                    <button 
                      onClick={() => handleUpdateWithdrawalStatus(withdraw.userId, withdraw.id, 'rejected')}
                      className="flex-1 md:flex-none px-6 py-2 bg-red-600 text-white rounded-lg font-bold hover:bg-red-500 transition-all flex items-center justify-center gap-2"
                    >
                      <X size={18} /> প্রত্যাখ্যান
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'promos' && (
        <div className="space-y-6">
          <div className="bg-gray-900 rounded-2xl p-6 border border-white/10">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2"><Plus size={20} className="text-yellow-500" /> নতুন প্রোমো কোড তৈরি করুন</h2>
              <button 
                onClick={async () => {
                  await createPromoCode("WELCOME500", 500, 100, 5);
                  await createPromoCode("SPIN71", 1000, 50, 7);
                  showToast("ডিফল্ট প্রোমো কোডগুলো তৈরি হয়েছে", "success");
                }}
                className="text-xs bg-teal-600/20 text-teal-400 px-3 py-1.5 rounded-lg border border-teal-500/30 hover:bg-teal-600/30 transition-all"
              >
                ডিফল্ট কোড তৈরি করুন
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <input 
                type="text" 
                placeholder="কোড (e.g. WELCOME500)" 
                value={newPromo.code}
                onChange={(e) => setNewPromo({...newPromo, code: e.target.value.toUpperCase()})}
                className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-yellow-500 outline-none"
              />
              <input 
                type="number" 
                placeholder="বোনাস পরিমাণ" 
                value={newPromo.amount}
                onChange={(e) => setNewPromo({...newPromo, amount: Number(e.target.value)})}
                className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-yellow-500 outline-none"
              />
              <input 
                type="number" 
                placeholder="সর্বোচ্চ ব্যবহার" 
                value={newPromo.maxUses}
                onChange={(e) => setNewPromo({...newPromo, maxUses: Number(e.target.value)})}
                className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-yellow-500 outline-none"
              />
              <button 
                onClick={async () => {
                  if (!newPromo.code) return;
                  await createPromoCode(newPromo.code, newPromo.amount, newPromo.maxUses, newPromo.turnover);
                  showToast("প্রোমো কোড তৈরি হয়েছে", "success");
                  setNewPromo({ code: '', amount: 500, maxUses: 100, turnover: 5 });
                }}
                className="bg-yellow-500 text-black font-bold rounded-xl px-6 py-3 hover:bg-yellow-400 transition-all"
              >
                তৈরি করুন
              </button>
            </div>
          </div>

          <div className="bg-gray-900 rounded-2xl p-6 border border-white/10">
            <h2 className="text-xl font-bold mb-4">সক্রিয় প্রোমো কোড</h2>
            <div className="space-y-4">
              {promos.map(promo => (
                <div key={promo.id} className="flex items-center justify-between bg-gray-800 p-4 rounded-xl">
                  <div>
                    <p className="font-bold text-yellow-500">{promo.id}</p>
                    <p className="text-xs text-gray-400">বোনাস: ৳{promo.amount} | ব্যবহার: {promo.usedCount}/{promo.maxUses}</p>
                  </div>
                  <button 
                    onClick={async () => {
                      await deleteDoc(doc(db, 'promo_codes', promo.id));
                      showToast("প্রোমো কোড ডিলিট হয়েছে", "success");
                    }}
                    className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
              {promos.length === 0 && <p className="text-gray-500 text-center py-4">কোনো প্রোমো কোড নেই</p>}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'requests' && (
        <div className="bg-gray-900 rounded-2xl p-6 border border-white/10">
          <h2 className="text-xl font-bold mb-4">লোগো ও নাম পরিবর্তনের রিকোয়েস্ট</h2>
          <div className="space-y-4">
            {requests.map(req => (
              <div key={req.id} className="bg-gray-800 p-4 rounded-xl border border-white/5">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-xs text-yellow-500 font-bold uppercase tracking-widest">Game ID: {req.gameId}</p>
                    <p className="font-bold mt-1">{req.type === 'logo' ? 'নতুন লোগো' : 'নতুন নাম'}: {req.value}</p>
                    <p className="text-[10px] text-gray-500 mt-1">Requested by: {req.requestedBy}</p>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={async () => {
                        if (req.type === 'logo') await updateGlobalGameLogo(req.gameId, req.value, true);
                        else await updateGlobalGameName(req.gameId, req.value, true);
                        await updateDoc(doc(db, 'logo_requests', req.id), { status: 'approved' });
                        showToast("অনুমোদন করা হয়েছে", "success");
                      }}
                      className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-500 transition-all"
                    >
                      <Check size={18} />
                    </button>
                    <button 
                      onClick={async () => {
                        await updateDoc(doc(db, 'logo_requests', req.id), { status: 'rejected' });
                        showToast("প্রত্যাখ্যান করা হয়েছে", "success");
                      }}
                      className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-500 transition-all"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>
                {req.type === 'logo' && (
                  <img src={req.value} alt="Preview" className="w-20 h-20 object-cover rounded-lg border border-white/10" referrerPolicy="no-referrer" />
                )}
              </div>
            ))}
            {requests.length === 0 && <p className="text-gray-500 text-center py-8">কোনো পেন্ডিং রিকোয়েস্ট নেই</p>}
          </div>
        </div>
      )}

      {activeTab === 'errors' && (
        <div className="bg-gray-900 rounded-2xl p-6 border border-white/10">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2"><Bug size={20} className="text-red-500" /> সিস্টেম এরর লগ (System Error Logs)</h2>
            <span className="text-xs bg-red-500/10 text-red-500 px-3 py-1 rounded-full font-bold">{systemErrors.length} Unresolved</span>
          </div>
          <div className="space-y-4">
            {systemErrors.length === 0 ? (
              <div className="text-center py-12 bg-black/20 rounded-2xl border border-dashed border-white/5">
                <CheckCircle2 size={48} className="mx-auto text-green-500 mb-4 opacity-20" />
                <p className="text-gray-500 font-bold">কোনো পেন্ডিং এরর নেই। সিস্টেম স্থিতিশীল।</p>
              </div>
            ) : (
              systemErrors.map(err => (
                <div key={err.id} className="bg-gray-800/50 p-5 rounded-2xl border border-white/5 hover:border-red-500/30 transition-all group">
                  <div className="flex justify-between items-start gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] bg-red-500 text-white px-2 py-0.5 rounded font-black uppercase tracking-tighter">Error</span>
                        <p className="text-sm font-bold text-white">{err.message || 'Unknown Error'}</p>
                      </div>
                      <div className="bg-black/40 p-3 rounded-lg font-mono text-[10px] text-red-400 overflow-x-auto whitespace-pre-wrap border border-red-500/10">
                        {err.stack || 'No stack trace available'}
                      </div>
                      <div className="flex flex-wrap gap-3 text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                        <span className="flex items-center gap-1"><UserIcon size={10} /> User: {err.userId || 'Guest'}</span>
                        <span className="flex items-center gap-1"><Clock size={10} /> {err.timestamp?.toDate?.().toLocaleString() || 'N/A'}</span>
                        <span className="flex items-center gap-1"><Globe size={10} /> IP: {err.ip || 'Unknown'}</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleResolveError(err.id)}
                      className="shrink-0 bg-green-600/20 text-green-500 hover:bg-green-600 hover:text-white p-3 rounded-xl transition-all border border-green-500/20"
                      title="Mark as Resolved"
                    >
                      <Check size={20} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
      {activeTab === 'games' && (
        <div className="space-y-6">
          <div className="bg-gray-900 rounded-2xl p-6 border border-white/10">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Settings size={20} className="text-yellow-500" /> গেম ম্যানেজমেন্ট</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {defaultGames.map((game) => {
                const isEditing = editingGame === game.id;
                const currentName = globalGameNames[game.id] || game.name;
                const currentLogo = globalGameLogos[game.id] || game.image;
                const currentUrl = globalGameUrls[game.id] || '';
                const currentProvider = globalGameOptions[game.id] || game.provider;

                return (
                  <div key={game.id} className="bg-black/40 border border-white/10 rounded-xl p-4 space-y-4">
                    {isEditing ? (
                      <div className="space-y-3">
                        <div>
                          <label className="text-[10px] text-gray-400 font-bold uppercase">Game Name</label>
                          <input 
                            type="text" 
                            value={editGameForm.name}
                            onChange={(e) => setEditGameForm({...editGameForm, name: e.target.value})}
                            placeholder="Game Name"
                            className="w-full bg-gray-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-yellow-500 outline-none mt-1"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-gray-400 font-bold uppercase">Provider</label>
                          <input 
                            type="text" 
                            value={editGameForm.provider}
                            onChange={(e) => setEditGameForm({...editGameForm, provider: e.target.value})}
                            placeholder="Provider"
                            className="w-full bg-gray-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-yellow-500 outline-none mt-1"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-gray-400 font-bold uppercase">Logo URL</label>
                          <input 
                            type="text" 
                            value={editGameForm.logo}
                            onChange={(e) => setEditGameForm({...editGameForm, logo: e.target.value})}
                            placeholder="Logo URL"
                            className="w-full bg-gray-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-yellow-500 outline-none mt-1"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-gray-400 font-bold uppercase">Game URL</label>
                          <input 
                            type="text" 
                            value={editGameForm.url}
                            onChange={(e) => setEditGameForm({...editGameForm, url: e.target.value})}
                            placeholder="Game URL"
                            className="w-full bg-gray-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-yellow-500 outline-none mt-1"
                          />
                        </div>
                        <div className="flex gap-2 pt-2">
                          <button 
                            onClick={async () => {
                              try {
                                if (editGameForm.name !== currentName) await updateGlobalGameName(game.id, editGameForm.name, true);
                                if (editGameForm.logo !== currentLogo) await updateGlobalGameLogo(game.id, editGameForm.logo, true);
                                if (editGameForm.url !== currentUrl) await updateGlobalGameUrl(game.id, editGameForm.url);
                                if (editGameForm.provider !== currentProvider) await updateGlobalGameOption(game.id, editGameForm.provider);
                                showToast("গেম আপডেট হয়েছে", "success");
                                setEditingGame(null);
                              } catch (e) {
                                showToast("আপডেট করতে সমস্যা হয়েছে", "error");
                              }
                            }}
                            className="flex-1 bg-green-600 text-white text-xs font-bold py-2 rounded hover:bg-green-500"
                          >
                            Save
                          </button>
                          <button 
                            onClick={() => setEditingGame(null)}
                            className="flex-1 bg-gray-600 text-white text-xs font-bold py-2 rounded hover:bg-gray-500"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-3">
                          <img src={currentLogo} alt={currentName} className="w-12 h-12 rounded-lg object-cover" referrerPolicy="no-referrer" />
                          <div>
                            <h3 className="font-bold text-white text-sm">{currentName}</h3>
                            <p className="text-xs text-gray-400">{currentProvider}</p>
                          </div>
                        </div>
                        <div className="text-xs text-gray-500 truncate">
                          URL: {currentUrl || 'Not set'}
                        </div>
                        <button 
                          onClick={() => {
                            setEditGameForm({ name: currentName, logo: currentLogo, url: currentUrl, provider: currentProvider });
                            setEditingGame(game.id);
                          }}
                          className="w-full bg-yellow-500/10 text-yellow-500 text-xs font-bold py-2 rounded hover:bg-yellow-500/20 transition-colors"
                        >
                          Edit Game
                        </button>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="bg-gray-900 rounded-2xl p-6 border border-white/10 space-y-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Settings size={20} className="text-yellow-500" /> গ্লোবাল অ্যাপ সেটিংস</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm text-gray-400 font-bold">ক্যাসিনোর নাম (Casino Name)</label>
              <input 
                type="text" 
                value={appSettings.casinoName}
                onChange={(e) => setAppSettings({...appSettings, casinoName: e.target.value})}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-yellow-500 outline-none"
                placeholder="e.g. SPIN71BET"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-gray-400 font-bold">টেলিগ্রাম লিংক (Telegram Link)</label>
              <input 
                type="text" 
                value={appSettings.telegramLink}
                onChange={(e) => setAppSettings({...appSettings, telegramLink: e.target.value})}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-yellow-500 outline-none"
                placeholder="https://t.me/..."
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-gray-400 font-bold">হোয়াটসঅ্যাপ লিংক (WhatsApp Link)</label>
              <input 
                type="text" 
                value={appSettings.whatsappLink}
                onChange={(e) => setAppSettings({...appSettings, whatsappLink: e.target.value})}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-yellow-500 outline-none"
                placeholder="https://wa.me/..."
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-gray-400 font-bold">ফেসবুক লিংক (Facebook Link)</label>
              <input 
                type="text" 
                value={appSettings.facebookLink}
                onChange={(e) => setAppSettings({...appSettings, facebookLink: e.target.value})}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-yellow-500 outline-none"
                placeholder="https://facebook.com/..."
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-gray-400 font-bold">সাপোর্ট ইমেইল (Support Email)</label>
              <input 
                type="email" 
                value={appSettings.supportEmail}
                onChange={(e) => setAppSettings({...appSettings, supportEmail: e.target.value})}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-yellow-500 outline-none"
                placeholder="support@example.com"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-gray-400 font-bold">সর্বনিম্ন ডিপোজিট (Min Deposit)</label>
              <input 
                type="number" 
                value={appSettings.minDeposit}
                onChange={(e) => setAppSettings({...appSettings, minDeposit: Number(e.target.value)})}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-yellow-500 outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-gray-400 font-bold">সর্বনিম্ন উত্তোলন (Min Withdraw)</label>
              <input 
                type="number" 
                value={appSettings.minWithdraw}
                onChange={(e) => setAppSettings({...appSettings, minWithdraw: Number(e.target.value)})}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-yellow-500 outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-gray-400 font-bold">ওয়েলকাম বোনাস (Welcome Bonus)</label>
              <input 
                type="number" 
                value={appSettings.welcomeBonus}
                onChange={(e) => setAppSettings({...appSettings, welcomeBonus: Number(e.target.value)})}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-yellow-500 outline-none"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm text-gray-400 font-bold">ঘোষণা/নোটিশ (Notice Text)</label>
              <textarea 
                value={appSettings.noticeText}
                onChange={(e) => setAppSettings({...appSettings, noticeText: e.target.value})}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-yellow-500 outline-none h-24 resize-none"
                placeholder="গেমের নোটিশ এখানে লিখুন..."
              />
            </div>
          </div>

          <button 
            onClick={async () => {
              try {
                await updateGlobalAppSettings(appSettings);
                showToast("সেটিংস সফলভাবে আপডেট করা হয়েছে", "success");
              } catch (e) {
                showToast("সেটিংস আপডেট করতে সমস্যা হয়েছে", "error");
              }
            }}
            className="w-full bg-yellow-500 text-black font-black py-4 rounded-xl hover:bg-yellow-400 transition-all shadow-lg shadow-yellow-500/20"
          >
            সবকিছু সেভ করুন (Save All Settings)
          </button>
        </div>
      )}

      {activeTab === 'analytics' && (
        <div className="bg-gray-900 rounded-2xl p-6 border border-white/10">
          <h2 className="text-xl font-bold mb-4">প্লেয়ার ব্যালেন্স অ্যানালিটিক্স (টপ ১০)</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analyticsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="name" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151' }} />
                <Bar dataKey="balance" fill="#EAB308" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {activeTab === 'api_tokens' && (
        <div className="bg-gray-900 rounded-2xl p-6 border border-white/10 space-y-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2"><KeyRound size={20} className="text-yellow-500" /> API Tokens</h2>
            <button 
              onClick={() => setShowTokenForm(!showTokenForm)}
              className="bg-yellow-500 text-black font-bold px-4 py-2 rounded-lg hover:bg-yellow-400 transition-all flex items-center gap-2"
            >
              <Plus size={16} /> {showTokenForm ? 'বন্ধ করুন' : 'নতুন টোকেন তৈরি করুন'}
            </button>
          </div>

          {showTokenForm && (
            <div className="bg-gray-800 p-4 rounded-xl border border-white/10 space-y-4">
              <input 
                type="text" 
                placeholder="টোকেনের নাম" 
                value={newTokenName} 
                onChange={(e) => setNewTokenName(e.target.value)}
                className="w-full bg-black border border-white/10 p-2 rounded text-white"
              />
              <input 
                type="date" 
                value={newTokenExpiration} 
                onChange={(e) => setNewTokenExpiration(e.target.value)}
                className="w-full bg-black border border-white/10 p-2 rounded text-white"
              />
              <button 
                onClick={async () => {
                  if (!newTokenName || !newTokenExpiration) {
                    showToast("দয়া করে নাম এবং এক্সপায়ারেশন তারিখ দিন", "error");
                    return;
                  }
                  try {
                    const newToken = `sk_live_${Math.random().toString(36).substr(2, 15)}${Math.random().toString(36).substr(2, 15)}`;
                    await setDoc(doc(db, 'api_tokens', newToken), {
                      token: newToken,
                      createdAt: serverTimestamp(),
                      status: 'active',
                      name: newTokenName,
                      expirationDate: newTokenExpiration
                    });
                    showToast("নতুন API টোকেন তৈরি হয়েছে", "success");
                    setNewTokenName('');
                    setNewTokenExpiration('');
                    setShowTokenForm(false);
                  } catch (e) {
                    showToast("টোকেন তৈরি করতে সমস্যা হয়েছে", "error");
                  }
                }}
                className="w-full bg-green-600 text-white font-bold py-2 rounded-lg hover:bg-green-500 transition-all"
              >
                তৈরি করুন
              </button>
            </div>
          )}
          
          <div className="bg-black/40 border border-white/10 rounded-xl p-4">
            <p className="text-sm text-gray-400 mb-4">এই টোকেনগুলো ব্যবহার করে আপনি 외부 (external) সিস্টেম থেকে অ্যাডমিন প্যানেলের কাজগুলো করতে পারবেন।</p>
            <div className="space-y-3">
              {apiTokens.length === 0 ? (
                <p className="text-xs text-yellow-500 italic">কোনো টোকেন নেই।</p>
              ) : (
                apiTokens.map(token => (
                  <div key={token.id} className="bg-gray-800 p-4 rounded-lg flex items-center justify-between">
                    <div>
                      <p className="font-bold text-white">{token.name}</p>
                      <p className="text-xs text-gray-400 font-mono mt-1">{token.token}</p>
                      <p className="text-[10px] text-gray-500 mt-1">Status: <span className={token.status === 'active' ? 'text-green-400' : 'text-red-400'}>{token.status}</span></p>
                      <p className="text-[10px] text-gray-500 mt-1">Expires: {token.expirationDate}</p>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={async () => {
                          try {
                            await updateDoc(doc(db, 'api_tokens', token.id), {
                              status: token.status === 'active' ? 'inactive' : 'active'
                            });
                            showToast("টোকেন স্ট্যাটাস আপডেট করা হয়েছে", "success");
                          } catch (e) {
                            showToast("আপডেট করতে সমস্যা হয়েছে", "error");
                          }
                        }}
                        className="p-2 bg-blue-600/20 text-blue-500 rounded hover:bg-blue-600 hover:text-white transition-colors"
                      >
                        {token.status === 'active' ? 'Deactivate' : 'Activate'}
                      </button>
                      <button 
                        onClick={async () => {
                          try {
                            await deleteDoc(doc(db, 'api_tokens', token.id));
                            showToast("টোকেন ডিলিট করা হয়েছে", "success");
                          } catch (e) {
                            showToast("ডিলিট করতে সমস্যা হয়েছে", "error");
                          }
                        }}
                        className="p-2 bg-red-600/20 text-red-500 rounded hover:bg-red-600 hover:text-white transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
