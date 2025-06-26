import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Event as AppEvent, EventParticipant } from '../types';
import { FirestoreService } from '../services/firestore.service';

const ACTIVE_EVENT_KEY = 'eventsnap_active_event';
const USER_ROLE_KEY = 'eventsnap_user_role';

interface EventStoreState {
  activeEvent: AppEvent | null;
  role: 'host' | 'guest' | null;
  participants: Record<string, EventParticipant>; // keyed by uid
  publicEvents: AppEvent[];
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initializeEventStore: (_userId: string) => Promise<void>;
  createEvent: (_event: Omit<AppEvent, 'id' | 'createdAt'>) => Promise<boolean>;
  joinEvent: (
    _eventId: string,
    _userId: string,
    _joinCode?: string | null,
  ) => Promise<boolean>;
  joinEventByCode: (_joinCode: string, _userId: string) => Promise<boolean>;
  fetchEvent: (_eventId: string) => Promise<void>;
  loadPublicEvents: () => Promise<void>;
  addParticipant: (
    _eventId: string,
    _userId: string,
    _role?: 'host' | 'guest',
  ) => Promise<void>;
  removeParticipant: (_eventId: string, _userId: string) => Promise<void>;
  clearError: () => void;
  clearState: () => void;
  _saveActiveEventToStorage: () => Promise<void>;
  _loadActiveEventFromStorage: (_userId: string) => Promise<void>;
}

export const useEventStore = create<EventStoreState>((set, get) => ({
  // Initial state
  activeEvent: null,
  role: null,
  participants: {},
  publicEvents: [],
  isLoading: false,
  error: null,
  isInitialized: false,

  /** Initialize event store - load persisted active event */
  initializeEventStore: async (userId: string) => {
    if (get().isInitialized) return;
    
    set({ isLoading: true });
    await get()._loadActiveEventFromStorage(userId);
    set({ isInitialized: true, isLoading: false });
  },

  /** Create a new event and set it as active */
  createEvent: async eventInput => {
    set({ isLoading: true, error: null });
    try {
      const res = await FirestoreService.createEvent(eventInput);
      if (!res.success || !res.data) {
        set({ error: res.error || 'Failed to create event', isLoading: false });
        return false;
      }
      set({ activeEvent: res.data, role: 'host', isLoading: false });
      await get()._saveActiveEventToStorage();
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
        set({ activeEvent: evtRes.data, role, isLoading: false });
        await get()._saveActiveEventToStorage();
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
      set({ activeEvent: eventRes.data, role, isLoading: false });
      await get()._saveActiveEventToStorage();
      return true;
    } catch (_err) {
      set({ error: 'Failed to join event', isLoading: false });
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
        await get()._saveActiveEventToStorage();
      } else {
        set({ error: res.error || 'Failed to fetch event', isLoading: false });
      }
    } catch (_err) {
      set({ error: 'Failed to fetch event', isLoading: false });
    }
  },

  /** Load public events */
  loadPublicEvents: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await FirestoreService.getPublicEvents();
      if (res.success && res.data) {
        set({ publicEvents: res.data, isLoading: false });
      } else {
        set({
          error: res.error || 'Failed to load public events',
          isLoading: false,
        });
      }
    } catch (_err) {
      set({ error: 'Failed to load public events', isLoading: false });
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
      publicEvents: [],
      error: null,
    });
    // Clear AsyncStorage when clearing state
    AsyncStorage.multiRemove([ACTIVE_EVENT_KEY, USER_ROLE_KEY]).catch(() => {
      // Ignore storage errors during cleanup
    });
  },

  /** Save active event to AsyncStorage */
  _saveActiveEventToStorage: async () => {
    const { activeEvent, role } = get();
    try {
      if (activeEvent && role) {
        await AsyncStorage.multiSet([
          [ACTIVE_EVENT_KEY, JSON.stringify(activeEvent)],
          [USER_ROLE_KEY, role],
        ]);
      } else {
        // Clear storage if no active event
        await AsyncStorage.multiRemove([ACTIVE_EVENT_KEY, USER_ROLE_KEY]);
      }
    } catch (error) {
      console.warn('Failed to save active event to storage:', error);
    }
  },

  /** Load active event from AsyncStorage and validate it */
  _loadActiveEventFromStorage: async (userId: string) => {
    try {
      const [eventData, roleData] = await AsyncStorage.multiGet([
        ACTIVE_EVENT_KEY,
        USER_ROLE_KEY,
      ]);

      const savedEventString = eventData[1];
      const savedRole = roleData[1] as 'host' | 'guest' | null;

      if (!savedEventString || !savedRole) {
        return; // No saved event
      }

      const savedEvent: AppEvent = JSON.parse(savedEventString);
      
      // Convert string dates back to Date objects
      savedEvent.startTime = new Date(savedEvent.startTime);
      savedEvent.endTime = new Date(savedEvent.endTime);
      savedEvent.createdAt = new Date(savedEvent.createdAt);

      // Check if event is still valid (not expired and user is still a participant)
      const now = new Date();
      const eventExpired = now > new Date(savedEvent.endTime.getTime() + 24 * 60 * 60 * 1000); // 24 hours after end

      if (eventExpired) {
        // Event has expired, clear storage
        await AsyncStorage.multiRemove([ACTIVE_EVENT_KEY, USER_ROLE_KEY]);
        return;
      }

      // Verify event still exists and user is still a participant
      try {
        const eventRes = await FirestoreService.getActiveEvent(savedEvent.id);
        if (!eventRes.success || !eventRes.data) {
          // Event no longer exists, clear storage
          await AsyncStorage.multiRemove([ACTIVE_EVENT_KEY, USER_ROLE_KEY]);
          return;
        }

        // Check if user is still a participant
        const participantRes = await FirestoreService.getParticipant(savedEvent.id, userId);
        if (!participantRes.success) {
          // User is no longer a participant, clear storage
          await AsyncStorage.multiRemove([ACTIVE_EVENT_KEY, USER_ROLE_KEY]);
          return;
        }

        // Event is valid, restore it
        const currentRole: 'host' | 'guest' = eventRes.data.hostUid === userId ? 'host' : 'guest';
        set({ 
          activeEvent: eventRes.data, 
          role: currentRole,
          error: null, 
        });

        // Update storage with fresh event data
        await get()._saveActiveEventToStorage();
      } catch (error) {
        // Network error or other issue - keep the saved event for offline use
        console.warn('Could not verify saved event, using cached version:', error);
        set({ 
          activeEvent: savedEvent, 
          role: savedRole,
          error: null, 
        });
      }
    } catch (error) {
      console.warn('Failed to load active event from storage:', error);
      // Clear potentially corrupted data
      await AsyncStorage.multiRemove([ACTIVE_EVENT_KEY, USER_ROLE_KEY]);
    }
  },
}));
