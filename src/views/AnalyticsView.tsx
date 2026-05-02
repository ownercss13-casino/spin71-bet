import React, { useMemo } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Target, 
  Zap, 
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  PieChart as PieChartIcon,
  Calendar,
  Layers,
  ArrowLeft
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
import { motion } from 'motion/react';

interface AnalyticsViewProps {
  balance: number;
  userData: any;
  onBack: () => void;
}

export default function AnalyticsView({ balance, userData, onBack }: AnalyticsViewProps) {
  // Simulated data for charts
  const performanceData = [
    { name: 'Mon', profit: 1200, volume: 5000 },
    { name: 'Tue', profit: -800, volume: 4200 },
    { name: 'Wed', profit: 2500, volume: 8500 },
    { name: 'Thu', profit: 1100, volume: 6000 },
    { name: 'Fri', profit: -1500, volume: 12000 },
    { name: 'Sat', profit: 3200, volume: 15000 },
    { name: 'Sun', profit: 1800, volume: 9000 },
  ];

  const gameDistribution = [
    { name: 'Aviator', value: 45, color: '#f87171' },
    { name: 'Slots', value: 25, color: '#60a5fa' },
    { name: 'Casino', value: 20, color: '#fbbf24' },
    { name: 'Others', value: 10, color: '#10b981' },
  ];

  const turnoverProgress = useMemo(() => {
    const current = userData?.turnover || 25000;
    const required = userData?.requiredTurnover || 50000;
    const percentage = Math.min(100, Math.floor((current / required) * 100));
    return { current, required, percentage };
  }, [userData]);

  return (
    <div className="flex-1 flex flex-col bg-[var(--bg-main)] min-h-screen pb-24 transition-colors duration-300">
      {/* Header */}
      <div className="p-4 flex items-center justify-between sticky top-0 z-50 bg-[var(--bg-main)]/80 backdrop-blur-md border-b border-[var(--border-color)]">
        <button onClick={onBack} className="p-2 hover:bg-white/5 rounded-2xl text-[var(--text-main)] transition-all">
          <ArrowLeft size={24} />
        </button>
        <h2 className="text-xl font-black italic text-[var(--text-main)] uppercase tracking-tighter">
          স্মার্ট <span className="text-yellow-500">অ্যানালিটিক্স</span>
        </h2>
        <div className="w-10"></div> {/* Spacer for symmetry */}
      </div>

      <div className="p-4 space-y-6">
        {/* Quick Summary Cards */}
        <div className="grid grid-cols-2 gap-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-green-500/10 border border-green-500/20 p-4 rounded-[32px] relative overflow-hidden"
          >
            <div className="absolute -right-4 -top-4 w-16 h-16 bg-green-500/20 rounded-full blur-2xl"></div>
            <TrendingUp size={24} className="text-green-500 mb-2" />
            <p className="text-[10px] font-black text-green-500/80 uppercase tracking-widest leading-none mb-1">মোট জয় (Total Win)</p>
            <p className="text-2xl font-black text-green-400 italic">৳ ১২,৫০০</p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-orange-500/10 border border-orange-500/20 p-4 rounded-[32px] relative overflow-hidden"
          >
            <div className="absolute -right-4 -top-4 w-16 h-16 bg-orange-500/20 rounded-full blur-2xl"></div>
            <Activity size={24} className="text-orange-500 mb-2" />
            <p className="text-[10px] font-black text-orange-500/80 uppercase tracking-widest leading-none mb-1">বাজি ধরা (Total Bet)</p>
            <p className="text-2xl font-black text-orange-400 italic">৳ ৮৫,০০০</p>
          </motion.div>
        </div>

        {/* Statistics Sections removed to hide Turnover */}

        {/* Performance Chart */}
        <div className="bg-[var(--bg-card)] rounded-[40px] p-6 border border-[var(--border-color)]">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-white font-black italic uppercase tracking-tight flex items-center gap-2">
              <BarChart3 className="text-yellow-500" size={20} />
              লাভ-ক্ষতির চার্ট
            </h3>
            <div className="flex bg-black/20 rounded-full p-1">
              <button className="px-3 py-1 bg-white/10 rounded-full text-[9px] font-black text-white">WEEK</button>
              <button className="px-3 py-1 rounded-full text-[9px] font-black text-gray-400">MONTH</button>
            </div>
          </div>
          
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={performanceData}>
                <defs>
                  <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#fbbf24" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 10, fontWeight: 900 }} 
                />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#0f172a', 
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '16px',
                    fontSize: '12px',
                    color: '#fff'
                  }}
                  itemStyle={{ color: '#fbbf24' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="profit" 
                  stroke="#fbbf24" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorProfit)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Game Distribution Pie Chart */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <div className="bg-[var(--bg-card)] rounded-[40px] p-6 border border-[var(--border-color)]">
              <h3 className="text-white font-black italic uppercase tracking-tight flex items-center gap-2 mb-6">
                <PieChartIcon className="text-blue-500" size={20} />
                গেম ডিস্ট্রিবিউশন
              </h3>
              <div className="flex items-center gap-4">
                <div className="w-32 h-32">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={gameDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={30}
                        outerRadius={50}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {gameDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 space-y-2">
                  {gameDistribution.map((item) => (
                    <div key={item.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></div>
                        <span className="text-[10px] font-bold text-gray-400 capitalize">{item.name}</span>
                      </div>
                      <span className="text-[10px] font-black text-white">{item.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
           </div>

           {/* Betting Intensity */}
           <div className="bg-[var(--bg-card)] rounded-[40px] p-6 border border-[var(--border-color)]">
              <h3 className="text-white font-black italic uppercase tracking-tight flex items-center gap-2 mb-6">
                <Zap className="text-purple-500" size={20} />
                বেটিং ইনটেনসিটি
              </h3>
              <div className="h-32 w-full">
                <ResponsiveContainer width="100%" height="100%">
                   <BarChart data={performanceData}>
                      <Bar dataKey="volume" radius={[4, 4, 0, 0]}>
                         {performanceData.map((entry, index) => (
                           <Cell key={`cell-${index}`} fill={entry.volume > 10000 ? '#a855f7' : '#6366f1'} />
                         ))}
                      </Bar>
                   </BarChart>
                </ResponsiveContainer>
              </div>
              <p className="text-[10px] text-gray-500 font-bold text-center mt-2 italic">গত ৭ দিনের বেটিং ভলিউম</p>
           </div>
        </div>

        {/* Comparison Section */}
        <div className="bg-yellow-500/5 border border-yellow-500/10 rounded-[40px] p-8 text-center space-y-4">
           <Zap className="text-yellow-500 mx-auto" size={40} />
           <h4 className="text-xl font-black text-white italic uppercase tracking-tighter">গড় জয়ের হার ২.৫গুণ বেড়েছে!</h4>
           <p className="text-gray-400 text-xs font-medium leading-relaxed">
             আপনার গত মাসের তুলনায় এই মাসে জয়ের হার অনেক ভালো। বিশেষ করে Aviator গেমে আপনার পারফরম্যান্স অসাধারণ!
           </p>
           <button className="w-full bg-yellow-500 text-black font-black italic uppercase tracking-widest py-4 rounded-3xl active:scale-95 transition-all shadow-xl shadow-yellow-500/20">
             টিপস দেখুন (Get Tips)
           </button>
        </div>
      </div>
    </div>
  );
}
