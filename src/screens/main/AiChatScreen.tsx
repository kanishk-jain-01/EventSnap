import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useHeaderHeight } from '@react-navigation/elements';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export const AiChatScreen: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text) return;

    const userMsg: ChatMessage = {
      id: `${Date.now()}-user`,
      role: 'user',
      content: text,
    };

    // Optimistically add user message
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsSending(true);

    try {
      // TODO: Replace with real sendAIQuery in future implementation
      // Simulate AI response
      const assistantMsg: ChatMessage = {
        id: `${Date.now()}-ai`,
        role: 'assistant',
        content: '🤖 This is a placeholder AI response. (Integration coming soon!)',
      };
      setTimeout(() => {
        setMessages(prev => [...prev, assistantMsg]);
        setIsSending(false);
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 600);
    } catch (_err) {
      // eslint-disable-next-line no-console
      console.error(_err);
      setIsSending(false);
    }
  };

  const renderItem = ({ item }: { item: ChatMessage }) => {
    const isUser = item.role === 'user';
    return (
      <View
        className={`mb-2 px-4 ${isUser ? 'items-end' : 'items-start'}`}
      >
        <View
          className={`max-w-[80%] rounded-2xl px-4 py-2 ${
            isUser ? 'bg-snap-yellow' : 'bg-gray-700'
          }`}
        >
          <Text className={`${isUser ? 'text-black' : 'text-white'}`}>{
            item.content
          }</Text>
        </View>
      </View>
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
      <FlatList
        ref={flatListRef}
        data={messages}
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
          </View>
        }
      />

      {/* Composer */}
      <View className='border-t border-gray-800 px-4 py-3'>
        <View className='flex-row items-end space-x-3'>
          <View className='flex-1 bg-gray-700 rounded-2xl px-4 py-2 min-h-[40px] justify-center'>
            <TextInput
              value={inputText}
              onChangeText={setInputText}
              placeholder='Type your question...'
              placeholderTextColor='#9CA3AF'
              className='text-white text-base'
              multiline
              maxLength={500}
              onSubmitEditing={handleSend}
              blurOnSubmit={false}
            />
          </View>
          <TouchableOpacity
            onPress={handleSend}
            disabled={!inputText.trim() || isSending}
            className={`w-10 h-10 rounded-full items-center justify-center ${
              inputText.trim() && !isSending ? 'bg-snap-yellow' : 'bg-gray-600'
            }`}
          >
            {isSending ? (
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