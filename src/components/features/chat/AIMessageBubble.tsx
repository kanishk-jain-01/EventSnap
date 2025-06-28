import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
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
    <View style={styles.container}>
      {/* User Question */}
      <View style={styles.questionContainer}>
        <Text style={styles.questionText}>{message.question}</Text>
        <Text style={styles.timestamp}>{formatTime(message.timestamp)}</Text>
      </View>

      {/* AI Response */}
      <View style={styles.responseContainer}>
        <View style={styles.aiHeader}>
          <View style={styles.aiAvatar}>
            <Text style={styles.aiAvatarText}>AI</Text>
          </View>
          <Text style={styles.aiLabel}>Assistant</Text>
        </View>

        {message.isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#007bff" />
            <View style={styles.loadingTextContainer}>
              <Text style={styles.loadingText}>Searching documents...</Text>
              <Text style={styles.loadingSubText}>This may take a few seconds</Text>
            </View>
          </View>
        ) : message.error ? (
          <View style={styles.errorContainer}>
            <View style={styles.errorHeader}>
              <Text style={styles.errorIcon}>⚠️</Text>
              <Text style={styles.errorTitle}>Unable to get response</Text>
            </View>
            <Text style={styles.errorText}>{message.error}</Text>
            <Text style={styles.errorHint}>
              Try rephrasing your question or check if relevant documents have been uploaded.
            </Text>
          </View>
        ) : (
          <>
            <Text style={styles.answerText}>{message.answer}</Text>
            
            {message.citations.length > 0 && (
              <View style={styles.citationsContainer}>
                <Text style={styles.citationsHeader}>Sources:</Text>
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

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
    marginHorizontal: 16,
  },
  questionContainer: {
    alignSelf: 'flex-end',
    backgroundColor: '#007bff',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxWidth: '80%',
    marginBottom: 8,
  },
  questionText: {
    color: '#ffffff',
    fontSize: 16,
    lineHeight: 20,
  },
  timestamp: {
    color: '#ffffff',
    fontSize: 11,
    opacity: 0.8,
    marginTop: 4,
    textAlign: 'right',
  },
  responseContainer: {
    alignSelf: 'flex-start',
    backgroundColor: '#f8f9fa',
    borderRadius: 18,
    padding: 16,
    maxWidth: '90%',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  aiAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#28a745',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  aiAvatarText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  aiLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#28a745',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
  },
  loadingTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  loadingText: {
    fontSize: 14,
    color: '#6c757d',
    fontWeight: '500',
  },
  loadingSubText: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
    fontStyle: 'italic',
  },
  errorContainer: {
    paddingVertical: 12,
  },
  errorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  errorIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#dc3545',
  },
  errorText: {
    fontSize: 13,
    color: '#dc3545',
    marginBottom: 6,
    lineHeight: 18,
  },
  errorHint: {
    fontSize: 12,
    color: '#6c757d',
    fontStyle: 'italic',
    lineHeight: 16,
  },
  answerText: {
    fontSize: 16,
    lineHeight: 22,
    color: '#212529',
    marginBottom: 12,
  },
  citationsContainer: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#dee2e6',
  },
  citationsHeader: {
    fontSize: 14,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 8,
  },
}); 