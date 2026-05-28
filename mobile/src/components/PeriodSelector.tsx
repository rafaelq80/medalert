import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../constants/colors';
import { typography, spacing, borderRadius } from '../constants/typography';

interface PeriodSelectorProps {
  selectedPeriod: 7 | 15 | 30;
  onPeriodChange: (days: 7 | 15 | 30) => void;
}

const PERIOD_OPTIONS: { label: string; days: 7 | 15 | 30 }[] = [
  { label: '7 dias', days: 7 },
  { label: '15 dias', days: 15 },
  { label: '30 dias', days: 30 },
];

export function PeriodSelector({ selectedPeriod, onPeriodChange }: PeriodSelectorProps) {
  return (
    <View style={styles.container}>
      {PERIOD_OPTIONS.map((option) => {
        const isActive = selectedPeriod === option.days;
        return (
          <TouchableOpacity
            key={option.days}
            style={[
              styles.button,
              isActive ? styles.buttonActive : styles.buttonInactive,
            ]}
            onPress={() => onPeriodChange(option.days)}
            accessibilityLabel={`Filtrar por ${option.label}`}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
          >
            <Text
              style={[
                styles.buttonText,
                isActive ? styles.buttonTextActive : styles.buttonTextInactive,
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: spacing.marginMobile,
    paddingTop: spacing.marginMobile,
    paddingBottom: 12,
    gap: 8,
  },
  button: {
    flex: 1,
    borderRadius: borderRadius.default,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: spacing.touchTargetMin,
  },
  buttonActive: {
    backgroundColor: colors.primaryContainer,
  },
  buttonInactive: {
    backgroundColor: colors.surfaceContainerLow,
  },
  buttonText: {
    ...typography.labelLg,
  },
  buttonTextActive: {
    color: colors.onPrimary,
  },
  buttonTextInactive: {
    color: colors.onSurfaceVariant,
  },
});
