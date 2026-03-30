import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, query, where, serverTimestamp, updateDoc } from 'firebase/firestore';
import { User } from 'firebase/auth';

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
    await updateDoc(doc(db, path), data);
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
