import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Toast } from '../../components/Toast';
import { useToast } from '../../hooks/useToast';
import { StyleSheet } from 'react-native-unistyles';
import { Ionicons } from '@expo/vector-icons';
import { LoadingState } from '../../components/LoadingState';
import { ErrorState } from '../../components/ErrorState';
import { obterMetricas, Metricas } from '../../services/adminApi';
import { api } from '../../services/api';

interface MetricCardProps {
  title: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  bgColor: string;
}

function MetricCard({ title, value, icon, color, bgColor }: MetricCardProps) {
  return (
    <View style={styles.card} accessible accessibilityLabel={`${title}: ${value}`}>
      <View style={[styles.cardIconContainer, { backgroundColor: bgColor }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <View style={styles.cardTextContainer}>
        <Text style={styles.cardValue}>{value}</Text>
        <Text style={styles.cardTitle}>{title}</Text>
      </View>
    </View>
  );
}

export function DashboardScreen() {
  const [metricas, setMetricas] = useState<Metricas | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gerandoRegistros, setGerandoRegistros] = useState(false);
  const { toast, showToast, hideToast } = useToast();

  const fetchMetricas = useCallback(async (showFullLoading = true) => {
    try {
      if (showFullLoading) setIsLoading(true);
      setError(null);
      const response = await obterMetricas();
      setMetricas(response.data);
    } catch {
      setError('Não foi possível carregar as métricas do sistema.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchMetricas(); }, [fetchMetricas]);

  const handleRefresh = useCallback(() => { setIsRefreshing(true); fetchMetricas(false); }, [fetchMetricas]);
  const handleRetry = useCallback(() => { fetchMetricas(true); }, [fetchMetricas]);

  const handleGerarRegistros = useCallback(async () => {
    setGerandoRegistros(true);
    try {
      await api.post('/admin/scheduler/gerar-registros');
      showToast('Registros de tomada do dia gerados com sucesso.', 'success');
    } catch {
      showToast('Não foi possível gerar os registros.', 'error');
    } finally {
      setGerandoRegistros(false);
    }
  }, []);

  if (isLoading) return <LoadingState label="Carregando métricas" />;
  if (error) return <ErrorState message={error} onRetry={handleRetry} />;
  if (!metricas) return null;

  const totalUsuarios = Object.values(metricas.usuarios_por_tipo).reduce((s, c) => s + c, 0);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} colors={[styles.refreshColor.color]} />}
    >
      <Toast visible={toast.visible} message={toast.message} type={toast.type} onDismiss={hideToast} />

      {/* Section title */}
      <View style={styles.sectionHeader}>
        <Text style={styles.title}>Dashboard</Text>
      </View>

      {/* Section: Usuários */}
      <Text style={styles.sectionTitle}>Usuários</Text>
      <View style={styles.cardGrid}>
        <MetricCard title="Total" value={totalUsuarios.toString()} icon="people" color={styles.primaryColor.color} bgColor={styles.surfaceHighBg.backgroundColor} />
        <MetricCard title="Pacientes" value={(metricas.usuarios_por_tipo.PACIENTE ?? 0).toString()} icon="person" color={styles.statusPendingColor.color} bgColor="#E3F2FD" />
        <MetricCard title="Responsáveis" value={(metricas.usuarios_por_tipo.RESPONSAVEL ?? 0).toString()} icon="shield-checkmark" color={styles.secondaryColor.color} bgColor="#E8F5E9" />
        <MetricCard title="Cuidadores" value={(metricas.usuarios_por_tipo.CUIDADOR ?? 0).toString()} icon="heart" color="#7B1FA2" bgColor="#F3E5F5" />
      </View>

      {/* Section: Atividade */}
      <Text style={styles.sectionTitle}>Atividade</Text>
      <View style={styles.cardGrid}>
        <MetricCard title="Ativos" value={metricas.usuarios_ativos.toString()} icon="checkmark-circle" color={styles.statusConfirmedColor.color} bgColor="#E8F5E9" />
        <MetricCard title="Vínculos" value={metricas.vinculos_ativos.toString()} icon="link" color={styles.primaryColor.color} bgColor="#E3F2FD" />
      </View>

      {/* Section: Adesão */}
      <Text style={styles.sectionTitle}>Adesão (30 dias)</Text>
      <View style={styles.cardGrid}>
        <MetricCard title="Taxa" value={`${metricas.taxa_adesao_30d.toFixed(0)}%`} icon="trending-up" color={styles.statusConfirmedColor.color} bgColor="#E8F5E9" />
        <MetricCard title="Atrasados" value={metricas.registros_atrasados_30d.toString()} icon="time" color={styles.statusDelayedColor.color} bgColor="#FFEBEE" />
        <MetricCard title="Ignorados" value={metricas.registros_ignorados_30d.toString()} icon="close-circle" color={styles.statusIgnoredColor.color} bgColor="#ECEFF1" />
      </View>

      {/* Section: Ações */}
      <Text style={styles.sectionTitle}>Ações</Text>
      <TouchableOpacity
        style={[styles.actionRow, gerandoRegistros && styles.actionDisabled]}
        onPress={handleGerarRegistros}
        disabled={gerandoRegistros}
        accessibilityLabel="Gerar registros de tomada do dia"
      >
        <View style={styles.actionIcon}>
          {gerandoRegistros ? (
            <ActivityIndicator size="small" color={styles.refreshColor.color} />
          ) : (
            <Ionicons name="timer-outline" size={20} color={styles.refreshColor.color} />
          )}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.actionTitle}>Gerar Registros do Dia</Text>
          <Text style={styles.actionHint}>Cria registros de tomada para agendas ativas de hoje</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={styles.outlineColor.color} />
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create(theme => ({
  container: { flex: 1, backgroundColor: theme.backgroundApp },
  content: { padding: 20, paddingBottom: 40 },
  sectionTitle: {
    fontSize: 13, fontWeight: '500', color: theme.onSurfaceVariant,
    textTransform: 'uppercase', letterSpacing: 0.5,
    marginTop: 20, marginBottom: 10,
  },
  cardGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  card: {
    backgroundColor: theme.surfaceCard, borderRadius: 12,
    padding: 14, minWidth: '47%', flexGrow: 1, flexBasis: '47%',
    borderWidth: 1, borderColor: theme.outlineVariant,
    flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  cardIconContainer: {
    width: 42, height: 42, borderRadius: 21,
    justifyContent: 'center', alignItems: 'center',
  },
  cardTextContainer: { flex: 1 },
  cardValue: { fontSize: 24, fontWeight: '700', color: theme.onSurface },
  cardTitle: { fontSize: 13, fontWeight: '500', color: theme.onSurfaceVariant, marginTop: 2 },
  actionRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: theme.surfaceCard, borderRadius: 12,
    padding: 14, borderWidth: 1, borderColor: theme.outlineVariant,
  },
  actionDisabled: { opacity: 0.6 },
  actionIcon: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: theme.surfaceHigh,
    justifyContent: 'center', alignItems: 'center',
  },
  actionTitle: { fontSize: 14, fontWeight: '600', color: theme.onSurface },
  actionHint: { fontSize: 12, fontWeight: '500', color: theme.onSurfaceVariant, marginTop: 2 },
  refreshColor: { color: theme.primaryContainer },
  primaryColor: { color: theme.primary },
  secondaryColor: { color: theme.secondary },
  statusPendingColor: { color: theme.statusPending },
  statusConfirmedColor: { color: theme.statusConfirmed },
  statusDelayedColor: { color: theme.statusDelayed },
  statusIgnoredColor: { color: theme.statusIgnored },
  outlineColor: { color: theme.outline },
  surfaceHighBg: { backgroundColor: theme.surfaceHigh },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 2,
    paddingBottom: 2,
  },
   title: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.screenTitleColor,
  },
}));
