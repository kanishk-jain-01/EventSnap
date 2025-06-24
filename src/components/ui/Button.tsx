import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, View } from 'react-native';
import { ButtonProps } from '../../types';

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
}) => {
  const getButtonStyles = () => {
    let baseStyles = 'rounded-lg flex-row items-center justify-center';

    // Size styles
    switch (size) {
      case 'small':
        baseStyles += ' px-4 py-2';
        break;
      case 'large':
        baseStyles += ' px-8 py-4';
        break;
      default: // medium
        baseStyles += ' px-6 py-3';
    }

    // Variant styles
    switch (variant) {
      case 'secondary':
        baseStyles += ' bg-snap-gray border border-snap-light-gray';
        break;
      case 'outline':
        baseStyles += ' bg-transparent border-2 border-snap-yellow';
        break;
      default: // primary
        baseStyles += ' bg-snap-yellow';
    }

    // Disabled state
    if (disabled || loading) {
      baseStyles += ' opacity-50';
    }

    return baseStyles;
  };

  const getTextStyles = () => {
    let textStyles = 'font-semibold text-center';

    // Size styles
    switch (size) {
      case 'small':
        textStyles += ' text-sm';
        break;
      case 'large':
        textStyles += ' text-lg';
        break;
      default: // medium
        textStyles += ' text-base';
    }

    // Variant styles
    switch (variant) {
      case 'secondary':
        textStyles += ' text-white';
        break;
      case 'outline':
        textStyles += ' text-snap-yellow';
        break;
      default: // primary
        textStyles += ' text-snap-dark';
    }

    return textStyles;
  };

  return (
    <TouchableOpacity
      className={getButtonStyles()}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <View className='flex-row items-center'>
          <ActivityIndicator
            size='small'
            color={variant === 'primary' ? '#1a1a1a' : '#ffffff'}
            className='mr-2'
          />
          <Text className={getTextStyles()}>Loading...</Text>
        </View>
      ) : (
        <Text className={getTextStyles()}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};
