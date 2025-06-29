import React from 'react';
import { View, Dimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { CameraView as ExpoCameraView, CameraType } from 'expo-camera';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors } from '../../../../components/ui/ThemeProvider';
import {
  TopControlsBar,
  BottomControls,
  StatusBar as CameraStatusBar,
  SideZoomControls,
  GridOverlay,
  TimerCountdown,
} from './CameraControls';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface CameraViewProps {
  cameraRef: React.RefObject<ExpoCameraView | null>;
  cameraType: CameraType;
  flashMode: 'on' | 'off' | 'auto';
  zoom: number;
  showGrid: boolean;
  timerMode: 0 | 3 | 10;
  isTimerActive: boolean;
  timerCount: number;
  isCameraReady: boolean;
  isCapturing: boolean;
  isPickingImage: boolean;
  capturedPhoto: string | null;
  autoOptimize: boolean;
  onCameraReady: () => void;
  onToggleFlash: () => void;
  onToggleTimer: () => void;
  onToggleGrid: () => void;
  onToggleCamera: () => void;
  onAdjustZoom: (_direction: 'in' | 'out') => void;
  onToggleOptimization: () => void;
  onCapture: () => void;
  onPickFromGallery: () => void;
}

export const CameraView: React.FC<CameraViewProps> = ({
  cameraRef,
  cameraType,
  flashMode,
  zoom,
  showGrid,
  timerMode,
  isTimerActive,
  timerCount,
  isCameraReady,
  isCapturing,
  isPickingImage,
  capturedPhoto,
  autoOptimize,
  onCameraReady,
  onToggleFlash,
  onToggleTimer,
  onToggleGrid,
  onToggleCamera,
  onAdjustZoom,
  onToggleOptimization,
  onCapture,
  onPickFromGallery,
}) => {
  const _colors = useThemeColors();
  const insets = useSafeAreaInsets();

  return (
    <View className='flex-1 bg-bg-primary'>
      <StatusBar style='dark' />

      {/* Camera View - No children inside */}
      <View className='flex-1 relative'>
        <ExpoCameraView
          ref={cameraRef}
          style={{
            width: screenWidth,
            height: screenHeight,
          }}
          facing={cameraType}
          flash={flashMode}
          zoom={zoom}
          onCameraReady={onCameraReady}
        />

        {/* All UI overlays are now outside the CameraView */}
        
        {/* Grid Lines Overlay */}
        <GridOverlay visible={showGrid} />

        {/* Timer Countdown Overlay */}
        <TimerCountdown visible={isTimerActive} count={timerCount} />

        {/* Top Controls Bar */}
        <View className='absolute top-0 left-0 right-0' style={{ paddingTop: insets.top }}>
          <TopControlsBar
            flashMode={flashMode}
            timerMode={timerMode}
            showGrid={showGrid}
            onToggleFlash={onToggleFlash}
            onToggleTimer={onToggleTimer}
            onToggleGrid={onToggleGrid}
            onToggleCamera={onToggleCamera}
          />
        </View>

        {/* Side Zoom Controls */}
        <SideZoomControls
          zoom={zoom}
          onAdjustZoom={onAdjustZoom}
        />

        {/* Bottom Controls */}
        <BottomControls
          isCameraReady={isCameraReady}
          isCapturing={isCapturing}
          isTimerActive={isTimerActive}
          isPickingImage={isPickingImage}
          _capturedPhoto={capturedPhoto}
          _timerCount={timerCount}
          autoOptimize={autoOptimize}
          onCapture={onCapture}
          onPickFromGallery={onPickFromGallery}
          onToggleOptimization={onToggleOptimization}
          bottomInset={insets.bottom}
        />

        {/* Status and Info Bar - Only show when photo is captured or timer is active */}
        {(capturedPhoto || isTimerActive) && (
          <View 
            className='absolute bottom-0 left-0 right-0 px-4'
            style={{ paddingBottom: insets.bottom + 140 }}
          >
            <CameraStatusBar
              isCameraReady={isCameraReady}
              isTimerActive={isTimerActive}
              timerCount={timerCount}
              capturedPhoto={capturedPhoto}
              cameraType={cameraType}
              zoom={zoom}
              showGrid={showGrid}
              timerMode={timerMode}
              autoOptimize={autoOptimize}
            />
          </View>
        )}
      </View>
    </View>
  );
}; 