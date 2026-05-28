import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../constants/colors';
import { typography, spacing, borderRadius } from '../constants/typography';

interface AdherenceCardProps {
  percentage: number;
  confirmedCount: number;
  totalCount: number;
  color: string;
}

export function AdherenceCard({ percentage, confirmedCount, totalCount, color }: AdherenceCardProps) {
  return (
    <View style={styles.container} accessibilityLabel={`Adesão no período: ${percentage}%, ${confirmedCount} de ${totalCount} tomadas confirmadas`}>
      <Text style={styles.label}>Adesão no período</Text>
      <Text style={[styles.value, { color }]}>{percentage}%</Text>
      <Text style={styles.detail}>
        {confirmedCount} de {totalCount} tomadas confirmadas
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 20,
    marginHorizontal: spacing.marginMobile,
    backgroundColor: colors.surfaceCard,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  label: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    marginBottom: 4,
  },
  value: {
    fontSize: 48,
    fontWeight: '700',
    lineHeight: 56,
  },
  detail: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    marginTop: 4,
  },
});
