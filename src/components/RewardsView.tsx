import React from "react";
import { ChevronLeft, Award, Gift, Star, Zap, Trophy, Target, CheckCircle2 } from "lucide-react";

interface RewardsViewProps {
  onTabChange: (tab: any) => void;
  userData: any;
  setUserData: (data: any) => void;
  balance: number;
  setBalance: (balance: number) => void;
}

export default function RewardsView({ onTabChange, userData, setUserData, balance, setBalance }: RewardsViewProps) {
  const rewards = [
    { id: 1, title: "ডেইলি লগইন বোনাস", desc: "প্রতিদিন লগইন করুন এবং পুরস্কার জিতুন", icon: Zap, color: "text-yellow-400", bg: "bg-yellow-400/10", amount: "৳ ১০", isCompleted: false },
    { id: 2, title: "প্রথম জমা বোনাস", desc: "আপনার প্রথম জমার উপর ১০০% বোনাস পান", icon: Gift, color: "text-teal-400", bg: "bg-teal-400/10", amount: "৳ ৫০০+", isCompleted: false },
    { id: 3, title: "সাপ্তাহিক চ্যালেঞ্জ", desc: "সাপ্তাহিক মিশন সম্পন্ন করুন", icon: Trophy, color: "text-purple-400", bg: "bg-purple-400/10", amount: "৳ ১০০০", isCompleted: false },
    { id: 4, title: "রেফারেল বোনাস", desc: "বন্ধুদের আমন্ত্রণ জানান এবং আয় করুন", icon: Star, color: "text-blue-400", bg: "bg-blue-400/10", amount: "৳ ৯৯৯", isCompleted: false },
  ];

  return (
    <div className="flex-1 overflow-y-auto pb-24 bg-[#0b0b0b] min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-b from-[#128a61] to-[#0b0b0b] p-4 pt-6 rounded-b-3xl shadow-lg relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
        
        <div className="flex justify-between items-center relative z-10">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => onTabChange('home')}
              className="p-2 bg-black/20 hover:bg-black/40 rounded-full transition-colors text-white backdrop-blur-sm"
            >
              <ChevronLeft size={20} />
            </button>
            <h2 className="text-2xl font-black italic tracking-tighter text-white drop-shadow-md">
              SPIN71 <span className="text-yellow-400">REWARDS</span>
            </h2>
          </div>
          <div className="bg-black/30 px-3 py-1.5 rounded-full flex items-center gap-2 border border-white/10 backdrop-blur-sm">
            <Award size={16} className="text-yellow-400" />
            <span className="text-white font-bold text-sm">পুরস্কার</span>
          </div>
        </div>

        <div className="mt-8 text-center relative z-10 animate-in fade-in zoom-in duration-700">
          <div className="inline-block p-4 bg-yellow-400/20 rounded-full mb-4 border border-yellow-400/30">
            <Trophy size={48} className="text-yellow-400" />
          </div>
          <h1 className="text-2xl font-black text-white mb-2">পুরস্কার সেন্টার</h1>
          <p className="text-teal-100 text-sm max-w-[250px] mx-auto">মিশন সম্পন্ন করুন এবং এক্সক্লুসিভ বোনাস আনলক করুন!</p>
        </div>
      </div>

      {/* Rewards List */}
      <div className="p-4 space-y-4">
        <h3 className="text-white font-bold flex items-center gap-2 mb-2">
          <Target size={18} className="text-teal-400" />
          উপলব্ধ পুরস্কার (Available Rewards)
        </h3>
        
        <div className="grid gap-3">
          {rewards.map((reward) => (
            <div 
              key={reward.id}
              className={`bg-[#1b1b1b] p-4 rounded-2xl border border-white/5 flex items-center justify-between group transition-all ${reward.isCompleted ? 'opacity-70 grayscale-[0.5]' : 'hover:border-teal-500/30'}`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl ${reward.bg} flex items-center justify-center shadow-lg relative`}>
                  <reward.icon size={24} className={reward.color} />
                  {reward.isCompleted && (
                    <div className="absolute -top-1 -right-1 bg-green-500 rounded-full p-0.5 border border-black">
                      <CheckCircle2 size={10} className="text-white" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="text-white font-bold text-sm">{reward.title}</h4>
                  <p className="text-gray-400 text-[10px] leading-tight">{reward.desc}</p>
                </div>
              </div>
              <div className="text-right ml-4">
                <div className="text-yellow-400 font-black text-sm mb-1">{reward.amount}</div>
                <button 
                  disabled={reward.isCompleted}
                  className={`text-[10px] font-bold px-3 py-1 rounded-full transition-colors ${reward.isCompleted ? 'bg-gray-700 text-gray-400 cursor-not-allowed' : 'bg-teal-600 hover:bg-teal-500 text-white'}`}
                >
                  {reward.isCompleted ? 'সম্পন্ন' : 'সংগ্রহ করুন'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
