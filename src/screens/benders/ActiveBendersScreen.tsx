import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { getBendersForUser } from '../../services/bender.service';
import { Bender } from '../../types';

const ActiveBendersScreen: React.FC = () => {
  const { user } = useAuth();
  const navigation = useNavigation();

  // STATE: Track the benders and loading states
  const [benders, setBenders] = useState<Bender[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // LOAD BENDERS: Fetch from Firebase
  const loadBenders = async () => {
    if (!user) return;

    try {
      const bendersData = await getBendersForUser(user.uid);
      // Sort by most recent first
      const sortedBenders = bendersData.sort(
        (a, b) => b.createdAt.toMillis() - a.createdAt.toMillis()
      );
      setBenders(sortedBenders);
    } catch (error: any) {
      console.error('Error loading benders:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // useFocusEffect: Reload benders every time this screen comes into focus
  // This is better than useEffect because it runs when you navigate back to this screen
  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadBenders();
    }, [user])
  );

  // HANDLE REFRESH: Pull down to refresh
  const handleRefresh = () => {
    setRefreshing(true);
    loadBenders();
  };

  // HANDLE BENDER PRESS: Navigate to bender detail screen
  const handleBenderPress = (benderId: string) => {
    navigation.navigate('BenderDetail' as never, { benderId } as never);
  };

  // RENDER BENDER CARD: Each item in the list
  const renderBenderCard = ({ item }: { item: Bender }) => {
    // Count how many people have joined
    const participantCount = Object.keys(item.participants).length;

    // Check if current user is the creator
    const isCreator = item.creatorId === user?.uid;

    // Format the date
    const createdDate = item.createdAt.toDate().toLocaleDateString();

    return (
      <TouchableOpacity
        style={styles.benderCard}
        onPress={() => handleBenderPress(item.benderId)}
        activeOpacity={0.7}
      >
        {/* Header: Title and Creator Badge */}
        <View style={styles.cardHeader}>
          <Text style={styles.benderTitle}>{item.title}</Text>
          {isCreator && (
            <View style={styles.creatorBadge}>
              <Text style={styles.creatorBadgeText}>Creator</Text>
            </View>
          )}
        </View>

        {/* Location */}
        <View style={styles.infoRow}>
          <Text style={styles.infoIcon}>📍</Text>
          <Text style={styles.infoText}>{item.location.address}</Text>
        </View>

        {/* Participants */}
        <View style={styles.infoRow}>
          <Text style={styles.infoIcon}>👥</Text>
          <Text style={styles.infoText}>
            {participantCount} {participantCount === 1 ? 'person' : 'people'} joined
          </Text>
        </View>

        {/* Date */}
        <View style={styles.infoRow}>
          <Text style={styles.infoIcon}>📅</Text>
          <Text style={styles.infoText}>Created {createdDate}</Text>
        </View>

        {/* Status Badge */}
        <View style={styles.statusBadge}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>Active</Text>
        </View>
      </TouchableOpacity>
    );
  };

  // LOADING STATE: Show spinner while fetching
  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading your benders...</Text>
      </View>
    );
  }

  // EMPTY STATE: No benders yet
  if (benders.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyIcon}>🍺</Text>
        <Text style={styles.emptyTitle}>No Active Benders</Text>
        <Text style={styles.emptyText}>
          Create a bender or wait for a friend to invite you!
        </Text>
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => navigation.navigate('CreateBender' as never)}
        >
          <Text style={styles.createButtonText}>Create Your First Bender</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // RENDER LIST: Show all benders
  return (
    <View style={styles.container}>
      <FlatList
        data={benders}
        renderItem={renderBenderCard}
        keyExtractor={(item) => item.benderId}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#007AFF"
          />
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  listContainer: {
    padding: 15,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  emptyIcon: {
    fontSize: 60,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  createButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  benderCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  benderTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
    flex: 1,
  },
  creatorBadge: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  creatorBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoIcon: {
    fontSize: 16,
    marginRight: 8,
    width: 20,
  },
  infoText: {
    fontSize: 15,
    color: '#666',
    flex: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#34C759',
    marginRight: 6,
  },
  statusText: {
    fontSize: 14,
    color: '#34C759',
    fontWeight: '600',
  },
});

export default ActiveBendersScreen;
