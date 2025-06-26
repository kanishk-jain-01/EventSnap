import * as functions from 'firebase-functions/v2';
import * as admin from 'firebase-admin';
import { Pinecone } from '@pinecone-database/pinecone';

// Initialize Firebase Admin if not already
if (!admin.apps.length) {
  admin.initializeApp();
}

// Environment Variables
const PINECONE_INDEX = process.env.PINECONE_INDEX ?? 'event-embeddings';

let _pinecone: Pinecone | null = null;
const getPineconeIndex = () => {
  if (!_pinecone) {
    const key = process.env.PINECONE_API_KEY;
    if (!key) throw new Error('PINECONE_API_KEY env var not set');
    _pinecone = new Pinecone({ apiKey: key });
  }
  return _pinecone.index(PINECONE_INDEX);
};

interface CleanupResult {
  eventId: string;
  deletedStories: number;
  deletedSnaps: number;
  deletedAssets: number;
  deletedVectors: number;
  errors: string[];
}

/**
 * Delete all content for an event that has ended (event.endTime + 24h < now)
 * or when manually triggered by the host
 */
export const deleteExpiredContent = functions.https.onCall(async request => {
  if (!request.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated',
    );
  }

  const { eventId, forceDelete } = request.data as {
    eventId?: string;
    forceDelete?: boolean;
  };

  if (!eventId) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'eventId is required',
    );
  }

  try {
    const firestore = admin.firestore();
    const storage = admin.storage().bucket();

    // Get event details
    const eventDoc = await firestore.collection('events').doc(eventId).get();
    if (!eventDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Event not found');
    }

    const eventData = eventDoc.data()!;
    const now = new Date();
    const eventEndTime = eventData.endTime.toDate();
    const cleanupTime = new Date(eventEndTime.getTime() + 24 * 60 * 60 * 1000); // +24h

    // Check if user is host (for manual deletion) or if cleanup time has passed
    const isHost = eventData.hostUid === request.auth.uid;
    const isExpired = now >= cleanupTime;

    if (!forceDelete && !isHost && !isExpired) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Only the host can manually end an event, or content expires 24h after event end',
      );
    }

    const result: CleanupResult = {
      eventId,
      deletedStories: 0,
      deletedSnaps: 0,
      deletedAssets: 0,
      deletedVectors: 0,
      errors: [],
    };

    // 1. Delete Stories
    try {
      const storiesQuery = await firestore
        .collection('stories')
        .where('eventId', '==', eventId)
        .get();

      const storyBatch = firestore.batch();
      const storyPaths: string[] = [];

      storiesQuery.docs.forEach(doc => {
        const data = doc.data();
        if (data.imagePath) {
          storyPaths.push(data.imagePath);
        }
        storyBatch.delete(doc.ref);
      });

      if (storiesQuery.size > 0) {
        await storyBatch.commit();
        result.deletedStories = storiesQuery.size;
      }

      // Delete story images from storage
      for (const path of storyPaths) {
        try {
          await storage.file(path).delete();
        } catch (_err) {
          result.errors.push(`Failed to delete story image: ${path}`);
        }
      }
    } catch (_err) {
      result.errors.push(`Story cleanup failed: ${_err}`);
    }

    // 2. Delete Snaps
    try {
      const snapsQuery = await firestore
        .collection('snaps')
        .where('eventId', '==', eventId)
        .get();

      const snapBatch = firestore.batch();
      const snapPaths: string[] = [];

      snapsQuery.docs.forEach(doc => {
        const data = doc.data();
        if (data.imagePath) {
          snapPaths.push(data.imagePath);
        }
        snapBatch.delete(doc.ref);
      });

      if (snapsQuery.size > 0) {
        await snapBatch.commit();
        result.deletedSnaps = snapsQuery.size;
      }

      // Delete snap images from storage
      for (const path of snapPaths) {
        try {
          await storage.file(path).delete();
        } catch (_err) {
          result.errors.push(`Failed to delete snap image: ${path}`);
        }
      }
    } catch (_err) {
      result.errors.push(`Snap cleanup failed: ${_err}`);
    }

    // 3. Delete Event Assets and Embeddings
    try {
      const assetsQuery = await firestore
        .collection('events')
        .doc(eventId)
        .collection('assets')
        .get();

      const assetBatch = firestore.batch();
      const assetPaths: string[] = [];

      assetsQuery.docs.forEach(doc => {
        const data = doc.data();
        if (data.storagePath) {
          assetPaths.push(data.storagePath);
        }
        assetBatch.delete(doc.ref);
      });

      if (assetsQuery.size > 0) {
        await assetBatch.commit();
        result.deletedAssets = assetsQuery.size;
      }

      // Delete asset files from storage
      for (const path of assetPaths) {
        try {
          await storage.file(path).delete();
        } catch (_err) {
          result.errors.push(`Failed to delete asset file: ${path}`);
        }
      }

      // Delete vectors from Pinecone
      try {
        await getPineconeIndex().namespace(eventId).deleteAll();
        result.deletedVectors = 1; // Namespace deleted
      } catch (err) {
        result.errors.push(`Failed to delete Pinecone vectors: ${err}`);
      }
    } catch (_err) {
      result.errors.push(`Asset cleanup failed: ${_err}`);
    }

    // 4. Delete Event Participants
    try {
      const participantsQuery = await firestore
        .collection('events')
        .doc(eventId)
        .collection('participants')
        .get();

      const participantBatch = firestore.batch();
      participantsQuery.docs.forEach(doc => {
        participantBatch.delete(doc.ref);
      });

      if (participantsQuery.size > 0) {
        await participantBatch.commit();
      }
    } catch (_err) {
      result.errors.push(`Participant cleanup failed: ${_err}`);
    }

    // 5. Finally, delete the event document itself
    try {
      await firestore.collection('events').doc(eventId).delete();
    } catch (_err) {
      result.errors.push(`Event deletion failed: ${_err}`);
    }

    console.log('Cleanup completed:', result);
    return { success: true, result };
  } catch (error: any) {
    console.error('Cleanup failed:', error);
    throw new functions.https.HttpsError(
      'internal',
      error.message ?? 'Cleanup failed',
    );
  }
});

/**
 * Scheduled function to clean up expired events daily
 */
export const cleanupExpiredEventsScheduled = functions.scheduler.onSchedule(
  {
    schedule: 'every day 02:00',
    timeZone: 'UTC',
  },
  async () => {
    try {
      const firestore = admin.firestore();
      const now = new Date();
      const cutoffTime = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 24h ago

      // Find events that ended more than 24h ago
      const expiredEventsQuery = await firestore
        .collection('events')
        .where('endTime', '<=', cutoffTime)
        .get();

      console.log(
        `Found ${expiredEventsQuery.size} expired events to clean up`,
      );

      for (const eventDoc of expiredEventsQuery.docs) {
        try {
          // Call the cleanup function for each expired event
          await deleteExpiredContent.run({
            data: { eventId: eventDoc.id, forceDelete: true },
            auth: { uid: 'system' } as any,
          } as any);

          console.log(`Cleaned up expired event: ${eventDoc.id}`);
        } catch (err) {
          console.error(`Failed to clean up event ${eventDoc.id}:`, err);
        }
      }

      console.log('Scheduled cleanup completed');
    } catch (error) {
      console.error('Scheduled cleanup failed:', error);
    }
  },
);
