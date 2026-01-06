import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCTsgp7uH3ksbdhefhaRe8ggc08Hz5O5eM",
  authDomain: "bender-beacon.firebaseapp.com",
  projectId: "bender-beacon",
  storageBucket: "bender-beacon.firebasestorage.app",
  messagingSenderId: "1031034864968",
  appId: "1:1031034864968:web:d00513aded852056105f7d",
};

// Initialize Firebase only if it hasn't been initialized yet
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Initialize Firebase services
export const auth = getAuth(app);

// Initialize Firestore with offline persistence DISABLED for React Native
// This fixes the "client is offline" error
// Only initialize if not already initialized
let db;
try {
  db = initializeFirestore(app, {
    experimentalForceLongPolling: true,
    useFetchStreams: false,
  });
} catch (error) {
  // If already initialized, just get the existing instance
  db = getFirestore(app);
}

export { db };
export const storage = getStorage(app);

export default app;
