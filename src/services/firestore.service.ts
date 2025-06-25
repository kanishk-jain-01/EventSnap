import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  Unsubscribe,
  writeBatch,
  arrayUnion,
} from 'firebase/firestore';
import { firestore } from './firebase/config';
import type { Story } from '../types';
import { ApiResponse, Snap, User } from '../types';

// Firestore collection names
export const COLLECTIONS = {
  USERS: 'users',
  SNAPS: 'snaps',
  STORIES: 'stories',
  CHATS: 'chats',
  MESSAGES: 'messages',
  CONTACTS: 'contacts', // Sub-collection name for user contacts (planned)
} as const;

// Snap document interface for Firestore
export interface SnapDocument {
  senderId: string;
  receiverId: string;
  imageUrl: string;
  imagePath: string; // Storage path for cleanup
  timestamp: Timestamp;
  expiresAt: Timestamp;
  viewed: boolean;
  viewedAt?: Timestamp;
  metadata?: {
    fileSize: number;
    contentType: string;
    compressed: boolean;
    originalSize?: number;
  };
}

// Story document interface for Firestore
export interface StoryDocument {
  userId: string;
  imageUrl: string;
  imagePath: string; // Storage path for cleanup
  timestamp: Timestamp;
  expiresAt: Timestamp;
  viewedBy: string[];
  metadata?: {
    fileSize: number;
    contentType: string;
    compressed: boolean;
  };
}

// User document interface for Firestore
export interface UserDocument {
  email: string;
  displayName: string;
  avatarUrl?: string;
  createdAt: Timestamp;
  lastSeen: Timestamp;
  snapCount?: number;
  storyCount?: number;
  contacts?: string[]; // UIDs of friends/contacts
}

export class FirestoreService {
  /**
   * SNAP OPERATIONS
   */

  /**
   * Create a new snap document
   */
  static async createSnap(
    senderId: string,
    receiverId: string,
    imageUrl: string,
    imagePath: string,
    metadata?: SnapDocument['metadata'],
  ): Promise<ApiResponse<Snap>> {
    try {
      // Calculate expiration time (24 hours from now)
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      const snapData: SnapDocument = {
        senderId,
        receiverId,
        imageUrl,
        imagePath,
        timestamp: serverTimestamp() as Timestamp,
        expiresAt: Timestamp.fromDate(expiresAt),
        viewed: false,
        metadata,
      };

      const docRef = await addDoc(
        collection(firestore, COLLECTIONS.SNAPS),
        snapData,
      );

      // Convert to app format
      const snap: Snap = {
        id: docRef.id,
        senderId,
        receiverId,
        imageUrl,
        timestamp: now,
        expiresAt,
        viewed: false,
      };

      return {
        success: true,
        data: snap,
      };
    } catch (_error) {
      return {
        success: false,
        error: 'Failed to create snap',
      };
    }
  }

  /**
   * Get a snap by ID
   */
  static async getSnap(snapId: string): Promise<ApiResponse<Snap>> {
    try {
      const docRef = doc(firestore, COLLECTIONS.SNAPS, snapId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return {
          success: false,
          error: 'Snap not found',
        };
      }

      const data = docSnap.data() as SnapDocument;
      const snap: Snap = {
        id: docSnap.id,
        senderId: data.senderId,
        receiverId: data.receiverId,
        imageUrl: data.imageUrl,
        timestamp: data.timestamp.toDate(),
        expiresAt: data.expiresAt.toDate(),
        viewed: data.viewed,
        viewedAt: data.viewedAt?.toDate(),
      };

      return {
        success: true,
        data: snap,
      };
    } catch (_error) {
      return {
        success: false,
        error: 'Failed to get snap',
      };
    }
  }

