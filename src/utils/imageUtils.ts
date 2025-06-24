import { manipulateAsync, SaveFormat, FlipType } from 'expo-image-manipulator';
import { IMAGE_CONFIG } from './constants';

// Enhanced interfaces for Task 4.5
export interface ImageCompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: SaveFormat;
  maintainAspectRatio?: boolean;
  targetSizeKB?: number;
}

export interface ImageOptimizationResult {
  uri: string;
  width: number;
  height: number;
  fileSize: number;
  compressionRatio: number;
  format: SaveFormat;
}

export interface ImageDimensions {
  width: number;
  height: number;
  aspectRatio: number;
}

export interface BatchProcessingOptions {
  onProgress?: (_completed: number, _total: number) => void;
  onError?: (_index: number, _error: string) => void;
  concurrency?: number;
}

/**
 * Enhanced image compression with progressive quality reduction
 */
export const compressImage = async (
  uri: string,
  options: ImageCompressionOptions = {},
): Promise<ImageOptimizationResult> => {
  try {
    const {
      maxWidth = IMAGE_CONFIG.MAX_WIDTH,
      maxHeight = IMAGE_CONFIG.MAX_HEIGHT,
      quality = IMAGE_CONFIG.QUALITY,
      format = SaveFormat.JPEG,
      maintainAspectRatio = true,
      targetSizeKB,
    } = options;

    // Get original dimensions and file size
    const originalDimensions = await getImageDimensions(uri);
    const originalSize = await getImageFileSize(uri);

    // Calculate optimal dimensions
    const targetDimensions = calculateOptimalDimensions(
      originalDimensions,
      { maxWidth, maxHeight },
      maintainAspectRatio,
    );

    let currentQuality = quality;
    let result;
    let attempts = 0;
    const maxAttempts = 5;

    while (true) {
      result = await manipulateAsync(
        uri,
        [
          {
            resize: {
              width: targetDimensions.width,
              height: targetDimensions.height,
            },
          },
        ],
        {
          compress: currentQuality,
          format,
        },
      );

      // If no target size specified, return first result
      if (!targetSizeKB) break;

      const currentSize = await getImageFileSize(result.uri);
      const currentSizeKB = currentSize / 1024;

      // If we've reached the target size or tried too many times, break
      if (currentSizeKB <= targetSizeKB || attempts >= maxAttempts) break;

      // Reduce quality for next attempt
      currentQuality = Math.max(0.1, currentQuality - 0.15);
      attempts++;
    }

    const finalSize = await getImageFileSize(result.uri);
    const compressionRatio = originalSize / finalSize;

    return {
      uri: result.uri,
      width: result.width,
      height: result.height,
      fileSize: finalSize,
      compressionRatio,
      format,
    };
  } catch (error) {
    console.error('Error compressing image:', error);
    throw new Error('Failed to compress image');
  }
};

/**
 * Smart image optimization based on usage context
 */
export const optimizeForContext = async (
  uri: string,
  context: 'snap' | 'story' | 'avatar' | 'thumbnail',
): Promise<ImageOptimizationResult> => {
  const contextConfigs = {
    snap: {
      maxWidth: 1080,
      maxHeight: 1920,
      quality: 0.85,
      targetSizeKB: 800,
    },
    story: {
      maxWidth: 1080,
      maxHeight: 1920,
      quality: 0.8,
      targetSizeKB: 600,
    },
    avatar: {
      maxWidth: 400,
      maxHeight: 400,
      quality: 0.9,
      targetSizeKB: 200,
    },
    thumbnail: {
      maxWidth: 200,
      maxHeight: 200,
      quality: 0.7,
      targetSizeKB: 50,
    },
  };

  return compressImage(uri, contextConfigs[context]);
};

/**
 * Create multiple thumbnail sizes
 */
export const createMultipleThumbnails = async (
  uri: string,
  sizes: number[] = [100, 200, 400],
): Promise<{ size: number; uri: string }[]> => {
  try {
    const thumbnails = await Promise.all(
      sizes.map(async size => {
        const result = await manipulateAsync(
          uri,
          [
            {
              resize: {
                width: size,
                height: size,
              },
            },
          ],
          {
            compress: 0.7,
            format: SaveFormat.JPEG,
          },
        );
        return { size, uri: result.uri };
      }),
    );

    return thumbnails;
  } catch (error) {
    console.error('Error creating thumbnails:', error);
    throw new Error('Failed to create thumbnails');
  }
};

/**
 * Enhanced thumbnail creation with smart cropping
 */
