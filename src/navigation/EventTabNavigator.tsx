import React from 'react';
import { View, Text, SafeAreaView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { EventTabParamList } from './types';
import { EventFeedScreen } from '../screens/main/EventFeedScreen';
import { ProfileScreen } from '../screens/main/ProfileScreen';
import { useThemeColors } from '../components/ui/ThemeProvider';

// TODO: Import AssistantScreen when it's implemented in Phase 3.0
// import { AssistantScreen } from '../screens/ai/AssistantScreen';

const EventTab = createBottomTabNavigator<EventTabParamList>();

// Placeholder Assistant Screen for now
const PlaceholderAssistantScreen: React.FC = () => {
  const colors = useThemeColors();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bgPrimary }}>
      <StatusBar style='dark' />
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          padding: 24,
        }}
      >
        <View style={{ alignItems: 'center' }}>
          <Text
            style={{
              fontSize: 48,
              marginBottom: 16,
            }}
          >
            🤖
          </Text>
          <Text
            style={{
              color: colors.textPrimary,
              fontSize: 18,
              fontWeight: '600',
              marginBottom: 8,
            }}
          >
            AI Assistant
          </Text>
          <Text
            style={{
              color: colors.textSecondary,
              fontSize: 16,
              textAlign: 'center',
              lineHeight: 24,
            }}
          >
            Coming in Phase 3.0!{'\n'}
            Ask questions about event documents and get instant answers.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

export const EventTabNavigator: React.FC = () => {
  const colors = useThemeColors();

  return (
    <EventTab.Navigator
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
      <EventTab.Screen
        name='EventFeed'
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
      <EventTab.Screen
        name='Assistant'
        component={PlaceholderAssistantScreen}
        options={{
          tabBarLabel: 'Assistant',
          tabBarIcon: ({ focused, color }) => (
            <Text
              style={{
                fontSize: 20,
                color: color,
              }}
            >
              {focused ? '🤖' : '🤖'}
            </Text>
          ),
        }}
      />
      <EventTab.Screen
        name='Profile'
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ focused, color }) => (
            <Text
              style={{
                fontSize: 20,
                color: color,
              }}
            >
              {focused ? '👤' : '👤'}
            </Text>
          ),
        }}
      />
    </EventTab.Navigator>
  );
};
