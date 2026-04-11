import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import fs from 'fs';

const config = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf-8'));
const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId);

async function updateMinDeposit() {
  try {
    const docRef = doc(db, 'global_config', 'app_settings');
    await setDoc(docRef, { minDeposit: 100 }, { merge: true });
    console.log('Successfully updated minDeposit to 100');
    process.exit(0);
  } catch (error) {
    console.error('Error updating minDeposit:', error);
    process.exit(1);
  }
}

updateMinDeposit();
