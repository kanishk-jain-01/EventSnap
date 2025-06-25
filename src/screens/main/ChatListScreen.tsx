import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MainStackParamList } from '../../navigation/types';
import { useChatStore } from '../../store/chatStore';
import { useAuthStore } from '../../store/authStore';
import { FirestoreService } from '../../services/firestore.service';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { Button } from '../../components/ui/Button';
import type { ChatConversation } from '../../services/realtime/models';
import type { User } from '../../types';

type ChatListNavigationProp = NativeStackNavigationProp<MainStackParamList>;

interface ConversationItemProps {
  conversation: ChatConversation;
  currentUserId: string;
  otherUser: User | null;
  onPress: () => void;
}

const ConversationItem: React.FC<ConversationItemProps> = ({
  conversation,
  currentUserId,
  otherUser,
  onPress,
}) => {
  const unreadCount = conversation.unreadCount[currentUserId] || 0;
  const isArchived = conversation.isArchived[currentUserId] || false;
  const isMuted = conversation.isMuted[currentUserId] || false;

  // Format timestamp
  const formatTimestamp = (timestamp: number | object | null) => {
    if (!timestamp) return '';
    
    const date = typeof timestamp === 'number' ? new Date(timestamp) : new Date();
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return 'now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d`;
    }
  };

  // Get last message preview
  const getLastMessagePreview = () => {
    if (!conversation.lastMessage) return 'No messages yet';
    
    const { content, type, senderId } = conversation.lastMessage;
    const isFromCurrentUser = senderId === currentUserId;
    const prefix = isFromCurrentUser ? 'You: ' : '';
    
    if (type === 'image') {
      return `${prefix}📷 Photo`;
    }
    
    return `${prefix}${content.length > 40 ? content.substring(0, 40) + '...' : content}`;
  };

  // Get last message status indicator (only for messages from current user)
  const getLastMessageStatus = () => {
    if (!conversation.lastMessage || conversation.lastMessage.senderId !== currentUserId) {
      return null;
    }
    
    // Note: LastMessageInfo doesn't include status, so we'll show a generic indicator
    // In a real implementation, you'd include status in LastMessageInfo
    return '✓'; // Generic sent indicator for now
  };

  if (isArchived) return null;

  return (
    <TouchableOpacity
      onPress={onPress}
      className="flex-row items-center px-4 py-3 border-b border-gray-800"
      activeOpacity={0.7}
    >
      {/* Avatar */}
      <View className="w-12 h-12 rounded-full bg-gray-600 items-center justify-center mr-3">
        {otherUser?.avatarUrl ? (
          <Text className="text-white text-lg font-semibold">
            {otherUser.displayName.charAt(0).toUpperCase()}
          </Text>
        ) : (
          <Text className="text-white text-lg font-semibold">
            {otherUser?.displayName.charAt(0).toUpperCase() || '?'}
          </Text>
        )}
      </View>

      {/* Conversation Info */}
      <View className="flex-1">
        <View className="flex-row items-center justify-between mb-1">
          <Text className="text-white text-base font-semibold" numberOfLines={1}>
            {otherUser?.displayName || 'Unknown User'}
          </Text>
          <View className="flex-row items-center">
            {isMuted && (
              <Text className="text-gray-400 text-xs mr-2">🔇</Text>
            )}
            <Text className="text-gray-400 text-xs">
              {formatTimestamp(conversation.lastMessageAt)}
            </Text>
          </View>
        </View>
        
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center flex-1 mr-2">
            <Text 
              className="text-gray-300 text-sm flex-1" 
              numberOfLines={1}
            >
              {getLastMessagePreview()}
            </Text>
            {getLastMessageStatus() && (
              <Text className="text-gray-400 text-xs ml-1">
                {getLastMessageStatus()}
              </Text>
            )}
          </View>
          
          {unreadCount > 0 && (
            <View className="bg-snap-yellow rounded-full min-w-[20px] h-5 items-center justify-center px-1">
              <Text className="text-black text-xs font-bold">
                {unreadCount > 99 ? '99+' : unreadCount}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

export const ChatListScreen: React.FC = () => {
  const navigation = useNavigation<ChatListNavigationProp>();
  const { user } = useAuthStore();
  const {
    conversations,
    isLoading,
    error,
    loadConversations,
    createConversation,
    clearError,
  } = useChatStore();

  const [users, setUsers] = useState<User[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Load conversations on mount
  useEffect(() => {
    if (user?.uid) {
      console.log('ChatListScreen: Loading conversations for user:', user.uid);
      loadConversations(user.uid);
    } else {
      console.log('ChatListScreen: No user UID available');
    }
  }, [user?.uid, loadConversations]);

  // Debug logging for conversations state
  useEffect(() => {
    console.log('ChatListScreen: Conversations updated:', {
      count: conversations.length,
      isLoading,
      error,
      conversations: conversations.map(c => ({ id: c.id, participants: c.participants })),
    });
  }, [conversations, isLoading, error]);

  // Load all users for creating new conversations
  const loadUsers = useCallback(async () => {
    if (!user?.uid) {
      console.log('ChatListScreen: No user UID for loading users');
      return;
    }
    
    console.log('ChatListScreen: Loading users...');
    setIsLoadingUsers(true);
    try {
      const response = await FirestoreService.getAllUsers(user.uid);
      console.log('ChatListScreen: Users response:', { success: response.success, userCount: response.data?.length || 0 });
      if (response.success && response.data) {
        setUsers(response.data);
        console.log('ChatListScreen: Users loaded:', response.data.length);
      } else {
        console.log('ChatListScreen: No users found or failed to load');
      }
    } catch (_error) {
      // eslint-disable-next-line no-console
      console.error('ChatListScreen: Error loading users:', _error);
    } finally {
      setIsLoadingUsers(false);
    }
  }, [user?.uid]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // Handle refresh
  const onRefresh = useCallback(async () => {
    if (!user?.uid) return;
    
    setRefreshing(true);
    try {
      await Promise.all([
        loadConversations(user.uid),
        loadUsers(),
      ]);
    } finally {
      setRefreshing(false);
    }
  }, [user?.uid, loadConversations, loadUsers]);

  // Navigate to individual chat
  const handleConversationPress = useCallback((conversation: ChatConversation) => {
    if (!user?.uid) return;
    
    // Find the other user in the conversation
    const otherUserId = conversation.participants.find(id => id !== user.uid);
    if (!otherUserId) return;
    
    const otherUser = users.find(u => u.uid === otherUserId);
    
    navigation.navigate('ChatScreen', {
      chatId: conversation.id,
      recipientId: otherUserId,
      recipientName: otherUser?.displayName || 'Unknown User',
    });
  }, [user?.uid, users, navigation]);

  // Start new conversation
  const handleNewConversation = useCallback(() => {
    if (!user?.uid || users.length === 0) {
      Alert.alert('No Users', 'No other users available to chat with.');
      return;
    }

    // Show user selection (for now, just pick the first user as demo)
    // In a real app, you'd show a user selection modal
    const userButtons = users.slice(0, 5).map(otherUser => ({
      text: otherUser.displayName,
      onPress: async () => {
        try {
          const chatId = await createConversation(user.uid, otherUser.uid);
          navigation.navigate('ChatScreen', {
            chatId,
            recipientId: otherUser.uid,
            recipientName: otherUser.displayName,
          });
        } catch (_error) {
          Alert.alert('Error', 'Failed to create conversation');
        }
      },
    }));
    
    userButtons.push({ text: 'Cancel', style: 'cancel' } as any);
    
    Alert.alert(
      'New Chat',
      'Select a user to start chatting with:',
      userButtons,
    );
  }, [user?.uid, users, createConversation, navigation]);

  // Get other user for conversation
  const getOtherUser = useCallback((conversation: ChatConversation): User | null => {
    if (!user?.uid) return null;
    
    const otherUserId = conversation.participants.find(id => id !== user.uid);
    if (!otherUserId) return null;
    
    return users.find(u => u.uid === otherUserId) || null;
  }, [user?.uid, users]);

  // Handle error display
  useEffect(() => {
    if (error) {
      Alert.alert('Error', error, [
        { text: 'OK', onPress: clearError },
      ]);
    }
  }, [error, clearError]);

  // Filter out archived conversations
  const activeConversations = conversations.filter(
    conv => !conv.isArchived[user?.uid || ''],
  );

  if (isLoading && conversations.length === 0) {
    return (
      <View className="flex-1 bg-snap-dark items-center justify-center">
        <LoadingSpinner size="large" color="#FFFC00" />
        <Text className="text-white text-lg mt-4">Loading conversations...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-snap-dark">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-800">
        <Text className="text-white text-xl font-bold">Chats</Text>
        <Button
          title="New"
          onPress={handleNewConversation}
          variant="outline"
          size="small"
          disabled={isLoadingUsers || users.length === 0}
        />
      </View>

      {/* Conversations List */}
      {activeConversations.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-gray-400 text-lg text-center mb-4">
            No conversations yet
          </Text>
          <Text className="text-gray-500 text-sm text-center mb-6">
            Start a new conversation to begin chatting with friends
          </Text>
          <Button
            title="Start New Chat"
            onPress={handleNewConversation}
            variant="primary"
            disabled={isLoadingUsers || users.length === 0}
          />
        </View>
      ) : (
        <FlatList
          data={activeConversations}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ConversationItem
              conversation={item}
              currentUserId={user?.uid || ''}
              otherUser={getOtherUser(item)}
              onPress={() => handleConversationPress(item)}
            />
          )}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#FFFC00"
              colors={['#FFFC00']}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}; 