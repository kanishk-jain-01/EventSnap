import React from 'react';
import {
  Modal as RNModal,
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from 'react-native';
import { ModalProps } from '../../types';

export const Modal: React.FC<ModalProps> = ({
  visible,
  onClose,
  title,
  children,
  showCloseButton = true,
  animationType = 'fade',
  transparent = true,
}) => {
  return (
    <RNModal
      visible={visible}
      animationType={animationType}
      transparent={transparent}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View className='flex-1 bg-black/50 items-center justify-center px-4'>
          <TouchableWithoutFeedback onPress={() => {}}>
            <View className='bg-snap-dark rounded-lg w-full max-w-sm p-6 border border-snap-light-gray'>
              {/* Header */}
              <View className='flex-row items-center justify-between mb-4'>
                {title && (
                  <Text className='text-white text-lg font-semibold flex-1'>
                    {title}
                  </Text>
                )}
                {showCloseButton && (
                  <TouchableOpacity
                    onPress={onClose}
                    className='ml-4 p-2 -m-2'
                    activeOpacity={0.7}
                  >
                    <Text className='text-white text-xl font-bold'>×</Text>
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
