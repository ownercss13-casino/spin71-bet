import React, { useState, useEffect } from 'react';
import { Gift, X, Calendar, Star, AlertCircle, RefreshCw } from 'lucide-react';
import { claimDailyBonus, claimWelcomeBonus } from './services/firebaseService';

import { ToastType } from './components/Toast';

export default function BonusCenter({ userData, balance, onBalanceUpdate, onTabChange, showToast }: { userData: any, balance: number, onBalanceUpdate: (newBalance: number) => void, onTabChange: (tab: any) => void, showToast: (msg: string, type?: ToastType) => void }) {
  const [showPopup, setShowPopup] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [tooltip, setTooltip] = useState<string | null>(null);

  const lastClaimed = userData?.lastDailyBonusClaimedAt?.toDate();
  const canClaimDaily = !lastClaimed || (new Date().getTime() - lastClaimed.getTime() > 24 * 60 * 60 * 1000);
  
  const hasClaimedWelcome = userData?.hasClaimedWelcomeBonus;
  const hasMadeDeposit = userData?.hasMadeDeposit;

  const handleClaimDaily = async () => {
    if (userData?.id && canClaimDaily) {
      setIsClaiming(true);
      setTimeout(async () => {
        try {
          await claimDailyBonus(userData.id, balance);
          onBalanceUpdate(balance + 6.77);
          setPopupMessage("আপনি ৬.৭৭ টাকা ডেইলি বোনাস পেয়েছেন!");
          setShowPopup(true);
        } catch (error) {
          console.error("Error claiming daily bonus:", error);
        } finally {
          setIsClaiming(false);
        }
      }, 500);
    }
  };

  const handleClaimWelcome = async () => {
    if (userData?.id && !hasClaimedWelcome) {
      setIsClaiming(true);
      setTimeout(async () => {
        try {
          await claimWelcomeBonus(userData.id, balance);
          onBalanceUpdate(balance + 57);
          setPopupMessage("আপনি ৫৭ টাকা ওয়েলকাম বোনাস পেয়েছেন!");
          setShowPopup(true);
        } catch (error) {
          console.error("Error claiming welcome bonus:", error);
        } finally {
          setIsClaiming(false);
        }
      }, 500);
    }
  };

  return (
    <div className="p-6 bg-[#0a4d3c] min-h-screen text-white pb-24 relative">
      {isClaiming && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm max-w-md mx-auto">
          <div className="flex flex-col items-center gap-3 bg-teal-900/90 p-8 rounded-3xl border border-teal-500/30 shadow-2xl scale-110">
            <RefreshCw size={48} className="text-yellow-500 animate-spin" />
            <span className="text-white font-black italic uppercase tracking-tighter text-lg animate-pulse">Claiming...</span>
          </div>
        </div>
      )}
      <h2 className="text-2xl font-black italic mb-6 text-yellow-400">বোনাস সেন্টার (Bonus Center)</h2>
      
      <div className="space-y-4">
        {/* Daily Bonus Card */}
        <div className="bg-gradient-to-br from-teal-800 to-teal-900 p-6 rounded-2xl shadow-xl border border-teal-700 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
            <Calendar size={80} />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-yellow-500/20 rounded-lg">
                <Calendar className="text-yellow-500" size={24} />
              </div>
              <h3 className="text-xl font-bold">ডেইলি বোনাস (Daily Bonus)</h3>
            </div>
            <p className="text-teal-200 text-sm mb-4">প্রতি ২৪ ঘণ্টায় একবার ৬.৭৭ টাকা বোনাস পান।</p>
            
            <button 
              onClick={handleClaimDaily}
              disabled={!canClaimDaily}
              className={`w-full font-black py-4 rounded-xl text-lg transition-all shadow-lg ${!canClaimDaily ? 'bg-gray-600 text-gray-400 cursor-not-allowed' : 'bg-yellow-500 text-black hover:bg-yellow-400 hover:scale-[1.02] active:scale-95'}`}
            >
              {canClaimDaily ? '৬.৭৭ টাকা ক্লেইম করুন' : 'ইতিমধ্যে ক্লেইম করা হয়েছে'}
            </button>
            {!canClaimDaily && lastClaimed && (
              <p className="text-center text-[10px] text-teal-400 mt-2">
                পরবর্তী ক্লেইম: {new Date(lastClaimed.getTime() + 24 * 60 * 60 * 1000).toLocaleString()}
              </p>
            )}
          </div>
        </div>

        {/* Welcome Bonus Card */}
        <div className="bg-gradient-to-br from-teal-800 to-teal-900 p-6 rounded-2xl shadow-xl border border-teal-700 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
            <Star size={80} />
          </div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-500/20 rounded-lg">
                  <Star className="text-yellow-500" size={24} />
                </div>
                <h3 className="text-xl font-bold">ওয়েলকাম বোনাস (Welcome Bonus)</h3>
              </div>
              <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${hasMadeDeposit ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
                {hasMadeDeposit ? 'ডিপোজিট সম্পন্ন' : 'ডিপোজিট প্রয়োজন'}
              </div>
            </div>

            <div className="bg-teal-950/50 rounded-xl p-4 mb-4 border border-teal-700/50">
              <div className="flex justify-between items-center mb-2">
                <span className="text-teal-300 text-xs">বোনাস পরিমাণ:</span>
                <span className="text-yellow-400 font-bold">৫৭.০০ টাকা</span>
              </div>
              <div className="flex justify-between items-center mb-2 relative">
                <span 
                  className="text-teal-300 text-xs cursor-help border-b border-dotted border-teal-500"
                  onMouseEnter={() => setTooltip('wagering')}
                  onMouseLeave={() => setTooltip(null)}
                >
                  ওয়েজারিং (Wagering):
                </span>
                {tooltip === 'wagering' && (
                  <div className="absolute bottom-full left-0 mb-2 w-48 p-2 bg-black/90 text-white text-[10px] rounded shadow-lg z-50">
                    বোনাস ব্যালেন্স উইথড্র করার আগে অন্তত ১ গুণ গেম খেলতে হবে।
                  </div>
                )}
                <span className="text-white text-xs font-medium">১x (১ গুণ)</span>
              </div>
              <div className="flex justify-between items-center relative">
                <span 
                  className="text-teal-300 text-xs cursor-help border-b border-dotted border-teal-500"
                  onMouseEnter={() => setTooltip('validity')}
                  onMouseLeave={() => setTooltip(null)}
                >
                  মেয়াদ (Validity):
                </span>
                {tooltip === 'validity' && (
                  <div className="absolute bottom-full left-0 mb-2 w-48 p-2 bg-black/90 text-white text-[10px] rounded shadow-lg z-50">
                    বোনাসটি ক্লেইম করার পর ৭ দিনের মধ্যে ব্যবহার করতে হবে।
                  </div>
                )}
                <span className="text-white text-xs font-medium">৭ দিন</span>
              </div>
            </div>

            <p className="text-teal-200 text-[11px] mb-4 leading-relaxed italic">
              * এই বোনাসটি শুধুমাত্র নতুন ইউজারদের জন্য। বোনাস ব্যালেন্স উইথড্র করার আগে অন্তত একবার গেম খেলতে হবে।
            </p>
            
            {!hasClaimedWelcome && !hasMadeDeposit ? (
              <button 
                onClick={() => onTabChange('deposit')}
                className="w-full font-black py-4 rounded-xl text-lg transition-all shadow-lg bg-yellow-500 text-black hover:bg-yellow-400 hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
              >
                ডিপোজিট করুন (Deposit Now)
              </button>
            ) : (
              <button 
                onClick={handleClaimWelcome}
                disabled={hasClaimedWelcome}
                className={`w-full font-black py-4 rounded-xl text-lg transition-all shadow-lg ${hasClaimedWelcome ? 'bg-gray-600 text-gray-400 cursor-not-allowed' : 'bg-yellow-500 text-black hover:bg-yellow-400 hover:scale-[1.02] active:scale-95'}`}
              >
                {hasClaimedWelcome ? 'ইতিমধ্যে ক্লেইম করা হয়েছে' : 'বোনাস ক্লেইম করুন (Claim Bonus)'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Success Popup */}
      {showPopup && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-6 animate-in fade-in duration-300">
          <div className="bg-teal-900 p-8 rounded-3xl text-center relative shadow-2xl border-2 border-yellow-500 max-w-sm w-full animate-in zoom-in duration-300">
            <button onClick={() => setShowPopup(false)} className="absolute top-4 right-4 text-teal-300 hover:text-white">
              <X size={24} />
            </button>
            <div className="w-20 h-20 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(234,179,8,0.4)]">
              <Gift size={40} className="text-black" />
            </div>
            <h3 className="text-3xl font-black mb-2 text-white italic">অভিনন্দন! (Congratulations!)</h3>
            <p className="text-teal-200 text-lg mb-6">{popupMessage}</p>
            <button 
              onClick={() => setShowPopup(false)}
              className="w-full bg-yellow-500 text-black font-black py-3 rounded-xl hover:bg-yellow-400 transition-colors"
            >
              ঠিক আছে (OK)
            </button>
          </div>
        </div>
      )}

      {/* Error Popup */}
      {showErrorPopup && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-6 animate-in fade-in duration-300">
          <div className="bg-teal-900 p-8 rounded-3xl text-center relative shadow-2xl border-2 border-red-500 max-w-sm w-full animate-in zoom-in duration-300">
            <button onClick={() => setShowErrorPopup(false)} className="absolute top-4 right-4 text-teal-300 hover:text-white">
              <X size={24} />
            </button>
            <div className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(239,68,68,0.4)]">
              <AlertCircle size={40} className="text-white" />
            </div>
            <h3 className="text-2xl font-black mb-2 text-white italic">দুঃখিত! (Sorry!)</h3>
            <p className="text-teal-200 text-lg mb-6">{errorMessage}</p>
            <button 
              onClick={() => setShowErrorPopup(false)}
              className="w-full bg-red-500 text-white font-black py-3 rounded-xl hover:bg-red-400 transition-colors"
            >
              বন্ধ করুন (Close)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