  /**
   * Get received snaps for a user
   */
  static async getReceivedSnaps(
    userId: string,
    limitCount: number = 50,
  ): Promise<ApiResponse<Snap[]>> {
    try {
      const q = query(
        collection(firestore, COLLECTIONS.SNAPS),
        where('receiverId', '==', userId),
        where('expiresAt', '>', new Date()),
        orderBy('expiresAt'),
        orderBy('timestamp', 'desc'),
        limit(limitCount),
      );

      const querySnapshot = await getDocs(q);
      const snaps: Snap[] = [];

      querySnapshot.forEach(doc => {
        const data = doc.data() as SnapDocument;
        snaps.push({
          id: doc.id,
          senderId: data.senderId,
          receiverId: data.receiverId,
          imageUrl: data.imageUrl,
          timestamp: data.timestamp.toDate(),
          expiresAt: data.expiresAt.toDate(),
          viewed: data.viewed,
          viewedAt: data.viewedAt?.toDate(),
        });
      });

      return {
        success: true,
        data: snaps,
      };
    } catch (_error) {
      return {
        success: false,
        error: 'Failed to get received snaps',
      };
    }
  }

  /**
   * Get sent snaps for a user
   */
  static async getSentSnaps(
    userId: string,
    limitCount: number = 50,
  ): Promise<ApiResponse<Snap[]>> {
    try {
      const q = query(
        collection(firestore, COLLECTIONS.SNAPS),
        where('senderId', '==', userId),
        orderBy('timestamp', 'desc'),
        limit(limitCount),
      );

      const querySnapshot = await getDocs(q);
      const snaps: Snap[] = [];

      querySnapshot.forEach(doc => {
        const data = doc.data() as SnapDocument;
        snaps.push({
          id: doc.id,
          senderId: data.senderId,
          receiverId: data.receiverId,
          imageUrl: data.imageUrl,
          timestamp: data.timestamp.toDate(),
          expiresAt: data.expiresAt.toDate(),
          viewed: data.viewed,
          viewedAt: data.viewedAt?.toDate(),
        });
      });

      return {
        success: true,
        data: snaps,
      };
    } catch (_error) {
      return {
        success: false,
        error: 'Failed to get sent snaps',
      };
    }
  }

  /**
   * Mark a snap as viewed
   */
  static async markSnapAsViewed(snapId: string): Promise<ApiResponse<void>> {
    try {
      const docRef = doc(firestore, COLLECTIONS.SNAPS, snapId);
      await updateDoc(docRef, {
        viewed: true,
        viewedAt: serverTimestamp(),
      });

      return {
        success: true,
      };
    } catch (_error) {
      return {
        success: false,
        error: 'Failed to mark snap as viewed',
      };
    }
  }

  /**
   * Delete a snap
   */
  static async deleteSnap(snapId: string): Promise<ApiResponse<void>> {
    try {
      const docRef = doc(firestore, COLLECTIONS.SNAPS, snapId);
      await deleteDoc(docRef);

      return {
        success: true,
      };
    } catch (_error) {
      return {
        success: false,
        error: 'Failed to delete snap',
      };
    }
  }

  /**
   * Listen to received snaps in real-time
   */
  static subscribeToReceivedSnaps(
    userId: string,
    callback: (_snaps: Snap[]) => void,
    onError?: (_error: string) => void,
  ): Unsubscribe {
    const q = query(
      collection(firestore, COLLECTIONS.SNAPS),
      where('receiverId', '==', userId),
      where('expiresAt', '>', new Date()),
      orderBy('expiresAt'),
      orderBy('timestamp', 'desc'),
    );

    return onSnapshot(
      q,
      querySnapshot => {
        const snaps: Snap[] = [];
        querySnapshot.forEach(doc => {
          const data = doc.data() as SnapDocument;
          snaps.push({
            id: doc.id,
            senderId: data.senderId,
            receiverId: data.receiverId,
            imageUrl: data.imageUrl,
            timestamp: data.timestamp.toDate(),
            expiresAt: data.expiresAt.toDate(),
            viewed: data.viewed,
            viewedAt: data.viewedAt?.toDate(),
          });
        });
        callback(snaps);
      },
      error => {
        onError?.(error.message);
      },
    );
  }

