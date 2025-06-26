import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase/config';
import { ApiResponse } from '../../types';

/**
 * Helper service to trigger Cloud Functions that generate embeddings for
 * uploaded event assets (PDFs & images). It assumes that assets are already
 * uploaded to Firebase Storage by `StorageService.uploadEventAsset`.
 */
export class IngestionService {
  /**
   * Call the `ingestPDFEmbeddings` Cloud Function.
   * @param eventId Firestore event document ID
   * @param storagePath Full storage path of the uploaded PDF asset
   */
  static async ingestPdf(eventId: string, storagePath: string): Promise<ApiResponse<void>> {
    try {
      const callable = httpsCallable(functions, 'ingestPDFEmbeddings');
      await callable({ eventId, storagePath });
      return { success: true };
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('PDF ingestion error', error);
      return { success: false, error: 'Failed to ingest PDF asset' };
    }
  }

  /**
   * Call the `ingestImageEmbeddings` Cloud Function (for screenshots/images).
   * @param eventId Firestore event document ID
   * @param storagePath Full storage path of the uploaded image asset
   */
  static async ingestImage(eventId: string, storagePath: string): Promise<ApiResponse<void>> {
    try {
      const callable = httpsCallable(functions, 'ingestImageEmbeddings');
      await callable({ eventId, storagePath });
      return { success: true };
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Image ingestion error', error);
      return { success: false, error: 'Failed to ingest image asset' };
    }
  }
} 