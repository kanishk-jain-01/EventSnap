import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, View } from 'react-native';
import { ButtonProps } from '../../types';
import { useThemeColors } from './ThemeProvider';

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
}) => {
  const colors = useThemeColors();

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

    // Variant styles - using new Creative Light Theme
    switch (variant) {
      case 'secondary':
        baseStyles += ' bg-surface border border-border';
        break;
      case 'outline':
        baseStyles += ' bg-transparent border-2 border-primary';
        break;
      case 'danger':
        baseStyles += ' bg-error border border-error';
        break;
      default: // primary
        baseStyles += ' bg-primary';
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

    // Variant styles - using new Creative Light Theme
    switch (variant) {
      case 'secondary':
        textStyles += ' text-text-primary';
        break;
      case 'outline':
        textStyles += ' text-primary';
        break;
      case 'danger':
        textStyles += ' text-text-inverse';
        break;
      default: // primary
        textStyles += ' text-text-inverse';
    }

    return textStyles;
  };

  const getLoadingColor = () => {
    switch (variant) {
      case 'secondary':
        return colors.textPrimary;
      case 'outline':
        return colors.primary;
      case 'danger':
        return colors.textInverse;
      default: // primary
        return colors.textInverse;
    }
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
            color={getLoadingColor()}
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
