import React, { useState } from 'react';
import { Gift, X } from 'lucide-react';
import { doc, updateDoc, increment } from 'firebase/firestore';
import { db } from './firebase';

export default function BonusCenter({ userData, balance, onBalanceUpdate }: { userData: any, balance: number, onBalanceUpdate: (newBalance: number) => void }) {
  const [showPopup, setShowPopup] = useState(false);

  const isClaimed = userData?.claimedBonuses?.includes('registration_bonus');

  const claimBonus = async () => {
    if (userData?.id && !isClaimed) {
      try {
        const userRef = doc(db, 'users', userData.id);
        await updateDoc(userRef, {
          balance: increment(27),
          claimedBonuses: [...(userData.claimedBonuses || []), 'registration_bonus']
        });
        onBalanceUpdate(balance + 27);
        setShowPopup(true);
      } catch (error) {
        console.error("Error claiming bonus:", error);
      }
    }
  };

  return (
    <div className="p-6 bg-teal-900 min-h-screen text-white">
      <h2 className="text-2xl font-bold mb-6">বোনাস সেন্টার</h2>
      
      <div className="bg-teal-800 p-6 rounded-2xl shadow-lg border border-teal-700 mb-6">
        <p className="text-teal-300 text-sm mb-1">আপনার জিমেইল:</p>
        <p className="text-xl font-bold mb-4">{userData?.gmail}</p>
        
        <button 
          onClick={claimBonus}
          disabled={isClaimed}
          className={`w-full font-black py-4 rounded-xl text-lg transition-colors shadow-lg ${isClaimed ? 'bg-gray-500 cursor-not-allowed' : 'bg-yellow-500 text-black hover:bg-yellow-400'}`}
        >
          {isClaimed ? 'বোনাস ইতিমধ্যে ক্লেইম করা হয়েছে' : '২৭ টাকা ক্লেইম করুন'}
        </button>
      </div>

      {showPopup && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-6">
          <div className="bg-teal-800 p-8 rounded-2xl text-center relative shadow-2xl border border-teal-600">
            <button onClick={() => setShowPopup(false)} className="absolute top-2 right-2 text-teal-300">
              <X />
            </button>
            <Gift size={64} className="text-yellow-400 mx-auto mb-4" />
            <h3 className="text-2xl font-bold mb-2">অভিনন্দন!</h3>
            <p className="text-lg">আপনি ২৭ টাকা রেজিস্ট্রেশন বোনাস পেয়েছেন!</p>
          </div>
        </div>
      )}
    </div>
  );
}
