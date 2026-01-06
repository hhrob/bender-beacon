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
  arrayRemove,
  deleteDoc,
} from 'firebase/firestore';
import { db } from '../config/firebase.config';
import { FriendRequest, User } from '../types';

/**
 * Search for a user by username
 */
export const searchUserByUsername = async (username: string): Promise<User | null> => {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('username', '==', username.toLowerCase()));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return null;
    }

    return querySnapshot.docs[0].data() as User;
  } catch (error: any) {
    throw new Error(error.message);
  }
};

/**
 * Send a friend request
 */
export const sendFriendRequest = async (
  fromUserId: string,
  fromUserName: string,
  fromUserEmail: string,
  toUserId: string
): Promise<void> => {
  try {
    // Check if friend request already exists
    const existingRequest = await checkExistingFriendRequest(fromUserId, toUserId);
    if (existingRequest) {
      throw new Error('Friend request already sent');
    }

    // Check if already friends
    const fromUserDoc = await getDoc(doc(db, 'users', fromUserId));
    const fromUserData = fromUserDoc.data() as User;
    if (fromUserData.friends.includes(toUserId)) {
      throw new Error('Already friends with this user');
    }

    // Create friend request
    const requestRef = doc(collection(db, 'friendRequests'));
    const friendRequest: FriendRequest = {
      requestId: requestRef.id,
      fromUserId,
      toUserId,
      fromUserName,
      fromUserEmail,
      status: 'pending',
      createdAt: Timestamp.now(),
    };

    await setDoc(requestRef, friendRequest);
  } catch (error: any) {
    throw new Error(error.message);
  }
};

/**
 * Check if a friend request already exists
 */
const checkExistingFriendRequest = async (
  fromUserId: string,
  toUserId: string
): Promise<boolean> => {
  const requestsRef = collection(db, 'friendRequests');
  const q = query(
    requestsRef,
    where('fromUserId', '==', fromUserId),
    where('toUserId', '==', toUserId),
    where('status', '==', 'pending')
  );
  const querySnapshot = await getDocs(q);
  return !querySnapshot.empty;
};

/**
 * Get pending friend requests for a user
 */
export const getPendingFriendRequests = async (userId: string): Promise<FriendRequest[]> => {
  try {
    const requestsRef = collection(db, 'friendRequests');
    const q = query(requestsRef, where('toUserId', '==', userId), where('status', '==', 'pending'));
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => doc.data() as FriendRequest);
  } catch (error: any) {
    throw new Error(error.message);
  }
};

/**
 * Accept a friend request
 */
export const acceptFriendRequest = async (requestId: string, userId: string): Promise<void> => {
  try {
    // Get the request
    const requestDoc = await getDoc(doc(db, 'friendRequests', requestId));
    if (!requestDoc.exists()) {
      throw new Error('Friend request not found');
    }

    const request = requestDoc.data() as FriendRequest;

    // Update both users' friends lists
    await updateDoc(doc(db, 'users', request.fromUserId), {
      friends: arrayUnion(request.toUserId),
    });

    await updateDoc(doc(db, 'users', request.toUserId), {
      friends: arrayUnion(request.fromUserId),
    });

    // Update request status
    await updateDoc(doc(db, 'friendRequests', requestId), {
      status: 'accepted',
    });
  } catch (error: any) {
    throw new Error(error.message);
  }
};

/**
 * Reject a friend request
 */
export const rejectFriendRequest = async (requestId: string): Promise<void> => {
  try {
    await updateDoc(doc(db, 'friendRequests', requestId), {
      status: 'rejected',
    });
  } catch (error: any) {
    throw new Error(error.message);
  }
};

/**
 * Get user's friends
 */
export const getFriends = async (userId: string): Promise<User[]> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) {
      return [];
    }

    const userData = userDoc.data() as User;
    const friendIds = userData.friends || [];

    if (friendIds.length === 0) {
      return [];
    }

    // Fetch all friend user documents
    const friendsPromises = friendIds.map((friendId) => getDoc(doc(db, 'users', friendId)));
    const friendsDocs = await Promise.all(friendsPromises);

    return friendsDocs
      .filter((doc) => doc.exists())
      .map((doc) => doc.data() as User);
  } catch (error: any) {
    throw new Error(error.message);
  }
};

