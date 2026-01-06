import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  Timestamp,
  arrayUnion,
  deleteField,
} from 'firebase/firestore';
import { db } from '../config/firebase.config';
import { Bender, BenderLocation, BenderParticipant } from '../types';

/**
 * Create a new bender
 */
export const createBender = async (
  creatorId: string,
  title: string,
  location: BenderLocation,
  invitedUserIds: string[]
): Promise<string> => {
  try {
    const benderRef = doc(collection(db, 'benders'));

    const bender: Bender = {
      benderId: benderRef.id,
      creatorId,
      title,
      location,
      startTime: Timestamp.now(),
      status: 'active',
      invitedUsers: [creatorId, ...invitedUserIds],
      participants: {
        [creatorId]: {
          joinedAt: Timestamp.now(),
          beerCount: 0,
          isAtLocation: false,
        },
      },
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    await setDoc(benderRef, bender);
    return benderRef.id;
  } catch (error: any) {
    throw new Error(error.message);
  }
};

/**
 * Get benders for a user (invited to or created)
 */
export const getBendersForUser = async (userId: string): Promise<Bender[]> => {
  try {
    const bendersRef = collection(db, 'benders');
    const q = query(
      bendersRef,
      where('invitedUsers', 'array-contains', userId),
      where('status', '==', 'active')
    );
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => doc.data() as Bender);
  } catch (error: any) {
    throw new Error(error.message);
  }
};

/**
 * Get a specific bender by ID
 */
export const getBenderById = async (benderId: string): Promise<Bender | null> => {
  try {
    const benderDoc = await getDoc(doc(db, 'benders', benderId));
    if (benderDoc.exists()) {
      return benderDoc.data() as Bender;
    }
    return null;
  } catch (error: any) {
    throw new Error(error.message);
  }
};

/**
 * Join a bender
 */
export const joinBender = async (benderId: string, userId: string): Promise<void> => {
  try {
    const participant: BenderParticipant = {
      joinedAt: Timestamp.now(),
      beerCount: 0,
      isAtLocation: false,
    };

    await updateDoc(doc(db, 'benders', benderId), {
      [`participants.${userId}`]: participant,
      updatedAt: Timestamp.now(),
    });
  } catch (error: any) {
    throw new Error(error.message);
  }
};

/**
 * Leave a bender
 */
export const leaveBender = async (benderId: string, userId: string): Promise<void> => {
  try {
    await updateDoc(doc(db, 'benders', benderId), {
      [`participants.${userId}`]: deleteField(),
      updatedAt: Timestamp.now(),
    });
  } catch (error: any) {
    throw new Error(error.message);
  }
};

/**
 * Update beer count for a user in a bender
 */
export const updateBeerCount = async (
  benderId: string,
  userId: string,
  newCount: number
): Promise<void> => {
  try {
    await updateDoc(doc(db, 'benders', benderId), {
      [`participants.${userId}.beerCount`]: newCount,
      updatedAt: Timestamp.now(),
    });
  } catch (error: any) {
    throw new Error(error.message);
  }
};

/**
 * Update location check-in status
 */
export const updateLocationStatus = async (
  benderId: string,
  userId: string,
  isAtLocation: boolean
): Promise<void> => {
  try {
    await updateDoc(doc(db, 'benders', benderId), {
      [`participants.${userId}.isAtLocation`]: isAtLocation,
      updatedAt: Timestamp.now(),
    });
  } catch (error: any) {
    throw new Error(error.message);
  }
};

/**
 * Update bender location (creator only)
 */
export const updateBenderLocation = async (
  benderId: string,
  newLocation: BenderLocation
): Promise<void> => {
  try {
    await updateDoc(doc(db, 'benders', benderId), {
      location: newLocation,
      updatedAt: Timestamp.now(),
    });
  } catch (error: any) {
    throw new Error(error.message);
  }
};

/**
 * End a bender (creator only)
 */
export const endBender = async (benderId: string): Promise<void> => {
  try {
    await updateDoc(doc(db, 'benders', benderId), {
      status: 'ended',
      endTime: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
  } catch (error: any) {
    throw new Error(error.message);
  }
};
