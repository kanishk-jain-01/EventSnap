import * as functions from 'firebase-functions/v2';
import * as admin from 'firebase-admin';
import { Pinecone } from '@pinecone-database/pinecone';

// Initialize Firebase Admin if not already
if (!admin.apps.length) {
  admin.initializeApp();
}

// Environment Variables
const getPineconeIndexName = () => {
  const index = process.env.PINECONE_INDEX;
  if (!index) throw new Error('PINECONE_INDEX env var not set');
  return index;
};

let _pinecone: Pinecone | null = null;
const getPineconeIndex = () => {
  if (!_pinecone) {
    const key = process.env.PINECONE_API_KEY;
    if (!key) throw new Error('PINECONE_API_KEY env var not set');
    _pinecone = new Pinecone({ apiKey: key });
  }
  return _pinecone.index(getPineconeIndexName());
};

interface EndEventRequest {
  eventId: string;
  userId: string;
}

interface EndEventResponse {
  success: boolean;
  deletedItems: {
    participants: number;
    documents: number;
    stories: number;
    storageFiles: number;
    vectorsDeleted: boolean;
  };
}

/**
 * End Event - Complete cleanup of all event-related data
 * Only the event host can trigger this action
 */
export const endEvent = functions.https.onCall(
  {
    invoker: 'public', // Allow public invocation with internal auth validation
  },
  async (request): Promise<EndEventResponse> => {


  // Authentication check
  if (!request.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated',
    );
  }

  const { eventId, userId } = request.data as EndEventRequest;
  
  // Validate required parameters
  if (!eventId || !userId) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'eventId and userId are required',
    );
  }

  // Validate that the authenticated user matches the userId parameter
  if (request.auth.uid !== userId) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'User can only end events on their own behalf',
    );
  }

  try {
    const firestore = admin.firestore();
    const storage = admin.storage().bucket();

    // Step 1: Validate event exists and user is the host
    const eventDoc = await firestore.collection('events').doc(eventId).get();
    if (!eventDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Event not found');
    }

    const eventData = eventDoc.data()!;
    if (eventData.hostUid !== userId) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Only the event host can end the event',
      );
    }

    const result: EndEventResponse = {
      success: false,
      deletedItems: {
        participants: 0,
        documents: 0,
        stories: 0,
        storageFiles: 0,
        vectorsDeleted: false,
      },
    };

    // Step 2: Get all participants and clear their activeEventId/eventRole
    try {
      const participantsQuery = await firestore
        .collection('events')
        .doc(eventId)
        .collection('participants')
        .get();

      const userUpdateBatch = firestore.batch();
      const participantDeleteBatch = firestore.batch();

      for (const participantDoc of participantsQuery.docs) {
        const participantId = participantDoc.id;
        
        // Clear user's active event data
        const userRef = firestore.collection('users').doc(participantId);
        userUpdateBatch.update(userRef, {
          activeEventId: null,
          eventRole: null,
        });

        // Delete participant document
        participantDeleteBatch.delete(participantDoc.ref);
      }

      // Execute batches
      if (participantsQuery.size > 0) {
        await userUpdateBatch.commit();
        await participantDeleteBatch.commit();
        result.deletedItems.participants = participantsQuery.size;
      }
    } catch (error) {
      console.error('❌ Failed to clear participants:', error);
      // Continue with other deletions even if this fails
    }

    // Step 3: Delete all event documents and their storage files
    try {
      const documentsQuery = await firestore
        .collection('events')
        .doc(eventId)
        .collection('documents')
        .get();

      const documentBatch = firestore.batch();
      const documentPaths: string[] = [];

      documentsQuery.docs.forEach(doc => {
        const data = doc.data();
        if (data.storagePath) {
          documentPaths.push(data.storagePath);
        }
        documentBatch.delete(doc.ref);
      });

      if (documentsQuery.size > 0) {
        await documentBatch.commit();
        result.deletedItems.documents = documentsQuery.size;
      }

      // Delete document files from storage
      let deletedFiles = 0;
      for (const path of documentPaths) {
        try {
          await storage.file(path).delete();
          deletedFiles++;
        } catch (error) {
          console.error(`❌ Failed to delete document file: ${path}`, error);
        }
      }
      result.deletedItems.storageFiles += deletedFiles;
    } catch (error) {
      console.error('❌ Failed to delete documents:', error);
    }

    // Step 4: Delete all stories and their storage files
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
        result.deletedItems.stories = storiesQuery.size;
      }

      // Delete story images from storage
      let deletedStoryFiles = 0;
      for (const path of storyPaths) {
        try {
          await storage.file(path).delete();
          deletedStoryFiles++;
        } catch (error) {
          console.error(`❌ Failed to delete story file: ${path}`, error);
        }
      }
      result.deletedItems.storageFiles += deletedStoryFiles;
    } catch (error) {
      console.error('❌ Failed to delete stories:', error);
    }

    // Step 5: Delete all vectors from Pinecone namespace
    try {
      await getPineconeIndex().namespace(eventId).deleteAll();
      result.deletedItems.vectorsDeleted = true;
    } catch (error) {
      console.error('❌ Failed to delete Pinecone vectors:', error);
      result.deletedItems.vectorsDeleted = false;
    }

    // Step 6: Delete any remaining storage folders for this event
    try {
      // Delete entire event folder in storage
      const eventStoragePath = `events/${eventId}/`;
      const [files] = await storage.getFiles({ prefix: eventStoragePath });
      
      let additionalDeletedFiles = 0;
      for (const file of files) {
        try {
          await file.delete();
          additionalDeletedFiles++;
        } catch (error) {
          console.error(`❌ Failed to delete storage file: ${file.name}`, error);
        }
      }
      
      if (additionalDeletedFiles > 0) {
        result.deletedItems.storageFiles += additionalDeletedFiles;
      }
    } catch (error) {
      console.error('❌ Failed to clean up event storage folder:', error);
    }

    // Step 7: Finally, delete the event document itself
    try {
      await firestore.collection('events').doc(eventId).delete();
    } catch (error) {
      console.error('❌ Failed to delete event document:', error);
      throw new functions.https.HttpsError(
        'internal',
        'Failed to delete event document',
      );
    }

    result.success = true;
    
    return result;

  } catch (error: any) {
    console.error('❌ Event deletion failed:', error);
    
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    
    throw new functions.https.HttpsError(
      'internal',
      `Failed to end event: ${error.message}`,
    );
  }
}); 