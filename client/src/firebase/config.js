import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

export const hasFirebaseConfig = Boolean(
  firebaseConfig.apiKey && firebaseConfig.authDomain && firebaseConfig.projectId && firebaseConfig.appId
);

const app = hasFirebaseConfig ? initializeApp(firebaseConfig) : null;
let analyticsInstance = null;

export const auth = app ? getAuth(app) : null;
export const db = app ? getFirestore(app) : null;
export const googleProvider = app ? new GoogleAuthProvider() : null;

export async function getFirebaseAnalytics() {
  if (!app || !firebaseConfig.measurementId || typeof window === "undefined") return null;
  if (analyticsInstance) return analyticsInstance;

  const supported = await isSupported().catch(() => false);
  if (!supported) return null;

  analyticsInstance = getAnalytics(app);
  return analyticsInstance;
}

export const analyticsPromise = getFirebaseAnalytics();
export default app;
