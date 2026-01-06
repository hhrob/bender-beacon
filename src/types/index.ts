import { Timestamp } from 'firebase/firestore';

// User types
export interface User {
  uid: string;
  email: string;
  displayName: string;
  username: string; // Unique username for easy searching
  phoneNumber?: string;
  bio?: string; // User bio/description
  fcmToken?: string;
  createdAt: Timestamp;
  friends: string[]; // Array of user UIDs
  blockedUsers?: string[]; // Array of blocked user UIDs
  profilePicture?: string; // URL to profile picture
  lastActive?: Timestamp; // Last time user was active
  totalBeersConsumed?: number; // Total beer count across all benders
  featuredBenders?: string[]; // Array of bender IDs to display on profile
}

// Bender types
export interface BenderLocation {
  latitude: number;
  longitude: number;
  address: string;
}

export interface BenderParticipant {
  joinedAt: Timestamp;
  beerCount: number;
  isAtLocation: boolean;
}

export interface BenderPhoto {
  photoId: string;
  url: string;
  uploadedBy: string; // User UID
  uploadedByName: string; // User display name
  uploadedAt: Timestamp;
  caption?: string;
}

export interface Bender {
  benderId: string;
  creatorId: string;
  title: string;
  location: BenderLocation;
  startTime: Timestamp;
  endTime?: Timestamp;
  status: 'active' | 'ended';
  invitedUsers: string[]; // Array of user UIDs
  participants: {
    [userId: string]: BenderParticipant;
  };
  photos?: BenderPhoto[]; // Photos uploaded by participants
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Chat message types
export interface ChatMessage {
  messageId: string;
  userId: string;
  userName: string;
  text: string;
  createdAt: Timestamp;
}

// Friend request types
export interface FriendRequest {
  requestId: string;
  fromUserId: string;
  toUserId: string;
  fromUserName: string;
  fromUserEmail: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: Timestamp;
}

// Navigation types
export type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
};

export type BendersStackParamList = {
  ActiveBendersList: undefined;
  BenderDetail: { benderId: string };
};

export type FriendsStackParamList = {
  FriendsList: undefined;
  AddFriend: undefined;
  FriendProfile: { userId: string };
};

export type ProfileStackParamList = {
  Profile: undefined;
};

export type CreateBenderStackParamList = {
  CreateBender: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  CreateBender: undefined;
  Friends: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};
