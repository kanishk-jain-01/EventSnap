import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuthStore } from '../store/authStore';
import { AuthNavigator } from './AuthNavigator';
import { MainNavigator } from './MainNavigator';
import { AuthLoadingScreen } from '../screens/auth/AuthLoadingScreen';
import { RootStackParamList } from '../types';

const RootStack = createNativeStackNavigator<RootStackParamList>();

export const AppNavigator: React.FC = () => {
  const { initializeAuth, isAuthenticated, isLoading, user } = useAuthStore();

  useEffect(() => {
    // Initialize authentication when the app starts
    initializeAuth();
  }, [initializeAuth]);

  // Show loading screen while determining auth state
  if (isLoading) {
    return <AuthLoadingScreen />;
  }

  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated && user ? (
          // User is authenticated, show main app
          <RootStack.Screen name='Main' component={MainNavigator} />
        ) : (
          // User is not authenticated, show auth flow
          <RootStack.Screen name='Auth' component={AuthNavigator} />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
};
