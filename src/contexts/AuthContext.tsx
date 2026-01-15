import React, { createContext, useState, useEffect, useContext } from 'react';
import { User as FirebaseUser, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../config/firebase.config';
import { User } from '../types';
import { getUserData } from '../services/auth.service';

interface AuthContextType {
  user: FirebaseUser | null;
  userData: User | null;
  loading: boolean;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userData: null,
  loading: true,
  refreshUserData: async () => {},
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUserData = async () => {
    if (user) {
      try {
        const data = await getUserData(user.uid);
        setUserData(data);
      } catch (error) {
        console.error('Error refreshing user data:', error);
      }
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        // Fetch user data from Firestore with retry logic
        // Keep loading true until userData is fetched
        const fetchWithRetry = async (attempts = 3, delay = 1000) => {
          for (let i = 0; i < attempts; i++) {
            try {
              console.log(`[AuthContext] Attempt ${i + 1}/${attempts} to fetch user data`);
              const data = await getUserData(firebaseUser.uid);
              setUserData(data);
              console.log('[AuthContext] Successfully fetched user data');
              setLoading(false); // Only set loading false after successful fetch
              return;
            } catch (error: any) {
              console.error(`[AuthContext] Attempt ${i + 1} failed:`, error.message);
              if (i < attempts - 1) {
                console.log(`[AuthContext] Waiting ${delay}ms before retry...`);
                await new Promise(resolve => setTimeout(resolve, delay));
                delay *= 2; // Exponential backoff
              }
            }
          }
          console.error('[AuthContext] All attempts failed, setting userData to null');
          setUserData(null);
          setLoading(false); // Set loading false after all retries fail
        };

        await fetchWithRetry();
      } else {
        setUserData(null);
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ user, userData, loading, refreshUserData }}>
      {children}
    </AuthContext.Provider>
  );
};
