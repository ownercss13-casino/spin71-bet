import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

let dbInstance = getFirestore(app, (firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)') ? firebaseConfig.firestoreDatabaseId : undefined);

// Using a wrapper object to ensure all components see the updated instance
export const firestoreWrapper = {
  get instance() {
    return dbInstance;
  }
};

export const getDb = () => dbInstance;

export const switchToDefaultDb = () => {
  console.warn("[Firebase] Switching frontend to (default) database...");
  dbInstance = getFirestore(app);
  return dbInstance;
};

export const auth = getAuth(app);
export { dbInstance as db }; // This name is still exported but might be stale; getDb() is better
export default app;
