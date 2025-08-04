import { initializeApp } from 'firebase/app';

const firebaseConfig = {
  // Estas credenciales deberán ser configuradas en el archivo .env.local
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export app and lazy-loaded services
export default app;

// Lazy load Firebase services to avoid SSR issues
export const getAuth = async () => {
  const { getAuth } = await import('firebase/auth');
  return getAuth(app);
};

export const getFirestore = async () => {
  const { getFirestore } = await import('firebase/firestore');
  return getFirestore(app);
};
