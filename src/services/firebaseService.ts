import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, query, where, serverTimestamp, updateDoc, increment, setDoc } from 'firebase/firestore';

export interface User {
  id: string;
  username: string;
  email: string;
  phoneNumber?: string;
  registrationDate: string;
  balance: number;
  turnover: number;
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

export const updateTurnover = async (userId: string, amount: number) => {
  const path = `users/${userId}`;
  try {
    await updateDoc(doc(db, path), { 
      turnover: increment(amount)
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
};

export const claimDailyBonus = async (userId: string, currentBalance: number) => {
  const path = `users/${userId}`;
  try {
    await updateDoc(doc(db, path), {
      balance: currentBalance + 6.77,
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

export const claimWelcomeBonus = async (userId: string, currentBalance: number) => {
  const path = `users/${userId}`;
  try {
    await updateDoc(doc(db, path), {
      balance: currentBalance + 57,
      hasClaimedWelcomeBonus: true
    });
    await addNotification(userId, {
      title: "স্বাগতম বোনাস প্রাপ্ত!",
      message: "আপনি সফলভাবে ৳ ৫৭ স্বাগতম বোনাস পেয়েছেন।",
      type: "bonus"
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

export const updateGlobalGameLogo = async (gameId: string, logoUrl: string) => {
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

export const updateGlobalGameName = async (gameId: string, name: string) => {
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
