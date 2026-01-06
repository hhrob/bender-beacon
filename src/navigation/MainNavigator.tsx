import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MainTabParamList } from '../types';
import BendersNavigator from './BendersNavigator';
import CreateBenderScreen from '../screens/benders/CreateBenderScreen';
import FriendsNavigator from './FriendsNavigator';
import ProfileScreen from '../screens/profile/ProfileScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();

const MainNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#8E8E93',
      }}
    >
      <Tab.Screen
        name="Home"
        component={BendersNavigator}
        options={{
          title: 'Benders',
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="CreateBender"
        component={CreateBenderScreen}
        options={{
          title: 'Create',
          headerTitle: 'Create Bender',
        }}
      />
      <Tab.Screen
        name="Friends"
        component={FriendsNavigator}
        options={{
          title: 'Friends',
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'Profile',
        }}
      />
    </Tab.Navigator>
  );
};

export default MainNavigator;
