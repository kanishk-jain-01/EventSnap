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
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { useEventStore } from '../../store/eventStore';
import { useAuth } from '../../hooks/useAuth';
import { useThemeColors } from '../../components/ui/ThemeProvider';

export const EventSetupScreen: React.FC = () => {
  const colors = useThemeColors();
  const navigation = useNavigation();
  const [name, setName] = useState('');
  const [startTime, setStartTime] = useState<Date>(new Date());
  const [endTime, setEndTime] = useState<Date>(
    new Date(Date.now() + 3 * 60 * 60 * 1000),
  );

  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [eventCreated, setEventCreated] = useState(false);

  const { userId } = useAuth();
  const createEvent = useEventStore(state => state.createEvent);
  const activeEvent = useEventStore(state => state.activeEvent);

  // Reset form state when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      // Reset all form state to initial values
      setName('');
      setStartTime(new Date());
      setEndTime(new Date(Date.now() + 3 * 60 * 60 * 1000));
      setShowStartPicker(false);
      setShowEndPicker(false);
      setSubmitting(false);
      setEventCreated(false);
    }, []),
  );

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

  const handleDone = () => {
    // Navigate to the main app (feed)
    navigation.navigate('Main' as never);
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

              {/* Done Button */}
              <Button
                title='Done'
                onPress={handleDone}
                variant='primary'
                size='large'
              />
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default EventSetupScreen;
