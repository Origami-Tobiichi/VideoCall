import * as admin from 'firebase-admin';

// Cek apakah admin sudah diinisialisasi
if (!admin.apps || admin.apps.length === 0) {
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const databaseURL = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL;

  if (!privateKey || !clientEmail || !projectId) {
    throw new Error(
      'Firebase Admin SDK environment variables missing. ' +
      'Please set FIREBASE_PRIVATE_KEY, FIREBASE_CLIENT_EMAIL, and NEXT_PUBLIC_FIREBASE_PROJECT_ID.'
    );
  }

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey,
    }),
    databaseURL,
  });

  console.log('✅ Firebase Admin SDK initialized');
}

// Ekspor service yang dibutuhkan
export const adminAuth = admin.auth();
export const adminDb = admin.database();
export const adminFirestore = admin.firestore();
