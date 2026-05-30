import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
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

const styles = StyleSheet.create(theme => ({
  card: {
    backgroundColor: theme.surfaceCard,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.outlineVariant,
    marginBottom: 12,
    minHeight: 48,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.onSurface,
    flex: 1,
    marginRight: 8,
  },
  continuoBadge: {
    backgroundColor: theme.secondary,
    borderRadius: 9999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  continuoBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: theme.onSecondary,
  },
  dosage: {
    fontSize: 15,
    color: theme.onSurfaceVariant,
    marginBottom: 4,
  },
  category: {
    fontSize: 13,
    fontWeight: '500',
    color: theme.onSurfaceVariant,
    marginBottom: 4,
  },
  retorno: {
    fontSize: 13,
    fontWeight: '500',
    color: theme.primaryContainer,
    marginTop: 8,
  },
  agendasButton: {
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: theme.primaryContainer,
    alignSelf: 'flex-start',
  },
  agendasButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.onPrimary,
  },
}));
