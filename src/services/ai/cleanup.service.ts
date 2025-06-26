import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase/config';
import { ApiResponse } from '../../types';

interface CleanupResult {
  eventId: string;
  deletedStories: number;
  deletedSnaps: number;
  deletedAssets: number;
  deletedVectors: number;
  errors: string[];
}

/**
 * Service for calling the deleteExpiredContent Cloud Function
 * to clean up event data when an event is manually ended by the host
 */
export class CleanupService {
  /**
   * End an event and clean up all associated content
   * @param eventId The ID of the event to end
   * @param forceDelete Whether to force deletion even if not expired
   */
  static async endEvent(
    eventId: string, 
    forceDelete: boolean = true,
  ): Promise<ApiResponse<CleanupResult>> {
    try {
      const callable = httpsCallable(functions, 'deleteExpiredContent');
      const result = await callable({ eventId, forceDelete });
      
      const data = result.data as { success: boolean; result: CleanupResult };
      
      if (data.success) {
        return { 
          success: true, 
          data: data.result,
        };
      } else {
        return { 
          success: false, 
          error: 'Failed to end event',
        };
      }
    } catch (error: any) {
      // eslint-disable-next-line no-console
      console.error('Event cleanup error:', error);
      
      // Extract meaningful error message
      let errorMessage = 'Failed to end event';
      if (error.code === 'functions/permission-denied') {
        errorMessage = 'Only the event host can end the event';
      } else if (error.code === 'functions/not-found') {
        errorMessage = 'Event not found';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      return { 
        success: false, 
        error: errorMessage,
      };
    }
  }
} 