import React from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { Modal } from '../../../../components/ui/Modal';
import { useThemeColors } from '../../../../components/ui/ThemeProvider';
import { TextOverlayModalProps } from '../types';

export const TextOverlayModal: React.FC<TextOverlayModalProps> = ({
  visible,
  text,
  onTextChange,
  onConfirm,
  onCancel,
}) => {
  const colors = useThemeColors();

  return (
    <Modal
      visible={visible}
      onClose={onCancel}
      title='Add Text to Photo'
      showCloseButton={false}
    >
      <View>
        <Text className='text-text-secondary text-center text-base mb-4'>
          Add text that will appear on your photo ✨
        </Text>

        <View className='bg-bg-secondary border border-border rounded-2xl mb-4 p-4'>
          <TextInput
            value={text}
            onChangeText={onTextChange}
            placeholder='Type your message here...'
            placeholderTextColor={colors.textTertiary}
            style={{
              color: colors.textPrimary,
              fontSize: 16,
              minHeight: 80,
              textAlignVertical: 'top',
            }}
            multiline
            maxLength={200}
            autoFocus
            returnKeyType="done"
            onSubmitEditing={text.trim() ? onConfirm : undefined}
          />
        </View>

        <View className='flex-row justify-between items-center mb-6'>
          <Text className='text-text-tertiary text-sm'>
            {text.length}/200 characters
          </Text>

          {text.length >= 180 && (
            <Text className='text-error text-sm font-medium'>
              {200 - text.length} left
            </Text>
          )}
        </View>

        <View className='flex-row gap-3'>
          <TouchableOpacity
            onPress={onCancel}
            className='flex-1 bg-bg-secondary border border-border py-4 px-6 rounded-xl items-center'
          >
            <Text className='text-text-primary font-semibold text-base'>
              Cancel
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onConfirm}
            disabled={!text.trim()}
            className={`flex-1 py-4 px-6 rounded-xl items-center ${
              text.trim() ? 'bg-primary' : 'bg-bg-tertiary'
            }`}
          >
            <Text className={`font-semibold text-base ${
              text.trim() ? 'text-white' : 'text-text-tertiary'
            }`}>
              {text.trim() ? 'Add Text' : 'Add Text'}
            </Text>
          </TouchableOpacity>
        </View>

        <Text className='text-text-tertiary text-center text-sm mt-4'>
          💡 Tip: Press "Add Text" or Return key to confirm
        </Text>
      </View>
    </Modal>
  );
}; 