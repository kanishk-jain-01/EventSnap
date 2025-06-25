import { FirestoreService } from '../firestore.service';
import { StorageService } from '../storage.service';
import { ApiResponse } from '../../types';

/**
 * Service responsible for deleting expired stories (24-hour expiration).
 *
 * Usage example (async function):
 *   const result = await StoryCleanupService.cleanupExpiredStories();
 *   if (result.success) console.log(`Deleted ${result.data} expired stories`);
 */
export class StoryCleanupService {
  /**
   * Remove all stories whose `expiresAt` is <= now.
   * 1. Fetch expired story documents from Firestore (includes `imagePath`).
   * 2. Delete the associated image file from Firebase Storage.
   * 3. Delete the story document from Firestore.
   * 4. Return how many were successfully deleted.
   */
  static async cleanupExpiredStories(): Promise<ApiResponse<number>> {
    const expiredRes = await FirestoreService.getExpiredStoriesForCleanup();

    if (!expiredRes.success || !expiredRes.data) {
      return {
        success: false,
        error: expiredRes.error || 'Failed to fetch expired stories',
      };
    }

    const stories = expiredRes.data as Array<{
      id?: string;
      imagePath?: string;
    }>;

    let deleteCount = 0;

    for (const story of stories) {
      if (!story.id || !story.imagePath) {
        // Skip if essential data is missing
         
        continue;
      }

      // 1️⃣ Delete the image from Storage (best-effort)
      const storageDelete = await StorageService.deleteFile(story.imagePath);
      if (!storageDelete.success) {
        // Skip Firestore deletion if storage deletion fails to keep data consistent
         
        continue;
      }

      // 2️⃣ Delete the Firestore document
      const firestoreDelete = await FirestoreService.deleteStory(story.id);
      if (firestoreDelete.success) {
        deleteCount += 1;
      }
    }

    return {
      success: true,
      data: deleteCount,
    };
  }
} 