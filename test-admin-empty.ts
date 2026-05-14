import fs from "fs";
import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

const firebaseConfig = JSON.parse(fs.readFileSync('firebase-applet-config.json', 'utf8'));

// DONT PASS projectId!
admin.initializeApp();

const db = getFirestore(admin.app(), "ai-studio-be4c6d81-1cb2-4249-a5cd-7822e9fa2a91");

async function test() {
  try {
    const doc = await db.collection('config').doc('main').get();
    console.log("Exists:", doc.exists);
  } catch (e: any) {
    console.error("Error:", e.message);
  }
}
test();
