/**
 * Real-time Messaging Service
 *
 * Enhanced service for real-time message sending and receiving with status tracking,
 * typing indicators, and optimized performance for the Snapchat clone chat system.
 */

import {
  ref,
  push,
  onValue,
  off,
  serverTimestamp,
  query,
  orderByChild,
  limitToLast,
  get,
  set,
  remove,
  onDisconnect,
  update,
} from 'firebase/database';
import { realtimeDb } from '../firebase/config';
import type {
  ChatMessage,
  CreateMessagePayload,
  MessageStatus,
  TypingStatus,
} from './models';
import { DB_PATHS, CHAT_CONSTANTS } from './models';

/**
 * Enhanced Real-time Messaging Service
 */
export class MessagingService {
  private messageListeners: Map<string, () => void> = new Map();
  private typingListeners: Map<string, () => void> = new Map();
  private typingTimeouts: Map<string, NodeJS.Timeout> = new Map();
  private connectionRef = ref(realtimeDb, '.info/connected');
  private isConnected = false;

  constructor() {
    this.setupConnectionMonitoring();
  }

  /**
   * Setup connection monitoring for offline/online handling
   */
  private setupConnectionMonitoring(): void {
    onValue(this.connectionRef, snapshot => {
      this.isConnected = snapshot.val() === true;

      /* Connection status debug logging (uncomment for development)
      if (__DEV__) {
        console.debug('Realtime DB connection status:', this.isConnected);
      }
      */
    });
  }

  /**
   * Send a message with real-time status tracking
   */
  async sendMessage(
    chatId: string,
    senderId: string,
    payload: CreateMessagePayload,
  ): Promise<string> {
    try {
      // Validate message content
      this.validateMessage(payload);

      const messagesRef = ref(realtimeDb, DB_PATHS.MESSAGES(chatId));

      // Create optimistic message with sending status
      const optimisticMessage: Omit<ChatMessage, 'id'> = {
        senderId,
        recipientId: payload.recipientId,
        content: payload.content,
        type: payload.type,
        timestamp: serverTimestamp(),
        status: 'sending',
        readAt: null,
      };

      // Add metadata for image messages
      if (payload.type === 'image' && payload.metadata) {
        Object.assign(optimisticMessage, {
          width: payload.metadata.width,
          height: payload.metadata.height,
          fileSize: payload.metadata.fileSize,
          thumbnailUrl: payload.metadata.thumbnailUrl,
        });
      }

      // Push message to database
      const messageRef = await push(messagesRef, optimisticMessage);
      const messageId = messageRef.key!;

      // Update message status to sent
      await this.updateMessageStatus(chatId, messageId, 'sent');

      // Update conversation metadata
      await this.updateConversationOnNewMessage(
        chatId,
        senderId,
        payload.recipientId,
        payload.content,
        payload.type,
        messageId,
      );

      // Clear typing indicator for sender
      await this.setTypingStatus(chatId, senderId, false);

      return messageId;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error sending message:', error);
      throw new Error('Failed to send message');
    }
  }

