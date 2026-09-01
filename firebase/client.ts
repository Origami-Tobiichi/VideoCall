import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { 
  getFirestore, 
  initializeFirestore, 
  enableIndexedDbPersistence, 
  CACHE_SIZE_UNLIMITED 
} from 'firebase/firestore';
import { getDatabase } from 'firebase/database';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Inisialisasi Firestore dengan persistence (offline support)
if (typeof window !== 'undefined') {
  // Inisialisasi Firestore dengan cache unlimited
  initializeFirestore(app, {
    cacheSizeBytes: CACHE_SIZE_UNLIMITED,
  });

  // Aktifkan persistence
  enableIndexedDbPersistence(getFirestore(app)).catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn('⚠️ Multiple tabs open, persistence can only be enabled in one tab at a time.');
    } else if (err.code === 'unimplemented') {
      console.warn('⚠️ Browser does not support persistence.');
    } else {
      console.warn('⚠️ Persistence error:', err);
    }
  });
}

// App Check (opsional)
if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_APP_CHECK_SITE_KEY) {
  initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider(process.env.NEXT_PUBLIC_APP_CHECK_SITE_KEY),
    isTokenAutoRefreshEnabled: true,
  });
}

const auth = getAuth(app);
const firestore = getFirestore(app);
const realtimeDb = getDatabase(app);

export { auth, firestore, realtimeDb };
