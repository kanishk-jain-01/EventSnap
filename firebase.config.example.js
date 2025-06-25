// Firebase configuration template
// Copy this file to firebase.config.js and replace with your actual Firebase project values
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getDatabase } from 'firebase/database';
import { getStorage } from 'firebase/storage';

// Firebase configuration object
// Get these values from your Firebase project settings
const firebaseConfig = {
  apiKey: 'your-api-key-here',
  authDomain: 'your-project-id.firebaseapp.com',
  databaseURL: 'https://your-project-id-default-rtdb.firebaseio.com',
  projectId: 'your-project-id',
  storageBucket: 'your-project-id.firebasestorage.app',
  messagingSenderId: 'your-messaging-sender-id',
  appId: 'your-app-id',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const firestore = getFirestore(app);
export const realtimeDb = getDatabase(app);
export const storage = getStorage(app);

// Export the app instance
export default app; 