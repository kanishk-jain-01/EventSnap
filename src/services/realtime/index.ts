import {
  ref,
  onValue,
  off,
  serverTimestamp,
  get,
  set,
} from 'firebase/database';
import { realtimeDb } from '../firebase/config';
import type {
  ChatMessage,
  ChatConversation,
  UserPresence,
  CreateMessagePayload,
} from './models';
import { messagingService } from './messaging.service';

/**
 * Firebase Realtime Database Service for Chat Functionality
 * Handles real-time messaging, conversations, and user presence
 */
class RealtimeService {
  private messageListeners: Map<string, () => void> = new Map();
  private conversationListeners: Map<string, () => void> = new Map();
  private presenceListeners: Map<string, () => void> = new Map();

  /**
   * Send a message to a chat conversation (Enhanced with messaging service)
   */
  async sendMessage(
    chatId: string,
    senderId: string,
    recipientId: string,
    content: string,
    type: 'text' | 'image' = 'text',
    metadata?: {
      width?: number;
      height?: number;
      fileSize?: number;
      thumbnailUrl?: string;
    },
  ): Promise<string> {
    const payload: CreateMessagePayload = {
      recipientId,
      content,
      type,
      metadata,
    };

    return messagingService.sendMessage(chatId, senderId, payload);
  }

  /**
   * Send a message with full payload (for advanced usage)
   */
  async sendMessageWithPayload(
    chatId: string,
    senderId: string,
    payload: CreateMessagePayload,
  ): Promise<string> {
    return messagingService.sendMessage(chatId, senderId, payload);
  }

  /**
   * Create or get a chat conversation between two users
   */
  async createOrGetConversation(
    userId1: string,
    userId2: string,
  ): Promise<string> {
    try {
      // Create consistent chat ID regardless of user order
      const chatId = [userId1, userId2].sort().join('_');
      const chatRef = ref(realtimeDb, `chats/${chatId}`);

      // Check if conversation exists
      const snapshot = await get(chatRef);

      if (!snapshot.exists()) {
        // Create new conversation
        const conversation: Omit<ChatConversation, 'id'> = {
          participants: [userId1, userId2],
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          lastMessage: null,
          lastMessageAt: null,
          unreadCount: {
            [userId1]: 0,
            [userId2]: 0,
          },
          isArchived: {
            [userId1]: false,
            [userId2]: false,
          },
          isMuted: {
            [userId1]: false,
            [userId2]: false,
          },
          conversationType: 'direct',
        };

        await set(chatRef, conversation);
      }

      return chatId;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error creating/getting conversation:', error);
      throw new Error('Failed to create conversation');
    }
  }

  /**
   * Subscribe to messages in a chat conversation (Enhanced with messaging service)
   */
  subscribeToMessages(
    chatId: string,
    callback: (_messages: ChatMessage[]) => void,
    options: {
      limit?: number;
      startAfter?: string;
      onError?: (_error: Error) => void;
    } = {},
  ): () => void {
    return messagingService.subscribeToMessages(chatId, callback, options);
  }

  /**
   * Subscribe to typing indicators for a chat
   */
  subscribeToTyping(
    chatId: string,
    currentUserId: string,
    callback: (_typingUsers: string[]) => void,
  ): () => void {
    return messagingService.subscribeToTyping(chatId, currentUserId, callback);
  }

  /**
   * Set typing status for a user in a chat
   */
  async setTypingStatus(
    chatId: string,
    userId: string,
    isTyping: boolean,
  ): Promise<void> {
    return messagingService.setTypingStatus(chatId, userId, isTyping);
  }

  /**
   * Subscribe to user's conversations
   */
  subscribeToConversations(
    userId: string,
    callback: (_conversations: ChatConversation[]) => void,
  ): () => void {
    const chatsRef = ref(realtimeDb, 'chats');

    const unsubscribe = onValue(chatsRef, snapshot => {
      const conversations: ChatConversation[] = [];

      if (snapshot.exists()) {
        snapshot.forEach(childSnapshot => {
          const conversation = childSnapshot.val() as Omit<
            ChatConversation,
            'id'
          >;

          // Only include conversations where user is a participant
          if (
            conversation.participants &&
            conversation.participants.includes(userId)
          ) {
            conversations.push({
              id: childSnapshot.key!,
              ...conversation,
            });
          }
        });
      }

      // Sort by last message timestamp (newest first)
      conversations.sort((a, b) => {
        const aTime = typeof a.lastMessageAt === 'number' ? a.lastMessageAt : 0;
        const bTime = typeof b.lastMessageAt === 'number' ? b.lastMessageAt : 0;
        return bTime - aTime;
      });

      callback(conversations);
    });

    // Store listener for cleanup
    const listenerId = `conversations_${userId}`;
    this.conversationListeners.set(listenerId, () => {
      off(chatsRef, 'value', unsubscribe);
    });

    return () => {
      const listener = this.conversationListeners.get(listenerId);
      if (listener) {
        listener();
        this.conversationListeners.delete(listenerId);
      }
    };
  }

  /**
   * Mark message as read (Enhanced with messaging service)
   */
  async markMessageAsRead(
    chatId: string,
    messageId: string,
    userId: string,
  ): Promise<void> {
    return messagingService.updateMessageStatus(
      chatId,
      messageId,
      'read',
      userId,
    );
  }

