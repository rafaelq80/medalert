import React from 'react';
import { View, Text } from 'react-native';
import { useUnistyles } from 'react-native-unistyles';
import { useAuth } from '../contexts/AuthContext';
import { UserBadge } from './UserBadge';

/**
 * Unified header component used across all navigators.
 * Shows user badge + name. React 19: no forwardRef needed.
 */
export function AppHeader() {
  const { user } = useAuth();
  const { theme } = useUnistyles();

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <UserBadge nome={user?.nome ?? 'U'} size={30} />
      <Text
        style={{ fontSize: 20, fontWeight: '600', color: theme.onSurface, maxWidth: 200 }}
        numberOfLines={1}
      >
        {user?.nome}
      </Text>
    </View>
  );
}
