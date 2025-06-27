import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  SafeAreaView,
  Clipboard,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { useEventStore } from '../../store/eventStore';
import { useAuth } from '../../hooks/useAuth';
import { useNavigation } from '@react-navigation/native';
import type { RootStackParamList } from '../../navigation/types';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as DocumentPicker from 'expo-document-picker';
import { UploadProgress } from '../../components/ui/UploadProgress';
import { StorageService } from '../../services/storage.service';
import { IngestionService } from '../../services/ai/ingestion.service';
import { UploadStatus } from '../../components/ui/UploadProgress';
import { CleanupService } from '../../services/ai/cleanup.service';
import { useThemeColors } from '../../components/ui/ThemeProvider';

export const EventSetupScreen: React.FC = () => {
  const colors = useThemeColors();
  const [name, setName] = useState('');
  const [startTime, setStartTime] = useState<Date>(new Date());
  const [endTime, setEndTime] = useState<Date>(
    new Date(Date.now() + 3 * 60 * 60 * 1000),
  );

  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Upload state management
  interface UploadItem {
    id: string;
    fileName: string;
    progress: number;
    status: UploadStatus;
    error?: string;
  }

  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [eventCreated, setEventCreated] = useState(false);
  const [endingEvent, setEndingEvent] = useState(false);

  const { userId } = useAuth();
  const createEvent = useEventStore(state => state.createEvent);
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const activeEvent = useEventStore(state => state.activeEvent);

  const handleStartChange = (_event: any, selectedDate?: Date) => {
    setShowStartPicker(Platform.OS === 'ios');
    if (selectedDate) {
      setStartTime(selectedDate);
    }
  };

  const handleEndChange = (_event: any, selectedDate?: Date) => {
    setShowEndPicker(Platform.OS === 'ios');
    if (selectedDate) {
      setEndTime(selectedDate);
    }
  };

  const isFormValid = () => {
    if (!name.trim()) return false;
    if (startTime >= endTime) return false;
    return true;
  };

  const handleSubmit = async () => {
    if (!userId) {
      Alert.alert('Error', 'You must be logged in to create an event');
      return;
    }

    if (!isFormValid()) {
      Alert.alert('Invalid', 'Please fill all fields correctly');
      return;
    }

    setSubmitting(true);

    const success = await createEvent({
      name: name.trim(),
      joinCode: '', // Will be auto-generated
      startTime,
      endTime,
      hostUid: userId,
      assets: [],
    });

    setSubmitting(false);

    if (success) {
      // Mark event as created; enable asset upload section
      setEventCreated(true);
      Alert.alert(
        'Success',
        'Event created! Your join code is ready to share.',
      );
    } else {
      Alert.alert('Error', 'Failed to create event. Please try again.');
    }
  };

  const copyJoinCode = () => {
    if (activeEvent?.joinCode) {
      Clipboard.setString(activeEvent.joinCode);
      Alert.alert('Copied!', 'Join code copied to clipboard');
    }
  };

  /** Pick a PDF or image file and upload it as an event asset */
  const handlePickAsset = async () => {
    if (!activeEvent?.id) {
      Alert.alert('Error', 'Event not found. Please create the event first.');
      return;
    }

    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'image/*'],
      copyToCacheDirectory: true,
    });

    if (result.canceled) return;

    const file = (result as any).assets ? (result as any).assets[0] : result; // compatibility
    const { uri, name, mimeType } = file;

    // Generate unique asset ID
    const assetId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    try {
      const response = await fetch(uri);
      const blob = await response.blob();

      // Add to uploads list
      setUploads(prev => [
        ...prev,
        {
          id: assetId,
          fileName: name,
          progress: 0,
          status: 'uploading',
        },
      ]);

      const updateProgress = (progress: number) => {
        setUploads(prev =>
          prev.map(u => (u.id === assetId ? { ...u, progress } : u)),
        );
      };

      const uploadRes = await StorageService.uploadEventAsset(
        blob,
        activeEvent.id,
        assetId,
        {
          contentType:
            mimeType ||
            (name.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg'),
          onProgress: updateProgress,
        },
      );

      if (uploadRes.success && uploadRes.data) {
        // Update upload status to processing
        setUploads(prev =>
          prev.map(u =>
            u.id === assetId ? { ...u, status: 'processing' } : u,
          ),
        );

        // Trigger AI ingestion based on file type
        const ingestionRes = name.toLowerCase().endsWith('.pdf')
          ? await IngestionService.ingestPdf(
              activeEvent.id,
              uploadRes.data.fullPath,
            )
          : await IngestionService.ingestImage(
              activeEvent.id,
              uploadRes.data.fullPath,
            );

        if (ingestionRes.success) {
          setUploads(prev =>
            prev.map(u =>
              u.id === assetId
                ? { ...u, status: 'completed', progress: 100 }
                : u,
            ),
          );
        } else {
          setUploads(prev =>
            prev.map(u =>
              u.id === assetId
                ? {
                    ...u,
                    status: 'error',
                    error: ingestionRes.error || 'Processing failed',
                  }
                : u,
            ),
          );
        }
      } else {
        setUploads(prev =>
          prev.map(u =>
            u.id === assetId
              ? {
                  ...u,
                  status: 'error',
                  error: uploadRes.error || 'Upload failed',
                }
              : u,
          ),
        );
      }
    } catch (_error) {
      setUploads(prev =>
        prev.map(u =>
          u.id === assetId
            ? { ...u, status: 'error', error: 'Upload failed' }
            : u,
        ),
      );
    }
  };

  /** End the event and clean up all content */
  const handleEndEvent = async () => {
    if (!activeEvent?.id) {
      Alert.alert('Error', 'No active event to end');
      return;
    }

    Alert.alert(
      'End Event',
      'This will permanently delete all event content (stories, snaps, assets). This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'End Event',
          style: 'destructive',
          onPress: async () => {
            setEndingEvent(true);

            const result = await CleanupService.endEvent(activeEvent.id, true);

            setEndingEvent(false);

            if (result.success) {
              Alert.alert(
                'Event Ended',
                `Successfully cleaned up:\n• ${result.data?.deletedStories || 0} stories\n• ${result.data?.deletedSnaps || 0} snaps\n• ${result.data?.deletedAssets || 0} assets`,
                [
                  {
                    text: 'OK',
                    onPress: () => {
                      // Clear event store and navigate to auth
                      useEventStore.getState().clearState();
                      // Navigate to auth by resetting the entire navigation stack
                      navigation.getParent()?.reset({
                        index: 0,
                        routes: [{ name: 'Auth' }],
                      });
                    },
                  },
                ],
              );
            } else {
              Alert.alert('Error', result.error || 'Failed to end event');
            }
          },
        },
      ],
    );
  };

  const handleDone = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      // If there's no screen to go back to (e.g., EventSelection was removed
      // after the new event became active), reset the root stack to Main so
      // the user lands on the normal event UI.
      navigation.reset({
        index: 0,
        routes: [{ name: 'Main' }],
      });
    }
  };

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
          Create New Event
        </Text>
        <Text style={{ color: colors.textSecondary, fontSize: 16 }}>
          Set up your event and invite participants
        </Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ padding: 16 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Event Name */}
          <View style={{ marginBottom: 16 }}>
            <Input
              label='Event Name'
              placeholder='e.g. ReactConf 2025'
              value={name}
              onChangeText={setName}
            />
          </View>

          {/* Start Time */}
          <View style={{ marginBottom: 16 }}>
            <Text
              style={{
                color: colors.textPrimary,
                fontSize: 16,
                fontWeight: '600',
                marginBottom: 8,
              }}
            >
              Start Time
            </Text>
            <TouchableOpacity
              onPress={() => setShowStartPicker(true)}
              style={{
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 8,
                paddingVertical: 12,
                paddingHorizontal: 16,
              }}
            >
              <Text style={{ color: colors.textPrimary, fontSize: 16 }}>
                {startTime.toLocaleString()}
              </Text>
            </TouchableOpacity>
            {showStartPicker && (
              <DateTimePicker
                value={startTime}
                mode='datetime'
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleStartChange}
              />
            )}
          </View>

          {/* End Time */}
          <View style={{ marginBottom: 16 }}>
            <Text
              style={{
                color: colors.textPrimary,
                fontSize: 16,
                fontWeight: '600',
                marginBottom: 8,
              }}
            >
              End Time
            </Text>
            <TouchableOpacity
              onPress={() => setShowEndPicker(true)}
              style={{
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 8,
                paddingVertical: 12,
                paddingHorizontal: 16,
              }}
            >
              <Text style={{ color: colors.textPrimary, fontSize: 16 }}>
                {endTime.toLocaleString()}
              </Text>
            </TouchableOpacity>
            {showEndPicker && (
              <DateTimePicker
                value={endTime}
                mode='datetime'
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleEndChange}
              />
            )}
          </View>

          {/* Submit Button */}
          <Button
            title={eventCreated ? 'Event Created' : 'Create Event'}
            onPress={handleSubmit}
            disabled={!isFormValid() || submitting || eventCreated}
            loading={submitting}
            variant='primary'
          />

          {/* Join Code Display */}
          {eventCreated && activeEvent?.joinCode && (
            <View style={{ marginTop: 32 }}>
              <Text
                style={{
                  color: colors.textPrimary,
                  fontSize: 18,
                  fontWeight: '600',
                  marginBottom: 16,
                  textAlign: 'center',
                }}
              >
                🎉 Event Created!
              </Text>

              <View
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: 16,
                  padding: 24,
                  borderWidth: 2,
                  borderColor: colors.primary,
                  alignItems: 'center',
                  marginBottom: 24,
                }}
              >
                <Text
                  style={{
                    color: colors.textPrimary,
                    fontSize: 16,
                    fontWeight: '600',
                    marginBottom: 8,
                  }}
                >
                  Share this join code:
                </Text>

                <View
                  style={{
                    backgroundColor: colors.bgPrimary,
                    borderRadius: 12,
                    paddingVertical: 16,
                    paddingHorizontal: 24,
                    marginBottom: 16,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                >
                  <Text
                    style={{
                      color: colors.primary,
                      fontSize: 32,
                      fontWeight: '700',
                      textAlign: 'center',
                      letterSpacing: 4,
                    }}
                  >
                    {activeEvent.joinCode}
                  </Text>
                </View>

                <Button
                  title='Copy Join Code'
                  onPress={copyJoinCode}
                  variant='secondary'
                  size='medium'
                />

                <Text
                  style={{
                    color: colors.textSecondary,
                    fontSize: 14,
                    textAlign: 'center',
                    marginTop: 12,
                    lineHeight: 20,
                  }}
                >
                  Share this code with participants so they can join your event
                </Text>
              </View>
            </View>
          )}

          {/* Asset Upload Section */}
          {eventCreated && (
            <View style={{ marginTop: 0 }}>
              <Text
                style={{
                  color: colors.textPrimary,
                  fontSize: 18,
                  fontWeight: '600',
                  marginBottom: 16,
                }}
              >
                Event Assets
              </Text>
              <Text
                style={{
                  color: colors.textSecondary,
                  fontSize: 14,
                  marginBottom: 16,
                  lineHeight: 20,
                }}
              >
                Upload PDFs and images for AI-powered contextual search.
                Participants can ask questions about your event materials.
              </Text>

              <Button
                title='Add Asset'
                onPress={handlePickAsset}
                variant='secondary'
              />

              {/* Upload Progress List */}
              {uploads.length > 0 && (
                <View style={{ marginTop: 16 }}>
                  {uploads.map(upload => (
                    <UploadProgress
                      key={upload.id}
                      fileName={upload.fileName}
                      progress={upload.progress}
                      status={upload.status}
                      error={upload.error}
                    />
                  ))}
                </View>
              )}

              {/* Action Buttons */}
              <View style={{ marginTop: 24, gap: 12 }}>
                <Button title='Done' onPress={handleDone} variant='primary' />

                <Button
                  title='End Event'
                  onPress={handleEndEvent}
                  disabled={endingEvent}
                  loading={endingEvent}
                  variant='danger'
                />
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default EventSetupScreen;
