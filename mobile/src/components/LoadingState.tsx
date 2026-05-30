import React from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

interface LoadingStateProps {
  label?: string;
}

export function LoadingState({ label }: LoadingStateProps) {
  return (
    <View style={styles.container}>
      <ActivityIndicator
        size="large"
        color={styles.indicatorColor.color}
        accessibilityLabel={label ?? 'Carregando'}
      />
      {label ? <Text style={styles.label}>{label}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create(theme => ({
  container: {
    flex: 1,
    backgroundColor: theme.backgroundApp,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  label: {
    fontSize: 15,
    color: theme.onSurfaceVariant,
    marginTop: 12,
  },
  indicatorColor: { color: theme.primaryContainer },
}));
