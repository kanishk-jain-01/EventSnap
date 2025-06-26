import React from 'react';
import { View, Text } from 'react-native';

export type UploadStatus = 'uploading' | 'success' | 'error';

interface UploadProgressProps {
  fileName: string;
  progress: number; // 0 - 100
  status: UploadStatus;
  error?: string;
}

export const UploadProgress: React.FC<UploadProgressProps> = ({
  fileName,
  progress,
  status,
  error,
}) => {
  const renderStatusText = () => {
    switch (status) {
      case 'uploading':
        return `${Math.round(progress)}%`;
      case 'success':
        return 'Uploaded';
      case 'error':
        return `Error: ${error || 'Upload failed'}`;
      default:
        return '';
    }
  };

  return (
    <View className='w-full mb-4'>
      {/* File name */}
      <Text className='text-white text-sm mb-1'>{fileName}</Text>

      {/* Progress bar */}
      <View className='w-full h-2 bg-gray-700 rounded'>
        <View
          className={`h-full rounded ${status === 'error' ? 'bg-red-600' : 'bg-snap-yellow'}`}
          style={{ width: `${status === 'success' ? 100 : progress}%` }}
        />
      </View>

      {/* Status text */}
      <Text className='text-xs text-white mt-1'>{renderStatusText()}</Text>
    </View>
  );
};

export default UploadProgress; 