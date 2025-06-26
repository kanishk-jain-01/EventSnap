import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { LoadingSpinnerProps } from '../../types';
import { useThemeColors } from './ThemeProvider';

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'medium',
  color,
  text,
  overlay = false,
}) => {
  const colors = useThemeColors();

  const getSpinnerSize = () => {
    switch (size) {
      case 'small':
        return 'small';
      case 'large':
        return 'large';
      default:
        return 'small';
    }
  };

  const getContainerStyles = () => {
    let baseStyles = 'flex items-center justify-center';

    if (overlay) {
      // Dark overlay with opacity for modal loading states
      baseStyles += ' absolute inset-0 bg-text-primary/60 z-50';
    } else {
      baseStyles += ' py-4';
    }

    return baseStyles;
  };

  const getSpinnerColor = () => {
    if (color) return color;
    // Use primary color for spinner - vibrant purple
    return overlay ? colors.primary : colors.primary;
  };

  const getTextStyles = () => {
    let textStyles = 'text-center font-medium mt-2';

    switch (size) {
      case 'small':
        textStyles += ' text-sm';
        break;
      case 'large':
        textStyles += ' text-lg';
        break;
      default:
        textStyles += ' text-base';
    }

    // Use appropriate text color based on overlay state
    textStyles += overlay ? ' text-text-inverse' : ' text-text-primary';

    return textStyles;
  };

  return (
    <View className={getContainerStyles()}>
      <ActivityIndicator size={getSpinnerSize()} color={getSpinnerColor()} />
      {text && <Text className={getTextStyles()}>{text}</Text>}
    </View>
  );
};
