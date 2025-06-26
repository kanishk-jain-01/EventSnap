/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './App.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
    './index.ts',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Modern Creative Event Theme - Light Version
        // Primary Colors
        primary: '#7C3AED', // Rich Purple - main brand color
        'primary-light': '#A855F7', // Lighter purple for hover states
        'primary-dark': '#6D28D9', // Darker purple for pressed states

        // Accent Colors
        accent: '#EC4899', // Hot Pink - vibrant highlights
        'accent-light': '#F472B6', // Lighter pink for hover states
        'accent-dark': '#DB2777', // Darker pink for pressed states

        // Semantic Colors
        success: '#10B981', // Emerald - positive actions
        'success-light': '#34D399', // Light emerald
        'success-dark': '#059669', // Dark emerald

        warning: '#F59E0B', // Amber - attention/warnings
        'warning-light': '#FBBF24', // Light amber
        'warning-dark': '#D97706', // Dark amber

        error: '#EF4444', // Rose - errors/danger
        'error-light': '#F87171', // Light rose
        'error-dark': '#DC2626', // Dark rose

        // Background & Surface Colors
        'bg-primary': '#FAFAFA', // Main background - clean light
        'bg-secondary': '#F8FAFC', // Secondary background - slightly cooler
        surface: '#FFFFFF', // Cards, modals, elevated surfaces
        'surface-elevated': '#FFFFFF', // Higher elevation surfaces

        // Text Colors
        'text-primary': '#1E293B', // Main text - dark slate
        'text-secondary': '#64748B', // Secondary text - medium slate
        'text-tertiary': '#94A3B8', // Tertiary text - light slate
        'text-inverse': '#FFFFFF', // Text on dark backgrounds

        // Border & Divider Colors
        border: '#E2E8F0', // Subtle borders
        'border-strong': '#CBD5E1', // More visible borders
        divider: '#F1F5F9', // Very subtle dividers

        // Interactive States
        'interactive-hover': '#F8FAFC', // Hover state background
        'interactive-pressed': '#F1F5F9', // Pressed state background
        'interactive-disabled': '#F8FAFC', // Disabled state background

        // Special Purpose
        'gradient-start': '#7C3AED', // Gradient start (primary)
        'gradient-end': '#EC4899', // Gradient end (accent)
        shadow: '#1E293B', // Shadow color
      },
      fontFamily: {
        // Modern font stack
        primary: ['Inter', 'system-ui', 'sans-serif'],
        secondary: ['SF Pro Display', 'Helvetica', 'Arial', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 2px 8px rgba(30, 41, 59, 0.08)',
        medium: '0 4px 16px rgba(30, 41, 59, 0.12)',
        strong: '0 8px 32px rgba(30, 41, 59, 0.16)',
      },
    },
  },
  plugins: [],
};
