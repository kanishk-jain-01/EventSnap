import React from 'react';
import { AppNavigator } from './src/navigation/AppNavigator';
import { ErrorBoundary } from './src/components/ui/ErrorBoundary';
import { ThemeProvider } from './src/components/ui/ThemeProvider';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import './global.css';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <ErrorBoundary>
          <AppNavigator />
        </ErrorBoundary>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
