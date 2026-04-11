import admin from 'firebase-admin';
import fs from 'fs';

const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));

try {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: firebaseConfig.projectId,
  });

  const db = admin.firestore();
  db.settings({ databaseId: firebaseConfig.firestoreDatabaseId });
  // Try to read api_tokens
  const snapshot = await db.collection('api_tokens').limit(1).get();
  console.log('Success! Found', snapshot.size, 'tokens');
} catch (e) {
  console.error('Error:', e);
}
