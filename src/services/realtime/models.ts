/**
 * Chat Data Models and Database Structure
 *
 * This file defines the data models and structure for the Firebase Realtime Database
 * chat functionality in the Snapchat clone app.
 */

// ===== CORE CHAT INTERFACES =====

/**
 * Base message interface for all message types
 */
export interface BaseChatMessage {
  id: string;
  senderId: string;
  recipientId: string;
  timestamp: number | object; // Firebase serverTimestamp
  status: MessageStatus;
  readAt: number | object | null;
  editedAt?: number | object | null;
  deletedAt?: number | object | null;
}

/**
 * Text message
 */
export interface TextMessage extends BaseChatMessage {
  type: 'text';
  content: string;
}

/**
 * Image message (for photos sent in chat)
 */
export interface ImageMessage extends BaseChatMessage {
  type: 'image';
  content: string; // Image URL
  thumbnailUrl?: string;
  width?: number;
  height?: number;
  fileSize?: number;
}

/**
 * System message (for chat events like user joined, etc.)
 */
export interface SystemMessage extends BaseChatMessage {
  type: 'system';
  content: string;
  systemType?: 'user_joined' | 'user_left' | 'chat_created' | 'message_deleted';
}

/**
 * Union type for all message types
 */
export type ChatMessage = TextMessage | ImageMessage | SystemMessage;

/**
 * Message status enum
 */
export type MessageStatus =
  | 'sending'
  | 'sent'
  | 'delivered'
  | 'read'
  | 'failed';

/**
 * Typing indicator status
 */
export interface TypingStatus {
  userId: string;
  isTyping: boolean;
  timestamp: number | object;
}

// ===== CONVERSATION INTERFACES =====

/**
 * Chat conversation metadata
 */
export interface ChatConversation {
  id: string;
  participants: string[]; // Array of user IDs (always 2 for direct messages)
  createdAt: number | object;
  updatedAt: number | object;
  lastMessage: LastMessageInfo | null;
  lastMessageAt: number | object | null;
  unreadCount: {
    [userId: string]: number;
  };
  isArchived: {
    [userId: string]: boolean;
  };
  isMuted: {
    [userId: string]: boolean;
  };
  conversationType: 'direct'; // Future: could support 'group'
}

/**
 * Last message info for conversation preview
 */
export interface LastMessageInfo {
  id: string;
  type: 'text' | 'image' | 'system';
  content: string; // For images: "📷 Photo", for system: event description
  senderId: string;
  timestamp: number | object;
}

// ===== USER PRESENCE INTERFACES =====

/**
 * User online/offline presence
 */
export interface UserPresence {
  isOnline: boolean;
  lastSeen: number | object;
  status?: 'available' | 'busy' | 'away' | 'invisible';
}

/**
 * Extended user info for chat context
 */
export interface ChatUser {
  uid: string;
  displayName: string;
  avatarUrl?: string;
  isOnline?: boolean;
  lastSeen?: number | object;
  status?: string;
}

// ===== DATABASE STRUCTURE INTERFACES =====

/**
 * Complete Firebase Realtime Database structure for chats
 */
export interface ChatDatabaseStructure {
  chats: {
    [chatId: string]: {
      participants: string[];
      createdAt: number | object;
      updatedAt: number | object;
      lastMessage: LastMessageInfo | null;
      lastMessageAt: number | object | null;
      unreadCount: {
        [userId: string]: number;
      };
      isArchived: {
        [userId: string]: boolean;
      };
      isMuted: {
        [userId: string]: boolean;
      };
      conversationType: 'direct';
      messages: {
        [messageId: string]: Omit<ChatMessage, 'id'>;
      };
      typing: {
        [userId: string]: TypingStatus;
      };
    };
  };
  userPresence: {
    [userId: string]: UserPresence;
  };
  userChats: {
    [userId: string]: {
      [chatId: string]: {
        lastReadMessageId?: string;
        lastReadTimestamp?: number | object;
        isArchived: boolean;
        isMuted: boolean;
        isPinned: boolean;
      };
    };
  };
}

