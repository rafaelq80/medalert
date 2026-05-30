import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Notificacao, TipoNotificacao } from '../types';
import { extractDateTime } from '../utils/dateUtils';

interface NotificacaoItemProps {
  notificacao: Notificacao;
  onPress: () => void;
  onQuickConfirm?: (registroTomadaId: number) => void;
  isConfirming?: boolean;
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

export function NotificacaoItem({
  notificacao,
  onPress,
  onQuickConfirm,
  isConfirming = false,
}: NotificacaoItemProps) {
  const isUnread = notificacao.lido_em === null || notificacao.lido_em === undefined;
  const icon = NOTIFICATION_ICONS[notificacao.tipo];
  const timestamp = extractDateTime(notificacao.enviado_em);

  // Show quick confirm for LEMBRETE notifications with a registro_tomada_id
  const canQuickConfirm =
    notificacao.tipo === 'LEMBRETE' &&
    notificacao.registro_tomada_id &&
    onQuickConfirm;

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

        {/* Quick confirm button for LEMBRETE */}
        {canQuickConfirm && (
          <TouchableOpacity
            style={styles.quickConfirmButton}
            onPress={() => onQuickConfirm!(notificacao.registro_tomada_id!)}
            disabled={isConfirming}
            accessibilityLabel="Confirmar tomada agora"
            accessibilityRole="button"
          >
            {isConfirming ? (
              <ActivityIndicator size="small" color={styles.onPrimaryColor.color} />
            ) : (
              <Text style={styles.quickConfirmText}>✓ Confirmar agora</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
      {isUnread && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create(theme => ({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.outlineVariant,
    minHeight: 48,
  },
  unread: {
    backgroundColor: theme.surfaceLow,
  },
  read: {
    backgroundColor: theme.surfaceCard,
  },
  icon: {
    fontSize: 24,
    marginRight: 12,
    marginTop: 2,
  },
  content: {
    flex: 1,
  },
  message: {
    fontSize: 15,
    color: theme.onSurface,
    marginBottom: 4,
  },
  unreadMessage: {
    fontWeight: '600',
  },
  timestamp: {
    fontSize: 13,
    fontWeight: '500',
    color: theme.onSurfaceVariant,
  },
  quickConfirmButton: {
    marginTop: 10,
    backgroundColor: theme.statusConfirmed,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
    alignSelf: 'flex-start',
    minHeight: 36,
    justifyContent: 'center',
  },
  quickConfirmText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.primaryContainer,
    marginLeft: 8,
    marginTop: 6,
  },
  onPrimaryColor: { color: theme.onPrimary },
}));
