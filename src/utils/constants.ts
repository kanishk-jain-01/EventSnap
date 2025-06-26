// App Configuration
export const APP_CONFIG = {
  name: 'Snapchat Clone',
  version: '1.0.0',
  environment: __DEV__ ? 'development' : 'production',
} as const;

// Firebase Collections
export const COLLECTIONS = {
  USERS: 'users',
  SNAPS: 'snaps',
  STORIES: 'stories',
  CONVERSATIONS: 'conversations',
  MESSAGES: 'messages',
} as const;

// Firebase Storage Paths
export const STORAGE_PATHS = {
  SNAPS: 'snaps',
  STORIES: 'stories',
  AVATARS: 'avatars',
  TEMP: 'temp',
} as const;

// Realtime Database Paths
export const REALTIME_PATHS = {
  CHATS: 'chats',
  USER_STATUS: 'userStatus',
  TYPING: 'typing',
} as const;

// Time Constants (in milliseconds)
export const TIME_CONSTANTS = {
  SNAP_DURATION: 24 * 60 * 60 * 1000, // 24 hours
  STORY_DURATION: 24 * 60 * 60 * 1000, // 24 hours
  TYPING_TIMEOUT: 3000, // 3 seconds
  MESSAGE_RETRY_DELAY: 1000, // 1 second
  CLEANUP_INTERVAL: 60 * 60 * 1000, // 1 hour
} as const;

// Image Configuration
export const IMAGE_CONFIG = {
  MAX_SIZE: 1024 * 1024, // 1MB
  QUALITY: 0.8,
  MAX_WIDTH: 1080,
  MAX_HEIGHT: 1920,
  THUMBNAIL_SIZE: 200,
} as const;

// Camera Configuration
export const CAMERA_CONFIG = {
  ASPECT_RATIO: '16:9',
  VIDEO_QUALITY: '720p',
  FLASH_MODE: 'auto',
} as const;

// UI Constants
export const UI_CONSTANTS = {
  HEADER_HEIGHT: 60,
  TAB_BAR_HEIGHT: 80,
  SNAP_VIEWER_DURATION: 10000, // 10 seconds
  STORY_VIEWER_DURATION: 5000, // 5 seconds
  ANIMATION_DURATION: 300,
} as const;

// Validation Rules
export const VALIDATION = {
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  MIN_PASSWORD_LENGTH: 6,
  MAX_DISPLAY_NAME_LENGTH: 30,
  MAX_MESSAGE_LENGTH: 500,
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  // Authentication
  AUTH_INVALID_EMAIL: 'Please enter a valid email address',
  AUTH_WEAK_PASSWORD: 'Password must be at least 6 characters long',
  AUTH_USER_NOT_FOUND: 'No account found with this email',
  AUTH_WRONG_PASSWORD: 'Incorrect password',
  AUTH_EMAIL_IN_USE: 'An account with this email already exists',
  AUTH_NETWORK_ERROR: 'Network error. Please check your connection',

  // Camera
  CAMERA_PERMISSION_DENIED: 'Camera permission is required to take photos',
  CAMERA_NOT_AVAILABLE: 'Camera is not available on this device',

  // Image Upload
  IMAGE_UPLOAD_FAILED: 'Failed to upload image. Please try again',
  IMAGE_TOO_LARGE: 'Image is too large. Please choose a smaller image',

  // Messaging
  MESSAGE_SEND_FAILED: 'Failed to send message. Please try again',
  MESSAGE_TOO_LONG: 'Message is too long. Please keep it under 500 characters',

  // General
  NETWORK_ERROR: 'Network error. Please check your connection',
  UNKNOWN_ERROR: 'Something went wrong. Please try again',
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  ACCOUNT_CREATED: 'Account created successfully!',
  SNAP_SENT: 'Snap sent successfully!',
  STORY_POSTED: 'Story posted successfully!',
  MESSAGE_SENT: 'Message sent!',
  PROFILE_UPDATED: 'Profile updated successfully!',
} as const;

// Theme Colors (matching TailwindCSS config) - Creative Light Theme
export const COLORS = {
  // Primary Colors
  PRIMARY: '#7C3AED',
  PRIMARY_LIGHT: '#A855F7',
  PRIMARY_DARK: '#6D28D9',

  // Accent Colors
  ACCENT: '#EC4899',
  ACCENT_LIGHT: '#F472B6',
  ACCENT_DARK: '#DB2777',

  // Semantic Colors
  SUCCESS: '#10B981',
  SUCCESS_LIGHT: '#34D399',
  SUCCESS_DARK: '#059669',

  WARNING: '#F59E0B',
  WARNING_LIGHT: '#FBBF24',
  WARNING_DARK: '#D97706',

  ERROR: '#EF4444',
  ERROR_LIGHT: '#F87171',
  ERROR_DARK: '#DC2626',

  // Background & Surface
  BG_PRIMARY: '#FAFAFA',
  BG_SECONDARY: '#F8FAFC',
  SURFACE: '#FFFFFF',

  // Text Colors
  TEXT_PRIMARY: '#1E293B',
  TEXT_SECONDARY: '#64748B',
  TEXT_TERTIARY: '#94A3B8',
  TEXT_INVERSE: '#FFFFFF',

  // Border Colors
  BORDER: '#E2E8F0',
  BORDER_STRONG: '#CBD5E1',

  // Legacy colors for backward compatibility (will be removed in Task 4.4)
  SNAP_YELLOW: '#7C3AED', // Mapped to primary for now
  SNAP_DARK: '#1E293B', // Mapped to text primary
  SNAP_WHITE: '#FFFFFF', // Keep white
} as const;

// Screen Names for Navigation
export const SCREEN_NAMES = {
  // Auth Stack
  LOGIN: 'Login',
  REGISTER: 'Register',
  AUTH_LOADING: 'AuthLoading',

  // Main Tabs
  HOME: 'Home',
  CAMERA: 'Camera',
  CHAT: 'Chat',
  PROFILE: 'Profile',

  // Main Stack
  MAIN_TABS: 'MainTabs',
  CHAT_SCREEN: 'ChatScreen',
  STORY_VIEWER: 'StoryViewer',
  SNAP_VIEWER: 'SnapViewer',
  USER_PROFILE: 'UserProfile',
} as const;

// Platform specific constants
export const PLATFORM_CONSTANTS = {
  IS_IOS: require('react-native').Platform.OS === 'ios',
  IS_ANDROID: require('react-native').Platform.OS === 'android',
  STATUS_BAR_HEIGHT: require('react-native').Platform.OS === 'ios' ? 44 : 24,
} as const;
