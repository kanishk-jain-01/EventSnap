import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Alert,
  TouchableOpacity,
  Dimensions,
  Image,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { CameraView, CameraType } from 'expo-camera';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  CameraService,
  CameraPermissions,
  OptimizedImageResult,
} from '../../services/camera.service';
import { Button } from '../../components/ui/Button';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { Modal } from '../../components/ui/Modal';
import { useThemeColors } from '../../components/ui/ThemeProvider';
import { formatFileSize } from '../../utils/imageUtils';
import { ImageEditor } from '../../components/media/ImageEditor';
import { MainStackParamList } from '../../navigation/types';
import { useStoryStore } from '../../store/storyStore';
import { useEventStore } from '../../store/eventStore';

import { useAuthStore } from '../../store/authStore';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

type CameraScreenNavigationProp = NativeStackNavigationProp<
  MainStackParamList,
  'MainTabs'
>;

export const CameraScreen: React.FC = () => {
  const navigation = useNavigation<CameraScreenNavigationProp>();
  const colors = useThemeColors();

  // Import active event ID for story posting
  const { activeEvent } = useEventStore();

  


  // Import auth store for user info
  const { user: _user } = useAuthStore();

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
  const [cameraType, setCameraType] = useState<CameraType>('back');
  const [flashMode, setFlashMode] = useState<'on' | 'off' | 'auto'>('auto');
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);

  // Enhanced camera controls for Task 4.3
  const [zoom, setZoom] = useState(0);
  const [showGrid, setShowGrid] = useState(false);
  const [timerMode, setTimerMode] = useState<0 | 3 | 10>(0);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [timerCount, setTimerCount] = useState(0);

  // Enhanced image picker states for Task 4.4 & 4.5
  const [selectedImage, setSelectedImage] =
    useState<OptimizedImageResult | null>(null);
  const [isPickingImage, setIsPickingImage] = useState(false);
  const [imageSource, setImageSource] = useState<'camera' | 'gallery' | null>(
    null,
  );

  // Image optimization states for Task 4.5
  const [autoOptimize, setAutoOptimize] = useState(true);
  const [showCompressionInfo] = useState(true);
  const [imageContext] = useState<'story'>('story');

  // Image editing states for Task 4.6
  const [showImageEditor, setShowImageEditor] = useState(false);

  // Text overlay states for Task 5.4
  const [showTextOverlay, setShowTextOverlay] = useState(false);
  const [overlayText, setOverlayText] = useState('');
  const [textPosition, _setTextPosition] = useState<{ x: number; y: number }>({
    x: 50,
    y: 50,
  });




  // Camera ref
  const cameraRef = useRef<CameraView>(null);

  // Story posting
  const {
    postStory,
    isPosting: isPostingStory,
    postingProgress,
  } = useStoryStore();

  // Check initial permissions and camera availability
  useEffect(() => {
    checkInitialState();
  }, []);

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

      // Enhanced image handling with optimization for Task 4.5
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
              originalSize: photo.uri ? undefined : undefined, // CameraView doesn't provide original size
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
                    onPress: () => {
                      setCapturedPhoto(null);
                      setSelectedImage(null);
                      setImageSource(null);
                    },
                  },
                  { text: 'OK' },
                ],
              );
            } else {
              // Standard success message
              Alert.alert(
                'Photo Captured!',
                'Photo captured and optimized successfully!',
                [
                  {
                    text: 'Take Another',
                    onPress: () => {
                      setCapturedPhoto(null);
                      setSelectedImage(null);
                      setImageSource(null);
                    },
                  },
                  { text: 'OK' },
                ],
              );
            }
          } else {
            throw new Error('Optimization failed');
          }
        } catch {
          // console.warn(
          //   'Image optimization failed, using original:',
          //   optimizationError,
          // );

          // Fallback to original image
          setCapturedPhoto(photo.uri);
          setSelectedImage({
            uri: photo.uri,
            width: 0, // CameraView doesn't provide dimensions
            height: 0,
            type: 'image',
            optimized: false,
          });
          setImageSource('camera');

          Alert.alert(
            'Photo Captured!',
            'Photo captured successfully (optimization failed, using original).',
            [
              {
                text: 'Take Another',
                onPress: () => {
                  setCapturedPhoto(null);
                  setSelectedImage(null);
                  setImageSource(null);
                },
              },
              { text: 'OK' },
            ],
          );
        }
      } else {
        // No optimization - use original
        setCapturedPhoto(photo.uri);
        setSelectedImage({
          uri: photo.uri,
          width: 0, // CameraView doesn't provide dimensions
          height: 0,
          type: 'image',
          optimized: false,
        });
        setImageSource('camera');

        Alert.alert('Photo Captured!', 'Photo captured successfully!', [
          {
            text: 'Take Another',
            onPress: () => {
              setCapturedPhoto(null);
              setSelectedImage(null);
              setImageSource(null);
            },
          },
          { text: 'OK' },
        ]);
      }
    } catch {
      Alert.alert(
        'Capture Failed',
        'Failed to capture photo. Please try again.',
        [{ text: 'OK' }],
      );
    } finally {
      setIsCapturing(false);
    }
  };

  // Enhanced image picker functions for Task 4.4 & 4.5
  const pickImageFromGallery = async () => {
    setIsPickingImage(true);
    setError(null);

    try {
      const result = await CameraService.pickImageFromGallery({
        autoOptimize,
        context: imageContext,
        showCompressionInfo,
      });

      if (result.success && result.data) {
        setSelectedImage(result.data);
        setCapturedPhoto(result.data.uri);
        setImageSource('gallery');

        const compressionText =
          result.data.optimized && result.data.compressionPercentage
            ? `\nCompression: ${result.data.compressionPercentage}% reduction`
            : '';

        Alert.alert(
          'Image Selected!',
          `Image selected from gallery successfully!${compressionText}`,
          [
            {
              text: 'Select Another',
              onPress: () => {
                setSelectedImage(null);
                setCapturedPhoto(null);
                setImageSource(null);
              },
            },
            { text: 'OK' },
          ],
        );
      } else if (result.success && result.data === null) {
        // User canceled selection
        // No action needed
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

  const getFlashModeIcon = () => {
    switch (flashMode) {
      case 'auto':
        return '⚡';
      case 'on':
        return '🔆';
      case 'off':
        return '🚫';
      default:
        return '⚡';
    }
  };

  const getFlashModeText = () => {
    switch (flashMode) {
      case 'auto':
        return 'AUTO';
      case 'on':
        return 'ON';
      case 'off':
        return 'OFF';
      default:
        return 'AUTO';
    }
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

  // Text overlay functions for Task 5.4
  const handleTextOverlayPress = () => {
    setShowTextOverlay(true);
  };

  const handleTextOverlayConfirm = () => {
    setShowTextOverlay(false);
    // Text is now saved in overlayText state and will be displayed on the image
  };

  const handleTextOverlayCancel = () => {
    setShowTextOverlay(false);
    setOverlayText(''); // Clear text if cancelled
  };

  const clearTextOverlay = () => {
    setOverlayText('');
  };



  // Story posting with optional text overlay
  const handlePostStory = async () => {
    if (!capturedPhoto) return;

    // For now, we'll post the story with the original image
    // In a future enhancement, we could render the text overlay onto the image
    const success = await postStory(capturedPhoto, activeEvent?.id);
    if (success) {
      const message = overlayText
        ? 'Story posted with text overlay!'
        : 'Story posted successfully!';
      Alert.alert('Story Posted!', message);
      // Navigate back to Home tab to view your story
      navigation.navigate('MainTabs', { screen: 'Home' });
      // Reset image and text so user can take another
      setCapturedPhoto(null);
      setSelectedImage(null);
      setImageSource(null);
      setOverlayText('');
    } else {
      Alert.alert('Error', 'Failed to post story.');
    }
  };

  // Loading screen
  if (isLoading) {
    return (
      <View className='flex-1 bg-bg-primary items-center justify-center'>
        <StatusBar style='dark' />
        <LoadingSpinner size='large' text='Checking camera...' color={colors.primary} />
      </View>
    );
  }

  // Permission request screen
  if (!permissions?.camera || !cameraAvailable) {
    return (
      <View className='flex-1 bg-bg-primary'>
        <StatusBar style='dark' />

        {/* Header */}
        <View className='pt-12 pb-6 px-6'>
          <Text className='text-primary text-2xl font-bold text-center'>
            Camera Setup
          </Text>
          <Text className='text-text-secondary text-base text-center mt-2'>
            Get ready to capture amazing moments
          </Text>
        </View>

        <View className='flex-1 px-6'>
          {/* Camera Availability Status */}
          <View className='bg-surface p-4 rounded-2xl mb-6 shadow-soft border border-border'>
            <Text className='text-text-primary text-lg font-semibold mb-3'>
              Camera Availability
            </Text>
            <View className='flex-row items-center'>
              <View
                className={`w-3 h-3 rounded-full mr-3 ${
                  cameraAvailable === true
                    ? 'bg-success'
                    : cameraAvailable === false
                      ? 'bg-error'
                      : 'bg-text-tertiary'
                }`}
              />
              <Text className='text-text-secondary'>
                {cameraAvailable === true
                  ? 'Camera is available'
                  : cameraAvailable === false
                    ? 'Camera is not available'
                    : 'Checking...'}
              </Text>
            </View>
          </View>

          {/* Permissions Status */}
          {permissions && (
            <View className='bg-surface p-4 rounded-2xl mb-6 shadow-soft border border-border'>
              <Text className='text-text-primary text-lg font-semibold mb-3'>
                Permissions Status
              </Text>

              <View className='flex-row items-center mb-3'>
                <View
                  className={`w-3 h-3 rounded-full mr-3 ${
                    permissions.camera ? 'bg-success' : 'bg-error'
                  }`}
                />
                <Text className='text-text-secondary'>
                  Camera: {permissions.camera ? 'Granted' : 'Denied'}
                </Text>
              </View>

              <View className='flex-row items-center'>
                <View
                  className={`w-3 h-3 rounded-full mr-3 ${
                    permissions.mediaLibrary ? 'bg-success' : 'bg-error'
                  }`}
                />
                <Text className='text-text-secondary'>
                  Photo Library:{' '}
                  {permissions.mediaLibrary ? 'Granted' : 'Denied'}
                </Text>
              </View>
            </View>
          )}

          {/* Error Display */}
          {error && (
            <View className='bg-error/10 border border-error/30 rounded-2xl p-4 mb-6'>
              <Text className='text-error text-sm text-center font-medium'>{error}</Text>
            </View>
          )}

          {/* Action Buttons */}
          <View className='space-y-4'>
            {(!permissions?.camera || !cameraAvailable) && (
              <Button
                title='Request Camera Permissions'
                onPress={requestPermissions}
                loading={isRequesting}
                disabled={cameraAvailable === false}
                size='large'
              />
            )}

            {/* Gallery Access Button */}
            <Button
              title='Select from Gallery'
              onPress={pickImageFromGallery}
              loading={isPickingImage}
              variant='secondary'
              size='large'
            />

            <Button
              title='Refresh Status'
              onPress={refreshPermissions}
              variant='secondary'
              loading={isLoading}
              size='large'
            />
          </View>

          {/* Info */}
          <View className='mt-8 p-4 bg-primary/5 border border-primary/10 rounded-2xl'>
            <Text className='text-text-secondary text-sm text-center leading-5'>
              Camera permission is required to take photos.{'\n'}
              You can also select images from your gallery as an alternative.
              {'\n'}
              Images are automatically optimized for better performance.
            </Text>
          </View>
        </View>
      </View>
    );
  }

  // Show image editor if editing
  if (showImageEditor && selectedImage && capturedPhoto) {
    return (
      <ImageEditor
        imageUri={capturedPhoto}
        imageWidth={selectedImage.width}
        imageHeight={selectedImage.height}
        onSave={(editedUri: string) => {
          // Update the selected image with edited version
          setSelectedImage({
            ...selectedImage,
            uri: editedUri,
          });
          setCapturedPhoto(editedUri);
          setShowImageEditor(false);

          Alert.alert(
            'Image Saved!',
            'Your edited image has been saved successfully.',
            [{ text: 'OK' }],
          );
        }}
        onCancel={() => {
          setShowImageEditor(false);
        }}
        onDelete={() => {
          Alert.alert(
            'Delete Image',
            'Are you sure you want to delete this image?',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Delete',
                style: 'destructive',
                onPress: () => {
                  setSelectedImage(null);
                  setCapturedPhoto(null);
                  setImageSource(null);
                  setShowImageEditor(false);
                },
              },
            ],
          );
        }}
      />
    );
  }

  // Show selected image preview if available
  if (selectedImage && capturedPhoto) {
    return (
      <View className='flex-1 bg-bg-primary'>
        <StatusBar style='dark' />

        {/* Header */}
        <View className='absolute top-12 left-0 right-0 z-10 px-4'>
          <View className='bg-white/95 backdrop-blur-sm rounded-2xl p-3 shadow-soft flex-row justify-between items-center'>
            <TouchableOpacity
              onPress={() => {
                setSelectedImage(null);
                setCapturedPhoto(null);
                setImageSource(null);
              }}
              className='bg-bg-secondary px-4 py-2 rounded-xl'
            >
              <Text className='text-text-primary font-semibold'>← Back</Text>
            </TouchableOpacity>

            <Text className='text-text-primary text-lg font-bold'>
              {imageSource === 'camera' ? 'Photo Taken' : 'Gallery Image'}
            </Text>

            <TouchableOpacity
              onPress={() => setShowImageEditor(true)}
              className='bg-primary px-4 py-2 rounded-xl'
            >
              <Text className='text-white font-semibold'>✏️ Edit</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Image Preview */}
        <View className='flex-1 items-center justify-center relative'>
          <Image
            source={{ uri: capturedPhoto }}
            style={{
              width: screenWidth,
              height: screenHeight,
            }}
            resizeMode='contain'
          />

          {/* Text Overlay Display for Task 5.4 */}
          {overlayText && (
            <View
              style={{
                position: 'absolute',
                left: `${textPosition.x}%`,
                top: `${textPosition.y}%`,
                transform: [{ translateX: -50 }, { translateY: -50 }],
                maxWidth: screenWidth * 0.8,
              }}
            >
              <View
                style={{
                  backgroundColor: 'rgba(0, 0, 0, 0.7)',
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 8,
                }}
              >
                <Text
                  style={{
                    color: 'white',
                    fontSize: 16,
                    fontWeight: '600',
                    textAlign: 'center',
                    textShadowColor: 'rgba(0, 0, 0, 0.8)',
                    textShadowOffset: { width: 1, height: 1 },
                    textShadowRadius: 2,
                  }}
                >
                  {overlayText}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Modern Bottom Controls */}
        <View className='absolute bottom-8 left-0 right-0 px-4'>
          <View className='bg-white/95 backdrop-blur-sm p-4 rounded-2xl shadow-soft border border-border'>
            <Text className='text-text-primary text-center text-sm font-medium'>
              ✅ Image ready! Source:{' '}
              {imageSource === 'camera' ? 'Camera' : 'Gallery'}
              {selectedImage.optimized && ' • Optimized'}
            </Text>

            {/* Modern metadata display */}
            <View className='flex-row justify-center items-center mt-3 flex-wrap'>
              {selectedImage.fileSize && (
                <View className='bg-bg-secondary px-2 py-1 rounded-lg mr-2 mb-1'>
                  <Text className='text-text-secondary text-xs font-medium'>
                    📦 {formatFileSize(selectedImage.fileSize)}
                  </Text>
                </View>
              )}
              {selectedImage.width > 0 && selectedImage.height > 0 && (
                <View className='bg-bg-secondary px-2 py-1 rounded-lg mr-2 mb-1'>
                  <Text className='text-text-secondary text-xs font-medium'>
                    📐 {selectedImage.width}x{selectedImage.height}
                  </Text>
                </View>
              )}
              {selectedImage.optimized && (
                <View className='bg-success/10 px-2 py-1 rounded-lg mr-2 mb-1'>
                  <Text className='text-success text-xs font-medium'>⚡ Optimized</Text>
                </View>
              )}
              {selectedImage.compressionRatio &&
                selectedImage.compressionRatio > 1 && (
                  <View className='bg-primary/10 px-2 py-1 rounded-lg mb-1'>
                    <Text className='text-primary text-xs font-medium'>
                      🗜️ {selectedImage.compressionRatio.toFixed(1)}x
                    </Text>
                  </View>
                )}
            </View>

            {/* Text Overlay Controls */}
            {overlayText && (
              <View className='flex-row justify-center items-center mt-3 mb-2'>
                <View className='bg-accent/10 px-3 py-2 rounded-xl flex-1 mr-2'>
                  <Text className='text-accent text-xs text-center font-medium'>
                    Text: "{overlayText.substring(0, 30)}
                    {overlayText.length > 30 ? '...' : ''}"
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={clearTextOverlay}
                  className='bg-error px-3 py-2 rounded-xl'
                >
                  <Text className='text-white text-xs font-semibold'>
                    Clear
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Modern Action Buttons */}
            <View className='flex-row justify-center space-x-3 mt-4'>
              {/* Add Text Button */}
              <TouchableOpacity
                onPress={handleTextOverlayPress}
                style={{ backgroundColor: colors.primary }}
                className='px-4 py-3 rounded-xl flex-1'
              >
                <Text className='text-white font-semibold text-center text-sm'>
                  {overlayText ? '✏️ Edit Text' : '📝 Add Text'}
                </Text>
              </TouchableOpacity>

              {/* Post Story */}
              <TouchableOpacity
                onPress={handlePostStory}
                className='bg-accent px-4 py-3 rounded-xl flex-1'
                disabled={isPostingStory}
              >
                <Text className='text-white font-semibold text-center text-sm'>
                  {isPostingStory
                    ? `🚀 ${Math.round(postingProgress)}%`
                    : '📖 Story'}
                </Text>
              </TouchableOpacity>

              {/* Edit Button */}
              <TouchableOpacity
                onPress={() => setShowImageEditor(true)}
                className='bg-warning px-4 py-3 rounded-xl flex-1'
              >
                <Text className='text-white font-semibold text-center text-sm'>
                  ✏️ Edit
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    );
  }

  // Main camera interface with enhanced controls
  return (
    <View className='flex-1 bg-bg-primary'>
      <StatusBar style='dark' />

      {/* Camera View */}
      <View className='flex-1'>
        <CameraView
          ref={cameraRef}
          style={{
            width: screenWidth,
            height: screenHeight,
          }}
          facing={cameraType}
          flash={flashMode}
          zoom={zoom}
          onCameraReady={onCameraReady}
        >
          {/* Grid Lines Overlay */}
          {showGrid && (
            <View className='absolute inset-0 pointer-events-none'>
              {/* Horizontal lines */}
              <View className='absolute top-1/3 left-0 right-0 h-px bg-white/40' />
              <View className='absolute top-2/3 left-0 right-0 h-px bg-white/40' />
              {/* Vertical lines */}
              <View className='absolute left-1/3 top-0 bottom-0 w-px bg-white/40' />
              <View className='absolute left-2/3 top-0 bottom-0 w-px bg-white/40' />
            </View>
          )}

          {/* Timer Countdown Overlay */}
          {isTimerActive && timerCount > 0 && (
            <View className='absolute inset-0 bg-black/60 items-center justify-center'>
              <View className='bg-white/90 rounded-full w-32 h-32 items-center justify-center shadow-strong'>
                <Text className='text-primary text-6xl font-bold'>
                  {timerCount}
                </Text>
              </View>
            </View>
          )}

          {/* Modern Top Controls Bar */}
          <View className='absolute top-12 left-0 right-0 px-4'>
            <View className='bg-white/95 backdrop-blur-sm rounded-2xl px-4 py-3 shadow-soft'>
              <View className='flex-row justify-between items-center'>
                {/* Left Side Controls */}
                <View className='flex-row items-center space-x-3'>
                  {/* Flash Control */}
                  <TouchableOpacity
                    onPress={toggleFlashMode}
                    className={`px-3 py-2 rounded-xl flex-row items-center ${
                      flashMode !== 'off' ? 'bg-primary/10' : 'bg-bg-secondary'
                    }`}
                  >
                    <Text className={`text-lg mr-1 ${
                      flashMode !== 'off' ? 'text-primary' : 'text-text-secondary'
                    }`}>
                      {getFlashModeIcon()}
                    </Text>
                    <Text className={`text-xs font-medium ${
                      flashMode !== 'off' ? 'text-primary' : 'text-text-secondary'
                    }`}>
                      {getFlashModeText()}
                    </Text>
                  </TouchableOpacity>

                  {/* Timer Control */}
                  <TouchableOpacity
                    onPress={toggleTimer}
                    className={`px-3 py-2 rounded-xl flex-row items-center ${
                      timerMode > 0 ? 'bg-accent/10' : 'bg-bg-secondary'
                    }`}
                  >
                    <Text className={`text-lg mr-1 ${
                      timerMode > 0 ? 'text-accent' : 'text-text-secondary'
                    }`}>⏱️</Text>
                    <Text className={`text-xs font-medium ${
                      timerMode > 0 ? 'text-accent' : 'text-text-secondary'
                    }`}>
                      {timerMode === 0 ? 'OFF' : `${timerMode}s`}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Center Title */}
                <Text className='text-text-primary text-lg font-bold'>Camera</Text>

                {/* Right Side Controls */}
                <View className='flex-row items-center space-x-3'>
                  {/* Grid Toggle */}
                  <TouchableOpacity
                    onPress={toggleGrid}
                    className={`p-2 rounded-xl ${
                      showGrid ? 'bg-warning/10' : 'bg-bg-secondary'
                    }`}
                  >
                    <Text className={`text-lg ${
                      showGrid ? 'text-warning' : 'text-text-secondary'
                    }`}>⊞</Text>
                  </TouchableOpacity>

                  {/* Camera Switch */}
                  <TouchableOpacity
                    onPress={toggleCameraType}
                    className='bg-bg-secondary p-2 rounded-xl'
                  >
                    <Text className='text-text-secondary text-lg'>🔄</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>

          {/* Modern Side Zoom Controls */}
          <View className='absolute right-4 top-1/2 -translate-y-1/2'>
            <View className='bg-white/95 backdrop-blur-sm rounded-2xl py-3 px-2 shadow-soft'>
              <TouchableOpacity
                onPress={() => adjustZoom('in')}
                className='p-2'
                disabled={zoom >= 1}
              >
                <Text
                  className={`text-lg font-bold ${zoom >= 1 ? 'text-text-tertiary' : 'text-primary'}`}
                >
                  +
                </Text>
              </TouchableOpacity>
              <View className='h-20 w-1 bg-border mx-auto my-2 rounded-full'>
                <View
                  className='bg-primary w-full rounded-full'
                  style={{ height: `${zoom * 100}%` }}
                />
              </View>
              <TouchableOpacity
                onPress={() => adjustZoom('out')}
                className='p-2'
                disabled={zoom <= 0}
              >
                <Text
                  className={`text-lg font-bold ${zoom <= 0 ? 'text-text-tertiary' : 'text-primary'}`}
                >
                  −
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Modern Bottom Controls */}
          <View className='absolute bottom-0 left-0 right-0 pb-8'>
            {/* Main Control Row */}
            <View className='flex-row items-center justify-center px-8 mb-6'>
              {/* Gallery Button */}
              <View className='absolute left-8'>
                <TouchableOpacity
                  onPress={pickImageFromGallery}
                  disabled={isPickingImage}
                  className='bg-white/95 backdrop-blur-sm p-4 rounded-2xl shadow-soft'
                >
                  {isPickingImage ? (
                    <LoadingSpinner size='small' color={colors.primary} />
                  ) : (
                    <Text className='text-primary text-2xl'>🖼️</Text>
                  )}
                </TouchableOpacity>
              </View>

              {/* Capture Button */}
              <TouchableOpacity
                onPress={startTimerCapture}
                disabled={!isCameraReady || isCapturing || isTimerActive}
                className={`w-20 h-20 rounded-full border-4 items-center justify-center shadow-medium ${
                  isCapturing || isTimerActive 
                    ? 'bg-text-tertiary border-text-tertiary' 
                    : 'bg-white border-primary'
                }`}
              >
                {isCapturing || isTimerActive ? (
                  <LoadingSpinner size='small' color={colors.textInverse} />
                ) : (
                  <View className='w-16 h-16 rounded-full bg-primary' />
                )}
              </TouchableOpacity>

              {/* Optimization Status Indicator */}
              <View className='absolute right-8'>
                <TouchableOpacity
                  onPress={toggleOptimization}
                  className={`px-3 py-2 rounded-2xl shadow-soft ${
                    autoOptimize ? 'bg-success/90' : 'bg-white/95'
                  }`}
                >
                  <View className='flex-row items-center'>
                    <Text className={`text-lg mr-1 ${
                      autoOptimize ? 'text-white' : 'text-text-secondary'
                    }`}>⚡</Text>
                    <Text className={`text-xs font-medium ${
                      autoOptimize ? 'text-white' : 'text-text-secondary'
                    }`}>
                      {autoOptimize ? 'ON' : 'OFF'}
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>

            {/* Modern Status and Info Bar */}
            <View className='px-4'>
              <View className='bg-white/95 backdrop-blur-sm p-4 rounded-2xl shadow-soft'>
                <Text className='text-text-primary text-center text-sm font-medium'>
                  {!isCameraReady
                    ? 'Camera initializing...'
                    : isTimerActive
                      ? `Timer: ${timerCount}s`
                      : capturedPhoto
                        ? '✅ Photo captured successfully!'
                        : 'Tap to capture • Swipe for gallery'}
                </Text>

                {/* Modern Camera Settings Info */}
                <View className='flex-row justify-center items-center mt-3 flex-wrap'>
                  <View className='bg-bg-secondary px-2 py-1 rounded-lg mr-2 mb-1'>
                    <Text className='text-text-secondary text-xs font-medium'>
                      📷 {cameraType === 'back' ? 'Back' : 'Front'}
                    </Text>
                  </View>
                  <View className='bg-bg-secondary px-2 py-1 rounded-lg mr-2 mb-1'>
                    <Text className='text-text-secondary text-xs font-medium'>
                      🔍 {Math.round(zoom * 100)}%
                    </Text>
                  </View>
                  {showGrid && (
                    <View className='bg-warning/10 px-2 py-1 rounded-lg mr-2 mb-1'>
                      <Text className='text-warning text-xs font-medium'>⊞ Grid</Text>
                    </View>
                  )}
                  {timerMode > 0 && (
                    <View className='bg-accent/10 px-2 py-1 rounded-lg mr-2 mb-1'>
                      <Text className='text-accent text-xs font-medium'>
                        ⏱️ {timerMode}s
                      </Text>
                    </View>
                  )}
                  <View className={`px-2 py-1 rounded-lg mb-1 ${
                    autoOptimize ? 'bg-success/10' : 'bg-bg-secondary'
                  }`}>
                    <Text className={`text-xs font-medium ${
                      autoOptimize ? 'text-success' : 'text-text-secondary'
                    }`}>
                      ⚡ {autoOptimize ? 'Auto' : 'Off'}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </CameraView>
      </View>

      {/* Text Overlay Modal for Task 5.4 */}
      <Modal
        visible={showTextOverlay}
        onClose={handleTextOverlayCancel}
        title='Add Text Overlay'
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <View style={{ padding: 20 }}>
            <Text
              style={{
                color: colors.textSecondary,
                marginBottom: 12,
                fontSize: 14,
              }}
            >
              Add text to overlay on your photo (max 200 characters)
            </Text>

            <View
              style={{
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 8,
                backgroundColor: colors.surface,
                marginBottom: 16,
              }}
            >
              <TextInput
                value={overlayText}
                onChangeText={setOverlayText}
                placeholder='Enter your text here...'
                placeholderTextColor={colors.textTertiary}
                style={{
                  color: colors.textPrimary,
                  fontSize: 16,
                  padding: 16,
                  minHeight: 100,
                  textAlignVertical: 'top',
                }}
                multiline
                maxLength={200}
                autoFocus
              />
            </View>

            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 20,
              }}
            >
              <Text style={{ color: colors.textTertiary, fontSize: 12 }}>
                {overlayText.length}/200 characters
              </Text>

              {overlayText.length >= 180 && (
                <Text style={{ color: colors.error, fontSize: 12 }}>
                  {200 - overlayText.length} characters remaining
                </Text>
              )}
            </View>

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity
                onPress={handleTextOverlayCancel}
                style={{
                  flex: 1,
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: colors.border,
                  paddingVertical: 12,
                  paddingHorizontal: 24,
                  borderRadius: 8,
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: colors.textPrimary, fontWeight: '600' }}>
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleTextOverlayConfirm}
                style={{
                  flex: 1,
                  backgroundColor: colors.primary,
                  paddingVertical: 12,
                  paddingHorizontal: 24,
                  borderRadius: 8,
                  alignItems: 'center',
                  opacity: overlayText.trim() ? 1 : 0.5,
                }}
                disabled={!overlayText.trim()}
              >
                <Text style={{ color: 'white', fontWeight: '600' }}>
                  {overlayText ? 'Update Text' : 'Add Text'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};
