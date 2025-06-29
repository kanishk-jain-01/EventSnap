import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Alert,
  TouchableOpacity,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../services/firebase/config';
import { useThemeColors } from '../../components/ui/ThemeProvider';
import { useEventStore } from '../../store/eventStore';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../../components/ui/Button';
import { AuthService } from '../../services/auth.service';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { MainStackParamList } from '../../navigation/types';

type EventManagementScreenNavigationProp = NativeStackNavigationProp<MainStackParamList>;

interface EndEventRequest {
  eventId: string;
  userId: string;
}

interface EndEventResponse {
  success: boolean;
  deletedItems: {
    participants: number;
    documents: number;
    stories: number;
    storageFiles: number;
    vectorsDeleted: boolean;
  };
}

export const EventManagementScreen: React.FC = () => {
  const navigation = useNavigation<EventManagementScreenNavigationProp>();
  const colors = useThemeColors();
  const { activeEvent, role, _loadActiveEventFromUser } = useEventStore();
  const { user, setUser } = useAuthStore();
  const [isEndingEvent, setIsEndingEvent] = useState(false);

  const formatEventTime = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await Share.share({
        message: text,
      });
    } catch (_error) {
      Alert.alert('Error', `Failed to share ${label}`);
    }
  };

  const handleEndEvent = () => {
    if (!activeEvent || !user) return;

    Alert.alert(
      'End Event',
      `Are you sure you want to end "${activeEvent.name}"?\n\nThis will permanently delete:\n• All event documents and files\n• All stories and photos\n• All participant data\n• Vector embeddings\n\nThis action cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'End Event',
          style: 'destructive',
          onPress: confirmEndEvent,
        },
      ],
    );
  };

  const confirmEndEvent = async () => {
    if (!activeEvent || !user) return;

    setIsEndingEvent(true);

    try {
      const endEventFunction = httpsCallable<EndEventRequest, EndEventResponse>(
        functions,
        'endEvent',
      );

      const result = await endEventFunction({
        eventId: activeEvent.id,
        userId: user.uid,
      });

      if (result.data.success) {
        const { deletedItems } = result.data;
        
        // Refresh the user's active event state from the database
        await _loadActiveEventFromUser(user.uid);
        
        // Also refresh the auth store user data to ensure navigation logic picks up changes
        const userDataResponse = await AuthService.getUserData(user.uid);
        if (userDataResponse.success && userDataResponse.data) {
          setUser(userDataResponse.data);
        }
        
        Alert.alert(
          'Event Ended Successfully',
          `Deleted:\n• ${deletedItems.participants} participants\n• ${deletedItems.documents} documents\n• ${deletedItems.stories} stories\n• ${deletedItems.storageFiles} files\n• Vector embeddings: ${deletedItems.vectorsDeleted ? 'Yes' : 'No'}`,
          [
            {
              text: 'OK',
              onPress: () => {
                // Force a complete navigation reset to EventSelection
                const rootNavigation = navigation.getParent()?.getParent() || navigation.getParent();
                
                if (rootNavigation) {
                  rootNavigation.dispatch(
                    CommonActions.reset({
                      index: 0,
                      routes: [{ name: 'EventSelection' }],
                    }),
                  );
                } else {
                  // Fallback: just go back and hope AppNavigator handles it
                  navigation.goBack();
                }
              },
            },
          ],
        );
      }
    } catch (error: any) {
      Alert.alert(
        'Failed to End Event',
        error.message || 'An unexpected error occurred. Please try again.',
        [{ text: 'OK' }],
      );
    } finally {
      setIsEndingEvent(false);
    }
  };

  if (!activeEvent) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bgPrimary }}>
        <View className="flex-1 items-center justify-center p-6">
          <Text className="text-text-primary text-lg text-center">
            No active event found
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bgPrimary }}>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={{ color: colors.primary, fontSize: 16, fontWeight: '600' }}>
            Cancel
          </Text>
        </TouchableOpacity>
        <Text style={{ color: colors.textPrimary, fontSize: 18, fontWeight: '600' }}>
          Manage Event
        </Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Event Details */}
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: 12,
            padding: 16,
            marginBottom: 24,
          }}
        >
          <Text
            style={{
              color: colors.textPrimary,
              fontSize: 20,
              fontWeight: '600',
              marginBottom: 8,
            }}
          >
            {activeEvent.name}
          </Text>
          
          <Text
            style={{
              color: colors.textSecondary,
              fontSize: 14,
              marginBottom: 16,
            }}
          >
            📅 {formatEventTime(activeEvent.startTime)} - {formatEventTime(activeEvent.endTime)}
          </Text>

          {/* Role Badge */}
          <View
            style={{
              backgroundColor: role === 'host' ? colors.primary + '20' : colors.accent + '20',
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 8,
              alignSelf: 'flex-start',
            }}
          >
            <Text
              style={{
                color: role === 'host' ? colors.primary : colors.accent,
                fontSize: 12,
                fontWeight: '600',
                textTransform: 'uppercase',
              }}
            >
              {role === 'host' ? '👑 Host' : '👤 Guest'}
            </Text>
          </View>
        </View>

        {/* Event Codes */}
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: 12,
            padding: 16,
            marginBottom: 24,
          }}
        >
          <Text
            style={{
              color: colors.textPrimary,
              fontSize: 18,
              fontWeight: '600',
              marginBottom: 16,
            }}
          >
            Event Codes
          </Text>

          {/* Join Code */}
          <View style={{ marginBottom: 16 }}>
            <Text
              style={{
                color: colors.textSecondary,
                fontSize: 14,
                marginBottom: 8,
              }}
            >
              Join Code (for guests)
            </Text>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: colors.bgSecondary,
                borderRadius: 8,
                padding: 12,
              }}
            >
              <Text
                style={{
                  color: colors.textPrimary,
                  fontSize: 18,
                  fontWeight: '600',
                  fontFamily: 'monospace',
                  flex: 1,
                }}
              >
                {activeEvent.joinCode}
              </Text>
              <TouchableOpacity
                onPress={() => copyToClipboard(activeEvent.joinCode, 'Join Code')}
                style={{
                  backgroundColor: colors.primary,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 6,
                }}
              >
                <Text style={{ color: 'white', fontSize: 12, fontWeight: '600' }}>
                  Share
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Host Code */}
          <View>
            <Text
              style={{
                color: colors.textSecondary,
                fontSize: 14,
                marginBottom: 8,
              }}
            >
              Host Code (for promotions)
            </Text>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: colors.bgSecondary,
                borderRadius: 8,
                padding: 12,
              }}
            >
              <Text
                style={{
                  color: colors.textPrimary,
                  fontSize: 18,
                  fontWeight: '600',
                  fontFamily: 'monospace',
                  flex: 1,
                }}
              >
                {activeEvent.hostCode}
              </Text>
              <TouchableOpacity
                onPress={() => copyToClipboard(activeEvent.hostCode, 'Host Code')}
                style={{
                  backgroundColor: colors.accent,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 6,
                }}
              >
                <Text style={{ color: 'white', fontSize: 12, fontWeight: '600' }}>
                  Share
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Danger Zone - Only for hosts */}
        {role === 'host' && (
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: 12,
              padding: 16,
              borderWidth: 1,
              borderColor: colors.error + '30',
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
              ⚠️ Danger Zone
            </Text>
            
            <Text
              style={{
                color: colors.textSecondary,
                fontSize: 14,
                marginBottom: 16,
                lineHeight: 20,
              }}
            >
              Ending the event will permanently delete all event data including documents, 
              stories, participant information, and AI embeddings. This action cannot be undone.
            </Text>

            <Button
              title={isEndingEvent ? 'Ending Event...' : 'End Event'}
              onPress={handleEndEvent}
              variant="danger"
              disabled={isEndingEvent}
              loading={isEndingEvent}
            />
          </View>
        )}

        {/* Loading Overlay */}
        {isEndingEvent && (
          <LoadingSpinner
            overlay
            text="Ending event and cleaning up data..."
            size="large"
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}; 