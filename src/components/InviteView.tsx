import React, { useState } from "react";
import { Copy, HelpCircle, Share2, User, Users, Award, Facebook, Twitter, MessageCircle, Send, Gift, ChevronLeft, TrendingUp, DollarSign, Target, ShoppingCart, Package, Crown, Coins, Zap, Shield, Star } from "lucide-react";

const shopCategories = [
  { id: 'vip', name: 'ভিআইপি (VIP)', icon: Crown },
  { id: 'coins', name: 'কয়েন (Coins)', icon: Coins },
  { id: 'offers', name: 'অফার (Offers)', icon: Gift },
];

const shopItems = {
  vip: [
    { id: 'v1', name: 'VIP Bronze', price: '৳ 500', icon: Shield, color: 'text-orange-400', bg: 'bg-orange-400/20', border: 'border-orange-400/50', desc: 'দৈনিক ৫% ক্যাশব্যাক' },
    { id: 'v2', name: 'VIP Silver', price: '৳ 1,000', icon: Star, color: 'text-gray-300', bg: 'bg-gray-300/20', border: 'border-gray-300/50', desc: 'দৈনিক ১০% ক্যাশব্যাক' },
    { id: 'v3', name: 'VIP Gold', price: '৳ 5,000', icon: Crown, color: 'text-yellow-400', bg: 'bg-yellow-400/20', border: 'border-yellow-400/50', desc: 'দৈনিক ১৫% ক্যাশব্যাক' },
  ],
  coins: [
    { id: 'c1', name: '10,000 Coins', price: '৳ 100', icon: Coins, color: 'text-yellow-500', bg: 'bg-yellow-500/20', border: 'border-yellow-500/50', desc: '+500 বোনাস' },
    { id: 'c2', name: '50,000 Coins', price: '৳ 450', icon: Coins, color: 'text-yellow-500', bg: 'bg-yellow-500/20', border: 'border-yellow-500/50', desc: '+3,000 বোনাস' },
    { id: 'c3', name: '100,000 Coins', price: '৳ 800', icon: Coins, color: 'text-yellow-500', bg: 'bg-yellow-500/20', border: 'border-yellow-500/50', desc: '+10,000 বোনাস' },
  ],
  offers: [
    { id: 'o1', name: 'Welcome Pack', price: '৳ 200', icon: Zap, color: 'text-blue-400', bg: 'bg-blue-400/20', border: 'border-blue-400/50', desc: '20k Coins + VIP 1 Day' },
    { id: 'o2', name: 'Weekend Special', price: '৳ 500', icon: Gift, color: 'text-purple-400', bg: 'bg-purple-400/20', border: 'border-purple-400/50', desc: '50k Coins + 5 Free Spins' },
  ]
};

