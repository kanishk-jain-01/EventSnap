import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  FlatList,
  SafeAreaView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useThemeColors } from '../../components/ui/ThemeProvider';
import { useEventStore } from '../../store/eventStore';
import { FirestoreService } from '../../services/firestore.service';
import { User } from '../../types';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';

export const HostListScreen: React.FC = () => {
  const colors = useThemeColors();
  const { activeEvent } = useEventStore();
  const [hosts, setHosts] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHosts = async () => {
      if (!activeEvent) return;
      const res = await FirestoreService.getEventHosts(activeEvent.id);
      if (res.success && res.data) {
        setHosts(res.data);
        setError(null);
      } else {
        setError(res.error || 'Failed to load hosts');
      }
      setLoading(false);
    };

    fetchHosts();
  }, [activeEvent]);

  const renderItem = ({ item }: { item: User }) => (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        backgroundColor: colors.surface,
        borderRadius: 8,
        marginBottom: 8,
      }}
    >
      {item.avatarUrl ? (
        <Image
          source={{ uri: item.avatarUrl }}
          style={{
            width: 48,
            height: 48,
            borderRadius: 24,
            marginRight: 12,
            borderWidth: 2,
            borderColor: colors.primary,
          }}
        />
      ) : (
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: 24,
            marginRight: 12,
            backgroundColor: colors.bgSecondary,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text
            style={{
              color: colors.primary,
              fontWeight: '600',
              fontSize: 18,
            }}
          >
            {item.displayName.charAt(0).toUpperCase()}
          </Text>
        </View>
      )}
      <View style={{ flex: 1 }}>
        <Text
          style={{
            color: colors.textPrimary,
            fontSize: 16,
            fontWeight: '600',
            marginBottom: 2,
          }}
        >
          {item.displayName}
        </Text>
        {item.contactVisible && item.instagramHandle ? (
          <Text style={{ color: colors.textSecondary, fontSize: 14 }}>
            📸 {item.instagramHandle}
          </Text>
        ) : (
          <Text style={{ color: colors.textTertiary, fontSize: 12 }}>
            Contact info hidden
          </Text>
        )}
      </View>
    </View>
  );

  if (!activeEvent) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bgPrimary }}>
        <StatusBar style='dark' />
        <View
          style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
        >
          <Text style={{ color: colors.textPrimary, fontSize: 16 }}>
            No active event
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bgPrimary }}>
      <StatusBar style='dark' />
      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <LoadingSpinner text='Loading hosts...' />
        </View>
      ) : error ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <Text
            style={{
              color: colors.error,
              fontSize: 16,
              fontWeight: '600',
              marginBottom: 12,
              textAlign: 'center',
            }}
          >
            {error}
          </Text>
        </View>
      ) : (
        <FlatList
          data={hosts}
          keyExtractor={item => item.uid}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 20 }}
        />
      )}
    </SafeAreaView>
  );
}; 