  /**
   * STORY OPERATIONS
   */

  /**
   * Create a new story document
   */
  static async createStory(
    userId: string,
    imageUrl: string,
    imagePath: string,
    metadata?: StoryDocument['metadata'],
  ): Promise<ApiResponse<Story>> {
    try {
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      const storyData: StoryDocument = {
        userId,
        imageUrl,
        imagePath,
        timestamp: serverTimestamp() as Timestamp,
        expiresAt: Timestamp.fromDate(expiresAt),
        viewedBy: [],
        metadata,
      };

      const docRef = await addDoc(
        collection(firestore, COLLECTIONS.STORIES),
        storyData,
      );

      const story: Story = {
        id: docRef.id,
        userId,
        imageUrl,
        timestamp: now,
        expiresAt,
        viewedBy: [],
      };

      return { success: true, data: story };
    } catch (_error) {
      return { success: false, error: 'Failed to create story' };
    }
  }

  /**
   * Get active stories (non-expired)
   */
  static async getActiveStories(limitCount: number = 100): Promise<
    ApiResponse<Story[]>
  > {
    try {
      const q = query(
        collection(firestore, COLLECTIONS.STORIES),
        where('expiresAt', '>', new Date()),
        orderBy('expiresAt', 'asc'),
        orderBy('timestamp', 'desc'),
        limit(limitCount),
      );

      const querySnapshot = await getDocs(q);
      const stories: Story[] = [];
      querySnapshot.forEach(docSnap => {
        const data = docSnap.data() as StoryDocument;
        stories.push({
          id: docSnap.id,
          userId: data.userId,
          imageUrl: data.imageUrl,
          timestamp: data.timestamp.toDate(),
          expiresAt: data.expiresAt.toDate(),
          viewedBy: data.viewedBy,
        });
      });

      return { success: true, data: stories };
    } catch (_error) {
      return { success: false, error: 'Failed to get stories' };
    }
  }

  /**
   * Listen to active stories in real-time
   */
  static subscribeToStories(
    callback: (_stories: Story[]) => void,
    onError?: (_error: string) => void,
  ): Unsubscribe {
    const q = query(
      collection(firestore, COLLECTIONS.STORIES),
      where('expiresAt', '>', new Date()),
      orderBy('expiresAt', 'asc'),
      orderBy('timestamp', 'desc'),
    );

    return onSnapshot(
      q,
      snapshot => {
        const stories: Story[] = [];
        snapshot.forEach(docSnap => {
          const data = docSnap.data() as StoryDocument;
          stories.push({
            id: docSnap.id,
            userId: data.userId,
            imageUrl: data.imageUrl,
            timestamp: data.timestamp.toDate(),
            expiresAt: data.expiresAt.toDate(),
            viewedBy: data.viewedBy,
          });
        });
        callback(stories);
      },
      error => onError?.(error.message),
    );
  }

  /**
   * Mark a story as viewed by the current user (idempotent)
   */
  static async markStoryViewed(
    storyId: string,
    viewerId: string,
  ): Promise<ApiResponse<void>> {
    try {
      const storyRef = doc(firestore, COLLECTIONS.STORIES, storyId);
      await updateDoc(storyRef, {
        viewedBy: arrayUnion(viewerId),
      });

      return { success: true };
    } catch (_error) {
      return { success: false, error: 'Failed to mark story viewed' };
    }
  }

  /**
   * Delete a story by ID
   */
  static async deleteStory(storyId: string): Promise<ApiResponse<void>> {
    try {
      await deleteDoc(doc(firestore, COLLECTIONS.STORIES, storyId));
      return {
        success: true,
      };
    } catch (_error) {
      return {
        success: false,
        error: 'Failed to delete story',
      };
    }
  }

