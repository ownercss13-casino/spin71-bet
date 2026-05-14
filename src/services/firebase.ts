import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, initializeFirestore, CACHE_SIZE_UNLIMITED } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

console.log("[Firebase] Initializing Firestore with DB ID:", firebaseConfig.firestoreDatabaseId);

// Handle (default) database ID
const dbId = firebaseConfig.firestoreDatabaseId === '(default)' ? undefined : firebaseConfig.firestoreDatabaseId;

// Initialize Firestore with specific settings to improve stability in restricted environments
let dbInstance = initializeFirestore(app, {
  cacheSizeBytes: CACHE_SIZE_UNLIMITED,
  experimentalForceLongPolling: true, // Often helps in sandboxed/proxy environments
}, dbId);

console.log("[Firebase] Firestore initialized successfully");

export const getDb = () => dbInstance;

export const switchToDefaultDb = () => {
  console.warn("[Firebase] Switching frontend to (default) database...");
  try {
    dbInstance = getFirestore(app);
    console.log("[Firebase] Successfully switched to (default) instance");
  } catch (err) {
    console.error("[Firebase] Fatal: Failed to switch instance:", err);
  }
  return dbInstance;
};

export const auth = getAuth(app);
export { dbInstance as db }; 
export default app;
