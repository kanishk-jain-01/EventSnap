import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MainStackParamList } from '../../navigation/types';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { useEventStore } from '../../store/eventStore';
import { FirestoreService } from '../../services/firestore.service';
import { EventDocument, User } from '../../types';
import { useThemeColors } from '../../components/ui/ThemeProvider';

type DocumentListScreenNavigationProp = NativeStackNavigationProp<MainStackParamList, 'DocumentList'>;

/**
 * Screen that displays all documents uploaded to the current event.
 * Accessible to all event participants (both hosts and guests).
 */
const DocumentListScreen: React.FC = () => {
  const navigation = useNavigation<DocumentListScreenNavigationProp>();
  const colors = useThemeColors();
  const { user } = useAuthStore();
  const { activeEvent, role } = useEventStore();

  const [documents, setDocuments] = useState<EventDocument[]>([]);
  const [uploaders, setUploaders] = useState<Map<string, User>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load documents when screen focuses
  useFocusEffect(
    useCallback(() => {
      if (user && activeEvent) {
        loadDocuments();
        
        // Set up real-time subscription
        const unsubscribe = FirestoreService.subscribeToEventDocuments(
          activeEvent.id,
          (docs) => {
            setDocuments(docs);
            loadUploaderInfo(docs);
          },
          (err) => {
            setError(err);
          },
        );

        return unsubscribe;
      }
    }, [user, activeEvent]),
  );

  const loadDocuments = async () => {
    if (!activeEvent) return;

    try {
      setError(null);
      const result = await FirestoreService.getEventDocuments(activeEvent.id);
      
      if (result.success && result.data) {
        setDocuments(result.data);
        await loadUploaderInfo(result.data);
      } else {
        setError(result.error || 'Failed to load documents');
      }
    } catch (_err) {
      setError('Failed to load documents');
    } finally {
      setIsLoading(false);
    }
  };

  const loadUploaderInfo = async (docs: EventDocument[]) => {
    if (docs.length === 0) return;

    const uploaderIds = [...new Set(docs.map(doc => doc.uploadedBy))];
    const uploaderMap = new Map<string, User>();

    try {
      const uploaderPromises = uploaderIds.map(id => FirestoreService.getUser(id));
      const results = await Promise.all(uploaderPromises);

      results.forEach((result, index) => {
        if (result.success && result.data) {
          uploaderMap.set(uploaderIds[index], result.data);
        }
      });

      setUploaders(uploaderMap);
    } catch (_err) {
      // Silently fail - uploader info is not critical
      console.warn('Failed to load uploader info:', _err);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDocuments();
    setRefreshing(false);
  };

  const handleDocumentPress = (document: EventDocument) => {
    navigation.navigate('DocumentViewer', {
      documentId: document.id,
      documentName: document.name,
      documentUrl: document.downloadUrl,
      documentType: document.type,
    });
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getFileIcon = (type: 'pdf' | 'image'): keyof typeof Ionicons.glyphMap => {
    return type === 'pdf' ? 'document-text' : 'image';
  };

  const renderDocumentItem = ({ item }: { item: EventDocument }) => {
    const uploader = uploaders.get(item.uploadedBy);
    const isCurrentUser = item.uploadedBy === user?.uid;

    return (
      <TouchableOpacity
        onPress={() => handleDocumentPress(item)}
        className="bg-white border border-gray-200 rounded-lg p-4 mb-3 shadow-sm"
        activeOpacity={0.7}
      >
        <View className="flex-row items-start">
          {/* File Icon */}
          <View className="mr-3 mt-1">
            <Ionicons
              name={getFileIcon(item.type)}
              size={24}
              color={item.type === 'pdf' ? colors.error : colors.primary}
            />
          </View>

          {/* Document Info */}
          <View className="flex-1">
            <Text className="text-base font-semibold text-gray-900 mb-1" numberOfLines={2}>
              {item.name}
            </Text>
            
            <View className="flex-row items-center mb-2">
              <Text className="text-sm text-gray-500">
                {formatFileSize(item.size)} • {item.type.toUpperCase()}
              </Text>
              {item.pageCount && (
                <Text className="text-sm text-gray-500 ml-2">
                  • {item.pageCount} pages
                </Text>
              )}
            </View>

            <View className="flex-row items-center justify-between">
              <Text className="text-xs text-gray-400">
                Uploaded by {isCurrentUser ? 'You' : (uploader?.displayName || 'Unknown')}
              </Text>
              <Text className="text-xs text-gray-400">
                {formatDate(item.createdAt)}
              </Text>
            </View>
          </View>

          {/* Chevron */}
          <View className="ml-2 mt-1">
            <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View className="flex-1 items-center justify-center px-6">
      <Ionicons name="document-outline" size={64} color={colors.textTertiary} />
      <Text className="text-lg font-semibold text-gray-700 mt-4 mb-2">
        No Documents Yet
      </Text>
      <Text className="text-gray-500 text-center mb-6">
        {role === 'host'
          ? 'Upload documents to share information with event participants.'
          : 'Event hosts can upload documents like schedules, maps, or other helpful information.'}
      </Text>
      {role === 'host' && (
        <TouchableOpacity
          onPress={() => navigation.navigate('DocumentUpload')}
          className="bg-primary px-6 py-3 rounded-full"
        >
          <Text className="text-white font-semibold">Upload Document</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderError = () => (
    <View className="flex-1 items-center justify-center px-6">
      <Ionicons name="alert-circle-outline" size={64} color={colors.error} />
      <Text className="text-lg font-semibold text-gray-700 mt-4 mb-2">
        Failed to Load Documents
      </Text>
      <Text className="text-gray-500 text-center mb-6">
        {error || 'Something went wrong while loading documents.'}
      </Text>
      <TouchableOpacity
        onPress={() => {
          setIsLoading(true);
          loadDocuments();
        }}
        className="bg-primary px-6 py-3 rounded-full"
      >
        <Text className="text-white font-semibold">Try Again</Text>
      </TouchableOpacity>
    </View>
  );

  if (!activeEvent) {
    return (
      <View className="flex-1 items-center justify-center bg-white p-4">
        <Text className="text-lg font-semibold text-gray-700 mb-2">
          No Active Event
        </Text>
        <Text className="text-gray-500 text-center">
          Join an event to view documents.
        </Text>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color={colors.primary} />
        <Text className="text-gray-500 mt-4">Loading documents...</Text>
      </View>
    );
  }

  if (error && documents.length === 0) {
    return (
      <View className="flex-1 bg-white">
        {renderError()}
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-4 py-3 border-b border-gray-200">
        <Text className="text-lg font-semibold text-gray-900">
          Event Documents
        </Text>
        <Text className="text-sm text-gray-500 mt-1">
          {activeEvent.name}
        </Text>
      </View>

      {/* Document List */}
      <FlatList
        data={documents}
        renderItem={renderDocumentItem}
        keyExtractor={item => item.id}
        contentContainerStyle={{ 
          padding: 16,
          flexGrow: 1,
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />

      {/* Floating Action Button for Hosts */}
      {role === 'host' && documents.length > 0 && (
        <View className="absolute bottom-6 right-6">
          <TouchableOpacity
            onPress={() => navigation.navigate('DocumentUpload')}
            className="bg-primary w-14 h-14 rounded-full items-center justify-center shadow-lg"
            style={{ elevation: 8 }}
          >
            <Ionicons name="add" size={28} color="white" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

export default DocumentListScreen; 