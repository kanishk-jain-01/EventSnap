import { create } from 'zustand';
import type { Event as AppEvent, EventParticipant } from '../types';
import { FirestoreService } from '../services/firestore.service';
import { useAuthStore } from './authStore';

interface EventStoreState {
  activeEvent: AppEvent | null;
  role: 'host' | 'guest' | null;
  participants: Record<string, EventParticipant>; // keyed by uid
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initializeEventStore: (_userId: string) => Promise<void>;
  createEvent: (_event: Omit<AppEvent, 'id' | 'createdAt' | 'hostCode' | 'joinCode'>) => Promise<boolean>;
  joinEvent: (
    _eventId: string,
    _userId: string,
    _joinCode?: string | null,
  ) => Promise<boolean>;
  joinEventByCode: (_joinCode: string, _userId: string) => Promise<boolean>;
  promoteToHost: (_hostCode: string, _userId: string) => Promise<boolean>;
  fetchEvent: (_eventId: string) => Promise<void>;
  addParticipant: (
    _eventId: string,
    _userId: string,
    _role?: 'host' | 'guest',
  ) => Promise<void>;
  removeParticipant: (_eventId: string, _userId: string) => Promise<void>;
  clearError: () => void;
  clearState: () => void;
  clearActiveEvent: (_userId: string) => Promise<void>;
  _loadActiveEventFromUser: (_userId: string) => Promise<void>;
  _updateUserActiveEvent: (
    _userId: string,
    _eventId: string | null,
    _role: 'host' | 'guest' | null,
  ) => Promise<void>;
}

