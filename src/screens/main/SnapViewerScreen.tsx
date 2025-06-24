import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Dimensions,
  Alert,
  SafeAreaView,
  Animated,
} from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSnapStore } from '../../store/snapStore';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { FirestoreService } from '../../services/firestore.service';
import { StorageService } from '../../services/storage.service';
import { MainStackParamList } from '../../navigation/types';
import { User } from '../../types';
import { UI_CONSTANTS } from '../../utils/constants';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

type SnapViewerScreenRouteProp = RouteProp<MainStackParamList, 'SnapViewer'>;

type SnapViewerScreenNavigationProp =
  NativeStackNavigationProp<MainStackParamList>;

interface SnapViewerScreenProps {}

export const SnapViewerScreen: React.FC<SnapViewerScreenProps> = () => {
  const navigation = useNavigation<SnapViewerScreenNavigationProp>();
  const route = useRoute<SnapViewerScreenRouteProp>();
  const { snap } = route.params;

  const { markSnapAsViewed } = useSnapStore();

  // State
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sender, setSender] = useState<User | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(
    UI_CONSTANTS.SNAP_VIEWER_DURATION / 1000,
  );
  const [isDeleting, setIsDeleting] = useState(false);

  // Animation refs
  const progressAnim = useRef(new Animated.Value(0)).current;
  const gestureRef = useRef(null);

  // Timer refs
  const viewTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  // Load sender information
  useEffect(() => {
    loadSenderInfo();
  }, [snap.senderId]);

  // Start viewing timer and mark as viewed
  useEffect(() => {
    if (sender && !isLoading) {
      startViewingTimer();
      markAsViewed();
    }

    return () => {
      // Cleanup timers
      if (viewTimerRef.current) {
        clearTimeout(viewTimerRef.current);
      }
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
    };
  }, [sender, isLoading]);

  const loadSenderInfo = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await FirestoreService.getUser(snap.senderId);

      if (response.success && response.data) {
        setSender(response.data);
      } else {
        setError(response.error || 'Failed to load sender information');
      }
    } catch (_error) {
      setError('Failed to load sender information');
    } finally {
      setIsLoading(false);
    }
  };

  const startViewingTimer = () => {
    // Start progress animation
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: UI_CONSTANTS.SNAP_VIEWER_DURATION,
      useNativeDriver: false,
    }).start();

    // Start countdown timer
    countdownRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          handleSnapComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Set main timer for auto-close
    viewTimerRef.current = setTimeout(() => {
      handleSnapComplete();
    }, UI_CONSTANTS.SNAP_VIEWER_DURATION);
  };

  const markAsViewed = async () => {
    if (!snap.viewed) {
      await markSnapAsViewed(snap.id);
    }
  };

  const handleSnapComplete = async () => {
    // Clear timers
    if (viewTimerRef.current) {
      clearTimeout(viewTimerRef.current);
      viewTimerRef.current = null;
    }
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }

    // Delete snap and navigate back
    await deleteSnapAndNavigateBack();
  };

  const deleteSnapAndNavigateBack = async () => {
    if (isDeleting) return;

    setIsDeleting(true);

    try {
      // Delete from Firestore
      const firestoreResponse = await FirestoreService.deleteSnap(snap.id);

      if (!firestoreResponse.success) {
        // console.warn(
        //   'Failed to delete snap from Firestore:',
        //   firestoreResponse.error,
        // );
      }

      // Delete from Storage (extract path from snap metadata if available)
      // For now, we'll attempt to delete using the standard path pattern
      const snapId = snap.id;
      const senderId = snap.senderId;

      try {
        await StorageService.deleteSnap(senderId, snapId);
      } catch (_storageError) {
        // Storage deletion failure is not critical - file may have been cleaned up already
        // console.warn('Storage deletion failed or file already removed');
      }
    } catch (_error) {
      // Even if deletion fails, we should still navigate back
      // console.warn('Snap deletion failed, but continuing with navigation');
    }

    // Navigate back regardless of deletion success/failure
    navigation.goBack();
  };

  const handleManualClose = () => {
    Alert.alert(
      'Close Snap',
      'Are you sure you want to close this snap? It will be deleted.',
      [
        { text: 'Keep Viewing', style: 'cancel' },
        {
          text: 'Close',
          style: 'destructive',
          onPress: handleSnapComplete,
        },
      ],
    );
  };

  const handleSwipeDown = ({ nativeEvent }: any) => {
    if (nativeEvent.state === State.END) {
      if (nativeEvent.translationY > 100) {
        // Swipe down to close
        handleSnapComplete();
      }
    }
  };

  const formatTimeRemaining = (seconds: number): string => {
    return `${Math.max(0, Math.ceil(seconds))}s`;
  };

  if (isLoading) {
    return (
      <SafeAreaView className='flex-1 bg-black'>
        <StatusBar style='light' />
        <LoadingSpinner size='large' text='Loading snap...' overlay={false} />
      </SafeAreaView>
    );
  }

  if (error || !sender) {
    return (
      <SafeAreaView className='flex-1 bg-black items-center justify-center'>
        <StatusBar style='light' />
        <View className='items-center p-8'>
          <Text className='text-white text-lg font-semibold mb-4'>
            {error || 'Failed to load snap'}
          </Text>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className='bg-snap-yellow px-6 py-3 rounded-full'
          >
            <Text className='text-black font-semibold'>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <PanGestureHandler ref={gestureRef} onHandlerStateChange={handleSwipeDown}>
      <View className='flex-1 bg-black'>
        <StatusBar style='light' />

        {/* Progress Bar */}
        <View className='absolute top-12 left-0 right-0 z-20 px-4'>
          <View className='bg-white/30 h-1 rounded-full overflow-hidden'>
            <Animated.View
              className='bg-white h-full'
              style={{
                width: progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
              }}
            />
          </View>
        </View>

        {/* Header */}
        <View className='absolute top-16 left-0 right-0 z-20 px-4'>
          <View className='flex-row items-center justify-between'>
            {/* Sender Info */}
            <View className='flex-row items-center flex-1'>
              <View className='w-8 h-8 rounded-full bg-snap-gray items-center justify-center mr-2'>
                {sender.avatarUrl ? (
                  <Image
                    source={{ uri: sender.avatarUrl }}
                    className='w-8 h-8 rounded-full'
                    resizeMode='cover'
                  />
                ) : (
                  <Text className='text-white font-bold text-sm'>
                    {sender.displayName.charAt(0).toUpperCase()}
                  </Text>
                )}
              </View>

              <View className='flex-1'>
                <Text className='text-white font-semibold text-sm'>
                  {sender.displayName}
                </Text>
                <Text className='text-white/70 text-xs'>
                  {new Date(snap.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
            </View>

            {/* Timer and Close */}
            <View className='flex-row items-center'>
              <View className='bg-black/50 px-2 py-1 rounded-full mr-2'>
                <Text className='text-white font-bold text-xs'>
                  {formatTimeRemaining(timeRemaining)}
                </Text>
              </View>

              <TouchableOpacity
                onPress={handleManualClose}
                className='bg-black/50 w-8 h-8 rounded-full items-center justify-center'
              >
                <Text className='text-white font-bold text-lg'>×</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Snap Image */}
        <View className='flex-1 items-center justify-center'>
          <Image
            source={{ uri: snap.imageUrl }}
            style={{
              width: screenWidth,
              height: screenHeight,
            }}
            resizeMode='contain'
            onError={() => {
              setError('Failed to load snap image');
            }}
          />
        </View>

        {/* Bottom Info */}
        <View className='absolute bottom-12 left-0 right-0 z-20 px-4'>
          <View className='bg-black/50 p-3 rounded-lg'>
            <Text className='text-white/70 text-xs text-center'>
              Swipe down to close • Snap will auto-delete after viewing
            </Text>
            {snap.viewed && snap.viewedAt && (
              <Text className='text-green-400 text-xs text-center mt-1'>
                ✓ Viewed at {new Date(snap.viewedAt).toLocaleTimeString()}
              </Text>
            )}
          </View>
        </View>

        {/* Deleting Overlay */}
        {isDeleting && (
          <View className='absolute inset-0 bg-black/80 items-center justify-center z-30'>
            <LoadingSpinner size='large' />
            <Text className='text-white mt-4 font-semibold'>
              Deleting snap...
            </Text>
          </View>
        )}
      </View>
    </PanGestureHandler>
  );
};
