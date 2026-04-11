import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, query, where, serverTimestamp, updateDoc, increment, setDoc, getDoc, runTransaction } from 'firebase/firestore';

export interface User {
  id: string;
  numericId?: string;
  username: string;
  fullName?: string;
  email: string;
  phoneNumber?: string;
  registrationDate: string;
  balance: number;
  turnover: number;
  requiredTurnover: number;
  totalDeposit?: number;
  vipLevel: number;
  vipProgress: number;
  favorites: string[];
  profilePictureUrl?: string;
  claimedBonuses: string[];
  lastDailyBonusClaimedAt?: any;
  hasClaimedWelcomeBonus?: boolean;
  hasMadeDeposit?: boolean;
  referralCount?: number;
  totalReferralEarnings?: number;
  isGmailLinked?: boolean;
  gmail?: string | null;
  country?: string | null;
  role?: 'user' | 'agent' | 'admin';
  aviatorLogo?: string | null;
  bankCards?: BankCard[];
}

export interface BankCard {
  id: string;
  bankName: string;
  accountNumber: string;
  accountHolderName: string;
  isDefault?: boolean;
}

export interface Notification {
  id?: string;
  title: string;
  message: string;
  type: 'bonus' | 'promotion' | 'account' | 'system';
  read: boolean;
  createdAt: any;
  actionUrl?: string;
}

export interface SavedItem {
  id?: string;
  userId: string;
  itemId: string;
  itemType: string;
  savedAt: any;
}

