import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Switch,
  FlatList,
  Dimensions,
} from 'react-native';
import MapView, { Marker, Region, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { useAuth } from '../../contexts/AuthContext';
import { getFriends } from '../../services/friends.service';
import { createBender } from '../../services/bender.service';
import { User, BenderLocation } from '../../types';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.75;

// Custom dark map style - makes bars/locations stand out
const customMapStyle = [
  {
    "elementType": "geometry",
    "stylers": [{ "color": "#212121" }]
  },
  {
    "elementType": "labels.icon",
    "stylers": [{ "visibility": "off" }]
  },
  {
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#757575" }]
  },
  {
    "elementType": "labels.text.stroke",
    "stylers": [{ "color": "#212121" }]
  },
  {
    "featureType": "poi",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#757575" }]
  },
  {
    "featureType": "poi.park",
    "elementType": "geometry",
    "stylers": [{ "color": "#181818" }]
  },
  {
    "featureType": "road",
    "elementType": "geometry.fill",
    "stylers": [{ "color": "#2c2c2c" }]
  },
  {
    "featureType": "water",
    "elementType": "geometry",
    "stylers": [{ "color": "#000000" }]
  }
];

const CreateBenderScreen: React.FC = () => {
  const { user } = useAuth();
  const navigation = useNavigation();

  // STATE: Track all the data for this screen
  const [title, setTitle] = useState(''); // Bender title
  const [selectedLocation, setSelectedLocation] = useState<BenderLocation | null>(null); // GPS location
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null); // Track which card is selected
  const [friends, setFriends] = useState<User[]>([]); // All friends
  const [selectedFriends, setSelectedFriends] = useState<Set<string>>(new Set()); // Which friends are selected
  const [openInvite, setOpenInvite] = useState(false); // Open to all friends or selective invite
  const [loading, setLoading] = useState(false); // Loading spinner for create button
  const [loadingFriends, setLoadingFriends] = useState(true); // Loading friends
  const [loadingLocation, setLoadingLocation] = useState(true); // Loading user location

  // NEW: Mock data for top benders and recent benders (will be replaced with real data later)
  const [topBenders] = useState([
    { id: '1', name: 'The Dive Bar', distance: '0.3 mi', rating: 4.5, type: 'bar' },
    { id: '2', name: 'Lucky Strike', distance: '0.5 mi', rating: 4.8, type: 'bar' },
    { id: '3', name: 'Rooftop Lounge', distance: '0.7 mi', rating: 4.6, type: 'bar' },
    { id: '4', name: 'Irish Pub', distance: '0.9 mi', rating: 4.7, type: 'bar' },
    { id: '5', name: 'Sports Bar', distance: '1.1 mi', rating: 4.4, type: 'bar' },
  ]);

  const [recentBenders] = useState([
    { id: '1', title: 'Friday Night Crew', location: 'Downtown', attendees: 8, time: '2 hours ago' },
    { id: '2', title: 'Weekend Warriors', location: 'Midtown', attendees: 12, time: '5 hours ago' },
    { id: '3', title: 'Happy Hour Squad', location: 'Uptown', attendees: 6, time: '1 day ago' },
  ]);

  // MAP CONFIGURATION: Will be updated with user's location
  const [region, setRegion] = useState<Region>({
    latitude: 37.78825, // Default fallback
    longitude: -122.4324,
    latitudeDelta: 0.0122, // Zoomed in more
    longitudeDelta: 0.0121,
  });

  // LOAD USER'S LOCATION when screen opens
  useEffect(() => {
    getUserLocation();
    loadFriends();
  }, []);

  // NEW: Get user's current GPS location
  const getUserLocation = async () => {
    try {
      // Request permission to access location
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert(
          'Permission Denied',
          'We need location access to set your bender location. You can still select a location manually on the map.'
        );
        setLoadingLocation(false);
        return;
      }

      // Get current position
      const location = await Location.getCurrentPositionAsync({});

      // Update map region to user's location
      const newRegion = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.0122,
        longitudeDelta: 0.0121,
      };

      setRegion(newRegion);

      // Optionally auto-select user's current location
      // Uncomment the lines below if you want the user's location pre-selected:
      // setSelectedLocation({
      //   latitude: location.coords.latitude,
      //   longitude: location.coords.longitude,
      //   address: `${location.coords.latitude.toFixed(4)}, ${location.coords.longitude.toFixed(4)}`,
      // });

    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Error', 'Could not get your location. Please select manually on the map.');
    } finally {
      setLoadingLocation(false);
    }
  };

  const loadFriends = async () => {
    if (!user) return;
    try {
      const friendsData = await getFriends(user.uid);
      setFriends(friendsData);
    } catch (error: any) {
      Alert.alert('Error', 'Failed to load friends');
    } finally {
      setLoadingFriends(false);
    }
  };

  // HANDLE MAP TAP: When user taps the map, save that location
  const handleMapPress = (event: any) => {
    const coordinate = event.nativeEvent.coordinate;
    setSelectedLocation({
      latitude: coordinate.latitude,
      longitude: coordinate.longitude,
      address: `${coordinate.latitude.toFixed(4)}, ${coordinate.longitude.toFixed(4)}`,
    });
  };

  // NEW: Handle selecting a top bender (bar)
  const handleTopBenderSelect = (bender: any) => {
    // In a real app, you'd have actual coordinates for each bar
    // For now, set a mock location near the user
    setSelectedLocation({
      latitude: region.latitude + (Math.random() - 0.5) * 0.01,
      longitude: region.longitude + (Math.random() - 0.5) * 0.01,
      address: bender.name,
    });
    setSelectedCardId(`top-${bender.id}`);
  };

  // NEW: Handle selecting a recent bender
  const handleRecentBenderSelect = (bender: any) => {
    // Set location based on recent bender
    setSelectedLocation({
      latitude: region.latitude + (Math.random() - 0.5) * 0.02,
      longitude: region.longitude + (Math.random() - 0.5) * 0.02,
      address: `${bender.title} - ${bender.location}`,
    });
    setSelectedCardId(`recent-${bender.id}`);
  };

  // HANDLE FRIEND SELECTION: Toggle friend on/off
  const toggleFriendSelection = (friendId: string) => {
    const newSelection = new Set(selectedFriends);
    if (newSelection.has(friendId)) {
      newSelection.delete(friendId); // Uncheck
    } else {
      newSelection.add(friendId); // Check
    }
    setSelectedFriends(newSelection);
  };

  // HANDLE CREATE: Save the bender to Firebase
  const handleCreateBender = async () => {
    // VALIDATION: Make sure all fields are filled
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title for your bender');
      return;
    }

    if (!selectedLocation) {
      Alert.alert('Error', 'Please select a location on the map');
      return;
    }

    // Only require friend selection if NOT open invite
    if (!openInvite && selectedFriends.size === 0) {
      Alert.alert('Error', 'Please select at least one friend to invite, or enable "Open to All Friends"');
      return;
    }

    setLoading(true);
    try {
      // Determine which friends to invite
      let invitedFriends: string[];
      if (openInvite) {
        // If open invite, invite ALL friends
        invitedFriends = friends.map((f) => f.uid);
      } else {
        // If selective, only invite selected friends
        invitedFriends = Array.from(selectedFriends);
      }

      // CREATE THE BENDER in Firebase
      await createBender(
        user!.uid,
        title,
        selectedLocation,
        invitedFriends
      );

      const successMessage = openInvite
        ? `Bender created! All ${friends.length} of your friends have been invited.`
        : `Bender created! ${invitedFriends.length} friend(s) invited.`;

      Alert.alert('Success', successMessage, [
        {
          text: 'OK',
          onPress: () => {
            navigation.navigate('Home' as never); // Go back to home screen
          },
        },
      ]);

      // Reset the form
      setTitle('');
      setSelectedLocation(null);
      setSelectedFriends(new Set());
      setOpenInvite(false);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  // RENDER: Build the UI
  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      {/* SECTION 1: Title Input */}
      <View style={styles.section}>
        <Text style={styles.label}>Bender Title</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., Friday Night Bender"
          placeholderTextColor="#999"
          value={title}
          onChangeText={setTitle}
          editable={true}
          autoCapitalize="words"
        />
      </View>

      {/* SECTION 2: Top Benders Near You */}
      <View style={styles.sectionNoPadding}>
        <Text style={styles.sectionTitle}>🔥 Top Benders Near You</Text>
        <FlatList
          data={[...topBenders, ...topBenders]} // Duplicate for infinite loop effect
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item, index) => `top-${item.id}-${index}`}
          snapToInterval={CARD_WIDTH + 15}
          decelerationRate="fast"
          contentContainerStyle={styles.horizontalScrollContent}
          renderItem={({ item, index }) => {
            const isSelected = selectedCardId === `top-${item.id}`;
            return (
              <TouchableOpacity
                style={[styles.topBenderCard, isSelected && styles.selectedCard]}
                onPress={() => handleTopBenderSelect(item)}
                activeOpacity={0.9}
              >
                <View style={styles.topBenderHeader}>
                  <Text style={styles.topBenderName}>{item.name}</Text>
                  <View style={styles.ratingContainer}>
                    <Text style={styles.ratingText}>⭐ {item.rating}</Text>
                  </View>
                </View>
                <Text style={styles.topBenderDistance}>📍 {item.distance}</Text>
                <View style={styles.topBenderFooter}>
                  <Text style={styles.topBenderType}>{item.type.toUpperCase()}</Text>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* SECTION 3: Recent Benders */}
      <View style={styles.sectionNoPadding}>
        <Text style={styles.sectionTitle}>🕐 Recent Benders</Text>
        <Text style={[styles.helperText, { paddingHorizontal: 15 }]}>Sponsored opportunities - Tap to use location</Text>
        <FlatList
          data={[...recentBenders, ...recentBenders]} // Duplicate for infinite loop effect
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item, index) => `recent-${item.id}-${index}`}
          snapToInterval={CARD_WIDTH + 15}
          decelerationRate="fast"
          contentContainerStyle={styles.horizontalScrollContent}
          renderItem={({ item, index }) => {
            const isSelected = selectedCardId === `recent-${item.id}`;
            return (
              <TouchableOpacity
                style={[styles.recentBenderCard, isSelected && styles.selectedCard]}
                onPress={() => handleRecentBenderSelect(item)}
                activeOpacity={0.9}
              >
                <View style={styles.recentBenderContent}>
                  <Text style={styles.recentBenderTitle}>{item.title}</Text>
                  <Text style={styles.recentBenderLocation}>📍 {item.location}</Text>
                  <View style={styles.recentBenderStats}>
                    <Text style={styles.recentBenderStat}>👥 {item.attendees} people</Text>
                    <Text style={styles.recentBenderStat}>🕐 {item.time}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* SECTION 4: Open Invite Toggle */}
      <View style={styles.section}>
        <View style={styles.toggleRow}>
          <View style={styles.toggleInfo}>
            <Text style={styles.label}>Open to All Friends</Text>
            <Text style={styles.helperText}>
              {openInvite
                ? `All ${friends.length} friends will be invited`
                : 'Select specific friends to invite'}
            </Text>
          </View>
          <Switch
            value={openInvite}
            onValueChange={setOpenInvite}
            trackColor={{ false: '#ddd', true: '#007AFF' }}
            thumbColor="#fff"
          />
        </View>
      </View>

      {/* SECTION 5: Friend Selector (only show if NOT open invite) */}
      {!openInvite && (
        <View style={styles.section}>
          <Text style={styles.label}>Invite Friends</Text>
          {loadingFriends ? (
            <ActivityIndicator color="#007AFF" />
          ) : friends.length === 0 ? (
            <Text style={styles.emptyText}>No friends yet. Add some friends first!</Text>
          ) : (
            <>
              <Text style={styles.helperText}>
                {selectedFriends.size} friend{selectedFriends.size !== 1 ? 's' : ''} selected
              </Text>
              {friends.map((friend) => (
              <TouchableOpacity
                key={friend.uid}
                style={styles.friendItem}
                onPress={() => toggleFriendSelection(friend.uid)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.checkbox,
                    selectedFriends.has(friend.uid) && styles.checkboxSelected,
                  ]}
                >
                  {selectedFriends.has(friend.uid) && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </View>
                <Text style={styles.friendName}>{friend.displayName}</Text>
              </TouchableOpacity>
              ))}
            </>
          )}
        </View>
      )}

      {/* SECTION 6: Map (MOVED TO BOTTOM with custom style) */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🗺️ Or Select on Map</Text>
        <Text style={styles.helperText}>Showing bars and recent bender locations</Text>
        {loadingLocation ? (
          <View style={styles.mapLoadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Getting your location...</Text>
          </View>
        ) : (
          <>
            <MapView
              style={styles.map}
              provider={PROVIDER_GOOGLE}
              region={region}
              onPress={handleMapPress}
              showsUserLocation={true}
              showsMyLocationButton={true}
              customMapStyle={customMapStyle}
            >
              {/* Show selected location marker */}
              {selectedLocation && (
                <Marker
                  coordinate={{
                    latitude: selectedLocation.latitude,
                    longitude: selectedLocation.longitude,
                  }}
                  title="Bender Location"
                  description={selectedLocation.address}
                  pinColor="#FF3B30"
                />
              )}
            </MapView>
            {selectedLocation && (
              <View style={styles.locationInfoContainer}>
                <Text style={styles.locationText}>
                  📍 {selectedLocation.address}
                </Text>
              </View>
            )}
          </>
        )}
      </View>

      {/* SECTION 7: Create Button */}
      <TouchableOpacity
        style={[styles.createButton, loading && styles.buttonDisabled]}
        onPress={handleCreateBender}
        disabled={loading}
        activeOpacity={0.8}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.createButtonText}>🍺 Create Bender</Text>
        )}
      </TouchableOpacity>

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
};

