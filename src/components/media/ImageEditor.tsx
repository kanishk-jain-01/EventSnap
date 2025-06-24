import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  Image,
  Alert,
  ScrollView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { manipulateAsync, SaveFormat, FlipType } from 'expo-image-manipulator';
import { LoadingSpinner } from '../ui/LoadingSpinner';

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
  const [activeTab, setActiveTab] = useState<'adjust' | 'filters' | 'rotate'>('adjust');
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
  const handleAdjustmentChange = (type: keyof EditState, value: number | boolean | string) => {
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

  // Filter options
  const filterOptions = [
    { key: 'none', name: 'Original', preview: '🖼️' },
    { key: 'sepia', name: 'Sepia', preview: '🟤' },
    { key: 'noir', name: 'B&W', preview: '⚫' },
    { key: 'chrome', name: 'Chrome', preview: '⚪' },
    { key: 'fade', name: 'Fade', preview: '🌫️' },
    { key: 'instant', name: 'Instant', preview: '📸' },
  ];

  return (
    <View className='flex-1 bg-black'>
      <StatusBar style='light' />

      {/* Header */}
      <View className='absolute top-12 left-0 right-0 z-20 px-4'>
        <View className='flex-row justify-between items-center'>
          <TouchableOpacity
            onPress={onCancel}
            className='bg-black/60 px-4 py-2 rounded-full'
          >
            <Text className='text-white font-semibold'>✕ Cancel</Text>
          </TouchableOpacity>

          <Text className='text-white text-lg font-bold'>Edit Image</Text>

          <View className='flex-row space-x-2'>
            {hasChanges && (
              <TouchableOpacity
                onPress={resetEdits}
                className='bg-gray-600/60 px-3 py-2 rounded-full'
              >
                <Text className='text-white text-sm'>Reset</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity
              onPress={handleSave}
              disabled={isProcessing}
              className='bg-snap-yellow px-4 py-2 rounded-full'
            >
              {isProcessing ? (
                <LoadingSpinner size='small' />
              ) : (
                <Text className='text-black font-semibold'>Save</Text>
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
            <View className='absolute inset-0 bg-black/50 items-center justify-center'>
              <LoadingSpinner size='large' />
              <Text className='text-white mt-2'>Processing...</Text>
            </View>
          )}
        </View>
      </View>

      {/* Bottom Controls */}
      <View className='absolute bottom-0 left-0 right-0 bg-black/90 pb-8'>
        {/* Tab Navigation */}
        <View className='flex-row justify-center space-x-4 py-4 border-b border-gray-600'>
          {[
            { key: 'adjust', name: 'Adjust', icon: '🎚️' },
            { key: 'filters', name: 'Filters', icon: '🎨' },
            { key: 'rotate', name: 'Rotate', icon: '🔄' },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.key}
              onPress={() => setActiveTab(tab.key as any)}
              className={`px-4 py-2 rounded-full ${
                activeTab === tab.key ? 'bg-snap-yellow' : 'bg-gray-700'
              }`}
            >
              <Text className={`${
                activeTab === tab.key ? 'text-black' : 'text-white'
              } font-medium`}>
                {tab.icon} {tab.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab Content */}
        <View className='px-4 py-4'>
          {activeTab === 'adjust' && (
            <View className='space-y-4'>
              <Text className='text-white text-center text-sm mb-2'>
                Image Adjustments (Coming Soon)
              </Text>
              <Text className='text-gray-400 text-center text-xs'>
                Brightness, Contrast, and Saturation controls will be available in the next update
              </Text>
            </View>
          )}

          {activeTab === 'filters' && (
            <View>
              <Text className='text-white text-center text-sm mb-4'>Choose Filter</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View className='flex-row space-x-3 px-2'>
                  {filterOptions.map((filter) => (
                    <TouchableOpacity
                      key={filter.key}
                      onPress={() => handleAdjustmentChange('filter', filter.key)}
                      className={`items-center p-3 rounded-xl ${
                        editState.filter === filter.key ? 'bg-snap-yellow' : 'bg-gray-700'
                      }`}
                    >
                      <Text className='text-2xl mb-1'>{filter.preview}</Text>
                      <Text className={`text-xs ${
                        editState.filter === filter.key ? 'text-black' : 'text-white'
                      }`}>
                        {filter.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
          )}

          {activeTab === 'rotate' && (
            <View className='space-y-4'>
              <Text className='text-white text-center text-sm mb-4'>Transform Image</Text>
              
              <View className='flex-row justify-center space-x-4'>
                <TouchableOpacity
                  onPress={() => handleAdjustmentChange('rotation', (editState.rotation - 90) % 360)}
                  className='bg-gray-700 p-4 rounded-xl items-center flex-1'
                >
                  <Text className='text-2xl mb-1'>↺</Text>
                  <Text className='text-white text-xs'>Rotate Left</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => handleAdjustmentChange('rotation', (editState.rotation + 90) % 360)}
                  className='bg-gray-700 p-4 rounded-xl items-center flex-1'
                >
                  <Text className='text-2xl mb-1'>↻</Text>
                  <Text className='text-white text-xs'>Rotate Right</Text>
                </TouchableOpacity>
              </View>

              <View className='flex-row justify-center space-x-4 mt-4'>
                <TouchableOpacity
                  onPress={() => handleAdjustmentChange('flipHorizontal', !editState.flipHorizontal)}
                  className={`p-4 rounded-xl items-center flex-1 ${
                    editState.flipHorizontal ? 'bg-snap-yellow' : 'bg-gray-700'
                  }`}
                >
                  <Text className='text-2xl mb-1'>↔️</Text>
                  <Text className={`text-xs ${
                    editState.flipHorizontal ? 'text-black' : 'text-white'
                  }`}>
                    Flip H
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => handleAdjustmentChange('flipVertical', !editState.flipVertical)}
                  className={`p-4 rounded-xl items-center flex-1 ${
                    editState.flipVertical ? 'bg-snap-yellow' : 'bg-gray-700'
                  }`}
                >
                  <Text className='text-2xl mb-1'>↕️</Text>
                  <Text className={`text-xs ${
                    editState.flipVertical ? 'text-black' : 'text-white'
                  }`}>
                    Flip V
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Image Info */}
        <View className='px-4 pt-2 border-t border-gray-600'>
          <Text className='text-gray-400 text-center text-xs'>
            {imageWidth}x{imageHeight} • {hasChanges ? 'Modified' : 'Original'}
          </Text>
        </View>
      </View>

      {/* Delete Button (if provided) */}
      {onDelete && (
        <TouchableOpacity
          onPress={onDelete}
          className='absolute bottom-4 left-4 bg-red-600 p-3 rounded-full'
        >
          <Text className='text-white text-lg'>🗑️</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}; 