import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { colors } from '../../constants/colors';
import { typography, spacing, borderRadius } from '../../constants/typography';
import { LoadingState } from '../../components/LoadingState';
import { ErrorState } from '../../components/ErrorState';
import { obterMetricas, Metricas } from '../../services/adminApi';
import { api } from '../../services/api';

interface MetricCardProps {
  title: string;
  value: string;
  color?: string;
}

function MetricCard({ title, value, color = colors.primary }: MetricCardProps) {
  return (
    <View
      style={styles.card}
      accessible
      accessibilityRole="summary"
      accessibilityLabel={`${title}: ${value}`}
    >
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={[styles.cardValue, { color }]}>{value}</Text>
    </View>
  );
}

export function DashboardScreen() {
  const [metricas, setMetricas] = useState<Metricas | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gerandoRegistros, setGerandoRegistros] = useState(false);

  const fetchMetricas = useCallback(async (showFullLoading = true) => {
    try {
      if (showFullLoading) {
        setIsLoading(true);
      }
      setError(null);
      const response = await obterMetricas();
      setMetricas(response.data);
    } catch (err) {
      setError('Não foi possível carregar as métricas do sistema.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchMetricas();
  }, [fetchMetricas]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchMetricas(false);
  }, [fetchMetricas]);

  const handleRetry = useCallback(() => {
    fetchMetricas(true);
  }, [fetchMetricas]);

  const handleGerarRegistros = useCallback(async () => {
    setGerandoRegistros(true);
    try {
      await api.post('/admin/scheduler/gerar-registros');
      Alert.alert('Sucesso', 'Registros de tomada do dia gerados com sucesso.');
    } catch {
      Alert.alert('Erro', 'Não foi possível gerar os registros. Tente novamente.');
    } finally {
      setGerandoRegistros(false);
    }
  }, []);

  if (isLoading) {
    return <LoadingState label="Carregando métricas" />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={handleRetry} />;
  }

  if (!metricas) {
    return null;
  }

  const totalUsuarios = Object.values(metricas.usuarios_por_tipo).reduce(
    (sum, count) => sum + count,
    0,
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          colors={[colors.primaryContainer]}
          tintColor={colors.primaryContainer}
        />
      }
      accessibilityLabel="Dashboard administrativo"
    >
      <Text style={styles.heading}>Dashboard</Text>
      <Text style={styles.subtitle}>Métricas do sistema</Text>

      {/* Usuários por tipo */}
      <Text style={styles.sectionTitle}>Usuários por tipo</Text>
      <View style={styles.cardGrid}>
        <MetricCard
          title="Total de usuários"
          value={totalUsuarios.toString()}
          color={colors.primary}
        />
        {Object.entries(metricas.usuarios_por_tipo).map(([tipo, count]) => (
          <MetricCard
            key={tipo}
            title={tipo.charAt(0) + tipo.slice(1).toLowerCase()}
            value={count.toString()}
            color={colors.onSurfaceVariant}
          />
        ))}
      </View>

      {/* Atividade */}
      <Text style={styles.sectionTitle}>Atividade</Text>
      <View style={styles.cardGrid}>
        <MetricCard
          title="Usuários ativos"
          value={metricas.usuarios_ativos.toString()}
          color={colors.secondary}
        />
        <MetricCard
          title="Vínculos ativos"
          value={metricas.vinculos_ativos.toString()}
          color={colors.primary}
        />
      </View>

      {/* Adesão */}
      <Text style={styles.sectionTitle}>Adesão (últimos 30 dias)</Text>
      <View style={styles.cardGrid}>
        <MetricCard
          title="Taxa de adesão"
          value={`${metricas.taxa_adesao_30d.toFixed(1)}%`}
          color={colors.statusConfirmed}
        />
        <MetricCard
          title="Registros atrasados"
          value={metricas.registros_atrasados_30d.toString()}
          color={colors.statusDelayed}
        />
        <MetricCard
          title="Registros ignorados"
          value={metricas.registros_ignorados_30d.toString()}
          color={colors.statusIgnored}
        />
      </View>

      {/* Ações do Scheduler */}
      <Text style={styles.sectionTitle}>Ações</Text>
      <TouchableOpacity
        style={[styles.actionButton, gerandoRegistros && styles.actionButtonDisabled]}
        onPress={handleGerarRegistros}
        disabled={gerandoRegistros}
        accessibilityLabel="Gerar registros de tomada do dia"
        accessibilityRole="button"
      >
        {gerandoRegistros ? (
          <ActivityIndicator size="small" color={colors.onPrimary} />
        ) : (
          <Text style={styles.actionButtonText}>⏰ Gerar Registros do Dia</Text>
        )}
      </TouchableOpacity>
      <Text style={styles.actionHint}>
        Gera os registros de tomada para todas as agendas ativas de hoje.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundApp,
  },
  content: {
    padding: spacing.marginMobile,
    paddingBottom: 40,
  },
  heading: {
    ...typography.headlineMd,
    color: colors.onSurface,
  },
  subtitle: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    marginTop: 4,
    marginBottom: spacing.gutter,
  },
  sectionTitle: {
    ...typography.labelLg,
    color: colors.onSurface,
    marginTop: spacing.gutter,
    marginBottom: spacing.stackGap,
  },
  cardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.stackGap,
  },
  card: {
    backgroundColor: colors.surfaceCard,
    borderRadius: borderRadius.md,
    padding: spacing.cardPadding,
    minWidth: '45%',
    flexGrow: 1,
    flexBasis: '45%',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  cardTitle: {
    ...typography.labelMd,
    color: colors.onSurfaceVariant,
    marginBottom: 8,
  },
  cardValue: {
    ...typography.headlineMd,
    color: colors.primary,
  },
  actionButton: {
    backgroundColor: colors.primaryContainer,
    borderRadius: borderRadius.default,
    minHeight: spacing.touchTargetMin,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.gutter,
  },
  actionButtonDisabled: {
    opacity: 0.7,
  },
  actionButtonText: {
    ...typography.labelLg,
    color: colors.onPrimary,
  },
  actionHint: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    marginTop: 6,
  },
});
