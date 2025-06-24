import { useAuthStore } from '../store/authStore';
import { User } from '../types';

export interface UseAuthReturn {
  // State
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

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

  // Utility functions
  isLoggedIn: boolean;
  hasError: boolean;
  userId: string | null;
  userDisplayName: string | null;
  userEmail: string | null;
}

/**
 * Custom hook for authentication logic and state management
 * Provides a clean interface to the authentication store with additional utilities
 */
export const useAuth = (): UseAuthReturn => {
  const {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    logout,
    resetPassword,
    clearError,
  } = useAuthStore();

  return {
    // State
    user,
    isAuthenticated,
    isLoading,
    error,

    // Actions
    login,
    register,
    logout,
    resetPassword,
    clearError,

    // Utility functions
    isLoggedIn: isAuthenticated && user !== null,
    hasError: error !== null,
    userId: user?.uid || null,
    userDisplayName: user?.displayName || null,
    userEmail: user?.email || null,
  };
};

/**
 * Hook to check if user is authenticated (convenience hook)
 */
export const useIsAuthenticated = (): boolean => {
  const { isAuthenticated, user } = useAuthStore();
  return isAuthenticated && user !== null;
};

/**
 * Hook to get current user data (convenience hook)
 */
export const useCurrentUser = (): User | null => {
  const { user } = useAuthStore();
  return user;
};

/**
 * Hook to get authentication loading state (convenience hook)
 */
export const useAuthLoading = (): boolean => {
  const { isLoading } = useAuthStore();
  return isLoading;
};

/**
 * Hook to get authentication error (convenience hook)
 */
export const useAuthError = (): string | null => {
  const { error } = useAuthStore();
  return error;
};
