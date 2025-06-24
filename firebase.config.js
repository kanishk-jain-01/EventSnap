// Firebase configuration and initialization
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getDatabase } from 'firebase/database';
import { getStorage } from 'firebase/storage';

// Firebase configuration object
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

// Initialize Firebase services
export const auth = getAuth(app);
export const firestore = getFirestore(app);
export const realtimeDb = getDatabase(app);
export const storage = getStorage(app);

// Export the app instance
export default app;
