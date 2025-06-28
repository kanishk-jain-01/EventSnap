import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../services/firebase/config';
import type {
  ChatMessage,
  ChatConversation,
  UserPresence,
  ChatUser,
  CreateMessagePayload,
  UpdateConversationSettingsPayload,
  MessageQueryOptions,
} from '../services/realtime/models';
import { realtimeService } from '../services/realtime';
import { useAuthStore } from './authStore';
import { useEventStore } from './eventStore';

// ===== AI CHAT INTERFACES =====

interface AIMessage {
  id: string;
  question: string;
  answer: string;
  citations: Citation[];
  timestamp: number;
  isLoading?: boolean;
  error?: string;
}

interface Citation {
  documentId: string;
  documentName: string;
  chunkIndex: number;
  excerpt: string;
  storagePath: string;
}

interface RagAnswerRequest {
  eventId: string;
  userId: string;
  question: string;
}

interface RagAnswerResponse {
  text: string;
  citations: Citation[];
}

// ===== STORE INTERFACES =====

interface ChatState {
  // Conversations
  conversations: ChatConversation[];
  activeConversationId: string | null;

  // Messages
  messages: { [chatId: string]: ChatMessage[] };

  // AI Chat
  aiMessages: AIMessage[];
  isLoadingAI: boolean;
  aiError: string | null;

  // Typing indicators
  typingUsers: { [chatId: string]: string[] }; // Array of user IDs who are typing

  // User presence
  userPresence: { [userId: string]: UserPresence };

  // UI State
  isLoading: boolean;
  isLoadingMessages: { [chatId: string]: boolean };
  error: string | null;
  isConnected: boolean;

  // Pagination
  messagesPagination: {
    [chatId: string]: {
      hasMore: boolean;
      lastMessageId?: string;
      isLoadingMore: boolean;
    };
  };
}

interface ChatActions {
  // Conversation actions
  loadConversations: (_userId: string) => Promise<void>;
  createConversation: (_userId1: string, _userId2: string) => Promise<string>;
  setActiveConversation: (_chatId: string | null) => void;
  updateConversationSettings: (
    _chatId: string,
    _userId: string,
    _settings: UpdateConversationSettingsPayload,
  ) => Promise<void>;

  // Message actions
  sendMessage: (
    _chatId: string,
    _senderId: string,
    _payload: CreateMessagePayload,
  ) => Promise<string>;
  loadMessages: (
    _chatId: string,
    _options?: MessageQueryOptions,
  ) => Promise<void>;
  loadMoreMessages: (_chatId: string) => Promise<void>;
  markMessageAsRead: (
    _chatId: string,
    _messageId: string,
    _userId: string,
  ) => Promise<void>;
  markMessagesAsRead: (
    _chatId: string,
    _messageIds: string[],
    _userId: string,
  ) => Promise<void>;
  updateMessageStatus: (
    _chatId: string,
    _messageId: string,
    _status: 'sending' | 'sent' | 'delivered' | 'read',
    _userId?: string,
  ) => Promise<void>;
  deleteMessage: (
    _chatId: string,
    _messageId: string,
    _userId: string,
  ) => Promise<void>;
  getUnreadCount: (_chatId: string, _userId: string) => Promise<number>;

  // AI Chat actions
  sendAIQuery: (_question: string) => Promise<void>;
  clearAIError: () => void;
  clearAIMessages: () => void;

  // Typing actions
  setTyping: (
    _chatId: string,
    _userId: string,
    _isTyping: boolean,
  ) => Promise<void>;

  // Presence actions
  updateUserPresence: (_userId: string, _isOnline: boolean) => Promise<void>;
  subscribeToUserPresence: (_userId: string) => () => void;

  // Utility actions
  resetUnreadCount: (_chatId: string, _userId: string) => Promise<void>;
  getConversationWithUser: (
    _currentUserId: string,
    _otherUserId: string,
  ) => ChatConversation | null;
  getChatUser: (_userId: string, _users: ChatUser[]) => ChatUser | null;
  checkConnectionStatus: () => boolean;

  // Cleanup
  cleanup: () => void;
  clearError: () => void;
}

type ChatStore = ChatState & ChatActions;

// ===== STORE IMPLEMENTATION =====