// STYLES: Make it look good!
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  section: {
    padding: 15,
    backgroundColor: '#fff',
    marginBottom: 10,
  },
  label: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 10,
    color: '#000',
  },
  helperText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggleInfo: {
    flex: 1,
    marginRight: 12,
  },
  input: {
    borderWidth: 0,
    borderRadius: 12,
    padding: 15,
    fontSize: 17,
    backgroundColor: '#fff',
    color: '#000',
    fontWeight: '500',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  map: {
    height: 300,
    borderRadius: 12,
    overflow: 'hidden',
  },
  mapLoadingContainer: {
    height: 300,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
    fontSize: 14,
  },
  locationInfoContainer: {
    marginTop: 12,
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  locationText: {
    fontSize: 14,
    color: '#333',
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 6,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  checkmark: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  friendName: {
    fontSize: 16,
    color: '#000',
  },
  emptyText: {
    color: '#999',
    fontSize: 14,
    textAlign: 'center',
    marginVertical: 20,
  },
  createButton: {
    backgroundColor: '#007AFF',
    margin: 15,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
  bottomSpacer: {
    height: 40,
  },
  sectionNoPadding: {
    backgroundColor: '#f5f5f5',
    marginBottom: 10,
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
    color: '#000',
    paddingHorizontal: 15,
  },
  horizontalScrollContent: {
    paddingHorizontal: 15,
    paddingVertical: 5,
  },
  topBenderCard: {
    width: CARD_WIDTH,
    minHeight: 150,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  selectedCard: {
    borderWidth: 3,
    borderColor: '#007AFF',
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  topBenderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  topBenderName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
    flex: 1,
  },
  ratingContainer: {
    backgroundColor: '#FFD700',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  topBenderDistance: {
    fontSize: 15,
    color: '#666',
    marginBottom: 12,
  },
  topBenderFooter: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
  },
  topBenderType: {
    fontSize: 12,
    fontWeight: '600',
    color: '#007AFF',
    letterSpacing: 1,
  },
  recentBenderCard: {
    width: CARD_WIDTH,
    minHeight: 150,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  recentBenderContent: {
    flex: 1,
  },
  recentBenderTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    marginBottom: 8,
  },
  recentBenderLocation: {
    fontSize: 15,
    color: '#666',
    marginBottom: 12,
  },
  recentBenderStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  recentBenderStat: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
});

export default CreateBenderScreen;
