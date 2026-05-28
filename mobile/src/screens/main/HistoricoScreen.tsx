import React, { useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl } from 'react-native';
import { format, parseISO } from 'date-fns';
import { useHistorico } from '../../hooks/useHistorico';
import { PeriodSelector } from '../../components/PeriodSelector';
import { AdherenceCard } from '../../components/AdherenceCard';
import { EmptyState } from '../../components/EmptyState';
import { ErrorState } from '../../components/ErrorState';
import { LoadingState } from '../../components/LoadingState';
import { colors } from '../../constants/colors';
import { typography, spacing, borderRadius } from '../../constants/typography';
import { RegistroTomada, StatusTomada } from '../../types';

const STATUS_COLORS: Record<StatusTomada, string> = {
  PENDENTE: colors.statusPending,
  CONFIRMADO: colors.statusConfirmed,
  ATRASADO: colors.statusDelayed,
  IGNORADO: colors.statusIgnored,
};

const STATUS_LABELS: Record<StatusTomada, string> = {
  PENDENTE: 'Pendente',
  CONFIRMADO: 'Confirmado',
  ATRASADO: 'Atrasado',
  IGNORADO: 'Ignorado',
};

export function HistoricoScreen() {
  const {
    registros,
    selectedPeriod,
    isLoading,
    isRefreshing,
    error,
    adherencePercentage,
    adherenceColor,
    confirmedCount,
    totalCount,
    handleRefresh,
    handlePeriodChange,
    retry,
  } = useHistorico();

  const renderItem = useCallback(({ item }: { item: RegistroTomada }) => {
    const dateTime = format(parseISO(item.data_hora_prevista), 'dd/MM/yyyy HH:mm');
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
    return <LoadingState label="Carregando histórico" />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={retry} />;
  }

  return (
    <View style={styles.container}>
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
            colors={[colors.primaryContainer]}
            tintColor={colors.primaryContainer}
          />
        }
        accessibilityLabel="Lista de registros de tomada no período"
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
  card: {
    backgroundColor: colors.surfaceCard,
    borderRadius: borderRadius.lg,
    padding: spacing.cardPadding,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    marginBottom: spacing.stackGap,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: spacing.touchTargetMin,
  },
  cardContent: {
    flex: 1,
    marginRight: 12,
  },
  cardMedName: {
    ...typography.labelLg,
    color: colors.onSurface,
    marginBottom: 4,
  },
  cardDateTime: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
  },
  statusBadge: {
    borderRadius: borderRadius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusBadgeText: {
    ...typography.statusTag,
    color: colors.onPrimary,
  },
});
