import { create } from 'zustand';
import { SnapState, User } from '../types';
import { FirestoreService } from '../services/firestore.service';
import { StorageService } from '../services/storage.service';

// Extended snap state for sending functionality
interface SnapStoreState extends SnapState {
  // Recipient selection
  availableRecipients: User[];
  selectedRecipients: User[];
  isLoadingRecipients: boolean;
  recipientError: string | null;

  // Snap sending
  isSending: boolean;
  sendingProgress: number;
  sendingError: string | null;

  // Actions
  loadRecipients: (_currentUserId: string) => Promise<void>;
  selectRecipient: (_recipient: User) => void;
  deselectRecipient: (_recipientId: string) => void;
  clearSelectedRecipients: () => void;
  sendSnap: (_imageUri: string, _senderId: string) => Promise<boolean>;
  sendEventSnap: (_imageUri: string, _senderId: string, _eventId: string) => Promise<boolean>;
  loadReceivedSnaps: (_userId: string) => Promise<void>;
  loadReceivedSnapsForEvent: (_userId: string, _eventId: string) => Promise<void>;
  loadSentSnaps: (_userId: string) => Promise<void>;
  markSnapAsViewed: (_snapId: string) => Promise<void>;
  subscribeToReceivedSnaps: (_userId: string) => () => void;
  subscribeToReceivedSnapsForEvent: (_userId: string, _eventId: string) => () => void;
  clearError: () => void;
  resetSendingState: () => void;
}

