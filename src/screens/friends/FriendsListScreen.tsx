import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  TextInput,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import {
  getFriends,
  getPendingFriendRequests,
  acceptFriendRequest,
  rejectFriendRequest,
  removeFriend,
  blockUser,
  getFriendSuggestions,
} from '../../services/friends.service';
import { User, FriendRequest } from '../../types';

const FriendsListScreen: React.FC = () => {
  const { user, refreshUserData } = useAuth();
  const navigation = useNavigation();

  // STATE
  const [friends, setFriends] = useState<User[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [suggestions, setSuggestions] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // LOAD DATA
  const loadData = async () => {
    if (!user) return;

    try {
      const [friendsData, requestsData, suggestionsData] = await Promise.all([
        getFriends(user.uid),
        getPendingFriendRequests(user.uid),
        getFriendSuggestions(user.uid),
      ]);
      setFriends(friendsData);
      setFriendRequests(requestsData);
      setSuggestions(suggestionsData);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [user])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // FRIEND REQUESTS
  const handleAcceptRequest = async (requestId: string) => {
    try {
      await acceptFriendRequest(requestId, user!.uid);
      await refreshUserData();
      Alert.alert('Success', 'Friend request accepted!');
      loadData();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      await rejectFriendRequest(requestId);
      Alert.alert('Success', 'Friend request rejected');
      loadData();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  // FRIEND ACTIONS
  const handleFriendPress = (friend: User) => {
    navigation.navigate('FriendProfile' as never, { userId: friend.uid } as never);
  };

  const handleRemoveFriend = (friend: User) => {
    Alert.alert(
      'Remove Friend',
      `Are you sure you want to remove ${friend.displayName} from your friends?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeFriend(user!.uid, friend.uid);
              await refreshUserData();
              Alert.alert('Success', `${friend.displayName} has been removed from your friends`);
              loadData();
            } catch (error: any) {
              Alert.alert('Error', error.message);
            }
          },
        },
      ]
    );
  };

  const handleBlockUser = (friend: User) => {
    Alert.alert(
      'Block User',
      `Are you sure you want to block ${friend.displayName}? They will be removed from your friends and won't be able to send you friend requests.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Block',
          style: 'destructive',
          onPress: async () => {
            try {
              await blockUser(user!.uid, friend.uid);
              await refreshUserData();
              Alert.alert('Success', `${friend.displayName} has been blocked`);
              loadData();
            } catch (error: any) {
              Alert.alert('Error', error.message);
            }
          },
        },
      ]
    );
  };

  const showFriendOptions = (friend: User) => {
    Alert.alert(friend.displayName, 'Choose an action', [
      {
        text: 'View Profile',
        onPress: () => handleFriendPress(friend),
      },
      {
        text: 'Remove Friend',
        style: 'destructive',
        onPress: () => handleRemoveFriend(friend),
      },
      {
        text: 'Block User',
        style: 'destructive',
        onPress: () => handleBlockUser(friend),
      },
      {
        text: 'Cancel',
        style: 'cancel',
      },
    ]);
  };

  // SUGGESTION ACTIONS
  const handleSendRequestToSuggestion = async (suggestedUser: User) => {
    // Navigate to Add Friend screen would be better, but for now just alert
    navigation.navigate('AddFriend' as never);
  };

  // FILTER FRIENDS BY SEARCH
  const filteredFriends = friends.filter((friend) =>
    friend.displayName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // RENDER FUNCTIONS
  const renderFriendRequest = ({ item }: { item: FriendRequest }) => (
    <View style={styles.requestCard}>
      <View style={styles.requestInfo}>
        <Text style={styles.requestName}>{item.fromUserName}</Text>
        <Text style={styles.requestEmail}>{item.fromUserEmail}</Text>
      </View>
      <View style={styles.requestActions}>
        <TouchableOpacity
          style={styles.acceptButton}
          onPress={() => handleAcceptRequest(item.requestId)}
        >
          <Text style={styles.acceptButtonText}>Accept</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.rejectButton}
          onPress={() => handleRejectRequest(item.requestId)}
        >
          <Text style={styles.rejectButtonText}>Reject</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderFriend = ({ item }: { item: User }) => (
    <TouchableOpacity
      style={styles.friendCard}
      onPress={() => handleFriendPress(item)}
      onLongPress={() => showFriendOptions(item)}
      activeOpacity={0.7}
    >
      <View style={styles.friendAvatar}>
        <Text style={styles.friendAvatarText}>{item.displayName.charAt(0).toUpperCase()}</Text>
      </View>
      <View style={styles.friendInfo}>
        <Text style={styles.friendName}>{item.displayName}</Text>
        <Text style={styles.friendEmail}>{item.email}</Text>
      </View>
      <TouchableOpacity
        style={styles.optionsButton}
        onPress={() => showFriendOptions(item)}
      >
        <Text style={styles.optionsButtonText}>⋯</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderSuggestion = ({ item }: { item: User }) => (
    <View style={styles.suggestionCard}>
      <View style={styles.friendAvatar}>
        <Text style={styles.friendAvatarText}>{item.displayName.charAt(0).toUpperCase()}</Text>
      </View>
      <View style={styles.friendInfo}>
        <Text style={styles.friendName}>{item.displayName}</Text>
        <Text style={styles.suggestionMutual}>Mutual friends</Text>
      </View>
      <TouchableOpacity
        style={styles.addSuggestionButton}
        onPress={() => handleSendRequestToSuggestion(item)}
      >
        <Text style={styles.addSuggestionButtonText}>Add</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* HEADER WITH ADD BUTTON */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('AddFriend' as never)}
        >
          <Text style={styles.addButtonText}>+ Add Friend</Text>
        </TouchableOpacity>
      </View>

      {/* SEARCH BAR */}
      {friends.length > 0 && (
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search friends..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      )}

      <FlatList
        data={[]} // We'll handle rendering manually for better control
        renderItem={null}
        ListHeaderComponent={() => (
          <>
            {/* FRIEND REQUESTS */}
            {friendRequests.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  Friend Requests ({friendRequests.length})
                </Text>
                {friendRequests.map((request) => (
                  <View key={request.requestId}>
                    {renderFriendRequest({ item: request })}
                  </View>
                ))}
              </View>
            )}

            {/* FRIEND SUGGESTIONS */}
            {suggestions.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>People You May Know</Text>
                {suggestions.slice(0, 3).map((suggestion) => (
                  <View key={suggestion.uid}>
                    {renderSuggestion({ item: suggestion })}
                  </View>
                ))}
              </View>
            )}

            {/* MY FRIENDS */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                My Friends ({filteredFriends.length})
              </Text>
              {filteredFriends.length === 0 && searchQuery === '' && (
                <Text style={styles.emptyText}>
                  No friends yet. Add some friends to get started!
                </Text>
              )}
              {filteredFriends.length === 0 && searchQuery !== '' && (
                <Text style={styles.emptyText}>No friends found matching "{searchQuery}"</Text>
              )}
              {filteredFriends.map((friend) => (
                <View key={friend.uid}>{renderFriend({ item: friend })}</View>
              ))}
            </View>
          </>
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      />
    </View>
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
  },
  header: {
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  addButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  searchContainer: {
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  searchInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    color: '#000',
  },
  section: {
    marginBottom: 20,
    backgroundColor: '#fff',
    paddingVertical: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
    marginHorizontal: 15,
    color: '#333',
  },
  requestCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#FFF9E6',
    marginHorizontal: 15,
    marginBottom: 8,
    borderRadius: 8,
  },
  requestInfo: {
    flex: 1,
  },
  requestName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  requestEmail: {
    fontSize: 14,
    color: '#666',
  },
  requestActions: {
    flexDirection: 'row',
    gap: 8,
  },
  acceptButton: {
    backgroundColor: '#34C759',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  acceptButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  rejectButton: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  rejectButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  friendCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    marginHorizontal: 15,
    marginBottom: 8,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  friendAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  friendAvatarText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    color: '#000',
  },
  friendEmail: {
    fontSize: 14,
    color: '#666',
  },
  optionsButton: {
    padding: 8,
  },
  optionsButtonText: {
    fontSize: 24,
    color: '#666',
  },
  suggestionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    marginHorizontal: 15,
    marginBottom: 8,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
  },
  suggestionMutual: {
    fontSize: 13,
    color: '#007AFF',
  },
  addSuggestionButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  addSuggestionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 14,
    marginVertical: 20,
    marginHorizontal: 15,
  },
});

export default FriendsListScreen;
