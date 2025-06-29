import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  Image,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { manipulateAsync, SaveFormat, FlipType } from 'expo-image-manipulator';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { useThemeColors } from '../ui/ThemeProvider';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export interface ImageEditorProps {
  imageUri: string;
  imageWidth: number;
  imageHeight: number;
  onSave: (_editedUri: string) => void;
  onCancel: () => void;
  onDelete?: () => void;
}

interface EditState {
  brightness: number;
  contrast: number;
  saturation: number;
  rotation: number;
  flipHorizontal: boolean;
  flipVertical: boolean;
  filter: 'none' | 'sepia' | 'noir' | 'chrome' | 'fade' | 'instant';
}

export const ImageEditor: React.FC<ImageEditorProps> = ({
  imageUri,
  imageWidth,
  imageHeight,
  onSave,
  onCancel,
  onDelete,
}) => {
  const _colors = useThemeColors();
  
  // Edit states
  const [editState, setEditState] = useState<EditState>({
    brightness: 0,
    contrast: 0,
    saturation: 0,
    rotation: 0,
    flipHorizontal: false,
    flipVertical: false,
    filter: 'none',
  });

  // UI states
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<'filters' | 'rotate'>('rotate');
  const [previewUri, setPreviewUri] = useState<string>(imageUri);
  const [hasChanges, setHasChanges] = useState(false);

  // Gesture states for crop (future enhancement)
  // const [scale, setScale] = useState(1);
  // const [translateX, setTranslateX] = useState(0);
  // const [translateY, setTranslateY] = useState(0);

  // Apply edits and generate preview
  const applyEdits = async (newEditState?: EditState) => {
    const currentState = newEditState || editState;
    setIsProcessing(true);

    try {
      const actions = [];

      // Apply rotation
      if (currentState.rotation !== 0) {
        actions.push({ rotate: currentState.rotation });
      }

      // Apply flips (separate actions for each flip)
      if (currentState.flipHorizontal) {
        actions.push({ flip: FlipType.Horizontal });
      }
      if (currentState.flipVertical) {
        actions.push({ flip: FlipType.Vertical });
      }

      // Apply manipulations
      const result = await manipulateAsync(imageUri, actions, {
        compress: 0.9,
        format: SaveFormat.JPEG,
      });

      setPreviewUri(result.uri);
      setHasChanges(
        currentState.brightness !== 0 ||
          currentState.contrast !== 0 ||
          currentState.saturation !== 0 ||
          currentState.rotation !== 0 ||
          currentState.flipHorizontal ||
          currentState.flipVertical ||
          currentState.filter !== 'none',
      );
    } catch {
      // console.error('Error applying edits:', error);
      Alert.alert('Error', 'Failed to apply edits. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle adjustment changes
  const handleAdjustmentChange = (
    type: keyof EditState,
    value: number | boolean | string,
  ) => {
    const newState = { ...editState, [type]: value };
    setEditState(newState);
    applyEdits(newState);
  };

  // Reset all edits
  const resetEdits = () => {
    const resetState: EditState = {
      brightness: 0,
      contrast: 0,
      saturation: 0,
      rotation: 0,
      flipHorizontal: false,
      flipVertical: false,
      filter: 'none',
    };
    setEditState(resetState);
    setPreviewUri(imageUri);
    setHasChanges(false);
  };

  // Save edited image
  const handleSave = async () => {
    if (!hasChanges) {
      onSave(imageUri);
      return;
    }

    setIsProcessing(true);

    try {
      const actions = [];

      // Apply all transformations
      if (editState.rotation !== 0) {
        actions.push({ rotate: editState.rotation });
      }

      // Apply flips (separate actions for each flip)
      if (editState.flipHorizontal) {
        actions.push({ flip: FlipType.Horizontal });
      }
      if (editState.flipVertical) {
        actions.push({ flip: FlipType.Vertical });
      }

      const result = await manipulateAsync(imageUri, actions, {
        compress: 0.9,
        format: SaveFormat.JPEG,
      });

      onSave(result.uri);
    } catch {
      // console.error('Error saving edited image:', error);
      Alert.alert('Error', 'Failed to save edited image. Please try again.');
      setIsProcessing(false);
    }
  };

  return (
    <View className='flex-1 bg-bg-primary'>
      <StatusBar style='dark' />

      {/* Header */}
      <View className='absolute top-12 left-0 right-0 z-20 px-4'>
        <View className='bg-white/95 backdrop-blur-sm rounded-2xl p-3 shadow-soft flex-row justify-between items-center'>
          <TouchableOpacity
            onPress={onCancel}
            className='bg-bg-secondary px-4 py-2 rounded-xl'
          >
            <Text className='text-text-primary font-semibold'>✕ Cancel</Text>
          </TouchableOpacity>

          <Text className='text-text-primary text-lg font-bold'>Edit Image</Text>

          <View className='flex-row space-x-2'>
            {hasChanges && (
              <TouchableOpacity
                onPress={resetEdits}
                className='bg-bg-secondary px-3 py-2 rounded-xl'
              >
                <Text className='text-text-primary text-sm'>Reset</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              onPress={handleSave}
              disabled={isProcessing}
              className='bg-primary px-4 py-2 rounded-xl'
            >
              {isProcessing ? (
                <LoadingSpinner size='small' color='white' />
              ) : (
                <Text className='text-white font-semibold'>Save</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Image Preview */}
      <View className='flex-1 items-center justify-center'>
        <View className='relative'>
          <Image
            source={{ uri: previewUri }}
            style={{
              width: screenWidth,
              height: screenHeight * 0.6,
            }}
            resizeMode='contain'
          />

          {isProcessing && (
            <View className='absolute inset-0 bg-black/50 items-center justify-center rounded-xl'>
              <LoadingSpinner size='large' color='white' />
              <Text className='text-white mt-2'>Processing...</Text>
            </View>
          )}
        </View>
      </View>

      {/* Bottom Controls */}
      <View className='absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm pb-8 pt-4 rounded-t-3xl shadow-soft'>
        {/* Tab Navigation */}
        <View className='flex-row justify-center space-x-4 py-4 border-b border-border'>
          {[
            { key: 'filters', name: 'Filters', icon: '🎨' },
            { key: 'rotate', name: 'Rotate', icon: '🔄' },
          ].map(tab => (
            <TouchableOpacity
              key={tab.key}
              onPress={() => setActiveTab(tab.key as any)}
              className={`px-6 py-3 rounded-xl ${
                activeTab === tab.key ? 'bg-primary' : 'bg-bg-secondary'
              }`}
            >
              <Text
                className={`${
                  activeTab === tab.key ? 'text-white' : 'text-text-primary'
                } font-medium`}
              >
                {tab.icon} {tab.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab Content */}
        <View className='px-4 py-4'>
          {activeTab === 'filters' && (
            <View className='space-y-4'>
              <Text className='text-text-primary text-center text-lg font-semibold mb-2'>
                🎨 Filters
              </Text>
              <View className='bg-bg-secondary p-6 rounded-2xl border border-border'>
                <Text className='text-text-primary text-center text-base font-medium mb-2'>
                  Coming Soon!
                </Text>
                <Text className='text-text-secondary text-center text-sm'>
                  Amazing filters and adjustments are on the way. Stay tuned for the next update! ✨
                </Text>
              </View>
            </View>
          )}

          {activeTab === 'rotate' && (
            <View className='space-y-4'>
              <Text className='text-text-primary text-center text-lg font-semibold mb-4'>
                🔄 Transform Image
              </Text>

              <View className='flex-row justify-center space-x-4'>
                <TouchableOpacity
                  onPress={() =>
                    handleAdjustmentChange(
                      'rotation',
                      (editState.rotation - 90) % 360,
                    )
                  }
                  className='bg-bg-secondary p-4 rounded-2xl items-center flex-1 border border-border'
                >
                  <Text className='text-3xl mb-2'>↺</Text>
                  <Text className='text-text-primary text-sm font-medium'>Rotate Left</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() =>
                    handleAdjustmentChange(
                      'rotation',
                      (editState.rotation + 90) % 360,
                    )
                  }
                  className='bg-bg-secondary p-4 rounded-2xl items-center flex-1 border border-border'
                >
                  <Text className='text-3xl mb-2'>↻</Text>
                  <Text className='text-text-primary text-sm font-medium'>Rotate Right</Text>
                </TouchableOpacity>
              </View>

              <View className='flex-row justify-center space-x-4 mt-4'>
                <TouchableOpacity
                  onPress={() =>
                    handleAdjustmentChange(
                      'flipHorizontal',
                      !editState.flipHorizontal,
                    )
                  }
                  className={`p-4 rounded-2xl items-center flex-1 border ${
                    editState.flipHorizontal 
                      ? 'bg-primary border-primary' 
                      : 'bg-bg-secondary border-border'
                  }`}
                >
                  <Text className='text-3xl mb-2'>↔️</Text>
                  <Text
                    className={`text-sm font-medium ${
                      editState.flipHorizontal ? 'text-white' : 'text-text-primary'
                    }`}
                  >
                    Flip H
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() =>
                    handleAdjustmentChange(
                      'flipVertical',
                      !editState.flipVertical,
                    )
                  }
                  className={`p-4 rounded-2xl items-center flex-1 border ${
                    editState.flipVertical 
                      ? 'bg-primary border-primary' 
                      : 'bg-bg-secondary border-border'
                  }`}
                >
                  <Text className='text-3xl mb-2'>↕️</Text>
                  <Text
                    className={`text-sm font-medium ${
                      editState.flipVertical ? 'text-white' : 'text-text-primary'
                    }`}
                  >
                    Flip V
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Image Info */}
        <View className='px-4 pt-4 border-t border-border'>
          <Text className='text-text-secondary text-center text-sm'>
            {imageWidth}x{imageHeight} • {hasChanges ? 'Modified' : 'Original'}
          </Text>
        </View>
      </View>

      {/* Delete Button (if provided) */}
      {onDelete && (
        <TouchableOpacity
          onPress={onDelete}
          className='absolute bottom-4 left-4 bg-error p-3 rounded-full shadow-soft'
        >
          <Text className='text-white text-lg'>🗑️</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};