  /**
   * Delete expired stories (expiresAt <= now)
   */
  static async deleteExpiredStories(): Promise<ApiResponse<number>> {
    try {
      const q = query(
        collection(firestore, COLLECTIONS.STORIES),
        where('expiresAt', '<=', new Date()),
      );

      const querySnapshot = await getDocs(q);
      const batch = writeBatch(firestore);
      let deleteCount = 0;

      querySnapshot.forEach(docSnap => {
        batch.delete(docSnap.ref);
        deleteCount += 1;
      });

      if (deleteCount > 0) {
        await batch.commit();
      }

      return {
        success: true,
        data: deleteCount,
      };
    } catch (_error) {
      return {
        success: false,
        error: 'Failed to delete expired stories',
      };
    }
  }

  /**
   * Get expired stories along with their imagePath for storage cleanup
   */
  static async getExpiredStoriesForCleanup(): Promise<
    ApiResponse<(StoryDocument & { id: string })[]>
  > {
    try {
      const q = query(
        collection(firestore, COLLECTIONS.STORIES),
        where('expiresAt', '<=', new Date()),
      );

      const querySnapshot = await getDocs(q);
      const expiredStories: Array<StoryDocument & { id: string }> = [];

      querySnapshot.forEach(docSnap => {
        const data = docSnap.data() as StoryDocument;
        expiredStories.push({
          ...data,
          id: docSnap.id,
        });
      });

      return {
        success: true,
        data: expiredStories,
      };
    } catch (_error) {
      return {
        success: false,
        error: 'Failed to get expired stories',
      };
    }
  }

  /**
   * USER OPERATIONS
   */

  /**
   * Create or update user document
   */
  static async createOrUpdateUser(user: User): Promise<ApiResponse<void>> {
    try {
      const userDoc: UserDocument = {
        email: user.email,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        createdAt: Timestamp.fromDate(user.createdAt),
        lastSeen: serverTimestamp() as Timestamp,
      };

      await setDoc(doc(firestore, COLLECTIONS.USERS, user.uid), userDoc, {
        merge: true,
      });

      return {
        success: true,
      };
    } catch (_error) {
      return {
        success: false,
        error: 'Failed to create/update user',
      };
    }
  }

  /**
   * Get user by ID
   */
  static async getUser(userId: string): Promise<ApiResponse<User>> {
    try {
      const docRef = doc(firestore, COLLECTIONS.USERS, userId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return {
          success: false,
          error: 'User not found',
        };
      }

      const data = docSnap.data() as UserDocument;
      const user: User = {
        uid: userId,
        email: data.email,
        displayName: data.displayName,
        avatarUrl: data.avatarUrl,
        createdAt: data.createdAt.toDate(),
        lastSeen: data.lastSeen.toDate(),
      };

      return {
        success: true,
        data: user,
      };
    } catch (_error) {
      return {
        success: false,
        error: 'Failed to get user',
      };
    }
  }

  /**
   * Get all users (for recipient selection)
   */
  static async getAllUsers(
    excludeUserId?: string,
    limitCount: number = 100,
  ): Promise<ApiResponse<User[]>> {
    try {
      const q = query(
        collection(firestore, COLLECTIONS.USERS),
        orderBy('displayName'),
        limit(limitCount),
      );

      const querySnapshot = await getDocs(q);
      const users: User[] = [];

      querySnapshot.forEach(doc => {
        if (doc.id !== excludeUserId) {
          const data = doc.data() as UserDocument;
          users.push({
            uid: doc.id,
            email: data.email,
            displayName: data.displayName,
            avatarUrl: data.avatarUrl,
            createdAt: data.createdAt.toDate(),
            lastSeen: data.lastSeen.toDate(),
          });
        }
      });

      return {
        success: true,
        data: users,
      };
    } catch (_error) {
      return {
        success: false,
        error: 'Failed to get users',
      };
    }
  }

