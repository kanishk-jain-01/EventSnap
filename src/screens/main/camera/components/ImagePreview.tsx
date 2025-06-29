import React from 'react';
import { View, Text, TouchableOpacity, Image, Dimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { formatFileSize } from '../../../../utils/imageUtils';
import { ImagePreviewProps } from '../types';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const ImagePreview: React.FC<ImagePreviewProps> = ({
  imageUri,
  selectedImage,
  imageSource,
  overlayText,
  textPosition,
  isPostingStory,
  postingProgress,
  onBack,
  onEdit,
  onAddText,
  onClearText,
  onPostStory,
}) => {
  return (
    <View className='flex-1 bg-bg-primary'>
      <StatusBar style='dark' />

      {/* Header */}
      <View className='absolute top-12 left-0 right-0 z-10 px-4'>
        <View className='bg-white/95 backdrop-blur-sm rounded-2xl p-3 shadow-soft flex-row justify-between items-center'>
          <TouchableOpacity
            onPress={onBack}
            className='bg-bg-secondary px-4 py-2 rounded-xl'
          >
            <Text className='text-text-primary font-semibold'>← Back</Text>
          </TouchableOpacity>

          <Text className='text-text-primary text-lg font-bold'>
            {imageSource === 'camera' ? 'Photo Taken' : 'Gallery Image'}
          </Text>

          <TouchableOpacity
            onPress={onEdit}
            className='bg-primary px-4 py-2 rounded-xl'
          >
            <Text className='text-white font-semibold'>✏️ Edit</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Image Preview */}
      <View className='flex-1 items-center justify-center relative'>
        <Image
          source={{ uri: imageUri }}
          style={{
            width: screenWidth,
            height: screenHeight,
          }}
          resizeMode='contain'
        />

        {/* Text Overlay Display */}
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

      {/* Bottom Controls */}
      <View className='absolute bottom-8 left-0 right-0 px-4'>
        <View className='bg-white/95 backdrop-blur-sm p-4 rounded-2xl shadow-soft border border-border'>
          <Text className='text-text-primary text-center text-sm font-medium'>
            ✅ Image ready! Source:{' '}
            {imageSource === 'camera' ? 'Camera' : 'Gallery'}
            {selectedImage.optimized && ' • Optimized'}
          </Text>

          {/* Metadata display */}
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
                onPress={onClearText}
                className='bg-error px-3 py-2 rounded-xl'
              >
                <Text className='text-white text-xs font-semibold'>
                  Clear
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Action Buttons */}
          <View className='flex-row justify-center space-x-3 mt-4'>
            {/* Add Text Button */}
            <TouchableOpacity
              onPress={onAddText}
              className='bg-primary px-4 py-3 rounded-xl flex-1'
            >
              <Text className='text-white font-semibold text-center text-sm'>
                {overlayText ? '✏️ Edit Text' : '📝 Add Text'}
              </Text>
            </TouchableOpacity>

            {/* Post Story */}
            <TouchableOpacity
              onPress={onPostStory}
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
              onPress={onEdit}
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
}; 