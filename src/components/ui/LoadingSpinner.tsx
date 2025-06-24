import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { LoadingSpinnerProps } from '../../types';

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'medium',
  color,
  text,
  overlay = false,
}) => {
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
      baseStyles += ' absolute inset-0 bg-black/50 z-50';
    } else {
      baseStyles += ' py-4';
    }

    return baseStyles;
  };

  const getSpinnerColor = () => {
    if (color) return color;
    return overlay ? '#FFFC00' : '#FFFC00'; // snap-yellow
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

    textStyles += overlay ? ' text-white' : ' text-white';

    return textStyles;
  };

  return (
    <View className={getContainerStyles()}>
      <ActivityIndicator size={getSpinnerSize()} color={getSpinnerColor()} />
      {text && <Text className={getTextStyles()}>{text}</Text>}
    </View>
  );
};