  /**
   * Subscribe to messages in a chat with real-time updates
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
    const { limit = CHAT_CONSTANTS.MESSAGE_PAGINATION_LIMIT, onError } =
      options;

    const messagesRef = ref(realtimeDb, DB_PATHS.MESSAGES(chatId));
    const messagesQuery = query(
      messagesRef,
      orderByChild('timestamp'),
      limitToLast(limit),
    );

    // Handle pagination if startAfter is provided
    if (options.startAfter) {
      // In a real implementation, you'd use startAfter for pagination
      // For now, we'll use the basic query
    }

    const unsubscribe = onValue(
      messagesQuery,
      snapshot => {
        try {
          const _messages: ChatMessage[] = [];

          if (snapshot.exists()) {
            snapshot.forEach(childSnapshot => {
              const messageData = childSnapshot.val();
              const message: ChatMessage = {
                id: childSnapshot.key!,
                ...messageData,
              };
              _messages.push(message);
            });
          }

          // Sort messages by timestamp (oldest first for chat display)
          _messages.sort((a, b) => {
            const aTime = typeof a.timestamp === 'number' ? a.timestamp : 0;
            const bTime = typeof b.timestamp === 'number' ? b.timestamp : 0;
            return aTime - bTime;
          });

          callback(_messages);
        } catch (_error) {
          const err =
            _error instanceof Error ? _error : new Error('Unknown error');
          if (onError) {
            onError(err);
          } else {
            // eslint-disable-next-line no-console
            console.error('Error in message subscription:', err);
          }
        }
      },
      error => {
        const err = new Error(`Firebase subscription error: ${error.message}`);
        if (onError) {
          onError(err);
        } else {
          // eslint-disable-next-line no-console
          console.error('Firebase subscription error:', err);
        }
      },
    );

    // Store listener for cleanup
    const listenerId = `messages_${chatId}`;
    this.messageListeners.set(listenerId, () => {
      off(messagesQuery, 'value', unsubscribe);
    });

    return () => {
      const listener = this.messageListeners.get(listenerId);
      if (listener) {
        listener();
        this.messageListeners.delete(listenerId);
      }
    };
  }

  /**
   * Update message status (sent -> delivered -> read)
   */
  async updateMessageStatus(
    chatId: string,
    messageId: string,
    status: MessageStatus,
    userId?: string,
  ): Promise<void> {
    try {
      const messageRef = ref(
        realtimeDb,
        `${DB_PATHS.MESSAGES(chatId)}/${messageId}`,
      );
      const updates: any = { status };

      // Add readAt timestamp for read status
      if (status === 'read') {
        updates.readAt = serverTimestamp();
      }

      await update(messageRef, updates);

      // If message is read, update unread count
      if (status === 'read' && userId) {
        await this.decrementUnreadCount(chatId, userId);
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error updating message status:', error);
      throw new Error('Failed to update message status');
    }
  }

  /**
   * Mark multiple messages as read (batch operation)
   */
  async markMessagesAsRead(
    chatId: string,
    messageIds: string[],
    userId: string,
  ): Promise<void> {
    try {
      const updates: { [key: string]: any } = {};

      messageIds.forEach(messageId => {
        const messagePath = `${DB_PATHS.MESSAGES(chatId)}/${messageId}`;
        updates[`${messagePath}/status`] = 'read';
        updates[`${messagePath}/readAt`] = serverTimestamp();
      });

      await update(ref(realtimeDb), updates);

      // Reset unread count for user
      await this.resetUnreadCount(chatId, userId);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error marking messages as read:', error);
      throw new Error('Failed to mark messages as read');
    }
  }

  /**
   * Set typing status with automatic timeout
   */
  async setTypingStatus(
    chatId: string,
    userId: string,
    isTyping: boolean,
  ): Promise<void> {
    try {
      const typingRef = ref(realtimeDb, `${DB_PATHS.TYPING(chatId)}/${userId}`);

      if (isTyping) {
        const typingData: TypingStatus = {
          userId,
          isTyping: true,
          timestamp: serverTimestamp(),
        };

        await set(typingRef, typingData);

        // Clear any existing timeout
        const existingTimeout = this.typingTimeouts.get(`${chatId}_${userId}`);
        if (existingTimeout) {
          clearTimeout(existingTimeout);
        }

        // Set automatic timeout to clear typing status
        const timeout = setTimeout(async () => {
          try {
            await remove(typingRef);
            this.typingTimeouts.delete(`${chatId}_${userId}`);
          } catch (error) {
            // eslint-disable-next-line no-console
            console.error('Error clearing typing timeout:', error);
          }
        }, CHAT_CONSTANTS.TYPING_TIMEOUT);

        this.typingTimeouts.set(`${chatId}_${userId}`, timeout);

        // Setup disconnect handler to clear typing on disconnect
        onDisconnect(typingRef).remove();
      } else {
        await remove(typingRef);

        // Clear timeout
        const existingTimeout = this.typingTimeouts.get(`${chatId}_${userId}`);
        if (existingTimeout) {
          clearTimeout(existingTimeout);
          this.typingTimeouts.delete(`${chatId}_${userId}`);
        }
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error setting typing status:', error);
      throw new Error('Failed to update typing status');
    }
  }

  /**
   * Subscribe to typing indicators for a chat
   */
  subscribeToTyping(
    chatId: string,
    currentUserId: string,
    callback: (_typingUsers: string[]) => void,
  ): () => void {
    const typingRef = ref(realtimeDb, DB_PATHS.TYPING(chatId));

    const unsubscribe = onValue(typingRef, snapshot => {
      const _typingUsers: string[] = [];

      if (snapshot.exists()) {
        snapshot.forEach(childSnapshot => {
          const typingData = childSnapshot.val() as TypingStatus;
          const userId = childSnapshot.key!;

          // Only include other users (not current user)
          if (userId !== currentUserId && typingData.isTyping) {
            _typingUsers.push(userId);
          }
        });
      }

      callback(_typingUsers);
    });

    // Store listener for cleanup
    const listenerId = `typing_${chatId}`;
    this.typingListeners.set(listenerId, () => {
      off(typingRef, 'value', unsubscribe);
    });

    return () => {
      const listener = this.typingListeners.get(listenerId);
      if (listener) {
        listener();
        this.typingListeners.delete(listenerId);
      }
    };
  }

  /**
   * Delete a message (soft delete by setting deletedAt)
   */
  async deleteMessage(
    chatId: string,
    messageId: string,
    userId: string,
  ): Promise<void> {
    try {
      const messageRef = ref(
        realtimeDb,
        `${DB_PATHS.MESSAGES(chatId)}/${messageId}`,
      );
      const snapshot = await get(messageRef);

      if (!snapshot.exists()) {
        throw new Error('Message not found');
      }

      const message = snapshot.val() as ChatMessage;

      // Only allow sender to delete their own messages
      if (message.senderId !== userId) {
        throw new Error('You can only delete your own messages');
      }

      // Soft delete by setting deletedAt timestamp
      await update(messageRef, {
        deletedAt: serverTimestamp(),
        content: 'This message was deleted',
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error deleting message:', error);
      throw new Error('Failed to delete message');
    }
  }

  /**
   * Get message delivery status
   */
  async getMessageStatus(
    chatId: string,
    messageId: string,
  ): Promise<MessageStatus | null> {
    try {
      const messageRef = ref(
        realtimeDb,
        `${DB_PATHS.MESSAGES(chatId)}/${messageId}`,
      );
      const snapshot = await get(messageRef);

      if (snapshot.exists()) {
        const message = snapshot.val() as ChatMessage;
        return message.status;
      }

      return null;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error getting message status:', error);
      return null;
    }
  }

  /**
   * Get unread message count for a user in a conversation
   */
  async getUnreadCount(chatId: string, userId: string): Promise<number> {
    try {
      const unreadRef = ref(
        realtimeDb,
        `${DB_PATHS.CONVERSATION(chatId)}/unreadCount/${userId}`,
      );
      const snapshot = await get(unreadRef);
      return snapshot.exists() ? snapshot.val() : 0;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error getting unread count:', error);
      return 0;
    }
  }

  /**
   * Check connection status
   */
  isConnectedToDatabase(): boolean {
    return this.isConnected;
  }

  /**
   * Cleanup all listeners and timeouts
   */
  cleanup(): void {
    // Clean up message listeners
    this.messageListeners.forEach(cleanup => cleanup());
    this.messageListeners.clear();

    // Clean up typing listeners
    this.typingListeners.forEach(cleanup => cleanup());
    this.typingListeners.clear();

    // Clear all typing timeouts
    this.typingTimeouts.forEach(timeout => clearTimeout(timeout));
    this.typingTimeouts.clear();

    // Remove connection listener
    off(this.connectionRef);
  }

  // ===== PRIVATE HELPER METHODS =====

  /**
   * Validate message content before sending
   */
  private validateMessage(payload: CreateMessagePayload): void {
    if (!payload.content || payload.content.trim().length === 0) {
      throw new Error('Message content cannot be empty');
    }

    if (payload.content.length > CHAT_CONSTANTS.MAX_MESSAGE_LENGTH) {
      throw new Error(
        `Message too long. Maximum ${CHAT_CONSTANTS.MAX_MESSAGE_LENGTH} characters allowed`,
      );
    }

    if (payload.type === 'image') {
      if (!payload.content.startsWith('http')) {
        throw new Error('Image messages must contain a valid URL');
      }
    }
  }

  /**
   * Update conversation metadata when a new message is sent
   */
  private async updateConversationOnNewMessage(
    chatId: string,
    senderId: string,
    recipientId: string,
    content: string,
    type: 'text' | 'image',
    messageId: string,
  ): Promise<void> {
    try {
      const conversationRef = ref(realtimeDb, DB_PATHS.CONVERSATION(chatId));
      const displayContent = type === 'image' ? '📷 Photo' : content;

      const conversationUpdates = {
        lastMessage: {
          id: messageId,
          type,
          content: displayContent,
          senderId,
          timestamp: serverTimestamp(),
        },
        lastMessageAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        [`unreadCount/${recipientId}`]:
          (await this.getUnreadCount(chatId, recipientId)) + 1,
      };

      const userChatUpdates: { [key: string]: any } = {
        [`userChats/${senderId}/${chatId}/lastMessageAt`]: serverTimestamp(),
        [`userChats/${recipientId}/${chatId}/lastMessageAt`]: serverTimestamp(),
        [`userChats/${senderId}/${chatId}/lastMessageId`]: messageId,
        [`userChats/${recipientId}/${chatId}/lastMessageId`]: messageId,
      };

      // Update conversation document
      await update(conversationRef, conversationUpdates);

      // Fan-out to userChats index so listeners on that path fire
      await update(ref(realtimeDb), userChatUpdates);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error updating conversation metadata:', error);
    }
  }

  /**
   * Decrement unread count for a user
   */
  private async decrementUnreadCount(
    chatId: string,
    userId: string,
  ): Promise<void> {
    try {
      const currentCount = await this.getUnreadCount(chatId, userId);
      const newCount = Math.max(0, currentCount - 1);

      const unreadRef = ref(
        realtimeDb,
        `${DB_PATHS.CONVERSATION(chatId)}/unreadCount/${userId}`,
      );
      await set(unreadRef, newCount);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error decrementing unread count:', error);
    }
  }

  /**
   * Reset unread count to zero
   */
  private async resetUnreadCount(
    chatId: string,
    userId: string,
  ): Promise<void> {
    try {
      const unreadRef = ref(
        realtimeDb,
        `${DB_PATHS.CONVERSATION(chatId)}/unreadCount/${userId}`,
      );
      await set(unreadRef, 0);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error resetting unread count:', error);
    }
  }
}

// Export singleton instance
export const messagingService = new MessagingService();
export default messagingService;
