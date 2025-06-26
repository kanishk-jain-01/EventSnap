import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Alert,
  ScrollView,
  FlatList,
  SafeAreaView,
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
import { RootStackParamList } from '../../navigation/types';

type ProfileScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const ProfileScreen: React.FC = () => {
  const colors = useThemeColors();
  const { user: authUser, logout } = useAuthStore();
  const { activeEvent, role } = useEventStore();
  const {
    currentUser,
    isLoading,
    fetchCurrentUser,
    updateProfile,
    uploadAvatar,
    contacts,
    contactsLoading,
    fetchContacts,
    subscribeToContacts,
  } = useUserStore();
  const navigation = useNavigation<ProfileScreenNavigationProp>();

  const [displayName, setDisplayName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Load profile & contacts on mount
  useEffect(() => {
    if (authUser?.uid) {
      fetchCurrentUser(authUser.uid);
      fetchContacts();
      subscribeToContacts();
    }
  }, [authUser]);

  // Sync display name when profile loads
  useEffect(() => {
    if (currentUser?.displayName) {
      setDisplayName(currentUser.displayName);
    }
  }, [currentUser?.displayName]);

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
    if (displayName.trim() === currentUser.displayName) {
      Alert.alert('No changes', 'Nothing to save');
      return;
    }

    setIsSaving(true);
    await updateProfile({ displayName: displayName.trim() });
    setIsSaving(false);
    Alert.alert('Profile', 'Display name updated');
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
      navigation.navigate('EventSetup');
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

  const renderContactItem = ({ item }: { item: (typeof contacts)[0] }) => (
    <TouchableOpacity
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        backgroundColor: colors.surface,
        borderRadius: 8,
        marginBottom: 8,
      }}
      onPress={() => {
        // Note: UserProfile navigation would need to be added to RootStackParamList
        // For now, we'll show an alert
        Alert.alert('Feature Coming Soon', `View ${item.displayName}'s profile`);
      }}
    >
      {item.avatarUrl ? (
        <Image
          source={{ uri: item.avatarUrl }}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            borderWidth: 2,
            borderColor: colors.primary,
          }}
        />
      ) : (
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: colors.bgSecondary,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text
            style={{
              color: colors.primary,
              fontWeight: '600',
              fontSize: 16,
            }}
          >
            {item.displayName.charAt(0).toUpperCase()}
          </Text>
        </View>
      )}
      <Text
        style={{
          marginLeft: 12,
          color: colors.textPrimary,
          fontSize: 16,
          fontWeight: '500',
        }}
      >
        {item.displayName}
      </Text>
    </TouchableOpacity>
  );

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
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20 }}
      >
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
                backgroundColor: role === 'host' ? colors.primary : colors.accent,
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
          <TouchableOpacity onPress={handlePickAvatar} disabled={avatarUploading}>
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
              📅 {formatEventTime(activeEvent.startTime)} - {formatEventTime(activeEvent.endTime)}
            </Text>

            {/* Host-only event management */}
            {role === 'host' && (
              <Button
                title="Manage Event"
                onPress={handleManageEvent}
                variant="secondary"
                size="small"
              />
            )}
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

        {/* Save Button */}
        <Button title='Save Changes' onPress={handleSave} loading={isSaving} />

        {/* Find Friends - only for hosts or if no active event */}
        {(role === 'host' || !activeEvent) && (
          <View style={{ marginTop: 16 }}>
            <Button
              title='Find Friends'
              onPress={() => {
                // UserSearch would need to be added to RootStackParamList
                Alert.alert('Feature Coming Soon', 'Find and add friends');
              }}
              variant='secondary'
              size='medium'
              disabled={avatarUploading || isSaving}
            />
          </View>
        )}

        {/* Contacts List - show fewer for guests */}
        <View style={{ marginTop: 24 }}>
          <Text
            style={{
              color: colors.textPrimary,
              fontSize: 18,
              fontWeight: '600',
              marginBottom: 12,
            }}
          >
            {role === 'host' ? 'My Friends' : 'Event Contacts'}
          </Text>
          {contactsLoading ? (
            <LoadingSpinner />
          ) : contacts.length === 0 ? (
            <Text style={{ color: colors.textSecondary }}>
              {role === 'host' 
                ? 'You have no friends yet.' 
                : 'No contacts available.'}
            </Text>
          ) : (
            <FlatList
              data={role === 'guest' ? contacts.slice(0, 5) : contacts}
              renderItem={renderContactItem}
              keyExtractor={item => item.uid}
              scrollEnabled={false}
            />
          )}
        </View>

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
