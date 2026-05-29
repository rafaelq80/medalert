import React, { useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl, Vibration } from 'react-native';
import { useNotificacoes } from '../../hooks/useNotificacoes';
import { NotificacaoItem } from '../../components/NotificacaoItem';
import { EmptyState } from '../../components/EmptyState';
import { ErrorState } from '../../components/ErrorState';
import { LoadingState } from '../../components/LoadingState';
import { colors } from '../../constants/colors';
import { typography, spacing } from '../../constants/typography';

export function NotificacoesScreen() {
  const {
    notificacoes,
    isLoading,
    isRefreshing,
    error,
    handleRefresh,
    handleMarkAsRead,
    retry,
  } = useNotificacoes();

  const unreadCount = notificacoes.filter((n) => !n.lido_em).length;
  const hasUrgent = notificacoes.some(
    (n) => !n.lido_em && n.tipo === 'FALHA_TOMADA'
  );

  // Vibrate when there are unread urgent notifications
  useEffect(() => {
    if (hasUrgent) {
      Vibration.vibrate([0, 200, 100, 200]);
    }
  }, [hasUrgent]);

  if (isLoading) {
    return <LoadingState label="Carregando notificações" />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={retry} />;
  }

  return (
    <View style={styles.container}>
      {/* Alert banner for unread notifications */}
      {unreadCount > 0 && (
        <View style={[styles.alertBanner, hasUrgent && styles.alertBannerUrgent]}>
          <Text style={styles.alertEmoji}>{hasUrgent ? '⚠️' : '🔔'}</Text>
          <Text style={styles.alertText}>
            {unreadCount} notificação{unreadCount > 1 ? 'ões' : ''} não lida{unreadCount > 1 ? 's' : ''}
          </Text>
        </View>
      )}

      <FlatList
        data={notificacoes}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <NotificacaoItem
            notificacao={item}
            onPress={() => handleMarkAsRead(item)}
          />
        )}
        contentContainerStyle={
          notificacoes.length === 0 ? styles.emptyContainer : styles.listContent
        }
        ListEmptyComponent={
          <EmptyState
            emoji="🔕"
            title="Nenhuma notificação"
            subtitle="Você será notificado sobre tomadas e retornos médicos."
          />
        }
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[colors.primaryContainer]}
            tintColor={colors.primaryContainer}
          />
        }
        accessibilityLabel="Lista de notificações"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundApp,
  },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryContainer,
    paddingVertical: 12,
    paddingHorizontal: spacing.marginMobile,
    gap: 8,
  },
  alertBannerUrgent: {
    backgroundColor: colors.error,
  },
  alertEmoji: {
    fontSize: 20,
  },
  alertText: {
    ...typography.labelLg,
    color: colors.onPrimary,
  },
  listContent: {
    padding: spacing.marginMobile,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.marginMobile,
  },
});