export const useEventStore = create<EventStoreState>((set, get) => ({
  // Initial state
  activeEvent: null,
  role: null,
  participants: {},
  isLoading: false,
  error: null,
  isInitialized: false,

  /** Initialize event store - load active event from user's database record */
  initializeEventStore: async (userId: string) => {
    if (get().isInitialized) return;

    set({ isLoading: true });
    await get()._loadActiveEventFromUser(userId);
    set({ isInitialized: true, isLoading: false });
  },

  /** Create a new event and set it as active */
  createEvent: async eventInput => {
    set({ isLoading: true, error: null });
    try {
      const { user } = useAuthStore.getState();
      if (!user?.uid) {
        set({ error: 'User not authenticated', isLoading: false });
        return false;
      }

      const res = await FirestoreService.createEvent(eventInput);
      if (!res.success || !res.data) {
        set({ error: res.error || 'Failed to create event', isLoading: false });
        return false;
      }

      // Update user's active event in database
      await get()._updateUserActiveEvent(user.uid, res.data.id, 'host');
      
      set({ activeEvent: res.data, role: 'host', isLoading: false });
      return true;
    } catch (_err) {
      set({ error: 'Failed to create event', isLoading: false });
      return false;
    }
  },

  /** Join an existing event */
  joinEvent: async (eventId, userId, joinCode) => {
    set({ isLoading: true, error: null });
    try {
      const res = await FirestoreService.joinEvent(eventId, userId, joinCode);
      if (!res.success) {
        set({ error: res.error || 'Failed to join event', isLoading: false });
        return false;
      }
      
      // Fetch the event details to store locally
      const evtRes = await FirestoreService.getActiveEvent(eventId);
      if (evtRes.success && evtRes.data) {
        // Determine role
        const role: 'host' | 'guest' =
          evtRes.data.hostUid === userId ? 'host' : 'guest';
        
        // Update user's active event in database
        await get()._updateUserActiveEvent(userId, eventId, role);
        
        set({ activeEvent: evtRes.data, role, isLoading: false });
      } else {
        set({ isLoading: false });
      }
      return true;
    } catch (_err) {
      set({ error: 'Failed to join event', isLoading: false });
      return false;
    }
  },

  /** Join an event by join code */
  joinEventByCode: async (joinCode, userId) => {
    set({ isLoading: true, error: null });
    try {
      // First, find the event by join code
      const eventRes = await FirestoreService.getEventByJoinCode(joinCode);
      if (!eventRes.success || !eventRes.data) {
        set({
          error: eventRes.error || 'Invalid join code',
          isLoading: false,
        });
        return false;
      }

      // Then join the event
      const joinRes = await FirestoreService.joinEvent(
        eventRes.data.id,
        userId,
        joinCode,
      );
      if (!joinRes.success) {
        set({
          error: joinRes.error || 'Failed to join event',
          isLoading: false,
        });
        return false;
      }

      // Determine role and set active event
      const role: 'host' | 'guest' =
        eventRes.data.hostUid === userId ? 'host' : 'guest';
      
      // Update user's active event in database
      await get()._updateUserActiveEvent(userId, eventRes.data.id, role);
      
      set({ activeEvent: eventRes.data, role, isLoading: false });
      return true;
    } catch (_err) {
      set({ error: 'Failed to join event', isLoading: false });
      return false;
    }
  },

  /** Promote guest to host using host code */
  promoteToHost: async (hostCode, userId) => {
    const { activeEvent } = get();
    if (!activeEvent) {
      set({ error: 'No active event to promote in' });
      return false;
    }

    set({ isLoading: true, error: null });
    try {
      const res = await FirestoreService.promoteToHost(
        activeEvent.id,
        userId,
        hostCode,
      );
      
      if (!res.success) {
        set({ error: res.error || 'Failed to promote to host', isLoading: false });
        return false;
      }

      // Update local state - user is now a host
      set({ role: 'host', isLoading: false });
      
      // Refresh the auth store to reflect the new role
      const { user, setUser } = useAuthStore.getState();
      if (user && user.uid === userId) {
        setUser({
          ...user,
          eventRole: 'host',
        });
      }

      return true;
    } catch (_err) {
      set({ error: 'Failed to promote to host', isLoading: false });
      return false;
    }
  },

  /** Fetch event by ID and update state */
  fetchEvent: async eventId => {
    set({ isLoading: true, error: null });
    try {
      const res = await FirestoreService.getActiveEvent(eventId);
      if (res.success && res.data) {
        set({ activeEvent: res.data, isLoading: false });
      } else {
        set({ error: res.error || 'Failed to fetch event', isLoading: false });
      }
    } catch (_err) {
      set({ error: 'Failed to fetch event', isLoading: false });
    }
  },

  /** Add/Update participant */
  addParticipant: async (eventId, userId, role = 'guest') => {
    await FirestoreService.addParticipant(eventId, userId, role);
  },

  /** Remove participant */
  removeParticipant: async (eventId, userId) => {
    await FirestoreService.removeParticipant(eventId, userId);
  },

  clearError: () => set({ error: null }),

  clearState: () => {
    set({
      activeEvent: null,
      role: null,
      participants: {},
      error: null,
      isInitialized: false,
    });
    // Note: We don't clear the user's active event in the database here
    // The active event should persist across login sessions
  },

  /** Clear active event from both state and database - only used when event expires or is ended */
  clearActiveEvent: async (userId: string) => {
    set({
      activeEvent: null,
      role: null,
      participants: {},
      error: null,
    });

    // Clear user's active event in database
    await get()._updateUserActiveEvent(userId, null, null);
  },

  /** Load active event from user's database record */
  _loadActiveEventFromUser: async (userId: string) => {
    try {
      // Get user data to check for active event
      const userRes = await FirestoreService.getUser(userId);
      if (!userRes.success || !userRes.data) {
        console.warn('Could not load user data for event initialization');
        return;
      }

      const user = userRes.data;
      
      // Check if user has an active event
      if (!user.activeEventId || !user.eventRole) {
        // No active event
        return;
      }

      // Verify event still exists and user is still a participant
      try {
        const eventRes = await FirestoreService.getActiveEvent(user.activeEventId);
        if (!eventRes.success || !eventRes.data) {
          // Event no longer exists, clear user's active event
          await get().clearActiveEvent(userId);
          return;
        }

        // Check if user is still a participant
        const participantRes = await FirestoreService.getParticipant(
          user.activeEventId,
          userId,
        );
        if (!participantRes.success) {
          // User is no longer a participant, clear active event
          await get().clearActiveEvent(userId);
          return;
        }

        // Check if event has expired (24 hours after end time)
        const now = new Date();
        const eventExpired =
          now > new Date(eventRes.data.endTime.getTime() + 24 * 60 * 60 * 1000);

        if (eventExpired) {
          // Event has expired, clear active event
          await get().clearActiveEvent(userId);
          return;
        }

        // Event is valid, restore it
        const currentRole: 'host' | 'guest' =
          eventRes.data.hostUid === userId ? 'host' : 'guest';
        
        // Update role if it has changed
        if (currentRole !== user.eventRole) {
          await get()._updateUserActiveEvent(userId, user.activeEventId, currentRole);
        }
        
        set({
          activeEvent: eventRes.data,
          role: currentRole,
          error: null,
        });
      } catch (error) {
        // Network error or other issue - try to use the stored event info
        console.warn(
          'Could not verify active event, may be offline:',
          error,
        );
        // We don't have the full event data, so we'll need to fetch it when online
        // For now, just clear the state to force re-selection
        set({
          activeEvent: null,
          role: null,
          error: null,
        });
      }
    } catch (error) {
      console.warn('Failed to load active event from user data:', error);
    }
  },

  /** Update user's active event information in database */
  _updateUserActiveEvent: async (
    userId: string,
    eventId: string | null,
    role: 'host' | 'guest' | null,
  ) => {
    try {
      // Update the user document
      await FirestoreService.updateUserActiveEvent(userId, eventId, role);
      
      // Also update the auth store to keep it in sync
      const { user, setUser } = useAuthStore.getState();
      if (user && user.uid === userId) {
        setUser({
          ...user,
          activeEventId: eventId,
          eventRole: role,
        });
      }
    } catch (error) {
      console.warn('Failed to update user active event:', error);
      // Don't throw - this is not critical for the operation to continue
    }
  },
}));
