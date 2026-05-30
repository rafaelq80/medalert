import React, { useCallback } from 'react';
import { View, Text, FlatList, RefreshControl } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { useHistorico } from '../../hooks/useHistorico';
import { PeriodSelector } from '../../components/PeriodSelector';
import { AdherenceCard } from '../../components/AdherenceCard';
import { EmptyState } from '../../components/EmptyState';
import { ErrorState } from '../../components/ErrorState';
import { ListSkeleton } from '../../components/SkeletonLoader';
import { SelectDropdown } from '../../components/SelectDropdown';

import { RegistroTomada, StatusTomada } from '../../types';
import { extractDateTime } from '../../utils/dateUtils';

const STATUS_LABELS: Record<StatusTomada, string> = {
  PENDENTE: 'Pendente',
  CONFIRMADO: 'Confirmado',
  ATRASADO: 'Atrasado',
  IGNORADO: 'Ignorado',
};

export function HistoricoScreen() {
  const { theme } = useUnistyles();
  const STATUS_COLORS: Record<StatusTomada, string> = {
    PENDENTE: theme.statusPending,
    CONFIRMADO: theme.statusConfirmed,
    ATRASADO: theme.statusDelayed,
    IGNORADO: theme.statusIgnored,
  };
  const {
    registros,
    selectedPeriod,
    pacienteNome,
    pacientes,
    selectedPacienteId,
    isLoading,
    isRefreshing,
    error,
    adherencePercentage,
    adherenceColor,
    confirmedCount,
    totalCount,
    handleRefresh,
    handlePeriodChange,
    handleSelectPaciente,
    retry,
  } = useHistorico();

  const renderItem = useCallback(({ item }: { item: RegistroTomada }) => {
    const dateTime = extractDateTime(item.data_hora_prevista);
    const statusColor = STATUS_COLORS[item.status];

    return (
      <View
        style={styles.card}
        accessibilityLabel={`${item.medicamento_nome ?? 'Medicamento'}, ${dateTime}, status ${STATUS_LABELS[item.status]}`}
      >
        <View style={styles.cardContent}>
          <Text style={styles.cardMedName} numberOfLines={1}>
            {item.medicamento_nome ?? 'Medicamento'}
          </Text>
          <Text style={styles.cardDateTime}>🕐 {dateTime}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
          <Text style={styles.statusBadgeText}>{STATUS_LABELS[item.status]}</Text>
        </View>
      </View>
    );
  }, []);

  if (isLoading) {
    return <ListSkeleton count={4} />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={retry} />;
  }

  return (
    <View style={styles.container}>
      {/* Section title + patient selector */}
      <View style={styles.pacienteSelectorContainer}>
        <Text style={styles.sectionTitle}>Histórico</Text>
        {pacientes.length > 1 ? (
          <SelectDropdown
            options={pacientes}
            selectedId={selectedPacienteId}
            onSelect={handleSelectPaciente}
            placeholder="Selecione o paciente"
          />
        ) : pacienteNome ? (
          <Text style={styles.pacienteSubtitle}>{pacienteNome}</Text>
        ) : null}
      </View>

      <PeriodSelector
        selectedPeriod={selectedPeriod}
        onPeriodChange={handlePeriodChange}
      />

      <AdherenceCard
        percentage={adherencePercentage}
        confirmedCount={confirmedCount}
        totalCount={totalCount}
        color={adherenceColor}
      />

      <FlatList
        data={registros}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={
          registros.length === 0 ? styles.emptyContainer : styles.listContent
        }
        ListEmptyComponent={
          <EmptyState
            emoji="📊"
            title="Nenhum registro no período"
            subtitle="Não há registros de tomada para o período selecionado."
          />
        }
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[styles.refreshColor.color]}
            tintColor={styles.refreshColor.color}
          />
        }
        accessibilityLabel="Lista de registros de tomada no período"
      />
    </View>
  );
}

const styles = StyleSheet.create(theme => ({
  container: {
    flex: 1,
    backgroundColor: theme.backgroundApp,
  },
  pacienteSelectorContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: theme.surfaceCard,
    borderBottomWidth: 1,
    borderBottomColor: theme.outlineVariant,
    gap: 6,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.screenTitleColor,
  },
  pacienteSubtitle: {
    fontSize: 15,
    color: theme.onSurfaceVariant,
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
  card: {
    backgroundColor: theme.surfaceCard,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.outlineVariant,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 48,
  },
  cardContent: {
    flex: 1,
    marginRight: 12,
  },
  cardMedName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.onSurface,
    marginBottom: 4,
  },
  cardDateTime: {
    fontSize: 15,
    color: theme.onSurfaceVariant,
  },
  statusBadge: {
    borderRadius: 9999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: theme.onPrimary,
  },
  refreshColor: {
    color: theme.primaryContainer,
  },
}));
