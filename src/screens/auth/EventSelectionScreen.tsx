/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Alert,
  SafeAreaView,
  RefreshControl,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useThemeColors } from '../../components/ui/ThemeProvider';
import { useEventStore } from '../../store/eventStore';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { Event } from '../../types';
import { RootStackParamList } from '../../navigation/types';

type EventSelectionScreenNavigationProp =
  NativeStackNavigationProp<RootStackParamList>;

interface PublicEventItemProps {
  event: Event;
  onJoin: (event: Event) => void;
  isJoining: boolean;
}

const PublicEventItem: React.FC<PublicEventItemProps> = ({
  event,
  onJoin,
  isJoining,
}) => {
  const colors = useThemeColors();
  // Using event parameter for display and logic

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(date);
  };

  const isEventActive = () => {
    const now = new Date();
    return now >= event.startTime && now <= event.endTime;
  };

  const isEventUpcoming = () => {
    const now = new Date();
    return now < event.startTime;
  };

  const getEventStatus = () => {
    if (isEventActive()) return { text: 'Live Now', color: colors.success };
    if (isEventUpcoming()) return { text: 'Upcoming', color: colors.primary };
    return { text: 'Ended', color: colors.textTertiary };
  };

  const status = getEventStatus();
  const canJoin = isEventActive() || isEventUpcoming();

  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      {/* Event Header */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 8,
        }}
      >
        <Text
          style={{
            color: colors.textPrimary,
            fontSize: 18,
            fontWeight: '600',
            flex: 1,
            marginRight: 8,
          }}
        >
          {event.name}
        </Text>
        <View
          style={{
            backgroundColor: status.color + '20',
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 6,
          }}
        >
          <Text
            style={{
              color: status.color,
              fontSize: 12,
              fontWeight: '600',
            }}
          >
            {status.text}
          </Text>
        </View>
      </View>

      {/* Event Details */}
      <View style={{ marginBottom: 12 }}>
        <Text
          style={{ color: colors.textSecondary, fontSize: 14, marginBottom: 4 }}
        >
          📅 {formatDate(event.startTime)} - {formatDate(event.endTime)}
        </Text>
        <Text style={{ color: colors.textSecondary, fontSize: 14 }}>
          👥 Event participants
        </Text>
      </View>

      {/* Join Button */}
      <Button
        title={canJoin ? 'Join Event' : 'Event Ended'}
        onPress={() => onJoin(event)}
        disabled={!canJoin || isJoining}
        loading={isJoining}
        variant={canJoin ? 'primary' : 'secondary'}
      />
    </View>
  );
};

