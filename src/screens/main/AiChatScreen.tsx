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

  const renderItem = ({ item }: { item: any }) => {
    return (
      <AIMessageBubble
        message={item}
        // Remove onCitationPress prop to let CitationLink handle its own navigation
      />
    );
  };

  return (
    <KeyboardAvoidingView
      className='flex-1 bg-bg-primary'
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={
        Platform.OS === 'ios' ? headerHeight + insets.bottom : 0
      }
    >


      <FlatList
        ref={flatListRef}
        data={aiMessages}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ 
          paddingTop: 24,
          paddingBottom: 24,
          paddingHorizontal: 16,
          flexGrow: 1,
        }}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() =>
          flatListRef.current?.scrollToEnd({ animated: true })
        }
        ListEmptyComponent={
          <View className='flex-1 items-center justify-center px-6 py-12'>
            {/* AI Assistant Header */}
            <View className='items-center mb-8'>
              <View className='w-16 h-16 bg-primary rounded-full items-center justify-center mb-4 shadow-soft'>
                <Text className='text-2xl'>🤖</Text>
              </View>
              <Text className='text-text-primary text-xl font-semibold mb-2'>
                AI Assistant
              </Text>
              <Text className='text-text-secondary text-sm text-center leading-relaxed'>
                I can help you find information about this event
              </Text>
            </View>

            {/* Welcome Message */}
            <View className='bg-surface rounded-2xl p-6 shadow-soft border border-border mb-6 w-full max-w-sm'>
              <Text className='text-text-primary text-lg font-medium text-center mb-3'>
                Ask anything about this event!
              </Text>
              <View className='bg-bg-secondary rounded-xl p-4'>
                <Text className='text-text-secondary text-sm text-center italic'>
                  "What's happening at 2 p.m. today?"
                </Text>
              </View>
              <Text className='text-text-tertiary text-xs text-center mt-3'>
                Try asking about schedules, locations, or event details
              </Text>
            </View>

            {/* Error State */}
            {aiError && (
              <View className='w-full max-w-sm bg-error/5 rounded-2xl p-6 border border-error/20'>
                <View className='flex-row items-center justify-center mb-3'>
                  <View className='w-8 h-8 bg-error/10 rounded-full items-center justify-center mr-3'>
                    <Text className='text-error text-sm'>⚠️</Text>
                  </View>
                  <Text className='text-error text-base font-semibold'>
                    Connection Error
                  </Text>
                </View>
                <Text className='text-error/80 text-sm text-center mb-4 leading-relaxed'>
                  {aiError}
                </Text>
                <View className='flex-row justify-center space-x-3'>
                  <TouchableOpacity 
                    onPress={handleRetryLastQuery} 
                    className='bg-error px-4 py-2 rounded-xl'
                  >
                    <Text className='text-white text-sm font-medium'>
                      Retry
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    onPress={clearAIError} 
                    className='bg-surface border border-error/30 px-4 py-2 rounded-xl'
                  >
                    <Text className='text-error text-sm font-medium'>
                      Dismiss
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        }
      />

      {/* Input Composer */}
      <View className='bg-surface border-t border-border px-4 py-4 shadow-soft'>
        {/* Input Validation Feedback */}
        {inputText.length > 0 && (
          <View className='flex-row justify-between items-center mb-3 px-2'>
            <Text className={`text-xs font-medium ${
              inputText.trim().length < 3 ? 'text-warning' : 'text-success'
            }`}>
              {inputText.trim().length < 3 
                ? 'Ask a more detailed question...' 
                : 'Ready to send'
              }
            </Text>
            <Text className={`text-xs ${
              inputText.length > 450 ? 'text-error' : 'text-text-tertiary'
            }`}>
              {inputText.length}/500
            </Text>
          </View>
        )}
        
        {/* Input Row */}
        <View className='flex-row items-center'>
          {/* Text Input Container */}
          <View className={`flex-1 rounded-2xl px-4 min-h-[48px] border ${
            isLoadingAI 
              ? 'bg-interactive-disabled border-border' 
              : 'bg-bg-secondary border-border focus:border-primary'
          }`}>
            <TextInput
              value={inputText}
              onChangeText={setInputText}
              placeholder={isLoadingAI ? 'Please wait...' : 'Type your question...'}
              placeholderTextColor='#94A3B8'
              className='text-text-primary text-base leading-relaxed py-3'
              style={{ 
                textAlignVertical: 'center',
                paddingTop: 12,
                paddingBottom: 12,
              }}
              multiline
              maxLength={500}
              onSubmitEditing={handleSend}
              blurOnSubmit={false}
              editable={!isLoadingAI}
            />
          </View>

          {/* Send Button */}
          <TouchableOpacity
            onPress={handleSend}
            disabled={!inputText.trim() || isLoadingAI}
            className={`w-12 h-12 rounded-2xl items-center justify-center shadow-soft ml-4 ${
              inputText.trim() && !isLoadingAI 
                ? 'bg-primary' 
                : 'bg-interactive-disabled border border-border'
            }`}
          >
            {isLoadingAI ? (
              <LoadingSpinner size='small' color='#7C3AED' />
            ) : (
              <Text
                className={`text-lg font-bold ${
                  inputText.trim() ? 'text-white' : 'text-text-tertiary'
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