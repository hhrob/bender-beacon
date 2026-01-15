import { initializeApp, getApps } from 'firebase/app';
import { initializeAuth, getReactNativePersistence, getAuth } from 'firebase/auth';
import { initializeFirestore, getFirestore, Firestore, enableNetwork } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

// Initialize Auth with AsyncStorage persistence for React Native
let auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
  });
} catch (error) {
  // If already initialized, get existing instance
  console.log('Auth already initialized, using existing instance');
  auth = getAuth(app);
}

// Initialize Firestore for React Native
let db: Firestore;
try {
  db = initializeFirestore(app, {
    experimentalForceLongPolling: true,
  });

  // Explicitly enable network to ensure Firestore connects
  enableNetwork(db).catch(err => {
    console.log('Network already enabled or error enabling:', err);
  });
} catch (error) {
  // If already initialized, just get the existing instance
  console.log('Firestore already initialized, using existing instance');
  db = getFirestore(app);

  // Still try to enable network on existing instance
  enableNetwork(db).catch(err => {
    console.log('Network already enabled or error enabling:', err);
  });
}

export { auth, db };
export const storage = getStorage(app);

export default app;
