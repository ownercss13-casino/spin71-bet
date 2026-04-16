import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Users, DollarSign, Activity, CreditCard, 
  Search, TrendingUp, ChevronRight, UserPlus, 
  Wallet, History, BarChart3, RefreshCw, Send,
  Settings, Gamepad2, X
} from 'lucide-react';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { 
  collection, 
  getDocs, 
  doc, 
  updateDoc, 
  onSnapshot, 
  query, 
  where, 
  orderBy, 
  limit,
  getDoc,
  runTransaction,
  Timestamp,
  addDoc
} from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

interface AgentPanelProps {
  onBack: () => void;
  userData: any;
  showToast: (msg: string, type?: any) => void;
  globalLogos: Record<string, string>;
  globalNames: Record<string, string>;
  globalUrls: Record<string, string>;
  globalOptions: Record<string, string>;
  updateGlobalGameLogo: (gameId: string, url: string) => void;
  updateGlobalGameName: (gameId: string, name: string) => void;
  updateGlobalGameUrl: (gameId: string, url: string) => void;
  updateGlobalGameOption: (gameId: string, option: string) => void;
  allButtonName: string;
  updateAllButtonName: (name: string) => void;
  casinoName: string;
  updateCasinoName: (name: string) => void;
}

export default function AgentPanel({ 
  onBack, 
  userData, 
  showToast,
  globalLogos,
  globalNames,
  globalUrls,
  globalOptions,
  updateGlobalGameLogo,
  updateGlobalGameName,
  updateGlobalGameUrl,
  updateGlobalGameOption,
  allButtonName,
  updateAllButtonName,
  casinoName,
  updateCasinoName
}: AgentPanelProps) {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'players' | 'transfer' | 'earnings' | 'stats' | 'admin'>('dashboard');

  const tabs = [
    { id: 'dashboard', label: 'ড্যাশবোর্ড', icon: Activity },
    { id: 'players', label: 'আমার প্লেয়ার', icon: Users },
    { id: 'transfer', label: 'ব্যালেন্স ট্রান্সফার', icon: Send },
    { id: 'earnings', label: 'উপার্জন ইতিহাস', icon: History },
    { id: 'stats', label: 'পারফরম্যান্স', icon: BarChart3 },
    ...(userData?.role === 'admin' ? [{ id: 'admin', label: 'অ্যাডমিন প্যানেল', icon: Settings }] : []),
  ];

  return (
    <div className="bg-[#0b1120] p-4 md:p-6 rounded-3xl w-full max-w-7xl mx-auto text-white min-h-[85vh] flex flex-col md:flex-row gap-6 border border-teal-900/50 shadow-2xl font-sans">
      {/* Sidebar */}
      <div className="w-full md:w-72 flex flex-col gap-2 shrink-0">
        <div className="flex items-center gap-3 mb-6 px-2">
          <button onClick={onBack} className="p-2 bg-teal-900/50 hover:bg-teal-800 rounded-full transition-colors">
            <ArrowLeft size={20} className="text-teal-400" />
          </button>
          <div>
            <h2 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-teal-600 uppercase tracking-wider">
              {userData?.role === 'admin' ? 'Admin Panel' : 'Agent Panel'}
            </h2>
            <p className="text-[10px] text-teal-500 font-mono uppercase">{userData?.role === 'admin' ? 'Full Access' : 'Partner Access'}</p>
          </div>
        </div>

        <div className="space-y-1 overflow-y-auto pr-2 custom-scrollbar">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold transition-all duration-300 ${
                  isActive 
                    ? 'bg-gradient-to-r from-teal-900 to-teal-800 text-teal-400 shadow-[inset_2px_0_0_#14b8a6] border border-teal-700/50' 
                    : 'text-teal-400/70 hover:bg-teal-900/30 hover:text-teal-300'
                }`}
              >
                <Icon size={20} className={isActive ? 'text-teal-400' : ''} /> 
                <span className="text-sm">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 bg-[#0d1525] rounded-2xl p-4 md:p-8 border border-teal-900/30 overflow-y-auto shadow-inner relative">
        <div className="relative z-10">
          {activeTab === 'dashboard' && <DashboardTab userData={userData} />}
          {activeTab === 'players' && <PlayersTab userData={userData} showToast={showToast} />}
          {activeTab === 'transfer' && <TransferTab userData={userData} showToast={showToast} />}
          {activeTab === 'earnings' && <EarningsTab userData={userData} />}
          {activeTab === 'stats' && <StatsTab userData={userData} />}
          {activeTab === 'admin' && userData?.role === 'admin' && <AdminTab showToast={showToast} />}
        </div>
      </div>
    </div>
  );
}

// --- TABS ---

function AdminTab({ showToast }: { showToast: (msg: string, type?: any) => void }) {
  const [gameLogos, setGameLogos] = useState<Record<string, string>>({});
  const [gameNames, setGameNames] = useState<Record<string, string>>({});
  const [gameUrls, setGameUrls] = useState<Record<string, string>>({});
  const [gameOptions, setGameOptions] = useState<Record<string, string>>({});
  const [uiSettings, setUiSettings] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubLogos = onSnapshot(doc(db, 'global_config', 'game_logos'), (d) => d.exists() && setGameLogos(d.data()), (error) => {
      handleFirestoreError(error, OperationType.GET, 'global_config/game_logos');
    });
    const unsubNames = onSnapshot(doc(db, 'global_config', 'game_names'), (d) => d.exists() && setGameNames(d.data()), (error) => {
      handleFirestoreError(error, OperationType.GET, 'global_config/game_names');
    });
    const unsubUrls = onSnapshot(doc(db, 'global_config', 'game_urls'), (d) => d.exists() && setGameUrls(d.data()), (error) => {
      handleFirestoreError(error, OperationType.GET, 'global_config/game_urls');
    });
    const unsubOptions = onSnapshot(doc(db, 'global_config', 'game_options'), (d) => d.exists() && setGameOptions(d.data()), (error) => {
      handleFirestoreError(error, OperationType.GET, 'global_config/game_options');
    });
    const unsubUi = onSnapshot(doc(db, 'global_config', 'ui_settings'), (d) => d.exists() && setUiSettings(d.data()), (error) => {
      handleFirestoreError(error, OperationType.GET, 'global_config/ui_settings');
    });

    setLoading(false);
    return () => {
      unsubLogos();
      unsubNames();
      unsubUrls();
      unsubOptions();
      unsubUi();
    };
  }, []);

  const handleUpdate = async (type: 'logo' | 'name' | 'url' | 'option' | 'ui', id: string, value: string) => {
    try {
      const { 
        updateGlobalGameLogo, 
        updateGlobalGameName, 
        updateGlobalGameUrl, 
        updateGlobalGameOption,
        updateCasinoName,
        updateAllButtonName
      } = await import('../services/firebaseService');

      if (type === 'logo') await updateGlobalGameLogo(id, value);
      else if (type === 'name') await updateGlobalGameName(id, value);
      else if (type === 'url') await updateGlobalGameUrl(id, value);
      else if (type === 'option') await updateGlobalGameOption(id, value);
      else if (type === 'ui') {
        if (id === 'casinoName') await updateCasinoName(value);
        if (id === 'allButtonName') await updateAllButtonName(value);
      }
      
      showToast("আপডেট সফল হয়েছে", "success");
    } catch (err) {
      console.error(err);
      showToast("আপডেট ব্যর্থ হয়েছে", "error");
    }
  };

  const games = [
    { id: 'aviator', label: 'Aviator' },
    { id: 'slot_1', label: 'Slot 1' },
    { id: 'slot_2', label: 'Slot 2' },
    { id: 'slot_3', label: 'Slot 3' },
    { id: 'slot_4', label: 'Slot 4' },
    { id: 'slot_5', label: 'Slot 5' },
    { id: 'slot_6', label: 'Slot 6' },
    { id: 'slot_7', label: 'Slot 7' },
    { id: 'slot_8', label: 'Slot 8' },
    { id: 'slot_9', label: 'Slot 9' },
    { id: 'slot_10', label: 'Slot 10' },
    { id: 'slot_11', label: 'Slot 11' },
    { id: 'slot_12', label: 'Slot 12' },
  ];

  if (loading) return <div className="flex justify-center py-20"><RefreshCw className="animate-spin text-teal-500" /></div>;

  return (
    <div className="space-y-8 pb-10">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold text-white">গ্লোবাল গেম কাস্টমাইজেশন</h3>
        <div className="text-[10px] text-yellow-500 font-mono bg-yellow-950/30 px-3 py-1 rounded-full border border-yellow-800/50">
          ADMIN ONLY ACCESS
        </div>
      </div>

      {/* UI Settings */}
      <div className="bg-[#111827] p-6 rounded-2xl border border-teal-900/30 space-y-6">
        <h4 className="text-lg font-bold flex items-center gap-2 text-teal-400">
          <Settings size={20} /> সাধারণ সেটিংস
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase">কেসিনো নাম (Casino Name)</label>
            <div className="flex gap-2">
              <input 
                type="text" 
                defaultValue={uiSettings.casinoName || ''} 
                onBlur={(e) => handleUpdate('ui', 'casinoName', e.target.value)}
                className="flex-1 bg-[#0d1525] border border-teal-900/30 rounded-xl py-2.5 px-4 text-sm focus:border-teal-500 outline-none"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase">'All' বাটন নাম</label>
            <div className="flex gap-2">
              <input 
                type="text" 
                defaultValue={uiSettings.allButtonName || ''} 
                onBlur={(e) => handleUpdate('ui', 'allButtonName', e.target.value)}
                className="flex-1 bg-[#0d1525] border border-teal-900/30 rounded-xl py-2.5 px-4 text-sm focus:border-teal-500 outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Global Images */}
      <div className="bg-[#111827] p-6 rounded-2xl border border-teal-900/30 space-y-6">
        <h4 className="text-lg font-bold flex items-center gap-2 text-teal-400">
          <Activity size={20} /> গ্লোবাল ইমেজ সেটিংস
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            { id: 'hero_banner_host', label: 'হিরো ব্যানার ইমেজ' },
            { id: 'casino_logo', label: 'কেসিনো লোগো' },
            { id: 'app_banner', label: 'অ্যাপ ডাউনলোড ব্যানার' },
            { id: 'payment_logo_nagad', label: 'নগদ লোগো' },
            { id: 'payment_logo_bkash', label: 'বিকাশ লোগো' },
            { id: 'payment_logo_rocket', label: 'রকেট লোগো' },
            { id: 'deposit_banner', label: 'ডিপোজিট পেজ ব্যানার' },
          ].map((img) => (
            <div key={img.id} className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase">{img.label} URL</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  defaultValue={uiSettings[img.id] || ''} 
                  onBlur={async (e) => {
                    try {
                      const { updateGlobalImage } = await import('../services/firebaseService');
                      await updateGlobalImage(img.id, e.target.value);
                      showToast("ইমেজ আপডেট সফল হয়েছে", "success");
                    } catch (err) {
                      showToast("ইমেজ আপডেট ব্যর্থ হয়েছে", "error");
                    }
                  }}
                  className="flex-1 bg-[#0d1525] border border-teal-900/30 rounded-xl py-2.5 px-4 text-sm focus:border-teal-500 outline-none"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Social & Notice Settings */}
      <div className="bg-[#111827] p-6 rounded-2xl border border-teal-900/30 space-y-6">
        <h4 className="text-lg font-bold flex items-center gap-2 text-teal-400">
          <Users size={20} /> সোশ্যাল ও নোটিশ সেটিংস
        </h4>
        <div className="grid grid-cols-1 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase">নোটিশ টেক্সট (Notice Text)</label>
            <textarea 
              defaultValue={uiSettings.noticeText || ''} 
              onBlur={async (e) => {
                try {
                  const { db } = await import('../firebase');
                  const { doc, setDoc } = await import('firebase/firestore');
                  await setDoc(doc(db, 'global_config', 'ui_settings'), { noticeText: e.target.value }, { merge: true });
                  showToast("নোটিশ আপডেট সফল হয়েছে", "success");
                } catch (err) {
                  showToast("নোটিশ আপডেট ব্যর্থ হয়েছে", "error");
                }
              }}
              className="w-full bg-[#0d1525] border border-teal-900/30 rounded-xl py-2.5 px-4 text-sm focus:border-teal-500 outline-none h-20 resize-none"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { id: 'telegramLink', label: 'Telegram Link' },
              { id: 'whatsappLink', label: 'WhatsApp Link' },
              { id: 'facebookLink', label: 'Facebook Link' },
            ].map((link) => (
              <div key={link.id} className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase">{link.label}</label>
                <input 
                  type="text" 
                  defaultValue={uiSettings[link.id] || ''} 
                  onBlur={async (e) => {
                    try {
                      const { db } = await import('../firebase');
                      const { doc, setDoc } = await import('firebase/firestore');
                      await setDoc(doc(db, 'global_config', 'ui_settings'), { [link.id]: e.target.value }, { merge: true });
                      showToast("লিঙ্ক আপডেট সফল হয়েছে", "success");
                    } catch (err) {
                      showToast("লিঙ্ক আপডেট ব্যর্থ হয়েছে", "error");
                    }
                  }}
                  className="w-full bg-[#0d1525] border border-teal-900/30 rounded-xl py-2.5 px-4 text-sm focus:border-teal-500 outline-none"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Game Specific Settings */}
      <div className="space-y-4">
        {games.map((game) => (
          <div key={game.id} className="bg-[#111827] p-6 rounded-2xl border border-teal-900/30 space-y-6">
            <div className="flex items-center justify-between border-b border-teal-900/20 pb-4">
              <h4 className="text-lg font-bold text-white flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-teal-500/20 flex items-center justify-center">
                  <Gamepad2 size={18} className="text-teal-400" />
                </div>
                {game.label}
              </h4>
              <span className="text-[10px] font-mono text-teal-600 uppercase">ID: {game.id}</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase">গেমের নাম (Display Name)</label>
                <input 
                  type="text" 
                  defaultValue={gameNames[game.id] || ''} 
                  onBlur={(e) => handleUpdate('name', game.id, e.target.value)}
                  className="w-full bg-[#0d1525] border border-teal-900/30 rounded-xl py-2.5 px-4 text-sm focus:border-teal-500 outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase">লোগো URL (Logo URL)</label>
                <input 
                  type="text" 
                  defaultValue={gameLogos[game.id] || ''} 
                  onBlur={(e) => handleUpdate('logo', game.id, e.target.value)}
                  className="w-full bg-[#0d1525] border border-teal-900/30 rounded-xl py-2.5 px-4 text-sm focus:border-teal-500 outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase">গেম URL (External Link)</label>
                <input 
                  type="text" 
                  defaultValue={gameUrls[game.id] || ''} 
                  onBlur={(e) => handleUpdate('url', game.id, e.target.value)}
                  className="w-full bg-[#0d1525] border border-teal-900/30 rounded-xl py-2.5 px-4 text-sm focus:border-teal-500 outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase">অপশন (Options/Provider)</label>
                <input 
                  type="text" 
                  defaultValue={gameOptions[game.id] || ''} 
                  onBlur={(e) => handleUpdate('option', game.id, e.target.value)}
                  className="w-full bg-[#0d1525] border border-teal-900/30 rounded-xl py-2.5 px-4 text-sm focus:border-teal-500 outline-none"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DashboardTab({ userData }: { userData: any }) {
  const [stats, setStats] = useState({
    totalReferrals: 0,
    activePlayers: 0,
    totalEarnings: 0,
    agentBalance: 0
  });

  useEffect(() => {
    if (!userData?.id) return;

    const userRef = doc(db, 'users', userData.id);
    const path = `users/${userData.id}`;
    const unsubscribe = onSnapshot(userRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setStats(prev => ({
          ...prev,
          totalReferrals: data.referralCount || 0,
          totalEarnings: data.totalReferralEarnings || 0,
          agentBalance: data.agentBalance || 0
        }));
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    });

    // Count active players (referred users)
    const referralsRef = collection(db, 'users', userData.id, 'referrals');
    const referralsPath = `users/${userData.id}/referrals`;
    const q = query(referralsRef, where('status', '==', 'active'));
    const unsubscribePlayers = onSnapshot(q, (snapshot) => {
      setStats(prev => ({ ...prev, activePlayers: snapshot.size }));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, referralsPath);
    });

    return () => {
      unsubscribe();
      unsubscribePlayers();
    };
  }, [userData]);

  const statCards = [
    { label: 'মোট রেফারেল', value: stats.totalReferrals, icon: Users, color: 'text-blue-400', bg: 'bg-blue-400/10' },
    { label: 'সক্রিয় প্লেয়ার', value: stats.activePlayers, icon: Activity, color: 'text-green-400', bg: 'bg-green-400/10' },
    { label: 'মোট উপার্জন', value: `৳${stats.totalEarnings}`, icon: DollarSign, color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
    { label: 'এজেন্ট ব্যালেন্স', value: `৳${stats.agentBalance}`, icon: Wallet, color: 'text-teal-400', bg: 'bg-teal-400/10' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold text-white">ড্যাশবোর্ড ওভারভিউ</h3>
        <div className="text-xs text-teal-500 font-mono bg-teal-950/50 px-3 py-1 rounded-full border border-teal-800">
          LAST UPDATED: {new Date().toLocaleTimeString()}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, index) => (
          <motion.div 
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-[#111827] p-6 rounded-2xl border border-teal-900/30 hover:border-teal-500/30 transition-all group"
          >
            <div className={`w-12 h-12 ${card.bg} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
              <card.icon className={card.color} size={24} />
            </div>
            <p className="text-gray-400 text-sm font-medium">{card.label}</p>
            <p className="text-2xl font-bold text-white mt-1">{card.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions or Recent Activity could go here */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#111827] p-6 rounded-2xl border border-teal-900/30">
          <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
            <TrendingUp size={20} className="text-teal-400" />
            সাম্প্রতিক পারফরম্যান্স
          </h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={[
                { name: 'Day 1', earnings: 400 },
                { name: 'Day 2', earnings: 300 },
                { name: 'Day 3', earnings: 600 },
                { name: 'Day 4', earnings: 800 },
                { name: 'Day 5', earnings: 500 },
                { name: 'Day 6', earnings: 900 },
                { name: 'Day 7', earnings: 1200 },
              ]}>
                <defs>
                  <linearGradient id="colorEarnings" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#14b8a6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                <XAxis dataKey="name" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: '8px' }}
                  itemStyle={{ color: '#14b8a6' }}
                />
                <Area type="monotone" dataKey="earnings" stroke="#14b8a6" fillOpacity={1} fill="url(#colorEarnings)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-[#111827] p-6 rounded-2xl border border-teal-900/30">
          <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Users size={20} className="text-teal-400" />
            দ্রুত লিঙ্ক
          </h4>
          <div className="space-y-3">
            <button className="w-full flex items-center justify-between p-4 bg-teal-900/20 hover:bg-teal-900/40 rounded-xl border border-teal-800/30 transition-colors group">
              <div className="flex items-center gap-3">
                <UserPlus size={20} className="text-teal-400" />
                <span className="text-sm font-medium">নতুন প্লেয়ার আমন্ত্রণ জানান</span>
              </div>
              <ChevronRight size={18} className="text-gray-500 group-hover:text-white transition-colors" />
            </button>
            <button className="w-full flex items-center justify-between p-4 bg-teal-900/20 hover:bg-teal-900/40 rounded-xl border border-teal-800/30 transition-colors group">
              <div className="flex items-center gap-3">
                <DollarSign size={20} className="text-teal-400" />
                <span className="text-sm font-medium">উপার্জন উইথড্র করুন</span>
              </div>
              <ChevronRight size={18} className="text-gray-500 group-hover:text-white transition-colors" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function PlayersTab({ userData, showToast }: { userData: any, showToast: (msg: string, type?: any) => void }) {
  const [players, setPlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!userData?.id) return;

    const referralsRef = collection(db, 'users', userData.id, 'referrals');
    const q = query(referralsRef, orderBy('joinedAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const playersList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPlayers(playersList);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userData]);

  const filteredPlayers = players.filter(p => 
    p.referredUsername.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.referredUserId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h3 className="text-2xl font-bold text-white">আমার প্লেয়ার লিস্ট</h3>
        <div className="relative w-full md:w-64">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input 
            type="text" 
            placeholder="প্লেয়ার খুঁজুন..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#111827] border border-teal-900/30 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-teal-500 transition-colors"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <RefreshCw size={40} className="text-teal-500 animate-spin" />
        </div>
      ) : filteredPlayers.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-teal-900/30">
                <th className="py-4 px-4 text-gray-400 font-medium text-sm">প্লেয়ার</th>
                <th className="py-4 px-4 text-gray-400 font-medium text-sm">যোগদানের তারিখ</th>
                <th className="py-4 px-4 text-gray-400 font-medium text-sm">মোট উপার্জন</th>
                <th className="py-4 px-4 text-gray-400 font-medium text-sm">স্ট্যাটাস</th>
                <th className="py-4 px-4 text-gray-400 font-medium text-sm">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody>
              {filteredPlayers.map((player) => (
                <tr key={player.id} className="border-b border-teal-900/10 hover:bg-teal-900/5 transition-colors">
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-teal-500/20 flex items-center justify-center text-teal-500 font-bold text-xs">
                        {player.referredUsername.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">{player.referredUsername}</p>
                        <p className="text-[10px] text-gray-500 font-mono uppercase">{player.referredUserId.substring(0, 8)}...</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-sm text-gray-300">
                    {player.joinedAt?.toDate ? player.joinedAt.toDate().toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="py-4 px-4 text-sm font-bold text-teal-400">
                    ৳{player.earningsGenerated || 0}
                  </td>
                  <td className="py-4 px-4">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                      player.status === 'active' ? 'bg-green-500/10 text-green-500' : 'bg-gray-500/10 text-gray-500'
                    }`}>
                      {player.status === 'active' ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <button className="p-2 hover:bg-teal-900/30 rounded-lg transition-colors text-teal-400">
                      <BarChart3 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-20 bg-[#111827] rounded-2xl border border-dashed border-teal-900/50">
          <Users size={48} className="text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">কোন প্লেয়ার পাওয়া যায়নি</p>
          <button className="mt-4 text-teal-400 font-bold hover:underline">প্লেয়ারদের আমন্ত্রণ জানান</button>
        </div>
      )}
    </div>
  );
}

function TransferTab({ userData, showToast }: { userData: any, showToast: (msg: string, type?: any) => void }) {
  const [amount, setAmount] = useState('');
  const [targetPlayerId, setTargetPlayerId] = useState('');
  const [isTransferring, setIsTransferring] = useState(false);
  const [players, setPlayers] = useState<any[]>([]);

  useEffect(() => {
    if (!userData?.id) return;
    const path = `users/${userData.id}/referrals`;
    const referralsRef = collection(db, 'users', userData.id, 'referrals');
    getDocs(referralsRef).then(snapshot => {
      setPlayers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }).catch(error => {
      handleFirestoreError(error, OperationType.LIST, path);
    });
  }, [userData]);

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !targetPlayerId) return;
    
    const transferAmount = parseFloat(amount);
    if (isNaN(transferAmount) || transferAmount <= 0) {
      showToast("সঠিক পরিমাণ দিন", "warning");
      return;
    }

    if (transferAmount > (userData?.agentBalance || 0)) {
      showToast("আপনার এজেন্ট ব্যালেন্স পর্যাপ্ত নয়", "error");
      return;
    }

    setIsTransferring(true);
    try {
      await runTransaction(db, async (transaction) => {
        const agentRef = doc(db, 'users', userData.id);
        const playerRef = doc(db, 'users', targetPlayerId);
        
        const agentDoc = await transaction.get(agentRef);
        const playerDoc = await transaction.get(playerRef);

        if (!agentDoc.exists() || !playerDoc.exists()) {
          throw new Error("User not found");
        }

        const currentAgentBalance = agentDoc.data().agentBalance || 0;
        if (currentAgentBalance < transferAmount) {
          throw new Error("Insufficient balance");
        }

        transaction.update(agentRef, { 
          agentBalance: currentAgentBalance - transferAmount 
        });
        
        transaction.update(playerRef, { 
          balance: (playerDoc.data().balance || 0) + transferAmount 
        });

        // Log transaction for agent
        const agentTxRef = doc(collection(db, 'users', userData.id, 'transactions'));
        transaction.set(agentTxRef, {
          trxId: `TRF-${Date.now()}`,
          method: 'Agent Transfer',
          type: 'withdraw',
          amount: -transferAmount,
          date: Timestamp.now(),
          status: 'সম্পন্ন',
          statusColor: 'text-red-500'
        });

        // Log transaction for player
        const playerTxRef = doc(collection(db, 'users', targetPlayerId, 'transactions'));
        transaction.set(playerTxRef, {
          trxId: `TRF-${Date.now()}`,
          method: 'Agent Transfer',
          type: 'deposit',
          amount: transferAmount,
          date: Timestamp.now(),
          status: 'সম্পন্ন',
          statusColor: 'text-green-500'
        });
      });

      showToast("ব্যালেন্স ট্রান্সফার সফল হয়েছে", "success");
      setAmount('');
      setTargetPlayerId('');
    } catch (err: any) {
      console.error("Transfer error:", err);
      showToast("ট্রান্সফার ব্যর্থ হয়েছে", "error");
    } finally {
      setIsTransferring(false);
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-8">
      <div className="text-center">
        <div className="w-16 h-16 bg-teal-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <Send size={32} className="text-teal-400" />
        </div>
        <h3 className="text-2xl font-bold">ব্যালেন্স ট্রান্সফার</h3>
        <p className="text-gray-400 text-sm mt-2">আপনার প্লেয়ারদের ব্যালেন্স টপ-আপ করুন</p>
      </div>

      <div className="bg-[#111827] p-6 rounded-2xl border border-teal-900/30">
        <div className="flex items-center justify-between mb-6">
          <span className="text-gray-400 text-sm">এজেন্ট ব্যালেন্স:</span>
          <span className="text-xl font-bold text-teal-400">৳{userData?.agentBalance || 0}</span>
        </div>

        <form onSubmit={handleTransfer} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">প্লেয়ার সিলেক্ট করুন</label>
            <select 
              value={targetPlayerId}
              onChange={(e) => setTargetPlayerId(e.target.value)}
              className="w-full bg-[#0d1525] border border-teal-900/30 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-teal-500 transition-colors appearance-none"
              required
            >
              <option value="">প্লেয়ার বেছে নিন</option>
              {players.map(p => (
                <option key={p.referredUserId} value={p.referredUserId}>
                  {p.referredUsername} ({p.referredUserId.substring(0, 6)})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">পরিমাণ (৳)</label>
            <input 
              type="number" 
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full bg-[#0d1525] border border-teal-900/30 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-teal-500 transition-colors"
              required
            />
          </div>

          <button 
            type="submit"
            disabled={isTransferring || !amount || !targetPlayerId}
            className="w-full bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 py-4 rounded-xl font-bold text-white shadow-lg shadow-teal-900/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isTransferring ? <RefreshCw size={20} className="animate-spin" /> : <Send size={20} />}
            ট্রান্সফার কনফার্ম করুন
          </button>
        </form>
      </div>
    </div>
  );
}

function EarningsTab({ userData }: { userData: any }) {
  const [earnings, setEarnings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userData?.id) return;
    // For now, we use transactions of type 'bonus' or similar to show earnings
    // In a real app, we might have a separate 'earnings' collection
    const txRef = collection(db, 'users', userData.id, 'transactions');
    const q = query(txRef, where('method', '==', 'Referral Bonus'), orderBy('date', 'desc'), limit(20));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setEarnings(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userData]);

  return (
    <div className="space-y-6">
      <h3 className="text-2xl font-bold text-white">উপার্জন ইতিহাস</h3>
      
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <RefreshCw size={40} className="text-teal-500 animate-spin" />
        </div>
      ) : earnings.length > 0 ? (
        <div className="space-y-3">
          {earnings.map((item) => (
            <div key={item.id} className="bg-[#111827] p-4 rounded-xl border border-teal-900/20 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-green-500/10 rounded-full flex items-center justify-center text-green-500">
                  <DollarSign size={20} />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">{item.trxId}</p>
                  <p className="text-[10px] text-gray-500">{item.date?.toDate().toLocaleString()}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-green-400">+৳{item.amount}</p>
                <p className="text-[10px] text-gray-500 uppercase">{item.status}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-[#111827] rounded-2xl border border-dashed border-teal-900/50">
          <History size={48} className="text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">এখনো কোন উপার্জনের ইতিহাস নেই</p>
        </div>
      )}
    </div>
  );
}

function StatsTab({ userData }: { userData: any }) {
  const data = [
    { name: 'জানু', referrals: 40, earnings: 2400 },
    { name: 'ফেব্রু', referrals: 30, earnings: 1398 },
    { name: 'মার্চ', referrals: 20, earnings: 9800 },
    { name: 'এপ্রিল', referrals: 27, earnings: 3908 },
    { name: 'মে', referrals: 18, earnings: 4800 },
    { name: 'জুন', referrals: 23, earnings: 3800 },
  ];

  return (
    <div className="space-y-8">
      <h3 className="text-2xl font-bold text-white">পারফরম্যান্স অ্যানালিটিক্স</h3>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#111827] p-6 rounded-2xl border border-teal-900/30">
          <h4 className="text-lg font-bold mb-6">মাসিক রেফারেল</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                <XAxis dataKey="name" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  cursor={{ fill: '#1f2937' }}
                  contentStyle={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: '8px' }}
                />
                <Bar dataKey="referrals" fill="#14b8a6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-[#111827] p-6 rounded-2xl border border-teal-900/30">
          <h4 className="text-lg font-bold mb-6">মাসিক উপার্জন</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                <XAxis dataKey="name" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  cursor={{ fill: '#1f2937' }}
                  contentStyle={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: '8px' }}
                />
                <Bar dataKey="earnings" fill="#eab308" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
