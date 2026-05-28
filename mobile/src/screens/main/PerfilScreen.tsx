import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { colors } from '../../constants/colors';
import { typography, spacing, borderRadius } from '../../constants/typography';

export function PerfilScreen() {
  const { user, logout } = useAuth();

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.name}>{user?.nome}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        <Text style={styles.tipo}>{user?.tipo}</Text>
      </View>

      <TouchableOpacity
        style={styles.logoutButton}
        onPress={logout}
        accessibilityLabel="Sair da conta"
        accessibilityRole="button"
      >
        <Text style={styles.logoutText}>Sair</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundApp,
    paddingHorizontal: spacing.marginMobile,
    paddingTop: 24,
  },
  card: {
    backgroundColor: colors.surfaceCard,
    borderRadius: borderRadius.lg,
    padding: spacing.cardPadding,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  name: {
    ...typography.headlineMd,
    color: colors.onSurface,
  },
  email: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    marginTop: 4,
  },
  tipo: {
    ...typography.labelMd,
    color: colors.primaryContainer,
    marginTop: 8,
  },
  logoutButton: {
    backgroundColor: colors.error,
    borderRadius: borderRadius.default,
    minHeight: spacing.touchTargetMin,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  logoutText: {
    ...typography.labelLg,
    color: colors.onError,
  },
});
