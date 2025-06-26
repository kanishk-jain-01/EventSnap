import { initializeApp } from 'firebase/app';
// @ts-ignore
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import {
  getFirestore,
  enableNetwork,
  disableNetwork,
} from 'firebase/firestore';
import { getDatabase } from 'firebase/database';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
// Import APP_CONFIG when needed for emulator configuration
// import { APP_CONFIG } from '../../utils/constants';

// Firebase configuration
const firebaseConfig = {
  apiKey: 'AIzaSyC0rt3CzpeDl55_Hmz-xXICyDQv06WR5dI',
  authDomain: 'snapchat-clone-mvp.firebaseapp.com',
  databaseURL: 'https://snapchat-clone-mvp-default-rtdb.firebaseio.com',
  projectId: 'snapchat-clone-mvp',
  storageBucket: 'snapchat-clone-mvp.firebasestorage.app',
  messagingSenderId: '296937733547',
  appId: '1:296937733547:web:55c15e69b776cb704266ee',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth with AsyncStorage persistence
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage),
});

// Initialize other Firebase services
export const firestore = getFirestore(app);
export const realtimeDb = getDatabase(app);
export const storage = getStorage(app);

// Initialize Cloud Functions
export const functions = getFunctions(app, 'us-central1');

// Connect to emulators in development
// Uncomment and import emulator functions if you want to use Firebase emulators
// if (APP_CONFIG.environment === 'development') {
//   connectAuthEmulator(auth, 'http://localhost:9099');
//   connectFirestoreEmulator(firestore, 'localhost', 8080);
//   connectDatabaseEmulator(realtimeDb, 'localhost', 9000);
//   connectStorageEmulator(storage, 'localhost', 9199);
// }

// Offline support functions
export const enableOfflineSupport = async (): Promise<void> => {
  try {
    await enableNetwork(firestore);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error enabling offline support:', error);
  }
};

export const disableOfflineSupport = async (): Promise<void> => {
  try {
    await disableNetwork(firestore);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error disabling offline support:', error);
  }
};

// Export the app instance
export default app;
