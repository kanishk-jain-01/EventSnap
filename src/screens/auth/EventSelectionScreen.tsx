import React, { useState } from 'react';
import {
  View,
  Text,
  Alert,
  SafeAreaView,
  TouchableWithoutFeedback,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
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
import { RootStackParamList } from '../../navigation/types';

type EventSelectionScreenNavigationProp =
  NativeStackNavigationProp<RootStackParamList>;

export const EventSelectionScreen: React.FC = () => {
  const navigation = useNavigation<EventSelectionScreenNavigationProp>();
  const colors = useThemeColors();
  const { user, logout } = useAuthStore();
  const { joinEventByCode, isLoading, error } = useEventStore();

  const [joinCode, setJoinCode] = useState('');
  const [isJoiningEvent, setIsJoiningEvent] = useState(false);

  const handleJoinEvent = async () => {
    if (!user?.uid) {
      Alert.alert('Error', 'You must be logged in to join an event');
      return;
    }

    if (!joinCode.trim() || joinCode.trim().length !== 6) {
      Alert.alert('Invalid Code', 'Please enter a valid 6-digit join code');
      return;
    }

    // Dismiss keyboard before proceeding
    Keyboard.dismiss();
    setIsJoiningEvent(true);

    try {
      const success = await joinEventByCode(joinCode.trim(), user.uid);

      if (success) {
        setJoinCode('');
        Alert.alert(
          'Joined Event!',
          'You have successfully joined the event. Welcome!',
          [
            {
              text: 'Continue',
              onPress: () => {
                // AppNavigator will automatically navigate to Main when activeEvent is set
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
      Alert.alert('Error', 'Failed to join event. Please try again.');
    } finally {
      setIsJoiningEvent(false);
    }
  };

  const handleCreateEvent = () => {
    Keyboard.dismiss();
    navigation.navigate('EventSetup');
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
          },
        },
      ],
    );
  };

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  // Loading state
  if (isLoading && !isJoiningEvent) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bgPrimary }}>
        <StatusBar style='dark' />
        <View
          style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
        >
          <LoadingSpinner
            size='large'
            color={colors.primary}
            text='Loading...'
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <TouchableWithoutFeedback onPress={dismissKeyboard}>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bgPrimary }}>
        <StatusBar style='dark' />

        {/* Header */}
        <View
          style={{
            paddingHorizontal: 24,
            paddingVertical: 20,
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
              marginBottom: 6,
              textAlign: 'center',
            }}
          >
            Welcome to EventSnap
          </Text>
          <Text
            style={{
              color: colors.textSecondary,
              fontSize: 14,
              textAlign: 'center',
              lineHeight: 20,
            }}
          >
            Create your own event or join an existing one with a code
          </Text>
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <View style={{ flex: 1, padding: 20 }}>
            {/* Create Event Section */}
            <View style={{ marginBottom: 20 }}>
              <View
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: 12,
                  padding: 20,
                  borderWidth: 1,
                  borderColor: colors.border,
                  alignItems: 'center',
                }}
              >
                <Text
                  style={{
                    fontSize: 36,
                    marginBottom: 12,
                  }}
                >
                  🎉
                </Text>
                <Text
                  style={{
                    color: colors.textPrimary,
                    fontSize: 18,
                    fontWeight: '600',
                    marginBottom: 6,
                    textAlign: 'center',
                  }}
                >
                  Host an Event
                </Text>
                <Text
                  style={{
                    color: colors.textSecondary,
                    fontSize: 14,
                    marginBottom: 16,
                    textAlign: 'center',
                    lineHeight: 20,
                  }}
                >
                  Create your own event and get a join code to share with
                  participants
                </Text>
                <Button
                  title='Create Event'
                  onPress={handleCreateEvent}
                  variant='primary'
                  size='medium'
                />
              </View>
            </View>

            {/* Join Event Section */}
            <View>
              <View
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: 12,
                  padding: 20,
                  borderWidth: 1,
                  borderColor: colors.border,
                  alignItems: 'center',
                }}
              >
                <Text
                  style={{
                    fontSize: 36,
                    marginBottom: 12,
                  }}
                >
                  🎫
                </Text>
                <Text
                  style={{
                    color: colors.textPrimary,
                    fontSize: 18,
                    fontWeight: '600',
                    marginBottom: 6,
                    textAlign: 'center',
                  }}
                >
                  Join an Event
                </Text>
                <Text
                  style={{
                    color: colors.textSecondary,
                    fontSize: 14,
                    marginBottom: 16,
                    textAlign: 'center',
                    lineHeight: 20,
                  }}
                >
                  Enter the 6-digit code you received from the event organizer
                </Text>

                <View style={{ width: '100%', marginBottom: 16 }}>
                  <Input
                    placeholder='Enter 6-digit code'
                    value={joinCode}
                    onChangeText={setJoinCode}
                    keyboardType='numeric'
                    maxLength={6}
                    autoCapitalize='none'
                    error={error || undefined}
                    returnKeyType='done'
                    onSubmitEditing={handleJoinEvent}
                    blurOnSubmit={true}
                  />
                </View>

                <Button
                  title='Join Event'
                  onPress={handleJoinEvent}
                  variant='primary'
                  size='medium'
                  disabled={joinCode.length !== 6}
                  loading={isJoiningEvent}
                />
              </View>
            </View>

            {/* Logout Button */}
            <View style={{ marginTop: 32, alignItems: 'center' }}>
              <Button
                title='Logout'
                onPress={handleLogout}
                variant='danger'
                size='small'
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
};
