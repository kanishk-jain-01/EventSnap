import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { LoadingSpinner } from '../../../../components/ui/LoadingSpinner';
import { useThemeColors } from '../../../../components/ui/ThemeProvider';

interface FlashControlProps {
  flashMode: 'on' | 'off' | 'auto';
  onToggle: () => void;
}

const FlashControl: React.FC<FlashControlProps> = ({ flashMode, onToggle }) => {
  const getFlashModeIcon = () => {
    switch (flashMode) {
      case 'auto':
        return '⚡';
      case 'on':
        return '🔆';
      case 'off':
        return '🚫';
      default:
        return '⚡';
    }
  };

  const getFlashModeText = () => {
    switch (flashMode) {
      case 'auto':
        return 'AUTO';
      case 'on':
        return 'ON';
      case 'off':
        return 'OFF';
      default:
        return 'AUTO';
    }
  };

  return (
    <TouchableOpacity
      onPress={onToggle}
      className={`px-3 py-2 rounded-xl flex-row items-center ${
        flashMode !== 'off' ? 'bg-primary/10' : 'bg-bg-secondary'
      }`}
    >
      <Text className={`text-lg mr-1 ${
        flashMode !== 'off' ? 'text-primary' : 'text-text-secondary'
      }`}>
        {getFlashModeIcon()}
      </Text>
      <Text className={`text-xs font-medium ${
        flashMode !== 'off' ? 'text-primary' : 'text-text-secondary'
      }`}>
        {getFlashModeText()}
      </Text>
    </TouchableOpacity>
  );
};

interface TimerControlProps {
  timerMode: 0 | 3 | 10;
  onToggle: () => void;
}

const TimerControl: React.FC<TimerControlProps> = ({ timerMode, onToggle }) => {
  return (
    <TouchableOpacity
      onPress={onToggle}
      className={`px-3 py-2 rounded-xl flex-row items-center ${
        timerMode > 0 ? 'bg-accent/10' : 'bg-bg-secondary'
      }`}
    >
      <Text className={`text-lg mr-1 ${
        timerMode > 0 ? 'text-accent' : 'text-text-secondary'
      }`}>⏱️</Text>
      <Text className={`text-xs font-medium ${
        timerMode > 0 ? 'text-accent' : 'text-text-secondary'
      }`}>
        {timerMode === 0 ? 'OFF' : `${timerMode}s`}
      </Text>
    </TouchableOpacity>
  );
};

interface ZoomControlProps {
  zoom: number;
  onAdjustZoom: (_direction: 'in' | 'out') => void;
}

const ZoomControl: React.FC<ZoomControlProps> = ({ zoom, onAdjustZoom }) => {
  return (
    <View className='bg-white/95 backdrop-blur-sm rounded-2xl py-3 px-2 shadow-soft'>
      <TouchableOpacity
        onPress={() => onAdjustZoom('in')}
        className='p-2'
        disabled={zoom >= 1}
      >
        <Text
          className={`text-lg font-bold ${zoom >= 1 ? 'text-text-tertiary' : 'text-primary'}`}
        >
          +
        </Text>
      </TouchableOpacity>
      <View className='h-20 w-1 bg-border mx-auto my-2 rounded-full'>
        <View
          className='bg-primary w-full rounded-full'
          style={{ height: `${zoom * 100}%` }}
        />
      </View>
      <TouchableOpacity
        onPress={() => onAdjustZoom('out')}
        className='p-2'
        disabled={zoom <= 0}
      >
        <Text
          className={`text-lg font-bold ${zoom <= 0 ? 'text-text-tertiary' : 'text-primary'}`}
        >
          −
        </Text>
      </TouchableOpacity>
    </View>
  );
};

interface TopControlsBarProps {
  flashMode: 'on' | 'off' | 'auto';
  timerMode: 0 | 3 | 10;
  showGrid: boolean;
  onToggleFlash: () => void;
  onToggleTimer: () => void;
  onToggleGrid: () => void;
  onToggleCamera: () => void;
}