/**
 * Remove a friend (unfriend)
 */
export const removeFriend = async (userId: string, friendId: string): Promise<void> => {
  try {
    // Remove friend from both users' friends lists
    await updateDoc(doc(db, 'users', userId), {
      friends: arrayRemove(friendId),
    });

    await updateDoc(doc(db, 'users', friendId), {
      friends: arrayRemove(userId),
    });
  } catch (error: any) {
    throw new Error(error.message);
  }
};

/**
 * Block a user
 */
export const blockUser = async (userId: string, userToBlockId: string): Promise<void> => {
  try {
    // Add to blocked users list
    await updateDoc(doc(db, 'users', userId), {
      blockedUsers: arrayUnion(userToBlockId),
      friends: arrayRemove(userToBlockId), // Also remove from friends if they were friends
    });

    // Remove from the other user's friends list if they were friends
    await updateDoc(doc(db, 'users', userToBlockId), {
      friends: arrayRemove(userId),
    });
  } catch (error: any) {
    throw new Error(error.message);
  }
};

/**
 * Unblock a user
 */
export const unblockUser = async (userId: string, userToUnblockId: string): Promise<void> => {
  try {
    await updateDoc(doc(db, 'users', userId), {
      blockedUsers: arrayRemove(userToUnblockId),
    });
  } catch (error: any) {
    throw new Error(error.message);
  }
};

/**
 * Get blocked users
 */
export const getBlockedUsers = async (userId: string): Promise<User[]> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) {
      return [];
    }

    const userData = userDoc.data() as User;
    const blockedUserIds = userData.blockedUsers || [];

    if (blockedUserIds.length === 0) {
      return [];
    }

    // Fetch all blocked user documents
    const blockedUsersPromises = blockedUserIds.map((blockedId) =>
      getDoc(doc(db, 'users', blockedId))
    );
    const blockedUsersDocs = await Promise.all(blockedUsersPromises);

    return blockedUsersDocs
      .filter((doc) => doc.exists())
      .map((doc) => doc.data() as User);
  } catch (error: any) {
    throw new Error(error.message);
  }
};

/**
 * Get friend suggestions (users with mutual friends)
 */
export const getFriendSuggestions = async (userId: string): Promise<User[]> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) {
      return [];
    }

    const userData = userDoc.data() as User;
    const myFriendIds = userData.friends || [];
    const myBlockedIds = userData.blockedUsers || [];

    if (myFriendIds.length === 0) {
      return []; // No friends = no suggestions based on mutual friends
    }

    // Get all friends' friend lists
    const friendsPromises = myFriendIds.map((friendId) => getDoc(doc(db, 'users', friendId)));
    const friendsDocs = await Promise.all(friendsPromises);

    // Collect all potential suggestions (friends of friends)
    const potentialSuggestions = new Map<string, number>(); // uid -> mutual friend count

    friendsDocs.forEach((friendDoc) => {
      if (friendDoc.exists()) {
        const friendData = friendDoc.data() as User;
        const theirFriends = friendData.friends || [];

        theirFriends.forEach((potentialFriendId) => {
          // Don't suggest yourself, existing friends, or blocked users
          if (
            potentialFriendId !== userId &&
            !myFriendIds.includes(potentialFriendId) &&
            !myBlockedIds.includes(potentialFriendId)
          ) {
            const currentCount = potentialSuggestions.get(potentialFriendId) || 0;
            potentialSuggestions.set(potentialFriendId, currentCount + 1);
          }
        });
      }
    });

    // Sort by number of mutual friends (descending)
    const sortedSuggestions = Array.from(potentialSuggestions.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10); // Limit to top 10 suggestions

    if (sortedSuggestions.length === 0) {
      return [];
    }

    // Fetch the suggested users' data
    const suggestionsPromises = sortedSuggestions.map(([uid]) => getDoc(doc(db, 'users', uid)));
    const suggestionsDocs = await Promise.all(suggestionsPromises);

    return suggestionsDocs
      .filter((doc) => doc.exists())
      .map((doc) => doc.data() as User);
  } catch (error: any) {
    throw new Error(error.message);
  }
};
