import React, { createContext, useContext, ReactNode } from 'react';
import { Theme } from '../../types';

// Creative Light Theme Definition
const CREATIVE_LIGHT_THEME: Theme = {
  colors: {
    // Primary Colors
    primary: '#7C3AED', // Rich Purple
    primaryLight: '#A855F7', // Lighter purple for hover states
    primaryDark: '#6D28D9', // Darker purple for pressed states

    // Accent Colors
    accent: '#EC4899', // Hot Pink
    accentLight: '#F472B6', // Lighter pink for hover states
    accentDark: '#DB2777', // Darker pink for pressed states

    // Semantic Colors
    success: '#10B981', // Emerald
    successLight: '#34D399', // Light emerald
    successDark: '#059669', // Dark emerald

    warning: '#F59E0B', // Amber
    warningLight: '#FBBF24', // Light amber
    warningDark: '#D97706', // Dark amber

    error: '#EF4444', // Rose
    errorLight: '#F87171', // Light rose
    errorDark: '#DC2626', // Dark rose

    // Background & Surface Colors
    bgPrimary: '#FAFAFA', // Main background - clean light
    bgSecondary: '#F8FAFC', // Secondary background - slightly cooler
    surface: '#FFFFFF', // Cards, modals, elevated surfaces
    surfaceElevated: '#FFFFFF', // Higher elevation surfaces

    // Text Colors
    textPrimary: '#1E293B', // Main text - dark slate
    textSecondary: '#64748B', // Secondary text - medium slate
    textTertiary: '#94A3B8', // Tertiary text - light slate
    textInverse: '#FFFFFF', // Text on dark backgrounds

    // Border Colors
    border: '#E2E8F0', // Subtle borders
    borderStrong: '#CBD5E1', // More visible borders
    divider: '#F1F5F9', // Very subtle dividers

    // Interactive States
    interactiveHover: '#F8FAFC', // Hover state background
    interactivePressed: '#F1F5F9', // Pressed state background
    interactiveDisabled: '#F8FAFC', // Disabled state background

    // Special Purpose
    gradientStart: '#7C3AED', // Gradient start (primary)
    gradientEnd: '#EC4899', // Gradient end (accent)
    shadow: '#1E293B', // Shadow color
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    full: 9999,
  },
  shadows: {
    soft: '0 2px 8px rgba(30, 41, 59, 0.08)',
    medium: '0 4px 16px rgba(30, 41, 59, 0.12)',
    strong: '0 8px 32px rgba(30, 41, 59, 0.16)',
  },
};

// Theme Context
const ThemeContext = createContext<Theme | undefined>(undefined);

// Theme Provider Props
interface ThemeProviderProps {
  children: ReactNode;
  theme?: Theme; // Allow custom theme override (useful for event-specific themes later)
}

/**
 * ThemeProvider component that provides theme context throughout the app
 * Uses the Creative Light Theme by default, with support for custom theme overrides
 */
export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  theme = CREATIVE_LIGHT_THEME,
}) => {
  return (
    <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>
  );
};

/**
 * Custom hook to access the current theme
 * Throws an error if used outside of ThemeProvider
 */
export const useTheme = (): Theme => {
  const context = useContext(ThemeContext);

  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }

  return context;
};

/**
 * Custom hook to get theme colors specifically
 * Convenient shorthand for accessing theme.colors
 */
export const useThemeColors = () => {
  const theme = useTheme();
  return theme.colors;
};

/**
 * Custom hook to get theme spacing values
 * Convenient shorthand for accessing theme.spacing
 */
export const useThemeSpacing = () => {
  const theme = useTheme();
  return theme.spacing;
};

/**
 * Custom hook to get theme border radius values
 * Convenient shorthand for accessing theme.borderRadius
 */
export const useThemeBorderRadius = () => {
  const theme = useTheme();
  return theme.borderRadius;
};

/**
 * Custom hook to get theme shadow values
 * Convenient shorthand for accessing theme.shadows
 */
export const useThemeShadows = () => {
  const theme = useTheme();
  return theme.shadows;
};

/**
 * Utility function to create dynamic styles with theme colors
 * Useful for creating styles that need to be computed at runtime
 */
export const createThemeStyles = (theme: Theme) => ({
  // Common style patterns
  primaryButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
  },
  secondaryButton: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  input: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    color: theme.colors.textPrimary,
  },
  gradientBackground: {
    flex: 1,
    // Note: For React Native gradients, you'd use react-native-linear-gradient
    // This is just the color definition
    colors: [theme.colors.gradientStart, theme.colors.gradientEnd],
  },
});

// Export the default theme for direct access if needed
export { CREATIVE_LIGHT_THEME as DEFAULT_THEME };

/**
 * HOC (Higher-Order Component) to inject theme as props
 * Useful for class components or when you need theme as props
 */
export const withTheme = <P extends object>(
  Component: React.ComponentType<P & { theme: Theme }>,
) => {
  return (props: P) => {
    const theme = useTheme();
    return <Component {...props} theme={theme} />;
  };
};
