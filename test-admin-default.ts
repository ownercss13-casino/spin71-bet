import fs from "fs";
import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

const firebaseConfig = JSON.parse(fs.readFileSync('firebase-applet-config.json', 'utf8'));
admin.initializeApp({ projectId: firebaseConfig.projectId });
const db = getFirestore();

async function test() {
  try {
    const doc = await db.collection('config').doc('main').get();
    console.log("Exists:", doc.exists);
  } catch (e: any) {
    console.error("Error:", e.message);
  }
}
test();
