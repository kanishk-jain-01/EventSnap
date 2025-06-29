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
import { ApiResponse, User } from '../types';
import { StorageService, UploadProgressCallback, StoragePaths } from './storage.service';

// Firestore collection names
export const COLLECTIONS = {
  USERS: 'users',
  STORIES: 'stories',
  EVENTS: 'events',
} as const;

/**
 * Sub-collection names inside an Event document
 */
export const EVENT_SUBCOLLECTIONS = {
  PARTICIPANTS: 'participants',
  DOCUMENTS: 'documents',
} as const;

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
  textOverlay?: {
    text: string;
    position: { x: number; y: number };
  };
}

// User document interface for Firestore
export interface UserDocument {
  email: string;
  displayName: string;
  avatarUrl?: string;
  createdAt: Timestamp;
  lastSeen: Timestamp;
  storyCount?: number;
  // Event tracking fields - replaces AsyncStorage
  activeEventId?: string | null;
  eventRole?: 'host' | 'guest' | null;
  // Instagram handle & visibility
  instagramHandle?: string;
  contactVisible?: boolean;
}



/**
 * EVENT (Event-Driven Networking) document interface for Firestore
 */
export interface EventDocument {
  name: string;
  joinCode: string;
  hostCode: string;
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
    textOverlay?: { text: string; position: { x: number; y: number } },
  ): Promise<ApiResponse<Story>> {
    try {
      // Calculate expiration time (24 hours from now)
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
        ...(textOverlay && { textOverlay }),
      };

      const docRef = await addDoc(
        collection(firestore, COLLECTIONS.STORIES),
        storyData,
      );

      // Convert to app format
      const story: Story = {
        id: docRef.id,
        userId,
        imageUrl,
        timestamp: now,
        expiresAt,
        viewedBy: [],
        eventId,
        textOverlay,
      };

      return {
        success: true,
        data: story,
      };
    } catch (_error) {
      return {
        success: false,
        error: 'Failed to create story',
      };
    }
  }

  /**
   * Get active stories (not expired)
   */
  static async getActiveStories(
    limitCount: number = 100,
  ): Promise<ApiResponse<Story[]>> {
    try {
      const q = query(
        collection(firestore, COLLECTIONS.STORIES),
        where('expiresAt', '>', new Date()),
        orderBy('expiresAt'),
        orderBy('timestamp', 'desc'),
        limit(limitCount),
      );

      const querySnapshot = await getDocs(q);
      const stories: Story[] = [];

      querySnapshot.forEach(doc => {
        const data = doc.data() as StoryDocument;
        stories.push({
          id: doc.id,
          userId: data.userId,
          imageUrl: data.imageUrl,
          timestamp: data.timestamp.toDate(),
          expiresAt: data.expiresAt.toDate(),
          viewedBy: data.viewedBy,
          eventId: data.eventId,
          textOverlay: data.textOverlay,
        });
      });

      return {
        success: true,
        data: stories,
      };
    } catch (_error) {
      return {
        success: false,
        error: 'Failed to get active stories',
      };
    }
  }

  /**
   * Get active stories for a specific event
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
        orderBy('expiresAt'),
        orderBy('timestamp', 'desc'),
        limit(limitCount),
      );

      const querySnapshot = await getDocs(q);
      const stories: Story[] = [];

      querySnapshot.forEach(doc => {
        const data = doc.data() as StoryDocument;
        stories.push({
          id: doc.id,
          userId: data.userId,
          imageUrl: data.imageUrl,
          timestamp: data.timestamp.toDate(),
          expiresAt: data.expiresAt.toDate(),
          viewedBy: data.viewedBy,
          eventId: data.eventId,
          textOverlay: data.textOverlay,
        });
      });

      return {
        success: true,
        data: stories,
      };
    } catch (_error) {
      return {
        success: false,
        error: 'Failed to get event stories',
      };
    }
  }

  /**
   * Subscribe to stories in real-time
   */
  static subscribeToStories(
    callback: (_stories: Story[]) => void,
    onError?: (_error: string) => void,
  ): Unsubscribe {
    const q = query(
      collection(firestore, COLLECTIONS.STORIES),
      where('expiresAt', '>', new Date()),
      orderBy('expiresAt'),
      orderBy('timestamp', 'desc'),
    );

    return onSnapshot(
      q,
      querySnapshot => {
        const stories: Story[] = [];
        querySnapshot.forEach(doc => {
          const data = doc.data() as StoryDocument;
          stories.push({
            id: doc.id,
            userId: data.userId,
            imageUrl: data.imageUrl,
            timestamp: data.timestamp.toDate(),
            expiresAt: data.expiresAt.toDate(),
            viewedBy: data.viewedBy,
            eventId: data.eventId,
            textOverlay: data.textOverlay,
          });
        });
        callback(stories);
      },
      error => {
        onError?.(error.message);
      },
    );
  }

  /**
   * Subscribe to stories for a specific event in real-time
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
      orderBy('expiresAt'),
      orderBy('timestamp', 'desc'),
    );

    return onSnapshot(
      q,
      querySnapshot => {
        const stories: Story[] = [];
        querySnapshot.forEach(doc => {
          const data = doc.data() as StoryDocument;
          stories.push({
            id: doc.id,
            userId: data.userId,
            imageUrl: data.imageUrl,
            timestamp: data.timestamp.toDate(),
            expiresAt: data.expiresAt.toDate(),
            viewedBy: data.viewedBy,
            eventId: data.eventId,
            textOverlay: data.textOverlay,
          });
        });
        callback(stories);
      },
      error => {
        onError?.(error.message);
      },
    );
  }

  /**
   * Mark a story as viewed by a user
   */
  static async markStoryViewed(
    storyId: string,
    viewerId: string,
  ): Promise<ApiResponse<void>> {
    try {
      const docRef = doc(firestore, COLLECTIONS.STORIES, storyId);
      await updateDoc(docRef, {
        viewedBy: arrayUnion(viewerId),
      });

      return { success: true };
    } catch (_error) {
      return {
        success: false,
        error: 'Failed to mark story as viewed',
      };
    }
  }

  /**
   * Delete a story
   */
  static async deleteStory(storyId: string): Promise<ApiResponse<void>> {
    try {
      const docRef = doc(firestore, COLLECTIONS.STORIES, storyId);
      await deleteDoc(docRef);

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
   * Delete expired stories (cleanup operation)
   */
  static async deleteExpiredStories(): Promise<ApiResponse<number>> {
    try {
      const q = query(
        collection(firestore, COLLECTIONS.STORIES),
        where('expiresAt', '<=', new Date()),
      );

      const querySnapshot = await getDocs(q);
      const batch = writeBatch(firestore);
      let deletedCount = 0;

      querySnapshot.forEach(doc => {
        batch.delete(doc.ref);
        deletedCount++;
      });

      if (deletedCount > 0) {
        await batch.commit();
      }

      return {
        success: true,
        data: deletedCount,
      };
    } catch (_error) {
      return {
        success: false,
        error: 'Failed to delete expired stories',
      };
    }
  }

  /**
   * Get expired stories for cleanup (with metadata for storage cleanup)
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
      const expiredStories: (StoryDocument & { id: string })[] = [];

      querySnapshot.forEach(doc => {
        const data = doc.data() as StoryDocument;
        expiredStories.push({
          id: doc.id,
          ...data,
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
   * Create or update a user document
   */
  static async createOrUpdateUser(user: User): Promise<ApiResponse<void>> {
    try {
      const userDoc: Partial<UserDocument> = {
        email: user.email,
        displayName: user.displayName,
        createdAt: Timestamp.fromDate(user.createdAt),
        lastSeen: serverTimestamp() as Timestamp,
      };

      if (user.avatarUrl !== undefined) userDoc.avatarUrl = user.avatarUrl;
      if (user.activeEventId !== undefined) userDoc.activeEventId = user.activeEventId;
      if (user.eventRole !== undefined) userDoc.eventRole = user.eventRole;
      if (user.instagramHandle !== undefined) userDoc.instagramHandle = user.instagramHandle;
      if (user.contactVisible !== undefined) userDoc.contactVisible = user.contactVisible;

      await setDoc(doc(firestore, COLLECTIONS.USERS, user.uid), userDoc, {
        merge: true,
      });

      return { success: true };
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
      const userDocRef = doc(firestore, COLLECTIONS.USERS, userId);
      await updateDoc(userDocRef, {
        activeEventId,
        eventRole,
        lastSeen: serverTimestamp(),
      });

      return { success: true };
    } catch (_error) {
      return {
        success: false,
        error: 'Failed to update user active event',
      };
    }
  }

  /**
   * Get a user by ID
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
        uid: docSnap.id,
        email: data.email,
        displayName: data.displayName,
        avatarUrl: data.avatarUrl,
        createdAt: data.createdAt.toDate(),
        lastSeen: data.lastSeen?.toDate(),
        activeEventId: data.activeEventId,
        eventRole: data.eventRole,
        instagramHandle: data.instagramHandle,
        contactVisible: data.contactVisible,
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
   * Get all users (for user search/discovery)
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
        if (doc.id === excludeUserId) return; // Skip excluded user

        const data = doc.data() as UserDocument;
        users.push({
          uid: doc.id,
          email: data.email,
          displayName: data.displayName,
          avatarUrl: data.avatarUrl,
          createdAt: data.createdAt.toDate(),
          lastSeen: data.lastSeen?.toDate(),
          activeEventId: data.activeEventId,
          eventRole: data.eventRole,
          instagramHandle: data.instagramHandle,
          contactVisible: data.contactVisible,
        });
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
   * Search users by display name
   */
  static async searchUsers(
    searchText: string,
    limitCount: number = 20,
    excludeUserId?: string,
  ): Promise<ApiResponse<User[]>> {
    try {
      // Note: This is a simple prefix search. For more advanced search,
      // consider using Algolia or similar search service
      const searchLower = searchText.toLowerCase();
      const searchUpper = searchText.toLowerCase() + '\uf8ff';

      const q = query(
        collection(firestore, COLLECTIONS.USERS),
        where('displayName', '>=', searchLower),
        where('displayName', '<=', searchUpper),
        orderBy('displayName'),
        limit(limitCount),
      );

      const querySnapshot = await getDocs(q);
      const users: User[] = [];

      querySnapshot.forEach(doc => {
        if (doc.id === excludeUserId) return; // Skip excluded user

        const data = doc.data() as UserDocument;
        // Additional client-side filtering for case-insensitive search
        if (
          data.displayName.toLowerCase().includes(searchText.toLowerCase())
        ) {
          users.push({
            uid: doc.id,
            email: data.email,
            displayName: data.displayName,
            avatarUrl: data.avatarUrl,
            createdAt: data.createdAt.toDate(),
            lastSeen: data.lastSeen?.toDate(),
            activeEventId: data.activeEventId,
            eventRole: data.eventRole,
            instagramHandle: data.instagramHandle,
            contactVisible: data.contactVisible,
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
        error: 'Failed to search users',
      };
    }
  }

  /**
   * CONTACT OPERATIONS
   */

  /**
   * Add a contact (friend) for a user
   */
  /**
   * UTILITY OPERATIONS
   */

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
   * Get document count for a collection (with optional where clause)
   */
  static async getDocumentCount(
    collectionName: string,
    whereClause?: Parameters<typeof where>,
  ): Promise<number> {
    try {
      let q = collection(firestore, collectionName);

      if (whereClause) {
        q = query(q, where(...whereClause)) as any;
      }

      const snapshot = await getDocs(q);
      return snapshot.size;
    } catch (_error) {
      return 0;
    }
  }

  /**
   * EVENT OPERATIONS
   */

  /**
   * Create a new event
   */
  static async createEvent(
    event: Omit<AppEvent, 'id' | 'createdAt' | 'hostCode' | 'joinCode'>,
  ): Promise<ApiResponse<AppEvent>> {
    try {
      // Generate unique codes
      const joinCode = this.generateJoinCode();
      const hostCode = this.generateHostCode();
      
      const eventData: EventDocument = {
        name: event.name,
        joinCode: joinCode,
        hostCode: hostCode,
        startTime: Timestamp.fromDate(event.startTime),
        endTime: Timestamp.fromDate(event.endTime),
        hostUid: event.hostUid,
        assets: event.assets,
        createdAt: serverTimestamp() as Timestamp,
      };

      const docRef = await addDoc(
        collection(firestore, COLLECTIONS.EVENTS),
        eventData,
      );

      // Add the host as a participant
      await this.addParticipant(docRef.id, event.hostUid, 'host');

      // Convert to app format
      const createdEvent: AppEvent = {
        id: docRef.id,
        name: event.name,
        joinCode: eventData.joinCode,
        hostCode: eventData.hostCode,
        startTime: event.startTime,
        endTime: event.endTime,
        hostUid: event.hostUid,
        assets: event.assets,
        createdAt: new Date(),
      };

      return {
        success: true,
        data: createdEvent,
      };
    } catch (_error) {
      return {
        success: false,
        error: 'Failed to create event',
      };
    }
  }

  /**
   * Join an existing event
   */
  static async joinEvent(
    eventId: string,
    userId: string,
    joinCodeInput?: string | null,
  ): Promise<ApiResponse<void>> {
    try {
      // Verify the event exists and get its data
      const eventRes = await this.getActiveEvent(eventId);
      if (!eventRes.success || !eventRes.data) {
        return {
          success: false,
          error: 'Event not found',
        };
      }

      const event = eventRes.data;

      // Verify join code if provided
      if (joinCodeInput && event.joinCode !== joinCodeInput) {
        return {
          success: false,
          error: 'Invalid join code',
        };
      }

      // Add user as participant
      await this.addParticipant(eventId, userId, 'guest');

      return { success: true };
    } catch (_error) {
      return {
        success: false,
        error: 'Failed to join event',
      };
    }
  }

  /**
   * Get an active event by ID
   */
  static async getActiveEvent(eventId: string): Promise<ApiResponse<AppEvent>> {
    try {
      const docRef = doc(firestore, COLLECTIONS.EVENTS, eventId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return {
          success: false,
          error: 'Event not found',
        };
      }

      const data = docSnap.data() as EventDocument;
      const event: AppEvent = {
        id: docSnap.id,
        name: data.name,
        joinCode: data.joinCode,
        hostCode: data.hostCode,
        startTime: data.startTime.toDate(),
        endTime: data.endTime.toDate(),
        hostUid: data.hostUid,
        assets: data.assets,
        createdAt: data.createdAt.toDate(),
      };

      return {
        success: true,
        data: event,
      };
    } catch (_error) {
      return {
        success: false,
        error: 'Failed to get event',
      };
    }
  }

  /**
   * Add a participant to an event
   */
  static async addParticipant(
    eventId: string,
    userId: string,
    role: 'host' | 'guest' = 'guest',
  ): Promise<ApiResponse<void>> {
    try {
      const participantData: EventParticipantDocument = {
        role,
        joinedAt: serverTimestamp() as Timestamp,
      };

      await setDoc(
        doc(firestore, COLLECTIONS.EVENTS, eventId, 'participants', userId),
        participantData,
      );

      return { success: true };
    } catch (_error) {
      return {
        success: false,
        error: 'Failed to add participant',
      };
    }
  }

  /**
   * Remove a participant from an event
   */
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
      return {
        success: false,
        error: 'Failed to remove participant',
      };
    }
  }

  /**
   * Get participant info for an event
   */
  static async getParticipant(
    eventId: string,
    userId: string,
  ): Promise<ApiResponse<EventParticipantDocument>> {
    try {
      const docRef = doc(
        firestore,
        COLLECTIONS.EVENTS,
        eventId,
        'participants',
        userId,
      );
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return {
          success: false,
          error: 'Participant not found',
        };
      }

      const data = docSnap.data() as EventParticipantDocument;

      return {
        success: true,
        data: data,
      };
    } catch (_error) {
      return {
        success: false,
        error: 'Failed to get participant',
      };
    }
  }

  /**
   * Get all hosts for a specific event
   */
  static async getEventHosts(eventId: string): Promise<ApiResponse<User[]>> {
    try {
      // First, fetch participant documents where role == 'host'
      const participantsRef = collection(
        firestore,
        COLLECTIONS.EVENTS,
        eventId,
        'participants',
      );

      const hostQuery = query(participantsRef, where('role', '==', 'host'));
      const hostSnap = await getDocs(hostQuery);

      if (hostSnap.empty) {
        return { success: true, data: [] };
      }

      const hostIds: string[] = hostSnap.docs.map(doc => doc.id);

      // Fetch user documents for each host UID
      const userPromises = hostIds.map(uid => this.getUser(uid));
      const results = await Promise.all(userPromises);

      const hosts: User[] = [];
      results.forEach(res => {
        if (res.success && res.data) hosts.push(res.data);
      });

      return { success: true, data: hosts };
    } catch (_error) {
      return { success: false, error: 'Failed to fetch event hosts' };
    }
  }

  /**
   * Get public events (placeholder for future feature)
   */
  static async getPublicEvents(
    _limitCount: number = 20,
  ): Promise<ApiResponse<AppEvent[]>> {
    // Placeholder for future public events feature
    return { success: true, data: [] };
  }

  /**
   * Get event by join code
   */
  static async getEventByJoinCode(
    joinCode: string,
  ): Promise<ApiResponse<AppEvent>> {
    try {
      const q = query(
        collection(firestore, COLLECTIONS.EVENTS),
        where('joinCode', '==', joinCode),
        limit(1),
      );

      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        return {
          success: false,
          error: 'Event not found with that join code',
        };
      }

      const doc = querySnapshot.docs[0];
      const data = doc.data() as EventDocument;
      const event: AppEvent = {
        id: doc.id,
        name: data.name,
        joinCode: data.joinCode,
        hostCode: data.hostCode,
        startTime: data.startTime.toDate(),
        endTime: data.endTime.toDate(),
        hostUid: data.hostUid,
        assets: data.assets,
        createdAt: data.createdAt.toDate(),
      };

      return {
        success: true,
        data: event,
      };
    } catch (_error) {
      return {
        success: false,
        error: 'Failed to find event',
      };
    }
  }

  /**
   * Promote a guest to host using the host code
   */
  static async promoteToHost(
    eventId: string,
    userId: string,
    hostCode: string,
  ): Promise<ApiResponse<void>> {
    try {
      // First, verify the event exists and the host code is correct
      const eventRes = await this.getActiveEvent(eventId);
      if (!eventRes.success || !eventRes.data) {
        return {
          success: false,
          error: 'Event not found',
        };
      }

      const event = eventRes.data;

      // Verify host code
      if (event.hostCode !== hostCode) {
        return {
          success: false,
          error: 'Invalid host code',
        };
      }

      // Check if user is already a participant in this event
      const participantRes = await this.getParticipant(eventId, userId);
      if (!participantRes.success) {
        return {
          success: false,
          error: 'You must be a participant in this event to become a host',
        };
      }

      // Update participant role to host
      const addRes = await this.addParticipant(eventId, userId, 'host');
      if (!addRes.success) {
        return { success: false, error: addRes.error || 'Failed to update participant role' };
      }

      // Update user's event role in their profile
      const updateRes = await this.updateUserActiveEvent(userId, eventId, 'host');
      if (!updateRes.success) {
        return { success: false, error: updateRes.error || 'Failed to update user role' };
      }

      return { success: true };
    } catch (_error) {
      return {
        success: false,
        error: 'Failed to promote to host',
      };
    }
  }

  /**
   * Leave an event (remove participant and clear user's active event)
   */
  static async leaveEvent(
    eventId: string,
    userId: string,
  ): Promise<ApiResponse<void>> {
    try {
      // Check if user is a participant in this event
      const participantRes = await this.getParticipant(eventId, userId);
      if (!participantRes.success) {
        return {
          success: false,
          error: 'You are not a participant in this event',
        };
      }

      // Remove user as participant
      const removeRes = await this.removeParticipant(eventId, userId);
      if (!removeRes.success) {
        return { success: false, error: removeRes.error || 'Failed to remove participant' };
      }

      // Clear user's active event in their profile
      const updateRes = await this.updateUserActiveEvent(userId, null, null);
      if (!updateRes.success) {
        return { success: false, error: updateRes.error || 'Failed to update user profile' };
      }

      return { success: true };
    } catch (_error) {
      return {
        success: false,
        error: 'Failed to leave event',
      };
    }
  }

  /**
   * Upload an Event Document (PDF or image) to Storage and store its metadata under
   * `/events/{eventId}/documents/{docId}` sub-collection.
   */
  static async uploadEventDocument(
    eventId: string,
    uploaderId: string,
    file: Blob | Uint8Array | ArrayBuffer,
    fileName: string,
    contentType: string,
    onProgress?: UploadProgressCallback,
  ): Promise<ApiResponse<import('../types').EventDocument>> {
    try {
      // 1. Generate a Firestore document ID ahead of time so we can use it in the Storage path
      const docId = doc(
        collection(
          firestore,
          COLLECTIONS.EVENTS,
          eventId,
          EVENT_SUBCOLLECTIONS.DOCUMENTS,
        ),
      ).id;

      // 2. Upload the file to Firebase Storage under `events/{eventId}/docs/{docId}`
      const storagePath = `${StoragePaths.EVENTS}/${eventId}/docs/${docId}`;

      // Ensure content type is allowed by Storage rules (image/* or application/pdf)
      const safeContentType =
        contentType &&
        (contentType.startsWith('image/') || contentType.startsWith('application/pdf'))
          ? contentType
          : fileName.toLowerCase().endsWith('.pdf')
          ? 'application/pdf'
          : 'image/jpeg';

      console.log('[DEBUG] Using contentType for upload:', safeContentType);

      const uploadRes = await StorageService.uploadImage(file, storagePath, {
        onProgress,
        contentType: safeContentType,
        customMetadata: {
          eventId,
          docId,
          uploaderId,
          fileName,
          type: 'eventDoc',
        },
      });

      if (!uploadRes.success || !uploadRes.data) {
        return {
          success: false,
          error: uploadRes.error || 'Failed to upload document',
        };
      }

      const { downloadURL, fullPath, size } = uploadRes.data;

      // 3. Construct Firestore document data
      const docType: 'pdf' | 'image' = safeContentType.startsWith('application/pdf') ? 'pdf' : 'image';

      const docData = {
        name: fileName,
        storagePath: fullPath,
        downloadUrl: downloadURL,
        contentType: safeContentType,
        type: docType,
        uploadedBy: uploaderId,
        size,
        createdAt: serverTimestamp() as Timestamp,
      };

      // 4. Write metadata to Firestore
      const docRef = doc(
        firestore,
        COLLECTIONS.EVENTS,
        eventId,
        EVENT_SUBCOLLECTIONS.DOCUMENTS,
        docId,
      );
      await setDoc(docRef, docData);

      // 5. Return app-level type object
      const eventDocument: import('../types').EventDocument = {
        id: docId,
        eventId,
        name: fileName,
        storagePath: fullPath,
        downloadUrl: downloadURL,
        contentType: safeContentType,
        type: docType,
        uploadedBy: uploaderId,
        size,
        createdAt: new Date(),
      };

      return { success: true, data: eventDocument };
    } catch (err: any) {
      // DEBUG: surface underlying error from Storage/Firebase
      console.error('[FirestoreService] uploadEventDocument error', err);

      return {
        success: false,
        error:
          typeof err === 'string'
            ? err
            : err?.error || err?.message || 'Failed to upload event document',
      };
    }
  }

  /**
   * Get all documents for a specific event
   */
  static async getEventDocuments(
    eventId: string,
  ): Promise<ApiResponse<import('../types').EventDocument[]>> {
    try {
      const documentsRef = collection(
        firestore,
        COLLECTIONS.EVENTS,
        eventId,
        EVENT_SUBCOLLECTIONS.DOCUMENTS,
      );

      const q = query(documentsRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);

      const documents: import('../types').EventDocument[] = [];

      querySnapshot.forEach(doc => {
        const data = doc.data();
        documents.push({
          id: doc.id,
          eventId,
          name: data.name,
          storagePath: data.storagePath,
          downloadUrl: data.downloadUrl,
          contentType: data.contentType,
          type: data.type,
          uploadedBy: data.uploadedBy,
          size: data.size,
          createdAt: data.createdAt.toDate(),
          pageCount: data.pageCount,
        });
      });

      return {
        success: true,
        data: documents,
      };
    } catch (_error) {
      return {
        success: false,
        error: 'Failed to get event documents',
      };
    }
  }

  /**
   * Get a single event document by ID
   */
  static async getEventDocument(
    documentId: string,
  ): Promise<ApiResponse<import('../types').EventDocument>> {
    try {
      // We need to search across all events since we only have documentId
      // This is a limitation of the current design - ideally we'd store eventId with citations
      // For now, we'll use a more expensive query
      const eventsRef = collection(firestore, COLLECTIONS.EVENTS);
      const eventsSnapshot = await getDocs(eventsRef);
      
      for (const eventDoc of eventsSnapshot.docs) {
        const eventId = eventDoc.id;
        const docRef = doc(
          firestore,
          COLLECTIONS.EVENTS,
          eventId,
          EVENT_SUBCOLLECTIONS.DOCUMENTS,
          documentId,
        );
        
        const docSnapshot = await getDoc(docRef);
        if (docSnapshot.exists()) {
          const data = docSnapshot.data();
          const document: import('../types').EventDocument = {
            id: docSnapshot.id,
            eventId,
            name: data.name,
            storagePath: data.storagePath,
            downloadUrl: data.downloadUrl,
            contentType: data.contentType,
            type: data.type,
            uploadedBy: data.uploadedBy,
            size: data.size,
            createdAt: data.createdAt.toDate(),
            pageCount: data.pageCount,
          };
          
          return {
            success: true,
            data: document,
          };
        }
      }
      
      return {
        success: false,
        error: 'Document not found',
      };
    } catch (_error) {
      return {
        success: false,
        error: 'Failed to get event document',
      };
    }
  }

  /**
   * Subscribe to event documents in real-time
   */
  static subscribeToEventDocuments(
    eventId: string,
    callback: (_documents: import('../types').EventDocument[]) => void,
    onError?: (_error: string) => void,
  ): Unsubscribe {
    const documentsRef = collection(
      firestore,
      COLLECTIONS.EVENTS,
      eventId,
      EVENT_SUBCOLLECTIONS.DOCUMENTS,
    );

    const q = query(documentsRef, orderBy('createdAt', 'desc'));

    return onSnapshot(
      q,
      querySnapshot => {
        const documents: import('../types').EventDocument[] = [];
        querySnapshot.forEach(doc => {
          const data = doc.data();
          documents.push({
            id: doc.id,
            eventId,
            name: data.name,
            storagePath: data.storagePath,
            downloadUrl: data.downloadUrl,
            contentType: data.contentType,
            type: data.type,
            uploadedBy: data.uploadedBy,
            size: data.size,
            createdAt: data.createdAt.toDate(),
            pageCount: data.pageCount,
          });
        });
        callback(documents);
      },
      error => {
        onError?.(error.message);
      },
    );
  }

  /**
   * Generate a random 6-digit join code
   */
  private static generateJoinCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Generate a random 8-digit host code
   */
  private static generateHostCode(): string {
    return Math.floor(10000000 + Math.random() * 90000000).toString();
  }
}
