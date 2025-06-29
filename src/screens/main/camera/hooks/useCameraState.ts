import { useState, useEffect, useRef } from 'react';
import { Alert } from 'react-native';
import { CameraView, CameraType } from 'expo-camera';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  CameraService,
  CameraPermissions,
  OptimizedImageResult,
} from '../../../../services/camera.service';
import { formatFileSize } from '../../../../utils/imageUtils';
import { MainStackParamList } from '../../../../navigation/types';
import { useStoryStore } from '../../../../store/storyStore';
import { useEventStore } from '../../../../store/eventStore';
import { CameraState, CameraActions } from '../types';

type CameraScreenNavigationProp = NativeStackNavigationProp<
  MainStackParamList,
  'MainTabs'
>;

export const useCameraState = () => {
  const navigation = useNavigation<CameraScreenNavigationProp>();
  const { activeEvent } = useEventStore();
  const { postStory, isPosting: isPostingStory, postingProgress } = useStoryStore();

  // Camera ref
  const cameraRef = useRef<CameraView>(null);

  // Permission and loading states
  const [permissions, setPermissions] = useState<CameraPermissions | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRequesting, setIsRequesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cameraAvailable, setCameraAvailable] = useState<boolean | null>(null);

  // Camera states
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [cameraType, setCameraType] = useState<CameraType>('back');
  const [flashMode, setFlashMode] = useState<'on' | 'off' | 'auto'>('auto');
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);

  // Enhanced camera controls
  const [zoom, setZoom] = useState(0);
  const [showGrid, setShowGrid] = useState(false);
  const [timerMode, setTimerMode] = useState<0 | 3 | 10>(0);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [timerCount, setTimerCount] = useState(0);

  // Image picker states
  const [selectedImage, setSelectedImage] = useState<OptimizedImageResult | null>(null);
  const [isPickingImage, setIsPickingImage] = useState(false);
  const [imageSource, setImageSource] = useState<'camera' | 'gallery' | null>(null);

  // Image optimization states
  const [autoOptimize, setAutoOptimize] = useState(true);
  const [showCompressionInfo] = useState(true);
  const [imageContext] = useState<'story'>('story');

  // Text overlay states
  const [showTextOverlay, setShowTextOverlay] = useState(false);
  const [overlayText, setOverlayText] = useState('');
  const [textPosition, _setTextPosition] = useState<{ x: number; y: number }>({
    x: 50,
    y: 50,
  });

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
  }, [isTimerActive, timerCount]);

  // Check initial permissions and camera availability
  useEffect(() => {
    checkInitialState();
  }, []);

  const checkInitialState = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const isAvailable = await CameraService.isCameraAvailable();
      setCameraAvailable(isAvailable);

      if (isAvailable) {
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

  const onCameraReady = () => {
    setIsCameraReady(true);
  };

  const takePicture = async () => {
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

            if (showCompressionInfo) {
              const compressedSizeStr = formatFileSize(optimizedData.fileSize);
              Alert.alert(
                'Photo Optimized!',
                `Optimized for ${imageContext}\nSize: ${compressedSizeStr}\nCompression: ${optimizedData.compressionRatio.toFixed(1)}x`,
                [
                  {
                    text: 'Take Another',
                    onPress: resetImage,
                  },
                  { text: 'OK' },
                ],
              );
            } else {
              Alert.alert(
                'Photo Captured!',
                'Photo captured and optimized successfully!',
                [
                  {
                    text: 'Take Another',
                    onPress: resetImage,
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
              fileSize: undefined,
              optimized: false,
              originalSize: undefined,
              compressionRatio: undefined,
            });
            setImageSource('camera');

            Alert.alert(
              'Photo Captured!',
              'Photo captured successfully!',
              [
                {
                  text: 'Take Another',
                  onPress: resetImage,
                },
                { text: 'OK' },
              ],
            );
          }
        } catch {
          // Fallback to original photo if optimization fails
          setCapturedPhoto(photo.uri);
          setSelectedImage({
            uri: photo.uri,
            width: photo.width || 0,
            height: photo.height || 0,
            type: 'image',
            fileSize: undefined,
            optimized: false,
            originalSize: undefined,
            compressionRatio: undefined,
          });
          setImageSource('camera');

          Alert.alert(
            'Photo Captured!',
            'Photo captured successfully!',
            [
              {
                text: 'Take Another',
                onPress: resetImage,
              },
              { text: 'OK' },
            ],
          );
        }
      } else {
        setCapturedPhoto(photo.uri);
        setSelectedImage({
          uri: photo.uri,
          width: photo.width || 0,
          height: photo.height || 0,
          type: 'image',
          fileSize: undefined,
          optimized: false,
          originalSize: undefined,
          compressionRatio: undefined,
        });
        setImageSource('camera');

        Alert.alert(
          'Photo Captured!',
          'Photo captured successfully!',
          [
            {
              text: 'Take Another',
              onPress: resetImage,
            },
            { text: 'OK' },
          ],
        );
      }
    } catch {
      Alert.alert('Error', 'Failed to capture photo. Please try again.');
    } finally {
      setIsCapturing(false);
    }
  };

  const pickImageFromGallery = async () => {
    setIsPickingImage(true);
    setError(null);

    try {
      const result = await CameraService.pickImageFromGallery();

      if (result.success && result.data) {
        const imageData = result.data;
        setCapturedPhoto(imageData.uri);
        setSelectedImage(imageData);
        setImageSource('gallery');

        const compressionText = imageData.compressionRatio
          ? `\nCompressed ${imageData.compressionRatio.toFixed(1)}x`
          : '';

        Alert.alert(
          'Image Selected!',
          `Image selected from gallery successfully!${compressionText}`,
          [
            {
              text: 'Select Another',
              onPress: resetImage,
            },
            { text: 'OK' },
          ],
        );
      } else if (result.success && result.data === null) {
        // User canceled selection
      } else {
        setError(result.error || 'Failed to select image from gallery');
      }
    } catch {
      setError('Failed to open gallery');
    } finally {
      setIsPickingImage(false);
    }
  };

  const toggleOptimization = () => {
    setAutoOptimize(!autoOptimize);
  };

  const toggleCameraType = () => {
    setCameraType(cameraType === 'back' ? 'front' : 'back');
  };

  const toggleFlashMode = () => {
    const modes: ('auto' | 'on' | 'off')[] = ['auto', 'on', 'off'];
    const currentIndex = modes.indexOf(flashMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    setFlashMode(modes[nextIndex]);
  };

  const toggleGrid = () => {
    setShowGrid(!showGrid);
  };

  const toggleTimer = () => {
    const modes: (0 | 3 | 10)[] = [0, 3, 10];
    const currentIndex = modes.indexOf(timerMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    setTimerMode(modes[nextIndex]);
  };

  const startTimerCapture = () => {
    if (timerMode === 0) {
      takePicture();
    } else {
      setTimerCount(timerMode);
      setIsTimerActive(true);
    }
  };

  const adjustZoom = (direction: 'in' | 'out') => {
    setZoom(prev => {
      if (direction === 'in') {
        return Math.min(prev + 0.1, 1);
      } else {
        return Math.max(prev - 0.1, 0);
      }
    });
  };

  const refreshPermissions = async () => {
    await checkInitialState();
  };

  const handleTextOverlayPress = () => {
    setShowTextOverlay(true);
  };

  const handleTextOverlayConfirm = () => {
    setShowTextOverlay(false);
  };

  const handleTextOverlayCancel = () => {
    setShowTextOverlay(false);
    setOverlayText('');
  };

  const clearTextOverlay = () => {
    setOverlayText('');
  };

  const updateTextPosition = (newPosition: { x: number; y: number }) => {
    _setTextPosition(newPosition);
  };

  const resetImage = () => {
    setCapturedPhoto(null);
    setSelectedImage(null);
    setImageSource(null);
    setOverlayText('');
    _setTextPosition({ x: 50, y: 50 });
  };

  const handlePostStory = async () => {
    if (!capturedPhoto) return;

    try {
      // Prepare text overlay data if present
      const textOverlayData = overlayText.trim() ? {
        text: overlayText.trim(),
        position: textPosition,
      } : undefined;

      // Post the story with text overlay metadata
      const success = await postStory(capturedPhoto, activeEvent?.id, textOverlayData);
      
      if (success) {
        const message = overlayText
          ? 'Story posted with text overlay!'
          : 'Story posted successfully!';
        Alert.alert('Story Posted!', message);
        navigation.navigate('MainTabs', { screen: 'Home' });
        resetImage();
      } else {
        Alert.alert('Error', 'Failed to post story.');
      }
    } catch (error) {
      console.error('Error posting story:', error);
      Alert.alert('Error', 'Failed to post story.');
    }
  };

  const state: CameraState = {
    isLoading,
    isRequesting,
    error,
    cameraAvailable,
    isCameraReady,
    isCapturing,
    cameraType,
    flashMode,
    capturedPhoto,
    zoom,
    showGrid,
    timerMode,
    isTimerActive,
    timerCount,
    selectedImage,
    isPickingImage,
    imageSource,
    autoOptimize,
    showCompressionInfo,
    imageContext,
    showTextOverlay,
    overlayText,
    textPosition,
  };

  const actions: CameraActions = {
    checkInitialState,
    requestPermissions: requestPermissions,
    refreshPermissions,
    onCameraReady,
    takePicture,
    toggleCameraType,
    toggleFlashMode,
    toggleGrid,
    toggleTimer,
    startTimerCapture,
    adjustZoom,
    pickImageFromGallery,
    toggleOptimization,
    handleTextOverlayPress,
    handleTextOverlayConfirm,
    handleTextOverlayCancel,
    clearTextOverlay,
    updateTextPosition,
    handlePostStory,
    resetImage,
  };

  return {
    state,
    actions,
    cameraRef,
    permissions,
    isPostingStory,
    postingProgress,
    setOverlayText,
    updateTextPosition,
  };
}; 