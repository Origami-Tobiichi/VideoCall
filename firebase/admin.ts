import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getDatabase } from 'firebase-admin/database';
import { getFirestore } from 'firebase-admin/firestore';

const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const databaseURL = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL;

if (!privateKey || !clientEmail || !projectId) {
  console.warn(
    '⚠️ Firebase Admin environment variables missing. Admin APIs will not work.'
  );
} else if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey,
    }),
    databaseURL,
  });
  console.log('✅ Firebase Admin SDK initialized');
}

export const adminAuth = getAuth();
export const adminDb = getDatabase();
export const adminFirestore = getFirestore();
