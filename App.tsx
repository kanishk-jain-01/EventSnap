import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Text, View } from 'react-native';
import {
  auth,
  firestore,
  realtimeDb,
  storage,
} from './src/services/firebase/config';
import { onAuthStateChanged, User } from 'firebase/auth';
import './global.css';

export default function App() {
  const [isFirebaseReady, setIsFirebaseReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Initialize Firebase and check connection
    const initializeFirebase = async () => {
      try {
        // Test Firebase services initialization
        const services = {
          auth: !!auth,
          firestore: !!firestore,
          realtimeDb: !!realtimeDb,
          storage: !!storage,
        };

        // eslint-disable-next-line no-console
        console.log('Firebase services initialized:', services);

        // Set up auth state listener
        const unsubscribe = onAuthStateChanged(auth, user => {
          setUser(user);
          // eslint-disable-next-line no-console
          console.log(
            'Auth state changed:',
            user ? 'User logged in' : 'User logged out',
          );
        });

        setIsFirebaseReady(true);
        // eslint-disable-next-line no-console
        console.log('Firebase initialization complete');

        // Return cleanup function
        return unsubscribe;
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Firebase initialization error:', error);
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error occurred';
        setError(`Firebase initialization failed: ${errorMessage}`);
        return null;
      }
    };

    let unsubscribe: (() => void) | null = null;

    initializeFirebase().then(cleanup => {
      unsubscribe = cleanup;
    });

    // Cleanup on unmount
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  // Show error if Firebase failed to initialize
  if (error) {
    return (
      <View className='flex-1 bg-snap-dark items-center justify-center p-5'>
        <Text className='text-snap-red text-xl font-bold mb-2 text-center'>
          Firebase Error
        </Text>
        <Text className='text-white text-sm text-center px-5'>{error}</Text>
        <StatusBar style='auto' />
      </View>
    );
  }

  // Show loading while Firebase initializes
  if (!isFirebaseReady) {
    return (
      <View className='flex-1 bg-snap-dark items-center justify-center p-5'>
        <Text className='text-white text-lg text-center'>
          Initializing Firebase...
        </Text>
        <StatusBar style='auto' />
      </View>
    );
  }

  // Main app content
  return (
    <View className='flex-1 bg-snap-dark items-center justify-center p-5'>
      <Text className='text-snap-yellow text-2xl font-bold mb-2 text-center'>
        Snapchat Clone MVP
      </Text>
      <Text className='text-white text-lg mb-5 text-center'>
        Firebase Connected ✅
      </Text>

      <View className='bg-snap-gray p-4 rounded-lg mb-5 w-full'>
        <Text className='text-white text-sm mb-1 text-center'>
          Auth Status: {user ? 'Logged in' : 'Not logged in'}
        </Text>
        <Text className='text-white text-sm text-center'>
          Services: Auth, Firestore, Realtime DB, Storage
        </Text>
      </View>

      <Text className='text-snap-green text-base text-center mt-2'>
        Ready for development! 🚀
      </Text>

      <View className='mt-5'>
        <Text className='text-snap-blue text-sm text-center mb-2'>
          TailwindCSS + NativeWind ✅
        </Text>
        <Text className='text-snap-purple text-xs text-center'>
          Styling system configured and working!
        </Text>
      </View>

      <StatusBar style='auto' />
    </View>
  );
}
