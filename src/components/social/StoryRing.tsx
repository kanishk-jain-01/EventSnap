import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { User } from '../../types';

export interface StoryRingProps {
  user: User;
  hasUnviewed: boolean;
  isCurrentUser?: boolean;
  size?: number;
  onPress?: () => void;
}

/**
 * Circular avatar with a coloured ring to indicate story status
 * - Yellow ring = unviewed story
 * - Gray ring = all viewed
 * - Blue ring = current user (always visible, tap to add/view)
 */
export const StoryRing: React.FC<StoryRingProps> = ({
  user,
  hasUnviewed,
  isCurrentUser = false,
  size = 68,
  onPress,
}) => {
  const ringColor = isCurrentUser
    ? '#3B82F6' /* blue-500 */
    : hasUnviewed
    ? '#FFFC00' /* Snapchat yellow */
    : '#6B7280';

  const innerSize = size - 6;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} className='items-center mx-2'>
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: 3,
          borderColor: ringColor,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {user.avatarUrl ? (
          <Image
            source={{ uri: user.avatarUrl }}
            style={{
              width: innerSize,
              height: innerSize,
              borderRadius: innerSize / 2,
            }}
            resizeMode='cover'
          />
        ) : (
          <View
            style={{
              width: innerSize,
              height: innerSize,
              borderRadius: innerSize / 2,
              backgroundColor: '#1F2937',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ color: '#FFFC00', fontWeight: 'bold', fontSize: 18 }}>
              {user.displayName.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
      </View>
      <Text
        numberOfLines={1}
        style={{ color: '#FFFFFF', fontSize: 12, marginTop: 4, maxWidth: size }}
      >
        {isCurrentUser ? 'Your Story' : user.displayName.split(' ')[0]}
      </Text>
    </TouchableOpacity>
  );
}; 