export const saveItem = async (itemId: string, itemType: string) => {
  if (!auth.currentUser) throw new Error("User not authenticated");
  
  const path = `users/${auth.currentUser.uid}/savedItems`;
  try {
    const docRef = await addDoc(collection(db, path), {
      userId: auth.currentUser.uid,
      itemId,
      itemType,
      savedAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
};

export const getSavedItems = async () => {
  if (!auth.currentUser) throw new Error("User not authenticated");
  
  const path = `users/${auth.currentUser.uid}/savedItems`;
  try {
    const q = query(collection(db, path));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SavedItem));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
};

export const removeItem = async (savedItemId: string) => {
  if (!auth.currentUser) throw new Error("User not authenticated");
  
  const path = `users/${auth.currentUser.uid}/savedItems/${savedItemId}`;
  try {
    await deleteDoc(doc(db, path));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
};

export const updateUserProfile = async (userId: string, data: Partial<User>) => {
  const path = `users/${userId}`;
  try {
    await updateDoc(doc(db, path), data as any);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
};

export const updateFavorites = async (userId: string, favorites: string[]) => {
  const path = `users/${userId}`;
  try {
    await updateDoc(doc(db, path), { favorites });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
};

export const updateBalance = async (userId: string, balance: number) => {
  const path = `users/${userId}`;
  try {
    await updateDoc(doc(db, path), { balance });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
};

import { VIP_LEVELS, getVIPLevel } from '../constants/vipLevels';

export const updateTurnover = async (userId: string, amount: number, referredBy?: string | null) => {
  const path = `users/${userId}`;
  try {
    // Get current user data to calculate new VIP level
    const userDoc = await getDoc(doc(db, path));
    if (!userDoc.exists()) return;
    
    const userData = userDoc.data() as User;
    const newTurnover = (userData.turnover || 0) + amount;
    
    const currentVIP = getVIPLevel(newTurnover);
    const nextVIP = VIP_LEVELS[currentVIP.level + 1];
    
    let progress = 100;
    if (nextVIP) {
      const range = nextVIP.minTurnover - currentVIP.minTurnover;
      const currentProgress = newTurnover - currentVIP.minTurnover;
      progress = Math.min(100, Math.floor((currentProgress / range) * 100));
    }

    // Update user's own turnover and VIP status
    await updateDoc(doc(db, path), { 
      turnover: increment(amount),
      vipLevel: currentVIP.level,
      vipProgress: progress
    });

    // If user was referred, give commission to referrer
    if (referredBy) {
      const referrerPath = `users/${referredBy}`;
      const commission = amount * 0.01; // 1% commission
      await updateDoc(doc(db, referrerPath), {
        balance: increment(commission),
        totalReferralEarnings: increment(commission)
      });
      
      // Notify referrer
      await addNotification(referredBy, {
        title: "রেফারেল কমিশন!",
        message: `আপনার রেফার করা ইউজারের গেমপ্লে থেকে আপনি ৳ ${commission.toFixed(2)} কমিশন পেয়েছেন।`,
        type: "bonus"
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
};

export const claimDailyBonus = async (userId: string, currentBalance: number) => {
  const path = `users/${userId}`;
  try {
    await updateDoc(doc(db, path), {
      balance: currentBalance + 6.77,
      requiredTurnover: increment(6.77 * 7),
      lastDailyBonusClaimedAt: serverTimestamp()
    });
    await addNotification(userId, {
      title: "ডেইলি বোনাস প্রাপ্ত!",
      message: "আপনি সফলভাবে ৳ ৬.৭৭ ডেইলি বোনাস পেয়েছেন।",
      type: "bonus"
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
};

export const claimWelcomeBonus = async (userId: string, currentBalance: number, amount: number) => {
  const path = `users/${userId}`;
  try {
    await updateDoc(doc(db, path), {
      balance: currentBalance + amount,
      requiredTurnover: increment(amount * 7),
      hasClaimedWelcomeBonus: true
    });
    await addNotification(userId, {
      title: "স্বাগতম বোনাস প্রাপ্ত!",
      message: `আপনি সফলভাবে ৳ ${amount} স্বাগতম বোনাস পেয়েছেন।`,
      type: "bonus"
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
};

export const updateAllButtonName = async (newName: string) => {
  const path = `global_config/ui_settings`;
  try {
    await setDoc(doc(db, path), { allButtonName: newName }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

export const addBankCard = async (userId: string, card: Omit<BankCard, 'id'>) => {
  const path = `users/${userId}`;
  const newCard = { ...card, id: Math.random().toString(36).substr(2, 9) };
  try {
    const userDoc = await getDoc(doc(db, path));
    const userData = userDoc.data();
    const bankCards = userData?.bankCards || [];
    await updateDoc(doc(db, path), {
      bankCards: [...bankCards, newCard]
    });
    return newCard;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
};

export const removeBankCard = async (userId: string, cardId: string) => {
  const path = `users/${userId}`;
  try {
    const userDoc = await getDoc(doc(db, path));
    const userData = userDoc.data();
    const bankCards = userData?.bankCards || [];
    await updateDoc(doc(db, path), {
      bankCards: bankCards.filter((c: any) => c.id !== cardId)
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
};

export const updateCasinoName = async (newName: string) => {
  const path = `global_config/ui_settings`;
  try {
    await setDoc(doc(db, path), { casinoName: newName }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

export const updateGlobalGameUrl = async (gameId: string, url: string) => {
  const path = `global_config/game_urls`;
  try {
    await updateDoc(doc(db, path), {
      [gameId]: url
    });
  } catch (error) {
    try {
      await setDoc(doc(db, path), {
        [gameId]: url
      });
    } catch (innerError) {
      handleFirestoreError(innerError, OperationType.WRITE, path);
    }
  }
};

export const updateGlobalGameOption = async (gameId: string, option: string) => {
  const path = `global_config/game_options`;
  try {
    await updateDoc(doc(db, path), {
      [gameId]: option
    });
  } catch (error) {
    try {
      await setDoc(doc(db, path), {
        [gameId]: option
      });
    } catch (innerError) {
      handleFirestoreError(innerError, OperationType.WRITE, path);
    }
  }
};

export const updateRequiredTurnoverOnDeposit = async (userId: string, amount: number) => {
  const path = `users/${userId}`;
  try {
    await updateDoc(doc(db, path), {
      requiredTurnover: increment(amount),
      totalDeposit: increment(amount)
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
};

export const addNotification = async (userId: string, notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => {
  const path = `users/${userId}/notifications`;
  try {
    await addDoc(collection(db, path), {
      ...notification,
      read: false,
      createdAt: serverTimestamp()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
};

export const markNotificationAsRead = async (userId: string, notificationId: string) => {
  const path = `users/${userId}/notifications/${notificationId}`;
  try {
    await updateDoc(doc(db, path), { read: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
};

export const deleteNotification = async (userId: string, notificationId: string) => {
  const path = `users/${userId}/notifications/${notificationId}`;
  try {
    await deleteDoc(doc(db, path));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
};

export const sendMessage = async (userId: string, text: string, sender: 'user' | 'agent') => {
  const path = `users/${userId}/chat`;
  try {
    await addDoc(collection(db, path), {
      text,
      sender,
      timestamp: serverTimestamp()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
};

export const updateGlobalGameLogo = async (gameId: string, logoUrl: string, isAdmin: boolean = false) => {
  if (!isAdmin) {
    // Submit request for approval
    const path = 'logo_requests';
    try {
      await addDoc(collection(db, path), {
        gameId,
        type: 'logo',
        value: logoUrl,
        status: 'pending',
        requestedBy: auth.currentUser?.uid,
        requestedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
    return;
  }

  const path = `global_config/game_logos`;
  try {
    await updateDoc(doc(db, path), {
      [gameId]: logoUrl
    });
  } catch (error) {
    // If document doesn't exist, create it
    try {
      await setDoc(doc(db, path), {
        [gameId]: logoUrl
      });
    } catch (innerError) {
      handleFirestoreError(innerError, OperationType.WRITE, path);
    }
  }
};

export const updateGlobalGameName = async (gameId: string, name: string, isAdmin: boolean = false) => {
  if (!isAdmin) {
    // Submit request for approval
    const path = 'logo_requests';
    try {
      await addDoc(collection(db, path), {
        gameId,
        type: 'name',
        value: name,
        status: 'pending',
        requestedBy: auth.currentUser?.uid,
        requestedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
    return;
  }

  const path = `global_config/game_names`;
  try {
    await updateDoc(doc(db, path), {
      [gameId]: name
    });
  } catch (error) {
    // If document doesn't exist, create it
    try {
      await setDoc(doc(db, path), {
        [gameId]: name
      });
    } catch (innerError) {
      handleFirestoreError(innerError, OperationType.WRITE, path);
    }
  }
};

export const updateGlobalGameProvider = async (gameId: string, provider: string) => {
  const path = `global_config/game_providers`;
  try {
    await updateDoc(doc(db, path), {
      [gameId]: provider
    });
  } catch (error) {
    // If document doesn't exist, create it
    try {
      await setDoc(doc(db, path), {
        [gameId]: provider
      });
    } catch (innerError) {
      handleFirestoreError(innerError, OperationType.WRITE, path);
    }
  }
};

export const createPromoCode = async (code: string, amount: number, maxUses: number = 0, turnoverMultiplier: number = 5) => {
  const path = `promo_codes/${code.toUpperCase()}`;
  try {
    await setDoc(doc(db, 'promo_codes', code.toUpperCase()), {
      amount,
      maxUses,
      usedCount: 0,
      isActive: true,
      turnoverMultiplier,
      createdAt: serverTimestamp()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'promo_codes');
  }
};

export const clearChatHistory = async (userId: string) => {
  const path = `users/${userId}/chat`;
  try {
    const q = query(collection(db, path));
    const snapshot = await getDocs(q);
    const deletePromises = snapshot.docs.map(d => deleteDoc(d.ref));
    await Promise.all(deletePromises);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
};

export const updateGlobalAppSettings = async (settings: Record<string, any>) => {
  const path = `global_config/app_settings`;
  try {
    await updateDoc(doc(db, path), settings);
  } catch (error) {
    try {
      await setDoc(doc(db, path), settings);
    } catch (innerError) {
      handleFirestoreError(innerError, OperationType.WRITE, path);
    }
  }
};

export const processDepositCommission = async (refereeId: string, depositAmount: number) => {
  try {
    const refereeDoc = await getDoc(doc(db, 'users', refereeId));
    if (!refereeDoc.exists()) return;

    const refereeData = refereeDoc.data();
    const referrerId = refereeData.referredBy;

    if (referrerId) {
      const referrerRef = doc(db, 'users', referrerId);
      const commission = depositAmount * 0.032; // 3.2% commission

      await runTransaction(db, async (transaction) => {
        const referrerDoc = await transaction.get(referrerRef);
        if (!referrerDoc.exists()) return;

        transaction.update(referrerRef, {
          balance: increment(commission),
          totalReferralEarnings: increment(commission)
        });

        // Add transaction log for referrer
        const referrerTxRef = doc(collection(db, 'users', referrerId, 'transactions'));
        transaction.set(referrerTxRef, {
          trxId: `COM-${Date.now()}`,
          method: 'Referral Commission',
          type: 'bonus',
          amount: commission,
          date: serverTimestamp(),
          status: 'সম্পন্ন',
          statusColor: 'text-green-500'
        });
      });

      // Notify referrer
      await addNotification(referrerId, {
        title: "রেফারেল কমিশন!",
        message: `আপনার রেফার করা ইউজারের ডিপোজিট থেকে আপনি ৳ ${commission.toFixed(2)} কমিশন পেয়েছেন।`,
        type: "bonus"
      });
    }
  } catch (error) {
    console.error("Failed to process commission", error);
  }
};
