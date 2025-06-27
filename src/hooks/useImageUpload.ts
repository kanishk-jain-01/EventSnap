import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import {
  StorageService,
  UploadResult,
  UploadContext,
  UploadOptions,
} from '../services/storage.service';
import { useAuthStore } from '../store/authStore';

export interface UseImageUploadOptions {
  showSuccessAlert?: boolean;
  showErrorAlert?: boolean;
  onSuccess?: (_result: UploadResult) => void;
  onError?: (_error: string) => void;
}

export interface UseImageUploadReturn {
  // State
  isUploading: boolean;
  uploadProgress: number;
  error: string | null;
  result: UploadResult | null;

  // Actions
  uploadImage: (
    _file: Blob | Uint8Array | ArrayBuffer,
    _context: UploadContext,
    _fileId?: string,
    _options?: UploadOptions,
  ) => Promise<UploadResult | null>;

  uploadStory: (
    _file: Blob | Uint8Array | ArrayBuffer,
    _storyId: string,
    _options?: UploadOptions,
  ) => Promise<UploadResult | null>;
  uploadAvatar: (
    _file: Blob | Uint8Array | ArrayBuffer,
    _avatarId: string,
    _options?: UploadOptions,
  ) => Promise<UploadResult | null>;
  reset: () => void;
}

/**
 * Custom hook for image upload operations with progress tracking
 */
export const useImageUpload = (
  options: UseImageUploadOptions = {},
): UseImageUploadReturn => {
  const {
    showSuccessAlert = false,
    showErrorAlert = true,
    onSuccess,
    onError,
  } = options;

  const { user } = useAuthStore();

  // State
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<UploadResult | null>(null);

  // Reset state
  const reset = useCallback(() => {
    setIsUploading(false);
    setUploadProgress(0);
    setError(null);
    setResult(null);
  }, []);

  // Generic upload function
  const uploadImage = useCallback(
    async (
      file: Blob | Uint8Array | ArrayBuffer,
      context: UploadContext,
      fileId?: string,
      uploadOptions: UploadOptions = {},
    ): Promise<UploadResult | null> => {
      if (!user) {
        const errorMsg = 'User must be authenticated to upload images';
        setError(errorMsg);
        if (showErrorAlert) {
          Alert.alert('Error', errorMsg);
        }
        onError?.(errorMsg);
        return null;
      }

      setIsUploading(true);
      setUploadProgress(0);
      setError(null);
      setResult(null);

      try {
        // Generate file path
        const path = StorageService.generateFilePath(context, user.uid, fileId);

        // Upload with progress tracking
        const response = await StorageService.uploadImage(file, path, {
          ...uploadOptions,
          onProgress: progress => {
            setUploadProgress(progress);
            uploadOptions.onProgress?.(progress);
          },
        });

        if (response.success && response.data) {
          setResult(response.data);

          if (showSuccessAlert) {
            Alert.alert('Success', 'Image uploaded successfully!');
          }

          onSuccess?.(response.data);
          return response.data;
        } else {
          const errorMsg = response.error || 'Upload failed';
          setError(errorMsg);

          if (showErrorAlert) {
            Alert.alert('Upload Error', errorMsg);
          }

          onError?.(errorMsg);
          return null;
        }
      } catch (_err) {
        const errorMsg = 'Unexpected error during upload';
        setError(errorMsg);

        if (showErrorAlert) {
          Alert.alert('Upload Error', errorMsg);
        }

        onError?.(errorMsg);
        return null;
      } finally {
        setIsUploading(false);
      }
    },
    [user, showSuccessAlert, showErrorAlert, onSuccess, onError],
  );



  // Upload story
  const uploadStory = useCallback(
    async (
      file: Blob | Uint8Array | ArrayBuffer,
      storyId: string,
      uploadOptions: UploadOptions = {},
    ): Promise<UploadResult | null> => {
      if (!user) {
        const errorMsg = 'User must be authenticated to upload stories';
        setError(errorMsg);
        if (showErrorAlert) {
          Alert.alert('Error', errorMsg);
        }
        onError?.(errorMsg);
        return null;
      }

      setIsUploading(true);
      setUploadProgress(0);
      setError(null);
      setResult(null);

      try {
        const response = await StorageService.uploadStory(
          file,
          user.uid,
          storyId,
          {
            ...uploadOptions,
            onProgress: progress => {
              setUploadProgress(progress);
              uploadOptions.onProgress?.(progress);
            },
          },
        );

        if (response.success && response.data) {
          setResult(response.data);

          if (showSuccessAlert) {
            Alert.alert('Success', 'Story uploaded successfully!');
          }

          onSuccess?.(response.data);
          return response.data;
        } else {
          const errorMsg = response.error || 'Story upload failed';
          setError(errorMsg);

          if (showErrorAlert) {
            Alert.alert('Upload Error', errorMsg);
          }

          onError?.(errorMsg);
          return null;
        }
      } catch (_err) {
        const errorMsg = 'Unexpected error during story upload';
        setError(errorMsg);

        if (showErrorAlert) {
          Alert.alert('Upload Error', errorMsg);
        }

        onError?.(errorMsg);
        return null;
      } finally {
        setIsUploading(false);
      }
    },
    [user, showSuccessAlert, showErrorAlert, onSuccess, onError],
  );

  // Upload avatar
  const uploadAvatar = useCallback(
    async (
      file: Blob | Uint8Array | ArrayBuffer,
      avatarId: string,
      uploadOptions: UploadOptions = {},
    ): Promise<UploadResult | null> => {
      if (!user) {
        const errorMsg = 'User must be authenticated to upload avatars';
        setError(errorMsg);
        if (showErrorAlert) {
          Alert.alert('Error', errorMsg);
        }
        onError?.(errorMsg);
        return null;
      }

      setIsUploading(true);
      setUploadProgress(0);
      setError(null);
      setResult(null);

      try {
        const response = await StorageService.uploadAvatar(
          file,
          user.uid,
          avatarId,
          {
            ...uploadOptions,
            onProgress: progress => {
              setUploadProgress(progress);
              uploadOptions.onProgress?.(progress);
            },
          },
        );

        if (response.success && response.data) {
          setResult(response.data);

          if (showSuccessAlert) {
            Alert.alert('Success', 'Avatar uploaded successfully!');
          }

          onSuccess?.(response.data);
          return response.data;
        } else {
          const errorMsg = response.error || 'Avatar upload failed';
          setError(errorMsg);

          if (showErrorAlert) {
            Alert.alert('Upload Error', errorMsg);
          }

          onError?.(errorMsg);
          return null;
        }
      } catch (_err) {
        const errorMsg = 'Unexpected error during avatar upload';
        setError(errorMsg);

        if (showErrorAlert) {
          Alert.alert('Upload Error', errorMsg);
        }

        onError?.(errorMsg);
        return null;
      } finally {
        setIsUploading(false);
      }
    },
    [user, showSuccessAlert, showErrorAlert, onSuccess, onError],
  );

  return {
    // State
    isUploading,
    uploadProgress,
    error,
    result,

    // Actions
    uploadImage,

    uploadStory,
    uploadAvatar,
    reset,
  };
};

// Convenience hooks for specific upload types

export const useStoryUpload = (options?: UseImageUploadOptions) => {
  const upload = useImageUpload(options);
  return {
    ...upload,
    uploadStory: upload.uploadStory,
  };
};

export const useAvatarUpload = (options?: UseImageUploadOptions) => {
  const upload = useImageUpload(options);
  return {
    ...upload,
    uploadAvatar: upload.uploadAvatar,
  };
};
