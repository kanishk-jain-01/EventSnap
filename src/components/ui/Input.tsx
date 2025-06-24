import React from 'react';
import { View, Text, TextInput } from 'react-native';
import { InputProps } from '../../types';

export const Input: React.FC<InputProps> = ({
  label,
  placeholder,
  value,
  onChangeText,
  secureTextEntry = false,
  error,
  autoCapitalize = 'none',
  keyboardType = 'default',
}) => {
  return (
    <View className='mb-4'>
      {label && (
        <Text className='text-white text-sm font-medium mb-2'>{label}</Text>
      )}
      <TextInput
        className={`bg-snap-gray border rounded-lg px-4 py-3 text-white text-base ${
          error ? 'border-snap-red' : 'border-snap-light-gray'
        }`}
        placeholder={placeholder}
        placeholderTextColor='#9CA3AF'
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        autoCapitalize={autoCapitalize}
        keyboardType={keyboardType}
        autoCorrect={false}
        autoComplete='off'
      />
      {error && <Text className='text-snap-red text-sm mt-1'>{error}</Text>}
    </View>
  );
};
