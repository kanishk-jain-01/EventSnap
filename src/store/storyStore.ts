import { create } from 'zustand';
import { StoryState } from '../types';
import { FirestoreService } from '../services/firestore.service';
import { StorageService } from '../services/storage.service';
import { useAuthStore } from './authStore';

interface StoryStoreState extends StoryState {
  isPosting: boolean;
  postingProgress: number;
  postingError: string | null;

  // Actions
  postStory: (_imageUri: string) => Promise<boolean>;
  loadStories: () => Promise<void>;
  subscribeToStories: () => () => void;
  clearError: () => void;
}

export const useStoryStore = create<StoryStoreState>((set, get) => ({
  // State
  stories: [],
  myStories: [],
  viewedStories: [],
  isLoading: false,
  error: null,

  // Posting state
  isPosting: false,
  postingProgress: 0,
  postingError: null,

  // Post a story
  postStory: async (imageUri: string): Promise<boolean> => {
    const { user } = useAuthStore.getState();
    if (!user) {
      set({ postingError: 'User not authenticated' });
      return false;
    }

    set({ isPosting: true, postingProgress: 0, postingError: null });

    try {
      // Convert URI to blob
      const res = await fetch(imageUri);
      const blob = await res.blob();

      const storyId = `${user.uid}_${Date.now()}`;

      // Upload image
      const uploadRes = await StorageService.uploadStory(blob, user.uid, storyId, {
        onProgress: progress => {
          set({ postingProgress: progress * 0.8 }); // first 80% of bar
        },
      });

      if (!uploadRes.success || !uploadRes.data) {
        throw new Error(uploadRes.error || 'Upload failed');
      }

      set({ postingProgress: 90 });

      // Create Firestore document
      const createRes = await FirestoreService.createStory(
        user.uid,
        uploadRes.data.downloadURL,
        uploadRes.data.fullPath,
        {
          fileSize: uploadRes.data.size,
          contentType: uploadRes.data.contentType,
          compressed: true,
        },
      );

      if (!createRes.success || !createRes.data) {
        throw new Error(createRes.error || 'Failed to create story');
      }

      set({ postingProgress: 100, isPosting: false });

      // Reload stories so UI updates
      await get().loadStories();

      return true;
    } catch (error) {
      set({
        postingError: error instanceof Error ? error.message : 'Failed to post story',
        isPosting: false,
        postingProgress: 0,
      });
      return false;
    }
  },

  // Load active stories
  loadStories: async (): Promise<void> => {
    set({ isLoading: true, error: null });
    try {
      const res = await FirestoreService.getActiveStories();
      if (res.success && res.data) {
        const { user } = useAuthStore.getState();
        const myStories = user ? res.data.filter(s => s.userId === user.uid) : [];
        set({ stories: res.data, myStories, isLoading: false });
      } else {
        throw new Error(res.error || 'Failed to load stories');
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to load stories',
        isLoading: false,
      });
    }
  },

  subscribeToStories: (): (() => void) => {
    set({ isLoading: true, error: null });

    const unsubscribe = FirestoreService.subscribeToStories(stories => {
      const { user } = useAuthStore.getState();
      const myStories = user ? stories.filter(s => s.userId === user.uid) : [];
      set({ stories, myStories, isLoading: false });
    }, err => {
      set({ error: err, isLoading: false });
    });

    return unsubscribe;
  },

  clearError: () => set({ error: null, postingError: null }),
})); 