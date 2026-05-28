import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { colors } from '../constants/colors';
import { typography, spacing } from '../constants/typography';

interface LoadingStateProps {
  label?: string;
}

export function LoadingState({ label }: LoadingStateProps) {
  return (
    <View style={styles.container}>
      <ActivityIndicator
        size="large"
        color={colors.primaryContainer}
        accessibilityLabel={label ?? 'Carregando'}
      />
      {label ? <Text style={styles.label}>{label}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundApp,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.marginMobile,
  },
  label: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    marginTop: 12,
  },
});
