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
  /** ID of the event this snap belongs to; null if legacy/global */
  eventId?: string;
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
  /** ID of the event this story belongs to; null if legacy/global */
  eventId?: string;
}

export interface StoryState {
  stories: Story[];
  myStories: Story[];
  viewedStories: string[];
  isLoading: boolean;
  error: string | null;
}

// Chat Types
export type MessageStatus = 'sent' | 'delivered' | 'read';

export interface ChatMessage {
  id: string;
  senderId: string;
  recipientId: string;
  content: string;
  type: 'text' | 'image';
  timestamp: number | object; // Firebase serverTimestamp
  status: MessageStatus;
  readAt: number | object | null; // Firebase serverTimestamp
}

export interface ChatConversation {
  id: string;
  participants: string[];
  createdAt: number | object; // Firebase serverTimestamp
  lastMessage: string | null;
  lastMessageAt: number | object | null; // Firebase serverTimestamp
  unreadCount: {
    [userId: string]: number;
  };
}

export interface UserPresence {
  isOnline: boolean;
  lastSeen: number | object; // Firebase serverTimestamp
}

export interface ChatState {
  conversations: ChatConversation[];
  messages: { [chatId: string]: ChatMessage[] };
  activeChat: string | null;
  isLoading: boolean;
  error: string | null;
  isTyping: { [chatId: string]: boolean };
}

// Legacy types for backward compatibility
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
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
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

// Theme Types - Creative Light Theme
export interface Theme {
  colors: {
    // Primary Colors
    primary: string;
    primaryLight: string;
    primaryDark: string;

    // Accent Colors
    accent: string;
    accentLight: string;
    accentDark: string;

    // Semantic Colors
    success: string;
    successLight: string;
    successDark: string;
    warning: string;
    warningLight: string;
    warningDark: string;
    error: string;
    errorLight: string;
    errorDark: string;

    // Background & Surface
    bgPrimary: string;
    bgSecondary: string;
    surface: string;
    surfaceElevated: string;

    // Text Colors
    textPrimary: string;
    textSecondary: string;
    textTertiary: string;
    textInverse: string;

    // Border Colors
    border: string;
    borderStrong: string;
    divider: string;

    // Interactive States
    interactiveHover: string;
    interactivePressed: string;
    interactiveDisabled: string;

    // Special Purpose
    gradientStart: string;
    gradientEnd: string;
    shadow: string;
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
  shadows: {
    soft: string;
    medium: string;
    strong: string;
  };
}

// Event Types (Event-Driven Networking Pivot)

export type EventVisibility = 'public' | 'private';

export interface Event {
  /** Firestore auto-generated ID */
  id: string;
  /** Human-readable event name */
  name: string;
  /** Publicly listed or private (join-code) */
  visibility: EventVisibility;
  /** Optional 6-digit join code for private events */
  joinCode?: string | null;
  /** ISO start time */
  startTime: Date;
  /** ISO end time */
  endTime: Date;
  /** UID of the user that created the event */
  hostUid: string;
  /** Storage paths/URLs to uploaded PDF assets */
  assets: string[];
  /** Document creation timestamp */
  createdAt: Date;
}

export interface EventParticipant {
  uid: string;
  /** Participant role within the event */
  role: 'host' | 'guest';
  /** When the participant joined this event */
  joinedAt: Date;
}
