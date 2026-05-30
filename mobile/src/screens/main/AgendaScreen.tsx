import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, SectionList, RefreshControl, Vibration } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { useAgenda } from '../../hooks/useAgenda';
import { RegistroTomadaCard } from '../../components/RegistroTomadaCard';
import { EmptyState } from '../../components/EmptyState';
import { ErrorState } from '../../components/ErrorState';
import { SelectDropdown } from '../../components/SelectDropdown';
import { ListSkeleton } from '../../components/SkeletonLoader';
import { AnimatedCheck } from '../../components/AnimatedCheck';

import { RegistroTomada } from '../../types';
import { extractTime } from '../../utils/dateUtils';

interface AgendaSection {
  title: string;
  icon: string;
  data: RegistroTomada[];
}

function getTimePeriod(isoString: string): 'manha' | 'tarde' | 'noite' {
  const time = extractTime(isoString);
  const hour = parseInt(time.split(':')[0], 10);
  if (hour < 12) return 'manha';
  if (hour < 18) return 'tarde';
  return 'noite';
}

const PERIOD_CONFIG = {
  manha: { title: 'Manhã', icon: '☀️' },
  tarde: { title: 'Tarde', icon: '🌤️' },
  noite: { title: 'Noite', icon: '🌙' },
};

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

  const [showCheck, setShowCheck] = useState(false);

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

  // Group registros by time period
  const sections: AgendaSection[] = useMemo(() => {
    const groups: Record<string, RegistroTomada[]> = {
      manha: [],
      tarde: [],
      noite: [],
    };

    registros.forEach((r) => {
      const period = getTimePeriod(r.data_hora_prevista);
      groups[period].push(r);
    });

    return (['manha', 'tarde', 'noite'] as const)
      .filter((key) => groups[key].length > 0)
      .map((key) => ({
        title: PERIOD_CONFIG[key].title,
        icon: PERIOD_CONFIG[key].icon,
        data: groups[key],
      }));
  }, [registros]);

  const handleConfirmWithAnimation = (registroId: number) => {
    handleConfirm(registroId);
    setShowCheck(true);
    Vibration.vibrate(100);
  };

  if (isLoading && pacientes.length === 0) {
    return <ListSkeleton count={4} />;
  }

  if (error && pacientes.length === 0) {
    return <ErrorState message={error} onRetry={retry} />;
  }

  return (
    <View style={styles.container}>
      {/* Section title + patient selector */}
      <View style={styles.selectorContainer}>
        <Text style={styles.screenTitle}>Agenda</Text>
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
        <ListSkeleton count={3} />
      ) : error ? (
        <ErrorState message={error} onRetry={retry} />
      ) : sections.length === 0 ? (
        <View style={styles.emptyContainer}>
          <EmptyState
            emoji="📋"
            title="Nenhuma tomada para hoje"
            subtitle="Quando houver medicamentos agendados, eles aparecerão aqui."
          />
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id.toString()}
          renderSectionHeader={({ section }) => (
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionIcon}>{section.icon}</Text>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <Text style={styles.sectionCount}>{section.data.length}</Text>
            </View>
          )}
          renderItem={({ item }) => (
            <RegistroTomadaCard
              registro={item}
              onConfirm={handleConfirmWithAnimation}
              isConfirming={confirmingId === item.id}
            />
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={[styles.refreshColor.color]}
              tintColor={styles.refreshColor.color}
            />
          }
          stickySectionHeadersEnabled={false}
          accessibilityLabel="Agenda do dia agrupada por período"
        />
      )}

      {/* Animated check overlay */}
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
    paddingBottom: 12,
    backgroundColor: theme.surfaceCard,
    borderBottomWidth: 1,
    borderBottomColor: theme.outlineVariant,
    gap: 6,
  },
  screenTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.onSurface,
  },
  pacienteSubtitle: {
    fontSize: 15,
    color: theme.onSurfaceVariant,
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    gap: 8,
  },
  sectionIcon: {
    fontSize: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.onSurface,
    flex: 1,
  },
  sectionCount: {
    fontSize: 13,
    fontWeight: '500',
    color: theme.onSurfaceVariant,
    backgroundColor: theme.surfaceHigh,
    borderRadius: 9999,
    paddingHorizontal: 8,
    paddingVertical: 2,
    overflow: 'hidden',
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
}));
