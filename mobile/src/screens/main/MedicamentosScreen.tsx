import React, { useCallback } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Text,
  Alert,
} from 'react-native';
import { useMedicamentos } from '../../hooks/useMedicamentos';
import { MedicamentoCard } from '../../components/MedicamentoCard';
import { EmptyState } from '../../components/EmptyState';
import { ErrorState } from '../../components/ErrorState';
import { LoadingState } from '../../components/LoadingState';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/typography';

export function MedicamentosScreen() {
  const {
    medicamentos,
    isLoading,
    isRefreshing,
    error,
    handleRefresh,
    handleDelete,
    retry,
  } = useMedicamentos();

  const handleAddMedicamento = useCallback(() => {
    Alert.alert('Em breve', 'A tela de cadastro de medicamento será implementada em breve.');
  }, []);

  if (isLoading) {
    return <LoadingState label="Carregando medicamentos" />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={retry} />;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={medicamentos}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <MedicamentoCard
            medicamento={item}
            onLongPress={() => handleDelete(item)}
          />
        )}
        contentContainerStyle={
          medicamentos.length === 0 ? styles.emptyContainer : styles.listContent
        }
        ListEmptyComponent={
          <EmptyState
            emoji="💊"
            title="Nenhum medicamento cadastrado"
            subtitle="Adicione medicamentos para começar a gerenciar o tratamento."
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
        accessibilityLabel="Lista de medicamentos"
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={handleAddMedicamento}
        accessibilityLabel="Adicionar novo medicamento"
        accessibilityRole="button"
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
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
    paddingBottom: 80,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.marginMobile,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  fabText: {
    fontSize: 28,
    color: colors.onPrimary,
    fontWeight: '600',
    lineHeight: 30,
  },
});
