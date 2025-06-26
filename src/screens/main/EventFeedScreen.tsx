import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSnapStore } from '../../store/snapStore';
import { useAuthStore } from '../../store/authStore';
import { useStoryStore } from '../../store/storyStore';
import { useEventStore } from '../../store/eventStore';
import { useUserStore } from '../../store/userStore';
import { Story, Snap, User } from '../../types';
import { StoryRing } from '../../components/social/StoryRing';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { useThemeColors } from '../../components/ui/ThemeProvider';
import { MainStackParamList } from '../../navigation/types';
import { FirestoreService } from '../../services/firestore.service';

type EventFeedScreenNavigationProp =
  NativeStackNavigationProp<MainStackParamList>;

interface SnapItemProps {
  snap: Snap;
  sender: User | null;
  onPress: () => void;
}

const SnapItem: React.FC<SnapItemProps> = ({ snap, sender, onPress }) => {
  const colors = useThemeColors();
  const isExpired = new Date() > new Date(snap.expiresAt);
  const timeRemaining = Math.max(
    0,
    new Date(snap.expiresAt).getTime() - Date.now(),
  );
  const hoursRemaining = Math.floor(timeRemaining / (1000 * 60 * 60));
  const minutesRemaining = Math.floor(
    (timeRemaining % (1000 * 60 * 60)) / (1000 * 60),
  );

  const formatTimeRemaining = () => {
    if (isExpired) return 'Expired';
    if (hoursRemaining > 0) return `${hoursRemaining}h ${minutesRemaining}m`;
    if (minutesRemaining > 0) return `${minutesRemaining}m`;
    return 'Less than 1m';
  };

  if (isExpired) {
    return null; // Don't render expired snaps
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        backgroundColor: colors.surface,
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        opacity: snap.viewed ? 0.6 : 1,
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 2,
      }}
      activeOpacity={0.7}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Sender Info */}
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: colors.bgSecondary,
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 12,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            {sender?.avatarUrl ? (
              <Image
                source={{ uri: sender.avatarUrl }}
                style={{ width: 48, height: 48, borderRadius: 24 }}
                resizeMode='cover'
              />
            ) : (
              <Text
                style={{
                  color: colors.primary,
                  fontWeight: 'bold',
                  fontSize: 18,
                }}
              >
                {sender?.displayName.charAt(0).toUpperCase() || '?'}
              </Text>
            )}
          </View>

          <View style={{ flex: 1 }}>
            <Text
              style={{
                color: colors.textPrimary,
                fontWeight: '600',
                fontSize: 16,
              }}
            >
              {sender?.displayName || 'Unknown User'}
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: 14 }}>
              {new Date(snap.timestamp).toLocaleDateString()} at{' '}
              {new Date(snap.timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>
        </View>

        {/* Status and Time */}
        <View style={{ alignItems: 'flex-end' }}>
          <View
            style={{
              paddingHorizontal: 12,
              paddingVertical: 4,
              borderRadius: 20,
              marginBottom: 4,
              backgroundColor: snap.viewed
                ? colors.bgSecondary
                : colors.primary,
            }}
          >
            <Text
              style={{
                fontSize: 12,
                fontWeight: '600',
                color: snap.viewed ? colors.textSecondary : colors.textInverse,
              }}
            >
              {snap.viewed ? '👁️ Viewed' : '📸 New'}
            </Text>
          </View>

          <Text style={{ color: colors.textTertiary, fontSize: 12 }}>
            Expires in {formatTimeRemaining()}
          </Text>
        </View>
      </View>

      {/* Preview indicator */}
      <View
        style={{ marginTop: 12, flexDirection: 'row', alignItems: 'center' }}
      >
        <View
          style={{
            width: 32,
            height: 32,
            backgroundColor: colors.bgSecondary,
            borderRadius: 16,
            marginRight: 8,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ fontSize: 12 }}>📸</Text>
        </View>
        <Text style={{ color: colors.textSecondary, fontSize: 14, flex: 1 }}>
          Tap to view snap •{' '}
          {snap.viewed
            ? 'Will be deleted after viewing again'
            : 'Will be deleted after viewing'}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

export const EventFeedScreen: React.FC = () => {
  const navigation = useNavigation<EventFeedScreenNavigationProp>();
  const colors = useThemeColors();
  const { user } = useAuthStore();
  const { activeEvent, role } = useEventStore();
  const {
    receivedSnaps,
    isLoading: snapsLoading,
    error: snapsError,
    loadReceivedSnapsForEvent,
    subscribeToReceivedSnapsForEvent,
    clearError: clearSnapsError,
  } = useSnapStore();

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
  const [senders, setSenders] = useState<Map<string, User>>(new Map());
  const [storyOwners, setStoryOwners] = useState<Map<string, User>>(new Map());

  // Content is already filtered by event from the store
  const eventSnaps = receivedSnaps;
  const eventStories = stories;

  // Load event-scoped content on focus
  useFocusEffect(
    useCallback(() => {
      if (user && activeEvent) {
        loadReceivedSnapsForEvent(user.uid, activeEvent.id);
        loadStoriesForEvent(activeEvent.id);
        fetchContacts();

        // Set up real-time subscriptions
        const unsubscribeSnaps = subscribeToReceivedSnapsForEvent(
          user.uid,
          activeEvent.id,
        );
        const unsubscribeStories = subscribeToStoriesForEvent(activeEvent.id);

        return () => {
          unsubscribeSnaps();
          unsubscribeStories();
        };
      }
    }, [user, activeEvent]),
  );

  // Load sender information for event snaps
  useEffect(() => {
    loadSenderInfo();
  }, [eventSnaps]);

  // Load story owner information for event stories
  useEffect(() => {
    loadStoryOwnerInfo();
  }, [eventStories]);

  const loadSenderInfo = async () => {
    if (eventSnaps.length === 0) return;

    const senderIds = [...new Set(eventSnaps.map(snap => snap.senderId))];
    const senderMap = new Map<string, User>();

    try {
      const senderPromises = senderIds.map(id => FirestoreService.getUser(id));
      const results = await Promise.all(senderPromises);

      results.forEach((result, index) => {
        if (result.success && result.data) {
          senderMap.set(senderIds[index], result.data);
        }
      });

      setSenders(senderMap);
    } catch (_error) {
      // Silently fail - sender info is not critical for the UI to function
    }
  };

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
        loadReceivedSnapsForEvent(user.uid, activeEvent.id),
        loadStoriesForEvent(activeEvent.id),
        fetchContacts(),
      ]);
    } catch (_error) {
      // Refresh errors will be handled by individual store error states
    } finally {
      setRefreshing(false);
    }
  };

  const handleSnapPress = (snap: Snap) => {
    navigation.navigate('SnapViewer', { snap });
  };

  const handleStoryPress = (story: Story, index: number) => {
    navigation.navigate('StoryViewer', {
      stories: eventStories,
      initialIndex: index,
    });
  };

  const renderSnapItem = ({ item }: { item: Snap }) => (
    <SnapItem
      snap={item}
      sender={senders.get(item.senderId) || null}
      onPress={() => handleSnapPress(item)}
    />
  );

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
  if (snapsLoading || storiesLoading) {
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
  if (snapsError || storiesError) {
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
              marginBottom: 8,
            }}
          >
            Something went wrong
          </Text>
          <Text
            style={{
              color: colors.textSecondary,
              fontSize: 16,
              textAlign: 'center',
              marginBottom: 16,
            }}
          >
            {snapsError || storiesError}
          </Text>
          <TouchableOpacity
            onPress={() => {
              clearSnapsError();
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
            <Text style={{ color: colors.textInverse, fontWeight: '600' }}>
              Retry
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Stories header component
  const renderStoriesHeader = () => (
    <View style={{ marginBottom: 24 }}>
      <Text
        style={{
          color: colors.textPrimary,
          fontSize: 18,
          fontWeight: '600',
          marginBottom: 16,
          paddingHorizontal: 16,
        }}
      >
        Event Stories
      </Text>

      {eventStories.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 8 }}
        >
          {eventStories.map((story, index) => {
            const owner = storyOwners.get(story.userId);
            if (!owner) return null;

            const hasUnviewed = !story.viewedBy.includes(user?.uid || '');
            const isCurrentUser = story.userId === user?.uid;

            return (
              <StoryRing
                key={story.id}
                user={owner}
                hasUnviewed={hasUnviewed}
                isCurrentUser={isCurrentUser}
                onPress={() => handleStoryPress(story, index)}
              />
            );
          })}
        </ScrollView>
      ) : (
        <View
          style={{
            alignItems: 'center',
            paddingVertical: 32,
            backgroundColor: colors.surface,
            marginHorizontal: 16,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: colors.border,
            borderStyle: 'dashed',
          }}
        >
          <Text
            style={{
              color: colors.textSecondary,
              fontSize: 16,
              marginBottom: 4,
            }}
          >
            No stories yet
          </Text>
          <Text
            style={{
              color: colors.textTertiary,
              fontSize: 14,
              textAlign: 'center',
            }}
          >
            {role === 'host'
              ? 'Share the first story for this event!'
              : 'Stories from event participants will appear here'}
          </Text>
        </View>
      )}
    </View>
  );

  // Empty state for snaps
  const renderEmptySnaps = () => (
    <View
      style={{
        alignItems: 'center',
        paddingVertical: 32,
        backgroundColor: colors.surface,
        marginHorizontal: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.border,
        borderStyle: 'dashed',
      }}
    >
      <Text
        style={{ color: colors.textSecondary, fontSize: 16, marginBottom: 4 }}
      >
        No snaps yet
      </Text>
      <Text
        style={{
          color: colors.textTertiary,
          fontSize: 14,
          textAlign: 'center',
        }}
      >
        {role === 'host'
          ? 'Send the first snap to event participants!'
          : 'Snaps from other participants will appear here'}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bgPrimary }}>
      <StatusBar style='dark' />

      {/* Header */}
      <View
        style={{
          paddingHorizontal: 16,
          paddingVertical: 12,
          backgroundColor: colors.surface,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        <Text
          style={{
            color: colors.textPrimary,
            fontSize: 20,
            fontWeight: '700',
            marginBottom: 4,
          }}
        >
          {activeEvent.name}
        </Text>
        <Text style={{ color: colors.textSecondary, fontSize: 14 }}>
          {role === 'host' ? 'Event Host' : 'Event Participant'} •{' '}
          {eventSnaps.length} snaps, {eventStories.length} stories
        </Text>
      </View>

      {/* Role-based Permissions Banner for Task 5.5 */}
      {role && (
        <View
          style={{
            backgroundColor:
              role === 'host' ? colors.primary + '10' : colors.accent + '10',
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
            paddingHorizontal: 16,
            paddingVertical: 8,
          }}
        >
          <Text
            style={{
              color: role === 'host' ? colors.primary : colors.accent,
              fontSize: 12,
              fontWeight: '600',
              textAlign: 'center',
            }}
          >
            {role === 'host'
              ? '👑 Host: You can post stories and send snaps to all participants'
              : '👥 Guest: You can post stories and view content from other participants'}
          </Text>
        </View>
      )}

      <FlatList
        data={eventSnaps}
        renderItem={renderSnapItem}
        keyExtractor={item => item.id}
        contentContainerStyle={{ paddingTop: 16 }}
        ListHeaderComponent={renderStoriesHeader}
        ListEmptyComponent={eventSnaps.length === 0 ? renderEmptySnaps : null}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};
