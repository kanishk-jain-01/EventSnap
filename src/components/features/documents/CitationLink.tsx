import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
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
      className='bg-bg-secondary rounded-xl p-3 my-1 border border-border active:bg-interactive-pressed'
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View className='flex-row items-center mb-2'>
        <View className='w-5 h-5 bg-primary rounded-full items-center justify-center mr-3'>
          <Text className='text-white text-xs font-semibold'>
            {index + 1}
          </Text>
        </View>
        <Text className='flex-1 text-text-primary text-sm font-semibold' numberOfLines={1}>
          {citation.documentName}
        </Text>
      </View>
      <Text className='text-text-secondary text-xs leading-relaxed ml-8' numberOfLines={2}>
        {citation.excerpt}
      </Text>
    </TouchableOpacity>
  );
}; 