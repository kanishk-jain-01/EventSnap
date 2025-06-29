import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, Dimensions } from 'react-native';
import { PanGestureHandler } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { formatFileSize } from '../../../../utils/imageUtils';
import { ImagePreviewProps } from '../types';
import Animated, {
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';

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
  onAddText,
  onClearText,
  onPostStory,
  onUpdateTextPosition,
}) => {
  const [controlsVisible, setControlsVisible] = useState(true);
  const [isDragging, setIsDragging] = useState(false);

  // Animated values for text position
  const textX = useSharedValue(textPosition.x);
  const textY = useSharedValue(textPosition.y);

  // Animated values for controls
  const controlsTranslateY = useSharedValue(0);

  // Update text position when props change
  React.useEffect(() => {
    textX.value = textPosition.x;
    textY.value = textPosition.y;
  }, [textPosition]);

  // Pan gesture handler for dragging text
  const panGestureHandler = useAnimatedGestureHandler({
    onStart: () => {
      runOnJS(setIsDragging)(true);
    },
    onActive: (event) => {
      // Convert absolute coordinates to percentages
      const newX = Math.max(10, Math.min(90, (event.absoluteX / screenWidth) * 100));
      const newY = Math.max(15, Math.min(85, (event.absoluteY / screenHeight) * 100));
      
      textX.value = newX;
      textY.value = newY;
    },
    onEnd: () => {
      runOnJS(setIsDragging)(false);
      // Update the parent component's state with the new position
      const finalX = textX.value;
      const finalY = textY.value;
      runOnJS(onUpdateTextPosition)({ x: finalX, y: finalY });
      
      // Animate to the final position
      textX.value = withSpring(finalX);
      textY.value = withSpring(finalY);
    },
  });

  // Animated style for text overlay
  const animatedTextStyle = useAnimatedStyle(() => {
    return {
      position: 'absolute' as const,
      left: `${textX.value}%`,
      top: `${textY.value}%`,
      transform: [
        { translateX: -50 },
        { translateY: -50 },
        { scale: isDragging ? 1.1 : 1 },
      ],
      maxWidth: screenWidth * 0.8,
      zIndex: isDragging ? 1000 : 1,
    };
  });

  // Animated style for controls
  const animatedControlsStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: controlsTranslateY.value }],
    };
  });

  // Toggle controls visibility
  const toggleControls = () => {
    const newVisible = !controlsVisible;
    setControlsVisible(newVisible);
    controlsTranslateY.value = withSpring(newVisible ? 0 : 200);
  };

  return (
    <View className='flex-1 bg-bg-primary'>
      <StatusBar style='dark' />

      {/* Header */}
      <View className='absolute top-12 left-0 right-0 z-10 px-4'>
        <View className='bg-white/95 backdrop-blur-sm rounded-2xl p-3 shadow-soft flex-row justify-between items-center border border-white/20'>
          <TouchableOpacity
            onPress={onBack}
            className='bg-bg-secondary px-4 py-2 rounded-xl'
          >
            <Text className='text-text-primary font-semibold'>← Back</Text>
          </TouchableOpacity>

          <Text className='text-text-primary text-lg font-bold'>
            {imageSource === 'camera' ? '📸 Photo Ready' : '🖼️ From Gallery'}
          </Text>

          <View className='w-16' />
        </View>
      </View>

      {/* Image Preview */}
      <TouchableOpacity 
        className='flex-1 items-center justify-center relative'
        onPress={toggleControls}
        activeOpacity={1}
      >
        <Image
          source={{ uri: imageUri }}
          style={{
            width: screenWidth,
            height: screenHeight,
          }}
          resizeMode='contain'
        />

        {/* Draggable Text Overlay */}
        {overlayText && (
          <PanGestureHandler onGestureEvent={panGestureHandler}>
            <Animated.View style={animatedTextStyle}>
              <TouchableOpacity
                onPress={onAddText}
                activeOpacity={0.8}
                disabled={isDragging}
              >
                <View
                  style={{
                    backgroundColor: isDragging ? 'rgba(0, 0, 0, 0.9)' : 'rgba(0, 0, 0, 0.75)',
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    borderRadius: 12,
                    borderWidth: 2,
                    borderColor: isDragging ? 'rgba(255, 255, 255, 0.6)' : 'rgba(255, 255, 255, 0.3)',
                  }}
                >
                  <Text
                    style={{
                      color: 'white',
                      fontSize: 18,
                      fontWeight: '600',
                      textAlign: 'center',
                      textShadowColor: 'rgba(0, 0, 0, 0.8)',
                      textShadowOffset: { width: 1, height: 1 },
                      textShadowRadius: 3,
                      lineHeight: 24,
                    }}
                  >
                    {overlayText}
                  </Text>
                </View>
              </TouchableOpacity>
            </Animated.View>
          </PanGestureHandler>
        )}

        {/* Tap hint when controls are hidden */}
        {!controlsVisible && (
          <View className='absolute bottom-20 left-0 right-0 items-center'>
            <View className='bg-black/60 px-4 py-2 rounded-full'>
              <Text className='text-white text-sm'>👆 Tap to show controls</Text>
            </View>
          </View>
        )}

        {/* Drag hint for text */}
        {overlayText && controlsVisible && (
          <View className='absolute top-20 left-0 right-0 items-center'>
            <View className='bg-primary/80 px-4 py-2 rounded-full'>
              <Text className='text-white text-sm'>✋ Drag text to move it around</Text>
            </View>
          </View>
        )}
      </TouchableOpacity>

      {/* Animated Bottom Controls */}
      <Animated.View 
        className='absolute bottom-8 left-0 right-0 px-4'
        style={animatedControlsStyle}
      >
        <View className='bg-white/95 backdrop-blur-sm p-4 rounded-2xl shadow-soft border border-white/20'>
          <Text className='text-text-primary text-center text-base font-medium mb-3'>
            ✅ Ready to share! 
            {selectedImage.optimized && ' • Optimized for best quality'}
          </Text>

          {/* Metadata display */}
          <View className='flex-row justify-center items-center mb-4 flex-wrap'>
            {selectedImage.fileSize && (
              <View className='bg-bg-secondary px-3 py-2 rounded-xl mr-2 mb-2'>
                <Text className='text-text-secondary text-xs font-medium'>
                  📦 {formatFileSize(selectedImage.fileSize)}
                </Text>
              </View>
            )}
            {selectedImage.width > 0 && selectedImage.height > 0 && (
              <View className='bg-bg-secondary px-3 py-2 rounded-xl mr-2 mb-2'>
                <Text className='text-text-secondary text-xs font-medium'>
                  📐 {selectedImage.width}x{selectedImage.height}
                </Text>
              </View>
            )}
            {selectedImage.optimized && (
              <View className='bg-success/10 px-3 py-2 rounded-xl mr-2 mb-2'>
                <Text className='text-success text-xs font-medium'>⚡ Optimized</Text>
              </View>
            )}
            {selectedImage.compressionRatio &&
              selectedImage.compressionRatio > 1 && (
                <View className='bg-primary/10 px-3 py-2 rounded-xl mb-2'>
                  <Text className='text-primary text-xs font-medium'>
                    🗜️ {selectedImage.compressionRatio.toFixed(1)}x smaller
                  </Text>
                </View>
              )}
          </View>

          {/* Text Overlay Status */}
          {overlayText && (
            <View className='bg-accent/10 p-3 rounded-xl mb-4 flex-row items-center justify-between'>
              <View className='flex-1 mr-3'>
                <Text className='text-accent text-sm font-medium mb-1'>
                  📝 Text Added
                </Text>
                <Text className='text-accent/80 text-xs'>
                  "{overlayText.substring(0, 40)}
                  {overlayText.length > 40 ? '...' : ''}"
                </Text>
              </View>
              <TouchableOpacity
                onPress={onClearText}
                className='bg-error/10 px-3 py-2 rounded-lg'
              >
                <Text className='text-error text-xs font-semibold'>
                  Remove
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Action Buttons */}
          <View className='flex-row justify-center space-x-3'>
            {/* Add/Edit Text Button */}
            <TouchableOpacity
              onPress={onAddText}
              className='bg-primary px-6 py-3 rounded-xl flex-1'
            >
              <Text className='text-white font-semibold text-center text-base'>
                {overlayText ? '✏️ Edit Text' : '📝 Add Text'}
              </Text>
            </TouchableOpacity>

            {/* Post Story */}
            <TouchableOpacity
              onPress={onPostStory}
              className='bg-accent px-6 py-3 rounded-xl flex-1'
              disabled={isPostingStory}
            >
              <Text className='text-white font-semibold text-center text-base'>
                {isPostingStory
                  ? `🚀 ${Math.round(postingProgress)}%`
                  : '📖 Share Story'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Hide Controls Hint */}
          <View className='mt-3 pt-3 border-t border-border'>
            <Text className='text-text-tertiary text-center text-xs'>
              💡 Tap anywhere on the photo to hide/show controls
            </Text>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}; 