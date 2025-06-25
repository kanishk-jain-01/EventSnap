import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  SafeAreaView,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSnapStore } from '../../store/snapStore';
import { useAuthStore } from '../../store/authStore';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { User } from '../../types';
import { MainStackParamList } from '../../navigation/types';

type RecipientSelectionScreenRouteProp = RouteProp<
  MainStackParamList,
  'RecipientSelection'
>;

type RecipientSelectionScreenNavigationProp =
  NativeStackNavigationProp<MainStackParamList>;

interface RecipientSelectionScreenProps {}

export const RecipientSelectionScreen: React.FC<
  RecipientSelectionScreenProps
> = () => {
  const navigation = useNavigation<RecipientSelectionScreenNavigationProp>();
  const route = useRoute<RecipientSelectionScreenRouteProp>();
  const { imageUri } = route.params;

  const { user } = useAuthStore();
  const {
    availableRecipients,
    selectedRecipients,
    isLoadingRecipients,
    recipientError,
    isSending,
    sendingProgress,
    sendingError,
    loadRecipients,
    selectRecipient,
    deselectRecipient,
    clearSelectedRecipients,
    sendSnap,
    clearError,
    resetSendingState,
  } = useSnapStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [filteredRecipients, setFilteredRecipients] = useState<User[]>([]);

  // Load recipients on screen mount
  useEffect(() => {
    if (user?.uid) {
      loadRecipients(user.uid);
    }

    // Reset sending state when entering screen
    resetSendingState();

    // Cleanup on unmount
    return () => {
      clearSelectedRecipients();
      clearError();
    };
  }, [user?.uid]);

  // Filter recipients based on search query
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredRecipients(availableRecipients);
    } else {
      const filtered = availableRecipients.filter(
        recipient =>
          recipient.displayName
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          recipient.email.toLowerCase().includes(searchQuery.toLowerCase()),
      );
      setFilteredRecipients(filtered);
    }
  }, [availableRecipients, searchQuery]);

  const handleRecipientToggle = (recipient: User) => {
    const isSelected = selectedRecipients.find(r => r.uid === recipient.uid);

    if (isSelected) {
      deselectRecipient(recipient.uid);
    } else {
      selectRecipient(recipient);
    }
  };

  const handleSendSnap = async () => {
    if (!user?.uid) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    if (selectedRecipients.length === 0) {
      Alert.alert('No Recipients', 'Please select at least one recipient');
      return;
    }

    const success = await sendSnap(imageUri, user.uid);

    if (success) {
      Alert.alert(
        'Snap Sent!',
        `Your snap was sent to ${selectedRecipients.length} recipient${selectedRecipients.length > 1 ? 's' : ''}`,
        [
          {
            text: 'OK',
            onPress: () => {
              // Navigate back to camera or main screen
              navigation.replace('MainTabs', { screen: 'Camera' });
            },
          },
        ],
      );
    } else if (sendingError) {
      Alert.alert('Send Failed', sendingError);
    }
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancel Snap',
      'Are you sure you want to cancel sending this snap?',
      [
        { text: 'Keep Editing', style: 'cancel' },
        {
          text: 'Cancel',
          style: 'destructive',
          onPress: () => navigation.goBack(),
        },
      ],
    );
  };

  const renderRecipientItem = ({ item }: { item: User }) => {
    const isSelected = selectedRecipients.find(r => r.uid === item.uid);

    return (
      <TouchableOpacity
        className={`flex-row items-center p-4 border-b border-snap-gray ${
          isSelected ? 'bg-snap-yellow/10' : 'bg-transparent'
        }`}
        onPress={() => handleRecipientToggle(item)}
        disabled={isSending}
      >
        {/* Avatar */}
        <View className='w-12 h-12 rounded-full bg-snap-gray mr-3 items-center justify-center'>
          {item.avatarUrl ? (
            <Image
              source={{ uri: item.avatarUrl }}
              className='w-12 h-12 rounded-full'
              resizeMode='cover'
            />
          ) : (
            <Text className='text-white font-bold text-lg'>
              {item.displayName.charAt(0).toUpperCase()}
            </Text>
          )}
        </View>

        {/* User Info */}
        <View className='flex-1'>
          <Text className='text-white font-semibold text-base'>
            {item.displayName}
          </Text>
          <Text className='text-snap-light-gray text-sm'>{item.email}</Text>
        </View>

        {/* Selection Indicator */}
        <View
          className={`w-6 h-6 rounded-full border-2 items-center justify-center ${
            isSelected
              ? 'bg-snap-yellow border-snap-yellow'
              : 'border-snap-light-gray'
          }`}
        >
          {isSelected && (
            <Text className='text-snap-dark font-bold text-xs'>✓</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderSelectedRecipients = () => {
    if (selectedRecipients.length === 0) return null;

    return (
      <View className='bg-snap-gray p-4 border-b border-snap-light-gray'>
        <Text className='text-snap-yellow font-semibold mb-2'>
          Selected ({selectedRecipients.length})
        </Text>
        <FlatList
          data={selectedRecipients}
          keyExtractor={item => item.uid}
          horizontal
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              className='mr-3 items-center'
              onPress={() => deselectRecipient(item.uid)}
              disabled={isSending}
            >
              <View className='relative'>
                <View className='w-10 h-10 rounded-full bg-snap-dark items-center justify-center'>
                  {item.avatarUrl ? (
                    <Image
                      source={{ uri: item.avatarUrl }}
                      className='w-10 h-10 rounded-full'
                      resizeMode='cover'
                    />
                  ) : (
                    <Text className='text-white font-bold text-sm'>
                      {item.displayName.charAt(0).toUpperCase()}
                    </Text>
                  )}
                </View>
                <View className='absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full items-center justify-center'>
                  <Text className='text-white text-xs font-bold'>×</Text>
                </View>
              </View>
              <Text
                className='text-white text-xs mt-1 text-center max-w-16'
                numberOfLines={1}
              >
                {item.displayName}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>
    );
  };

  if (isLoadingRecipients) {
    return (
      <SafeAreaView className='flex-1 bg-snap-dark'>
        <LoadingSpinner
          size='large'
          text='Loading recipients...'
          overlay={false}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className='flex-1 bg-snap-dark'>
      {/* Header */}
      <View className='flex-row items-center justify-between p-4 border-b border-snap-gray'>
        <TouchableOpacity onPress={handleCancel} disabled={isSending}>
          <Text className='text-white text-base'>Cancel</Text>
        </TouchableOpacity>

        <Text className='text-white font-bold text-lg'>Send To</Text>

        <TouchableOpacity
          onPress={handleSendSnap}
          disabled={selectedRecipients.length === 0 || isSending}
        >
          <Text
            className={`text-base font-semibold ${
              selectedRecipients.length > 0 && !isSending
                ? 'text-snap-yellow'
                : 'text-snap-light-gray'
            }`}
          >
            Send
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View className='p-4 border-b border-snap-gray'>
        <TextInput
          className='bg-snap-gray text-white px-4 py-3 rounded-lg'
          placeholder='Search recipients...'
          placeholderTextColor='#9CA3AF'
          value={searchQuery}
          onChangeText={setSearchQuery}
          editable={!isSending}
        />
      </View>

      {/* Selected Recipients */}
      {renderSelectedRecipients()}

      {/* Sending Progress */}
      {isSending && (
        <View className='bg-snap-yellow p-4'>
          <Text className='text-snap-dark font-semibold text-center mb-2'>
            Sending snap... {Math.round(sendingProgress)}%
          </Text>
          <View className='bg-snap-dark h-2 rounded-full overflow-hidden'>
            <View
              className='bg-snap-yellow h-full transition-all duration-300'
              style={{ width: `${sendingProgress}%` }}
            />
          </View>
        </View>
      )}

      {/* Error Display */}
      {(recipientError || sendingError) && (
        <View className='bg-red-500/20 p-4 border-l-4 border-red-500'>
          <Text className='text-red-400 font-medium'>
            {recipientError || sendingError}
          </Text>
        </View>
      )}

      {/* Recipients List */}
      {filteredRecipients.length > 0 ? (
        <FlatList
          data={filteredRecipients}
          keyExtractor={item => item.uid}
          renderItem={renderRecipientItem}
          className='flex-1'
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      ) : (
        <View className='flex-1 items-center justify-center p-8'>
          <Text className='text-snap-light-gray text-center text-base'>
            {searchQuery.trim() === ''
              ? 'No recipients available'
              : 'No recipients match your search'}
          </Text>
          {searchQuery.trim() !== '' && (
            <TouchableOpacity
              className='mt-4 px-4 py-2 bg-snap-gray rounded-lg'
              onPress={() => setSearchQuery('')}
            >
              <Text className='text-white'>Clear Search</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </SafeAreaView>
  );
};
