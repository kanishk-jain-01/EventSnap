import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuthStore } from '../../store/authStore';
import { useStoryStore } from '../../store/storyStore';
import { useEventStore } from '../../store/eventStore';
import { useUserStore } from '../../store/userStore';
import { Story, User } from '../../types';
import { StoryRing } from '../../components/social/StoryRing';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { useThemeColors } from '../../components/ui/ThemeProvider';
import { MainStackParamList } from '../../navigation/types';
import { FirestoreService } from '../../services/firestore.service';

type EventFeedScreenNavigationProp =
  NativeStackNavigationProp<MainStackParamList>;

export const EventFeedScreen: React.FC = () => {
  const navigation = useNavigation<EventFeedScreenNavigationProp>();
  const colors = useThemeColors();
  const { user } = useAuthStore();
  const { activeEvent, role } = useEventStore();
  const {
    stories,
    isLoading: storiesLoading,
    error: storiesError,
    loadStoriesForEvent,
    subscribeToStoriesForEvent,
    clearError: clearStoriesError,
  } = useStoryStore();

  const { fetchContacts } = useUserStore();

  const [refreshing, setRefreshing] = useState(false);
  const [storyOwners, setStoryOwners] = useState<Map<string, User>>(new Map());

  // Content is already filtered by event from the store
  const eventStories = stories;

  // Load event-scoped content on focus
  useFocusEffect(
    useCallback(() => {
      if (user && activeEvent) {
        loadStoriesForEvent(activeEvent.id);
        fetchContacts();

        // Set up real-time subscriptions
        const unsubscribeStories = subscribeToStoriesForEvent(activeEvent.id);

        return () => {
          unsubscribeStories();
        };
      }
    }, [user, activeEvent]),
  );

  // Load story owner information for event stories
  useEffect(() => {
    loadStoryOwnerInfo();
  }, [eventStories]);

  const loadStoryOwnerInfo = async () => {
    if (eventStories.length === 0) return;

    const ownerIds = [...new Set(eventStories.map(story => story.userId))];
    const ownerMap = new Map<string, User>();

    try {
      const ownerPromises = ownerIds.map(id => FirestoreService.getUser(id));
      const results = await Promise.all(ownerPromises);

      results.forEach((result, index) => {
        if (result.success && result.data) {
          ownerMap.set(ownerIds[index], result.data);
        }
      });

      setStoryOwners(ownerMap);
    } catch (_error) {
      // Silently fail - story owner info is not critical for the UI to function
    }
  };

  const handleRefresh = async () => {
    if (!user || !activeEvent) return;

    setRefreshing(true);
    try {
      await Promise.all([
        loadStoriesForEvent(activeEvent.id),
        fetchContacts(),
      ]);
    } catch (_error) {
      // Refresh errors will be handled by individual store error states
    } finally {
      setRefreshing(false);
    }
  };

  const handleStoryPress = (story: Story, index: number) => {
    navigation.navigate('StoryViewer', {
      stories: eventStories,
      initialIndex: index,
    });
  };

  // No active event state
  if (!activeEvent) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bgPrimary }}>
        <StatusBar style='dark' />
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            padding: 24,
          }}
        >
          <Text
            style={{
              color: colors.textPrimary,
              fontSize: 18,
              fontWeight: '600',
              marginBottom: 8,
            }}
          >
            No Active Event
          </Text>
          <Text
            style={{
              color: colors.textSecondary,
              fontSize: 16,
              textAlign: 'center',
            }}
          >
            Join or create an event to see the event feed
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Loading state
  if (storiesLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bgPrimary }}>
        <StatusBar style='dark' />
        <View
          style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
        >
          <LoadingSpinner
            size='large'
            color={colors.primary}
            text='Loading event feed...'
          />
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (storiesError) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bgPrimary }}>
        <StatusBar style='dark' />
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            padding: 24,
          }}
        >
          <Text
            style={{
              color: colors.error,
              fontSize: 18,
              fontWeight: '600',
              marginBottom: 16,
              textAlign: 'center',
            }}
          >
            Failed to Load Event Feed
          </Text>
          <Text
            style={{
              color: colors.textSecondary,
              fontSize: 16,
              textAlign: 'center',
              marginBottom: 24,
            }}
          >
            {storiesError}
          </Text>
          <TouchableOpacity
            onPress={() => {
              clearStoriesError();
              handleRefresh();
            }}
            style={{
              backgroundColor: colors.primary,
              paddingHorizontal: 24,
              paddingVertical: 12,
              borderRadius: 8,
            }}
          >
            <Text
              style={{
                color: colors.textInverse,
                fontSize: 16,
                fontWeight: '600',
              }}
            >
              Try Again
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const renderStoriesHeader = () => (
    <View style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
      <Text
        style={{
          color: colors.textPrimary,
          fontSize: 20,
          fontWeight: 'bold',
          marginBottom: 16,
        }}
      >
        📖 Stories
      </Text>

      {eventStories.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingRight: 16 }}
        >
          {eventStories.map((story, index) => {
            const owner = storyOwners.get(story.userId);
            return (
              <TouchableOpacity
                key={story.id}
                onPress={() => handleStoryPress(story, index)}
                style={{ marginRight: 12 }}
              >
                <StoryRing
                  user={owner || { 
                    uid: story.userId, 
                    displayName: 'Unknown',
                    email: '',
                    createdAt: new Date(),
                  }}
                  hasUnviewed={!story.viewedBy.includes(user?.uid || '')}
                  size={80}
                />
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      ) : (
        <View
          style={{
            backgroundColor: colors.surface,
            padding: 20,
            borderRadius: 12,
            alignItems: 'center',
          }}
        >
          <Text style={{ fontSize: 48, marginBottom: 8 }}>📖</Text>
          <Text
            style={{
              color: colors.textPrimary,
              fontSize: 16,
              fontWeight: '600',
              marginBottom: 4,
            }}
          >
            No Stories Yet
          </Text>
          <Text
            style={{
              color: colors.textSecondary,
              fontSize: 14,
              textAlign: 'center',
            }}
          >
            Stories from event participants will appear here
          </Text>
        </View>
      )}
    </View>
  );

  const renderChatPrompt = () => (
    <View style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
      <Text
        style={{
          color: colors.textPrimary,
          fontSize: 20,
          fontWeight: 'bold',
          marginBottom: 16,
        }}
      >
        💬 Chat
      </Text>

      <TouchableOpacity
        onPress={() => navigation.navigate('MainTabs', { screen: 'Chat' })}
        style={{
          backgroundColor: colors.surface,
          padding: 20,
          borderRadius: 12,
          flexDirection: 'row',
          alignItems: 'center',
          shadowColor: colors.shadow,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
          elevation: 2,
        }}
      >
        <View
          style={{
            width: 48,
            height: 48,
            backgroundColor: colors.primary,
            borderRadius: 24,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 16,
          }}
        >
          <Text style={{ fontSize: 24 }}>💬</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text
            style={{
              color: colors.textPrimary,
              fontSize: 16,
              fontWeight: '600',
              marginBottom: 4,
            }}
          >
            Start Chatting
          </Text>
          <Text
            style={{
              color: colors.textSecondary,
              fontSize: 14,
            }}
          >
            Connect with other event participants
          </Text>
        </View>
        <Text style={{ color: colors.textTertiary, fontSize: 16 }}>→</Text>
      </TouchableOpacity>
    </View>
  );

  const renderCameraPrompt = () => (
    <View style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
      <Text
        style={{
          color: colors.textPrimary,
          fontSize: 20,
          fontWeight: 'bold',
          marginBottom: 16,
        }}
      >
        📸 Camera
      </Text>

      <TouchableOpacity
        onPress={() => navigation.navigate('MainTabs', { screen: 'Camera' })}
        style={{
          backgroundColor: colors.surface,
          padding: 20,
          borderRadius: 12,
          flexDirection: 'row',
          alignItems: 'center',
          shadowColor: colors.shadow,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
          elevation: 2,
        }}
      >
        <View
          style={{
            width: 48,
            height: 48,
            backgroundColor: colors.accent,
            borderRadius: 24,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 16,
          }}
        >
          <Text style={{ fontSize: 24 }}>📸</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text
            style={{
              color: colors.textPrimary,
              fontSize: 16,
              fontWeight: '600',
              marginBottom: 4,
            }}
          >
            {role === 'host' ? 'Take Photos & Share Stories' : 'View Only Mode'}
          </Text>
          <Text
            style={{
              color: colors.textSecondary,
              fontSize: 14,
            }}
          >
            {role === 'host' ? 'Capture and share moments with the event' : 'Camera access is limited to event hosts'}
          </Text>
        </View>
        <Text style={{ color: colors.textTertiary, fontSize: 16 }}>→</Text>
      </TouchableOpacity>
    </View>
  );

  // Main render
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bgPrimary }}>
      <StatusBar style='dark' />

      {/* Header */}
      <View
        style={{
          paddingHorizontal: 16,
          paddingTop: 12,
          paddingBottom: 8,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          backgroundColor: colors.surface,
        }}
      >
        <Text
          style={{
            color: colors.textPrimary,
            fontSize: 24,
            fontWeight: 'bold',
            textAlign: 'center',
          }}
        >
          {activeEvent.name}
        </Text>
        <Text
          style={{
            color: colors.textSecondary,
            fontSize: 14,
            textAlign: 'center',
            marginTop: 4,
          }}
        >
          {role === 'host' ? '👑 Host' : '👤 Guest'} • Event Feed
        </Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {renderStoriesHeader()}
        {renderChatPrompt()}
        {role === 'host' && renderCameraPrompt()}
      </ScrollView>
    </SafeAreaView>
  );
};
