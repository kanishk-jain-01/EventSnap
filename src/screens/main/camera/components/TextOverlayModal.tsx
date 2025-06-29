import React from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
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
      title='Add Text Overlay'
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={{ padding: 20 }}>
          <Text
            style={{
              color: colors.textSecondary,
              marginBottom: 12,
              fontSize: 14,
            }}
          >
            Add text to overlay on your photo (max 200 characters)
          </Text>

          <View
            style={{
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 8,
              backgroundColor: colors.surface,
              marginBottom: 16,
            }}
          >
            <TextInput
              value={text}
              onChangeText={onTextChange}
              placeholder='Enter your text here...'
              placeholderTextColor={colors.textTertiary}
              style={{
                color: colors.textPrimary,
                fontSize: 16,
                padding: 16,
                minHeight: 100,
                textAlignVertical: 'top',
              }}
              multiline
              maxLength={200}
              autoFocus
            />
          </View>

          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 20,
            }}
          >
            <Text style={{ color: colors.textTertiary, fontSize: 12 }}>
              {text.length}/200 characters
            </Text>

            {text.length >= 180 && (
              <Text style={{ color: colors.error, fontSize: 12 }}>
                {200 - text.length} characters remaining
              </Text>
            )}
          </View>

          <View style={{ flexDirection: 'row', gap: 12 }}>
            <TouchableOpacity
              onPress={onCancel}
              style={{
                flex: 1,
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
                paddingVertical: 12,
                paddingHorizontal: 24,
                borderRadius: 8,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: colors.textPrimary, fontWeight: '600' }}>
                Cancel
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onConfirm}
              style={{
                flex: 1,
                backgroundColor: colors.primary,
                paddingVertical: 12,
                paddingHorizontal: 24,
                borderRadius: 8,
                alignItems: 'center',
                opacity: text.trim() ? 1 : 0.5,
              }}
              disabled={!text.trim()}
            >
              <Text style={{ color: 'white', fontWeight: '600' }}>
                {text ? 'Update Text' : 'Add Text'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}; 