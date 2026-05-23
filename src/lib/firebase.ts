import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";

function firebaseConfig() {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
  const messagingSenderId = process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID;
  const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID;

  if (!apiKey || !projectId || !appId) {
    return null;
  }

  return {
    apiKey,
    authDomain: authDomain ?? undefined,
    projectId,
    storageBucket: storageBucket ?? undefined,
    messagingSenderId: messagingSenderId ?? undefined,
    appId,
  };
}

export function getFirebaseApp(): FirebaseApp | null {
  if (typeof window === "undefined") return null;
  const config = firebaseConfig();
  if (!config) return null;
  return getApps().length > 0 ? getApp() : initializeApp(config);
}

export function isFirebaseConfigured(): boolean {
  return firebaseConfig() != null;
}
