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
import type { Event as AppEvent } from '../types';
import { ApiResponse, Snap, User } from '../types';

// Firestore collection names
export const COLLECTIONS = {
  USERS: 'users',
  SNAPS: 'snaps',
  STORIES: 'stories',
  CHATS: 'chats',
  MESSAGES: 'messages',
  EVENTS: 'events',
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
  eventId?: string;
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
  eventId?: string;
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
  // Event tracking fields - replaces AsyncStorage
  activeEventId?: string | null;
  eventRole?: 'host' | 'guest' | null;
}

// Contact document interface for Firestore
export interface ContactDocument {
  createdAt: Timestamp;
  status: 'accepted'; // MVP uses auto-accepted contacts
}

/**
 * EVENT (Event-Driven Networking) document interface for Firestore
 */
export interface EventDocument {
  name: string;
  joinCode: string;
  startTime: Timestamp;
  endTime: Timestamp;
  hostUid: string;
  assets: string[];
  createdAt: Timestamp;
}

/** Participant sub-document interface */
export interface EventParticipantDocument {
  role: 'host' | 'guest';
  joinedAt: Timestamp;
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
    eventId?: string,
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
        eventId,
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
        eventId,
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
        eventId: data.eventId,
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
          eventId: data.eventId,
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
          eventId: data.eventId,
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
            eventId: data.eventId,
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
   * Get received snaps for a user in a specific event
   */
  static async getReceivedSnapsForEvent(
    userId: string,
    eventId: string,
    limitCount: number = 50,
  ): Promise<ApiResponse<Snap[]>> {
    try {
      const q = query(
        collection(firestore, COLLECTIONS.SNAPS),
        where('receiverId', '==', userId),
        where('eventId', '==', eventId),
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
          eventId: data.eventId,
        });
      });

      return {
        success: true,
        data: snaps,
      };
    } catch (_error) {
      return {
        success: false,
        error: 'Failed to get event snaps',
      };
    }
  }

  /**
   * Listen to received snaps for a specific event in real-time
   */
  static subscribeToReceivedSnapsForEvent(
    userId: string,
    eventId: string,
    callback: (_snaps: Snap[]) => void,
    onError?: (_error: string) => void,
  ): Unsubscribe {
    const q = query(
      collection(firestore, COLLECTIONS.SNAPS),
      where('receiverId', '==', userId),
      where('eventId', '==', eventId),
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
            eventId: data.eventId,
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
   * Create a snap with host-only validation for events
   * For event snaps, only hosts can send snaps to all participants
   */
  static async createEventSnap(
    senderId: string,
    eventId: string,
    imageUrl: string,
    imagePath: string,
    metadata?: SnapDocument['metadata'],
  ): Promise<ApiResponse<Snap[]>> {
    try {
      // Verify sender is host of the event
      const eventRes = await this.getActiveEvent(eventId);
      if (!eventRes.success || !eventRes.data) {
        return {
          success: false,
          error: 'Event not found',
        };
      }

      if (eventRes.data.hostUid !== senderId) {
        return {
          success: false,
          error: 'Only event hosts can send snaps to participants',
        };
      }

      // Get all event participants
      const participantsQuery = query(
        collection(firestore, COLLECTIONS.EVENTS, eventId, 'participants'),
      );

      const participantsSnapshot = await getDocs(participantsQuery);
      const participants: string[] = [];

      participantsSnapshot.forEach(doc => {
        participants.push(doc.id); // doc.id is the participant's uid
      });

      if (participants.length === 0) {
        return {
          success: false,
          error: 'No participants found in event',
        };
      }

      // Create snaps for all participants except the sender
      const recipientIds = participants.filter(uid => uid !== senderId);
      const createdSnaps: Snap[] = [];

      // Calculate expiration time (24 hours from now)
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      // Use batch write for efficiency
      const batch = writeBatch(firestore);

      for (const recipientId of recipientIds) {
        const snapData: SnapDocument = {
          senderId,
          receiverId: recipientId,
          imageUrl,
          imagePath,
          timestamp: serverTimestamp() as Timestamp,
          expiresAt: Timestamp.fromDate(expiresAt),
          viewed: false,
          metadata,
          eventId,
        };

        const docRef = doc(collection(firestore, COLLECTIONS.SNAPS));
        batch.set(docRef, snapData);

        // Add to return array
        createdSnaps.push({
          id: docRef.id,
          senderId,
          receiverId: recipientId,
          imageUrl,
          timestamp: now,
          expiresAt,
          viewed: false,
          eventId,
        });
      }

      await batch.commit();

      return {
        success: true,
        data: createdSnaps,
      };
    } catch (_error) {
      return {
        success: false,
        error: 'Failed to create event snap',
      };
    }
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
    eventId?: string,
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
        eventId,
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
        eventId,
      };

      return { success: true, data: story };
    } catch (_error) {
      return { success: false, error: 'Failed to create story' };
    }
  }

  /**
   * Get active stories (non-expired)
   */
  static async getActiveStories(
    limitCount: number = 100,
  ): Promise<ApiResponse<Story[]>> {
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
          eventId: data.eventId,
        });
      });

      return { success: true, data: stories };
    } catch (_error) {
      return { success: false, error: 'Failed to get stories' };
    }
  }

  /**
   * Get active stories for a specific event (non-expired)
   */
  static async getActiveStoriesForEvent(
    eventId: string,
    limitCount: number = 100,
  ): Promise<ApiResponse<Story[]>> {
    try {
      const q = query(
        collection(firestore, COLLECTIONS.STORIES),
        where('eventId', '==', eventId),
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
          eventId: data.eventId,
        });
      });

      return { success: true, data: stories };
    } catch (_error) {
      return { success: false, error: 'Failed to get event stories' };
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
            eventId: data.eventId,
          });
        });
        callback(stories);
      },
      error => onError?.(error.message),
    );
  }

  /**
   * Listen to active stories for a specific event in real-time
   */
  static subscribeToStoriesForEvent(
    eventId: string,
    callback: (_stories: Story[]) => void,
    onError?: (_error: string) => void,
  ): Unsubscribe {
    const q = query(
      collection(firestore, COLLECTIONS.STORIES),
      where('eventId', '==', eventId),
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
            eventId: data.eventId,
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
        activeEventId: user.activeEventId || null,
        eventRole: user.eventRole || null,
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
   * Update user's active event information
   */
  static async updateUserActiveEvent(
    userId: string,
    activeEventId: string | null,
    eventRole: 'host' | 'guest' | null,
  ): Promise<ApiResponse<void>> {
    try {
      await updateDoc(doc(firestore, COLLECTIONS.USERS, userId), {
        activeEventId: activeEventId,
        eventRole: eventRole,
        lastSeen: serverTimestamp(),
      });

      return {
        success: true,
      };
    } catch (_error) {
      return {
        success: false,
        error: 'Failed to update user active event',
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
        activeEventId: data.activeEventId || null,
        eventRole: data.eventRole || null,
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
            activeEventId: data.activeEventId || null,
            eventRole: data.eventRole || null,
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
    excludeUserId?: string,
  ): Promise<ApiResponse<User[]>> {
    try {
      // Always fetch a reasonable number of users client-side then filter. For the small MVP dataset this
      // is acceptable and avoids Firestore case-sensitivity limitations.
      const allRes = await this.getAllUsers(excludeUserId, 500);
      if (!allRes.success || !allRes.data) {
        return {
          success: false,
          error: allRes.error || 'Failed to fetch users',
        };
      }

      const normalized = searchText.trim().toLowerCase();
      let users = allRes.data;

      // Filter by query (case-insensitive displayName prefix match)
      if (normalized) {
        users = users.filter(u =>
          u.displayName.toLowerCase().startsWith(normalized),
        );
      }

      // Optionally exclude a specific user (e.g. current user)
      if (excludeUserId) {
        users = users.filter(u => u.uid !== excludeUserId);
      }

      // Limit the returned array
      users = users.slice(0, limitCount);

      return { success: true, data: users };
    } catch (_error) {
      return { success: false, error: 'Failed to search users' };
    }
  }

  /**
   * CONTACTS OPERATIONS
   */

  /**
   * Add a contact (friend) – auto-accepted for MVP
   */
  static async addContact(
    userId: string,
    contactUserId: string,
  ): Promise<ApiResponse<void>> {
    try {
      if (!userId || !contactUserId || userId === contactUserId) {
        return { success: false, error: 'Invalid user IDs' };
      }

      const contactRef = doc(
        firestore,
        COLLECTIONS.USERS,
        userId,
        COLLECTIONS.CONTACTS,
        contactUserId,
      );

      await setDoc(contactRef, {
        createdAt: serverTimestamp(),
        status: 'accepted',
      } as ContactDocument);

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to add contact' };
    }
  }

  /**
   * Remove a contact
   */
  static async removeContact(
    userId: string,
    contactUserId: string,
  ): Promise<ApiResponse<void>> {
    try {
      if (!userId || !contactUserId) {
        return { success: false, error: 'Invalid user IDs' };
      }

      const contactRef = doc(
        firestore,
        COLLECTIONS.USERS,
        userId,
        COLLECTIONS.CONTACTS,
        contactUserId,
      );

      await deleteDoc(contactRef);
      return { success: true };
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || 'Failed to remove contact',
      };
    }
  }

  /**
   * Get contacts list (user IDs)
   */
  static async getContacts(userId: string): Promise<ApiResponse<string[]>> {
    try {
      if (!userId) {
        return { success: false, error: 'Invalid user ID' };
      }

      const contactsCol = collection(
        firestore,
        COLLECTIONS.USERS,
        userId,
        COLLECTIONS.CONTACTS,
      );
      const snapshot = await getDocs(contactsCol);
      const ids: string[] = snapshot.docs.map(docSnap => docSnap.id);
      return { success: true, data: ids };
    } catch (_error) {
      return { success: false, error: 'Failed to get contacts' };
    }
  }

  /**
   * Real-time subscription to contacts
   */
  static subscribeToContacts(
    userId: string,
    callback: (_contactIds: string[]) => void,
    onError?: (_error: string) => void,
  ): Unsubscribe {
    const contactsCol = collection(
      firestore,
      COLLECTIONS.USERS,
      userId,
      COLLECTIONS.CONTACTS,
    );

    return onSnapshot(
      contactsCol,
      snapshot => {
        const ids = snapshot.docs.map(docSnap => docSnap.id);
        callback(ids);
      },
      error => {
        if (onError) onError(error.message);
      },
    );
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

  /**
   * =============================
   * EVENT OPERATIONS (NEW)
   * =============================
   */

  /** Create a new event and assign current user as host */
  static async createEvent(
    event: Omit<AppEvent, 'id' | 'createdAt'>,
  ): Promise<ApiResponse<AppEvent>> {
    try {
      const { name, startTime, endTime, hostUid, assets = [] } = event;

      // Always generate a 6-digit join code
      const joinCode = Math.floor(100000 + Math.random() * 900000).toString();

      const eventData: EventDocument = {
        name,
        joinCode,
        startTime: Timestamp.fromDate(startTime),
        endTime: Timestamp.fromDate(endTime),
        hostUid,
        assets,
        createdAt: serverTimestamp() as Timestamp,
      };

      // Add event document
      const docRef = await addDoc(
        collection(firestore, COLLECTIONS.EVENTS),
        eventData,
      );

      // Add host participant sub-doc
      await setDoc(
        doc(firestore, COLLECTIONS.EVENTS, docRef.id, 'participants', hostUid),
        {
          role: 'host',
          joinedAt: serverTimestamp(),
        } as EventParticipantDocument,
      );

      const createdEvent: AppEvent = {
        id: docRef.id,
        name,
        joinCode,
        startTime,
        endTime,
        hostUid,
        assets,
        createdAt: new Date(),
      };

      return { success: true, data: createdEvent };
    } catch (_error) {
      return { success: false, error: 'Failed to create event' };
    }
  }

  /**
   * Join an event (adds participant as guest); validates join code for private events.
   */
  static async joinEvent(
    eventId: string,
    userId: string,
    joinCodeInput?: string | null,
  ): Promise<ApiResponse<void>> {
    try {
      const evtRef = doc(firestore, COLLECTIONS.EVENTS, eventId);
      const evtSnap = await getDoc(evtRef);

      if (!evtSnap.exists()) {
        return { success: false, error: 'Event not found' };
      }

      const data = evtSnap.data() as EventDocument;

      if (
        data.joinCode === null ||
        data.joinCode === undefined ||
        data.joinCode !== joinCodeInput
      ) {
        return { success: false, error: 'Invalid join code' };
      }

      // Add participant document
      await setDoc(
        doc(firestore, COLLECTIONS.EVENTS, eventId, 'participants', userId),
        {
          role: userId === data.hostUid ? 'host' : 'guest',
          joinedAt: serverTimestamp(),
        } as EventParticipantDocument,
        { merge: true },
      );

      return { success: true };
    } catch (_error) {
      return { success: false, error: 'Failed to join event' };
    }
  }

  /** Fetch an event by ID */
  static async getActiveEvent(eventId: string): Promise<ApiResponse<AppEvent>> {
    try {
      const evtRef = doc(firestore, COLLECTIONS.EVENTS, eventId);
      const evtSnap = await getDoc(evtRef);

      if (!evtSnap.exists()) {
        return { success: false, error: 'Event not found' };
      }

      const data = evtSnap.data() as EventDocument;

      const event: AppEvent = {
        id: evtSnap.id,
        name: data.name,
        joinCode: data.joinCode,
        startTime: data.startTime.toDate(),
        endTime: data.endTime.toDate(),
        hostUid: data.hostUid,
        assets: data.assets,
        createdAt: data.createdAt.toDate(),
      };

      return { success: true, data: event };
    } catch (_error) {
      return { success: false, error: 'Failed to fetch event' };
    }
  }

  /** Add or update a participant role for an event */
  static async addParticipant(
    eventId: string,
    userId: string,
    role: 'host' | 'guest' = 'guest',
  ): Promise<ApiResponse<void>> {
    try {
      await setDoc(
        doc(firestore, COLLECTIONS.EVENTS, eventId, 'participants', userId),
        {
          role,
          joinedAt: serverTimestamp(),
        } as EventParticipantDocument,
        { merge: true },
      );

      return { success: true };
    } catch (_error) {
      return { success: false, error: 'Failed to add participant' };
    }
  }

  /** Remove participant from event */
  static async removeParticipant(
    eventId: string,
    userId: string,
  ): Promise<ApiResponse<void>> {
    try {
      await deleteDoc(
        doc(firestore, COLLECTIONS.EVENTS, eventId, 'participants', userId),
      );

      return { success: true };
    } catch (_error) {
      return { success: false, error: 'Failed to remove participant' };
    }
  }

  /** Get participant data for an event */
  static async getParticipant(
    eventId: string,
    userId: string,
  ): Promise<ApiResponse<EventParticipantDocument>> {
    try {
      const participantRef = doc(
        firestore,
        COLLECTIONS.EVENTS,
        eventId,
        'participants',
        userId,
      );
      const participantSnap = await getDoc(participantRef);

      if (!participantSnap.exists()) {
        return { success: false, error: 'Participant not found' };
      }

      const data = participantSnap.data() as EventParticipantDocument;
      return { success: true, data };
    } catch (_error) {
      return { success: false, error: 'Failed to get participant' };
    }
  }

  /** Get public events ordered by start time - DEPRECATED: All events are now private with join codes */
  static async getPublicEvents(
    _limitCount: number = 20,
  ): Promise<ApiResponse<AppEvent[]>> {
    // Return empty array since we no longer have public events
    return { success: true, data: [] };
  }

  /** Find event by join code */
  static async getEventByJoinCode(
    joinCode: string,
  ): Promise<ApiResponse<AppEvent>> {
    try {
      const eventsRef = collection(firestore, COLLECTIONS.EVENTS);
      const q = query(
        eventsRef,
        where('joinCode', '==', joinCode),
        where('joinCode', '!=', null),
        limit(1),
      );

      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        return { success: false, error: 'Invalid join code' };
      }

      const doc = snapshot.docs[0];
      const data = doc.data() as EventDocument;

      const event: AppEvent = {
        id: doc.id,
        name: data.name,
        joinCode: data.joinCode,
        startTime: data.startTime.toDate(),
        endTime: data.endTime.toDate(),
        hostUid: data.hostUid,
        assets: data.assets,
        createdAt: data.createdAt.toDate(),
      };

      return { success: true, data: event };
    } catch (_error) {
      return { success: false, error: 'Failed to find event' };
    }
  }
}
