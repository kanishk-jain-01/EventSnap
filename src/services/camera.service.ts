import { Camera } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';
import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';
import { ApiResponse } from '../types';
import {
  autoOptimizeImage,
  optimizeForContext,
  validateImageSize,
  ImageOptimizationResult,
  formatFileSize,
  calculateCompressionPercentage,
} from '../utils/imageUtils';

export interface CameraPermissions {
  camera: boolean;
  mediaLibrary: boolean;
}

export interface ImagePickerResult {
  uri: string;
  width: number;
  height: number;
  type: 'image';
  fileSize?: number;
}

// Enhanced result interface for Task 4.5
export interface OptimizedImageResult extends ImagePickerResult {
  optimized: boolean;
  originalSize?: number;
  compressionRatio?: number;
  compressionPercentage?: number;
}

export class CameraService {
  /**
   * Request camera permissions
   */
  static async requestCameraPermission(): Promise<ApiResponse<boolean>> {
    try {
      const { status } = await Camera.requestCameraPermissionsAsync();

      if (status === 'granted') {
        return {
          success: true,
          data: true,
        };
      } else {
        return {
          success: false,
          error:
            'Camera permission denied. Please enable camera access in your device settings.',
        };
      }
    } catch {
      return {
        success: false,
        error: 'Failed to request camera permission. Please try again.',
      };
    }
  }

