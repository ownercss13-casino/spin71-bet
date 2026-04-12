import React, { useState, useEffect } from 'react';
import { Gift, X, Calendar, Star, AlertCircle, RefreshCw } from 'lucide-react';
import { claimDailyBonus, claimWelcomeBonus } from '../services/firebaseService';

import { ToastType } from './Toast';

export default function BonusCenter({ 
  userData, 
  balance, 
  onBalanceUpdate, 
  onTabChange, 
  showToast, 
  welcomeBonus = 57,
  onOpenPromoModal
}: { 
  userData: any, 
  balance: number, 
  onBalanceUpdate: (newBalance: number) => void, 
  onTabChange: (tab: any) => void, 
  showToast: (msg: string, type?: ToastType) => void, 
  welcomeBonus?: number,
  onOpenPromoModal?: () => void
}) {
  const [showPopup, setShowPopup] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

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
          await claimWelcomeBonus(userData.id, balance, welcomeBonus);
          onBalanceUpdate(balance + welcomeBonus);
          setPopupMessage(`আপনি ${welcomeBonus} টাকা ওয়েলকাম বোনাস পেয়েছেন!`);
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
    <div className="p-6 bg-[var(--bg-main)] min-h-screen text-[var(--text-main)] pb-24 relative transition-colors duration-300">
      {isClaiming && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm max-w-md mx-auto">
          <div className="flex flex-col items-center gap-3 bg-[var(--bg-surface)]/90 p-8 rounded-3xl border border-[var(--border-color)] shadow-2xl scale-110">
            <RefreshCw size={48} className="text-yellow-500 animate-spin" />
            <span className="text-[var(--text-main)] font-black italic uppercase tracking-tighter text-lg animate-pulse">Claiming...</span>
          </div>
        </div>
      )}
      <h2 className="text-2xl font-black italic mb-6 text-yellow-400">বোনাস সেন্টার (Bonus Center)</h2>
      
      <div className="space-y-4">
        {/* Promo Code Card */}
        <div className="bg-gradient-to-br from-teal-900/40 to-teal-800/20 p-6 rounded-2xl shadow-xl border border-teal-500/30 relative overflow-hidden group transition-all duration-300 hover:border-teal-400/50">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform text-teal-400">
            <Gift size={80} />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-teal-500/20 rounded-lg">
                <Gift className="text-teal-400" size={24} />
              </div>
              <h3 className="text-xl font-bold text-white">প্রোমো কোড (Promo Code)</h3>
            </div>
            <p className="text-teal-200/70 text-sm mb-4">আপনার কাছে কি কোনো প্রোমো কোড আছে? এখানে ব্যবহার করুন এবং বোনাস পান।</p>
            
            <button 
              onClick={() => onOpenPromoModal?.()}
              className="w-full font-black py-4 rounded-xl text-lg transition-all shadow-lg bg-teal-500 text-black hover:bg-teal-400 hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
            >
              প্রোমো কোড লিখুন (Enter Code)
            </button>
          </div>
        </div>

        {/* Daily Bonus Card */}
        <div className="bg-[var(--bg-card)] p-6 rounded-2xl shadow-xl border border-[var(--border-color)] relative overflow-hidden group transition-colors duration-300">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform text-[var(--text-main)]">
            <Calendar size={80} />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-yellow-500/20 rounded-lg">
                <Calendar className="text-yellow-500" size={24} />
              </div>
              <h3 className="text-xl font-bold text-[var(--text-main)]">ডেইলি বোনাস (Daily Bonus)</h3>
            </div>
            <p className="text-[var(--text-muted)] text-sm mb-4">প্রতি ২৪ ঘণ্টায় একবার ৬.৭৭ টাকা বোনাস পান।</p>
            
            <button 
              onClick={handleClaimDaily}
              disabled={!canClaimDaily}
              className={`w-full font-black py-4 rounded-xl text-lg transition-all shadow-lg ${!canClaimDaily ? 'bg-gray-600 text-gray-400 cursor-not-allowed' : 'bg-yellow-500 text-black hover:bg-yellow-400 hover:scale-[1.02] active:scale-95'}`}
            >
              {canClaimDaily ? '৬.৭৭ টাকা ক্লেইম করুন' : 'ইতিমধ্যে ক্লেইম করা হয়েছে'}
            </button>
            {!canClaimDaily && lastClaimed && (
              <p className="text-center text-[10px] text-[var(--text-muted)] mt-2">
                পরবর্তী ক্লেইম: {new Date(lastClaimed.getTime() + 24 * 60 * 60 * 1000).toLocaleString()}
              </p>
            )}
          </div>
        </div>

        {/* Welcome Bonus Card */}
        <div className="bg-[var(--bg-card)] p-6 rounded-2xl shadow-xl border border-[var(--border-color)] relative overflow-hidden group transition-colors duration-300">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform text-[var(--text-main)]">
            <Star size={80} />
          </div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-500/20 rounded-lg">
                  <Star className="text-yellow-500" size={24} />
                </div>
                <h3 className="text-xl font-bold text-[var(--text-main)]">ওয়েলকাম বোনাস (Welcome Bonus)</h3>
              </div>
              <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${hasMadeDeposit ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
                {hasMadeDeposit ? 'ডিপোজিট সম্পন্ন' : 'ডিপোজিট প্রয়োজন'}
              </div>
            </div>

            <div className="bg-[var(--bg-surface)] rounded-xl p-4 mb-4 border border-[var(--border-color)] transition-colors duration-300">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[var(--text-muted)] text-xs">বোনাস পরিমাণ:</span>
                <span className="text-yellow-400 font-bold">{welcomeBonus.toFixed(2)} টাকা</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-[var(--text-muted)] text-xs">ওয়েজারিং (Wagering):</span>
                <span className="text-[var(--text-main)] text-xs font-medium">১x (১ গুণ)</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[var(--text-muted)] text-xs">মেয়াদ (Validity):</span>
                <span className="text-[var(--text-main)] text-xs font-medium">৭ দিন</span>
              </div>
            </div>

            <div className="bg-[var(--bg-surface)] rounded-xl p-4 mb-4 border border-[var(--border-color)] transition-colors duration-300">
              <h4 className="text-white text-sm font-bold mb-2">বোনাসের শর্তাবলী (Terms & Conditions):</h4>
              <ul className="text-[var(--text-muted)] text-[11px] list-disc list-inside space-y-1">
                <li>এই বোনাসটি শুধুমাত্র নতুন ইউজারদের জন্য প্রযোজ্য।</li>
                <li>বোনাস ব্যালেন্স উইথড্র করার আগে অন্তত ১ গুণ (1x) গেম খেলতে হবে।</li>
                <li>বোনাসটি ক্লেইম করার পর ৭ দিনের মধ্যে ব্যবহার করতে হবে।</li>
                <li>প্রতিটি ইউজার শুধুমাত্র একবার এই বোনাসটি ক্লেইম করতে পারবেন।</li>
                <li>ক্যাসিনো কর্তৃপক্ষ যেকোনো সময় এই বোনাস পলিসি পরিবর্তন বা বাতিল করার অধিকার রাখে।</li>
              </ul>
            </div>
            
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
