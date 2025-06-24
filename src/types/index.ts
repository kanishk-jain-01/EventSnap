// Core User Types
export interface User {
  uid: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  createdAt: Date;
  lastSeen?: Date;
}

// Authentication Types
export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// Snap Types
export interface Snap {
  id: string;
  senderId: string;
  receiverId: string;
  imageUrl: string;
  timestamp: Date;
  expiresAt: Date;
  viewed: boolean;
  viewedAt?: Date;
}

export interface SnapState {
  receivedSnaps: Snap[];
  sentSnaps: Snap[];
  isLoading: boolean;
  error: string | null;
}

// Story Types
export interface Story {
  id: string;
  userId: string;
  imageUrl: string;
  timestamp: Date;
  expiresAt: Date;
  viewedBy: string[];
}

export interface StoryState {
  stories: Story[];
  myStories: Story[];
  viewedStories: string[];
  isLoading: boolean;
  error: string | null;
}

// Chat Types
export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  text: string;
  timestamp: Date;
  status: 'sent' | 'delivered' | 'read';
}

export interface Conversation {
  id: string;
  participants: string[];
  lastMessage?: Message;
  lastMessageAt?: Date;
  unreadCount: number;
}

export interface ChatState {
  conversations: Conversation[];
  messages: { [chatId: string]: Message[] };
  activeChat: string | null;
  isLoading: boolean;
  error: string | null;
}

// Navigation Types
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  AuthLoading: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Camera: undefined;
  Chat: undefined;
  Profile: undefined;
};

export type MainStackParamList = {
  MainTabs: undefined;
  ChatScreen: { chatId: string; recipientName: string };
  StoryViewer: { stories: Story[]; initialIndex: number };
  SnapViewer: { snap: Snap };
  UserProfile: { userId: string };
  RecipientSelection: { imageUri: string };
};

// Camera Types
export interface CameraState {
  hasPermission: boolean;
  isLoading: boolean;
  capturedImage: string | null;
  error: string | null;
}

// Firebase Service Types
export interface FirebaseError {
  code: string;
  message: string;
}

// Utility Types
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  success: boolean;
}

// Component Props Types
export interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
}

export interface InputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (_text: string) => void;
  secureTextEntry?: boolean;
  error?: string;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  maxLength?: number;
}

export interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  color?: string;
  text?: string;
  overlay?: boolean;
}

export interface ModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  showCloseButton?: boolean;
  animationType?: 'none' | 'slide' | 'fade';
  transparent?: boolean;
}

// Theme Types
export interface Theme {
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
    error: string;
    success: string;
    warning: string;
    // Snapchat specific colors
    snapYellow: string;
    snapDark: string;
    snapGray: string;
    snapLightGray: string;
  };
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  borderRadius: {
    sm: number;
    md: number;
    lg: number;
    full: number;
  };
}