export const useChatStore = create<ChatStore>()(
  subscribeWithSelector((set, get) => ({
    // ===== INITIAL STATE =====
    conversations: [],
    activeConversationId: null,
    messages: {},
    aiMessages: [],
    isLoadingAI: false,
    aiError: null,
    typingUsers: {},
    userPresence: {},
    isLoading: false,
    isLoadingMessages: {},
    error: null,
    isConnected: true,
    messagesPagination: {},

    // ===== CONVERSATION ACTIONS =====

    loadConversations: async (userId: string) => {
      set({ isLoading: true, error: null });

      try {
        // Subscribe to conversations
        realtimeService.subscribeToConversations(userId, conversations => {
          set({ conversations, isLoading: false });
        });
      } catch (error) {
        console.error('ChatStore: Error in loadConversations:', error);
        set({
          error:
            error instanceof Error
              ? error.message
              : 'Failed to load conversations',
          isLoading: false,
        });
      }
    },

    createConversation: async (userId1: string, userId2: string) => {
      set({ error: null });

      try {
        const chatId = await realtimeService.createOrGetConversation(
          userId1,
          userId2,
        );
        return chatId;
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'Failed to create conversation';
        set({ error: errorMessage });
        throw new Error(errorMessage);
      }
    },

    setActiveConversation: (chatId: string | null) => {
      set({ activeConversationId: chatId });
    },

    updateConversationSettings: async (
      chatId: string,
      userId: string,
      settings: UpdateConversationSettingsPayload,
    ) => {
      set({ error: null });

      try {
        // Update local state optimistically
        const { conversations } = get();
        const updatedConversations = conversations.map(conv => {
          if (conv.id === chatId) {
            return {
              ...conv,
              ...(settings.isArchived !== undefined && {
                isArchived: {
                  ...conv.isArchived,
                  [userId]: settings.isArchived,
                },
              }),
              ...(settings.isMuted !== undefined && {
                isMuted: { ...conv.isMuted, [userId]: settings.isMuted },
              }),
            };
          }
          return conv;
        });

        set({ conversations: updatedConversations });

        // Note: In a real implementation, you'd call a service method to persist these settings
        // For now, we're just updating the local state
      } catch (error) {
        set({
          error:
            error instanceof Error
              ? error.message
              : 'Failed to update conversation settings',
        });
      }
    },

    // ===== MESSAGE ACTIONS =====

    sendMessage: async (
      chatId: string,
      senderId: string,
      payload: CreateMessagePayload,
    ) => {
      set({ error: null });

      try {
        if (!senderId) {
          throw new Error('User not authenticated');
        }

        const messageId = await realtimeService.sendMessageWithPayload(
          chatId,
          senderId,
          payload,
        );

        return messageId;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to send message';
        set({ error: errorMessage });
        throw new Error(errorMessage);
      }
    },

    loadMessages: async (chatId: string, options?: MessageQueryOptions) => {
      set(state => ({
        isLoadingMessages: { ...state.isLoadingMessages, [chatId]: true },
        error: null,
      }));

      try {
        const limit = options?.limit || 50;

        // Subscribe to messages
        realtimeService.subscribeToMessages(
          chatId,
          messages => {
            set(state => ({
              messages: { ...state.messages, [chatId]: messages },
              isLoadingMessages: {
                ...state.isLoadingMessages,
                [chatId]: false,
              },
              messagesPagination: {
                ...state.messagesPagination,
                [chatId]: {
                  hasMore: messages.length >= limit,
                  lastMessageId: messages[0]?.id,
                  isLoadingMore: false,
                },
              },
            }));
          },
          { limit },
        );
      } catch (error) {
        set(state => ({
          error:
            error instanceof Error ? error.message : 'Failed to load messages',
          isLoadingMessages: { ...state.isLoadingMessages, [chatId]: false },
        }));
      }
    },

    loadMoreMessages: async (chatId: string) => {
      const { messagesPagination } = get();
      const pagination = messagesPagination[chatId];

      if (!pagination?.hasMore || pagination.isLoadingMore) {
        return;
      }

      set(state => ({
        messagesPagination: {
          ...state.messagesPagination,
          [chatId]: { ...pagination, isLoadingMore: true },
        },
      }));

      try {
        // In a real implementation, you'd load more messages here
        // For now, we'll just update the loading state
        set(state => ({
          messagesPagination: {
            ...state.messagesPagination,
            [chatId]: { ...pagination, isLoadingMore: false },
          },
        }));
      } catch (error) {
        set(state => ({
          error:
            error instanceof Error
              ? error.message
              : 'Failed to load more messages',
          messagesPagination: {
            ...state.messagesPagination,
            [chatId]: { ...pagination, isLoadingMore: false },
          },
        }));
      }
    },

    markMessageAsRead: async (
      chatId: string,
      messageId: string,
      userId: string,
    ) => {
      try {
        await realtimeService.markMessageAsRead(chatId, messageId, userId);
      } catch (error) {
        set({
          error:
            error instanceof Error
              ? error.message
              : 'Failed to mark message as read',
        });
      }
    },

    deleteMessage: async (
      chatId: string,
      messageId: string,
      userId: string,
    ) => {
      try {
        await realtimeService.deleteMessage(chatId, messageId, userId);
      } catch (error) {
        set({
          error:
            error instanceof Error ? error.message : 'Failed to delete message',
        });
      }
    },

    markMessagesAsRead: async (
      chatId: string,
      messageIds: string[],
      userId: string,
    ) => {
      try {
        await realtimeService.markMessagesAsRead(chatId, messageIds, userId);
      } catch (error) {
        set({
          error:
            error instanceof Error
              ? error.message
              : 'Failed to mark messages as read',
        });
      }
    },

    updateMessageStatus: async (
      chatId: string,
      messageId: string,
      status: 'sending' | 'sent' | 'delivered' | 'read',
      userId?: string,
    ) => {
      try {
        await realtimeService.updateMessageStatus(
          chatId,
          messageId,
          status,
          userId,
        );
      } catch (error) {
        set({
          error:
            error instanceof Error
              ? error.message
              : 'Failed to update message status',
        });
      }
    },

    getUnreadCount: async (chatId: string, userId: string) => {
      try {
        return await realtimeService.getUnreadCount(chatId, userId);
      } catch (error) {
        set({
          error:
            error instanceof Error
              ? error.message
              : 'Failed to get unread count',
        });
        return 0;
      }
    },

    // ===== TYPING ACTIONS =====

    setTyping: async (chatId: string, userId: string, isTyping: boolean) => {
      try {
        // Update Firebase typing status
        await realtimeService.setTypingStatus(chatId, userId, isTyping);

        // Update local state
        set(state => {
          const currentTypers = state.typingUsers[chatId] || [];
          let updatedTypers;

          if (isTyping) {
            updatedTypers = currentTypers.includes(userId)
              ? currentTypers
              : [...currentTypers, userId];
          } else {
            updatedTypers = currentTypers.filter(id => id !== userId);
          }

          return {
            typingUsers: {
              ...state.typingUsers,
              [chatId]: updatedTypers,
            },
          };
        });
      } catch (error) {
        set({
          error:
            error instanceof Error
              ? error.message
              : 'Failed to update typing status',
        });
      }
    },

    // ===== PRESENCE ACTIONS =====

    updateUserPresence: async (userId: string, isOnline: boolean) => {
      try {
        await realtimeService.updateUserPresence(userId, isOnline);
      } catch (error) {
        set({
          error:
            error instanceof Error
              ? error.message
              : 'Failed to update presence',
        });
      }
    },

    subscribeToUserPresence: (userId: string) => {
      return realtimeService.subscribeToUserPresence(userId, presence => {
        if (presence) {
          set(state => ({
            userPresence: { ...state.userPresence, [userId]: presence },
          }));
        }
      });
    },

    // ===== UTILITY ACTIONS =====

    resetUnreadCount: async (chatId: string, userId: string) => {
      try {
        await realtimeService.resetUnreadCount(chatId, userId);
      } catch (error) {
        set({
          error:
            error instanceof Error
              ? error.message
              : 'Failed to reset unread count',
        });
      }
    },

    getConversationWithUser: (currentUserId: string, otherUserId: string) => {
      const { conversations } = get();
      return (
        conversations.find(
          conv =>
            conv.participants.includes(currentUserId) &&
            conv.participants.includes(otherUserId),
        ) || null
      );
    },

    getChatUser: (userId: string, users: ChatUser[]) => {
      return users.find(user => user.uid === userId) || null;
    },

    checkConnectionStatus: () => {
      const isConnected = realtimeService.isConnected();
      set({ isConnected });
      return isConnected;
    },

    // ===== AI CHAT ACTIONS =====

    sendAIQuery: async (question: string) => {
      const { user } = useAuthStore.getState();
      const { activeEvent } = useEventStore.getState();

      if (!user?.uid) {
        set({ aiError: 'User not authenticated' });
        return;
      }

      if (!activeEvent?.id) {
        set({ aiError: 'No active event found' });
        return;
      }

      // Create temporary AI message with loading state
      const tempMessageId = `temp_${Date.now()}`;
      const tempMessage: AIMessage = {
        id: tempMessageId,
        question,
        answer: '',
        citations: [],
        timestamp: Date.now(),
        isLoading: true,
      };

      // Add loading message to state
      set(state => ({
        aiMessages: [...state.aiMessages, tempMessage],
        isLoadingAI: true,
        aiError: null,
      }));

      try {
        // Call the ragAnswer Cloud Function
        const ragAnswerFunction = httpsCallable<RagAnswerRequest, RagAnswerResponse>(
          functions,
          'ragAnswer',
        );

        const result = await ragAnswerFunction({
          eventId: activeEvent.id,
          userId: user.uid,
          question,
        });

        // Update the message with the actual response
        const finalMessage: AIMessage = {
          id: `ai_${Date.now()}`,
          question,
          answer: result.data.text,
          citations: result.data.citations,
          timestamp: Date.now(),
          isLoading: false,
        };

        set(state => ({
          aiMessages: state.aiMessages.map(msg =>
            msg.id === tempMessageId ? finalMessage : msg,
          ),
          isLoadingAI: false,
          aiError: null,
        }));

      } catch (error: any) {
        console.error('AI query failed:', error);
        
        // Update the temporary message with error state
        set(state => ({
          aiMessages: state.aiMessages.map(msg =>
            msg.id === tempMessageId
              ? { ...msg, isLoading: false, error: error.message || 'Failed to get AI response' }
              : msg,
          ),
          isLoadingAI: false,
          aiError: error.message || 'Failed to get AI response',
        }));
      }
    },

    clearAIError: () => {
      set({ aiError: null });
    },

    clearAIMessages: () => {
      set({ aiMessages: [] });
    },

    // ===== CLEANUP =====

    cleanup: () => {
      realtimeService.cleanup();
      set({
        conversations: [],
        activeConversationId: null,
        messages: {},
        aiMessages: [],
        isLoadingAI: false,
        aiError: null,
        typingUsers: {},
        userPresence: {},
        isLoading: false,
        isLoadingMessages: {},
        error: null,
        isConnected: true,
        messagesPagination: {},
      });
    },

    clearError: () => {
      set({ error: null });
    },
  })),
);

