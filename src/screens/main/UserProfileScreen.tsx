import React, { useEffect, useState } from 'react';
import { View, Text, Image, ActivityIndicator, ScrollView } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { MainStackParamList } from '../../navigation/types';
import { FirestoreService } from '../../services/firestore.service';
import type { User } from '../../types';

export const UserProfileScreen: React.FC = () => {
  const route = useRoute<RouteProp<MainStackParamList, 'UserProfile'>>();
  const { userId } = route.params;
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetch = async () => {
      const res = await FirestoreService.getUser(userId);
      if (res.success && res.data) {
        setUser(res.data);
      } else {
        setError(res.error || 'Failed to load user');
      }
      setLoading(false);
    };
    fetch();
  }, [userId]);

  if (loading) {
    return (
      <View className='flex-1 bg-snap-dark items-center justify-center'>
        <ActivityIndicator size='large' color='#FFFC00' />
      </View>
    );
  }

  if (!user || error) {
    return (
      <View className='flex-1 bg-snap-dark items-center justify-center'>
        <Text className='text-white'>User not found.</Text>
      </View>
    );
  }

  return (
    <ScrollView className='flex-1 bg-snap-dark' contentContainerStyle={{ alignItems: 'center', padding: 20 }}>
      {user.avatarUrl ? (
        <Image source={{ uri: user.avatarUrl }} className='w-32 h-32 rounded-full border-4 border-snap-yellow' />
      ) : (
        <View className='w-32 h-32 rounded-full bg-snap-gray items-center justify-center'>
          <Text className='text-white text-4xl font-bold'>
            {user.displayName.charAt(0).toUpperCase()}
          </Text>
        </View>
      )}
      <Text className='text-white text-2xl font-semibold mt-4'>{user.displayName}</Text>
      <Text className='text-gray-400 mt-1'>{user.email}</Text>
      {/* Additional user info / friend button will come in future tasks */}
    </ScrollView>
  );
}; 