export const TopControlsBar: React.FC<TopControlsBarProps> = ({
  flashMode,
  timerMode,
  showGrid,
  onToggleFlash,
  onToggleTimer,
  onToggleGrid,
  onToggleCamera,
}) => {
  return (
    <View className='absolute top-12 left-0 right-0 px-4'>
      <View className='bg-white/95 backdrop-blur-sm rounded-2xl px-4 py-3 shadow-soft'>
        <View className='flex-row justify-between items-center'>
          {/* Left Side Controls */}
          <View className='flex-row items-center space-x-3'>
            <FlashControl flashMode={flashMode} onToggle={onToggleFlash} />
            <TimerControl timerMode={timerMode} onToggle={onToggleTimer} />
          </View>

          {/* Center Title */}
          <Text className='text-text-primary text-lg font-bold'>Camera</Text>

          {/* Right Side Controls */}
          <View className='flex-row items-center space-x-3'>
            {/* Grid Toggle */}
            <TouchableOpacity
              onPress={onToggleGrid}
              className={`p-2 rounded-xl ${
                showGrid ? 'bg-warning/10' : 'bg-bg-secondary'
              }`}
            >
              <Text className={`text-lg ${
                showGrid ? 'text-warning' : 'text-text-secondary'
              }`}>⊞</Text>
            </TouchableOpacity>

            {/* Camera Switch */}
            <TouchableOpacity
              onPress={onToggleCamera}
              className='bg-bg-secondary p-2 rounded-xl'
            >
              <Text className='text-text-secondary text-lg'>🔄</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

interface BottomControlsProps {
  isCameraReady: boolean;
  isCapturing: boolean;
  isTimerActive: boolean;
  isPickingImage: boolean;
  _capturedPhoto: string | null;
  _timerCount: number;
  autoOptimize: boolean;
  onCapture: () => void;
  onPickFromGallery: () => void;
  onToggleOptimization: () => void;
}

export const BottomControls: React.FC<BottomControlsProps> = ({
  isCameraReady,
  isCapturing,
  isTimerActive,
  isPickingImage,
  _capturedPhoto,
  _timerCount,
  autoOptimize,
  onCapture,
  onPickFromGallery,
  onToggleOptimization,
}) => {
  const colors = useThemeColors();

  return (
    <View className='absolute bottom-0 left-0 right-0 pb-8'>
      {/* Main Control Row */}
      <View className='flex-row items-center justify-center px-8 mb-6'>
        {/* Gallery Button */}
        <View className='absolute left-8'>
          <TouchableOpacity
            onPress={onPickFromGallery}
            disabled={isPickingImage}
            className='bg-white/95 backdrop-blur-sm p-4 rounded-2xl shadow-soft'
          >
            {isPickingImage ? (
              <LoadingSpinner size='small' color={colors.primary} />
            ) : (
              <Text className='text-primary text-2xl'>🖼️</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Capture Button */}
        <TouchableOpacity
          onPress={onCapture}
          disabled={!isCameraReady || isCapturing || isTimerActive}
          className={`w-20 h-20 rounded-full border-4 items-center justify-center shadow-medium ${
            isCapturing || isTimerActive 
              ? 'bg-text-tertiary border-text-tertiary' 
              : 'bg-white border-primary'
          }`}
        >
          {isCapturing || isTimerActive ? (
            <LoadingSpinner size='small' color={colors.textInverse} />
          ) : (
            <View className='w-16 h-16 rounded-full bg-primary' />
          )}
        </TouchableOpacity>

        {/* Optimization Status Indicator */}
        <View className='absolute right-8'>
          <TouchableOpacity
            onPress={onToggleOptimization}
            className={`px-3 py-2 rounded-2xl shadow-soft ${
              autoOptimize ? 'bg-success/90' : 'bg-white/95'
            }`}
          >
            <View className='flex-row items-center'>
              <Text className={`text-lg mr-1 ${
                autoOptimize ? 'text-white' : 'text-text-secondary'
              }`}>⚡</Text>
              <Text className={`text-xs font-medium ${
                autoOptimize ? 'text-white' : 'text-text-secondary'
              }`}>
                {autoOptimize ? 'ON' : 'OFF'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

interface StatusBarProps {
  isCameraReady: boolean;
  isTimerActive: boolean;
  timerCount: number;
  capturedPhoto: string | null;
  cameraType: 'back' | 'front';
  zoom: number;
  showGrid: boolean;
  timerMode: 0 | 3 | 10;
  autoOptimize: boolean;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  isCameraReady,
  isTimerActive,
  timerCount,
  capturedPhoto,
  cameraType,
  zoom,
  showGrid,
  timerMode,
  autoOptimize,
}) => {
  return (
    <View className='px-4'>
      <View className='bg-white/95 backdrop-blur-sm p-4 rounded-2xl shadow-soft'>
        <Text className='text-text-primary text-center text-sm font-medium'>
          {!isCameraReady
            ? 'Camera initializing...'
            : isTimerActive
              ? `Timer: ${timerCount}s`
              : capturedPhoto
                ? '✅ Photo captured successfully!'
                : 'Tap to capture • Swipe for gallery'}
        </Text>

        {/* Camera Settings Info */}
        <View className='flex-row justify-center items-center mt-3 flex-wrap'>
          <View className='bg-bg-secondary px-2 py-1 rounded-lg mr-2 mb-1'>
            <Text className='text-text-secondary text-xs font-medium'>
              📷 {cameraType === 'back' ? 'Back' : 'Front'}
            </Text>
          </View>
          <View className='bg-bg-secondary px-2 py-1 rounded-lg mr-2 mb-1'>
            <Text className='text-text-secondary text-xs font-medium'>
              🔍 {Math.round(zoom * 100)}%
            </Text>
          </View>
          {showGrid && (
            <View className='bg-warning/10 px-2 py-1 rounded-lg mr-2 mb-1'>
              <Text className='text-warning text-xs font-medium'>⊞ Grid</Text>
            </View>
          )}
          {timerMode > 0 && (
            <View className='bg-accent/10 px-2 py-1 rounded-lg mr-2 mb-1'>
              <Text className='text-accent text-xs font-medium'>
                ⏱️ {timerMode}s
              </Text>
            </View>
          )}
          <View className={`px-2 py-1 rounded-lg mb-1 ${
            autoOptimize ? 'bg-success/10' : 'bg-bg-secondary'
          }`}>
            <Text className={`text-xs font-medium ${
              autoOptimize ? 'text-success' : 'text-text-secondary'
            }`}>
              ⚡ {autoOptimize ? 'Auto' : 'Off'}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

export const SideZoomControls: React.FC<ZoomControlProps> = ({ zoom, onAdjustZoom }) => {
  return (
    <View className='absolute right-4 top-1/2 -translate-y-1/2'>
      <ZoomControl zoom={zoom} onAdjustZoom={onAdjustZoom} />
    </View>
  );
};

export const GridOverlay: React.FC<{ visible: boolean }> = ({ visible }) => {
  if (!visible) return null;

  return (
    <View className='absolute inset-0 pointer-events-none'>
      {/* Horizontal lines */}
      <View className='absolute top-1/3 left-0 right-0 h-px bg-white/40' />
      <View className='absolute top-2/3 left-0 right-0 h-px bg-white/40' />
      {/* Vertical lines */}
      <View className='absolute left-1/3 top-0 bottom-0 w-px bg-white/40' />
      <View className='absolute left-2/3 top-0 bottom-0 w-px bg-white/40' />
    </View>
  );
};

export const TimerCountdown: React.FC<{ visible: boolean; count: number }> = ({ 
  visible, 
  count, 
}) => {
  if (!visible || count <= 0) return null;

  return (
    <View className='absolute inset-0 bg-black/60 items-center justify-center'>
      <View className='bg-white/90 rounded-full w-32 h-32 items-center justify-center shadow-strong'>
        <Text className='text-primary text-6xl font-bold'>
          {count}
        </Text>
      </View>
    </View>
  );
}; 