import { create } from 'zustand';
import type { Event as AppEvent, EventParticipant } from '../types';
import { FirestoreService } from '../services/firestore.service';

interface EventStoreState {
  activeEvent: AppEvent | null;
  role: 'host' | 'guest' | null;
  participants: Record<string, EventParticipant>; // keyed by uid
  isLoading: boolean;
  error: string | null;

  // Actions
  createEvent: (_event: Omit<AppEvent, 'id' | 'createdAt'>) => Promise<boolean>;
  joinEvent: (
    _eventId: string,
    _userId: string,
    _joinCode?: string | null,
  ) => Promise<boolean>;
  fetchEvent: (_eventId: string) => Promise<void>;
  addParticipant: (
    _eventId: string,
    _userId: string,
    _role?: 'host' | 'guest',
  ) => Promise<void>;
  removeParticipant: (_eventId: string, _userId: string) => Promise<void>;
  clearError: () => void;
  clearState: () => void;
}

export const useEventStore = create<EventStoreState>((set, _get) => ({
  // Initial state
  activeEvent: null,
  role: null,
  participants: {},
  isLoading: false,
  error: null,

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
      } else {
        set({ isLoading: false });
      }
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

  clearState: () =>
    set({ activeEvent: null, role: null, participants: {}, error: null }),
})); 