  /**
   * Request media library permissions
   */
  static async requestMediaLibraryPermission(): Promise<ApiResponse<boolean>> {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();

      if (status === 'granted') {
        return {
          success: true,
          data: true,
        };
      } else {
        return {
          success: false,
          error:
            'Media library permission denied. Please enable photo library access in your device settings.',
        };
      }
    } catch {
      return {
        success: false,
        error: 'Failed to request media library permission. Please try again.',
      };
    }
  }

  /**
   * Request image picker permissions (for gallery access)
   */
  static async requestImagePickerPermission(): Promise<ApiResponse<boolean>> {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status === 'granted') {
        return {
          success: true,
          data: true,
        };
      } else {
        return {
          success: false,
          error:
            'Photo library permission denied. Please enable photo library access in your device settings.',
        };
      }
    } catch {
      return {
        success: false,
        error: 'Failed to request photo library permission. Please try again.',
      };
    }
  }

  /**
   * Check current camera permissions
   */
  static async getCameraPermissionStatus(): Promise<ApiResponse<boolean>> {
    try {
      const { status } = await Camera.getCameraPermissionsAsync();
      return {
        success: true,
        data: status === 'granted',
      };
    } catch {
      return {
        success: false,
        error: 'Failed to check camera permission status.',
      };
    }
  }

  /**
   * Check current media library permissions
   */
  static async getMediaLibraryPermissionStatus(): Promise<
    ApiResponse<boolean>
  > {
    try {
      const { status } = await MediaLibrary.getPermissionsAsync();
      return {
        success: true,
        data: status === 'granted',
      };
    } catch {
      return {
        success: false,
        error: 'Failed to check media library permission status.',
      };
    }
  }

  /**
   * Check image picker permissions
   */
  static async getImagePickerPermissionStatus(): Promise<ApiResponse<boolean>> {
    try {
      const { status } = await ImagePicker.getMediaLibraryPermissionsAsync();
      return {
        success: true,
        data: status === 'granted',
      };
    } catch {
      return {
        success: false,
        error: 'Failed to check photo library permission status.',
      };
    }
  }

  /**
   * Get all camera-related permissions
   */
  static async getAllPermissions(): Promise<ApiResponse<CameraPermissions>> {
    try {
      const [cameraResult, mediaLibraryResult] = await Promise.all([
        this.getCameraPermissionStatus(),
        this.getMediaLibraryPermissionStatus(),
      ]);

      return {
        success: true,
        data: {
          camera: cameraResult.data || false,
          mediaLibrary: mediaLibraryResult.data || false,
        },
      };
    } catch {
      return {
        success: false,
        error: 'Failed to check permissions.',
      };
    }
  }

  /**
   * Request all necessary permissions
   */
  static async requestAllPermissions(): Promise<
    ApiResponse<CameraPermissions>
  > {
    try {
      const [cameraResult, mediaLibraryResult] = await Promise.all([
        this.requestCameraPermission(),
        this.requestMediaLibraryPermission(),
      ]);

      const permissions: CameraPermissions = {
        camera: cameraResult.success && cameraResult.data === true,
        mediaLibrary:
          mediaLibraryResult.success && mediaLibraryResult.data === true,
      };

      // Check if we have at least camera permission (media library is optional)
      if (!permissions.camera) {
        return {
          success: false,
          error: 'Camera permission is required to use this feature.',
        };
      }

      return {
        success: true,
        data: permissions,
      };
    } catch {
      return {
        success: false,
        error: 'Failed to request permissions.',
      };
    }
  }

  /**
   * Enhanced image picker with automatic optimization
   */
  static async pickImageFromGallery(
    options: {
      autoOptimize?: boolean;
      context?: 'snap' | 'story' | 'avatar' | 'thumbnail';
      showCompressionInfo?: boolean;
    } = {},
  ): Promise<ApiResponse<OptimizedImageResult | null>> {
    try {
      const {
        autoOptimize = true,
        context = 'snap',
        showCompressionInfo = false,
      } = options;

      // Check permissions first
      const permissionResult = await this.getImagePickerPermissionStatus();

      if (!permissionResult.success || !permissionResult.data) {
        // Request permission if not granted
        const requestResult = await this.requestImagePickerPermission();
        if (!requestResult.success || !requestResult.data) {
          return {
            success: false,
            error: 'Photo library permission is required to select images.',
          };
        }
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        allowsMultipleSelection: false,
      });

      if (result.canceled) {
        return {
          success: true,
          data: null, // User canceled selection
        };
      }

      if (result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        let finalResult: OptimizedImageResult = {
          uri: asset.uri,
          width: asset.width,
          height: asset.height,
          type: 'image',
          fileSize: asset.fileSize,
          optimized: false,
        };

        // Auto-optimize if requested
        if (autoOptimize) {
          try {
            const optimizationResult = await optimizeForContext(
              asset.uri,
              context,
            );

            finalResult = {
              ...finalResult,
              uri: optimizationResult.uri,
              width: optimizationResult.width,
              height: optimizationResult.height,
              fileSize: optimizationResult.fileSize,
              optimized: true,
              originalSize: asset.fileSize,
              compressionRatio: optimizationResult.compressionRatio,
              compressionPercentage: asset.fileSize
                ? calculateCompressionPercentage(
                    asset.fileSize,
                    optimizationResult.fileSize,
                  )
                : undefined,
            };

            // Show compression info if requested
            if (showCompressionInfo && asset.fileSize) {
              const originalSizeStr = formatFileSize(asset.fileSize);
              const compressedSizeStr = formatFileSize(
                optimizationResult.fileSize,
              );
              const compressionPct = calculateCompressionPercentage(
                asset.fileSize,
                optimizationResult.fileSize,
              );

              Alert.alert(
                'Image Optimized',
                `Original: ${originalSizeStr}\nOptimized: ${compressedSizeStr}\nReduction: ${compressionPct}%`,
                [{ text: 'OK' }],
              );
            }
          } catch (optimizationError) {
            console.warn(
              'Image optimization failed, using original:',
              optimizationError,
            );
            // Continue with original image if optimization fails
          }
        }

        return {
          success: true,
          data: finalResult,
        };
      }

      return {
        success: false,
        error: 'No image was selected.',
      };
    } catch {
      return {
        success: false,
        error: 'Failed to open image picker. Please try again.',
      };
    }
  }

  /**
   * Enhanced camera capture with automatic optimization
   */
  static async takePictureWithImagePicker(
    options: {
      autoOptimize?: boolean;
      context?: 'snap' | 'story' | 'avatar' | 'thumbnail';
      showCompressionInfo?: boolean;
    } = {},
  ): Promise<ApiResponse<OptimizedImageResult | null>> {
    try {
      const {
        autoOptimize = true,
        context = 'snap',
        showCompressionInfo = false,
      } = options;

      // Check camera permissions first
      const permissionResult = await this.getCameraPermissionStatus();

      if (!permissionResult.success || !permissionResult.data) {
        // Request permission if not granted
        const requestResult = await this.requestCameraPermission();
        if (!requestResult.success || !requestResult.data) {
          return {
            success: false,
            error: 'Camera permission is required to take photos.',
          };
        }
      }

      // Launch camera
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (result.canceled) {
        return {
          success: true,
          data: null, // User canceled
        };
      }

      if (result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        let finalResult: OptimizedImageResult = {
          uri: asset.uri,
          width: asset.width,
          height: asset.height,
          type: 'image',
          fileSize: asset.fileSize,
          optimized: false,
        };

        // Auto-optimize if requested
        if (autoOptimize) {
          try {
            const optimizationResult = await optimizeForContext(
              asset.uri,
              context,
            );

            finalResult = {
              ...finalResult,
              uri: optimizationResult.uri,
              width: optimizationResult.width,
              height: optimizationResult.height,
              fileSize: optimizationResult.fileSize,
              optimized: true,
              originalSize: asset.fileSize,
              compressionRatio: optimizationResult.compressionRatio,
              compressionPercentage: asset.fileSize
                ? calculateCompressionPercentage(
                    asset.fileSize,
                    optimizationResult.fileSize,
                  )
                : undefined,
            };

            // Show compression info if requested
            if (showCompressionInfo && asset.fileSize) {
              const originalSizeStr = formatFileSize(asset.fileSize);
              const compressedSizeStr = formatFileSize(
                optimizationResult.fileSize,
              );
              const compressionPct = calculateCompressionPercentage(
                asset.fileSize,
                optimizationResult.fileSize,
              );

              Alert.alert(
                'Photo Optimized',
                `Original: ${originalSizeStr}\nOptimized: ${compressedSizeStr}\nReduction: ${compressionPct}%`,
                [{ text: 'OK' }],
              );
            }
          } catch (optimizationError) {
            console.warn(
              'Image optimization failed, using original:',
              optimizationError,
            );
            // Continue with original image if optimization fails
          }
        }

        return {
          success: true,
          data: finalResult,
        };
      }

      return {
        success: false,
        error: 'No photo was taken.',
      };
    } catch {
      return {
        success: false,
        error: 'Failed to open camera. Please try again.',
      };
    }
  }

  /**
   * Optimize existing image for specific context
   */
  static async optimizeImage(
    uri: string,
    context: 'snap' | 'story' | 'avatar' | 'thumbnail' = 'snap',
  ): Promise<ApiResponse<ImageOptimizationResult>> {
    try {
      const result = await optimizeForContext(uri, context);
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to optimize image',
      };
    }
  }

  /**
   * Auto-optimize image with intelligent settings
   */
  static async autoOptimizeImage(
    uri: string,
  ): Promise<ApiResponse<ImageOptimizationResult>> {
    try {
      const result = await autoOptimizeImage(uri);
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to auto-optimize image',
      };
    }
  }

  /**
   * Validate image before processing
   */
  static async validateImage(uri: string): Promise<
    ApiResponse<{
      isValid: boolean;
      currentSize: number;
      maxSize: number;
      compressionNeeded: boolean;
      formattedCurrentSize: string;
      formattedMaxSize: string;
    }>
  > {
    try {
      const validation = await validateImageSize(uri);
      return {
        success: true,
        data: {
          ...validation,
          formattedCurrentSize: formatFileSize(validation.currentSize),
          formattedMaxSize: formatFileSize(validation.maxSize),
        },
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to validate image',
      };
    }
  }

  /**
   * Show image source selection dialog
   */
  static showImageSourceDialog(
    onCamera: () => void,
    onGallery: () => void,
    onCancel?: () => void,
  ) {
    Alert.alert(
      'Select Image Source',
      'Choose how you want to add a photo',
      [
        {
          text: 'Camera',
          onPress: onCamera,
        },
        {
          text: 'Gallery',
          onPress: onGallery,
        },
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: onCancel,
        },
      ],
      { cancelable: true },
    );
  }

  /**
   * Show permission denied alert with settings option
   */
  static showPermissionDeniedAlert(
    permissionType: 'camera' | 'media-library' | 'both',
  ) {
    const messages = {
      camera:
        'Camera access is required to take photos. Please enable camera permission in your device settings.',
      'media-library':
        'Photo library access is required to select images. Please enable photo library permission in your device settings.',
      both: 'Camera and photo library access are required for this feature. Please enable these permissions in your device settings.',
    };

    Alert.alert('Permission Required', messages[permissionType], [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Settings',
        onPress: () => {
          // Note: Opening settings is handled differently on iOS/Android
          // For now, we'll just show the alert. In a real app, you might use
          // Linking.openSettings() or a library like expo-linking
        },
      },
    ]);
  }

  /**
   * Check if camera is available on the device
   */
  static async isCameraAvailable(): Promise<boolean> {
    try {
      // Check if we can get camera permissions (indicates camera is available)
      await Camera.getCameraPermissionsAsync();
      // If we can get any status response, camera is available
      return true;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error checking camera availability:', error);
      return false;
    }
  }
}