  /**
   * Search users by display name (case-insensitive prefix match)
   *
   * NOTE: Firestore requires a composite index for range queries on strings. Ensure
   * an index exists on (displayName, email) if orderBy is modified.
   */
  static async searchUsers(
    searchText: string,
    limitCount: number = 20,
  ): Promise<ApiResponse<User[]>> {
    try {
      if (!searchText) {
        // fall back to all users when no query provided
        return this.getAllUsers(undefined, limitCount);
      }

      const normalized = searchText.trim().toLowerCase();

      const q = query(
        collection(firestore, COLLECTIONS.USERS),
        orderBy('displayName'),
        where('displayName', '>=', normalized),
        where('displayName', '<=', normalized + '\uf8ff'),
        limit(limitCount),
      );

      const querySnapshot = await getDocs(q);
      const users: User[] = [];

      querySnapshot.forEach(doc => {
        const data = doc.data() as UserDocument;
        users.push({
          uid: doc.id,
          email: data.email,
          displayName: data.displayName,
          avatarUrl: data.avatarUrl,
          createdAt: data.createdAt.toDate(),
          lastSeen: data.lastSeen.toDate(),
        });
      });

      return {
        success: true,
        data: users,
      };
    } catch (_error) {
      return {
        success: false,
        error: 'Failed to search users',
      };
    }
  }

  /**
   * CLEANUP OPERATIONS
   */

  /**
   * Delete expired snaps
   */
  static async deleteExpiredSnaps(): Promise<ApiResponse<number>> {
    try {
      const q = query(
        collection(firestore, COLLECTIONS.SNAPS),
        where('expiresAt', '<=', new Date()),
      );

      const querySnapshot = await getDocs(q);
      const batch = writeBatch(firestore);
      let deleteCount = 0;

      querySnapshot.forEach(doc => {
        batch.delete(doc.ref);
        deleteCount++;
      });

      if (deleteCount > 0) {
        await batch.commit();
      }

      return {
        success: true,
        data: deleteCount,
      };
    } catch (_error) {
      return {
        success: false,
        error: 'Failed to delete expired snaps',
      };
    }
  }

  /**
   * Get expired snaps for storage cleanup
   */
  static async getExpiredSnapsForCleanup(): Promise<
    ApiResponse<SnapDocument[]>
  > {
    try {
      const q = query(
        collection(firestore, COLLECTIONS.SNAPS),
        where('expiresAt', '<=', new Date()),
      );

      const querySnapshot = await getDocs(q);
      const expiredSnaps: SnapDocument[] = [];

      querySnapshot.forEach(doc => {
        const data = doc.data() as SnapDocument;
        expiredSnaps.push({
          ...data,
          // Add document ID for cleanup reference
          id: doc.id,
        } as SnapDocument & { id: string });
      });

      return {
        success: true,
        data: expiredSnaps,
      };
    } catch (_error) {
      return {
        success: false,
        error: 'Failed to get expired snaps',
      };
    }
  }

  /**
   * UTILITY FUNCTIONS
   */

  /**
   * Generate a chat ID between two users
   */
  static generateChatId(userId1: string, userId2: string): string {
    return [userId1, userId2].sort().join('_');
  }

  /**
   * Check if a document exists
   */
  static async documentExists(
    collectionName: string,
    documentId: string,
  ): Promise<boolean> {
    try {
      const docRef = doc(firestore, collectionName, documentId);
      const docSnap = await getDoc(docRef);
      return docSnap.exists();
    } catch (_error) {
      return false;
    }
  }

  /**
   * Get document count in a collection (with query)
   */
  static async getDocumentCount(
    collectionName: string,
    whereClause?: Parameters<typeof where>,
  ): Promise<number> {
    try {
      const collectionRef = collection(firestore, collectionName);

      if (whereClause) {
        const q = query(collectionRef, where(...whereClause));
        const snapshot = await getDocs(q);
        return snapshot.size;
      } else {
        const snapshot = await getDocs(collectionRef);
        return snapshot.size;
      }
    } catch (_error) {
      return 0;
    }
  }
}
