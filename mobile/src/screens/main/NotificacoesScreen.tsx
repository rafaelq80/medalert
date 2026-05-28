import React from 'react';
import { View, FlatList, StyleSheet, RefreshControl } from 'react-native';
import { useNotificacoes } from '../../hooks/useNotificacoes';
import { NotificacaoItem } from '../../components/NotificacaoItem';
import { EmptyState } from '../../components/EmptyState';
import { ErrorState } from '../../components/ErrorState';
import { LoadingState } from '../../components/LoadingState';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/typography';

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

  if (isLoading) {
    return <LoadingState label="Carregando notificações" />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={retry} />;
  }

  return (
    <View style={styles.container}>
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
