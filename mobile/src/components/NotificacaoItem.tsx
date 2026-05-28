import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { format, parseISO } from 'date-fns';
import { colors } from '../constants/colors';
import { typography, spacing, borderRadius } from '../constants/typography';
import { Notificacao, TipoNotificacao } from '../types';

interface NotificacaoItemProps {
  notificacao: Notificacao;
  onPress: () => void;
}

const NOTIFICATION_ICONS: Record<TipoNotificacao, string> = {
  LEMBRETE: '🔔',
  FALHA_TOMADA: '⚠️',
  RETORNO_MEDICO: '📅',
};

const NOTIFICATION_MESSAGES: Record<TipoNotificacao, string> = {
  LEMBRETE: 'Lembrete de tomada de medicamento',
  FALHA_TOMADA: 'Falha na confirmação de tomada',
  RETORNO_MEDICO: 'Retorno médico se aproximando',
};

export function NotificacaoItem({ notificacao, onPress }: NotificacaoItemProps) {
  const isUnread = notificacao.lido_em === null || notificacao.lido_em === undefined;
  const icon = NOTIFICATION_ICONS[notificacao.tipo];
  const message = NOTIFICATION_MESSAGES[notificacao.tipo];
  const timestamp = format(parseISO(notificacao.enviado_em), 'dd/MM HH:mm');

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
