import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { RegistroTomada, StatusTomada } from '../types';
import { extractTime } from '../utils/dateUtils';

interface RegistroTomadaCardProps {
  registro: RegistroTomada;
  onConfirm: (id: number) => void;
  isConfirming?: boolean;
}

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
  const { theme } = useUnistyles();
  const STATUS_COLORS: Record<StatusTomada, string> = {
    PENDENTE: theme.statusPending,
    CONFIRMADO: theme.statusConfirmed,
    ATRASADO: theme.statusDelayed,
    IGNORADO: theme.statusIgnored,
  };
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
            <ActivityIndicator size="small" color={styles.onPrimaryColor.color} />
          ) : (
            <Text style={styles.confirmButtonText}>Confirmar</Text>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create(theme => ({
  card: {
    backgroundColor: theme.surfaceCard,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.outlineVariant,
    borderLeftWidth: 4,
    marginBottom: 12,
  },
  cardAtrasado: {
    shadowColor: theme.statusDelayed,
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
    fontSize: 16,
    fontWeight: '600',
    color: theme.onSurface,
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    borderRadius: 9999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: theme.onPrimary,
  },
  dosage: {
    fontSize: 15,
    color: theme.onSurfaceVariant,
  },
  details: {
    marginBottom: 12,
  },
  time: {
    fontSize: 15,
    color: theme.onSurface,
    marginBottom: 4,
  },
  instructions: {
    fontSize: 13,
    fontWeight: '500',
    color: theme.onSurfaceVariant,
  },
  confirmButton: {
    backgroundColor: theme.primaryContainer,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.onPrimary,
  },
  onPrimaryColor: { color: theme.onPrimary },
}));
