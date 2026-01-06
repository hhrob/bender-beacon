import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { getUserData } from '../../services/auth.service';
import { removeFriend, blockUser } from '../../services/friends.service';
import { useAuth } from '../../contexts/AuthContext';
import { User } from '../../types';

type FriendProfileRouteParams = {
  FriendProfile: {
    userId: string;
  };
};

type FriendProfileRouteProp = RouteProp<FriendProfileRouteParams, 'FriendProfile'>;

const FriendProfileScreen: React.FC = () => {
  const route = useRoute<FriendProfileRouteProp>();
  const navigation = useNavigation();
  const { user: currentUser, refreshUserData } = useAuth();
  const { userId } = route.params;

  const [friendData, setFriendData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFriendData();
  }, [userId]);

  const loadFriendData = async () => {
    try {
      const data = await getUserData(userId);
      setFriendData(data);
    } catch (error: any) {
      Alert.alert('Error', 'Failed to load profile');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFriend = () => {
    if (!friendData || !currentUser) return;

    Alert.alert(
      'Remove Friend',
      `Are you sure you want to remove ${friendData.displayName} from your friends?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeFriend(currentUser.uid, friendData.uid);
              await refreshUserData();
              Alert.alert('Success', `${friendData.displayName} has been removed from your friends`);
              navigation.goBack();
            } catch (error: any) {
              Alert.alert('Error', error.message);
            }
          },
        },
      ]
    );
  };

  const handleBlockUser = () => {
    if (!friendData || !currentUser) return;

    Alert.alert(
      'Block User',
      `Are you sure you want to block ${friendData.displayName}? They will be removed from your friends.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Block',
          style: 'destructive',
          onPress: async () => {
            try {
              await blockUser(currentUser.uid, friendData.uid);
              await refreshUserData();
              Alert.alert('Success', `${friendData.displayName} has been blocked`);
              navigation.goBack();
            } catch (error: any) {
              Alert.alert('Error', error.message);
            }
          },
        },
      ]
    );
  };

  const showOptions = () => {
    if (!friendData) return;

    Alert.alert(friendData.displayName, 'Choose an action', [
      {
        text: 'Remove Friend',
        style: 'destructive',
        onPress: handleRemoveFriend,
      },
      {
        text: 'Block User',
        style: 'destructive',
        onPress: handleBlockUser,
      },
      {
        text: 'Cancel',
        style: 'cancel',
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!friendData) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Failed to load profile</Text>
      </View>
    );
  }

  const totalBeers = friendData.totalBeersConsumed || 0;
  const friendsCount = friendData.friends?.length || 0;
  const featuredBendersCount = friendData.featuredBenders?.length || 0;

  return (
    <ScrollView style={styles.container}>
      {/* HEADER SECTION */}
      <View style={styles.header}>
        {/* Avatar */}
        <View style={styles.avatarLarge}>
          <Text style={styles.avatarText}>
            {friendData.displayName.charAt(0).toUpperCase()}
          </Text>
        </View>

        {/* Options Button */}
        <TouchableOpacity style={styles.optionsButton} onPress={showOptions}>
          <Text style={styles.optionsButtonText}>⋯</Text>
        </TouchableOpacity>
      </View>

      {/* PROFILE INFO */}
      <View style={styles.infoSection}>
        <Text style={styles.displayName}>{friendData.displayName}</Text>
        <Text style={styles.username}>@{friendData.username}</Text>
        {friendData.bio && <Text style={styles.bio}>{friendData.bio}</Text>}
      </View>

      {/* STATS SECTION */}
      <View style={styles.statsSection}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{totalBeers}</Text>
          <Text style={styles.statLabel}>Beers</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{friendsCount}</Text>
          <Text style={styles.statLabel}>Friends</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{featuredBendersCount}</Text>
          <Text style={styles.statLabel}>Benders</Text>
        </View>
      </View>

      {/* FEATURED BENDERS SECTION */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Featured Benders</Text>
        {featuredBendersCount === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🍺</Text>
            <Text style={styles.emptyText}>
              {friendData.displayName} hasn't featured any benders yet.
            </Text>
          </View>
        ) : (
          <Text style={styles.comingSoonText}>
            Featured benders will appear here! (Coming soon)
          </Text>
        )}
      </View>

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  errorText: {
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: '#fff',
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    position: 'relative',
  },
  avatarLarge: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  avatarText: {
    color: '#fff',
    fontSize: 40,
    fontWeight: '700',
  },
  optionsButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    padding: 10,
  },
  optionsButtonText: {
    fontSize: 28,
    color: '#666',
  },
  infoSection: {
    backgroundColor: '#fff',
    padding: 20,
    marginTop: 10,
  },
  displayName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000',
    textAlign: 'center',
    marginBottom: 5,
  },
  username: {
    fontSize: 18,
    color: '#007AFF',
    textAlign: 'center',
    marginBottom: 10,
  },
  bio: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginVertical: 10,
    lineHeight: 22,
  },
  statsSection: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginTop: 10,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#f0f0f0',
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '700',
    color: '#007AFF',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 10,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
    marginBottom: 15,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyIcon: {
    fontSize: 60,
    marginBottom: 15,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    lineHeight: 22,
  },
  comingSoonText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    fontStyle: 'italic',
    paddingVertical: 20,
  },
  bottomSpacer: {
    height: 40,
  },
});

export default FriendProfileScreen;
