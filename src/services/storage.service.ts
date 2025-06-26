/* eslint-disable no-unused-vars */
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  getMetadata,
  updateMetadata,
  UploadTask,
  UploadTaskSnapshot,
  StorageError,
} from 'firebase/storage';
import { storage } from './firebase/config';
import { ApiResponse } from '../types';

// Upload progress callback type
export type UploadProgressCallback = (_progress: number) => void;

// Upload result interface
export interface UploadResult {
  downloadURL: string;
  fullPath: string;
  size: number;
  contentType: string;
  timeCreated: string;
  md5Hash?: string;
}

// Upload options interface
export interface UploadOptions {
  onProgress?: UploadProgressCallback;
  customMetadata?: Record<string, string>;
  contentType?: string;
  cacheControl?: string;
}

// Storage paths enum for consistency
export enum StoragePaths {
  SNAPS = 'snaps',
  STORIES = 'stories',
  AVATARS = 'avatars',
  THUMBNAILS = 'thumbnails',
  TEMP = 'temp',
  EVENTS = 'events',
}

// File upload context for different use cases
export enum UploadContext {
  SNAP = 'snap',
  STORY = 'story',
  AVATAR = 'avatar',
  THUMBNAIL = 'thumbnail',
  TEMP = 'temp',
  EVENT_ASSET = 'eventAsset',
}

