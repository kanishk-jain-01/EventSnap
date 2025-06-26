import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { User } from '../../types';
import { useThemeColors } from '../ui/ThemeProvider';

export interface StoryRingProps {
  user: User;
  hasUnviewed: boolean;
  isCurrentUser?: boolean;
  size?: number;
  onPress?: () => void;
}

/**
 * Circular avatar with a colored ring to indicate story status
 * - Primary color ring = unviewed story (vibrant purple)
 * - Gray ring = all viewed
 * - Accent color ring = current user (hot pink)
 */
export const StoryRing: React.FC<StoryRingProps> = ({
  user,
  hasUnviewed,
  isCurrentUser = false,
  size = 68,
  onPress,
}) => {
  const colors = useThemeColors();

  const getRingColor = () => {
    if (isCurrentUser) {
      return colors.accent; // Hot pink for current user
    }
    return hasUnviewed ? colors.primary : colors.textTertiary; // Purple for unviewed, gray for viewed
  };

  const getInitialBackgroundColor = () => {
    return colors.surface; // Clean white background for initials
  };

  const getInitialTextColor = () => {
    return colors.primary; // Purple text for initials
  };

  const innerSize = size - 6;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      className='items-center mx-2'
    >
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: 3,
          borderColor: getRingColor(),
          alignItems: 'center',
          justifyContent: 'center',
          // Add subtle shadow for depth on light background
          shadowColor: colors.shadow,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 2,
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
              backgroundColor: getInitialBackgroundColor(),
              alignItems: 'center',
              justifyContent: 'center',
              // Add border for better definition on light background
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Text
              style={{
                color: getInitialTextColor(),
                fontWeight: 'bold',
                fontSize: 18,
              }}
            >
              {user.displayName.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
      </View>
      <Text
        numberOfLines={1}
        style={{
          color: colors.textPrimary,
          fontSize: 12,
          marginTop: 4,
          maxWidth: size,
          fontWeight: '500',
        }}
      >
        {isCurrentUser ? 'Your Story' : user.displayName.split(' ')[0]}
      </Text>
    </TouchableOpacity>
  );
};
