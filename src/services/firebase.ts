import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore, initializeFirestore, CACHE_SIZE_UNLIMITED, setLogLevel, getDoc, getDocs, onSnapshot, setDoc, updateDoc, addDoc, deleteDoc } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const config = firebaseConfig as any;

// Silence verbose connection warnings in console by prioritizing severe errors only
try {
  setLogLevel('error');
} catch (logErr) {
  console.warn("[Firebase] Failed to silence verbose logging:", logErr);
}

const app = initializeApp(config);

console.log("[Firebase] Initializing Firestore with DB ID:", config.firestoreDatabaseId);

// Handle (default) database ID
const dbId = config.firestoreDatabaseId === '(default)' ? undefined : config.firestoreDatabaseId;

// Initialize Firestore with specific settings to improve stability in restricted environments
let dbInstance: any;
try {
  console.log("[Firebase] Attempting to initialize Firestore with DB ID:", dbId);
  dbInstance = initializeFirestore(app, {
    cacheSizeBytes: CACHE_SIZE_UNLIMITED,
    experimentalForceLongPolling: true,
  }, dbId);
} catch (err) {
  console.error("[Firebase] Failed to initialize Firestore with custom settings, falling back:", err);
  try {
    if (dbId) {
      dbInstance = getFirestore(app, dbId);
    } else {
      dbInstance = getFirestore(app);
    }
  } catch (fallbackErr) {
    console.error("[Firebase] Fatal fallback initialization failed:", fallbackErr);
    dbInstance = getFirestore(app);
  }
}

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

// Helper to get either the real Firebase user or a mock session user
export const getActiveUser = () => {
  const mockUid = localStorage.getItem('mock_user_uid');
  if (mockUid) {
    return {
      uid: mockUid,
      email: localStorage.getItem('mock_user_email') || `${mockUid}@spin71bet1.aistudio`,
      displayName: localStorage.getItem('mock_user_username') || 'User',
      isMock: true,
      getIdToken: async (_forceRefresh?: boolean) => localStorage.getItem('mock_user_token') || ""
    } as any;
  }
  return auth.currentUser;
};

// Explicitly configure browserLocalPersistence to guarantee user session longevity
try {
  setPersistence(auth, browserLocalPersistence)
    .then(() => {
      console.log("[Firebase] Session persistence successfully initialized to LOCAL.");
    })
    .catch((err) => {
      console.error("[Firebase] Error setting auth session persistence:", err);
    });
} catch (persistenceError) {
  console.error("[Firebase] Refused to apply session persistence:", persistenceError);
}
export { dbInstance as db }; 

// --- Firestore Error Handling (as per security guidelines) ---
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  }
}

export function handleFirestoreError(error: any, operationType: OperationType, path: string | null) {
  const code = error?.code || 'unknown';
  const message = error?.message || String(error);
  
  const errInfo: FirestoreErrorInfo = {
    error: `${code}: ${message}`,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous
    },
    operationType,
    path
  };
  
  const errorMessage = JSON.stringify(errInfo);
  console.error(`[Firestore ${operationType} Error on ${path}]:`, errorMessage);
  
  if (message.includes('Quota') || message.includes('Resource exhausted') || message.includes('RESOURCE_EXHAUSTED')) {
    console.warn('[Firestore] Suppressed Quota Error for operation:', operationType, path);
    return;
  }

  // Re-throw if it is a permission error, ensuring it's caught and displayed
  if (code === 'permission-denied' || message.includes('permissions') || message.includes('PERMISSION_DENIED')) {
    const permError = new Error(`Firebase Permission Error [${operationType}]: ${path}. User: ${auth.currentUser?.uid || 'Not Logged In'}`);
    (permError as any).details = errInfo;
    throw permError;
  }
  
  throw error;
}

export default app;
