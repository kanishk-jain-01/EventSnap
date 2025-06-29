import { captureRef } from 'react-native-view-shot';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

// Type for react-native-view-shot format
type ViewShotFormat = 'jpg' | 'png' | 'webm' | 'raw';

export interface TextOverlayOptions {
  text: string;
  position: { x: number; y: number };
  fontSize?: number;
  fontWeight?: 'normal' | 'bold' | '600';
  color?: string;
  backgroundColor?: string;
  padding?: number;
  borderRadius?: number;
  maxWidth?: number;
}

export interface CompositeImageOptions {
  imageUri: string;
  textOverlay: TextOverlayOptions;
  outputFormat?: SaveFormat;
  quality?: number;
}

/**
 * Creates a composite image with text overlay
 * This function uses react-native-view-shot to capture a view that contains
 * both the image and the text overlay positioned correctly
 */
export const createCompositeImage = async (
  viewRef: React.RefObject<any>,
  options: {
    format?: ViewShotFormat;
    quality?: number;
    result?: 'tmpfile' | 'base64' | 'zip-base64';
  } = {},
): Promise<string> => {
  try {
    const uri = await captureRef(viewRef, {
      format: options.format || 'jpg',
      quality: options.quality || 0.9,
      result: options.result || 'tmpfile',
    });
    
    return uri;
  } catch (error) {
    console.error('Error creating composite image:', error);
    throw new Error('Failed to create composite image');
  }
};

/**
 * Optimizes an image using expo-image-manipulator
 */
export const optimizeCompositeImage = async (
  imageUri: string,
  options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: SaveFormat;
  } = {},
): Promise<string> => {
  try {
    const actions = [];
    
    // Resize if dimensions are provided
    if (options.width || options.height) {
      actions.push({
        resize: {
          width: options.width,
          height: options.height,
        },
      });
    }
    
    const result = await manipulateAsync(
      imageUri,
      actions,
      {
        compress: options.quality || 0.9,
        format: options.format || SaveFormat.JPEG,
      },
    );
    
    return result.uri;
  } catch (error) {
    console.error('Error optimizing composite image:', error);
    throw new Error('Failed to optimize composite image');
  }
};

/**
 * Calculates the actual text position based on percentage coordinates
 */
export const calculateTextPosition = (
  containerWidth: number,
  containerHeight: number,
  textPosition: { x: number; y: number },
): { left: number; top: number } => {
  return {
    left: (textPosition.x / 100) * containerWidth,
    top: (textPosition.y / 100) * containerHeight,
  };
};

/**
 * Validates text overlay options
 */
export const validateTextOverlayOptions = (options: TextOverlayOptions): boolean => {
  if (!options.text || options.text.trim().length === 0) {
    return false;
  }
  
  if (!options.position || 
      typeof options.position.x !== 'number' || 
      typeof options.position.y !== 'number') {
    return false;
  }
  
  if (options.position.x < 0 || options.position.x > 100 ||
      options.position.y < 0 || options.position.y > 100) {
    return false;
  }
  
  return true;
}; 