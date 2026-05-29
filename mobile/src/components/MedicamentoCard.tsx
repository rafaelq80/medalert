import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../constants/colors';
import { typography, spacing, borderRadius } from '../constants/typography';
import { Medicamento } from '../types';
import { extractDate } from '../utils/dateUtils';

interface MedicamentoCardProps {
  medicamento: Medicamento;
  onPress?: () => void;
  onLongPress: () => void;
  onManageAgendas?: () => void;
}

export function MedicamentoCard({
  medicamento,
  onPress,
  onLongPress,
  onManageAgendas,
}: MedicamentoCardProps) {
  const retornoDate = medicamento.data_proximo_retorno
    ? extractDate(medicamento.data_proximo_retorno)
    : null;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.7}
      accessibilityLabel={`Medicamento ${medicamento.nome}, dosagem ${medicamento.dosagem}. Toque para editar, pressione e segure para inativar.`}
      accessibilityRole="button"
      accessibilityHint="Toque para editar, pressione e segure para inativar"
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

      {medicamento.categoria_nome && (
        <Text style={styles.category}>
          {medicamento.categoria_nome}
        </Text>
      )}

      {retornoDate && (
        <Text style={styles.retorno}>📅 Próximo retorno: {retornoDate}</Text>
      )}

      {onManageAgendas && (
        <TouchableOpacity
          style={styles.agendasButton}
          onPress={onManageAgendas}
          accessibilityLabel={`Gerenciar horários de ${medicamento.nome}`}
          accessibilityRole="button"
        >
          <Text style={styles.agendasButtonText}>⏰ Gerenciar Horários</Text>
        </TouchableOpacity>
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
  agendasButton: {
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: borderRadius.default,
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    alignSelf: 'flex-start',
  },
  agendasButtonText: {
    ...typography.labelMd,
    color: colors.primaryContainer,
  },
});
