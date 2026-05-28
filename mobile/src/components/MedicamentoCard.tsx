import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { format, parseISO } from 'date-fns';
import { colors } from '../constants/colors';
import { typography, spacing, borderRadius } from '../constants/typography';
import { Medicamento } from '../types';

interface MedicamentoCardProps {
  medicamento: Medicamento;
  onLongPress: () => void;
}

export function MedicamentoCard({ medicamento, onLongPress }: MedicamentoCardProps) {
  const retornoDate = medicamento.data_proximo_retorno
    ? format(parseISO(medicamento.data_proximo_retorno), 'dd/MM/yyyy')
    : null;

  return (
    <TouchableOpacity
      style={styles.card}
      onLongPress={onLongPress}
      activeOpacity={0.7}
      accessibilityLabel={`Medicamento ${medicamento.nome}, dosagem ${medicamento.dosagem}. Pressione e segure para inativar.`}
      accessibilityRole="button"
      accessibilityHint="Pressione e segure para inativar"
    >
      <View style={styles.header}>
        <Text style={styles.name} numberOfLines={1}>
          {medicamento.nome}
        </Text>
        {medicamento.uso_continuo && (
          <View style={styles.continuoBadge}>
            <Text style={styles.continuoBadgeText}>Uso contínuo</Text>
          </View>
        )}
      </View>

      <Text style={styles.dosage}>{medicamento.dosagem}</Text>

      {medicamento.categoria_id != null && (
        <Text style={styles.category}>
          Categoria: {medicamento.categoria_id}
        </Text>
      )}

      {retornoDate && (
        <Text style={styles.retorno}>📅 Próximo retorno: {retornoDate}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceCard,
    borderRadius: borderRadius.lg,
    padding: spacing.cardPadding,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    marginBottom: spacing.stackGap,
    minHeight: spacing.touchTargetMin,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    ...typography.labelLg,
    color: colors.onSurface,
    flex: 1,
    marginRight: 8,
  },
  continuoBadge: {
    backgroundColor: colors.secondary,
    borderRadius: borderRadius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  continuoBadgeText: {
    ...typography.statusTag,
    color: colors.onSecondary,
  },
  dosage: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    marginBottom: 4,
  },
  category: {
    ...typography.labelMd,
    color: colors.onSurfaceVariant,
    marginBottom: 4,
  },
  retorno: {
    ...typography.labelMd,
    color: colors.primaryContainer,
    marginTop: 8,
  },
});
