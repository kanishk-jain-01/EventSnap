import React, { useEffect, useState } from 'react';
import { View, Text, Image, TouchableOpacity, Alert, ScrollView } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAuthStore } from '../../store/authStore';
import { useUserStore } from '../../store/userStore';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MainStackParamList } from '../../navigation/types';

export const ProfileScreen: React.FC = () => {
  const { user: authUser } = useAuthStore();
  const {
    currentUser,
    isLoading,
    error,
    fetchCurrentUser,
    updateProfile,
    uploadAvatar,
  } = useUserStore();
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();

  const [displayName, setDisplayName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

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
  }, [currentUser?.displayName]);

  const handlePickAvatar = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Permission required', 'Media library permission is required to pick an avatar.');
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

  if (isLoading && !currentUser) {
    return (
      <View className='flex-1 bg-snap-dark items-center justify-center'>
        <LoadingSpinner text='Loading profile...' />
      </View>
    );
  }

  return (
    <ScrollView className='flex-1 bg-snap-dark' contentContainerStyle={{ padding: 20 }}>
      {/* Avatar */}
      <View className='items-center mb-8'>
        <TouchableOpacity onPress={handlePickAvatar} disabled={avatarUploading}>
          {currentUser?.avatarUrl ? (
            <Image
              source={{ uri: currentUser.avatarUrl }}
              className='w-32 h-32 rounded-full border-4 border-snap-yellow'
            />
          ) : (
            <View className='w-32 h-32 rounded-full bg-snap-gray items-center justify-center'>
              <Text className='text-snap-light-gray text-4xl font-bold'>
                {currentUser?.displayName?.charAt(0)?.toUpperCase() || '?'}
              </Text>
            </View>
          )}
          {avatarUploading && (
            <View className='absolute inset-0 bg-black/60 rounded-full items-center justify-center'>
              <LoadingSpinner text={`${uploadProgress.toFixed(0)}%`} />
            </View>
          )}
        </TouchableOpacity>
        <Text className='text-gray-400 mt-2'>Tap to change avatar</Text>
      </View>

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

      {/* Navigate to search */}
      <View className='mt-4'>
        <Button
          title='Find Friends'
          onPress={() => navigation.navigate('UserSearch')}
          variant='secondary'
          size='medium'
          disabled={avatarUploading || isSaving}
        />
      </View>

      {error && (
        <Text className='text-red-500 text-sm mt-4 text-center'>{error}</Text>
      )}
    </ScrollView>
  );
}; 