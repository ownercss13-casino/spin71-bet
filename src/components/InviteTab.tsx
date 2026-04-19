import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  UserPlus, 
  Copy, 
  Check, 
  Share2, 
  QrCode, 
  Gift, 
  Users, 
  Coins, 
  TrendingUp, 
  ChevronRight, 
  Facebook, 
  MessageCircle, 
  Send, 
  X,
  Gamepad2,
  Trophy,
  Zap,
  Star
} from 'lucide-react';

interface InviteTabProps {
  userData: any;
  showToast: (msg: string, type?: any) => void;
  onBack: () => void;
}

export default function InviteTab({ userData, showToast, onBack }: InviteTabProps) {
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);

  const referralCode = userData?.referralCode || 'SPIN71';
  const referralLink = `${window.location.origin}/?ref=${referralCode}`;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    showToast("লিঙ্ক কপি করা হয়েছে!", "success");
    setTimeout(() => setCopied(false), 2000);
  };

  const shareStats = [
    { label: 'মোট আমন্ত্রিত', value: '১২', icon: Users, color: 'text-blue-400' },
    { label: 'অর্জিত বোনাস', value: '৳ ১,৫০০', icon: Coins, color: 'text-yellow-500' },
    { label: 'সক্রিয় বন্ধু', value: '৮', icon: Zap, color: 'text-emerald-400' },
  ];

  const gamesToInvite = [
    { name: 'Crazy Time', provider: 'Evolution', image: 'https://picsum.photos/seed/crazy/200/120', rating: 4.9 },
    { name: 'Aviator', provider: 'Spribe', image: 'https://picsum.photos/seed/aviator/200/120', rating: 4.8 },
    { name: 'Gate of Olympus', provider: 'Pragmatic', image: 'https://picsum.photos/seed/olympus/200/120', rating: 4.9 },
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 p-4 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-teal-900 to-teal-950 rounded-[40px] p-8 border border-teal-700/50 shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/5 rounded-full blur-[100px] -mr-32 -mt-32"></div>
        <div className="relative z-10 flex justify-between items-start">
          <div>
            <div className="w-16 h-16 rounded-2xl bg-yellow-500/20 flex items-center justify-center text-yellow-500 mb-4 shadow-xl border border-yellow-500/20">
              <UserPlus size={32} />
            </div>
            <h2 className="text-3xl font-black text-white italic tracking-tight">বন্ধুদের আমন্ত্রণ</h2>
            <div className="bg-yellow-500/10 border border-yellow-500/20 px-3 py-1 rounded-lg mt-3 inline-block">
               <p className="text-yellow-500 text-sm font-bold">প্রতি রেফারে ৩০৮ টাকা বোনাস!</p>
            </div>
            <p className="text-teal-400 text-xs font-bold uppercase tracking-widest mt-2">{`Invite Friends & Earn ৳308 Bonus!`}</p>
          </div>
          <button 
            onClick={onBack}
            className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-white hover:bg-red-500 transition-all border border-white/10"
          >
            <X size={24} />
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3">
        {shareStats.map((stat, idx) => (
          <div key={idx} className="bg-teal-900/40 p-4 rounded-3xl border border-teal-700/50 text-center shadow-lg">
            <div className={`w-10 h-10 rounded-xl bg-black/20 flex items-center justify-center mx-auto mb-2 ${stat.color}`}>
              <stat.icon size={20} />
            </div>
            <p className="text-[10px] text-teal-500 font-bold uppercase tracking-tighter mb-1">{stat.label}</p>
            <p className="text-sm font-black text-white italic">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Referral Link Card */}
      <div className="bg-teal-900/40 rounded-[36px] p-6 border border-teal-700/50 shadow-xl space-y-6">
        <div className="space-y-2">
          <label className="text-[10px] text-teal-500 font-black uppercase tracking-widest ml-2">আপনার রেফারেল লিঙ্ক</label>
          <div className="flex gap-2">
            <div className="flex-1 bg-black/40 border border-teal-700/50 rounded-2xl px-4 py-3 text-white text-xs font-mono truncate flex items-center">
              {referralLink}
            </div>
            <button 
              onClick={() => copyToClipboard(referralLink)}
              className="w-12 h-12 rounded-2xl bg-yellow-500 flex items-center justify-center text-black hover:bg-yellow-400 transition-all shadow-lg shadow-yellow-500/20"
            >
              {copied ? <Check size={20} /> : <Copy size={20} />}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-black/20 rounded-2xl p-4 border border-white/5 flex items-center justify-between group cursor-pointer" onClick={() => setShowQR(true)}>
            <div>
              <p className="text-[10px] text-teal-500 font-black uppercase tracking-widest">QR কোড</p>
              <p className="text-xs text-white font-bold mt-1">স্ক্যান করে শেয়ার</p>
            </div>
            <QrCode size={24} className="text-yellow-500 group-hover:scale-110 transition-transform" />
          </div>
          <div className="bg-black/20 rounded-2xl p-4 border border-white/5 flex items-center justify-between group cursor-pointer">
            <div>
              <p className="text-[10px] text-teal-500 font-black uppercase tracking-widest">রেফারেল কোড</p>
              <p className="text-xs text-white font-bold mt-1">{referralCode}</p>
            </div>
            <Copy size={20} className="text-teal-400 group-hover:scale-110 transition-transform" onClick={() => copyToClipboard(referralCode)} />
          </div>
        </div>
      </div>

      {/* Social Sharing */}
      <div className="space-y-4">
        <h3 className="text-sm font-black text-white italic uppercase tracking-widest ml-2">সরাসরি শেয়ার করুন</h3>
        <div className="flex justify-between gap-4">
          {[
            { icon: Facebook, color: 'bg-[#1877F2]', label: 'Facebook' },
            { icon: MessageCircle, color: 'bg-[#25D366]', label: 'WhatsApp' },
            { icon: Send, color: 'bg-[#0088cc]', label: 'Telegram' },
            { icon: Share2, color: 'bg-teal-600', label: 'More' },
          ].map((social, idx) => (
            <button key={idx} className="flex flex-col items-center gap-2 group">
              <div className={`w-14 h-14 rounded-2xl ${social.color} flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-all group-active:scale-90`}>
                <social.icon size={24} />
              </div>
              <span className="text-[10px] text-teal-500 font-bold uppercase tracking-tighter">{social.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Game Details / Invite to Play */}
      <div className="space-y-4">
        <div className="flex justify-between items-center px-2">
          <h3 className="text-sm font-black text-white italic uppercase tracking-widest">গেম খেলতে আমন্ত্রণ জানান</h3>
          <button className="text-[10px] text-yellow-500 font-black uppercase tracking-widest flex items-center gap-1">
            সব দেখুন <ChevronRight size={12} />
          </button>
        </div>
        
        <div className="space-y-3">
          {gamesToInvite.map((game, idx) => (
            <div key={idx} className="bg-teal-900/40 rounded-[32px] p-4 border border-teal-700/50 flex items-center gap-4 group">
              <div className="w-24 h-16 rounded-2xl overflow-hidden relative shadow-lg">
                <img src={game.image} alt={game.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                <div className="absolute top-1 right-1 bg-black/60 backdrop-blur-md px-1.5 py-0.5 rounded-lg flex items-center gap-1">
                  <Star size={8} className="text-yellow-500 fill-yellow-500" />
                  <span className="text-[8px] text-white font-bold">{game.rating}</span>
                </div>
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-black text-white italic">{game.name}</h4>
                <p className="text-[10px] text-teal-500 font-bold">{game.provider}</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex items-center gap-1 text-[8px] text-yellow-500 font-bold uppercase">
                    <Trophy size={10} /> বড় জয়
                  </div>
                  <span className="w-1 h-1 rounded-full bg-teal-800"></span>
                  <div className="flex items-center gap-1 text-[8px] text-teal-400 font-bold uppercase">
                    <Zap size={10} /> দ্রুত পেমেন্ট
                  </div>
                </div>
              </div>
              <button className="bg-yellow-500/10 text-yellow-500 p-3 rounded-2xl border border-yellow-500/20 hover:bg-yellow-500 hover:text-black transition-all">
                <Send size={18} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* QR Modal */}
      <AnimatePresence>
        {showQR && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowQR(false)}
              className="absolute inset-0 bg-black/95 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-gradient-to-br from-teal-900 to-teal-950 rounded-[40px] p-10 max-w-sm w-full border border-teal-700/50 shadow-2xl relative z-10 text-center"
              onClick={e => e.stopPropagation()}
            >
              <div className="w-20 h-20 rounded-3xl bg-yellow-500/20 flex items-center justify-center text-yellow-500 mx-auto mb-6 shadow-xl border border-yellow-500/20">
                <QrCode size={40} />
              </div>
              <h3 className="text-2xl font-black text-white italic mb-2">QR কোড স্ক্যান করুন</h3>
              <p className="text-teal-400 text-xs font-bold uppercase tracking-widest mb-8">Scan to join Spin71</p>
              
              <div className="bg-white p-6 rounded-[32px] shadow-2xl mb-8 inline-block">
                {/* Placeholder for real QR code */}
                <div className="w-48 h-48 bg-slate-100 rounded-2xl flex items-center justify-center border-4 border-slate-200">
                  <QrCode size={120} className="text-slate-800" />
                </div>
              </div>

              <button 
                onClick={() => setShowQR(false)}
                className="w-full py-4 bg-yellow-500 text-black font-black italic uppercase tracking-widest rounded-2xl shadow-xl shadow-yellow-500/20 transition-all active:scale-95"
              >
                বন্ধ করুন
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
