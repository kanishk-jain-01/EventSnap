import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,

} from 'react-native';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MainStackParamList } from '../../navigation/types';
import { useChatStore, useChatMessages, useTypingUsers } from '../../store/chatStore';
import { useAuthStore } from '../../store/authStore';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import type { ChatMessage } from '../../services/realtime/models';

type ChatScreenRouteProp = RouteProp<MainStackParamList, 'ChatScreen'>;
type ChatScreenNavigationProp = NativeStackNavigationProp<MainStackParamList, 'ChatScreen'>;

interface MessageItemProps {
  message: ChatMessage;
  isFromCurrentUser: boolean;
  showTimestamp?: boolean;
}

const MessageItem: React.FC<MessageItemProps> = ({
  message,
  isFromCurrentUser,
  showTimestamp = false,
}) => {
  // Format timestamp
  const formatTimestamp = (timestamp: number | object) => {
    const date = typeof timestamp === 'number' ? new Date(timestamp) : new Date();
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Get status indicator with enhanced visual distinction
  const getStatusIndicator = () => {
    if (!isFromCurrentUser) return null;
    
    switch (message.status) {
      case 'sending':
        return { icon: '⏳', color: 'text-gray-400', description: 'Sending...' };
      case 'sent':
        return { icon: '✓', color: 'text-gray-400', description: 'Sent' };
      case 'delivered':
        return { icon: '✓✓', color: 'text-blue-400', description: 'Delivered' };
      case 'read':
        return { icon: '✓✓', color: 'text-snap-yellow', description: 'Read' };
      case 'failed':
        return { icon: '❌', color: 'text-red-400', description: 'Failed to send' };
      default:
        return null;
    }
  };

  // Format read time for read messages
  const getReadTime = () => {
    if (message.status === 'read' && message.readAt) {
      const readTime = typeof message.readAt === 'number' 
        ? message.readAt 
        : Date.now();
      return formatTimestamp(readTime);
    }
    return null;
  };

  return (
    <View className={`mb-2 px-4 ${isFromCurrentUser ? 'items-end' : 'items-start'}`}>
      <View
        className={`max-w-[80%] rounded-2xl px-4 py-2 ${
          isFromCurrentUser
            ? 'bg-snap-yellow'
            : 'bg-gray-700'
        }`}
      >
        {message.type === 'text' && (
          <Text
            className={`text-base ${
              isFromCurrentUser ? 'text-black' : 'text-white'
            }`}
          >
            {message.content}
          </Text>
        )}
        
        {message.type === 'image' && (
          <View>
            <Text
              className={`text-base ${
                isFromCurrentUser ? 'text-black' : 'text-white'
              }`}
            >
              📷 Photo
            </Text>
            <Text
              className={`text-xs mt-1 ${
                isFromCurrentUser ? 'text-gray-700' : 'text-gray-300'
              }`}
            >
              Image messages coming soon
            </Text>
          </View>
        )}
        
        {message.type === 'system' && (
          <Text className="text-gray-400 text-sm italic">
            {message.content}
          </Text>
        )}
      </View>
      
      {/* Timestamp and status */}
      <View className="flex-row items-center mt-1">
        {showTimestamp && (
          <Text className="text-gray-400 text-xs mr-1">
            {formatTimestamp(message.timestamp)}
          </Text>
        )}
        {getStatusIndicator() && (
          <TouchableOpacity
            onLongPress={() => {
              const statusInfo = getStatusIndicator();
              if (statusInfo) {
                Alert.alert(
                  'Message Status',
                  `${statusInfo.description}${
                    message.status === 'read' && getReadTime() 
                      ? `\nRead at ${getReadTime()}` 
                      : ''
                  }`,
                  [{ text: 'OK' }],
                );
              }
            }}
            activeOpacity={0.7}
          >
            <Text className={`text-xs ${getStatusIndicator()?.color || 'text-gray-400'}`}>
              {getStatusIndicator()?.icon}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const TypingIndicator: React.FC<{ typingUsers: string[] }> = ({ typingUsers }) => {
  if (typingUsers.length === 0) return null;
  
  return (
    <View className="px-4 py-2">
      <View className="bg-gray-700 rounded-2xl px-4 py-2 max-w-[60%]">
        <Text className="text-gray-300 text-sm">
          {typingUsers.length === 1 ? 'Typing...' : `${typingUsers.length} people typing...`}
        </Text>
      </View>
    </View>
  );
};

export const ChatScreen: React.FC = () => {
  const route = useRoute<ChatScreenRouteProp>();
  const navigation = useNavigation<ChatScreenNavigationProp>();
  const { chatId, recipientName, recipientId } = route.params;
  
  const { user } = useAuthStore();
  const chatStore = useChatStore();
  
  const messages = chatStore.messages[chatId] || [];
  const typingUsers = chatStore.typingUsers[chatId] || [];
  const isLoadingMessages = chatStore.isLoadingMessages;
  
  const [messageText, setMessageText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isSending, setIsSending] = useState(false);
  
  const flatListRef = useRef<FlatList>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const markedAsReadRef = useRef<Set<string>>(new Set());
  const loadedChatsRef = useRef<Set<string>>(new Set());
  
  // Set active conversation on mount
  useEffect(() => {
    chatStore.setActiveConversation(chatId);
    
    return () => {
      chatStore.setActiveConversation(null);
    };
  }, [chatId, chatStore]);
  
  // Load messages on mount
  useEffect(() => {
    if (user?.uid && !loadedChatsRef.current.has(chatId)) {
      loadedChatsRef.current.add(chatId);
      chatStore.loadMessages(chatId);
    }
  }, [chatId, user?.uid, chatStore]);
  
  // Set navigation title
  useEffect(() => {
    navigation.setOptions({
      title: recipientName,
    });
  }, [navigation, recipientName]);
  
  // Mark messages as read when screen is focused
  useEffect(() => {
    if (user?.uid && messages.length > 0) {
      const unreadMessages = messages.filter(
        msg => msg.senderId !== user.uid && 
               msg.status !== 'read' && 
               !markedAsReadRef.current.has(msg.id),
      );
      
      if (unreadMessages.length > 0) {
        const messageIds = unreadMessages.map(msg => msg.id);
        
        // Mark these messages as "being processed" to prevent duplicate calls
        messageIds.forEach(id => markedAsReadRef.current.add(id));
        
        chatStore.markMessagesAsRead(chatId, messageIds, user.uid);
      }
    }
  }, [messages, user?.uid, chatId, chatStore]);
  
  // Handle typing indicator
  const handleTyping = useCallback((text: string) => {
    setMessageText(text);
    
    if (!user?.uid) return;
    
    const isCurrentlyTyping = text.length > 0;
    
    if (isCurrentlyTyping !== isTyping) {
      setIsTyping(isCurrentlyTyping);
      chatStore.setTyping(chatId, user.uid, isCurrentlyTyping);
    }
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Set new timeout to stop typing indicator
    if (isCurrentlyTyping) {
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        chatStore.setTyping(chatId, user.uid, false);
      }, 3000);
    }
  }, [user?.uid, chatId, isTyping, chatStore]);
  
  // Send message
  const handleSendMessage = useCallback(async () => {
    if (!messageText.trim() || !user?.uid || isSending) return;
    
    const content = messageText.trim();
    setMessageText('');
    setIsSending(true);
    
    // Stop typing indicator
    if (isTyping) {
      setIsTyping(false);
      chatStore.setTyping(chatId, user.uid, false);
    }
    
         try {
       await chatStore.sendMessage(chatId, user.uid, {
         recipientId,
         content,
         type: 'text',
       });
      
      // Scroll to bottom after sending
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (_error) {
      Alert.alert('Error', 'Failed to send message');
      setMessageText(content); // Restore message text on error
    } finally {
      setIsSending(false);
    }
  }, [messageText, user?.uid, isSending, isTyping, chatId, recipientId, chatStore]);
  
  // Handle error display
  useEffect(() => {
    if (chatStore.error) {
      Alert.alert('Error', chatStore.error, [
        { text: 'OK', onPress: chatStore.clearError },
      ]);
    }
  }, [chatStore.error, chatStore.clearError]);
  
  // Cleanup typing timeout and refs
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      // Clean up refs when component unmounts
      loadedChatsRef.current.delete(chatId);
      markedAsReadRef.current.clear();
    };
  }, [chatId]);
  
  // Determine if we should show timestamp for message
  const shouldShowTimestamp = useCallback((message: ChatMessage, index: number) => {
    if (index === 0) return true;
    
    const prevMessage = messages[index - 1];
    if (!prevMessage) return true;
    
    const currentTime = typeof message.timestamp === 'number' ? message.timestamp : Date.now();
    const prevTime = typeof prevMessage.timestamp === 'number' ? prevMessage.timestamp : Date.now();
    
    // Show timestamp if more than 5 minutes apart
    return (currentTime - prevTime) > 5 * 60 * 1000;
  }, [messages]);
  
  const isLoading = isLoadingMessages[chatId];
  
  if (isLoading && messages.length === 0) {
    return (
      <View className="flex-1 bg-snap-dark items-center justify-center">
        <LoadingSpinner size="large" color="#FFFC00" />
        <Text className="text-white text-lg mt-4">Loading messages...</Text>
      </View>
    );
  }
  
  return (
    <KeyboardAvoidingView
      className="flex-1 bg-snap-dark"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Messages List */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <MessageItem
            message={item}
            isFromCurrentUser={item.senderId === user?.uid}
            showTimestamp={shouldShowTimestamp(item, index)}
          />
        )}
        contentContainerStyle={{ paddingVertical: 16 }}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => {
          // Auto-scroll to bottom when new messages arrive
          if (messages.length > 0) {
            flatListRef.current?.scrollToEnd({ animated: true });
          }
        }}
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center px-8 py-16">
            <Text className="text-gray-400 text-lg text-center mb-2">
              No messages yet
            </Text>
            <Text className="text-gray-500 text-sm text-center">
              Start the conversation with {recipientName}
            </Text>
          </View>
        }
        ListFooterComponent={
          <TypingIndicator typingUsers={typingUsers} />
        }
      />
      
      {/* Message Input */}
      <View className="border-t border-gray-800 px-4 py-3">
        <View className="flex-row items-end space-x-3">
          <View className="flex-1 bg-gray-700 rounded-2xl px-4 py-2 min-h-[40px] justify-center">
            <TextInput
              value={messageText}
              onChangeText={handleTyping}
              placeholder="Type a message..."
              placeholderTextColor="#9CA3AF"
              className="text-white text-base"
              multiline
              maxLength={1000}
              onSubmitEditing={handleSendMessage}
              blurOnSubmit={false}
            />
          </View>
          
          <TouchableOpacity
            onPress={handleSendMessage}
            disabled={!messageText.trim() || isSending}
            className={`w-10 h-10 rounded-full items-center justify-center ${
              messageText.trim() && !isSending
                ? 'bg-snap-yellow'
                : 'bg-gray-600'
            }`}
          >
            {isSending ? (
              <LoadingSpinner size="small" color="#000000" />
            ) : (
              <Text className={`text-lg font-bold ${
                messageText.trim() ? 'text-black' : 'text-gray-400'
              }`}>
                ➤
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}; 