  /**
   * Mark multiple messages as read (batch operation)
   */
  async markMessagesAsRead(
    chatId: string,
    messageIds: string[],
    userId: string,
  ): Promise<void> {
    return messagingService.markMessagesAsRead(chatId, messageIds, userId);
  }

  /**
   * Update message status (sent -> delivered -> read)
   */
  async updateMessageStatus(
    chatId: string,
    messageId: string,
    status: 'sending' | 'sent' | 'delivered' | 'read',
    userId?: string,
  ): Promise<void> {
    return messagingService.updateMessageStatus(
      chatId,
      messageId,
      status,
      userId,
    );
  }

  /**
   * Get message delivery status
   */
  async getMessageStatus(
    chatId: string,
    messageId: string,
  ): Promise<'sending' | 'sent' | 'delivered' | 'read' | null> {
    const status = await messagingService.getMessageStatus(chatId, messageId);
    // Filter out 'failed' status to match the interface
    return status === 'failed' ? 'sent' : status;
  }

  /**
   * Update user presence (online/offline)
   */
  async updateUserPresence(userId: string, isOnline: boolean): Promise<void> {
    try {
      const presenceRef = ref(realtimeDb, `userPresence/${userId}`);
      const presence: UserPresence = {
        isOnline,
        lastSeen: serverTimestamp(),
      };

      await set(presenceRef, presence);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error updating user presence:', error);
      throw new Error('Failed to update user presence');
    }
  }

  /**
   * Subscribe to user presence
   */
  subscribeToUserPresence(
    userId: string,
    callback: (_presence: UserPresence | null) => void,
  ): () => void {
    const presenceRef = ref(realtimeDb, `userPresence/${userId}`);

    const unsubscribe = onValue(presenceRef, snapshot => {
      if (snapshot.exists()) {
        callback(snapshot.val() as UserPresence);
      } else {
        callback(null);
      }
    });

    // Store listener for cleanup
    const listenerId = `presence_${userId}`;
    this.presenceListeners.set(listenerId, () => {
      off(presenceRef, 'value', unsubscribe);
    });

    return () => {
      const listener = this.presenceListeners.get(listenerId);
      if (listener) {
        listener();
        this.presenceListeners.delete(listenerId);
      }
    };
  }

  /**
   * Delete a message (Enhanced with messaging service)
   */
  async deleteMessage(
    chatId: string,
    messageId: string,
    userId: string,
  ): Promise<void> {
    return messagingService.deleteMessage(chatId, messageId, userId);
  }

  /**
   * Check if connected to Firebase Realtime Database
   */
  isConnected(): boolean {
    return messagingService.isConnectedToDatabase();
  }

  /**
   * Get conversation by ID
   */
  async getConversation(chatId: string): Promise<ChatConversation | null> {
    try {
      const chatRef = ref(realtimeDb, `chats/${chatId}`);
      const snapshot = await get(chatRef);

      if (snapshot.exists()) {
        return {
          id: chatId,
          ...snapshot.val(),
        } as ChatConversation;
      }

      return null;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error getting conversation:', error);
      throw new Error('Failed to get conversation');
    }
  }

  /**
   * Update conversation metadata when a new message is sent
   */
  private async updateConversationMetadata(
    chatId: string,
    senderId: string,
    recipientId: string,
    lastMessage: string,
    messageType: 'text' | 'image',
  ): Promise<void> {
    try {
      const chatRef = ref(realtimeDb, `chats/${chatId}`);
      const updates = {
        lastMessage: messageType === 'image' ? '📷 Photo' : lastMessage,
        lastMessageAt: serverTimestamp(),
        [`unreadCount/${recipientId}`]:
          (await this.getUnreadCount(chatId, recipientId)) + 1,
      };

      await set(chatRef, updates);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error updating conversation metadata:', error);
    }
  }

  /**
   * Get unread message count for a user in a conversation (Enhanced with messaging service)
   */
  async getUnreadCount(chatId: string, userId: string): Promise<number> {
    return messagingService.getUnreadCount(chatId, userId);
  }

  /**
   * Reset unread count for a user in a conversation
   */
  async resetUnreadCount(chatId: string, userId: string): Promise<void> {
    try {
      const unreadRef = ref(
        realtimeDb,
        `chats/${chatId}/unreadCount/${userId}`,
      );
      await set(unreadRef, 0);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error resetting unread count:', error);
      throw new Error('Failed to reset unread count');
    }
  }

  /**
   * Clean up all active listeners
   */
  cleanup(): void {
    // Clean up messaging service
    messagingService.cleanup();

    // Clean up message listeners
    this.messageListeners.forEach(cleanup => cleanup());
    this.messageListeners.clear();

    // Clean up conversation listeners
    this.conversationListeners.forEach(cleanup => cleanup());
    this.conversationListeners.clear();

    // Clean up presence listeners
    this.presenceListeners.forEach(cleanup => cleanup());
    this.presenceListeners.clear();
  }
}

// Export singleton instance
export const realtimeService = new RealtimeService();
export default realtimeService;
