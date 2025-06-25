import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MainTabParamList } from '../types';
import { CameraScreen } from '../screens/main/CameraScreen';

// Import the HomeScreen from the screens directory
import { HomeScreen } from '../screens/main/HomeScreen';
import { ChatListScreen } from '../screens/main/ChatListScreen';
import { ProfileScreen } from '../screens/main/ProfileScreen';

const MainTab = createBottomTabNavigator<MainTabParamList>();

export const MainTabNavigator: React.FC = () => {
  return (
    <MainTab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#1F1F1F', // snap-gray
          borderTopColor: '#3A3A3A', // snap-light-gray
          borderTopWidth: 1,
        },
        tabBarActiveTintColor: '#FFFC00', // snap-yellow
        tabBarInactiveTintColor: '#9CA3AF', // gray-400
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}
    >
      <MainTab.Screen
        name='Home'
        component={HomeScreen}
        options={{
          tabBarLabel: 'Stories',
        }}
      />
      <MainTab.Screen
        name='Camera'
        component={CameraScreen}
        options={{
          tabBarLabel: 'Camera',
        }}
      />
      <MainTab.Screen
        name='Chat'
        component={ChatListScreen}
        options={{
          tabBarLabel: 'Chat',
        }}
      />
      <MainTab.Screen
        name='Profile'
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
        }}
      />
    </MainTab.Navigator>
  );
};
