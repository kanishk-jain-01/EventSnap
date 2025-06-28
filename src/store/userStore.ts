import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { User } from '../types';
import { FirestoreService } from '../services/firestore.service';
import { StorageService } from '../services/storage.service';

interface UserStoreState {
  // State
  currentUser: User | null;
  allUsers: User[]; // Cache of user search results / global user list
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchCurrentUser: (_uid: string) => Promise<void>;
  updateProfile: (_updates: Partial<User>) => Promise<void>;
  searchUsers: (_query: string) => Promise<User[]>;
  uploadAvatar: (
    _file: Blob | Uint8Array | ArrayBuffer,
    _onProgress?: (_progress: number) => void,
  ) => Promise<string | null>; // returns downloadURL
  reset: () => void;
}

export const useUserStore = create<UserStoreState>()(
  devtools((set, get) => ({
    // Initial state
    currentUser: null,
    allUsers: [],
    isLoading: false,
    error: null,

    // Fetch current user profile
    async fetchCurrentUser(uid: string) {
      if (!uid) return;
      set({ isLoading: true, error: null });
      const response = await FirestoreService.getUser(uid);
      if (response.success && response.data) {
        set({ currentUser: response.data, isLoading: false });
      } else {
        set({
          error: response.error || 'Failed to load profile',
          isLoading: false,
        });
      }
    },

    // Update current user profile (displayName / avatarUrl)
    async updateProfile(updates: Partial<User>) {
      const { currentUser } = get();
      if (!currentUser) return;
      const updated: User = { ...currentUser, ...updates } as User;
      const response = await FirestoreService.createOrUpdateUser(updated);
      if (response.success) {
        set({ currentUser: updated });
      } else {
        set({ error: response.error || 'Profile update failed' });
      }
    },

    // Search users by displayName (prefix)
    async searchUsers(query: string) {
      const { currentUser } = get();
      const response = await FirestoreService.searchUsers(
        query,
        20,
        currentUser?.uid,
      );
      if (response.success && response.data) {
        set({ allUsers: response.data });
        return response.data;
      }
      set({ error: response.error || 'Search failed' });
      return [];
    },

    // Upload an avatar image for the current user
    async uploadAvatar(
      file: Blob | Uint8Array | ArrayBuffer,
      onProgress?: (_progress: number) => void,
    ) {
      const { currentUser } = get();
      if (!currentUser) return null;

      // Use StorageService to upload avatar
      const uploadResponse = await StorageService.uploadAvatar(
        file,
        currentUser.uid,
        'profile', // fixed id so we overwrite rather than create many files
        {
          onProgress,
          cacheControl: 'public,max-age=86400', // cache for a day
        },
      );

      if (!uploadResponse.success || !uploadResponse.data) {
        set({ error: uploadResponse.error || 'Avatar upload failed' });
        return null;
      }

      const downloadURL = uploadResponse.data.downloadURL;

      // Update Firestore user document
      const updateRes = await FirestoreService.createOrUpdateUser({
        ...currentUser,
        avatarUrl: downloadURL,
      });

      if (updateRes.success) {
        set({
          currentUser: { ...currentUser, avatarUrl: downloadURL },
        });
        return downloadURL;
      } else {
        set({ error: updateRes.error || 'Failed to update profile' });
        return null;
      }
    },

    reset() {
      set({
        currentUser: null,
        allUsers: [],
        isLoading: false,
        error: null,
      });
    },
  })),
);
