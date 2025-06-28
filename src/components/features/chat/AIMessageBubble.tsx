import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { CitationLink } from '../documents/CitationLink';

interface Citation {
  documentId: string;
  documentName: string;
  chunkIndex: number;
  excerpt: string;
  storagePath: string;
}

interface AIMessage {
  id: string;
  question: string;
  answer: string;
  citations: Citation[];
  timestamp: number;
  isLoading?: boolean;
  error?: string;
}

interface AIMessageBubbleProps {
  message: AIMessage;
  onCitationPress?: (_citation: Citation) => void;
}

export const AIMessageBubble: React.FC<AIMessageBubbleProps> = ({
  message,
  onCitationPress,
}) => {
  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <View className='my-3'>
      {/* User Question */}
      <View className='self-end bg-primary rounded-2xl px-4 py-3 max-w-[80%] mb-3 shadow-soft'>
        <Text className='text-white text-base leading-relaxed'>
          {message.question}
        </Text>
        <Text className='text-white/80 text-xs text-right mt-2'>
          {formatTime(message.timestamp)}
        </Text>
      </View>

      {/* AI Response */}
      <View className='self-start bg-surface rounded-2xl p-4 max-w-[90%] border border-border shadow-soft'>
        {/* AI Header */}
        <View className='flex-row items-center mb-4'>
          <View className='w-8 h-8 bg-success rounded-full items-center justify-center mr-3'>
            <Text className='text-white text-xs font-bold'>AI</Text>
          </View>
          <Text className='text-success text-sm font-semibold'>
            Assistant
          </Text>
        </View>

        {message.isLoading ? (
          <View className='py-3'>
            <View className='flex-row items-center mb-3'>
              <ActivityIndicator size="small" color="#7C3AED" />
              <Text className='text-text-secondary text-sm font-medium ml-3'>
                Searching documents...
              </Text>
            </View>
            <Text className='text-text-tertiary text-xs italic leading-relaxed'>
              This may take a few seconds
            </Text>
          </View>
        ) : message.error ? (
          <View className='py-3'>
            <View className='flex-row items-center mb-3'>
              <Text className='text-base mr-2'>⚠️</Text>
              <Text className='text-error text-sm font-semibold'>
                Unable to get response
              </Text>
            </View>
            <Text className='text-error text-sm mb-2 leading-relaxed'>
              {message.error}
            </Text>
            <Text className='text-text-tertiary text-xs italic leading-relaxed'>
              Try rephrasing your question or check if relevant documents have been uploaded.
            </Text>
          </View>
        ) : (
          <>
            <Text className='text-text-primary text-base leading-relaxed mb-4'>
              {message.answer}
            </Text>
            
            {message.citations.length > 0 && (
              <View className='mt-2 pt-4 border-t border-divider'>
                <Text className='text-text-secondary text-sm font-semibold mb-3'>
                  Sources:
                </Text>
                {message.citations.map((citation, index) => (
                  <CitationLink
                    key={`${citation.documentId}-${citation.chunkIndex}`}
                    citation={citation}
                    index={index}
                    onPress={onCitationPress}
                  />
                ))}
              </View>
            )}
          </>
        )}
      </View>
    </View>
  );
}; 