import React from 'react';
import {
  Modal as RNModal,
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from 'react-native';
import { ModalProps } from '../../types';
import { useThemeColors } from './ThemeProvider';

export const Modal: React.FC<ModalProps> = ({
  visible,
  onClose,
  title,
  children,
  showCloseButton = true,
  animationType = 'fade',
  transparent = true,
}) => {
  const colors = useThemeColors();

  return (
    <RNModal
      visible={visible}
      animationType={animationType}
      transparent={transparent}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View className='flex-1 items-center justify-center px-4' 
              style={{ backgroundColor: colors.textPrimary + '80' }}> {/* Semi-transparent overlay */}
          <TouchableWithoutFeedback onPress={() => {}}>
            <View 
              className='bg-surface rounded-xl w-full max-w-sm p-6 border border-border'
              style={{
                // Add beautiful shadow for depth
                shadowColor: colors.shadow,
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.15,
                shadowRadius: 16,
                elevation: 8,
              }}
            >
              {/* Header */}
              <View className='flex-row items-center justify-between mb-4'>
                {title && (
                  <Text className='text-text-primary text-lg font-semibold flex-1'>
                    {title}
                  </Text>
                )}
                {showCloseButton && (
                  <TouchableOpacity
                    onPress={onClose}
                    className='ml-4 p-2 -m-2 rounded-full'
                    activeOpacity={0.7}
                    style={{ backgroundColor: colors.interactiveHover }}
                  >
                    <Text 
                      className='text-xl font-bold'
                      style={{ color: colors.textSecondary }}
                    >
                      ×
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Content */}
              <View>{children}</View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </RNModal>
  );
};
