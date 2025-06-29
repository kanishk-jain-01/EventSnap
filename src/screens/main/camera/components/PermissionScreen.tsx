import React from 'react';
import { View, Text } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Button } from '../../../../components/ui/Button';
import { useThemeColors } from '../../../../components/ui/ThemeProvider';
import { CameraPermissions } from '../../../../services/camera.service';
import { PermissionScreenProps } from '../types';

interface Props extends PermissionScreenProps {
  permissions: CameraPermissions | null;
}

export const PermissionScreen: React.FC<Props> = ({
  cameraAvailable,
  isRequesting,
  isPickingImage,
  isLoading,
  error,
  permissions,
  onRequestPermissions,
  onPickFromGallery,
  onRefreshStatus,
}) => {
  const _colors = useThemeColors();

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
              onPress={onRequestPermissions}
              loading={isRequesting}
              disabled={cameraAvailable === false}
              size='large'
            />
          )}

          {/* Gallery Access Button */}
          <Button
            title='Select from Gallery'
            onPress={onPickFromGallery}
            loading={isPickingImage}
            variant='secondary'
            size='large'
          />

          <Button
            title='Refresh Status'
            onPress={onRefreshStatus}
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
}; 