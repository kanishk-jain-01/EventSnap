import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MainTabNavigator } from './MainTabNavigator';
import { ChatScreen } from '../screens/main/ChatScreen';
import { StoryViewerScreen } from '../screens/main/StoryViewerScreen';
import { UserSearchScreen } from '../screens/main/UserSearchScreen';
import { UserProfileScreen } from '../screens/main/UserProfileScreen';
import { HostListScreen } from '../screens/main/HostListScreen';
import DocumentUploadScreen from '../screens/main/DocumentUploadScreen';
import DocumentViewerScreen from '../screens/main/DocumentViewerScreen';
import DocumentListScreen from '../screens/main/DocumentListScreen';
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

      {/* Host List Screen */}
      <MainStack.Screen
        name='HostList'
        component={HostListScreen}
        options={{
          presentation: 'card',
          headerShown: true,
          title: 'Event Hosts',
          headerStyle: { backgroundColor: '#1F1F1F' },
          headerTitleStyle: { color: '#FFFFFF' },
          headerTintColor: '#FFFC00',
        }}
      />

      {/* Document Upload Screen */}
      <MainStack.Screen
        name='DocumentUpload'
        component={DocumentUploadScreen}
        options={{
          presentation: 'card',
          headerShown: true,
          title: 'Upload Document',
          headerStyle: { backgroundColor: '#1F1F1F' },
          headerTitleStyle: { color: '#FFFFFF' },
          headerTintColor: '#FFFC00',
        }}
      />

      {/* Document List Screen */}
      <MainStack.Screen
        name='DocumentList'
        component={DocumentListScreen}
        options={{
          presentation: 'card',
          headerShown: false,
        }}
      />

      {/* Document Viewer Screen */}
      <MainStack.Screen
        name='DocumentViewer'
        component={DocumentViewerScreen}
        options={{
          presentation: 'fullScreenModal',
          headerShown: false,
          gestureEnabled: false,
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
