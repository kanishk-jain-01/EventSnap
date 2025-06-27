import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Alert,
  ScrollView,
  SafeAreaView,
  Switch,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as ImagePicker from 'expo-image-picker';
import { useAuthStore } from '../../store/authStore';
import { useUserStore } from '../../store/userStore';
import { useEventStore } from '../../store/eventStore';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { useThemeColors } from '../../components/ui/ThemeProvider';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MainStackParamList } from '../../navigation/types';
import type { User } from '../../types';

type ProfileScreenNavigationProp =
  NativeStackNavigationProp<MainStackParamList>;

export const ProfileScreen: React.FC = () => {
  const colors = useThemeColors();
  const { user: authUser, logout } = useAuthStore();
  const { activeEvent, role, promoteToHost } = useEventStore();
  const {
    currentUser,
    isLoading,
    fetchCurrentUser,
    updateProfile,
    uploadAvatar,
  } = useUserStore();
  const navigation = useNavigation<ProfileScreenNavigationProp>();

  const [displayName, setDisplayName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // Host promotion state
  const [hostCode, setHostCode] = useState('');
  const [isPromoting, setIsPromoting] = useState(false);

  // Contact info state (hosts only)
  const [instagramHandle, setInstagramHandle] = useState('');
  const [contactVisible, setContactVisible] = useState<boolean>(false);

  // Load profile on mount
  useEffect(() => {
    if (authUser?.uid) {
      fetchCurrentUser(authUser.uid);
    }
  }, [authUser]);

  // Sync display name when profile loads
  useEffect(() => {
    if (currentUser?.displayName) {
      setDisplayName(currentUser.displayName);
    }

    if (currentUser?.instagramHandle !== undefined) {
      setInstagramHandle(currentUser.instagramHandle || '');
      setContactVisible(
        currentUser.contactVisible === undefined
          ? false
          : currentUser.contactVisible,
      );
    }
  }, [currentUser?.displayName, currentUser?.instagramHandle, currentUser?.contactVisible]);

  const handlePickAvatar = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert(
        'Permission required',
        'Media library permission is required to pick an avatar.',
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: true,
      aspect: [1, 1],
    });

    if (result.canceled || !result.assets || result.assets.length === 0) return;

    try {
      setAvatarUploading(true);
      const fileUri = result.assets[0].uri;
      const response = await fetch(fileUri);
      const blob = await response.blob();
      await uploadAvatar(blob, progress => setUploadProgress(progress));
      Alert.alert('Success', 'Avatar updated!');
    } catch (_err) {
      Alert.alert('Error', 'Failed to upload avatar');
    } finally {
      setAvatarUploading(false);
      setUploadProgress(0);
    }
  };

  const handleSave = async () => {
    if (!currentUser) return;
    if (!displayName.trim()) {
      Alert.alert('Validation', 'Display name cannot be empty');
      return;
    }
    if (displayName.trim() === currentUser.displayName &&
        instagramHandle.trim() === (currentUser.instagramHandle || '') &&
        contactVisible === (currentUser.contactVisible ?? false)
    ) {
      Alert.alert('No changes', 'Nothing to save');
      return;
    }

    const formattedHandle = instagramHandle.trim()
      ? instagramHandle.trim().startsWith('@')
        ? instagramHandle.trim()
        : '@' + instagramHandle.trim()
      : '';

    const updates: Partial<User> = {
      displayName: displayName.trim(),
      instagramHandle: formattedHandle,
      contactVisible,
    };

    setIsSaving(true);
    await updateProfile(updates);
    setIsSaving(false);
    Alert.alert('Profile', 'Profile updated');
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout? You will need to rejoin your event.',
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

  const handleManageEvent = () => {
    if (role === 'host') {
      (navigation as any).navigate('EventSetup');
    }
  };

  const handlePromoteToHost = async () => {
    if (!authUser?.uid) return;
    if (!hostCode.trim()) {
      Alert.alert('Validation', 'Please enter the host code');
      return;
    }
    if (hostCode.trim().length !== 8) {
      Alert.alert('Validation', 'Host code must be 8 digits');
      return;
    }

    setIsPromoting(true);
    const success = await promoteToHost(hostCode.trim(), authUser.uid);
    setIsPromoting(false);

    if (success) {
      setHostCode(''); // Clear the input
      Alert.alert(
        'Success!',
        'You are now a host! You can now post stories and manage the event.',
        [{ text: 'OK' }],
      );
    } else {
      Alert.alert(
        'Promotion Failed',
        'Invalid host code or promotion failed. Please check the code and try again.',
        [{ text: 'OK' }],
      );
    }
  };

  const copyHostCode = () => {
    if (activeEvent?.hostCode) {
      // In a real app, you'd use Clipboard API
      Alert.alert(
        'Host Code',
        `Host Code: ${activeEvent.hostCode}\n\nShare this code with guests to make them hosts.`,
        [{ text: 'OK' }],
      );
    }
  };

  const formatEventTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(date);
  };

  const getEventStatus = () => {
    if (!activeEvent) return null;

    const now = new Date();
    const isActive = now >= activeEvent.startTime && now <= activeEvent.endTime;
    const isUpcoming = now < activeEvent.startTime;

    if (isActive) return { text: 'Live Now', color: colors.success };
    if (isUpcoming) return { text: 'Upcoming', color: colors.primary };
    return { text: 'Ended', color: colors.textTertiary };
  };

  if (isLoading && !currentUser) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bgPrimary }}>
        <StatusBar style='dark' />
        <View
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <LoadingSpinner text='Loading profile...' />
        </View>
      </SafeAreaView>
    );
  }

  const eventStatus = getEventStatus();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bgPrimary }}>
      <StatusBar style='dark' />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }}>
        {/* Role Badge */}
        {role && (
          <View
            style={{
              alignItems: 'center',
              marginBottom: 16,
            }}
          >
            <View
              style={{
                backgroundColor:
                  role === 'host' ? colors.primary : colors.accent,
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 20,
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <Text style={{ fontSize: 16, marginRight: 4 }}>
                {role === 'host' ? '👑' : '👤'}
              </Text>
              <Text
                style={{
                  color: colors.textInverse,
                  fontWeight: '600',
                  fontSize: 14,
                }}
              >
                {role === 'host' ? 'Event Host' : 'Event Guest'}
              </Text>
            </View>
          </View>
        )}

        {/* Avatar */}
        <View style={{ alignItems: 'center', marginBottom: 24 }}>
          <TouchableOpacity
            onPress={handlePickAvatar}
            disabled={avatarUploading}
          >
            {currentUser?.avatarUrl ? (
              <Image
                source={{ uri: currentUser.avatarUrl }}
                style={{
                  width: 120,
                  height: 120,
                  borderRadius: 60,
                  borderWidth: 4,
                  borderColor: colors.primary,
                }}
              />
            ) : (
              <View
                style={{
                  width: 120,
                  height: 120,
                  borderRadius: 60,
                  backgroundColor: colors.bgSecondary,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 4,
                  borderColor: colors.primary,
                }}
              >
                <Text
                  style={{
                    color: colors.primary,
                    fontSize: 32,
                    fontWeight: 'bold',
                  }}
                >
                  {currentUser?.displayName?.charAt(0)?.toUpperCase() || '?'}
                </Text>
              </View>
            )}
            {avatarUploading && (
              <View
                style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundColor: 'rgba(0,0,0,0.6)',
                  borderRadius: 60,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <LoadingSpinner text={`${uploadProgress.toFixed(0)}%`} />
              </View>
            )}
          </TouchableOpacity>
          <Text
            style={{
              color: colors.textSecondary,
              marginTop: 8,
              fontSize: 14,
            }}
          >
            Tap to change avatar
          </Text>
        </View>

        {/* Event Information */}
        {activeEvent && (
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: 12,
              padding: 16,
              marginBottom: 24,
            }}
          >
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
                {activeEvent.name}
              </Text>
              {eventStatus && (
                <View
                  style={{
                    backgroundColor: eventStatus.color + '20',
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 6,
                  }}
                >
                  <Text
                    style={{
                      color: eventStatus.color,
                      fontSize: 12,
                      fontWeight: '600',
                    }}
                  >
                    {eventStatus.text}
                  </Text>
                </View>
              )}
            </View>

            <Text
              style={{
                color: colors.textSecondary,
                fontSize: 14,
                marginBottom: 12,
              }}
            >
              📅 {formatEventTime(activeEvent.startTime)} -{' '}
              {formatEventTime(activeEvent.endTime)}
            </Text>

            {/* Buttons */}
            <View style={{ gap: 8 }}>
              <Button
                title='See Host List'
                onPress={() => navigation.navigate('HostList')}
                variant='secondary'
                size='small'
              />
              {role === 'host' && (
                <>
                  <Button
                    title='Manage Event'
                    onPress={handleManageEvent}
                    variant='secondary'
                    size='small'
                  />
                  <Button
                    title='Show Host Code'
                    onPress={copyHostCode}
                    variant='outline'
                    size='small'
                  />
                </>
              )}
            </View>
          </View>
        )}

        {/* Guest Host Promotion Section */}
        {role === 'guest' && activeEvent && (
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
                marginBottom: 8,
              }}
            >
              Become a Host
            </Text>
            <Text
              style={{
                color: colors.textSecondary,
                fontSize: 14,
                marginBottom: 16,
              }}
            >
              Ask the event host for the host code to get host privileges and post stories.
            </Text>
            
            <Input
              label='Host Code'
              placeholder='Enter 8-digit host code'
              value={hostCode}
              onChangeText={setHostCode}
              keyboardType='numeric'
              maxLength={8}
              returnKeyType='done'
              onSubmitEditing={handlePromoteToHost}
            />
            
            <Button
              title='Promote to Host'
              onPress={handlePromoteToHost}
              loading={isPromoting}
              disabled={hostCode.length !== 8}
              size='small'
            />
          </View>
        )}

        {/* Display Name */}
        <Input
          label='Display Name'
          placeholder='Your name'
          value={displayName}
          onChangeText={setDisplayName}
          maxLength={30}
        />

        {/* Host contact info */}
        {role === 'host' && (
          <>
            <Input
              label='Instagram Handle (optional)'
              placeholder='@yourusername'
              value={instagramHandle}
              onChangeText={setInstagramHandle}
              maxLength={60}
            />
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: 16,
                marginTop: 8,
              }}
            >
              <Text
                style={{ flex: 1, color: colors.textPrimary, fontSize: 14 }}
              >
                Allow others to see contact
              </Text>
              <Switch
                value={contactVisible}
                onValueChange={setContactVisible}
                thumbColor={contactVisible ? colors.primary : '#f4f3f4'}
                trackColor={{ false: '#767577', true: colors.primaryLight }}
              />
            </View>
          </>
        )}

        {/* Save Button */}
        <Button title='Save Changes' onPress={handleSave} loading={isSaving} />

        {/* Logout Button */}
        <View style={{ marginTop: 32, marginBottom: 20 }}>
          <Button
            title='Logout'
            onPress={handleLogout}
            variant='danger'
            disabled={avatarUploading || isSaving}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