export const EventSelectionScreen: React.FC = () => {
  const navigation = useNavigation<EventSelectionScreenNavigationProp>();
  const colors = useThemeColors();
  const { user } = useAuthStore();
  const {
    publicEvents,
    isLoading,
    error,
    joinEvent,
    joinEventByCode,
    loadPublicEvents,
  } = useEventStore();

  const [joinCode, setJoinCode] = useState('');
  const [isJoiningPrivate, setIsJoiningPrivate] = useState(false);
  const [joiningEventId, setJoiningEventId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadPublicEvents();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadPublicEvents();
    setRefreshing(false);
  };

  const handleJoinPublicEvent = async (event: Event) => {
    if (!user?.uid) {
      Alert.alert('Error', 'You must be logged in to join an event');
      return;
    }

    setJoiningEventId(event.id);

    try {
      const success = await joinEvent(event.id, user.uid);

      if (success) {
        Alert.alert(
          'Joined Event!',
          `Welcome to ${event.name}! You can now participate in event activities.`,
          [
            {
              text: 'Continue',
              onPress: () => {
                // AppNavigator will automatically navigate to Main when activeEvent is set
                // No manual navigation needed
              },
            },
          ],
        );
      } else {
        Alert.alert('Error', 'Failed to join event. Please try again.');
      }
    } catch (_error) {
      Alert.alert('Error', 'Failed to join event. Please try again.');
    } finally {
      setJoiningEventId(null);
    }
  };

  const handleJoinPrivateEvent = async () => {
    if (!user?.uid) {
      Alert.alert('Error', 'You must be logged in to join an event');
      return;
    }

    if (!joinCode.trim() || joinCode.trim().length !== 6) {
      Alert.alert('Invalid Code', 'Please enter a valid 6-digit join code');
      return;
    }

    setIsJoiningPrivate(true);

    try {
      const success = await joinEventByCode(joinCode.trim(), user.uid);

      if (success) {
        setJoinCode('');
        Alert.alert(
          'Joined Private Event!',
          'You have successfully joined the private event.',
          [
            {
              text: 'Continue',
              onPress: () => {
                // AppNavigator will automatically navigate to Main when activeEvent is set
                // No manual navigation needed
              },
            },
          ],
        );
      } else {
        Alert.alert(
          'Error',
          'Invalid join code or failed to join event. Please check the code and try again.',
        );
      }
    } catch (_error) {
      Alert.alert('Error', 'Failed to join private event. Please try again.');
    } finally {
      setIsJoiningPrivate(false);
    }
  };

  const handleCreateEvent = () => {
    navigation.navigate('EventSetup');
  };

  // Loading state
  if (isLoading && !refreshing) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bgPrimary }}>
        <StatusBar style='dark' />
        <View
          style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
        >
          <LoadingSpinner
            size='large'
            color={colors.primary}
            text='Loading events...'
          />
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (error && !refreshing) {
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
            {error}
          </Text>
          <Button title='Retry' onPress={loadPublicEvents} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bgPrimary }}>
      <StatusBar style='dark' />

      {/* Header */}
      <View
        style={{
          paddingHorizontal: 16,
          paddingVertical: 16,
          backgroundColor: colors.surface,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        <Text
          style={{
            color: colors.textPrimary,
            fontSize: 24,
            fontWeight: '700',
            marginBottom: 4,
          }}
        >
          Join an Event
        </Text>
        <Text style={{ color: colors.textSecondary, fontSize: 16 }}>
          Choose an event to participate in or create your own
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {/* Create Event Section */}
        <View style={{ marginBottom: 24 }}>
          <Text
            style={{
              color: colors.textPrimary,
              fontSize: 18,
              fontWeight: '600',
              marginBottom: 12,
            }}
          >
            Host an Event
          </Text>
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: 12,
              padding: 16,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Text
              style={{
                color: colors.textSecondary,
                fontSize: 14,
                marginBottom: 12,
                lineHeight: 20,
              }}
            >
              Create your own event and invite participants to join your
              networking session.
            </Text>
            <Button
              title='Create Event'
              onPress={handleCreateEvent}
              variant='primary'
            />
          </View>
        </View>

        {/* Private Event Section */}
        <View style={{ marginBottom: 24 }}>
          <Text
            style={{
              color: colors.textPrimary,
              fontSize: 18,
              fontWeight: '600',
              marginBottom: 12,
            }}
          >
            Join Private Event
          </Text>
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: 12,
              padding: 16,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Text
              style={{
                color: colors.textSecondary,
                fontSize: 14,
                marginBottom: 12,
              }}
            >
              Enter a 6-digit join code to access a private event
            </Text>
            <View style={{ marginBottom: 12 }}>
              <Input
                placeholder='Enter join code'
                value={joinCode}
                onChangeText={setJoinCode}
                keyboardType='numeric'
                maxLength={6}
              />
            </View>
            <Button
              title='Join Private Event'
              onPress={handleJoinPrivateEvent}
              disabled={joinCode.length !== 6 || isJoiningPrivate}
              loading={isJoiningPrivate}
            />
          </View>
        </View>

        {/* Public Events Section */}
        <View>
          <Text
            style={{
              color: colors.textPrimary,
              fontSize: 18,
              fontWeight: '600',
              marginBottom: 12,
            }}
          >
            Public Events
          </Text>

          {publicEvents.length > 0 ? (
            publicEvents.map((event: Event) => (
              <PublicEventItem
                key={event.id}
                event={event}
                onJoin={handleJoinPublicEvent}
                isJoining={joiningEventId === event.id}
              />
            ))
          ) : (
            <View
              style={{
                backgroundColor: colors.surface,
                borderRadius: 12,
                padding: 24,
                alignItems: 'center',
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
                  textAlign: 'center',
                }}
              >
                No public events available
              </Text>
              <Text
                style={{
                  color: colors.textTertiary,
                  fontSize: 14,
                  textAlign: 'center',
                }}
              >
                Check back later or create your own event
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
