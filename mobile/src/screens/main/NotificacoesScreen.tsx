import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, RefreshControl, Vibration, ActivityIndicator } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { useNotificacoes } from '../../hooks/useNotificacoes';
import { NotificacaoItem } from '../../components/NotificacaoItem';
import { EmptyState } from '../../components/EmptyState';
import { ErrorState } from '../../components/ErrorState';
import { SelectDropdown } from '../../components/SelectDropdown';
import { ListSkeleton } from '../../components/SkeletonLoader';
import { AnimatedCheck } from '../../components/AnimatedCheck';
import { api } from '../../services/api';

export function NotificacoesScreen() {
  
  const {
    notificacoes,
    pacientes,
    selectedPacienteId,
    isLoading,
    isRefreshing,
    isLoadingMore,
    hasMore,
    error,
    handleRefresh,
    handleLoadMore,
    handleMarkAsRead,
    handleSelectPaciente,
    retry,
  } = useNotificacoes();

  const [confirmingId, setConfirmingId] = useState<number | null>(null);
  const [showCheck, setShowCheck] = useState(false);

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

  const handleQuickConfirm = useCallback(async (registroTomadaId: number) => {
    setConfirmingId(registroTomadaId);
    try {
      await api.put(`/registros-tomada/${registroTomadaId}/confirmar`);
      setShowCheck(true);
      Vibration.vibrate(100);
      handleRefresh();
    } catch {
      // Silently fail
    } finally {
      setConfirmingId(null);
    }
  }, [handleRefresh]);

  if (isLoading) {
    return <ListSkeleton count={5} />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={retry} />;
  }

  return (
    <View style={styles.container}>
      {/* Section title + patient selector */}
      <View style={styles.selectorContainer}>
        <Text style={styles.screenTitle}>Notificações</Text>
        {pacientes.length > 1 && (
          <SelectDropdown
            options={pacientes}
            selectedId={selectedPacienteId}
            onSelect={handleSelectPaciente}
            placeholder="Selecione o paciente"
          />
        )}
      </View>

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
            onQuickConfirm={handleQuickConfirm}
            isConfirming={confirmingId === item.registro_tomada_id}
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
        ListFooterComponent={
          isLoadingMore ? (
            <View style={styles.footer}>
              <ActivityIndicator size="small" color={styles.refreshColor.color} />
            </View>
          ) : null
        }
        onEndReached={hasMore ? handleLoadMore : undefined}
        onEndReachedThreshold={0.3}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[styles.refreshColor.color]}
            tintColor={styles.refreshColor.color}
          />
        }
        accessibilityLabel="Lista de notificações"
      />

      <AnimatedCheck visible={showCheck} onComplete={() => setShowCheck(false)} />
    </View>
  );
}

const styles = StyleSheet.create(theme => ({
  container: {
    flex: 1,
    backgroundColor: theme.backgroundApp,
  },
  selectorContainer: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 10,
    backgroundColor: theme.surfaceCard,
    borderBottomWidth: 1,
    borderBottomColor: theme.outlineVariant,
    gap: 6,
  },
  screenTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.screenTitleColor,
  },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.primaryContainer,
    paddingVertical: 12,
    paddingHorizontal: 20,
    gap: 8,
  },
  alertBannerUrgent: {
    backgroundColor: theme.error,
  },
  alertEmoji: {
    fontSize: 20,
  },
  alertText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.onPrimary,
  },
  listContent: {
    padding: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  refreshColor: {
    color: theme.primaryContainer,
  },
  footer: {
    paddingVertical: 16,
    alignItems: 'center',
  },
}));
