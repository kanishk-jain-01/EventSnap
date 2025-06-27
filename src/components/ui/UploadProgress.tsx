import React from 'react';
import { View, Text } from 'react-native';
import { useThemeColors } from './ThemeProvider';

export type UploadStatus =
  | 'uploading'
  | 'processing'
  | 'completed'
  | 'success'
  | 'error';

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
  const colors = useThemeColors();
  const renderStatusText = () => {
    switch (status) {
      case 'uploading':
        return `${Math.round(progress)}%`;
      case 'processing':
        return 'Processing...';
      case 'completed':
      case 'success':
        return 'Completed';
      case 'error':
        return `Error: ${error || 'Upload failed'}`;
      default:
        return '';
    }
  };

  return (
    <View style={{ width: '100%', marginBottom: 16 }}>
      {/* File name */}
      <Text
        style={{ color: colors.textPrimary, fontSize: 14, marginBottom: 4 }}
      >
        {fileName}
      </Text>

      {/* Progress bar */}
      <View
        style={{
          width: '100%',
          height: 8,
          backgroundColor: colors.border,
          borderRadius: 4,
        }}
      >
        <View
          style={{
            height: '100%',
            borderRadius: 4,
            backgroundColor: status === 'error' ? colors.error : colors.primary,
            width: `${status === 'completed' || status === 'success' ? 100 : progress}%`,
          }}
        />
      </View>

      {/* Status text */}
      <Text
        style={{
          fontSize: 12,
          color: status === 'error' ? colors.error : colors.textSecondary,
          marginTop: 4,
        }}
      >
        {renderStatusText()}
      </Text>
    </View>
  );
};

export default UploadProgress;
