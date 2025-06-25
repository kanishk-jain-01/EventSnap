import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Image,
  Dimensions,
  TouchableOpacity,
  SafeAreaView,
  Animated,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { MainStackParamList } from '../../navigation/types';
import { Story } from '../../types';
import { UI_CONSTANTS } from '../../utils/constants';
import { useAuthStore } from '../../store/authStore';
import { useStoryStore } from '../../store/storyStore';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Navigation types
type StoryViewerRouteProp = RouteProp<MainStackParamList, 'StoryViewer'>;

type StoryViewerNavProp = NativeStackNavigationProp<MainStackParamList>;

export const StoryViewerScreen: React.FC = () => {
  const navigation = useNavigation<StoryViewerNavProp>();
  const route = useRoute<StoryViewerRouteProp>();
  const { stories, initialIndex } = route.params;

  // Local state
  const [currentIndex, setCurrentIndex] = useState<number>(initialIndex);

  // Auth user & store action for view tracking
  const { user } = useAuthStore();
  const markViewedAction = useStoryStore(s => s.markStoryViewed);

  // Animation & timer refs
  const progressAnim = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const gestureRef = useRef(null);

  const currentStory: Story = stories[currentIndex];

  /**
   * Start or restart the progress animation & auto-advance timer
   */
  const startTimer = () => {
    // Clear any previous timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    // Reset animation
    progressAnim.setValue(0);
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: UI_CONSTANTS.STORY_VIEWER_DURATION, // 5s
      useNativeDriver: false,
    }).start();

    // Set timer to advance story
    timerRef.current = setTimeout(handleNextStory, UI_CONSTANTS.STORY_VIEWER_DURATION);
  };

  /**
   * Mark the story as viewed in Firestore when first displayed
   */
  const markViewed = async (story: Story) => {
    if (!user) return;
    await markViewedAction(story.id);
  };

  /**
   * Advance to next story or close viewer
   */
  const handleNextStory = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      navigation.goBack();
    }
  };

  /**
   * Go to previous story or do nothing if first
   */
  const handlePrevStory = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  /**
   * Handle tap zones
   */
  const handleTapLeft = () => {
    handlePrevStory();
  };
  const handleTapRight = () => {
    handleNextStory();
  };

  /**
   * Handle swipe-down to close
   */
  const handleSwipeDown = ({ nativeEvent }: any) => {
    if (nativeEvent.state === State.END && nativeEvent.translationY > 100) {
      navigation.goBack();
    }
  };

  // Start timer & mark viewed when index/story changes
  useEffect(() => {
    startTimer();
    markViewed(currentStory);

    // Clean up timer on unmount or index change
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [currentIndex]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <PanGestureHandler ref={gestureRef} onHandlerStateChange={handleSwipeDown}>
      <View className='flex-1 bg-black'>
        {/* Progress bar */}
        <SafeAreaView>
          <View className='absolute top-3 left-4 right-4 h-1 bg-white/30 rounded-full overflow-hidden'>
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
        </SafeAreaView>

        {/* Story image */}
        <Image
          source={{ uri: currentStory.imageUrl }}
          style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT }}
          resizeMode='cover'
        />

        {/* Tap zones */}
        <TouchableOpacity
          style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: SCREEN_WIDTH * 0.4 }}
          activeOpacity={1}
          onPress={handleTapLeft}
        />
        <TouchableOpacity
          style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: SCREEN_WIDTH * 0.6 }}
          activeOpacity={1}
          onPress={handleTapRight}
        />

        {/* Optional user/debug info */}
        {/* <Text style={{position:'absolute', bottom: 40, alignSelf:'center', color:'#fff'}}>{`${currentIndex+1}/${stories.length}`}</Text> */}
      </View>
    </PanGestureHandler>
  );
}; 