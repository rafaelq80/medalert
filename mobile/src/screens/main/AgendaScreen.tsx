import React, { useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl, Vibration } from 'react-native';
import { useAgenda } from '../../hooks/useAgenda';
import { RegistroTomadaCard } from '../../components/RegistroTomadaCard';
import { EmptyState } from '../../components/EmptyState';
import { ErrorState } from '../../components/ErrorState';
import { LoadingState } from '../../components/LoadingState';
import { SelectDropdown } from '../../components/SelectDropdown';
import { colors } from '../../constants/colors';
import { typography, spacing } from '../../constants/typography';

export function AgendaScreen() {
  const {
    registros,
    pacienteNome,
    pacientes,
    selectedPacienteId,
    isLoading,
    isRefreshing,
    error,
    confirmingId,
    handleRefresh,
    handleConfirm,
    handleSelectPaciente,
    retry,
  } = useAgenda();

  const pendingCount = registros.filter(
    (r) => r.status === 'PENDENTE' || r.status === 'ATRASADO'
  ).length;
  const atrasadoCount = registros.filter((r) => r.status === 'ATRASADO').length;

  // Vibrate when there are overdue items
  useEffect(() => {
    if (atrasadoCount > 0) {
      Vibration.vibrate([0, 300, 100, 300]);
    }
  }, [atrasadoCount]);

  if (isLoading && pacientes.length === 0) {
    return <LoadingState label="Carregando agenda" />;
  }

  if (error && pacientes.length === 0) {
    return <ErrorState message={error} onRetry={retry} />;
  }

  return (
    <View style={styles.container}>
      {/* Patient selector for cuidador with multiple vinculos */}
      {pacientes.length > 1 && (
        <View style={styles.selectorContainer}>
          <SelectDropdown
            options={pacientes}
            selectedId={selectedPacienteId}
            onSelect={handleSelectPaciente}
            label="Paciente"
            placeholder="Selecione o paciente"
          />
        </View>
      )}

      {/* Single patient banner */}
      {pacientes.length === 1 && pacienteNome && (
        <View style={styles.pacienteBanner}>
          <Text style={styles.pacienteBannerText}>📋 Agenda de {pacienteNome}</Text>
        </View>
      )}

      {/* Alert banner for pending/overdue items */}
      {pendingCount > 0 && (
        <View style={[styles.alertBanner, atrasadoCount > 0 && styles.alertBannerUrgent]}>
          <Text style={styles.alertEmoji}>{atrasadoCount > 0 ? '⚠️' : '💊'}</Text>
          <Text style={styles.alertText}>
            {atrasadoCount > 0
              ? `${atrasadoCount} tomada${atrasadoCount > 1 ? 's' : ''} atrasada${atrasadoCount > 1 ? 's' : ''}!`
              : `${pendingCount} tomada${pendingCount > 1 ? 's' : ''} pendente${pendingCount > 1 ? 's' : ''} hoje`}
          </Text>
        </View>
      )}

      {isLoading ? (
        <LoadingState label="Carregando agenda" />
      ) : error ? (
        <ErrorState message={error} onRetry={retry} />
      ) : (
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
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundApp,
  },
  selectorContainer: {
    paddingHorizontal: spacing.marginMobile,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: colors.surfaceCard,
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
  },
  pacienteBanner: {
    backgroundColor: colors.surfaceContainerLow,
    paddingVertical: 10,
    paddingHorizontal: spacing.marginMobile,
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
  },
  pacienteBannerText: {
    ...typography.labelLg,
    color: colors.primary,
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
