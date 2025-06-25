import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useUserStore } from '../../store/userStore';
import type { User } from '../../types';
import { MainStackParamList } from '../../navigation/types';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

export const UserSearchScreen: React.FC = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const { searchUsers, allUsers, isLoading } = useUserStore();
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);

  const handleSearch = useCallback(async (text: string) => {
    setQuery(text);
    setSearching(true);
    await searchUsers(text);
    setSearching(false);
  }, []);

  const renderItem = ({ item }: { item: User }) => (
    <TouchableOpacity
      className='flex-row items-center py-3 px-4 border-b border-snap-light-gray'
      onPress={() => navigation.navigate('UserProfile', { userId: item.uid })}
    >
      {item.avatarUrl ? (
        <Image
          source={{ uri: item.avatarUrl }}
          className='w-12 h-12 rounded-full mr-4'
        />
      ) : (
        <View className='w-12 h-12 rounded-full bg-snap-gray items-center justify-center mr-4'>
          <Text className='text-white font-bold text-lg'>
            {item.displayName.charAt(0).toUpperCase()}
          </Text>
        </View>
      )}
      <Text className='text-white text-base'>{item.displayName}</Text>
    </TouchableOpacity>
  );

  return (
    <View className='flex-1 bg-snap-dark'>
      {/* Search bar */}
      <View className='p-4'>
        <TextInput
          className='bg-snap-gray text-white rounded-lg px-4 py-3'
          placeholder='Search by display name'
          placeholderTextColor='#9CA3AF'
          value={query}
          onChangeText={handleSearch}
        />
      </View>

      {/* Results */}
      {searching || isLoading ? (
        <ActivityIndicator
          size='large'
          color='#FFFC00'
          style={{ marginTop: 20 }}
        />
      ) : (
        <FlatList
          data={allUsers}
          keyExtractor={item => item.uid}
          renderItem={renderItem}
          ListEmptyComponent={() => (
            <Text className='text-gray-400 text-center mt-10'>
              No users found.
            </Text>
          )}
        />
      )}
    </View>
  );
};