export default function InviteView({ onTabChange, setIsLoading, userData, initialSubTab = 'overview' }: { onTabChange: (tab: any) => void, setIsLoading: (loading: boolean) => void, userData?: any, initialSubTab?: string }) {
  const [activeTab, setActiveTab] = useState(initialSubTab);
  const [activeShopCategory, setActiveShopCategory] = useState('vip');
  const [totalShares, setTotalShares] = useState(12);
  
  const currentReferrals = userData?.referralCount || 0;
  const totalEarned = userData?.totalReferralEarnings || 0;

  const tiers = [
    { count: 1, reward: 50 },
    { count: 5, reward: 300 },
    { count: 10, reward: 1000 },
    { count: 25, reward: 2500 },
    { count: 50, reward: 5000 },
  ];

  const nextTier = tiers.find(t => t.count > currentReferrals) || tiers[tiers.length - 1];
  const isMaxTier = currentReferrals >= tiers[tiers.length - 1].count;
  
  const progressToNext = isMaxTier ? 100 : (currentReferrals / nextTier.count) * 100;

  const incrementShares = () => setTotalShares(prev => prev + 1);

  const getProgress = (min: number, max: number) => {
    if (currentReferrals < min) return 0;
    if (currentReferrals >= max) return 100;
    return ((currentReferrals - min) / (max - min)) * 100;
  };
  
  const referralLink = "https://spin71bet.com/?ref=xjf8463";

  const handleShare = async () => {
    setIsLoading(true);
    const shareData = {
      title: 'SPIN71 BET - আমার রেফারেল লিঙ্ক',
      text: 'আমার রেফারেল লিঙ্ক ব্যবহার করে যোগ দিন এবং বোনাস পান!',
      url: referralLink,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        incrementShares();
      } else {
        navigator.clipboard.writeText(referralLink);
        alert('লিঙ্কটি কপি করা হয়েছে!');
        incrementShares();
      }
    } catch (err: any) {
      console.error('Error sharing:', err);
    } finally {
      setTimeout(() => setIsLoading(false), 990);
    }
  };

  const copyToClipboard = () => {
    setIsLoading(true);
    navigator.clipboard.writeText(referralLink);
    setTimeout(() => {
      setIsLoading(false);
      alert("লিঙ্কটি কপি করা হয়েছে!");
      incrementShares();
    }, 990);
  };

  const handleBuyItem = (item: any) => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      alert(`${item.name} কেনার জন্য পর্যাপ্ত ব্যালেন্স নেই!`);
    }, 990);
  };

  return (
    <div className="flex-1 overflow-y-auto pb-24 bg-[#0b0b0b]">
      {/* Header */}
      <div className="bg-[#128a61] p-4 pt-6 rounded-b-3xl shadow-lg relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-yellow-400/20 rounded-full blur-3xl"></div>
        
        <div className="flex justify-between items-center relative z-10">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => onTabChange('home')}
              className="p-2 bg-black/20 hover:bg-black/40 rounded-full transition-colors text-white backdrop-blur-sm"
            >
              <ChevronLeft size={20} />
            </button>
            <h2 className="text-2xl font-black italic tracking-tighter text-white drop-shadow-md">
              SPIN71 <span className="text-yellow-400">INVITE</span>
            </h2>
          </div>
          <div className="bg-black/30 px-3 py-1.5 rounded-full flex items-center gap-2 border border-white/10 backdrop-blur-sm">
            <Users size={16} className="text-yellow-400" />
            <span className="text-white font-bold text-sm">আমন্ত্রণ</span>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="mt-6 grid grid-cols-2 gap-3 relative z-10">
          <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-3 border border-white/10">
            <div className="flex items-center gap-2 text-teal-100 mb-1">
              <Users size={14} />
              <span className="text-xs">মোট রেফারেল</span>
            </div>
            <div className="text-2xl font-black text-white">{currentReferrals} <span className="text-sm font-normal text-teal-200">জন</span></div>
          </div>
          <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-3 border border-white/10">
            <div className="flex items-center gap-2 text-teal-100 mb-1">
              <DollarSign size={14} />
              <span className="text-xs">মোট আয়</span>
            </div>
            <div className="text-2xl font-black text-yellow-400">৳ {totalEarned}</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 mt-6">
        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
          {[
            { id: 'overview', name: 'সংক্ষিপ্ত বর্ণনা' },
            { id: 'shop', name: 'শপ (Shop)' },
            { id: 'earnings', name: 'আয়' },
            { id: 'leaderboard', name: 'লিডারবোর্ড' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-2.5 rounded-full font-bold whitespace-nowrap transition-all ${
                activeTab === tab.id 
                  ? 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-black shadow-[0_0_15px_rgba(250,204,21,0.4)]' 
                  : 'bg-[#1b1b1b] text-gray-400 border border-white/5 hover:bg-[#252525]'
              }`}
            >
              {tab.name}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'overview' && (
        <div className="p-4 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Next Reward Card */}
          <div className="bg-gradient-to-br from-[#128a61] to-[#0a4d3c] p-5 rounded-2xl shadow-xl border border-white/10 relative overflow-hidden">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-yellow-400/10 rounded-full blur-2xl"></div>
            <div className="relative z-10">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center border border-yellow-500/30">
                    <Award size={20} className="text-yellow-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-black text-sm italic">পরবর্তী পুরস্কার (Next Reward)</h3>
                    <p className="text-[10px] text-teal-200">আরও {isMaxTier ? 0 : nextTier.count - currentReferrals} জন বন্ধুকে আমন্ত্রণ জানান</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-yellow-400 font-black text-lg italic">৳ {nextTier.reward}</div>
                  <div className="text-[9px] text-teal-300 uppercase font-bold tracking-wider">বোনাস</div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-bold text-teal-100">
                  <span>অগ্রগতি (Progress)</span>
                  <span>{Math.round(progressToNext)}%</span>
                </div>
                <div className="relative h-2.5 bg-black/40 rounded-full overflow-hidden border border-white/5">
                  <div 
                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-yellow-600 via-yellow-400 to-yellow-500 rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(250,204,21,0.3)]"
                    style={{ width: `${progressToNext}%` }}
                  >
                    <div className="absolute inset-0 bg-white/20 animate-[loading_2s_linear_infinite]"></div>
                  </div>
                </div>
                <div className="flex justify-between text-[9px] text-teal-300 font-medium">
                  <span>{currentReferrals} রেফারেল</span>
                  <span>{nextTier.count} রেফারেল</span>
                </div>
              </div>
            </div>
          </div>

          {/* Revenue Goal Banner */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-5 rounded-2xl shadow-lg relative overflow-hidden group">
            <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full blur-2xl transform translate-x-1/2 -translate-y-1/2 group-hover:scale-150 transition-transform duration-700"></div>
            <div className="flex justify-between items-center relative z-10">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="font-bold text-white text-lg">রাজস্ব লক্ষ্য</h2>
                  <Target size={18} className="text-blue-200" />
                </div>
                <p className="text-sm text-blue-100">বন্ধুদের আমন্ত্রণ জানান এবং এক্সট্রা বোনাস জিতুন!</p>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/30">
                <Gift size={24} className="text-white" />
              </div>
            </div>
          </div>

          {/* Share Section */}
          <div className="bg-[#1b1b1b] p-5 rounded-2xl border border-white/5">
            <h3 className="text-white font-bold mb-3 flex items-center gap-2">
              <Share2 size={18} className="text-teal-400" />
              আপনার রেফারেল লিঙ্ক শেয়ার করুন
            </h3>
            
            <div className="flex items-center gap-2 bg-black/50 p-2 rounded-xl border border-white/10 mb-4">
              <span className="text-sm text-gray-300 truncate flex-1 pl-2 font-mono">{referralLink}</span>
              <button 
                onClick={copyToClipboard}
                className="bg-teal-600 hover:bg-teal-500 text-white p-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Copy size={18} />
                <span className="text-xs font-bold">কপি করুন</span>
              </button>
            </div>

            <div className="grid grid-cols-4 gap-3">
              <button onClick={handleShare} className="flex flex-col items-center gap-2 group">
                <div className="w-12 h-12 rounded-full bg-[#1877F2]/20 text-[#1877F2] flex items-center justify-center group-hover:bg-[#1877F2] group-hover:text-white transition-all">
                  <Facebook size={24} />
                </div>
                <span className="text-[10px] text-gray-400">Facebook</span>
              </button>
              <button onClick={handleShare} className="flex flex-col items-center gap-2 group">
                <div className="w-12 h-12 rounded-full bg-[#25D366]/20 text-[#25D366] flex items-center justify-center group-hover:bg-[#25D366] group-hover:text-white transition-all">
                  <MessageCircle size={24} />
                </div>
                <span className="text-[10px] text-gray-400">WhatsApp</span>
              </button>
              <button onClick={handleShare} className="flex flex-col items-center gap-2 group">
                <div className="w-12 h-12 rounded-full bg-[#0088cc]/20 text-[#0088cc] flex items-center justify-center group-hover:bg-[#0088cc] group-hover:text-white transition-all">
                  <Send size={24} />
                </div>
                <span className="text-[10px] text-gray-400">Telegram</span>
              </button>
              <button onClick={handleShare} className="flex flex-col items-center gap-2 group">
                <div className="w-12 h-12 rounded-full bg-white/10 text-white flex items-center justify-center group-hover:bg-white group-hover:text-black transition-all">
                  <Share2 size={24} />
                </div>
                <span className="text-[10px] text-gray-400">More</span>
              </button>
            </div>
          </div>

          {/* Progress Section */}
          <div className="bg-[#1b1b1b] p-5 rounded-2xl border border-white/5">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-white font-bold flex items-center gap-2">
                <TrendingUp size={18} className="text-yellow-400" />
                পুরস্কারের স্তরসমূহ (Reward Tiers)
              </h3>
            </div>
            
            <div className="relative h-4 bg-black rounded-full overflow-hidden border border-white/10 mb-6">
              <div 
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-teal-600 to-teal-400 rounded-full transition-all duration-1000"
                style={{ width: `${getProgress(0, 50)}%` }}
              >
                <div className="absolute inset-0 bg-white/20 animate-[loading_2s_linear_infinite]"></div>
              </div>
              {/* Tier Markers */}
              {tiers.map((tier, idx) => (
                <div 
                  key={idx}
                  className="absolute top-0 w-0.5 h-full bg-white/20"
                  style={{ left: `${(tier.count / 50) * 100}%` }}
                />
              ))}
            </div>
            
            <div className="grid grid-cols-5 gap-1">
              {tiers.map((tier, idx) => (
                <div key={idx} className="flex flex-col items-center gap-1.5">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all ${currentReferrals >= tier.count ? 'bg-yellow-500 border-yellow-400 text-black shadow-[0_0_10px_rgba(250,204,21,0.3)]' : 'bg-black border-white/10 text-gray-500'}`}>
                    <span className="text-[10px] font-black">{tier.count}</span>
                  </div>
                  <span className={`text-[9px] font-bold ${currentReferrals >= tier.count ? 'text-yellow-400' : 'text-gray-500'}`}>৳{tier.reward}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'shop' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Categories */}
          <div className="px-4 mt-6">
            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
              {shopCategories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setActiveShopCategory(cat.id)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-bold whitespace-nowrap transition-all ${
                    activeShopCategory === cat.id 
                      ? 'bg-teal-600 text-white shadow-[0_0_15px_rgba(20,184,166,0.4)]' 
                      : 'bg-[#1b1b1b] text-gray-400 border border-white/5 hover:bg-[#252525]'
                  }`}
                >
                  <cat.icon size={16} className={activeShopCategory === cat.id ? 'text-white' : 'text-gray-400'} />
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Items Grid */}
          <div className="p-4 grid grid-cols-2 gap-4">
            {shopItems[activeShopCategory as keyof typeof shopItems].map(item => (
              <div 
                key={item.id} 
                className={`bg-[#1b1b1b] rounded-2xl p-4 border ${item.border} flex flex-col items-center relative overflow-hidden group hover:scale-105 transition-transform`}
              >
                {/* Background Glow */}
                <div className={`absolute inset-0 ${item.bg} opacity-20 group-hover:opacity-40 transition-opacity`}></div>
                
                <div className={`w-14 h-14 rounded-full ${item.bg} flex items-center justify-center mb-3 relative z-10 shadow-lg`}>
                  <item.icon size={28} className={item.color} />
                </div>
                
                <h3 className="text-white font-bold text-center text-sm mb-1 relative z-10">{item.name}</h3>
                <p className="text-gray-400 text-[10px] text-center mb-3 h-6 relative z-10">{item.desc}</p>
                
                <div className="w-full mt-auto relative z-10">
                  <button 
                    onClick={() => handleBuyItem(item)}
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white font-bold py-2 rounded-xl text-sm shadow-lg transition-all active:scale-95 flex items-center justify-center gap-1"
                  >
                    {item.price}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab !== 'overview' && activeTab !== 'shop' && (
        <div className="p-8 flex flex-col items-center justify-center text-center animate-in fade-in duration-500">
          <div className="w-20 h-20 bg-[#1b1b1b] rounded-full flex items-center justify-center mb-4 border border-white/5 shadow-lg">
            <Award size={32} className="text-teal-500" />
          </div>
          <h3 className="text-white font-bold text-lg mb-2">শীঘ্রই আসছে!</h3>
          <p className="text-gray-400 text-sm">এই ফিচারটি নিয়ে আমরা কাজ করছি। খুব শীঘ্রই এটি যুক্ত করা হবে।</p>
        </div>
      )}
    </div>
  );
}
