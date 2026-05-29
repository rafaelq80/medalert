import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../constants/colors';
import { typography, spacing, borderRadius } from '../constants/typography';
import { Notificacao, TipoNotificacao } from '../types';
import { extractDateTime } from '../utils/dateUtils';

interface NotificacaoItemProps {
  notificacao: Notificacao;
  onPress: () => void;
}

const NOTIFICATION_ICONS: Record<TipoNotificacao, string> = {
  LEMBRETE: '🔔',
  FALHA_TOMADA: '⚠️',
  RETORNO_MEDICO: '📅',
  CONFIRMACAO: '✅',
};

const NOTIFICATION_MESSAGES: Record<TipoNotificacao, string> = {
  LEMBRETE: 'Lembrete de tomada de medicamento',
  FALHA_TOMADA: 'Falha na confirmação de tomada',
  RETORNO_MEDICO: 'Retorno médico se aproximando',
  CONFIRMACAO: 'Tomada confirmada pelo paciente',
};

export function NotificacaoItem({ notificacao, onPress }: NotificacaoItemProps) {
  const isUnread = notificacao.lido_em === null || notificacao.lido_em === undefined;
  const icon = NOTIFICATION_ICONS[notificacao.tipo];
  const timestamp = extractDateTime(notificacao.enviado_em);

  // Build contextual message
  let message = NOTIFICATION_MESSAGES[notificacao.tipo];
  if (notificacao.medicamento_nome) {
    const pacienteInfo = notificacao.paciente_nome ? ` (${notificacao.paciente_nome})` : '';
    const horarioInfo = notificacao.horario_previsto ? ` às ${notificacao.horario_previsto}` : '';

    if (notificacao.tipo === 'LEMBRETE') {
      message = `Hora de tomar ${notificacao.medicamento_nome}${horarioInfo}`;
    } else if (notificacao.tipo === 'FALHA_TOMADA') {
      message = `${notificacao.medicamento_nome}${horarioInfo} não foi confirmado${pacienteInfo}`;
    } else if (notificacao.tipo === 'RETORNO_MEDICO') {
      message = `Retorno médico: ${notificacao.medicamento_nome}${pacienteInfo}`;
    } else if (notificacao.tipo === 'CONFIRMACAO') {
      message = `${notificacao.paciente_nome || 'Paciente'} confirmou ${notificacao.medicamento_nome}${horarioInfo}`;
    }
  }

  return (
    <TouchableOpacity
      style={[
        styles.container,
        isUnread ? styles.unread : styles.read,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityLabel={`${isUnread ? 'Não lida: ' : ''}${message}, ${timestamp}`}
      accessibilityRole="button"
      accessibilityHint={isUnread ? 'Toque para marcar como lida' : undefined}
    >
      <Text style={styles.icon}>{icon}</Text>
      <View style={styles.content}>
        <Text
          style={[styles.message, isUnread && styles.unreadMessage]}
          numberOfLines={2}
        >
          {message}
        </Text>
        <Text style={styles.timestamp}>{timestamp}</Text>
      </View>
      {isUnread && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.lg,
    padding: spacing.cardPadding,
    marginBottom: spacing.stackGap,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    minHeight: spacing.touchTargetMin,
  },
  unread: {
    backgroundColor: colors.surfaceContainerLow,
  },
  read: {
    backgroundColor: colors.surfaceCard,
  },
  icon: {
    fontSize: 24,
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  message: {
    ...typography.bodyMd,
    color: colors.onSurface,
    marginBottom: 4,
  },
  unreadMessage: {
    fontWeight: '600',
  },
  timestamp: {
    ...typography.labelMd,
    color: colors.onSurfaceVariant,
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primaryContainer,
    marginLeft: 8,
  },
});
