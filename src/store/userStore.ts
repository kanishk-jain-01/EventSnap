import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { User } from '../types';
import { FirestoreService } from '../services/firestore.service';
import { StorageService } from '../services/storage.service';
import type { Unsubscribe } from 'firebase/firestore';

interface UserStoreState {
  // State
  currentUser: User | null;
  contacts: User[]; // Friend list / contacts
  allUsers: User[]; // Cache of user search results / global user list
  isLoading: boolean;
  error: string | null;

  contactsLoading: boolean;
  contactsSub?: Unsubscribe;

  // Actions
  fetchCurrentUser: (_uid: string) => Promise<void>;
  fetchContacts: () => Promise<void>;
  subscribeToContacts: () => void;
  updateProfile: (_updates: Partial<User>) => Promise<void>;
  searchUsers: (_query: string) => Promise<User[]>;
  addContact: (_userId: string) => Promise<void>;
  removeContact: (_userId: string) => Promise<void>;
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
    contacts: [],
    allUsers: [],
    isLoading: false,
    error: null,
    contactsLoading: false,
    contactsSub: undefined,

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

    // Fetch contacts list (one-time)
    async fetchContacts() {
      const { currentUser } = get();
      if (!currentUser) return;
      set({ contactsLoading: true });

      const idsResponse = await FirestoreService.getContacts(currentUser.uid);
      if (!idsResponse.success || !idsResponse.data) {
        set({
          contactsLoading: false,
          error: idsResponse.error || 'Failed to load contacts',
        });
        return;
      }

      // Fetch user objects for each id
      const userPromises = idsResponse.data.map(id =>
        FirestoreService.getUser(id),
      );
      const results = await Promise.all(userPromises);
      const users: User[] = [];
      results.forEach(res => {
        if (res.success && res.data) users.push(res.data);
      });

      set({ contacts: users, contactsLoading: false });
    },

    // Subscribe to contacts changes in real-time
    subscribeToContacts() {
      const { currentUser, contactsSub } = get();
      if (!currentUser) return;
      // Unsubscribe existing
      if (contactsSub) contactsSub();

      const unsub = FirestoreService.subscribeToContacts(
        currentUser.uid,
        async ids => {
          // Fetch user docs for changed ids
          const userPromises = ids.map(id => FirestoreService.getUser(id));
          const results = await Promise.all(userPromises);
          const users: User[] = [];
          results.forEach(res => {
            if (res.success && res.data) users.push(res.data);
          });
          set({ contacts: users });
        },
        err => set({ error: err }),
      );

      set({ contactsSub: unsub });
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

    // Add contact via Firestore
    async addContact(contactUserId: string) {
      const { currentUser } = get();
      if (!currentUser) return;

      const res = await FirestoreService.addContact(
        currentUser.uid,
        contactUserId,
      );
      if (!res.success) {
        set({ error: res.error || 'Failed to add contact' });
      }
    },

    // Remove contact via Firestore
    async removeContact(contactUserId: string) {
      const { currentUser } = get();
      if (!currentUser) return;

      const res = await FirestoreService.removeContact(
        currentUser.uid,
        contactUserId,
      );
      if (!res.success) {
        set({ error: res.error || 'Failed to remove contact' });
      }
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

      if (!updateRes.success) {
        set({ error: updateRes.error || 'Failed to update avatar URL' });
        return null;
      }

      // Update store state
      set(state => ({
        currentUser: { ...state.currentUser!, avatarUrl: downloadURL },
      }));

      return downloadURL;
    },

    // Reset store to initial values
    reset() {
      const { contactsSub } = get();
      if (contactsSub) contactsSub();
      set({
        currentUser: null,
        contacts: [],
        allUsers: [],
        isLoading: false,
        error: null,
        contactsLoading: false,
        contactsSub: undefined,
      });
    },
  })),
);
