import React, { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, onSnapshot, doc, updateDoc, increment, deleteDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { Settings, Users, History, Activity, Gift, Image as ImageIcon, Check, X, Trash2, Plus, Bot, Sparkles, KeyRound, LayoutDashboard } from 'lucide-react';
import AdminAIChat from './AdminAIChat';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { createPromoCode, updateGlobalGameLogo, updateGlobalGameName, updateGlobalGameUrl, updateGlobalGameOption, updateGlobalAppSettings } from '../services/firebaseService';
import { games as defaultGames } from './GameGrid';

interface User {
  id: string;
  username: string;
  balance: number;
  role: string;
}

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

export default function AdminPanel({ showToast }: { showToast: (msg: string, type: 'success' | 'error') => void }) {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'transactions' | 'analytics' | 'promos' | 'requests' | 'games' | 'settings' | 'api_tokens'>('dashboard');
  const [showAIChat, setShowAIChat] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [promos, setPromos] = useState<PromoCode[]>([]);
  const [requests, setRequests] = useState<LogoRequest[]>([]);
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

    const trxQuery = query(collection(db, 'transactions'));
    const unsubscribeTrx = onSnapshot(trxQuery, (snapshot) => {
      const trxData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
      setTransactions(trxData);
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
    };
  }, []);

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

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
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
        <button onClick={() => setActiveTab('settings')} className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 shrink-0 ${activeTab === 'settings' ? 'bg-yellow-500 text-black' : 'bg-gray-800'}`}>
          <Settings size={20} /> অ্যাপ সেটিংস
        </button>
        <button onClick={() => setActiveTab('api_tokens')} className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 shrink-0 ${activeTab === 'api_tokens' ? 'bg-yellow-500 text-black' : 'bg-gray-800'}`}>
          <KeyRound size={20} /> API Tokens
        </button>
        <button 
          onClick={() => setShowAIChat(true)} 
          className="px-6 py-3 rounded-xl font-bold flex items-center gap-2 shrink-0 bg-gradient-to-r from-teal-600 to-blue-600 text-white shadow-lg shadow-teal-500/20 hover:scale-105 transition-all"
        >
          <Bot size={20} /> AI Assistant
        </button>
      </div>

      <AdminAIChat isOpen={showAIChat} onClose={() => setShowAIChat(false)} />

      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-900 p-6 rounded-2xl border border-white/10">
              <p className="text-gray-400 text-sm">Total Users</p>
              <p className="text-3xl font-black">{users.length}</p>
            </div>
            <div className="bg-gray-900 p-6 rounded-2xl border border-white/10">
              <p className="text-gray-400 text-sm">Active Users</p>
              <p className="text-3xl font-black">{users.filter(u => u.role === 'user').length}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-900 p-6 rounded-2xl border border-white/10">
              <h3 className="font-bold mb-4">Recent Deposits</h3>
              {transactions.filter(t => t.type === 'deposit').sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0)).slice(0, 5).map(t => (
                <div key={t.id} className="flex justify-between py-2 border-b border-white/5">
                  <span className="text-xs text-gray-400">{t.userId.slice(0, 8)}...</span>
                  <span className="text-green-400 font-bold">+{t.amount}</span>
                </div>
              ))}
            </div>
            <div className="bg-gray-900 p-6 rounded-2xl border border-white/10">
              <h3 className="font-bold mb-4">Recent Withdrawals</h3>
              {transactions.filter(t => t.type === 'withdraw').sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0)).slice(0, 5).map(t => (
                <div key={t.id} className="flex justify-between py-2 border-b border-white/5">
                  <span className="text-xs text-gray-400">{t.userId.slice(0, 8)}...</span>
                  <span className="text-red-400 font-bold">-{t.amount}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="bg-gray-900 rounded-2xl p-6 border border-white/10">
          <h2 className="text-xl font-bold mb-4">ইউজার তালিকা</h2>
          <div className="space-y-4">
            {users.map(user => (
              <div key={user.id} className="flex items-center justify-between bg-gray-800 p-4 rounded-xl">
                <div>
                  <p className="font-bold">{user.username}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-sm text-gray-400">ব্যালেন্স: {user.balance}</p>
                    <select 
                      value={user.role || 'user'} 
                      onChange={(e) => handleUpdateRole(user.id, e.target.value)}
                      className="bg-gray-700 text-[10px] text-yellow-500 font-bold px-2 py-0.5 rounded border border-white/10 outline-none"
                    >
                      <option value="user">USER</option>
                      <option value="agent">AGENT</option>
                      <option value="admin">ADMIN</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleUpdateBalance(user.id, 100)} className="bg-green-600 px-3 py-1 rounded-lg text-xs font-bold">+100</button>
                  <button onClick={() => handleUpdateBalance(user.id, -100)} className="bg-red-600 px-3 py-1 rounded-lg text-xs font-bold">-100</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'transactions' && (
        <div className="bg-gray-900 rounded-2xl p-6 border border-white/10">
          <h2 className="text-xl font-bold mb-4">ট্রানজেকশন হিস্ট্রি</h2>
          <div className="space-y-2">
            {transactions.map(trx => (
              <div key={trx.id} className="flex justify-between bg-gray-800 p-3 rounded-lg text-sm">
                <span>ইউজার: {trx.userId}</span>
                <span className={`font-bold ${trx.type === 'deposit' ? 'text-green-400' : 'text-red-400'}`}>
                  {trx.type.toUpperCase()}: {trx.amount}
                </span>
              </div>
            ))}
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
