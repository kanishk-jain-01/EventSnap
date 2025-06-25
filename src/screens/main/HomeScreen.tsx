import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
  SafeAreaView,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSnapStore } from '../../store/snapStore';
import { useAuthStore } from '../../store/authStore';
import { useStoryStore } from '../../store/storyStore';
import { Story } from '../../types';
import { StoryRing } from '../../components/social/StoryRing';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { MainStackParamList } from '../../navigation/types';
import { Snap, User } from '../../types';
import { FirestoreService } from '../../services/firestore.service';

type HomeScreenNavigationProp = NativeStackNavigationProp<MainStackParamList>;

interface SnapItemProps {
  snap: Snap;
  sender: User | null;
  onPress: () => void;
}

const SnapItem: React.FC<SnapItemProps> = ({ snap, sender, onPress }) => {
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
      className={`bg-snap-gray rounded-lg p-4 mb-3 ${snap.viewed ? 'opacity-60' : ''}`}
      activeOpacity={0.7}
    >
      <View className='flex-row items-center justify-between'>
        {/* Sender Info */}
        <View className='flex-row items-center flex-1'>
          <View className='w-12 h-12 rounded-full bg-snap-dark items-center justify-center mr-3'>
            {sender?.avatarUrl ? (
              <Image
                source={{ uri: sender.avatarUrl }}
                className='w-12 h-12 rounded-full'
                resizeMode='cover'
              />
            ) : (
              <Text className='text-snap-yellow font-bold text-lg'>
                {sender?.displayName.charAt(0).toUpperCase() || '?'}
              </Text>
            )}
          </View>

          <View className='flex-1'>
            <Text className='text-white font-semibold text-base'>
              {sender?.displayName || 'Unknown User'}
            </Text>
            <Text className='text-white/70 text-sm'>
              {new Date(snap.timestamp).toLocaleDateString()} at{' '}
              {new Date(snap.timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>
        </View>

        {/* Status and Time */}
        <View className='items-end'>
          <View
            className={`px-3 py-1 rounded-full mb-1 ${
              snap.viewed ? 'bg-gray-600' : 'bg-snap-yellow'
            }`}
          >
            <Text
              className={`text-xs font-semibold ${
                snap.viewed ? 'text-white' : 'text-black'
              }`}
            >
              {snap.viewed ? '👁️ Viewed' : '📸 New'}
            </Text>
          </View>

          <Text className='text-white/50 text-xs'>
            Expires in {formatTimeRemaining()}
          </Text>
        </View>
      </View>

      {/* Preview indicator */}
      <View className='mt-3 flex-row items-center'>
        <View className='w-8 h-8 bg-snap-dark rounded mr-2 items-center justify-center'>
          <Text className='text-snap-yellow text-xs'>📸</Text>
        </View>
        <Text className='text-white/70 text-sm'>
          Tap to view snap •{' '}
          {snap.viewed
            ? 'Will be deleted after viewing again'
            : 'Will be deleted after viewing'}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { user, logout } = useAuthStore();
  const {
    receivedSnaps,
    isLoading,
    error,
    loadReceivedSnaps,
    subscribeToReceivedSnaps,
    clearError,
  } = useSnapStore();

  const {
    stories,
    loadStories,
    subscribeToStories,
  } = useStoryStore();

  const [refreshing, setRefreshing] = useState(false);
  const [senders, setSenders] = useState<Map<string, User>>(new Map());
  const [loadingSenders, setLoadingSenders] = useState(false);
  const [storyOwners, setStoryOwners] = useState<Map<string, User>>(new Map());

  // Load snaps on focus
  useFocusEffect(
    useCallback(() => {
      if (user) {
        loadReceivedSnaps(user.uid);

        // Set up real-time subscription
        const unsubscribe = subscribeToReceivedSnaps(user.uid);

        return () => {
          unsubscribe();
        };
      }
    }, [user]),
  );

  // Load sender information for all snaps
  useEffect(() => {
    loadSenderInfo();
  }, [receivedSnaps]);

  // Subscribe to stories on focus
  useFocusEffect(
    useCallback(() => {
      if (user) {
        // initial load
        loadStories();
        const unsub = subscribeToStories();
        return () => unsub();
      }
    }, [user]),
  );

  // Load story owner information
  useEffect(() => {
    loadStoryOwnerInfo();
  }, [stories]);

  const loadSenderInfo = async () => {
    if (receivedSnaps.length === 0) return;

    setLoadingSenders(true);
    const newSenders = new Map(senders);

    // Get unique sender IDs that we don't already have
    const senderIds = [...new Set(receivedSnaps.map(snap => snap.senderId))];
    const unknownSenderIds = senderIds.filter(id => !newSenders.has(id));

    try {
      // Load sender info in parallel
      const senderPromises = unknownSenderIds.map(async senderId => {
        try {
          const response = await FirestoreService.getUser(senderId);
          if (response.success && response.data) {
            return { id: senderId, user: response.data };
          }
        } catch (_error) {
          // Ignore individual failures
        }
        return null;
      });

      const results = await Promise.all(senderPromises);

      results.forEach(result => {
        if (result) {
          newSenders.set(result.id, result.user);
        }
      });

      setSenders(newSenders);
    } catch (_error) {
      // Silent fail - UI will show "Unknown User"
    } finally {
      setLoadingSenders(false);
    }
  };

  const loadStoryOwnerInfo = async () => {
    if (stories.length === 0) return;

    const newMap = new Map(storyOwners);
    const ownerIds = [...new Set(stories.map(s => s.userId))];
    const unknown = ownerIds.filter(id => !newMap.has(id));

    const promises = unknown.map(async id => {
      try {
        const res = await FirestoreService.getUser(id);
        if (res.success && res.data) return { id, user: res.data };
      } catch (_err) {
        // Ignore failure for individual user fetch
        return null;
      }
    });

    const results = await Promise.all(promises);
    results.forEach(r => {
      if (r) newMap.set(r.id, r.user);
    });
    setStoryOwners(newMap);
  };

  const handleRefresh = async () => {
    if (!user) return;

    setRefreshing(true);
    clearError();

    try {
      await loadReceivedSnaps(user.uid);
      await loadStories();
    } finally {
      setRefreshing(false);
    }
  };

  const handleSnapPress = (snap: Snap) => {
    navigation.navigate('SnapViewer', { snap });
  };

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await logout();
        },
      },
    ]);
  };

  const renderSnapItem = ({ item }: { item: Snap }) => (
    <SnapItem
      snap={item}
      sender={senders.get(item.senderId) || null}
      onPress={() => handleSnapPress(item)}
    />
  );

  const renderEmptyState = () => (
    <View className='flex-1 items-center justify-center p-8'>
      <Text className='text-6xl mb-4'>👻</Text>
      <Text className='text-white text-xl font-semibold mb-2 text-center'>
        No snaps yet!
      </Text>
      <Text className='text-white/70 text-base text-center mb-6'>
        When friends send you snaps, they'll appear here. Snaps disappear after
        24 hours!
      </Text>
      <TouchableOpacity
        onPress={handleRefresh}
        className='bg-snap-yellow px-6 py-3 rounded-full'
      >
        <Text className='text-black font-semibold'>Refresh</Text>
      </TouchableOpacity>
    </View>
  );

  const renderErrorState = () => (
    <View className='flex-1 items-center justify-center p-8'>
      <Text className='text-4xl mb-4'>⚠️</Text>
      <Text className='text-white text-lg font-semibold mb-2 text-center'>
        Something went wrong
      </Text>
      <Text className='text-white/70 text-base text-center mb-6'>{error}</Text>
      <TouchableOpacity
        onPress={handleRefresh}
        className='bg-snap-yellow px-6 py-3 rounded-full'
      >
        <Text className='text-black font-semibold'>Try Again</Text>
      </TouchableOpacity>
    </View>
  );

  // Compute storyRingData
  const storyRingData = React.useMemo(() => {
    const groups: { user: User; hasUnviewed: boolean; isMe: boolean }[] = [];
    if (!user) return groups;

    const storiesByUser: Record<string, Story[]> = {} as any;
    stories.forEach(story => {
      if (!storiesByUser[story.userId]) storiesByUser[story.userId] = [];
      storiesByUser[story.userId].push(story);
    });

    Object.keys(storiesByUser).forEach(uid => {
      const userObj = storyOwners.get(uid);
      if (!userObj) return; // wait until loaded

      const hasUnviewed = !storiesByUser[uid].every(st => st.viewedBy.includes(user.uid));
      const isMe = uid === user.uid;
      groups.push({ user: userObj, hasUnviewed, isMe });
    });

    // always ensure current user appears first even if no stories yet
    if (!groups.find(g => g.isMe) && user) {
      groups.unshift({ user: user as User, hasUnviewed: false, isMe: true });
    }

    // Sort so current user is always first
    groups.sort((a, b) => {
      if (a.isMe) return -1;
      if (b.isMe) return 1;
      return 0;
    });

    return groups;
  }, [stories, storyOwners, user]);

  // Always show current user ring even if no stories
  const finalStoryRingData = React.useMemo(() => {
    if (!user) return storyRingData;
    
    // If no rings yet but user exists, show current user ring
    if (storyRingData.length === 0) {
      return [{ user: user as User, hasUnviewed: false, isMe: true }];
    }

    return storyRingData;
  }, [storyRingData, user]);

  // Create renderStoriesHeader function
  const renderStoriesHeader = () => (
    <View className='pt-4 pb-2'>
      <FlatList
        data={finalStoryRingData}
        renderItem={({ item }) => (
          <StoryRing
            user={item.user}
            hasUnviewed={item.hasUnviewed}
            isCurrentUser={item.isMe}
            onPress={() => {
              const userStories = stories
                .filter(s => s.userId === item.user.uid)
                .sort((a, b) =>
                  (a.timestamp instanceof Date ? a.timestamp.getTime() : new Date(a.timestamp).getTime()) -
                  (b.timestamp instanceof Date ? b.timestamp.getTime() : new Date(b.timestamp).getTime()),
                );

              if (userStories.length > 0) {
                navigation.navigate('StoryViewer', { stories: userStories, initialIndex: 0 });
              } else if (item.isMe) {
                navigation.navigate('MainTabs', { screen: 'Camera' });
              }
            }}
          />
        )}
        keyExtractor={item => item.user.uid}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16 }}
      />
    </View>
  );

  if (isLoading && receivedSnaps.length === 0) {
    return (
      <SafeAreaView className='flex-1 bg-snap-dark'>
        <StatusBar style='light' />
        <LoadingSpinner
          size='large'
          text='Loading your snaps...'
          overlay={false}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className='flex-1 bg-snap-dark'>
      <StatusBar style='light' />

      {/* Header */}
      <View className='px-4 py-3 border-b border-snap-gray/30'>
        <View className='flex-row items-center justify-between'>
          <View>
            <Text className='text-white text-2xl font-bold'>Snaps</Text>
            <Text className='text-white/70 text-sm'>
              {receivedSnaps.length} snap{receivedSnaps.length !== 1 ? 's' : ''}
            </Text>
          </View>

          <View className='flex-row items-center space-x-3'>
            {/* User Info */}
            <View className='items-end mr-3'>
              <Text className='text-white font-semibold text-sm'>
                {user?.displayName}
              </Text>
              <Text className='text-white/50 text-xs'>{user?.email}</Text>
            </View>

            {/* Logout Button */}
            <TouchableOpacity
              onPress={handleLogout}
              className='bg-snap-red px-3 py-2 rounded-lg'
            >
              <Text className='text-white font-semibold text-xs'>Logout</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Content */}
      <View className='flex-1'>
        {error && !isLoading ? (
          renderErrorState()
        ) : (
          <FlatList
            data={receivedSnaps}
            renderItem={renderSnapItem}
            keyExtractor={item => item.id}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16 }}
            ListHeaderComponent={renderStoriesHeader}
            ListEmptyComponent={receivedSnaps.length === 0 && !isLoading ? renderEmptyState : undefined}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor='#FFFC00'
                colors={['#FFFC00']}
              />
            }
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      {/* Loading overlay for sender info */}
      {loadingSenders && (
        <View className='absolute top-20 right-4 bg-black/70 px-3 py-2 rounded-lg'>
          <Text className='text-white text-xs'>Loading...</Text>
        </View>
      )}
    </SafeAreaView>
  );
};
