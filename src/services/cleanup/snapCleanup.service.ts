import { FirestoreService } from '../firestore.service';
import { StorageService } from '../storage.service';
import { ApiResponse } from '../../types';

/**
 * Service responsible for deleting expired snaps (24-hour expiration).
 *
 * Usage example (async function):
 *   const result = await SnapCleanupService.cleanupExpiredSnaps();
 *   if (result.success) console.log(`Deleted ${result.data} expired snaps`);
 */
export class SnapCleanupService {
  /**
   * Remove all snaps whose `expiresAt` is <= now.
   * 1. Fetch expired snap documents from Firestore (includes `imagePath`).
   * 2. Delete the associated image file from Firebase Storage.
   * 3. Delete the snap document from Firestore.
   * 4. Return how many were successfully deleted.
   */
  static async cleanupExpiredSnaps(): Promise<ApiResponse<number>> {
    const expiredRes = await FirestoreService.getExpiredSnapsForCleanup();

    if (!expiredRes.success || !expiredRes.data) {
      return {
        success: false,
        error: expiredRes.error || 'Failed to fetch expired snaps',
      };
    }

    const snaps = expiredRes.data as Array<{
      id?: string;
      imagePath?: string;
    }>;

    let deleteCount = 0;

    for (const snap of snaps) {
      if (!snap.id || !snap.imagePath) {
        // Skip if essential data is missing
        // eslint-disable-next-line no-continue
        continue;
      }

      // 1️⃣ Delete the image from Storage (best-effort)
      const storageDelete = await StorageService.deleteFile(snap.imagePath);
      if (!storageDelete.success) {
        // Skip Firestore deletion if storage deletion fails to keep data consistent
        // eslint-disable-next-line no-continue
        continue;
      }

      // 2️⃣ Delete the Firestore document
      const firestoreDelete = await FirestoreService.deleteSnap(snap.id);
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