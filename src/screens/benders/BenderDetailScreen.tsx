import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { RouteProp, useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import MapView, { Marker } from 'react-native-maps';
import { useAuth } from '../../contexts/AuthContext';
import {
  getBenderById,
  joinBender,
  leaveBender,
  updateBeerCount,
  endBender,
} from '../../services/bender.service';
import { getUserData } from '../../services/auth.service';
import { Bender } from '../../types';

type BenderDetailRouteParams = {
  BenderDetail: {
    benderId: string;
  };
};

type BenderDetailRouteProp = RouteProp<BenderDetailRouteParams, 'BenderDetail'>;

const BenderDetailScreen: React.FC = () => {
  const route = useRoute<BenderDetailRouteProp>();
  const navigation = useNavigation();
  const { user, userData, refreshUserData } = useAuth();
  const { benderId } = route.params;

  const [benderData, setBenderData] = useState<Bender | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [participantNames, setParticipantNames] = useState<{ [userId: string]: string }>({});

  // Load bender data
  const loadBenderData = async () => {
    try {
      const data = await getBenderById(benderId);
      if (!data) {
        Alert.alert('Error', 'Bender not found');
        navigation.goBack();
        return;
      }
      setBenderData(data);

      // Load participant names
      const names: { [userId: string]: string } = {};
      const participantIds = Object.keys(data.participants);
      await Promise.all(
        participantIds.map(async (userId) => {
          const userData = await getUserData(userId);
          if (userData) {
            names[userId] = userData.displayName;
          }
        })
      );
      setParticipantNames(names);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadBenderData();
    }, [benderId])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    loadBenderData();
  };

  // Join bender
  const handleJoinBender = async () => {
    if (!user || !benderData) return;

    setUpdating(true);
    try {
      await joinBender(benderId, user.uid);
      Alert.alert('Success', 'You joined the bender!');
      await loadBenderData();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setUpdating(false);
    }
  };

  // Leave bender
  const handleLeaveBender = () => {
    if (!user || !benderData) return;

    Alert.alert('Leave Bender', 'Are you sure you want to leave this bender?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Leave',
        style: 'destructive',
        onPress: async () => {
          setUpdating(true);
          try {
            await leaveBender(benderId, user.uid);
            Alert.alert('Success', 'You left the bender');
            navigation.goBack();
          } catch (error: any) {
            Alert.alert('Error', error.message);
          } finally {
            setUpdating(false);
          }
        },
      },
    ]);
  };

  // Update beer count
  const handleUpdateBeerCount = async (increment: boolean) => {
    if (!user || !benderData) return;

    const currentCount = benderData.participants[user.uid]?.beerCount || 0;
    const newCount = increment ? currentCount + 1 : Math.max(0, currentCount - 1);

    // Show responsible drinking reminders
    if (increment) {
      if (newCount === 3) {
        Alert.alert('Stay Hydrated!', '💧 Remember to drink water between beers!');
      } else if (newCount === 5) {
        Alert.alert('Maybe Grab Some Food?', '🍕 Having some food will help you enjoy responsibly!');
      } else if (newCount === 7) {
        Alert.alert(
          'Stay Safe!',
          '🚰 Remember to drink plenty of water and stay safe. Consider slowing down!'
        );
      }
    }

    setUpdating(true);
    try {
      await updateBeerCount(benderId, user.uid, newCount);
      await loadBenderData();
      await refreshUserData(); // Update total beer count
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setUpdating(false);
    }
  };

  // End bender (creator only)
  const handleEndBender = () => {
    if (!user || !benderData) return;

    Alert.alert(
      'End Bender',
      'Are you sure you want to end this bender? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'End Bender',
          style: 'destructive',
          onPress: async () => {
            setUpdating(true);
            try {
              await endBender(benderId);
              Alert.alert('Success', 'Bender has been ended');
              navigation.goBack();
            } catch (error: any) {
              Alert.alert('Error', error.message);
            } finally {
              setUpdating(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!benderData || !user) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Failed to load bender</Text>
      </View>
    );
  }

  const isCreator = benderData.creatorId === user.uid;
  const hasJoined = user.uid in benderData.participants;
  const myBeerCount = benderData.participants[user.uid]?.beerCount || 0;
  const participantCount = Object.keys(benderData.participants).length;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
    >
      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.title}>{benderData.title}</Text>
          {isCreator && (
            <View style={styles.creatorBadge}>
              <Text style={styles.creatorBadgeText}>Creator</Text>
            </View>
          )}
        </View>
        <Text style={styles.location}>📍 {benderData.location.address}</Text>
        <Text style={styles.participants}>
          👥 {participantCount} {participantCount === 1 ? 'person' : 'people'} joined
        </Text>
      </View>

      {/* MAP */}
      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: benderData.location.latitude,
            longitude: benderData.location.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
        >
          <Marker
            coordinate={{
              latitude: benderData.location.latitude,
              longitude: benderData.location.longitude,
            }}
            title={benderData.title}
            description={benderData.location.address}
          />
        </MapView>
      </View>

      {/* JOIN/LEAVE BUTTON */}
      {!hasJoined && (
        <TouchableOpacity
          style={[styles.joinButton, updating && styles.buttonDisabled]}
          onPress={handleJoinBender}
          disabled={updating}
        >
          <Text style={styles.joinButtonText}>Join Bender</Text>
        </TouchableOpacity>
      )}

      {/* BEER COUNTER (only if joined) */}
      {hasJoined && (
        <View style={styles.beerCounterSection}>
          <Text style={styles.sectionTitle}>Your Beer Count</Text>
          <View style={styles.beerCounter}>
            <TouchableOpacity
              style={[styles.counterButton, updating && styles.buttonDisabled]}
              onPress={() => handleUpdateBeerCount(false)}
              disabled={updating || myBeerCount === 0}
            >
              <Text style={styles.counterButtonText}>-</Text>
            </TouchableOpacity>
            <View style={styles.beerCountDisplay}>
              <Text style={styles.beerEmoji}>🍺</Text>
              <Text style={styles.beerCount}>{myBeerCount}</Text>
            </View>
            <TouchableOpacity
              style={[styles.counterButton, updating && styles.buttonDisabled]}
              onPress={() => handleUpdateBeerCount(true)}
              disabled={updating}
            >
              <Text style={styles.counterButtonText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* PARTICIPANTS LIST */}
      <View style={styles.participantsSection}>
        <Text style={styles.sectionTitle}>
          Participants ({participantCount})
        </Text>
        {Object.entries(benderData.participants).map(([userId, participant]) => (
          <View key={userId} style={styles.participantCard}>
            <View style={styles.participantAvatar}>
              <Text style={styles.participantAvatarText}>
                {participantNames[userId]?.charAt(0).toUpperCase() || '?'}
              </Text>
            </View>
            <View style={styles.participantInfo}>
              <Text style={styles.participantName}>
                {participantNames[userId] || 'Loading...'}
                {userId === benderData.creatorId && (
                  <Text style={styles.creatorLabel}> (Creator)</Text>
                )}
                {userId === user.uid && <Text style={styles.youLabel}> (You)</Text>}
              </Text>
              <Text style={styles.participantBeerCount}>
                🍺 {participant.beerCount} {participant.beerCount === 1 ? 'beer' : 'beers'}
              </Text>
            </View>
          </View>
        ))}
      </View>

      {/* ACTION BUTTONS */}
      <View style={styles.actionsSection}>
        {hasJoined && !isCreator && (
          <TouchableOpacity
            style={[styles.leaveButton, updating && styles.buttonDisabled]}
            onPress={handleLeaveBender}
            disabled={updating}
          >
            <Text style={styles.leaveButtonText}>Leave Bender</Text>
          </TouchableOpacity>
        )}

        {isCreator && (
          <TouchableOpacity
            style={[styles.endButton, updating && styles.buttonDisabled]}
            onPress={handleEndBender}
            disabled={updating}
          >
            <Text style={styles.endButtonText}>End Bender</Text>
          </TouchableOpacity>
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
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
    flex: 1,
  },
  creatorBadge: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  creatorBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  location: {
    fontSize: 16,
    color: '#666',
    marginBottom: 5,
  },
  participants: {
    fontSize: 16,
    color: '#666',
  },
  mapContainer: {
    height: 200,
    backgroundColor: '#e0e0e0',
  },
  map: {
    flex: 1,
  },
  joinButton: {
    backgroundColor: '#34C759',
    margin: 20,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  joinButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  beerCounterSection: {
    backgroundColor: '#fff',
    padding: 20,
    marginVertical: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    color: '#333',
  },
  beerCounter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 30,
  },
  counterButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  counterButtonText: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '600',
  },
  beerCountDisplay: {
    alignItems: 'center',
  },
  beerEmoji: {
    fontSize: 60,
  },
  beerCount: {
    fontSize: 36,
    fontWeight: '700',
    color: '#000',
    marginTop: 5,
  },
  participantsSection: {
    backgroundColor: '#fff',
    padding: 20,
    marginVertical: 10,
  },
  participantCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  participantAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  participantAvatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  participantInfo: {
    flex: 1,
  },
  participantName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  creatorLabel: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '500',
  },
  youLabel: {
    color: '#34C759',
    fontSize: 14,
    fontWeight: '500',
  },
  participantBeerCount: {
    fontSize: 14,
    color: '#666',
  },
  actionsSection: {
    padding: 20,
  },
  leaveButton: {
    backgroundColor: '#FF3B30',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  leaveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  endButton: {
    backgroundColor: '#FF3B30',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  endButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  bottomSpacer: {
    height: 40,
  },
});

export default BenderDetailScreen;
