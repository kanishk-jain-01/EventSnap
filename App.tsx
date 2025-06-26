import React, { useEffect } from 'react';
import { AppNavigator } from './src/navigation/AppNavigator';
import { ErrorBoundary } from './src/components/ui/ErrorBoundary';
import { ThemeProvider } from './src/components/ui/ThemeProvider';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import './global.css';
import { SnapCleanupService } from './src/services/cleanup/snapCleanup.service';

export default function App() {
  // Run expired snap cleanup once on app launch (best-effort)
  useEffect(() => {
    SnapCleanupService.cleanupExpiredSnaps();
  }, []);

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
