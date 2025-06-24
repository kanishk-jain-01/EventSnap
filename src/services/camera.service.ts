import { Camera } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';
import { Alert } from 'react-native';
import { ApiResponse } from '../types';

export interface CameraPermissions {
  camera: boolean;
  mediaLibrary: boolean;
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
