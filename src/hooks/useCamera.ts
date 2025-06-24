import { useState, useEffect, useRef, useCallback } from 'react';
import { Alert } from 'react-native';
import { CameraView, CameraType } from 'expo-camera';
import {
  CameraService,
  CameraPermissions,
  OptimizedImageResult,
} from '../services/camera.service';
import { formatFileSize } from '../utils/imageUtils';

export interface UseCameraOptions {
  autoOptimize?: boolean;
  showCompressionInfo?: boolean;
  initialContext?: 'snap' | 'story' | 'avatar' | 'thumbnail';
  initialCameraType?: CameraType;
  initialFlashMode?: 'on' | 'off' | 'auto';
}

export interface UseCameraReturn {
  // Camera ref
  cameraRef: React.RefObject<CameraView | null>;

  // Permission states
  permissions: CameraPermissions | null;
  isLoading: boolean;
  isRequesting: boolean;
  error: string | null;
  cameraAvailable: boolean | null;

  // Camera states
  isCameraReady: boolean;
  isCapturing: boolean;
  cameraType: CameraType;
  flashMode: 'on' | 'off' | 'auto';
  zoom: number;
  showGrid: boolean;

  // Timer states
  timerMode: 0 | 3 | 10;
  isTimerActive: boolean;
  timerCount: number;

  // Image states
  capturedPhoto: string | null;
  selectedImage: OptimizedImageResult | null;
  isPickingImage: boolean;
  imageSource: 'camera' | 'gallery' | null;

  // Optimization states
  autoOptimize: boolean;
  showCompressionInfo: boolean;
  imageContext: 'snap' | 'story' | 'avatar' | 'thumbnail';

  // Permission actions
  checkInitialState: () => Promise<void>;
  requestPermissions: () => Promise<void>;
  refreshPermissions: () => Promise<void>;

  // Camera actions
  onCameraReady: () => void;
  takePicture: () => Promise<void>;
  toggleCameraType: () => void;
  toggleFlashMode: () => void;
  adjustZoom: (_direction: 'in' | 'out') => void;
  toggleGrid: () => void;

  // Timer actions
  toggleTimer: () => void;
  startTimerCapture: () => void;

  // Image actions
  pickImageFromGallery: () => Promise<void>;
  showImageSourceDialog: () => void;
  clearCapturedImage: () => void;

  // Optimization actions
  toggleOptimization: () => void;
  cycleImageContext: () => void;

  // Utility functions
  getFlashModeIcon: () => string;
  getFlashModeText: () => string;
  hasAllPermissions: boolean;
  canUseCamera: boolean;
  canUseGallery: boolean;
}

/**
 * Custom hook for camera functionality and permissions
 * Abstracts all camera-related logic from components
 */