// ===== UTILITY TYPES =====

/**
 * Message creation payload
 */
export interface CreateMessagePayload {
  recipientId: string;
  content: string;
  type: 'text' | 'image';
  metadata?: {
    width?: number;
    height?: number;
    fileSize?: number;
    thumbnailUrl?: string;
  };
}

/**
 * Conversation creation payload
 */
export interface CreateConversationPayload {
  participantIds: string[];
  initialMessage?: CreateMessagePayload;
}

/**
 * Message update payload
 */
export interface UpdateMessagePayload {
  content?: string;
  status?: MessageStatus;
  readAt?: number | object;
}

/**
 * Conversation settings update payload
 */
export interface UpdateConversationSettingsPayload {
  isArchived?: boolean;
  isMuted?: boolean;
  isPinned?: boolean;
}

// ===== QUERY INTERFACES =====

/**
 * Message query options
 */
export interface MessageQueryOptions {
  limit?: number;
  startAfter?: string; // Message ID for pagination
  endBefore?: string; // Message ID for pagination
  orderBy?: 'timestamp' | 'createdAt';
  orderDirection?: 'asc' | 'desc';
}

/**
 * Conversation query options
 */
export interface ConversationQueryOptions {
  includeArchived?: boolean;
  includeMuted?: boolean;
  limit?: number;
  orderBy?: 'lastMessageAt' | 'createdAt';
  orderDirection?: 'asc' | 'desc';
}

// ===== ERROR INTERFACES =====

/**
 * Chat-specific error types
 */
export interface ChatError {
  code:
    | 'PERMISSION_DENIED'
    | 'NOT_FOUND'
    | 'NETWORK_ERROR'
    | 'INVALID_DATA'
    | 'RATE_LIMITED';
  message: string;
  details?: any;
}

// ===== CONSTANTS =====

/**
 * Chat-related constants
 */
export const CHAT_CONSTANTS = {
  MAX_MESSAGE_LENGTH: 1000,
  MAX_MESSAGES_PER_CONVERSATION: 10000,
  MESSAGE_PAGINATION_LIMIT: 50,
  TYPING_TIMEOUT: 3000, // 3 seconds
  PRESENCE_TIMEOUT: 30000, // 30 seconds
  MAX_CONVERSATION_PARTICIPANTS: 2, // Direct messages only for now
  IMAGE_MESSAGE_MAX_SIZE: 5 * 1024 * 1024, // 5MB
  SUPPORTED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
} as const;

/**
 * Database paths for Firebase Realtime Database
 */
export const DB_PATHS = {
  CHATS: 'chats',
  USER_PRESENCE: 'userPresence',
  USER_CHATS: 'userChats',
  MESSAGES: (chatId: string) => `chats/${chatId}/messages`,
  TYPING: (chatId: string) => `chats/${chatId}/typing`,
  CONVERSATION: (chatId: string) => `chats/${chatId}`,
  USER_CHAT_SETTINGS: (userId: string, chatId: string) =>
    `userChats/${userId}/${chatId}`,
  USER_PRESENCE_STATUS: (userId: string) => `userPresence/${userId}`,
} as const;

// ===== VALIDATION SCHEMAS =====

/**
 * Message validation rules
 */
export const MESSAGE_VALIDATION = {
  content: {
    minLength: 1,
    maxLength: CHAT_CONSTANTS.MAX_MESSAGE_LENGTH,
  },
  type: {
    allowedValues: ['text', 'image', 'system'] as const,
  },
} as const;

/**
 * Conversation validation rules
 */
export const CONVERSATION_VALIDATION = {
  participants: {
    minCount: 2,
    maxCount: CHAT_CONSTANTS.MAX_CONVERSATION_PARTICIPANTS,
  },
} as const;
