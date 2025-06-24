import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Alert, TouchableOpacity, Dimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { CameraView, CameraType } from 'expo-camera';
import {
  CameraService,
  CameraPermissions,
} from '../../services/camera.service';
import { Button } from '../../components/ui/Button';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const CameraScreen: React.FC = () => {
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

  // Camera ref
  const cameraRef = useRef<CameraView>(null);

  // Check initial permissions and camera availability
  useEffect(() => {
    checkInitialState();
  }, []);

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

      setCapturedPhoto(photo.uri);

      // Show success feedback
      Alert.alert(
        'Photo Captured!',
        'Photo captured successfully. Ready for Phase 4.3: Camera Controls!',
        [
          {
            text: 'Take Another',
            onPress: () => setCapturedPhoto(null),
          },
          { text: 'OK' },
        ],
      );
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

  const toggleCameraType = () => {
    setCameraType(cameraType === 'back' ? 'front' : 'back');
  };

  const toggleFlashMode = () => {
    const modes: ('auto' | 'on' | 'off')[] = ['auto', 'on', 'off'];
    const currentIndex = modes.indexOf(flashMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    setFlashMode(modes[nextIndex]);
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

  const refreshPermissions = async () => {
    await checkInitialState();
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
            Phase 4.2: Camera Access Required
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
              Camera permission is required to capture photos.{'\n'}
              Please grant permission to continue.
            </Text>
          </View>
        </View>
      </View>
    );
  }

  // Main camera interface
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
          onCameraReady={onCameraReady}
        >
          {/* Top Controls */}
          <View className='absolute top-12 left-0 right-0 flex-row justify-between items-center px-6'>
            {/* Flash Control */}
            <TouchableOpacity
              onPress={toggleFlashMode}
              className='bg-black/50 px-3 py-2 rounded-full'
            >
              <Text className='text-white text-sm font-semibold'>
                ⚡ {getFlashModeText()}
              </Text>
            </TouchableOpacity>

            {/* Title */}
            <Text className='text-white text-lg font-bold'>Camera</Text>

            {/* Camera Switch */}
            <TouchableOpacity
              onPress={toggleCameraType}
              className='bg-black/50 p-3 rounded-full'
            >
              <Text className='text-white text-lg'>🔄</Text>
            </TouchableOpacity>
          </View>

          {/* Bottom Controls */}
          <View className='absolute bottom-0 left-0 right-0 pb-8'>
            {/* Capture Button */}
            <View className='items-center mb-6'>
              <TouchableOpacity
                onPress={takePicture}
                disabled={!isCameraReady || isCapturing}
                className={`w-20 h-20 rounded-full border-4 border-white items-center justify-center ${
                  isCapturing ? 'bg-gray-500' : 'bg-white/20'
                }`}
              >
                {isCapturing ? (
                  <LoadingSpinner size='small' />
                ) : (
                  <View className='w-16 h-16 rounded-full bg-white' />
                )}
              </TouchableOpacity>
            </View>

            {/* Status Indicators */}
            <View className='px-6'>
              <View className='bg-black/50 p-3 rounded-lg'>
                <Text className='text-white text-center text-sm'>
                  {!isCameraReady
                    ? 'Camera initializing...'
                    : capturedPhoto
                      ? '✅ Photo captured! Ready for Phase 4.3'
                      : 'Tap the button to capture a photo'}
                </Text>
              </View>
            </View>
          </View>
        </CameraView>
      </View>
    </View>
  );
};
