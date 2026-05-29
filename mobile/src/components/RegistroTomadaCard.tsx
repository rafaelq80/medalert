import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { colors } from '../constants/colors';
import { typography, spacing, borderRadius } from '../constants/typography';
import { RegistroTomada, StatusTomada } from '../types';
import { extractTime } from '../utils/dateUtils';

interface RegistroTomadaCardProps {
  registro: RegistroTomada;
  onConfirm: (id: number) => void;
  isConfirming?: boolean;
}

const STATUS_COLORS: Record<StatusTomada, string> = {
  PENDENTE: colors.statusPending,
  CONFIRMADO: colors.statusConfirmed,
  ATRASADO: colors.statusDelayed,
  IGNORADO: colors.statusIgnored,
};

const STATUS_LABELS: Record<StatusTomada, string> = {
  PENDENTE: 'Pendente',
  CONFIRMADO: 'Confirmado',
  ATRASADO: 'Atrasado',
  IGNORADO: 'Ignorado',
};

export function RegistroTomadaCard({
  registro,
  onConfirm,
  isConfirming = false,
}: RegistroTomadaCardProps) {
  const statusColor = STATUS_COLORS[registro.status];
  const isAtrasado = registro.status === 'ATRASADO';

  const scheduledTime = extractTime(registro.data_hora_prevista);

  // Determine if confirm button should be shown
  // If status is PENDENTE or ATRASADO, always allow confirmation attempt
  // The backend validates the tolerance window and rejects if expired
  const isPending = registro.status === 'PENDENTE' || registro.status === 'ATRASADO';
  const canConfirm = isPending;

  return (
    <View
      style={[
        styles.card,
        { borderLeftColor: statusColor },
        isAtrasado && styles.cardAtrasado,
      ]}
      accessibilityLabel={`Medicamento ${registro.medicamento_nome ?? 'desconhecido'}, horário ${scheduledTime}, status ${STATUS_LABELS[registro.status]}`}
    >
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.medicationName} numberOfLines={1}>
            {registro.medicamento_nome ?? 'Medicamento'}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
            <Text style={styles.statusText}>{STATUS_LABELS[registro.status]}</Text>
          </View>
        </View>
        <Text style={styles.dosage}>{registro.medicamento_dosagem ?? ''}</Text>
      </View>

      <View style={styles.details}>
        <Text style={styles.time}>🕐 {scheduledTime}</Text>
        {registro.medicamento_instrucoes ? (
          <Text style={styles.instructions} numberOfLines={2}>
            {registro.medicamento_instrucoes}
          </Text>
        ) : null}
      </View>

      {canConfirm && (
        <TouchableOpacity
          style={styles.confirmButton}
          onPress={() => onConfirm(registro.id)}
          disabled={isConfirming}
          accessibilityLabel={`Confirmar tomada de ${registro.medicamento_nome ?? 'medicamento'}`}
          accessibilityRole="button"
        >
          {isConfirming ? (
            <ActivityIndicator size="small" color={colors.onPrimary} />
          ) : (
            <Text style={styles.confirmButtonText}>Confirmar</Text>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceCard,
    borderRadius: borderRadius.lg,
    padding: spacing.cardPadding,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderLeftWidth: 4,
    marginBottom: spacing.stackGap,
  },
  cardAtrasado: {
    shadowColor: colors.statusDelayed,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  header: {
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  medicationName: {
    ...typography.labelLg,
    color: colors.onSurface,
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    borderRadius: borderRadius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusText: {
    ...typography.statusTag,
    color: colors.onPrimary,
  },
  dosage: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
  },
  details: {
    marginBottom: 12,
  },
  time: {
    ...typography.bodyMd,
    color: colors.onSurface,
    marginBottom: 4,
  },
  instructions: {
    ...typography.labelMd,
    color: colors.onSurfaceVariant,
  },
  confirmButton: {
    backgroundColor: colors.primaryContainer,
    borderRadius: borderRadius.default,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: spacing.touchTargetMin,
  },
  confirmButtonText: {
    ...typography.labelLg,
    color: colors.onPrimary,
  },
});
