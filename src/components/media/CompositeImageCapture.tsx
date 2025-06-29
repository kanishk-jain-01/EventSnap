import React from 'react';
import { View, Text, Image, Dimensions } from 'react-native';
import { calculateTextPosition } from '../../utils/imageComposite';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export interface CompositeImageCaptureProps {
  imageUri: string;
  imageWidth: number;
  imageHeight: number;
  textOverlay?: {
    text: string;
    position: { x: number; y: number };
  };
  captureWidth?: number;
  captureHeight?: number;
}

export const CompositeImageCapture = React.forwardRef<
  View,
  CompositeImageCaptureProps
>(({ 
  imageUri, 
  imageWidth, 
  imageHeight, 
  textOverlay, 
  captureWidth = screenWidth,
  captureHeight = screenHeight, 
}, ref) => {
  // Calculate aspect ratio and final dimensions
  const aspectRatio = imageWidth / imageHeight;
  let finalWidth = captureWidth;
  let finalHeight = captureHeight;

  // Maintain aspect ratio while fitting within capture dimensions
  if (aspectRatio > captureWidth / captureHeight) {
    // Image is wider than container
    finalHeight = captureWidth / aspectRatio;
  } else {
    // Image is taller than container
    finalWidth = captureHeight * aspectRatio;
  }

  // Calculate text position
  const textPosition = textOverlay ? 
    calculateTextPosition(finalWidth, finalHeight, textOverlay.position) : 
    { left: 0, top: 0 };

  return (
    <View
      ref={ref}
      style={{
        width: finalWidth,
        height: finalHeight,
        backgroundColor: '#000', // Black background for letterboxing
        position: 'relative',
      }}
    >
      {/* Image */}
      <Image
        source={{ uri: imageUri }}
        style={{
          width: finalWidth,
          height: finalHeight,
        }}
        resizeMode="contain"
      />

      {/* Text Overlay */}
      {textOverlay && (
        <View
          style={{
            position: 'absolute',
            left: textPosition.left,
            top: textPosition.top,
            transform: [
              { translateX: -50 }, // Center horizontally
              { translateY: -50 }, // Center vertically
            ],
            maxWidth: finalWidth * 0.8, // Limit text width
            zIndex: 1,
          }}
        >
          <View
            style={{
              backgroundColor: 'rgba(0, 0, 0, 0.75)',
              paddingHorizontal: 16,
              paddingVertical: 12,
              borderRadius: 12,
              borderWidth: 2,
              borderColor: 'rgba(255, 255, 255, 0.3)',
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
              {textOverlay.text}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
});

CompositeImageCapture.displayName = 'CompositeImageCapture'; 