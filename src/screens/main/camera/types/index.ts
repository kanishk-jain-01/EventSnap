import { CameraType } from 'expo-camera';
import { OptimizedImageResult } from '../../../../services/camera.service';

export interface CameraState {
  // Permission and loading states
  isLoading: boolean;
  isRequesting: boolean;
  error: string | null;
  cameraAvailable: boolean | null;

  // Camera states
  isCameraReady: boolean;
  isCapturing: boolean;
  cameraType: CameraType;
  flashMode: 'on' | 'off' | 'auto';
  capturedPhoto: string | null;

  // Enhanced camera controls
  zoom: number;
  showGrid: boolean;
  timerMode: 0 | 3 | 10;
  isTimerActive: boolean;
  timerCount: number;

  // Image picker states
  selectedImage: OptimizedImageResult | null;
  isPickingImage: boolean;
  imageSource: 'camera' | 'gallery' | null;

  // Image optimization states
  autoOptimize: boolean;
  showCompressionInfo: boolean;
  imageContext: 'story';

  // Text overlay states
  showTextOverlay: boolean;
  overlayText: string;
  textPosition: { x: number; y: number };
}

export interface CameraActions {
  // Permission actions
  checkInitialState: () => Promise<void>;
  requestPermissions: () => Promise<void>;
  refreshPermissions: () => Promise<void>;

  // Camera actions
  onCameraReady: () => void;
  takePicture: () => Promise<void>;
  toggleCameraType: () => void;
  toggleFlashMode: () => void;
  toggleGrid: () => void;
  toggleTimer: () => void;
  startTimerCapture: () => void;
  adjustZoom: (_direction: 'in' | 'out') => void;

  // Image picker actions
  pickImageFromGallery: () => Promise<void>;
  toggleOptimization: () => void;

  // Text overlay actions
  handleTextOverlayPress: () => void;
  handleTextOverlayConfirm: () => void;
  handleTextOverlayCancel: () => void;
  clearTextOverlay: () => void;
  updateTextPosition: (_position: { x: number; y: number }) => void;

  // Story posting
  handlePostStory: () => Promise<void>;

  // Navigation actions
  resetImage: () => void;
}

export interface TextPosition {
  x: number;
  y: number;
}

export interface CameraControlsProps {
  flashMode: 'on' | 'off' | 'auto';
  timerMode: 0 | 3 | 10;
  showGrid: boolean;
  zoom: number;
  autoOptimize: boolean;
  onToggleFlash: () => void;
  onToggleTimer: () => void;
  onToggleGrid: () => void;
  onToggleCamera: () => void;
  onAdjustZoom: (_direction: 'in' | 'out') => void;
  onToggleOptimization: () => void;
}

export interface ImagePreviewProps {
  imageUri: string;
  selectedImage: OptimizedImageResult;
  imageSource: 'camera' | 'gallery';
  overlayText: string;
  textPosition: TextPosition;
  isPostingStory: boolean;
  postingProgress: number;
  onBack: () => void;
  onAddText: () => void;
  onClearText: () => void;
  onPostStory: () => Promise<void>;
  onUpdateTextPosition: (_position: { x: number; y: number }) => void;
}

export interface PermissionScreenProps {
  cameraAvailable: boolean | null;
  isRequesting: boolean;
  isPickingImage: boolean;
  isLoading: boolean;
  error: string | null;
  onRequestPermissions: () => Promise<void>;
  onPickFromGallery: () => Promise<void>;
  onRefreshStatus: () => Promise<void>;
}

export interface TextOverlayModalProps {
  visible: boolean;
  text: string;
  onTextChange: (_text: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
} 