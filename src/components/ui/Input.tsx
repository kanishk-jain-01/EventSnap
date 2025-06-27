import React from 'react';
import { View, Text, TextInput } from 'react-native';
import { InputProps } from '../../types';
import { useThemeColors } from './ThemeProvider';

export const Input: React.FC<InputProps> = ({
  label,
  placeholder,
  value,
  onChangeText,
  secureTextEntry = false,
  error,
  autoCapitalize = 'none',
  keyboardType = 'default',
  maxLength,
  returnKeyType,
  onSubmitEditing,
  blurOnSubmit,
}) => {
  const colors = useThemeColors();

  return (
    <View className='mb-4'>
      {label && (
        <Text className='text-text-primary text-sm font-medium mb-2'>
          {label}
        </Text>
      )}
              <TextInput
        className={`bg-surface border rounded-lg px-5 py-4 text-text-primary text-base ${
          error ? 'border-error' : 'border-border focus:border-primary'
        }`}
        placeholder={placeholder}
        placeholderTextColor={colors.textTertiary}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        autoCapitalize={autoCapitalize}
        keyboardType={keyboardType}
        maxLength={maxLength}
        returnKeyType={returnKeyType}
        onSubmitEditing={onSubmitEditing}
        blurOnSubmit={blurOnSubmit}
        autoCorrect={false}
        autoComplete='off'
        style={{
          minHeight: 52,
          lineHeight: 20,
          // Additional styles for better light theme appearance
          shadowColor: colors.shadow,
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 2,
          elevation: 1,
        }}
      />
      {error && <Text className='text-error text-sm mt-1'>{error}</Text>}
    </View>
  );
};
