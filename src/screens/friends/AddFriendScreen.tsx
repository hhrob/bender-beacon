import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { searchUserByUsername, sendFriendRequest } from '../../services/friends.service';
import { User } from '../../types';

const AddFriendScreen: React.FC = () => {
  const { user, userData } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchResult, setSearchResult] = useState<User | null>(null);

  const handleSearch = async () => {
    if (!searchTerm) {
      Alert.alert('Error', 'Please enter a username');
      return;
    }

    if (searchTerm === userData?.username) {
      Alert.alert('Error', 'You cannot add yourself as a friend');
      return;
    }

    setLoading(true);
    try {
      const foundUser = await searchUserByUsername(searchTerm);
      if (!foundUser) {
        Alert.alert('Not Found', 'No user found with this username');
        setSearchResult(null);
      } else {
        setSearchResult(foundUser);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSendRequest = async () => {
    if (!user || !userData || !searchResult) return;

    setLoading(true);
    try {
      await sendFriendRequest(
        user.uid,
        userData.displayName,
        userData.email,
        searchResult.uid
      );
      Alert.alert('Success', 'Friend request sent!');
      setSearchResult(null);
      setSearchTerm('');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.searchContainer}>
        <Text style={styles.label}>Search by Username:</Text>
        <View style={styles.searchRow}>
          <TextInput
            style={styles.input}
            placeholder="username"
            value={searchTerm}
            onChangeText={setSearchTerm}
            autoCapitalize="none"
            editable={true}
          />
          <TouchableOpacity
            style={[styles.searchButton, loading && styles.buttonDisabled]}
            onPress={handleSearch}
            disabled={loading}
          >
            <Text style={styles.searchButtonText}>Search</Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      )}

      {searchResult && !loading && (
        <View style={styles.resultContainer}>
          <View style={styles.userCard}>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{searchResult.displayName}</Text>
              <Text style={styles.userUsername}>@{searchResult.username}</Text>
              <Text style={styles.userEmail}>{searchResult.email}</Text>
            </View>
            <TouchableOpacity
              style={styles.addButton}
              onPress={handleSendRequest}
              disabled={loading}
            >
              <Text style={styles.addButtonText}>Send Request</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  searchContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333',
  },
  searchRow: {
    flexDirection: 'row',
    gap: 10,
  },
  input: {
    flex: 1,
    borderWidth: 0,
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    backgroundColor: '#f5f5f5',
    color: '#000',
    fontWeight: '500',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  searchButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  searchButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  loadingContainer: {
    marginTop: 40,
    alignItems: 'center',
  },
  resultContainer: {
    marginTop: 20,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  userUsername: {
    fontSize: 15,
    color: '#007AFF',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
  },
  addButton: {
    backgroundColor: '#34C759',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default AddFriendScreen;
