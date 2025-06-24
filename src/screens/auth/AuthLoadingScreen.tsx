import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../../hooks/useAuth';

export const AuthLoadingScreen: React.FC = () => {
  const { error } = useAuth();

  return (
    <View className='flex-1 bg-snap-dark justify-center items-center px-6'>
      <StatusBar style='light' />

      {/* App Logo/Brand */}
      <View className='items-center mb-12'>
        <Text className='text-snap-yellow text-5xl font-bold mb-4'>
          Snapchat
        </Text>
        <Text className='text-white text-lg opacity-80'>
          Loading your experience...
        </Text>
      </View>

      {/* Loading Indicator */}
      <View className='items-center'>
        <ActivityIndicator
          size='large'
          color='#FFFC00' // snap-yellow
          className='mb-4'
        />

        {/* Loading Text */}
        <Text className='text-white text-base opacity-60'>
          {error ? 'Checking connection...' : 'Authenticating...'}
        </Text>
      </View>

      {/* Error State (if needed) */}
      {error && (
        <View className='mt-8 px-4'>
          <View className='bg-snap-red/20 border border-snap-red rounded-lg p-4'>
            <Text className='text-snap-red text-sm text-center mb-2'>
              Connection Issue
            </Text>
            <Text className='text-gray-300 text-xs text-center'>
              Having trouble connecting. Please check your internet connection.
            </Text>
          </View>
        </View>
      )}

      {/* Footer */}
      <View className='absolute bottom-12 items-center'>
        <Text className='text-gray-500 text-xs'>Snapchat Clone MVP</Text>
        <Text className='text-gray-600 text-xs mt-1'>
          Internal Testing Version
        </Text>
      </View>
    </View>
  );
};
