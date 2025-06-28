import React, { useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { useNavigation } from '@react-navigation/native';
import { useEventStore } from '../../store/eventStore';
import { useAuthStore } from '../../store/authStore';
import { FirestoreService } from '../../services/firestore.service';
import { UploadProgressCallback } from '../../services/storage.service';
import { COLORS } from '../../utils/constants';

/**
 * Screen that allows event hosts to upload PDFs or images which are then stored
 * in Firebase Storage and indexed under `events/{eventId}/documents`.
 * Visible only to users with the `host` role for the active event.
 */
const DocumentUploadScreen: React.FC = () => {
  const navigation = useNavigation();
  const { activeEvent, role } = useEventStore();
  const { user } = useAuthStore();

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  const handlePickFile = useCallback(async () => {
    if (!activeEvent || role !== 'host') {
      Alert.alert('Permission Denied', 'Only event hosts can upload documents.');
      return;
    }

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
      });

      if (result.canceled) return;

      const file = result.assets[0];
      if (!file.uri) return;

      // Fetch file as blob – required for Firebase upload
      const response = await fetch(file.uri);
      const blob = await response.blob();

      console.log('[DEBUG] Selected file size (bytes):', blob.size);

      // DEBUG: log participant role/record before attempting upload
      if (activeEvent && user?.uid) {
        try {
          const participantRes = await FirestoreService.getParticipant(
            activeEvent.id,
            user.uid,
          );
          console.log('[DEBUG] Participant record:', participantRes);
        } catch (err) {
          console.error('[DEBUG] Failed to fetch participant record', err);
        }
      }

      setIsUploading(true);
      setUploadProgress(0);

      const onProgress: UploadProgressCallback = progress => {
        setUploadProgress(progress);
      };

      const res = await FirestoreService.uploadEventDocument(
        activeEvent.id,
        user!.uid,
        blob,
        file.name || 'document',
        file.mimeType || 'application/octet-stream',
        onProgress,
      );

      // DEBUG: log full response from upload attempt
      if (!res.success) {
        console.error('[DEBUG] uploadEventDocument response:', res);
      }

      if (res.success) {
        Alert.alert('Upload Successful', `${file.name} has been uploaded.`);
        navigation.goBack();
      } else {
        Alert.alert('Upload Failed', res.error || 'Please try again.');
      }
    } catch (_error) {
      Alert.alert('Error', 'Failed to pick or upload file.');
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
    }
  }, [activeEvent, role, navigation, user]);

  if (role !== 'host') {
    return (
      <View className="flex-1 items-center justify-center bg-white p-4">
        <Text className="text-lg font-semibold text-gray-700 mb-2">
          Access Restricted
        </Text>
        <Text className="text-gray-500 text-center">
          Only event hosts can upload documents.
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 items-center justify-center bg-white p-4">
      <Text className="text-xl font-bold mb-6">Upload Document</Text>
      <TouchableOpacity
        onPress={handlePickFile}
        className="bg-primary px-6 py-3 rounded-full"
        disabled={isUploading}
      >
        <Text className="text-white font-semibold text-base">
          {isUploading ? 'Uploading…' : 'Choose PDF or Image'}
        </Text>
      </TouchableOpacity>

      {isUploading && uploadProgress !== null && (
        <View className="mt-6 items-center">
          <ActivityIndicator size="large" color={COLORS.PRIMARY} />
          <Text className="mt-2 text-gray-700">
            {uploadProgress.toFixed(0)}%
          </Text>
        </View>
      )}
    </View>
  );
};

export default DocumentUploadScreen; 