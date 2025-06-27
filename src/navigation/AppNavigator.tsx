import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuthStore } from '../store/authStore';
import { useEventStore } from '../store/eventStore';
import { AuthNavigator } from './AuthNavigator';
import { MainNavigator } from './MainNavigator';
import { AuthLoadingScreen } from '../screens/auth/AuthLoadingScreen';
import { EventSelectionScreen } from '../screens/auth/EventSelectionScreen';
import { EventSetupScreen } from '../screens/organizer/EventSetupScreen';
import { RootStackParamList } from './types';

const RootStack = createNativeStackNavigator<RootStackParamList>();

export const AppNavigator: React.FC = () => {
  const { initializeAuth, isAuthenticated, isLoading, user } = useAuthStore();
  const { isInitialized, initializeEventStore } = useEventStore();

  useEffect(() => {
    // Initialize authentication when the app starts
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    // Initialize event store when user is authenticated
    if (isAuthenticated && user?.uid && !isInitialized) {
      initializeEventStore(user.uid);
    }
  }, [isAuthenticated, user?.uid, isInitialized, initializeEventStore]);

  // Show loading screen while determining auth state or loading event data
  if (isLoading || (isAuthenticated && user && !isInitialized)) {
    return <AuthLoadingScreen />;
  }

  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated && user ? (
          // User is authenticated - check if they have an active event in their database record
          user.activeEventId && user.eventRole ? (
            // User has an active event, show main app
            <RootStack.Screen name='Main' component={MainNavigator} />
          ) : (
            // User needs to select/join an event first
            <RootStack.Screen
              name='EventSelection'
              component={EventSelectionScreen}
            />
          )
        ) : (
          // User is not authenticated, show auth flow
          <RootStack.Screen name='Auth' component={AuthNavigator} />
        )}

        {/* Event Setup Screen - accessible when authenticated */}
        {isAuthenticated && user && (
          <RootStack.Screen name='EventSetup' component={EventSetupScreen} />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
};
