import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MainTabParamList } from '../types';
import { CameraScreen } from '../screens/main/CameraScreen';
import { useThemeColors } from '../components/ui/ThemeProvider';

// Import the EventFeedScreen instead of HomeScreen
import { EventFeedScreen } from '../screens/main/EventFeedScreen';
import { ChatListScreen } from '../screens/main/ChatListScreen';
import { ProfileScreen } from '../screens/main/ProfileScreen';

const MainTab = createBottomTabNavigator<MainTabParamList>();

export const MainTabNavigator: React.FC = () => {
  const colors = useThemeColors();

  return (
    <MainTab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface, // Clean white background
          borderTopColor: colors.border, // Subtle border
          borderTopWidth: 1,
          // Add subtle shadow for depth
          shadowColor: colors.shadow,
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
          elevation: 8,
        },
        tabBarActiveTintColor: colors.primary, // Purple for active tabs
        tabBarInactiveTintColor: colors.textTertiary, // Light gray for inactive
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}
    >
      <MainTab.Screen
        name='Home'
        component={EventFeedScreen}
        options={{
          tabBarLabel: 'Feed',
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