export const useSnapStore = create<SnapStoreState>((set, get) => ({
  // Initial state
  receivedSnaps: [],
  sentSnaps: [],
  isLoading: false,
  error: null,

  // Recipient selection state
  availableRecipients: [],
  selectedRecipients: [],
  isLoadingRecipients: false,
  recipientError: null,

  // Snap sending state
  isSending: false,
  sendingProgress: 0,
  sendingError: null,

  // Load available recipients for snap sending
  loadRecipients: async (currentUserId: string) => {
    set({ isLoadingRecipients: true, recipientError: null });

    try {
      // Step 1: get contact IDs
      const contactsRes = await FirestoreService.getContacts(currentUserId);

      if (!contactsRes.success || !contactsRes.data) {
        set({
          recipientError: contactsRes.error || 'Failed to load contacts',
          isLoadingRecipients: false,
        });
        return;
      }

      const contactIds = contactsRes.data;

      if (contactIds.length === 0) {
        set({ availableRecipients: [], isLoadingRecipients: false });
        return;
      }

      // Step 2: fetch user docs for each contact
      const userPromises = contactIds.map(id => FirestoreService.getUser(id));
      const results = await Promise.all(userPromises);
      const users: User[] = [];
      results.forEach(res => {
        if (res.success && res.data) users.push(res.data);
      });

      set({ availableRecipients: users, isLoadingRecipients: false });
    } catch (_error) {
      set({
        recipientError: 'Failed to load recipients',
        isLoadingRecipients: false,
      });
    }
  },

  // Select a recipient for snap sending
  selectRecipient: (recipient: User) => {
    const { selectedRecipients } = get();

    // Prevent duplicate selection
    if (!selectedRecipients.find(r => r.uid === recipient.uid)) {
      set({
        selectedRecipients: [...selectedRecipients, recipient],
      });
    }
  },

  // Deselect a recipient
  deselectRecipient: (recipientId: string) => {
    const { selectedRecipients } = get();
    set({
      selectedRecipients: selectedRecipients.filter(r => r.uid !== recipientId),
    });
  },

  // Clear all selected recipients
  clearSelectedRecipients: () => {
    set({ selectedRecipients: [] });
  },

  // Send snap to selected recipients
  sendSnap: async (imageUri: string, senderId: string) => {
    const { selectedRecipients } = get();

    if (selectedRecipients.length === 0) {
      set({ sendingError: 'Please select at least one recipient' });
      return false;
    }

    set({
      isSending: true,
      sendingProgress: 0,
      sendingError: null,
    });

    try {
      // Convert image URI to blob for upload
      const response = await fetch(imageUri);
      const blob = await response.blob();

      // Track progress for multiple recipients
      const totalSteps = selectedRecipients.length * 2; // Upload + Firestore for each
      let completedSteps = 0;

      const updateProgress = () => {
        completedSteps++;
        set({ sendingProgress: (completedSteps / totalSteps) * 100 });
      };

      // Send snap to each selected recipient
      const sendPromises = selectedRecipients.map(async recipient => {
        try {
          // Generate unique snap ID
          const snapId = `${senderId}_${recipient.uid}_${Date.now()}`;

          // Upload image to Firebase Storage
          const uploadResult = await StorageService.uploadSnap(
            blob,
            senderId,
            snapId,
            {
              onProgress: _progress => {
                // Individual upload progress (not implemented in this version)
              },
              customMetadata: {
                recipientId: recipient.uid,
                snapId: snapId,
              },
            },
          );

          updateProgress();

          if (!uploadResult.success || !uploadResult.data) {
            throw new Error(
              `Failed to upload snap for ${recipient.displayName}`,
            );
          }

          // Create snap document in Firestore
          const snapResult = await FirestoreService.createSnap(
            senderId,
            recipient.uid,
            uploadResult.data.downloadURL,
            uploadResult.data.fullPath,
            {
              fileSize: uploadResult.data.size,
              contentType: uploadResult.data.contentType,
              compressed: true,
            },
          );

          updateProgress();

          if (!snapResult.success) {
            throw new Error(
              `Failed to create snap for ${recipient.displayName}`,
            );
          }

          return snapResult.data;
        } catch (error) {
          updateProgress(); // Still update progress on error
          throw error;
        }
      });

      // Wait for all snaps to be sent
      await Promise.all(sendPromises);

      // Success - reset state
      set({
        isSending: false,
        sendingProgress: 100,
        selectedRecipients: [],
        sendingError: null,
      });

      // Reload sent snaps to include new ones
      await get().loadSentSnaps(senderId);

      return true;
    } catch (error) {
      set({
        isSending: false,
        sendingError:
          error instanceof Error ? error.message : 'Failed to send snap',
        sendingProgress: 0,
      });
      return false;
    }
  },

  // Load received snaps
  loadReceivedSnaps: async (userId: string) => {
    set({ isLoading: true, error: null });

    try {
      const response = await FirestoreService.getReceivedSnaps(userId);

      if (response.success && response.data) {
        set({
          receivedSnaps: response.data,
          isLoading: false,
        });
      } else {
        set({
          error: response.error || 'Failed to load received snaps',
          isLoading: false,
        });
      }
    } catch (_error) {
      set({
        error: 'Failed to load received snaps',
        isLoading: false,
      });
    }
  },

  // Load sent snaps
  loadSentSnaps: async (userId: string) => {
    set({ isLoading: true, error: null });

    try {
      const response = await FirestoreService.getSentSnaps(userId);

      if (response.success && response.data) {
        set({
          sentSnaps: response.data,
          isLoading: false,
        });
      } else {
        set({
          error: response.error || 'Failed to load sent snaps',
          isLoading: false,
        });
      }
    } catch (_error) {
      set({
        error: 'Failed to load sent snaps',
        isLoading: false,
      });
    }
  },

  // Mark snap as viewed
  markSnapAsViewed: async (snapId: string) => {
    try {
      const response = await FirestoreService.markSnapAsViewed(snapId);

      if (response.success) {
        // Update local state
        const { receivedSnaps } = get();
        const updatedSnaps = receivedSnaps.map(snap =>
          snap.id === snapId
            ? { ...snap, viewed: true, viewedAt: new Date() }
            : snap,
        );
        set({ receivedSnaps: updatedSnaps });
      }
    } catch (_error) {
      // Silently fail - not critical for UX
      // console.warn('Failed to mark snap as viewed:', _error);
    }
  },

  // Subscribe to real-time received snaps
  subscribeToReceivedSnaps: (userId: string) => {
    return FirestoreService.subscribeToReceivedSnaps(
      userId,
      snaps => {
        set({ receivedSnaps: snaps });
      },
      error => {
        set({ error });
      },
    );
  },

  // Send event snap (host-only)
  sendEventSnap: async (imageUri: string, senderId: string, eventId: string) => {
    set({
      isSending: true,
      sendingProgress: 0,
      sendingError: null,
    });

    try {
      // Convert image URI to blob for upload
      const response = await fetch(imageUri);
      const blob = await response.blob();

      // Generate unique snap ID
      const snapId = `${senderId}_${eventId}_${Date.now()}`;

      set({ sendingProgress: 20 });

      // Upload image to Firebase Storage
      const uploadResult = await StorageService.uploadSnap(
        blob,
        senderId,
        snapId,
        {
          onProgress: progress => {
            set({ sendingProgress: 20 + progress * 60 }); // 20-80% of progress bar
          },
          customMetadata: {
            eventId: eventId,
            snapId: snapId,
          },
        },
      );

      if (!uploadResult.success || !uploadResult.data) {
        throw new Error(uploadResult.error || 'Failed to upload snap');
      }

      set({ sendingProgress: 85 });

      // Create event snap (host-only with validation)
      const snapResult = await FirestoreService.createEventSnap(
        senderId,
        eventId,
        uploadResult.data.downloadURL,
        uploadResult.data.fullPath,
        {
          fileSize: uploadResult.data.size,
          contentType: uploadResult.data.contentType,
          compressed: true,
        },
      );

      if (!snapResult.success) {
        throw new Error(snapResult.error || 'Failed to create event snap');
      }

      // Success - reset state
      set({
        isSending: false,
        sendingProgress: 100,
        sendingError: null,
      });

      return true;
    } catch (error) {
      set({
        isSending: false,
        sendingError:
          error instanceof Error ? error.message : 'Failed to send event snap',
        sendingProgress: 0,
      });
      return false;
    }
  },

  // Load received snaps for a specific event
  loadReceivedSnapsForEvent: async (userId: string, eventId: string) => {
    set({ isLoading: true, error: null });

    try {
      const response = await FirestoreService.getReceivedSnapsForEvent(userId, eventId);

      if (response.success && response.data) {
        set({
          receivedSnaps: response.data,
          isLoading: false,
        });
      } else {
        set({
          error: response.error || 'Failed to load event snaps',
          isLoading: false,
        });
      }
    } catch (_error) {
      set({
        error: 'Failed to load event snaps',
        isLoading: false,
      });
    }
  },

  // Subscribe to real-time received snaps for a specific event
  subscribeToReceivedSnapsForEvent: (userId: string, eventId: string) => {
    return FirestoreService.subscribeToReceivedSnapsForEvent(
      userId,
      eventId,
      snaps => {
        set({ receivedSnaps: snaps });
      },
      error => {
        set({ error });
      },
    );
  },

  // Clear error states
  clearError: () => {
    set({
      error: null,
      recipientError: null,
      sendingError: null,
    });
  },

  // Reset sending state
  resetSendingState: () => {
    set({
      isSending: false,
      sendingProgress: 0,
      sendingError: null,
      selectedRecipients: [],
    });
  },
}));
