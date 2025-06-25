import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MainTabNavigator } from './MainTabNavigator';
import { RecipientSelectionScreen } from '../screens/main/RecipientSelectionScreen';
import { SnapViewerScreen } from '../screens/main/SnapViewerScreen';
import { ChatScreen } from '../screens/main/ChatScreen';
import { StoryViewerScreen } from '../screens/main/StoryViewerScreen';
import { UserSearchScreen } from '../screens/main/UserSearchScreen';
import { UserProfileScreen } from '../screens/main/UserProfileScreen';
import { MainStackParamList } from '../navigation/types';

const MainStack = createNativeStackNavigator<MainStackParamList>();

export const MainNavigator: React.FC = () => {
  return (
    <MainStack.Navigator
      screenOptions={{
        headerShown: false,
        presentation: 'modal',
      }}
    >
      {/* Main Tab Navigator (Home, Camera, Chat, Profile) */}
      <MainStack.Screen
        name='MainTabs'
        component={MainTabNavigator}
        options={{
          presentation: 'card', // Normal presentation for tabs
        }}
      />

      {/* Modal Screens */}
      <MainStack.Screen
        name='RecipientSelection'
        component={RecipientSelectionScreen}
        options={{
          presentation: 'modal',
          gestureEnabled: true,
        }}
      />

      <MainStack.Screen
        name='SnapViewer'
        component={SnapViewerScreen}
        options={{
          presentation: 'fullScreenModal',
          gestureEnabled: false, // Disable default gestures - we handle swipe down manually
          headerShown: false,
        }}
      />

      {/* Chat Screen */}
      <MainStack.Screen
        name='ChatScreen'
        component={ChatScreen}
        options={{
          presentation: 'card',
          gestureEnabled: true,
          headerShown: true,
          title: 'Chat',
          headerStyle: {
            backgroundColor: '#1F1F1F',
          },
          headerTitleStyle: {
            color: '#FFFFFF',
          },
          headerTintColor: '#FFFC00',
        }}
      />

      {/* Story Viewer */}
      <MainStack.Screen
        name='StoryViewer'
        component={StoryViewerScreen}
        options={{
          presentation: 'fullScreenModal',
          gestureEnabled: false,
          headerShown: false,
        }}
      />

      {/* User Search */}
      <MainStack.Screen
        name='UserSearch'
        component={UserSearchScreen}
        options={{
          presentation: 'card',
          headerShown: true,
          title: 'Find Friends',
          headerStyle: { backgroundColor: '#1F1F1F' },
          headerTitleStyle: { color: '#FFFFFF' },
          headerTintColor: '#FFFC00',
        }}
      />

      {/* View Other User Profile */}
      <MainStack.Screen
        name='UserProfile'
        component={UserProfileScreen}
        options={{
          presentation: 'card',
          headerShown: true,
          title: 'Profile',
          headerStyle: { backgroundColor: '#1F1F1F' },
          headerTitleStyle: { color: '#FFFFFF' },
          headerTintColor: '#FFFC00',
        }}
      />

      {/* Future modal screens will be added here */}
      {/* 
      <MainStack.Screen name="StoryViewer" component={StoryViewer} />
      <MainStack.Screen name="UserProfile" component={UserProfile} />
      */}
    </MainStack.Navigator>
  );
};