export const createThumbnail = async (
  uri: string,
  size: number = IMAGE_CONFIG.THUMBNAIL_SIZE,
): Promise<string> => {
  try {
    const dimensions = await getImageDimensions(uri);
    const isLandscape = dimensions.width > dimensions.height;

    // Smart crop to center for square thumbnails
    const cropSize = Math.min(dimensions.width, dimensions.height);
    const cropX = isLandscape ? (dimensions.width - cropSize) / 2 : 0;
    const cropY = !isLandscape ? (dimensions.height - cropSize) / 2 : 0;

    const result = await manipulateAsync(
      uri,
      [
        {
          crop: {
            originX: cropX,
            originY: cropY,
            width: cropSize,
            height: cropSize,
          },
        },
        {
          resize: {
            width: size,
            height: size,
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
    console.error('Error creating thumbnail:', error);
    throw new Error('Failed to create thumbnail');
  }
};

/**
 * Advanced image transformations
 */
export const transformImage = async (
  uri: string,
  transformations: {
    rotate?: number;
    flip?: FlipType;
    crop?: {
      originX: number;
      originY: number;
      width: number;
      height: number;
    };
    resize?: {
      width: number;
      height: number;
    };
  },
): Promise<string> => {
  try {
    const actions = [];

    if (transformations.crop) {
      actions.push({ crop: transformations.crop });
    }

    if (transformations.rotate) {
      actions.push({ rotate: transformations.rotate });
    }

    if (transformations.flip) {
      actions.push({ flip: transformations.flip });
    }

    if (transformations.resize) {
      actions.push({ resize: transformations.resize });
    }

    const result = await manipulateAsync(uri, actions, {
      compress: 0.8,
      format: SaveFormat.JPEG,
    });

    return result.uri;
  } catch (error) {
    console.error('Error transforming image:', error);
    throw new Error('Failed to transform image');
  }
};

/**
 * Batch process multiple images
 */
export const batchProcessImages = async (
  uris: string[],
  processor: (_uri: string) => Promise<string>,
  options: BatchProcessingOptions = {},
): Promise<string[]> => {
  const { onProgress, onError, concurrency = 3 } = options;
  const results: string[] = [];
  const errors: { index: number; error: string }[] = [];

  // Process in chunks to limit concurrency
  for (let i = 0; i < uris.length; i += concurrency) {
    const chunk = uris.slice(i, i + concurrency);
    const chunkPromises = chunk.map(async (uri, chunkIndex) => {
      const globalIndex = i + chunkIndex;
      try {
        const result = await processor(uri);
        results[globalIndex] = result;
        onProgress?.(globalIndex + 1, uris.length);
        return result;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        errors.push({ index: globalIndex, error: errorMessage });
        onError?.(globalIndex, errorMessage);
        throw error;
      }
    });

    await Promise.allSettled(chunkPromises);
  }

  if (errors.length > 0) {
    console.warn(
      `Batch processing completed with ${errors.length} errors:`,
      errors,
    );
  }

  return results.filter(Boolean); // Remove undefined entries from failed processes
};

/**
 * Get enhanced image dimensions with aspect ratio
 */
export const getImageDimensions = async (
  uri: string,
): Promise<ImageDimensions> => {
  try {
    const result = await manipulateAsync(uri, [], {});
    return {
      width: result.width,
      height: result.height,
      aspectRatio: result.width / result.height,
    };
  } catch (error) {
    console.error('Error getting image dimensions:', error);
    throw new Error('Failed to get image dimensions');
  }
};

/**
 * Get image file size in bytes
 */
export const getImageFileSize = async (uri: string): Promise<number> => {
  try {
    const response = await fetch(uri);
    const blob = await response.blob();
    return blob.size;
  } catch (error) {
    console.error('Error getting image file size:', error);
    throw new Error('Failed to get image file size');
  }
};

/**
 * Calculate optimal dimensions maintaining aspect ratio
 */
export const calculateOptimalDimensions = (
  original: { width: number; height: number },
  constraints: { maxWidth: number; maxHeight: number },
  maintainAspectRatio: boolean = true,
): { width: number; height: number } => {
  if (!maintainAspectRatio) {
    return {
      width: Math.min(original.width, constraints.maxWidth),
      height: Math.min(original.height, constraints.maxHeight),
    };
  }

  const aspectRatio = original.width / original.height;

  let width = Math.min(original.width, constraints.maxWidth);
  let height = width / aspectRatio;

  if (height > constraints.maxHeight) {
    height = constraints.maxHeight;
    width = height * aspectRatio;
  }

  return {
    width: Math.round(width),
    height: Math.round(height),
  };
};

/**
 * Enhanced image size validation with detailed feedback
 */
export const validateImageSize = async (
  uri: string,
  maxSizeBytes: number = IMAGE_CONFIG.MAX_SIZE,
): Promise<{
  isValid: boolean;
  currentSize: number;
  maxSize: number;
  compressionNeeded: boolean;
}> => {
  try {
    const currentSize = await getImageFileSize(uri);
    const isValid = currentSize <= maxSizeBytes;
    const compressionNeeded = currentSize > maxSizeBytes;

    return {
      isValid,
      currentSize,
      maxSize: maxSizeBytes,
      compressionNeeded,
    };
  } catch (error) {
    console.error('Error validating image size:', error);
    return {
      isValid: false,
      currentSize: 0,
      maxSize: maxSizeBytes,
      compressionNeeded: true,
    };
  }
};

/**
 * Auto-optimize image based on file size and dimensions
 */
export const autoOptimizeImage = async (
  uri: string,
): Promise<ImageOptimizationResult> => {
  try {
    const dimensions = await getImageDimensions(uri);
    const fileSize = await getImageFileSize(uri);
    const fileSizeKB = fileSize / 1024;

    // Determine optimization strategy based on current state
    let quality = 0.8;
    let maxWidth: number = IMAGE_CONFIG.MAX_WIDTH;
    let maxHeight: number = IMAGE_CONFIG.MAX_HEIGHT;

    if (fileSizeKB > 2000) {
      // Very large file - aggressive compression
      quality = 0.6;
      maxWidth = 720;
      maxHeight = 1280;
    } else if (fileSizeKB > 1000) {
      // Large file - moderate compression
      quality = 0.7;
      maxWidth = 1080;
      maxHeight = 1920;
    } else if (dimensions.width > 1920 || dimensions.height > 1920) {
      // High resolution - resize only
      quality = 0.85;
    }

    return compressImage(uri, {
      maxWidth,
      maxHeight,
      quality,
      targetSizeKB: 800, // Target 800KB for optimal performance
    });
  } catch (error) {
    console.error('Error auto-optimizing image:', error);
    throw new Error('Failed to auto-optimize image');
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

/**
 * Format file size for display
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Calculate compression percentage
 */
export const calculateCompressionPercentage = (
  originalSize: number,
  compressedSize: number,
): number => {
  if (originalSize === 0) return 0;
  return Math.round(((originalSize - compressedSize) / originalSize) * 100);
};
