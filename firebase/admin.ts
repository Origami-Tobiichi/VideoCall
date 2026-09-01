import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getDatabase } from 'firebase-admin/database';
import { getFirestore } from 'firebase-admin/firestore';

const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const databaseURL = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL;

// Hanya inisialisasi jika semua env tersedia
if (privateKey && clientEmail && projectId) {
  if (!getApps().length) {
    try {
      initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
        databaseURL,
      });
      console.log('✅ Firebase Admin SDK initialized');
    } catch (error) {
      console.error('❌ Firebase Admin initialization failed:', error);
    }
  }
} else {
  console.warn('⚠️ Firebase Admin env variables missing. Admin APIs will not work.');
}

// Ekspor service (mungkin undefined jika inisialisasi gagal)
export const adminAuth = getAuth();
export const adminDb = getDatabase();
export const adminFirestore = getFirestore();
