import { NavigatorScreenParams } from '@react-navigation/native';
import { Story } from '../types';

// Root Stack Navigator
export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainStackParamList>;
  EventSelection: undefined;
  EventSetup: undefined;
};

// Authentication Stack
export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  AuthLoading: undefined;
  EventSelection: undefined;
  EventSetup: undefined;
};

// Main Stack Navigator (contains tabs and modal screens)
export type MainStackParamList = {
  MainTabs: NavigatorScreenParams<MainTabParamList>;
  StoryViewer: { stories: Story[]; initialIndex: number };
  UserProfile: { userId: string };
  UserSearch: undefined;
  HostList: undefined;
  DocumentUpload: undefined;
  DocumentViewer: { 
    documentId: string; 
    documentName: string; 
    documentUrl: string; 
    documentType: 'pdf' | 'image';
    // Optional citation highlighting parameters
    highlightText?: string;
    chunkIndex?: number;
  };
  DocumentList: undefined;
  EventManagement: undefined;
};

// Main Tab Navigator
export type MainTabParamList = {
  Home: undefined;
  Camera: undefined;
  Chat: undefined;
  Profile: undefined;
};

// Event Tab Navigator (for event-scoped navigation)
export type EventTabParamList = {
  EventFeed: undefined;
  Assistant: undefined;
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
