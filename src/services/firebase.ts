import { initializeApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore, initializeFirestore, CACHE_SIZE_UNLIMITED } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

console.log("[Firebase] Initializing Firestore with DB ID:", firebaseConfig.firestoreDatabaseId);

// Handle (default) database ID
const dbId = firebaseConfig.firestoreDatabaseId === '(default)' ? undefined : firebaseConfig.firestoreDatabaseId;

// Initialize Firestore with specific settings to improve stability in restricted environments
let dbInstance;
try {
  console.log("[Firebase] Attempting to initialize Firestore with DB ID:", dbId);
  dbInstance = initializeFirestore(app, {
    cacheSizeBytes: CACHE_SIZE_UNLIMITED,
    experimentalForceLongPolling: true, // Often helps in sandboxed/proxy environments
  }, dbId);
} catch (err) {
  console.error("[Firebase] Failed to initialize named Firestore instance, falling back to default:", err);
  dbInstance = getFirestore(app);
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

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
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
  console.error('[Firestore Error]:', errorMessage);
  
  // Re-throw if it is a permission error, wrapped in our formal IR
  if (errInfo.error.includes('permissions') || errInfo.error.includes('PERMISSION_DENIED')) {
    throw new Error(errorMessage);
  }
  
  throw error;
}

export default app;
