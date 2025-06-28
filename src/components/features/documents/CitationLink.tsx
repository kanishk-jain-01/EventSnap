import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface Citation {
  documentId: string;
  documentName: string;
  chunkIndex: number;
  excerpt: string;
  storagePath: string;
}

interface CitationLinkProps {
  citation: Citation;
  index: number;
  onPress?: (_citation: Citation) => void;
}

export const CitationLink: React.FC<CitationLinkProps> = ({
  citation,
  index,
  onPress,
}) => {
  const handlePress = () => {
    if (onPress) {
      onPress(citation);
    } else {
      // TODO: Default navigation to document viewer (will be implemented in task 5.0)
      console.log('Opening document:', citation.documentName);
    }
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={styles.indexContainer}>
          <Text style={styles.indexText}>{index + 1}</Text>
        </View>
        <Text style={styles.documentName} numberOfLines={1}>
          {citation.documentName}
        </Text>
      </View>
      <Text style={styles.excerpt} numberOfLines={2}>
        {citation.excerpt}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginVertical: 4,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  indexContainer: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#007bff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  indexText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  documentName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#212529',
  },
  excerpt: {
    fontSize: 12,
    color: '#6c757d',
    lineHeight: 16,
  },
}); 