// firebase/admin.ts
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getDatabase } from 'firebase-admin/database';
import { getFirestore } from 'firebase-admin/firestore';

let isInitialized = false;

try {
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const databaseURL = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL;

  if (privateKey && clientEmail && projectId) {
    if (!getApps().length) {
      initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
        databaseURL,
      });
      isInitialized = true;
      console.log('✅ Firebase Admin SDK initialized');
    } else {
      isInitialized = true;
    }
  } else {
    console.warn('⚠️ Firebase Admin env variables missing');
  }
} catch (error) {
  console.error('❌ Firebase Admin initialization failed:', error);
}

// Ekspor langsung (akan berfungsi jika inisialisasi berhasil)
export const adminAuth = getAuth();
export const adminDb = getDatabase();
export const adminFirestore = getFirestore();
