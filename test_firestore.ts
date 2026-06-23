import fs from 'fs';
import path from 'path';
import originalAdmin from 'firebase-admin';
import { getFirestore as getAdminFirestore } from 'firebase-admin/firestore';
import { initializeApp as initClientApp } from 'firebase/app';
import { getFirestore as getClientFirestore, doc, runTransaction } from 'firebase/firestore';

const logFile = path.resolve(process.cwd(), 'firestore_test_results.log');
fs.writeFileSync(logFile, "=== FIRESTORE SUBCOLLECTION TRANSACTION DIAGNOSTIC ===\n", 'utf8');

function log(msg: string, ...args: any[]) {
  const line = msg + " " + args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(" ");
  console.log(line);
  fs.appendFileSync(logFile, line + "\n", 'utf8');
}

const firebaseConfigPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
const firebaseConfig = JSON.parse(fs.readFileSync(firebaseConfigPath, 'utf8'));
const currentDbId = firebaseConfig.firestoreDatabaseId || '(default)';

const SERVER_SECRET = 'be4c6d81-1cb2-4249-a5cd-7822e9fa2a91_server_secret';

async function testTransaction() {
  log("\n--- Testing nested subcollection transaction ---");
  try {
    const clientApp = initClientApp(firebaseConfig);
    const clientDb = getClientFirestore(clientApp, currentDbId);
    
    // Simulate user document update, global transaction and nested subcollection transaction
    const userRef = doc(clientDb, 'users', 'test_user_id');
    const globalTxRef = doc(clientDb, 'transactions', 'TEST-SUB-TX-123');
    const userTxRef = doc(clientDb, 'users', 'test_user_id', 'transactions', 'TEST-SUB-TX-123');
    
    log("[Tx] Running nested transaction...");
    await runTransaction(clientDb, async (tx) => {
      log("[Tx] Reading test_user_id...");
      const userDoc = await tx.get(userRef);
      const balance = userDoc.exists() ? (userDoc.data()?.balance || 0) : 1000;
      
      log("[Tx] Updating user doc...");
      tx.set(userRef, {
        balance: balance - 50,
        _serverSecret: SERVER_SECRET
      }, { merge: true });
      
      log("[Tx] Saving global transactions/TEST-SUB-TX-123...");
      tx.set(globalTxRef, {
        amount: -50,
        type: 'withdrawal',
        _serverSecret: SERVER_SECRET
      });

      log("[Tx] Saving nested users/test_user_id/transactions/TEST-SUB-TX-123...");
      tx.set(userTxRef, {
        amount: -50,
        type: 'withdrawal',
        _serverSecret: SERVER_SECRET
      });
    });
    
    log("[Tx] Nested subcollection transaction COMPLETED success!");
  } catch (err: any) {
    log("[Tx] ERROR:", err.message, "Code:", err.code);
  }
}

async function run() {
  try {
    await testTransaction();
  } catch (e: any) {
    log("[Global] Exception during testing:", e.message);
  } finally {
    log("\n--- Nested Diagnostic finished. Forcing process.exit(0) ---");
    process.exit(0);
  }
}

run();
