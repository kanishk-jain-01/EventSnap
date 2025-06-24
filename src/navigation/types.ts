import { NavigatorScreenParams } from '@react-navigation/native';
import { Story, Snap } from '../types';

// Root Stack Navigator
export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainStackParamList>;
};

// Authentication Stack
export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  AuthLoading: undefined;
};

// Main Stack Navigator (contains tabs and modal screens)
export type MainStackParamList = {
  MainTabs: NavigatorScreenParams<MainTabParamList>;
  ChatScreen: { chatId: string; recipientName: string; recipientId: string };
  StoryViewer: { stories: Story[]; initialIndex: number };
  SnapViewer: { snap: Snap };
  UserProfile: { userId: string };
  RecipientSelection: { imageUri: string };
};

// Main Tab Navigator
export type MainTabParamList = {
  Home: undefined;
  Camera: undefined;
  Chat: undefined;
  Profile: undefined;
};

// Declare global types for React Navigation
declare global {
  // eslint-disable-next-line no-unused-vars
  namespace ReactNavigation {
    // eslint-disable-next-line no-unused-vars
    interface RootParamList extends RootStackParamList {}
  }
}
