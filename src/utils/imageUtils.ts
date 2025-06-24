import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { IMAGE_CONFIG } from './constants';

/**
 * Compress and resize an image
 */
export const compressImage = async (
  uri: string,
  options: {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
  } = {},
): Promise<string> => {
  try {
    const {
      maxWidth = IMAGE_CONFIG.MAX_WIDTH,
      maxHeight = IMAGE_CONFIG.MAX_HEIGHT,
      quality = IMAGE_CONFIG.QUALITY,
    } = options;

    const result = await manipulateAsync(
      uri,
      [
        {
          resize: {
            width: maxWidth,
            height: maxHeight,
          },
        },
      ],
      {
        compress: quality,
        format: SaveFormat.JPEG,
      },
    );

    return result.uri;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error compressing image:', error);
    throw new Error('Failed to compress image');
  }
};

/**
 * Create a thumbnail from an image
 */
export const createThumbnail = async (uri: string): Promise<string> => {
  try {
    const result = await manipulateAsync(
      uri,
      [
        {
          resize: {
            width: IMAGE_CONFIG.THUMBNAIL_SIZE,
            height: IMAGE_CONFIG.THUMBNAIL_SIZE,
          },
        },
      ],
      {
        compress: 0.7,
        format: SaveFormat.JPEG,
      },
    );

    return result.uri;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error creating thumbnail:', error);
    throw new Error('Failed to create thumbnail');
  }
};

/**
 * Get image dimensions
 */
export const getImageDimensions = async (
  uri: string,
): Promise<{ width: number; height: number }> => {
  try {
    const result = await manipulateAsync(uri, [], {});
    return {
      width: result.width,
      height: result.height,
    };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error getting image dimensions:', error);
    throw new Error('Failed to get image dimensions');
  }
};

/**
 * Validate image file size
 */
export const validateImageSize = async (uri: string): Promise<boolean> => {
  try {
    const response = await fetch(uri);
    const blob = await response.blob();
    return blob.size <= IMAGE_CONFIG.MAX_SIZE;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error validating image size:', error);
    return false;
  }
};

/**
 * Generate a unique filename for image uploads
 */
export const generateImageFilename = (
  userId: string,
  type: 'snap' | 'story' | 'avatar' = 'snap',
): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(7);
  return `${type}_${userId}_${timestamp}_${random}.jpg`;
};

/**
 * Convert data URI to blob (for web compatibility)
 */
export const dataURItoBlob = (dataURI: string): Blob => {
  const byteString = atob(dataURI.split(',')[1]);
  const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);

  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }

  return new Blob([ab], { type: mimeString });
};

/**
 * Get file extension from URI
 */
export const getFileExtension = (uri: string): string => {
  const parts = uri.split('.');
  return parts[parts.length - 1].toLowerCase();
};

/**
 * Check if file is a valid image format
 */
export const isValidImageFormat = (uri: string): boolean => {
  const validFormats = ['jpg', 'jpeg', 'png', 'webp'];
  const extension = getFileExtension(uri);
  return validFormats.includes(extension);
};
