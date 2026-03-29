import React from "react";
import { Copy, HelpCircle, Share2, User, Users, Award, Facebook, Twitter, MessageCircle, Send, Gift, ChevronLeft } from "lucide-react";

export default function InviteView({ onTabChange }: { onTabChange: (tab: any) => void }) {
  const [totalShares, setTotalShares] = React.useState(12); // Initial placeholder
  const currentReferrals = 3; // Placeholder for user's current referral count

  const incrementShares = () => setTotalShares(prev => prev + 1);

  const getProgress = (min: number, max: number) => {
    if (currentReferrals < min) return 0;
    if (currentReferrals >= max) return 100;
    return ((currentReferrals - min + 1) / (max - min + 1)) * 100;
  };
  const referralLink = "http://l89vip.l89y.com/?referralCode=xjf8463";

  const handleShare = async () => {
    const shareData = {
      title: 'আমার রেফারেল লিঙ্ক',
      text: 'আমার রেফারেল লিঙ্ক ব্যবহার করে যোগ দিন!',
      url: referralLink,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        incrementShares();
      } else {
        alert('আপনার ব্রাউজার শেয়ারিং সাপোর্ট করে না। লিঙ্কটি কপি করে শেয়ার করুন।');
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log('Share canceled by user');
      } else {
        console.error('Error sharing:', err);
      }
    }
  };

  return (
    <div className="p-4 text-white">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => onTabChange('home')}
            className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors text-white"
          >
            <ChevronLeft size={20} />
          </button>
          <h1 className="text-xl font-bold">বন্ধুদের আমন্ত্রণ জানান</h1>
        </div>
        <button 
          onClick={() => onTabChange('profile')}
          className="text-teal-200 text-xs flex items-center gap-1 hover:text-white transition-colors"
        >
          প্রোফাইল দেখুন &rarr;
        </button>
      </div>
      
      {/* Tabs Placeholder */}
      <div className="flex gap-4 mb-6 text-sm border-b border-teal-600 pb-2">
        <span className="border-b-2 border-white pb-1">সংক্ষিপ্ত বর্ণনা</span>
        <span className="text-teal-200">পুরস্কার</span>
        <span className="text-teal-200">আয়</span>
        <span className="text-teal-200">রেকর্ডস</span>
        <span className="text-teal-200">লিডারবোর্ড</span>
      </div>

      {/* Revenue Goal */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 rounded-xl mb-6 shadow-lg flex justify-between items-center">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="font-bold">রাজস্ব লক্ষ্য</h2>
            <HelpCircle size={18} />
          </div>
          <p className="text-sm text-blue-100">SPIN71 BET-এ পুরস্কার জিততে বন্ধুদের আমন্ত্রণ জানান</p>
        </div>
        <button 
          onClick={() => onTabChange('shop')}
          className="bg-white/20 hover:bg-white/30 p-2 rounded-lg transition-colors"
          title="শপ দেখুন"
        >
          <Gift size={20} />
        </button>
      </div>

      {/* Referral Link */}
      <div className="bg-white/10 p-4 rounded-xl mb-6">
        <p className="text-sm mb-2">আপনার বন্ধুদের সাথে ভাগ করুন</p>
        <div className="flex items-center gap-2 bg-white text-black p-2 rounded-lg">
          <span className="text-xs truncate flex-1">{referralLink}</span>
          <button 
            onClick={() => {
              navigator.clipboard.writeText(referralLink);
              alert("লিঙ্কটি কপি করা হয়েছে!");
              incrementShares();
            }}
            className="p-1 hover:bg-gray-200 rounded transition-colors"
          >
            <Copy size={16} />
          </button>
          <button 
            onClick={() => {
              window.open(`https://wa.me/?text=${encodeURIComponent("Join me on SPIN71 BET! " + referralLink)}`, '_blank');
              incrementShares();
            }} 
            className="flex items-center justify-center w-8 h-8 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors"
            title="WhatsApp"
          >
            <MessageCircle size={16} />
          </button>
          <button onClick={() => {
            window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}`, '_blank');
            incrementShares();
          }} className="p-1 hover:bg-blue-100 rounded text-blue-600 transition-colors">
            <Facebook size={16} />
          </button>
          <button onClick={() => {
            window.open(`https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent("Join me on SPIN71 BET!")}`, '_blank');
            incrementShares();
          }} className="p-1 hover:bg-sky-100 rounded text-sky-600 transition-colors" title="Share on Telegram">
            <Send size={16} />
          </button>
          <button 
            onClick={handleShare}
            className="p-1 hover:bg-gray-200 rounded transition-colors"
          >
            <Share2 size={16} />
          </button>
        </div>
      </div>

      {/* Referral Tiers */}
      <div className="mb-8">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Award className="text-yellow-400" />
          রেফারেল টায়ার ও বোনাস
        </h3>
        <div className="grid grid-cols-1 gap-4">
          <div className="bg-gradient-to-r from-gray-700 to-gray-600 p-5 rounded-2xl border border-gray-500 shadow-lg flex items-center gap-5">
            <div className="w-14 h-14 rounded-full bg-yellow-500/20 flex items-center justify-center text-yellow-400 shrink-0">
              <User size={28} />
            </div>
            <div>
              <p className="font-bold text-lg text-white">সিলভার টায়ার (Silver)</p>
              <p className="text-sm text-gray-200">প্রয়োজন: <span className="font-bold text-white">১-৪ জন</span> রেফারেল</p>
              <p className="text-sm text-gray-200">বোনাস: <span className="font-bold text-yellow-300">প্রতি রেফারেল ৳ ৫০</span></p>
              <div className="w-full bg-gray-800 rounded-full h-2 mt-2">
                <div className="bg-yellow-400 h-2 rounded-full" style={{ width: `${getProgress(1, 4)}%` }}></div>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-r from-amber-800 to-amber-700 p-5 rounded-2xl border border-amber-600 shadow-lg flex items-center gap-5">
            <div className="w-14 h-14 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-300 shrink-0">
              <Users size={28} />
            </div>
            <div>
              <p className="font-bold text-lg text-white">গোল্ড টায়ার (Gold)</p>
              <p className="text-sm text-amber-100">প্রয়োজন: <span className="font-bold text-white">৫-৯ জন</span> রেফারেল</p>
              <p className="text-sm text-amber-100">বোনাস: <span className="font-bold text-amber-300">৳ ৫০০ অতিরিক্ত বোনাস</span></p>
              <div className="w-full bg-gray-800 rounded-full h-2 mt-2">
                <div className="bg-amber-400 h-2 rounded-full" style={{ width: `${getProgress(5, 9)}%` }}></div>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-r from-indigo-800 to-indigo-700 p-5 rounded-2xl border border-indigo-600 shadow-lg flex items-center gap-5">
            <div className="w-14 h-14 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-300 shrink-0">
              <Award size={28} />
            </div>
            <div>
              <p className="font-bold text-lg text-white">প্ল্যাটিনাম টায়ার (Platinum)</p>
              <p className="text-sm text-indigo-100">প্রয়োজন: <span className="font-bold text-white">১০+ জন</span> রেফারেল</p>
              <p className="text-sm text-indigo-100">বোনাস: <span className="font-bold text-indigo-300">৳ ১২০০ অতিরিক্ত বোনাস</span></p>
              <div className="w-full bg-gray-800 rounded-full h-2 mt-2">
                <div className="bg-indigo-400 h-2 rounded-full" style={{ width: `${getProgress(10, 20)}%` }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white/10 p-4 rounded-xl">
          <p className="text-xs text-teal-100">আজকের আয়</p>
          <p className="text-xl font-bold">৳ 0.00</p>
        </div>
        <div className="bg-white/10 p-4 rounded-xl">
          <p className="text-xs text-teal-100">গতকালের আয়</p>
          <p className="text-xl font-bold">৳ 0.00</p>
        </div>
        <div className="bg-white/10 p-4 rounded-xl">
          <p className="text-xs text-teal-100">মোট শেয়ার</p>
          <p className="text-xl font-bold">{totalShares}</p>
        </div>
      </div>

      {/* Total Earnings */}
      <div className="bg-gradient-to-r from-yellow-600 to-yellow-700 p-4 rounded-xl shadow-lg mb-6">
        <p className="text-xs text-yellow-100 mb-1">মোট আয় (Total Earnings)</p>
        <p className="text-2xl font-bold text-white">৳ 0.00</p>
      </div>

      {/* Leaderboard */}
      <div className="bg-white/10 p-4 rounded-xl">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-bold">লিডারবোর্ড</h3>
          <div className="group relative">
            <HelpCircle size={18} className="text-teal-200 cursor-help" />
            <div className="absolute right-0 w-48 p-2 bg-gray-800 text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
              লিডারবোর্ডটি প্রতি ২৪ ঘণ্টায় একবার আপডেট করা হয়।
            </div>
          </div>
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between border-b border-white/10 pb-2">
            <span>১. user_123</span>
            <span>৫০ রেফারেল</span>
          </div>
          <div className="flex justify-between border-b border-white/10 pb-2">
            <span>২. user_456</span>
            <span>৪০ রেফারেল</span>
          </div>
          <div className="flex justify-between">
            <span>৩. user_789</span>
            <span>৩০ রেফারেল</span>
          </div>
        </div>
      </div>
    </div>
  );
}
