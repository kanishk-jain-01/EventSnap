/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './App.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
    './index.ts',
  ],
  theme: {
    extend: {
      colors: {
        // Snapchat-inspired color palette
        'snap-yellow': '#FFFC00',
        'snap-dark': '#000000',
        'snap-gray': '#1E1E1E',
        'snap-light-gray': '#2A2A2A',
        'snap-white': '#FFFFFF',
        'snap-blue': '#0EADFF',
        'snap-red': '#FF0040',
        'snap-purple': '#8B5CF6',
        'snap-green': '#00D632',
      },
      fontFamily: {
        // Add custom fonts if needed
        snap: ['Helvetica', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
