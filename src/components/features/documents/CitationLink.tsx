import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MainStackParamList } from '../../../navigation/types';
import { FirestoreService } from '../../../services/firestore.service';

interface Citation {
  documentId: string;
  documentName: string;
  chunkIndex: number;
  excerpt: string;
  storagePath: string;
}

type NavigationProp = NativeStackNavigationProp<MainStackParamList>;

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
  const navigation = useNavigation<NavigationProp>();

  const handlePress = async () => {
    if (onPress) {
      onPress(citation);
      return;
    }

    try {
      // Get document details from Firestore to determine type and URL
      const docResult = await FirestoreService.getEventDocument(citation.documentId);
      
      if (!docResult.success || !docResult.data) {
        console.error('Failed to load document details:', docResult.error);
        return;
      }

      const document = docResult.data;
      
      // Navigate to DocumentViewer with citation highlighting
      navigation.navigate('DocumentViewer', {
        documentId: citation.documentId,
        documentName: citation.documentName,
        documentUrl: document.downloadUrl,
        documentType: document.type,
        highlightText: citation.excerpt,
        chunkIndex: citation.chunkIndex,
      });
    } catch (error) {
      console.error('Error navigating to document:', error);
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