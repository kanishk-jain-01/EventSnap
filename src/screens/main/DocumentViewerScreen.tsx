import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  StatusBar,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Image } from 'expo-image';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { MainStackParamList } from '../../navigation/types';
import { useThemeColors } from '../../components/ui/ThemeProvider';

type DocumentViewerRouteProp = RouteProp<MainStackParamList, 'DocumentViewer'>;

/**
 * Screen that displays documents (PDFs and images) in appropriate viewers.
 * PDFs are displayed using WebView, images using a zoomable image viewer.
 */
const DocumentViewerScreen: React.FC = () => {
  const route = useRoute<DocumentViewerRouteProp>();
  const navigation = useNavigation();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  
  const { documentName, documentUrl, documentType, highlightText, chunkIndex } = route.params;
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showControls, setShowControls] = useState(true);

  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

  const handleLoadStart = () => {
    setIsLoading(true);
    setError(null);
  };

  const handleLoadEnd = () => {
    setIsLoading(false);
  };

  const handleError = (errorMessage?: string) => {
    setIsLoading(false);
    setError(errorMessage || 'Failed to load document');
  };

  const handleClose = () => {
    navigation.goBack();
  };

  const toggleControls = () => {
    setShowControls(!showControls);
  };

  const renderPDFViewer = () => {
    // For PDFs, we'll use WebView with Google Docs viewer as fallback
    const pdfViewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(documentUrl)}&embedded=true`;
    
    return (
      <WebView
        source={{ uri: pdfViewerUrl }}
        style={{ flex: 1 }}
        onLoadStart={handleLoadStart}
        onLoadEnd={handleLoadEnd}
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          handleError(nativeEvent.description);
        }}
        onHttpError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          handleError(`HTTP Error: ${nativeEvent.statusCode}`);
        }}
        startInLoadingState={true}
        renderLoading={() => (
          <View className="flex-1 items-center justify-center bg-white">
            <ActivityIndicator size="large" color={colors.primary} />
            <Text className="text-gray-500 mt-4">Loading PDF...</Text>
          </View>
        )}
        renderError={(errorName) => (
          <View className="flex-1 items-center justify-center bg-white px-6">
            <Ionicons name="alert-circle-outline" size={64} color={colors.error} />
            <Text className="text-lg font-semibold text-gray-700 mt-4 mb-2">
              Failed to Load PDF
            </Text>
            <Text className="text-gray-500 text-center mb-6">
              {errorName || 'The PDF could not be displayed. Please try again.'}
            </Text>
            <TouchableOpacity
              onPress={() => {
                setError(null);
                setIsLoading(true);
              }}
              className="bg-primary px-6 py-3 rounded-full"
            >
              <Text className="text-white font-semibold">Retry</Text>
            </TouchableOpacity>
          </View>
        )}
        allowsFullscreenVideo={false}
        mediaPlaybackRequiresUserAction={true}
        scalesPageToFit={true}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
      />
    );
  };

  const renderImageViewer = () => {
    return (
      <TouchableOpacity 
        activeOpacity={1} 
        onPress={toggleControls}
        className="flex-1 bg-black"
      >
        <Image
          source={{ uri: documentUrl }}
          style={{
            width: screenWidth,
            height: screenHeight,
          }}
          contentFit="contain"
          transition={200}
          onLoadStart={handleLoadStart}
          onLoad={handleLoadEnd}
          onError={(error: any) => {
            console.error('Image load error:', error);
            handleError('Failed to load image');
          }}
        />
      </TouchableOpacity>
    );
  };

  const renderError = () => (
    <View className="flex-1 items-center justify-center bg-white px-6">
      <Ionicons name="alert-circle-outline" size={64} color={colors.error} />
      <Text className="text-lg font-semibold text-gray-700 mt-4 mb-2">
        Failed to Load Document
      </Text>
      <Text className="text-gray-500 text-center mb-6">
        {error || 'The document could not be displayed. Please check your internet connection and try again.'}
      </Text>
      <TouchableOpacity
        onPress={() => {
          setError(null);
          setIsLoading(true);
        }}
        className="bg-primary px-6 py-3 rounded-full mb-4"
      >
        <Text className="text-white font-semibold">Try Again</Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={handleClose}
        className="bg-gray-200 px-6 py-3 rounded-full"
      >
        <Text className="text-gray-700 font-semibold">Close</Text>
      </TouchableOpacity>
    </View>
  );

  const renderHighlightBanner = () => {
    if (!highlightText) return null;

    // Calculate the header height: safe area top + padding + content height
    const headerHeight = insets.top + 12 + 60; // 60px estimated for header content

    return (
      <View 
        className={`absolute left-0 right-0 z-10 px-4 py-3 ${
          documentType === 'image' ? 'bg-yellow-500/90' : 'bg-yellow-100 border-b border-yellow-200'
        }`}
        style={{ top: headerHeight }}
      >
        <View className="flex-row items-center">
          <Ionicons 
            name="search" 
            size={16} 
            color={documentType === 'image' ? 'white' : '#f59e0b'} 
            style={{ marginRight: 8 }}
          />
          <View className="flex-1">
            <Text 
              className={`text-sm font-medium ${
                documentType === 'image' ? 'text-white' : 'text-yellow-800'
              }`}
            >
              Citation Reference
            </Text>
            <Text 
              className={`text-xs ${
                documentType === 'image' ? 'text-yellow-100' : 'text-yellow-600'
              }`}
              numberOfLines={2}
            >
              "{highlightText}"
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderControls = () => {
    if (!showControls && documentType === 'image') return null;

    return (
      <>
        <StatusBar 
          barStyle={documentType === 'image' ? 'light-content' : 'dark-content'} 
          backgroundColor={documentType === 'image' ? 'rgba(0,0,0,0.7)' : 'white'} 
          translucent={documentType === 'image'}
        />
        
        {/* Header */}
        <View 
          className={`absolute top-0 left-0 right-0 z-10 px-4 pb-3 ${
            documentType === 'image' ? 'bg-black/70' : 'bg-white border-b border-gray-200'
          }`}
          style={{ paddingTop: insets.top + 12 }}
        >
          <View className="flex-row items-center">
            <TouchableOpacity
              onPress={handleClose}
              className="mr-3 p-3 -ml-1"
              style={{ minWidth: 44, minHeight: 44 }}
            >
              <Ionicons 
                name="close" 
                size={28} 
                color={documentType === 'image' ? 'white' : colors.textPrimary} 
              />
            </TouchableOpacity>
            
            <View className="flex-1">
              <Text 
                className={`text-base font-semibold ${
                  documentType === 'image' ? 'text-white' : 'text-gray-900'
                }`}
                numberOfLines={1}
              >
                {documentName}
              </Text>
              <Text 
                className={`text-sm ${
                  documentType === 'image' ? 'text-gray-300' : 'text-gray-500'
                }`}
              >
                {documentType.toUpperCase()}
                {chunkIndex !== undefined && ` • Section ${chunkIndex + 1}`}
              </Text>
            </View>

            {/* Additional actions could go here */}
          </View>
        </View>
        
        {/* Citation Highlight Banner */}
        {renderHighlightBanner()}
      </>
    );
  };

  if (error) {
    return (
      <View className="flex-1">
        {renderControls()}
        {renderError()}
      </View>
    );
  }

  return (
    <View className="flex-1">
      {renderControls()}
      
      {/* Loading Overlay */}
      {isLoading && (
        <View className="absolute inset-0 bg-white items-center justify-center z-20">
          <ActivityIndicator size="large" color={colors.primary} />
          <Text className="text-gray-500 mt-4">
            Loading {documentType === 'pdf' ? 'PDF' : 'image'}...
          </Text>
        </View>
      )}

      {/* Document Content */}
      <View 
        className="flex-1" 
        style={{ 
          marginTop: showControls 
            ? (highlightText ? insets.top + 72 + 60 : insets.top + 72) // header height (60) + padding (12) + banner if present
            : 0,
        }}
      >
        {documentType === 'pdf' ? renderPDFViewer() : renderImageViewer()}
      </View>
    </View>
  );
};

export default DocumentViewerScreen; 