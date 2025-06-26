import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../../hooks/useAuth';
import { useThemeColors } from '../../components/ui/ThemeProvider';

export const AuthLoadingScreen: React.FC = () => {
  const { error } = useAuth();
  const colors = useThemeColors();

  return (
    <View className='flex-1 bg-bg-primary justify-center items-center px-6'>
      <StatusBar style='dark' />

      {/* App Logo/Brand */}
      <View className='items-center mb-12'>
        <Text className='text-primary text-5xl font-bold mb-4'>
          EventSnap
        </Text>
        <Text className='text-text-secondary text-lg opacity-80'>
          Loading your experience...
        </Text>
      </View>

      {/* Loading Indicator */}
      <View className='items-center'>
        <ActivityIndicator
          size='large'
          color={colors.primary} // Beautiful purple spinner
          className='mb-4'
        />

        {/* Loading Text */}
        <Text className='text-text-secondary text-base opacity-60'>
          {error ? 'Checking connection...' : 'Authenticating...'}
        </Text>
      </View>

      {/* Error State (if needed) */}
      {error && (
        <View className='mt-8 px-4'>
          <View className='bg-error/20 border border-error rounded-lg p-4'>
            <Text className='text-error text-sm text-center mb-2'>
              Connection Issue
            </Text>
            <Text className='text-text-tertiary text-xs text-center'>
              Having trouble connecting. Please check your internet connection.
            </Text>
          </View>
        </View>
      )}

      {/* Footer */}
      <View className='absolute bottom-12 items-center'>
        <Text className='text-text-tertiary text-xs'>Event-Driven Networking Platform</Text>
        <Text className='text-text-tertiary text-xs mt-1 opacity-60'>
          Internal Testing Version
        </Text>
      </View>
    </View>
  );
};
