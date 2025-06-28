import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../services/firebase/config';
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
  // AI Chat
  aiMessages: AIMessage[];
  isLoadingAI: boolean;
  aiError: string | null;
}

interface ChatActions {
  // AI Chat actions
  sendAIQuery: (_question: string) => Promise<void>;
  clearAIError: () => void;
  clearAIMessages: () => void;

  // Cleanup
  cleanup: () => void;
}

type ChatStore = ChatState & ChatActions;

// ===== STORE IMPLEMENTATION =====

export const useChatStore = create<ChatStore>()(
  subscribeWithSelector((set, _get) => ({
    // ===== INITIAL STATE =====
    aiMessages: [],
    isLoadingAI: false,
    aiError: null,

    // ===== AI CHAT ACTIONS =====

    sendAIQuery: async (question: string) => {
      const { user } = useAuthStore.getState();
      const { activeEvent } = useEventStore.getState();

      if (!user?.uid) {
        set({ aiError: 'User not authenticated' });
        return;
      }

      if (!activeEvent?.id) {
        set({ aiError: 'No active event selected' });
        return;
      }

      // Validate question
      if (!question.trim()) {
        set({ aiError: 'Please enter a question' });
        return;
      }

      if (question.length > 500) {
        set({ aiError: 'Question is too long (max 500 characters)' });
        return;
      }

      set({ isLoadingAI: true, aiError: null });

      // Create temporary message with loading state
      const tempMessageId = `temp_${Date.now()}`;
      const tempMessage: AIMessage = {
        id: tempMessageId,
        question,
        answer: '',
        citations: [],
        timestamp: Date.now(),
        isLoading: true,
      };

      set(state => ({
        aiMessages: [...state.aiMessages, tempMessage],
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
      set({
        aiMessages: [],
        isLoadingAI: false,
        aiError: null,
      });
    },
  })),
);

// ===== CONVENIENCE HOOKS =====

export const useAIMessages = () => {
  return useChatStore(state => state.aiMessages);
};

export const useIsLoadingAI = () => {
  return useChatStore(state => state.isLoadingAI);
};

export const useAIError = () => {
  return useChatStore(state => state.aiError);
};
