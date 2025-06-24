import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, TouchableOpacity } from 'react-native';
import { useAuthStore } from '../store/authStore';
import { MainTabParamList } from '../types';
import { CameraScreen } from '../screens/main/CameraScreen';

const MainTab = createBottomTabNavigator<MainTabParamList>();

// Placeholder screens - these will be implemented in later phases
const HomeScreen: React.FC = () => {
  const { logout, user } = useAuthStore();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <View className='flex-1 bg-snap-dark items-center justify-center p-5'>
      <Text className='text-snap-yellow text-2xl font-bold mb-4 text-center'>
        Welcome, {user?.displayName}!
      </Text>
      <Text className='text-white text-lg mb-8 text-center'>
        Main app coming soon! 🚀
      </Text>

      <View className='bg-snap-gray p-4 rounded-lg mb-8 w-full'>
        <Text className='text-white text-sm mb-2 text-center'>
          Email: {user?.email}
        </Text>
        <Text className='text-white text-sm text-center'>
          User ID: {user?.uid.substring(0, 8)}...
        </Text>
      </View>

      <TouchableOpacity
        className='bg-snap-red px-6 py-3 rounded-lg'
        onPress={handleLogout}
      >
        <Text className='text-white font-semibold'>Logout</Text>
      </TouchableOpacity>
    </View>
  );
};

// CameraScreen is now imported from screens/main/CameraScreen.tsx

const ChatScreen: React.FC = () => (
  <View className='flex-1 bg-snap-dark items-center justify-center'>
    <Text className='text-white text-xl'>Chat Screen</Text>
    <Text className='text-gray-400 text-sm mt-2'>Coming in Phase 7</Text>
  </View>
);

const ProfileScreen: React.FC = () => (
  <View className='flex-1 bg-snap-dark items-center justify-center'>
    <Text className='text-white text-xl'>Profile Screen</Text>
    <Text className='text-gray-400 text-sm mt-2'>Coming in Phase 8</Text>
  </View>
);

export const MainTabNavigator: React.FC = () => {
  return (
    <MainTab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#1F1F1F', // snap-gray
          borderTopColor: '#3A3A3A', // snap-light-gray
          borderTopWidth: 1,
        },
        tabBarActiveTintColor: '#FFFC00', // snap-yellow
        tabBarInactiveTintColor: '#9CA3AF', // gray-400
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}
    >
      <MainTab.Screen
        name='Home'
        component={HomeScreen}
        options={{
          tabBarLabel: 'Stories',
        }}
      />
      <MainTab.Screen
        name='Camera'
        component={CameraScreen}
        options={{
          tabBarLabel: 'Camera',
        }}
      />
      <MainTab.Screen
        name='Chat'
        component={ChatScreen}
        options={{
          tabBarLabel: 'Chat',
        }}
      />
      <MainTab.Screen
        name='Profile'
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
        }}
      />
    </MainTab.Navigator>
  );
};
