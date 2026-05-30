import React from 'react';
import { View, Text } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

interface AdherenceCardProps {
  percentage: number;
  confirmedCount: number;
  totalCount: number;
  color: string;
  previousPercentage?: number;
}

export function AdherenceCard({
  percentage,
  confirmedCount,
  totalCount,
  color,
  previousPercentage,
}: AdherenceCardProps) {
  const diff = previousPercentage != null ? percentage - previousPercentage : null;

  return (
    <View
      style={styles.container}
      accessibilityLabel={`Adesão no período: ${percentage}%, ${confirmedCount} de ${totalCount} tomadas confirmadas`}
    >
      <Text style={styles.label}>Adesão no período</Text>
      <Text style={[styles.value, { color }]}>{percentage}%</Text>

      {/* Progress bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              { width: `${Math.min(percentage, 100)}%`, backgroundColor: color },
            ]}
          />
        </View>
      </View>

      <Text style={styles.detail}>
        {confirmedCount} de {totalCount} tomadas confirmadas
      </Text>

      {diff !== null && diff !== 0 && (
        <Text style={[styles.comparison, { color: diff > 0 ? styles.confirmedColor.color : styles.delayedColor.color }]}>
          {diff > 0 ? '↑' : '↓'} {Math.abs(diff)}% em relação ao período anterior
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create(theme => ({
  container: {
    alignItems: 'center',
    paddingVertical: 20,
    marginHorizontal: 20,
    backgroundColor: theme.surfaceCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.outlineVariant,
  },
  label: {
    fontSize: 15,
    color: theme.onSurfaceVariant,
    marginBottom: 4,
  },
  value: {
    fontSize: 48,
    fontWeight: '700',
    lineHeight: 56,
  },
  progressContainer: {
    width: '70%',
    marginTop: 12,
    marginBottom: 8,
  },
  progressTrack: {
    height: 8,
    backgroundColor: theme.surfaceHigh,
    borderRadius: 9999,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 9999,
  },
  detail: {
    fontSize: 15,
    color: theme.onSurfaceVariant,
    marginTop: 4,
  },
  comparison: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 8,
  },
  confirmedColor: { color: theme.statusConfirmed },
  delayedColor: { color: theme.statusDelayed },
}));
