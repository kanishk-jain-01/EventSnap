import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Alert,
  TouchableOpacity,
  Dimensions,
  Image,
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
import { formatFileSize } from '../../utils/imageUtils';
import { ImageEditor } from '../../components/media/ImageEditor';
import { MainStackParamList } from '../../navigation/types';
import { useStoryStore } from '../../store/storyStore';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

type CameraScreenNavigationProp = NativeStackNavigationProp<
  MainStackParamList,
  'MainTabs'
>;

export const CameraScreen: React.FC = () => {
  const navigation = useNavigation<CameraScreenNavigationProp>();
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
  const [imageContext, setImageContext] = useState<
    'snap' | 'story' | 'avatar' | 'thumbnail'
  >('snap');

  // Image editing states for Task 4.6
  const [showImageEditor, setShowImageEditor] = useState(false);

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

  const showImageSourceDialog = () => {
    CameraService.showImageSourceDialog(
      () => {
        // Camera option - stay in current camera view
        // No action needed as user can use the camera directly
      },
      () => {
        // Gallery option
        pickImageFromGallery();
      },
    );
  };

  const toggleOptimization = () => {
    setAutoOptimize(!autoOptimize);
  };

  const cycleImageContext = () => {
    const contexts: ('snap' | 'story' | 'avatar' | 'thumbnail')[] = [
      'snap',
      'story',
      'avatar',
      'thumbnail',
    ];
    const currentIndex = contexts.indexOf(imageContext);
    const nextIndex = (currentIndex + 1) % contexts.length;
    setImageContext(contexts[nextIndex]);
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

  // Story posting
  const handlePostStory = async () => {
    if (!capturedPhoto) return;

    const success = await postStory(capturedPhoto);
    if (success) {
      Alert.alert('Story Posted!', 'Your story has been posted successfully.');
      // Navigate back to Home tab to view your story
      navigation.navigate('MainTabs', { screen: 'Home' });
      // Reset image so user can take another
      setCapturedPhoto(null);
      setSelectedImage(null);
      setImageSource(null);
    } else {
      Alert.alert('Error', 'Failed to post story.');
    }
  };

  // Loading screen
  if (isLoading) {
    return (
      <View className='flex-1 bg-snap-dark items-center justify-center'>
        <StatusBar style='light' />
        <LoadingSpinner size='large' text='Checking camera...' />
      </View>
    );
  }

  // Permission request screen
  if (!permissions?.camera || !cameraAvailable) {
    return (
      <View className='flex-1 bg-snap-dark'>
        <StatusBar style='light' />

        {/* Header */}
        <View className='pt-12 pb-6 px-6'>
          <Text className='text-snap-yellow text-2xl font-bold text-center'>
            Camera Setup
          </Text>
          <Text className='text-white text-base text-center mt-2'>
            Phase 4.5: Camera + Gallery + Optimization
          </Text>
        </View>

        <View className='flex-1 px-6'>
          {/* Camera Availability Status */}
          <View className='bg-snap-gray p-4 rounded-lg mb-6'>
            <Text className='text-white text-lg font-semibold mb-2'>
              Camera Availability
            </Text>
            <View className='flex-row items-center'>
              <View
                className={`w-3 h-3 rounded-full mr-3 ${
                  cameraAvailable === true
                    ? 'bg-green-500'
                    : cameraAvailable === false
                      ? 'bg-red-500'
                      : 'bg-gray-500'
                }`}
              />
              <Text className='text-white'>
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
            <View className='bg-snap-gray p-4 rounded-lg mb-6'>
              <Text className='text-white text-lg font-semibold mb-3'>
                Permissions Status
              </Text>

              <View className='flex-row items-center mb-2'>
                <View
                  className={`w-3 h-3 rounded-full mr-3 ${
                    permissions.camera ? 'bg-green-500' : 'bg-red-500'
                  }`}
                />
                <Text className='text-white'>
                  Camera: {permissions.camera ? 'Granted' : 'Denied'}
                </Text>
              </View>

              <View className='flex-row items-center'>
                <View
                  className={`w-3 h-3 rounded-full mr-3 ${
                    permissions.mediaLibrary ? 'bg-green-500' : 'bg-red-500'
                  }`}
                />
                <Text className='text-white'>
                  Photo Library:{' '}
                  {permissions.mediaLibrary ? 'Granted' : 'Denied'}
                </Text>
              </View>
            </View>
          )}

          {/* Error Display */}
          {error && (
            <View className='bg-snap-red/20 border border-snap-red rounded-lg p-4 mb-6'>
              <Text className='text-snap-red text-sm text-center'>{error}</Text>
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
          <View className='mt-8 p-4 bg-snap-light-gray/20 rounded-lg'>
            <Text className='text-gray-300 text-sm text-center'>
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
      <View className='flex-1 bg-snap-dark'>
        <StatusBar style='light' />

        {/* Header */}
        <View className='absolute top-12 left-0 right-0 z-10 px-4'>
          <View className='flex-row justify-between items-center'>
            <TouchableOpacity
              onPress={() => {
                setSelectedImage(null);
                setCapturedPhoto(null);
                setImageSource(null);
              }}
              className='bg-black/60 px-4 py-2 rounded-full'
            >
              <Text className='text-white font-semibold'>← Back</Text>
            </TouchableOpacity>

            <Text className='text-white text-lg font-bold'>
              {imageSource === 'camera' ? 'Photo Taken' : 'Gallery Image'}
            </Text>

            <TouchableOpacity
              onPress={() => setShowImageEditor(true)}
              className='bg-snap-yellow/80 px-4 py-2 rounded-full'
            >
              <Text className='text-black font-semibold'>✏️ Edit</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Image Preview */}
        <View className='flex-1 items-center justify-center'>
          <Image
            source={{ uri: capturedPhoto }}
            style={{
              width: screenWidth,
              height: screenHeight,
            }}
            resizeMode='contain'
          />
        </View>

        {/* Enhanced Bottom Controls for Task 4.6 */}
        <View className='absolute bottom-8 left-0 right-0 px-4'>
          <View className='bg-black/60 p-4 rounded-xl'>
            <Text className='text-white text-center text-sm'>
              ✅ Image ready! Source:{' '}
              {imageSource === 'camera' ? 'Camera' : 'Gallery'}
              {selectedImage.optimized && ' • Optimized'}
            </Text>

            {/* Enhanced metadata display */}
            <View className='flex-row justify-center items-center mt-2 space-x-4'>
              {selectedImage.fileSize && (
                <Text className='text-gray-300 text-xs'>
                  📦 {formatFileSize(selectedImage.fileSize)}
                </Text>
              )}
              {selectedImage.width > 0 && selectedImage.height > 0 && (
                <Text className='text-gray-300 text-xs'>
                  📐 {selectedImage.width}x{selectedImage.height}
                </Text>
              )}
              {selectedImage.optimized && (
                <Text className='text-green-400 text-xs'>⚡ Optimized</Text>
              )}
              {selectedImage.compressionRatio &&
                selectedImage.compressionRatio > 1 && (
                  <Text className='text-blue-400 text-xs'>
                    🗜️ {selectedImage.compressionRatio.toFixed(1)}x
                  </Text>
                )}
            </View>

            {/* Action Buttons */}
            <View className='flex-row justify-center space-x-3 mt-4'>
              {/* Post Story */}
              <TouchableOpacity
                onPress={handlePostStory}
                className='bg-blue-500 px-4 py-3 rounded-full flex-1'
                disabled={isPostingStory}
              >
                <Text className='text-white font-semibold text-center'>
                  {isPostingStory
                    ? `🚀 Posting ${Math.round(postingProgress)}%`
                    : '📖 Post Story'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setShowImageEditor(true)}
                className='bg-snap-yellow px-4 py-3 rounded-full flex-1'
              >
                <Text className='text-black font-semibold text-center'>
                  ✏️ Edit
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  if (capturedPhoto) {
                    navigation.navigate('RecipientSelection', {
                      imageUri: capturedPhoto,
                    });
                  }
                }}
                className='bg-green-500 px-4 py-3 rounded-full flex-1'
              >
                <Text className='text-white font-semibold text-center'>
                  📤 Send Snap
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={showImageSourceDialog}
                className='bg-gray-600 px-4 py-3 rounded-full flex-1'
              >
                <Text className='text-white font-semibold text-center'>
                  🔄 Change
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
    <View className='flex-1 bg-snap-dark'>
      <StatusBar style='light' />

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
              <View className='absolute top-1/3 left-0 right-0 h-px bg-white/30' />
              <View className='absolute top-2/3 left-0 right-0 h-px bg-white/30' />
              {/* Vertical lines */}
              <View className='absolute left-1/3 top-0 bottom-0 w-px bg-white/30' />
              <View className='absolute left-2/3 top-0 bottom-0 w-px bg-white/30' />
            </View>
          )}

          {/* Timer Countdown Overlay */}
          {isTimerActive && timerCount > 0 && (
            <View className='absolute inset-0 bg-black/50 items-center justify-center'>
              <View className='bg-white/20 rounded-full w-32 h-32 items-center justify-center'>
                <Text className='text-white text-6xl font-bold'>
                  {timerCount}
                </Text>
              </View>
            </View>
          )}

          {/* Enhanced Top Controls Bar for Task 4.5 */}
          <View className='absolute top-12 left-0 right-0 flex-row justify-between items-center px-4'>
            {/* Left Side Controls */}
            <View className='flex-row items-center space-x-2'>
              {/* Flash Control */}
              <TouchableOpacity
                onPress={toggleFlashMode}
                className='bg-black/60 px-3 py-2 rounded-full flex-row items-center'
              >
                <Text className='text-white text-lg mr-1'>
                  {getFlashModeIcon()}
                </Text>
                <Text className='text-white text-xs font-semibold'>
                  {getFlashModeText()}
                </Text>
              </TouchableOpacity>

              {/* Timer Control */}
              <TouchableOpacity
                onPress={toggleTimer}
                className={`px-3 py-2 rounded-full flex-row items-center ${
                  timerMode > 0 ? 'bg-snap-yellow/80' : 'bg-black/60'
                }`}
              >
                <Text className='text-white text-lg mr-1'>⏱️</Text>
                <Text className='text-white text-xs font-semibold'>
                  {timerMode === 0 ? 'OFF' : `${timerMode}s`}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Center Title */}
            <Text className='text-white text-lg font-bold'>Camera</Text>

            {/* Right Side Controls */}
            <View className='flex-row items-center space-x-2'>
              {/* Optimization Toggle */}
              <TouchableOpacity
                onPress={toggleOptimization}
                className={`p-2 rounded-full ${
                  autoOptimize ? 'bg-green-500/80' : 'bg-black/60'
                }`}
              >
                <Text className='text-white text-lg'>⚡</Text>
              </TouchableOpacity>

              {/* Grid Toggle */}
              <TouchableOpacity
                onPress={toggleGrid}
                className={`p-2 rounded-full ${
                  showGrid ? 'bg-snap-yellow/80' : 'bg-black/60'
                }`}
              >
                <Text className='text-white text-lg'>⊞</Text>
              </TouchableOpacity>

              {/* Camera Switch */}
              <TouchableOpacity
                onPress={toggleCameraType}
                className='bg-black/60 p-2 rounded-full'
              >
                <Text className='text-white text-lg'>🔄</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Side Zoom Controls */}
          <View className='absolute right-4 top-1/2 -translate-y-1/2'>
            <View className='bg-black/60 rounded-full py-2 px-1'>
              <TouchableOpacity
                onPress={() => adjustZoom('in')}
                className='p-2'
                disabled={zoom >= 1}
              >
                <Text
                  className={`text-lg ${zoom >= 1 ? 'text-gray-500' : 'text-white'}`}
                >
                  +
                </Text>
              </TouchableOpacity>
              <View className='h-20 w-1 bg-white/30 mx-auto my-2'>
                <View
                  className='bg-white w-full rounded-full'
                  style={{ height: `${zoom * 100}%` }}
                />
              </View>
              <TouchableOpacity
                onPress={() => adjustZoom('out')}
                className='p-2'
                disabled={zoom <= 0}
              >
                <Text
                  className={`text-lg ${zoom <= 0 ? 'text-gray-500' : 'text-white'}`}
                >
                  −
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Left Side Context Controls for Task 4.5 */}
          <View className='absolute left-4 top-1/2 -translate-y-1/2'>
            <View className='bg-black/60 rounded-full py-2 px-1'>
              <TouchableOpacity onPress={cycleImageContext} className='p-2'>
                <Text className='text-white text-xs font-bold transform -rotate-90'>
                  {imageContext.toUpperCase()}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Bottom Controls */}
          <View className='absolute bottom-0 left-0 right-0 pb-8'>
            {/* Main Control Row */}
            <View className='flex-row items-center justify-between px-8 mb-6'>
              {/* Gallery Button */}
              <TouchableOpacity
                onPress={pickImageFromGallery}
                disabled={isPickingImage}
                className='bg-black/60 p-4 rounded-full'
              >
                {isPickingImage ? (
                  <LoadingSpinner size='small' />
                ) : (
                  <Text className='text-white text-2xl'>🖼️</Text>
                )}
              </TouchableOpacity>

              {/* Capture Button */}
              <TouchableOpacity
                onPress={startTimerCapture}
                disabled={!isCameraReady || isCapturing || isTimerActive}
                className={`w-20 h-20 rounded-full border-4 border-white items-center justify-center ${
                  isCapturing || isTimerActive ? 'bg-gray-500' : 'bg-white/20'
                }`}
              >
                {isCapturing || isTimerActive ? (
                  <LoadingSpinner size='small' />
                ) : (
                  <View className='w-16 h-16 rounded-full bg-white' />
                )}
              </TouchableOpacity>

              {/* Image Source Dialog Button */}
              <TouchableOpacity
                onPress={showImageSourceDialog}
                className='bg-black/60 p-4 rounded-full'
              >
                <Text className='text-white text-2xl'>📋</Text>
              </TouchableOpacity>
            </View>

            {/* Enhanced Status and Info Bar for Task 4.5 */}
            <View className='px-4'>
              <View className='bg-black/60 p-3 rounded-xl'>
                <Text className='text-white text-center text-sm'>
                  {!isCameraReady
                    ? 'Camera initializing...'
                    : isTimerActive
                      ? `Timer: ${timerCount}s`
                      : capturedPhoto
                        ? '✅ Photo captured! Enhanced controls + Gallery + Optimization active'
                        : 'Tap to capture • Gallery: select photos • Optimization: auto-compress'}
                </Text>

                {/* Enhanced Camera Settings Info */}
                <View className='flex-row justify-center items-center mt-2 space-x-3'>
                  <Text className='text-gray-300 text-xs'>
                    📷 {cameraType === 'back' ? 'Back' : 'Front'}
                  </Text>
                  <Text className='text-gray-300 text-xs'>
                    🔍 {Math.round(zoom * 100)}%
                  </Text>
                  {showGrid && (
                    <Text className='text-gray-300 text-xs'>⊞ Grid</Text>
                  )}
                  {timerMode > 0 && (
                    <Text className='text-gray-300 text-xs'>
                      ⏱️ {timerMode}s
                    </Text>
                  )}
                  <Text className='text-gray-300 text-xs'>🖼️ Gallery</Text>
                  <Text
                    className={`text-xs ${autoOptimize ? 'text-green-400' : 'text-gray-500'}`}
                  >
                    ⚡ {autoOptimize ? 'Auto' : 'Off'}
                  </Text>
                  <Text className='text-blue-400 text-xs'>
                    📦 {imageContext}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </CameraView>
      </View>
    </View>
  );
};
