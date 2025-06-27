import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  User,
  UserCredential,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, firestore } from './firebase/config';
import { User as AppUser, ApiResponse, FirebaseError } from '../types';

export class AuthService {
  /**
   * Register a new user with email and password
   */
  static async register(
    email: string,
    password: string,
    displayName: string,
  ): Promise<ApiResponse<AppUser>> {
    try {
      // Create user with Firebase Auth
      const userCredential: UserCredential =
        await createUserWithEmailAndPassword(auth, email, password);
      const { user } = userCredential;

      // Update the user's display name
      await updateProfile(user, {
        displayName,
      });

      // Create user document in Firestore
      const userData: Omit<AppUser, 'uid'> = {
        email: user.email!,
        displayName,
        createdAt: new Date(),
        lastSeen: new Date(),
      };

      await setDoc(doc(firestore, 'users', user.uid), {
        ...userData,
        createdAt: serverTimestamp(),
        lastSeen: serverTimestamp(),
      });

      // Return the user data
      const appUser: AppUser = {
        uid: user.uid,
        ...userData,
      };

      return {
        success: true,
        data: appUser,
      };
    } catch (error) {
      const firebaseError = error as FirebaseError;
      return {
        success: false,
        error: this.getErrorMessage(firebaseError.code),
      };
    }
  }

  /**
   * Sign in user with email and password
   */
  static async login(
    email: string,
    password: string,
  ): Promise<ApiResponse<AppUser>> {
    try {
      const userCredential: UserCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password,
      );
      const { user } = userCredential;

      // Get user data from Firestore
      const userDoc = await getDoc(doc(firestore, 'users', user.uid));

      if (!userDoc.exists()) {
        return {
          success: false,
          error: 'User data not found. Please contact support.',
        };
      }

      const userData = userDoc.data();
      const appUser: AppUser = {
        uid: user.uid,
        email: user.email!,
        displayName: userData.displayName,
        avatarUrl: userData.avatarUrl,
        createdAt: userData.createdAt?.toDate() || new Date(),
        lastSeen: userData.lastSeen?.toDate() || new Date(),
        activeEventId: userData.activeEventId || null,
        eventRole: userData.eventRole || null,
      };

      // Update last seen timestamp
      await setDoc(
        doc(firestore, 'users', user.uid),
        { lastSeen: serverTimestamp() },
        { merge: true },
      );

      return {
        success: true,
        data: appUser,
      };
    } catch (error) {
      const firebaseError = error as FirebaseError;
      return {
        success: false,
        error: this.getErrorMessage(firebaseError.code),
      };
    }
  }

  /**
   * Sign out the current user
   */
  static async logout(): Promise<ApiResponse<void>> {
    try {
      await signOut(auth);
      return {
        success: true,
      };
    } catch (error) {
      const firebaseError = error as FirebaseError;
      return {
        success: false,
        error: this.getErrorMessage(firebaseError.code),
      };
    }
  }

  /**
   * Send password reset email
   */
  static async resetPassword(email: string): Promise<ApiResponse<void>> {
    try {
      await sendPasswordResetEmail(auth, email);
      return {
        success: true,
      };
    } catch (error) {
      const firebaseError = error as FirebaseError;
      return {
        success: false,
        error: this.getErrorMessage(firebaseError.code),
      };
    }
  }

  /**
   * Get current user
   */
  static getCurrentUser(): User | null {
    return auth.currentUser;
  }

  /**
   * Get user data from Firestore
   */
  static async getUserData(uid: string): Promise<ApiResponse<AppUser>> {
    try {
      const userDoc = await getDoc(doc(firestore, 'users', uid));

      if (!userDoc.exists()) {
        return {
          success: false,
          error: 'User not found',
        };
      }

      const userData = userDoc.data();
      const appUser: AppUser = {
        uid,
        email: userData.email,
        displayName: userData.displayName,
        avatarUrl: userData.avatarUrl,
        createdAt: userData.createdAt?.toDate() || new Date(),
        lastSeen: userData.lastSeen?.toDate() || new Date(),
        activeEventId: userData.activeEventId || null,
        eventRole: userData.eventRole || null,
      };

      return {
        success: true,
        data: appUser,
      };
    } catch (error) {
      const firebaseError = error as FirebaseError;
      return {
        success: false,
        error: this.getErrorMessage(firebaseError.code),
      };
    }
  }

  /**
   * Convert Firebase error codes to user-friendly messages
   */
  private static getErrorMessage(errorCode: string): string {
    switch (errorCode) {
      case 'auth/email-already-in-use':
        return 'An account with this email already exists.';
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/operation-not-allowed':
        return 'Email/password accounts are not enabled.';
      case 'auth/weak-password':
        return 'Password should be at least 6 characters long.';
      case 'auth/user-disabled':
        return 'This account has been disabled.';
      case 'auth/user-not-found':
        return 'No account found with this email address.';
      case 'auth/wrong-password':
        return 'Incorrect password. Please try again.';
      case 'auth/invalid-credential':
        return 'Invalid email or password. Please try again.';
      case 'auth/too-many-requests':
        return 'Too many failed attempts. Please try again later.';
      case 'auth/network-request-failed':
        return 'Network error. Please check your connection.';
      default:
        return 'An unexpected error occurred. Please try again.';
    }
  }
}
