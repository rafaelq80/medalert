import React from 'react';
import { View, FlatList, StyleSheet, RefreshControl } from 'react-native';
import { useAgenda } from '../../hooks/useAgenda';
import { RegistroTomadaCard } from '../../components/RegistroTomadaCard';
import { EmptyState } from '../../components/EmptyState';
import { ErrorState } from '../../components/ErrorState';
import { LoadingState } from '../../components/LoadingState';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/typography';

export function AgendaScreen() {
  const {
    registros,
    isLoading,
    isRefreshing,
    error,
    confirmingId,
    handleRefresh,
    handleConfirm,
    retry,
  } = useAgenda();

  if (isLoading) {
    return <LoadingState label="Carregando agenda" />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={retry} />;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={registros}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <RegistroTomadaCard
            registro={item}
            onConfirm={handleConfirm}
            isConfirming={confirmingId === item.id}
          />
        )}
        contentContainerStyle={
          registros.length === 0 ? styles.emptyContainer : styles.listContent
        }
        ListEmptyComponent={
          <EmptyState
            emoji="📋"
            title="Nenhuma tomada para hoje"
            subtitle="Quando houver medicamentos agendados, eles aparecerão aqui."
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
        accessibilityLabel="Lista de medicamentos agendados para hoje"
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
