import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getDatabase } from 'firebase-admin/database';
import { getFirestore } from 'firebase-admin/firestore';

const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const databaseURL = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL;

// Validasi environment variables
if (!privateKey || !clientEmail || !projectId) {
  throw new Error(
    'Missing Firebase Admin environment variables. ' +
    'Please set FIREBASE_PRIVATE_KEY, FIREBASE_CLIENT_EMAIL, and NEXT_PUBLIC_FIREBASE_PROJECT_ID.'
  );
}

// Inisialisasi hanya jika belum ada
if (!getApps().length) {
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

// Ekspor service yang dibutuhkan
export const adminAuth = getAuth();
export const adminDb = getDatabase();
export const adminFirestore = getFirestore();
