import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  User as FirebaseUser,
} from 'firebase/auth';
import { doc, setDoc, getDoc, getDocs, query, where, collection, Timestamp } from 'firebase/firestore';
import { auth, db } from '../config/firebase.config';
import { User } from '../types';

/**
 * Check if username is already taken
 */
export const checkUsernameAvailable = async (username: string): Promise<boolean> => {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('username', '==', username.toLowerCase()));
    const querySnapshot = await getDocs(q);
    return querySnapshot.empty; // true if available
  } catch (error: any) {
    throw new Error(error.message);
  }
};

/**
 * Sign up a new user with email and password
 */
export const signUpWithEmail = async (
  email: string,
  password: string,
  displayName: string,
  username: string
): Promise<FirebaseUser> => {
  try {
    // Check if username is available
    const usernameAvailable = await checkUsernameAvailable(username);
    if (!usernameAvailable) {
      throw new Error('Username is already taken');
    }

    // Create the user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Update the display name
    await updateProfile(user, { displayName });

    // Create user document in Firestore
    const userDoc: User = {
      uid: user.uid,
      email: user.email!,
      displayName,
      username: username.toLowerCase(), // Store lowercase for consistency
      createdAt: Timestamp.now(),
      friends: [],
    };

    await setDoc(doc(db, 'users', user.uid), userDoc);

    return user;
  } catch (error: any) {
    throw new Error(error.message);
  }
};

/**
 * Sign in with email and password
 */
export const signInWithEmail = async (
  email: string,
  password: string
): Promise<FirebaseUser> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error: any) {
    throw new Error(error.message);
  }
};

/**
 * Sign out the current user
 */
export const logOut = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (error: any) {
    throw new Error(error.message);
  }
};

/**
 * Send password reset email
 */
export const resetPassword = async (email: string): Promise<void> => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error: any) {
    throw new Error(error.message);
  }
};

/**
 * Get user data from Firestore
 */
export const getUserData = async (uid: string): Promise<User | null> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      return userDoc.data() as User;
    }
    return null;
  } catch (error: any) {
    throw new Error(error.message);
  }
};
