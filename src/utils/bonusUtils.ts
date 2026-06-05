import { db } from '../services/firebase';
import { doc, getDoc, updateDoc, increment, collection, setDoc } from 'firebase/firestore';

export const checkAndAwardReferralBonus = async (userId: string, showToast?: (msg: string, type: any) => void) => {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    if (!userDoc.exists()) return;

    const userData = userDoc.data();
    
    // Check if bonus is already claimed
    if (userData.bonusesClaimed?.includes('referral_bonus_277')) return;

    // Check criteria
    const totalDeposits = userData.totalDeposits || 0;
    const totalBets = userData.totalBets || 0;
    const referredBy = userData.referredBy;

    if (referredBy && totalDeposits >= 200 && totalBets >= 850) {
        // Award bonus
        const batch = [];
        
        // Update user
        await updateDoc(userRef, {
            balance: increment(277),
            bonusesClaimed: [...(userData.bonusesClaimed || []), 'referral_bonus_277']
        });

        // Log transaction
        const trxRef = doc(collection(db, 'transactions'));
        await setDoc(trxRef, {
            type: 'bonus',
            status: 'approved',
            userId: userId,
            amount: 277,
            description: 'Referral Bonus 277',
            date: new Date().toISOString(),
            createdAt: new Date().toISOString()
        });

        if (showToast) {
            showToast("অভিনন্দন! আপনি রেফারেল বোনাস ২৭৭ টাকা পেয়েছেন!", "success");
        }
    }
};