// ===== CONVENIENCE HOOKS =====

/**
 * Hook to get active conversation
 */
export const useActiveConversation = () => {
  return useChatStore(state => {
    if (!state.activeConversationId) return null;
    return (
      state.conversations.find(
        conv => conv.id === state.activeConversationId,
      ) || null
    );
  });
};

/**
 * Hook to get messages for a specific chat
 */
export const useChatMessages = (chatId: string) => {
  return useChatStore(state => {
    const messages = state.messages[chatId];
    return messages || [];
  });
};

/**
 * Hook to get typing users for a specific chat
 */
export const useTypingUsers = (chatId: string) => {
  return useChatStore(state => {
    const typingUsers = state.typingUsers[chatId];
    return typingUsers || [];
  });
};

/**
 * Hook to get user presence
 */
export const useUserPresence = (userId: string) => {
  return useChatStore(state => state.userPresence[userId] || null);
};

/**
 * Hook to check if messages are loading for a chat
 */
export const useIsLoadingMessages = (chatId: string) => {
  return useChatStore(state => state.isLoadingMessages[chatId] || false);
};

/**
 * Hook to get conversation with a specific user
 */
export const useConversationWithUser = (
  currentUserId: string,
  otherUserId: string,
) => {
  return useChatStore(state =>
    state.getConversationWithUser(currentUserId, otherUserId),
  );
};

/**
 * Hook to get AI messages
 */
export const useAIMessages = () => {
  return useChatStore(state => state.aiMessages);
};

/**
 * Hook to check if AI is loading
 */
export const useIsLoadingAI = () => {
  return useChatStore(state => state.isLoadingAI);
};

/**
 * Hook to get AI error
 */
export const useAIError = () => {
  return useChatStore(state => state.aiError);
};

export default useChatStore;
