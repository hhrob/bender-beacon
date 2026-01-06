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
} from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';
import * as Location from 'expo-location'; // For getting user location
import { useAuth } from '../../contexts/AuthContext';
import { getFriends } from '../../services/friends.service';
import { createBender } from '../../services/bender.service';
import { User, BenderLocation } from '../../types';
import { useNavigation } from '@react-navigation/native';

const CreateBenderScreen: React.FC = () => {
  const { user } = useAuth();
  const navigation = useNavigation();

  // STATE: Track all the data for this screen
  const [title, setTitle] = useState(''); // Bender title
  const [selectedLocation, setSelectedLocation] = useState<BenderLocation | null>(null); // GPS location
  const [friends, setFriends] = useState<User[]>([]); // All friends
  const [selectedFriends, setSelectedFriends] = useState<Set<string>>(new Set()); // Which friends are selected
  const [openInvite, setOpenInvite] = useState(false); // NEW: Open to all friends or selective invite
  const [loading, setLoading] = useState(false); // Loading spinner for create button
  const [loadingFriends, setLoadingFriends] = useState(true); // Loading friends
  const [loadingLocation, setLoadingLocation] = useState(true); // Loading user location

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
          editable={true} // FIXED: Always editable
          autoCapitalize="words"
        />
      </View>

      {/* SECTION 2: Location Picker (Map) */}
      <View style={styles.section}>
        <Text style={styles.label}>Select Location (Tap on Map)</Text>
        {loadingLocation ? (
          <View style={styles.mapLoadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Getting your location...</Text>
          </View>
        ) : (
          <>
            <MapView
              style={styles.map}
              region={region}
              onPress={handleMapPress}
              showsUserLocation={true} // NEW: Shows blue dot for user location
              showsMyLocationButton={true} // NEW: Button to center on user
              mapType="standard" // Options: standard, satellite, hybrid
            >
              {/* Show a marker if location is selected */}
              {selectedLocation && (
                <Marker
                  coordinate={{
                    latitude: selectedLocation.latitude,
                    longitude: selectedLocation.longitude,
                  }}
                  title="Bender Location"
                  pinColor="#FF3B30" // Red pin
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

      {/* SECTION 3: Open Invite Toggle */}
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

      {/* SECTION 4: Friend Selector (only show if NOT open invite) */}
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
                {/* Checkbox UI */}
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

      {/* SECTION 5: Create Button */}
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
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    color: '#000', // FIXED: Ensure text is visible
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
});

export default CreateBenderScreen;