export class StorageService {
  /**
   * Upload an image file to Firebase Storage with progress tracking
   */
  static async uploadImage(
    file: Blob | Uint8Array | ArrayBuffer,
    path: string,
    options: UploadOptions = {},
  ): Promise<ApiResponse<UploadResult>> {
    try {
      const storageRef = ref(storage, path);

      // Set metadata
      const metadata = {
        contentType: options.contentType || 'image/jpeg',
        cacheControl: options.cacheControl || 'public, max-age=31536000', // 1 year
        customMetadata: {
          uploadedAt: new Date().toISOString(),
          ...options.customMetadata,
        },
      };

      // Create upload task
      const uploadTask: UploadTask = uploadBytesResumable(
        storageRef,
        file,
        metadata,
      );

      // Return promise that resolves with upload result
      return new Promise((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot: UploadTaskSnapshot) => {
            // Progress tracking
            const progress =
              (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            options.onProgress?.(progress);
          },
          (error: StorageError) => {
            // Error handling
            reject({
              success: false,
              error: this.getStorageErrorMessage(error.code),
            });
          },
          async () => {
            // Upload completed successfully
            try {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              const metadata = await getMetadata(uploadTask.snapshot.ref);

              const result: UploadResult = {
                downloadURL,
                fullPath: uploadTask.snapshot.ref.fullPath,
                size: metadata.size,
                contentType: metadata.contentType || 'image/jpeg',
                timeCreated: metadata.timeCreated,
                md5Hash: metadata.md5Hash,
              };

              resolve({
                success: true,
                data: result,
              });
            } catch (_error) {
              reject({
                success: false,
                error: 'Failed to get download URL',
              });
            }
          },
        );
      });
    } catch (_error) {
      return {
        success: false,
        error: 'Failed to start upload',
      };
    }
  }

  /**
   * Upload a snap image
   */
  static async uploadSnap(
    file: Blob | Uint8Array | ArrayBuffer,
    userId: string,
    snapId: string,
    options: UploadOptions = {},
  ): Promise<ApiResponse<UploadResult>> {
    const path = `${StoragePaths.SNAPS}/${userId}/${snapId}`;
    const metadata = {
      snapId,
      userId,
      type: 'snap',
      ...options.customMetadata,
    };

    return this.uploadImage(file, path, {
      ...options,
      customMetadata: metadata,
    });
  }

  /**
   * Upload a story image
   */
  static async uploadStory(
    file: Blob | Uint8Array | ArrayBuffer,
    userId: string,
    storyId: string,
    options: UploadOptions = {},
  ): Promise<ApiResponse<UploadResult>> {
    const path = `${StoragePaths.STORIES}/${userId}/${storyId}`;
    const metadata = {
      storyId,
      userId,
      type: 'story',
      ...options.customMetadata,
    };

    return this.uploadImage(file, path, {
      ...options,
      customMetadata: metadata,
    });
  }

  /**
   * Upload an avatar image
   */
  static async uploadAvatar(
    file: Blob | Uint8Array | ArrayBuffer,
    userId: string,
    avatarId: string,
    options: UploadOptions = {},
  ): Promise<ApiResponse<UploadResult>> {
    const path = `${StoragePaths.AVATARS}/${userId}/${avatarId}`;
    const metadata = {
      avatarId,
      userId,
      type: 'avatar',
      ...options.customMetadata,
    };

    return this.uploadImage(file, path, {
      ...options,
      customMetadata: metadata,
    });
  }

  /**
   * Upload a thumbnail image
   */
  static async uploadThumbnail(
    file: Blob | Uint8Array | ArrayBuffer,
    userId: string,
    imageType: string,
    imageId: string,
    options: UploadOptions = {},
  ): Promise<ApiResponse<UploadResult>> {
    const path = `${StoragePaths.THUMBNAILS}/${userId}/${imageType}/${imageId}`;
    const metadata = {
      imageId,
      userId,
      imageType,
      type: 'thumbnail',
      ...options.customMetadata,
    };

    return this.uploadImage(file, path, {
      ...options,
      customMetadata: metadata,
    });
  }

  /**
   * Upload to temporary storage for processing
   */
  static async uploadTemp(
    file: Blob | Uint8Array | ArrayBuffer,
    userId: string,
    tempId: string,
    options: UploadOptions = {},
  ): Promise<ApiResponse<UploadResult>> {
    const path = `${StoragePaths.TEMP}/${userId}/${tempId}`;
    const metadata = {
      tempId,
      userId,
      type: 'temp',
      ...options.customMetadata,
    };

    return this.uploadImage(file, path, {
      ...options,
      customMetadata: metadata,
    });
  }

  /**
   * Upload an event asset (PDF or image) under `/events/{eventId}/assets/{assetId}`
   */
  static async uploadEventAsset(
    file: Blob | Uint8Array | ArrayBuffer,
    eventId: string,
    assetId: string,
    options: UploadOptions = {},
  ): Promise<ApiResponse<UploadResult>> {
    const path = `${StoragePaths.EVENTS}/${eventId}/assets/${assetId}`;

    const metadata = {
      assetId,
      eventId,
      type: 'eventAsset',
      ...options.customMetadata,
    };

    return this.uploadImage(file, path, {
      ...options,
      customMetadata: metadata,
    });
  }

  /**
   * Delete a file from Firebase Storage
   */
  static async deleteFile(path: string): Promise<ApiResponse<void>> {
    try {
      const storageRef = ref(storage, path);
      await deleteObject(storageRef);

      return {
        success: true,
      };
    } catch (_error) {
      const storageError = _error as StorageError;
      return {
        success: false,
        error: this.getStorageErrorMessage(storageError.code),
      };
    }
  }

  /**
   * Delete a snap image
   */
  static async deleteSnap(
    userId: string,
    snapId: string,
  ): Promise<ApiResponse<void>> {
    const path = `${StoragePaths.SNAPS}/${userId}/${snapId}`;
    return this.deleteFile(path);
  }

  /**
   * Delete a story image
   */
  static async deleteStory(
    userId: string,
    storyId: string,
  ): Promise<ApiResponse<void>> {
    const path = `${StoragePaths.STORIES}/${userId}/${storyId}`;
    return this.deleteFile(path);
  }

  /**
   * Delete an avatar image
   */
  static async deleteAvatar(
    userId: string,
    avatarId: string,
  ): Promise<ApiResponse<void>> {
    const path = `${StoragePaths.AVATARS}/${userId}/${avatarId}`;
    return this.deleteFile(path);
  }

  /**
   * Delete a thumbnail image
   */
  static async deleteThumbnail(
    userId: string,
    imageType: string,
    imageId: string,
  ): Promise<ApiResponse<void>> {
    const path = `${StoragePaths.THUMBNAILS}/${userId}/${imageType}/${imageId}`;
    return this.deleteFile(path);
  }

  /**
   * Delete a temporary file
   */
  static async deleteTemp(
    userId: string,
    tempId: string,
  ): Promise<ApiResponse<void>> {
    const path = `${StoragePaths.TEMP}/${userId}/${tempId}`;
    return this.deleteFile(path);
  }

  /**
   * Get file metadata
   */
  static async getFileMetadata(path: string): Promise<ApiResponse<any>> {
    try {
      const storageRef = ref(storage, path);
      const metadata = await getMetadata(storageRef);

      return {
        success: true,
        data: metadata,
      };
    } catch (_error) {
      const storageError = _error as StorageError;
      return {
        success: false,
        error: this.getStorageErrorMessage(storageError.code),
      };
    }
  }

  /**
   * Update file metadata
   */
  static async updateFileMetadata(
    path: string,
    metadata: Record<string, string>,
  ): Promise<ApiResponse<void>> {
    try {
      const storageRef = ref(storage, path);
      await updateMetadata(storageRef, {
        customMetadata: metadata,
      });

      return {
        success: true,
      };
    } catch (_error) {
      const storageError = _error as StorageError;
      return {
        success: false,
        error: this.getStorageErrorMessage(storageError.code),
      };
    }
  }

  /**
   * Get download URL for a file
   */
  static async getDownloadURL(path: string): Promise<ApiResponse<string>> {
    try {
      const storageRef = ref(storage, path);
      const downloadURL = await getDownloadURL(storageRef);

      return {
        success: true,
        data: downloadURL,
      };
    } catch (_error) {
      const storageError = _error as StorageError;
      return {
        success: false,
        error: this.getStorageErrorMessage(storageError.code),
      };
    }
  }

  /**
   * Generate a unique file path for uploads
   */
  static generateFilePath(
    context: UploadContext,
    userId: string,
    fileId?: string,
  ): string {
    const id =
      fileId || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    switch (context) {
      case UploadContext.SNAP:
        return `${StoragePaths.SNAPS}/${userId}/${id}`;
      case UploadContext.STORY:
        return `${StoragePaths.STORIES}/${userId}/${id}`;
      case UploadContext.AVATAR:
        return `${StoragePaths.AVATARS}/${userId}/${id}`;
      case UploadContext.THUMBNAIL:
        return `${StoragePaths.THUMBNAILS}/${userId}/general/${id}`;
      case UploadContext.TEMP:
        return `${StoragePaths.TEMP}/${userId}/${id}`;
      case UploadContext.EVENT_ASSET:
        return `${StoragePaths.EVENTS}/${id}/assets/${id}`;
      default:
        return `${StoragePaths.TEMP}/${userId}/${id}`;
    }
  }

  /**
   * Convert Firebase Storage error codes to user-friendly messages
   */
  private static getStorageErrorMessage(errorCode: string): string {
    switch (errorCode) {
      case 'storage/object-not-found':
        return 'File not found.';
      case 'storage/unauthorized':
        return 'You are not authorized to access this file.';
      case 'storage/canceled':
        return 'Upload was canceled.';
      case 'storage/unknown':
        return 'An unknown error occurred.';
      case 'storage/invalid-format':
        return 'Invalid file format.';
      case 'storage/invalid-event-name':
        return 'Invalid event name.';
      case 'storage/invalid-url':
        return 'Invalid URL.';
      case 'storage/invalid-argument':
        return 'Invalid argument provided.';
      case 'storage/no-default-bucket':
        return 'No default bucket configured.';
      case 'storage/cannot-slice-blob':
        return 'File processing error.';
      case 'storage/server-file-wrong-size':
        return 'File size mismatch.';
      case 'storage/quota-exceeded':
        return 'Storage quota exceeded.';
      case 'storage/unauthenticated':
        return 'User is not authenticated.';
      case 'storage/retry-limit-exceeded':
        return 'Upload retry limit exceeded.';
      default:
        return 'An error occurred while processing the file.';
    }
  }
}
