import React from 'react';
import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MainTabParamList } from '../types';
import { CameraScreen } from '../screens/main/CameraScreen';
import { useThemeColors } from '../components/ui/ThemeProvider';
import { useEventStore } from '../store/eventStore';

// Import the EventFeedScreen instead of HomeScreen
import { EventFeedScreen } from '../screens/main/EventFeedScreen';
import { ChatListScreen } from '../screens/main/ChatListScreen';
import { ProfileScreen } from '../screens/main/ProfileScreen';

const MainTab = createBottomTabNavigator<MainTabParamList>();

export const MainTabNavigator: React.FC = () => {
  const colors = useThemeColors();
  const { role } = useEventStore();

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
          tabBarIcon: ({ focused, color }) => (
            <Text
              style={{
                fontSize: 20,
                color: color,
              }}
            >
              {focused ? '📱' : '📱'}
            </Text>
          ),
        }}
      />
      {role === 'host' && (
        <MainTab.Screen
          name='Camera'
          component={CameraScreen}
          options={{
            tabBarLabel: 'Camera',
            tabBarIcon: ({ focused, color }) => (
              <Text
                style={{
                  fontSize: 20,
                  color: color,
                }}
              >
                {focused ? '📸' : '📸'}
              </Text>
            ),
          }}
        />
      )}

      {/* Chat tab - available to all roles */}
      <MainTab.Screen
        name='Chat'
        component={ChatListScreen}
        options={{
          tabBarLabel: 'Chat',
          tabBarIcon: ({ focused, color }) => (
            <Text
              style={{
                fontSize: 20,
                color: color,
              }}
            >
              {focused ? '💬' : '💬'}
            </Text>
          ),
        }}
      />

      <MainTab.Screen
        name='Profile'
        component={ProfileScreen}
        options={{
          tabBarLabel: role === 'host' ? 'Host Profile' : 'Profile',
          tabBarIcon: ({ focused, color }) => (
            <Text
              style={{
                fontSize: 20,
                color: color,
              }}
            >
              {role === 'host'
                ? focused
                  ? '👑'
                  : '👑'
                : focused
                  ? '👤'
                  : '👤'}
            </Text>
          ),
        }}
      />
    </MainTab.Navigator>
  );
};