export const useCamera = (options: UseCameraOptions = {}): UseCameraReturn => {
  const {
    autoOptimize: initialAutoOptimize = true,
    showCompressionInfo: initialShowCompressionInfo = true,
    initialContext = 'snap',
    initialCameraType = 'back',
    initialFlashMode = 'auto',
  } = options;

  // Camera ref
  const cameraRef = useRef<CameraView>(null);

  // Permission and loading states
  const [permissions, setPermissions] = useState<CameraPermissions | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isRequesting, setIsRequesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cameraAvailable, setCameraAvailable] = useState<boolean | null>(null);

  // Camera states
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [cameraType, setCameraType] = useState<CameraType>(initialCameraType);
  const [flashMode, setFlashMode] = useState<'on' | 'off' | 'auto'>(
    initialFlashMode,
  );
  const [zoom, setZoom] = useState(0);
  const [showGrid, setShowGrid] = useState(false);

  // Timer states
  const [timerMode, setTimerMode] = useState<0 | 3 | 10>(0);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [timerCount, setTimerCount] = useState(0);

  // Image states
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] =
    useState<OptimizedImageResult | null>(null);
  const [isPickingImage, setIsPickingImage] = useState(false);
  const [imageSource, setImageSource] = useState<'camera' | 'gallery' | null>(
    null,
  );

  // Optimization states
  const [autoOptimize, setAutoOptimize] = useState(initialAutoOptimize);
  const [showCompressionInfo] = useState(initialShowCompressionInfo);
  const [imageContext, setImageContext] = useState<
    'snap' | 'story' | 'avatar' | 'thumbnail'
  >(initialContext);

  // Check initial permissions and camera availability
  useEffect(() => {
    checkInitialState();
  }, []);

  // Permission actions
  const checkInitialState = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Check if camera is available
      const isAvailable = await CameraService.isCameraAvailable();
      setCameraAvailable(isAvailable);

      if (isAvailable) {
        // Check current permissions
        const permissionsResult = await CameraService.getAllPermissions();
        if (permissionsResult.success && permissionsResult.data) {
          setPermissions(permissionsResult.data);
        } else {
          setError(permissionsResult.error || 'Failed to check permissions');
        }
      }
    } catch {
      setError('Failed to initialize camera');
    } finally {
      setIsLoading(false);
    }
  };

  const requestPermissions = async () => {
    setIsRequesting(true);
    setError(null);

    try {
      const result = await CameraService.requestAllPermissions();

      if (result.success && result.data) {
        setPermissions(result.data);
        Alert.alert('Success!', 'Camera permissions granted successfully.', [
          { text: 'OK' },
        ]);
      } else {
        setError(result.error || 'Failed to request permissions');
        CameraService.showPermissionDeniedAlert('camera');
      }
    } catch {
      setError('Failed to request permissions');
    } finally {
      setIsRequesting(false);
    }
  };

  const refreshPermissions = async () => {
    try {
      const permissionsResult = await CameraService.getAllPermissions();
      if (permissionsResult.success && permissionsResult.data) {
        setPermissions(permissionsResult.data);
        setError(null);
      }
    } catch {
      setError('Failed to refresh permissions');
    }
  };

  // Camera actions
  const onCameraReady = () => {
    setIsCameraReady(true);
  };

  const takePicture = useCallback(async () => {
    if (!cameraRef.current || !isCameraReady || isCapturing) {
      return;
    }

    setIsCapturing(true);

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
        skipProcessing: false,
      });

      // Enhanced image handling with optimization
      if (autoOptimize) {
        try {
          const optimizationResult = await CameraService.optimizeImage(
            photo.uri,
            imageContext,
          );

          if (optimizationResult.success && optimizationResult.data) {
            const optimizedData = optimizationResult.data;

            setCapturedPhoto(optimizedData.uri);
            setSelectedImage({
              uri: optimizedData.uri,
              width: optimizedData.width,
              height: optimizedData.height,
              type: 'image',
              fileSize: optimizedData.fileSize,
              optimized: true,
              originalSize: undefined,
              compressionRatio: optimizedData.compressionRatio,
            });
            setImageSource('camera');

            // Show compression feedback if enabled
            if (showCompressionInfo) {
              const compressedSizeStr = formatFileSize(optimizedData.fileSize);
              Alert.alert(
                'Photo Optimized!',
                `Optimized for ${imageContext}\nSize: ${compressedSizeStr}\nCompression: ${optimizedData.compressionRatio.toFixed(1)}x`,
                [
                  {
                    text: 'Take Another',
                    onPress: clearCapturedImage,
                  },
                  { text: 'OK' },
                ],
              );
            }
          } else {
            // Fallback to original photo if optimization fails
            setCapturedPhoto(photo.uri);
            setSelectedImage({
              uri: photo.uri,
              width: photo.width || 0,
              height: photo.height || 0,
              type: 'image',
              optimized: false,
            });
            setImageSource('camera');
          }
        } catch {
          // Fallback to original photo if optimization fails
          setCapturedPhoto(photo.uri);
          setSelectedImage({
            uri: photo.uri,
            width: photo.width || 0,
            height: photo.height || 0,
            type: 'image',
            optimized: false,
          });
          setImageSource('camera');
        }
      } else {
        // No optimization - use original photo
        setCapturedPhoto(photo.uri);
        setSelectedImage({
          uri: photo.uri,
          width: photo.width || 0,
          height: photo.height || 0,
          type: 'image',
          optimized: false,
        });
        setImageSource('camera');

        Alert.alert('Photo Captured!', 'Photo taken successfully.', [
          {
            text: 'Take Another',
            onPress: clearCapturedImage,
          },
          { text: 'OK' },
        ]);
      }
    } catch {
      Alert.alert('Error', 'Failed to take picture. Please try again.');
    } finally {
      setIsCapturing(false);
    }
  }, [
    cameraRef,
    isCameraReady,
    isCapturing,
    autoOptimize,
    imageContext,
    showCompressionInfo,
  ]);

  // Timer countdown effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerActive && timerCount > 0) {
      interval = setInterval(() => {
        setTimerCount(prev => {
          if (prev <= 1) {
            setIsTimerActive(false);
            takePicture();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerActive, timerCount, takePicture]);

  const toggleCameraType = () => {
    setCameraType(current => (current === 'back' ? 'front' : 'back'));
  };

  const toggleFlashMode = () => {
    setFlashMode(current => {
      if (current === 'auto') return 'on';
      if (current === 'on') return 'off';
      return 'auto';
    });
  };

  const adjustZoom = (direction: 'in' | 'out') => {
    setZoom(current => {
      const increment = 0.1;
      const newZoom =
        direction === 'in' ? current + increment : current - increment;
      return Math.max(0, Math.min(1, newZoom));
    });
  };

  const toggleGrid = () => {
    setShowGrid(current => !current);
  };

  // Timer actions
  const toggleTimer = () => {
    setTimerMode(current => {
      if (current === 0) return 3;
      if (current === 3) return 10;
      return 0;
    });
  };

  const startTimerCapture = () => {
    if (timerMode > 0) {
      setTimerCount(timerMode);
      setIsTimerActive(true);
    } else {
      takePicture();
    }
  };

  // Image actions
  const pickImageFromGallery = async () => {
    setIsPickingImage(true);

    try {
      const result = await CameraService.pickImageFromGallery({
        autoOptimize,
        context: imageContext,
        showCompressionInfo,
      });

      if (result.success && result.data) {
        const imageData = result.data;
        setCapturedPhoto(imageData.uri);
        setSelectedImage(imageData);
        setImageSource('gallery');
      } else if (result.error) {
        Alert.alert('Error', result.error);
      }
    } catch {
      Alert.alert('Error', 'Failed to select image from gallery.');
    } finally {
      setIsPickingImage(false);
    }
  };

  const showImageSourceDialog = () => {
    CameraService.showImageSourceDialog(() => {
      // Camera selected
      clearCapturedImage();
    }, pickImageFromGallery);
  };

  const clearCapturedImage = () => {
    setCapturedPhoto(null);
    setSelectedImage(null);
    setImageSource(null);
  };

  // Optimization actions
  const toggleOptimization = () => {
    setAutoOptimize(current => !current);
  };

  const cycleImageContext = () => {
    setImageContext(current => {
      const contexts: Array<'snap' | 'story' | 'avatar' | 'thumbnail'> = [
        'snap',
        'story',
        'avatar',
        'thumbnail',
      ];
      const currentIndex = contexts.indexOf(current);
      const nextIndex = (currentIndex + 1) % contexts.length;
      return contexts[nextIndex];
    });
  };

  // Utility functions
  const getFlashModeIcon = (): string => {
    switch (flashMode) {
      case 'on':
        return '⚡';
      case 'off':
        return '⚡';
      case 'auto':
      default:
        return '⚡';
    }
  };

  const getFlashModeText = (): string => {
    switch (flashMode) {
      case 'on':
        return 'Flash: On';
      case 'off':
        return 'Flash: Off';
      case 'auto':
      default:
        return 'Flash: Auto';
    }
  };

  // Computed values
  const hasAllPermissions = Boolean(
    permissions?.camera && permissions?.mediaLibrary,
  );
  const canUseCamera = Boolean(cameraAvailable && permissions?.camera);
  const canUseGallery = Boolean(permissions?.mediaLibrary);

  return {
    // Camera ref
    cameraRef,

    // Permission states
    permissions,
    isLoading,
    isRequesting,
    error,
    cameraAvailable,

    // Camera states
    isCameraReady,
    isCapturing,
    cameraType,
    flashMode,
    zoom,
    showGrid,

    // Timer states
    timerMode,
    isTimerActive,
    timerCount,

    // Image states
    capturedPhoto,
    selectedImage,
    isPickingImage,
    imageSource,

    // Optimization states
    autoOptimize,
    showCompressionInfo,
    imageContext,

    // Permission actions
    checkInitialState,
    requestPermissions,
    refreshPermissions,

    // Camera actions
    onCameraReady,
    takePicture,
    toggleCameraType,
    toggleFlashMode,
    adjustZoom,
    toggleGrid,

    // Timer actions
    toggleTimer,
    startTimerCapture,

    // Image actions
    pickImageFromGallery,
    showImageSourceDialog,
    clearCapturedImage,

    // Optimization actions
    toggleOptimization,
    cycleImageContext,

    // Utility functions
    getFlashModeIcon,
    getFlashModeText,
    hasAllPermissions,
    canUseCamera,
    canUseGallery,
  };
};

/**
 * Hook to check camera permissions (convenience hook)
 */
export const useCameraPermissions = (): CameraPermissions | null => {
  const { permissions } = useCamera();
  return permissions;
};

/**
 * Hook to check if camera is ready to use (convenience hook)
 */
export const useIsCameraReady = (): boolean => {
  const { canUseCamera, isCameraReady } = useCamera();
  return canUseCamera && isCameraReady;
};

/**
 * Hook to get current captured image (convenience hook)
 */
export const useCapturedImage = (): OptimizedImageResult | null => {
  const { selectedImage } = useCamera();
  return selectedImage;
};
