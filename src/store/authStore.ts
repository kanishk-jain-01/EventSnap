import { create } from 'zustand';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from '../services/firebase/config';
import { AuthService } from '../services/auth.service';
import { AuthState } from '../types';
import { useEventStore } from './eventStore';

interface AuthStore extends AuthState {
  // Actions
  login: (_email: string, _password: string) => Promise<void>;
  register: (
    _email: string,
    _password: string,
    _displayName: string,
  ) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (_email: string) => Promise<void>;
  clearError: () => void;
  initializeAuth: () => void;
  setLoading: (_loading: boolean) => void;
}

export const useAuthStore = create<AuthStore>((set, _get) => ({
  // Initial state
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  // Actions
  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });

    try {
      const response = await AuthService.login(email, password);

      if (response.success && response.data) {
        set({
          user: response.data,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
      } else {
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: response.error || 'Login failed',
        });
      }
    } catch {
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: 'An unexpected error occurred during login',
      });
    }
  },

  register: async (email: string, password: string, displayName: string) => {
    set({ isLoading: true, error: null });

    try {
      const response = await AuthService.register(email, password, displayName);

      if (response.success && response.data) {
        set({
          user: response.data,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
      } else {
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: response.error || 'Registration failed',
        });
      }
    } catch {
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: 'An unexpected error occurred during registration',
      });
    }
  },

  logout: async () => {
    set({ isLoading: true, error: null });

    try {
      const response = await AuthService.logout();

      if (response.success) {
        // Clear event store when logging out
        useEventStore.getState().clearState();

        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        });
      } else {
        set({
          isLoading: false,
          error: response.error || 'Logout failed',
        });
      }
    } catch {
      set({
        isLoading: false,
        error: 'An unexpected error occurred during logout',
      });
    }
  },

  resetPassword: async (email: string) => {
    set({ isLoading: true, error: null });

    try {
      const response = await AuthService.resetPassword(email);

      if (response.success) {
        set({
          isLoading: false,
          error: null,
        });
      } else {
        set({
          isLoading: false,
          error: response.error || 'Password reset failed',
        });
      }
    } catch {
      set({
        isLoading: false,
        error: 'An unexpected error occurred during password reset',
      });
    }
  },

  clearError: () => {
    set({ error: null });
  },

  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },

  initializeAuth: () => {
    set({ isLoading: true });

    // Set up Firebase auth state listener
    const unsubscribe = onAuthStateChanged(
      auth,
      async (firebaseUser: FirebaseUser | null) => {
        if (firebaseUser) {
          // User is signed in, get user data from Firestore
          try {
            const response = await AuthService.getUserData(firebaseUser.uid);

            if (response.success && response.data) {
              set({
                user: response.data,
                isAuthenticated: true,
                isLoading: false,
                error: null,
              });
            } else {
              // Firebase user exists but no Firestore data
              set({
                user: null,
                isAuthenticated: false,
                isLoading: false,
                error: 'User data not found',
              });
            }
          } catch {
            set({
              user: null,
              isAuthenticated: false,
              isLoading: false,
              error: 'Failed to load user data',
            });
          }
        } else {
          // User is signed out - clear event store as well
          useEventStore.getState().clearState();

          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
        }
      },
    );

    // Store the unsubscribe function for cleanup
    // Note: In a real app, you'd want to call this when the app unmounts
    // For now, we'll rely on Firebase's automatic cleanup
    return unsubscribe;
  },
}));

// Initialize auth state when the store is created
useAuthStore.getState().initializeAuth();
