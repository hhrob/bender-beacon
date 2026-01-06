import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { BendersStackParamList } from '../types';
import ActiveBendersScreen from '../screens/benders/ActiveBendersScreen';
import BenderDetailScreen from '../screens/benders/BenderDetailScreen';

const Stack = createNativeStackNavigator<BendersStackParamList>();

const BendersNavigator: React.FC = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="ActiveBendersList"
        component={ActiveBendersScreen}
        options={{ title: 'Active Benders' }}
      />
      <Stack.Screen
        name="BenderDetail"
        component={BenderDetailScreen}
        options={{ title: 'Bender Details' }}
      />
    </Stack.Navigator>
  );
};

export default BendersNavigator;
