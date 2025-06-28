import React, { useState, useRef } from 'react';
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
import { useHeaderHeight } from '@react-navigation/elements';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { AIMessageBubble } from '../../components/features/chat/AIMessageBubble';
import { useAIMessages, useIsLoadingAI, useAIError, useChatStore } from '../../store/chatStore';

interface Citation {
  documentId: string;
  documentName: string;
  chunkIndex: number;
  excerpt: string;
  storagePath: string;
}

export const AiChatScreen: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const flatListRef = useRef<FlatList>(null);

  // AI store hooks
  const aiMessages = useAIMessages();
  const isLoadingAI = useIsLoadingAI();
  const aiError = useAIError();
  const { sendAIQuery, clearAIError } = useChatStore();

  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text) return;

    // Basic input validation
    if (text.length < 3) {
      Alert.alert(
        'Question too short',
        'Please ask a more detailed question (at least 3 characters).',
        [{ text: 'OK' }],
      );
      return;
    }

    setInputText('');
    
    try {
      await sendAIQuery(text);
      // Scroll to bottom after sending
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error('Failed to send AI query:', error);
      Alert.alert(
        'Failed to send question',
        'Please check your connection and try again.',
        [{ text: 'OK' }],
      );
    }
  };

  const handleRetryLastQuery = () => {
    const lastMessage = aiMessages[aiMessages.length - 1];
    if (lastMessage && lastMessage.error) {
      sendAIQuery(lastMessage.question);
    }
  };

  const handleCitationPress = (citation: Citation) => {
    // TODO: Navigate to document viewer (will be implemented in task 5.0)
    Alert.alert(
      'Document Citation',
      `Opening "${citation.documentName}" is coming soon!`,
      [{ text: 'OK' }],
    );
  };

  const renderItem = ({ item }: { item: any }) => {
    return (
      <AIMessageBubble
        message={item}
        onCitationPress={handleCitationPress}
      />
    );
  };

  return (
    <KeyboardAvoidingView
      className='flex-1 bg-snap-dark'
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={
        Platform.OS === 'ios' ? headerHeight + insets.bottom : 0
      }
    >
      {/* AI Processing Status Bar */}
      {isLoadingAI && (
        <View className='bg-blue-900 border-b border-blue-700 px-4 py-2'>
          <View className='flex-row items-center justify-center'>
            <LoadingSpinner size='small' color='#60a5fa' />
            <Text className='text-blue-300 text-sm ml-2 font-medium'>
              AI is analyzing documents...
            </Text>
          </View>
        </View>
      )}

      <FlatList
        ref={flatListRef}
        data={aiMessages}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingVertical: 16 }}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() =>
          flatListRef.current?.scrollToEnd({ animated: true })
        }
        ListEmptyComponent={
          <View className='flex-1 items-center justify-center px-8 py-16'>
            <Text className='text-gray-400 text-lg text-center mb-2'>
              Ask anything about this event!
            </Text>
            <Text className='text-gray-500 text-sm text-center'>
              Example: "What\'s at 2 p.m. today?"
            </Text>
            {aiError && (
              <View className='mt-4 p-4 bg-red-900 rounded-lg border border-red-700'>
                <View className='flex-row items-center justify-center mb-2'>
                  <Text className='text-red-300 text-lg mr-2'>⚠️</Text>
                  <Text className='text-red-300 text-sm font-semibold'>
                    Connection Error
                  </Text>
                </View>
                <Text className='text-red-300 text-xs text-center mb-3'>
                  {aiError}
                </Text>
                <View className='flex-row justify-center space-x-4'>
                  <TouchableOpacity 
                    onPress={handleRetryLastQuery} 
                    className='bg-red-700 px-3 py-1 rounded'
                  >
                    <Text className='text-red-200 text-xs font-medium'>
                      Retry
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={clearAIError} className='px-3 py-1'>
                    <Text className='text-red-400 text-xs underline'>
                      Dismiss
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        }
      />

      {/* Composer */}
      <View className='border-t border-gray-800 px-4 py-3'>
        {/* Character count and validation */}
        {inputText.length > 0 && (
          <View className='flex-row justify-between items-center mb-2 px-2'>
            <Text className={`text-xs ${
              inputText.trim().length < 3 ? 'text-yellow-400' : 'text-gray-500'
            }`}>
              {inputText.trim().length < 3 
                ? 'Ask a more detailed question...' 
                : 'Ready to send'
              }
            </Text>
            <Text className={`text-xs ${
              inputText.length > 450 ? 'text-red-400' : 'text-gray-500'
            }`}>
              {inputText.length}/500
            </Text>
          </View>
        )}
        
        <View className='flex-row items-end space-x-3'>
          <View className={`flex-1 rounded-2xl px-4 py-2 min-h-[40px] justify-center ${
            isLoadingAI ? 'bg-gray-800' : 'bg-gray-700'
          }`}>
            <TextInput
              value={inputText}
              onChangeText={setInputText}
              placeholder={isLoadingAI ? 'Please wait...' : 'Type your question...'}
              placeholderTextColor='#9CA3AF'
              className='text-white text-base'
              multiline
              maxLength={500}
              onSubmitEditing={handleSend}
              blurOnSubmit={false}
              editable={!isLoadingAI}
            />
          </View>
          <TouchableOpacity
            onPress={handleSend}
            disabled={!inputText.trim() || isLoadingAI}
            className={`w-10 h-10 rounded-full items-center justify-center ${
              inputText.trim() && !isLoadingAI ? 'bg-snap-yellow' : 'bg-gray-600'
            }`}
          >
            {isLoadingAI ? (
              <LoadingSpinner size='small' color='#000000' />
            ) : (
              <Text
                className={`text-lg font-bold ${
                  inputText.trim() ? 'text-black' : 'text-gray-400'
                }`}
              >
                ➤
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}; 