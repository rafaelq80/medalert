import React, { useState } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Text,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useVinculos } from '../../hooks/useVinculos';
import { EmptyState } from '../../components/EmptyState';
import { ErrorState } from '../../components/ErrorState';
import { LoadingState } from '../../components/LoadingState';
import { api } from '../../services/api';
import { Vinculo } from '../../types';
import { colors } from '../../constants/colors';
import { typography, spacing, borderRadius } from '../../constants/typography';
import { extractDate } from '../../utils/dateUtils';

interface PacienteBusca {
  id: number;
  nome: string;
  email: string;
}

export function VinculosScreen() {
  const {
    vinculos,
    isLoading,
    isRefreshing,
    error,
    handleRefresh,
    handleCreate,
    handleDelete,
    retry,
  } = useVinculos();

  const [showForm, setShowForm] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [searching, setSearching] = useState(false);
  const [creating, setCreating] = useState(false);
  const [pacienteEncontrado, setPacienteEncontrado] = useState<PacienteBusca | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  const handleSearch = async () => {
    const email = emailInput.trim();
    if (!email) {
      setSearchError('Informe o e-mail do paciente.');
      return;
    }

    setSearching(true);
    setSearchError(null);
    setPacienteEncontrado(null);

    try {
      const { data } = await api.get<PacienteBusca>('/usuarios/buscar', {
        params: { email },
      });
      setPacienteEncontrado(data);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { status?: number; data?: { detail?: string } } };
      if (axiosErr.response?.status === 404) {
        setSearchError('Nenhum paciente encontrado com este e-mail.');
      } else if (axiosErr.response?.status === 400) {
        setSearchError(axiosErr.response?.data?.detail || 'O usuário encontrado não é um paciente.');
      } else {
        setSearchError('Erro ao buscar. Verifique o e-mail e tente novamente.');
      }
    } finally {
      setSearching(false);
    }
  };

  const handleConfirmVinculo = async () => {
    if (!pacienteEncontrado) return;

    setCreating(true);
    const success = await handleCreate(pacienteEncontrado.id);
    setCreating(false);

    if (success) {
      setEmailInput('');
      setPacienteEncontrado(null);
      setShowForm(false);
    }
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEmailInput('');
    setPacienteEncontrado(null);
    setSearchError(null);
  };

  const renderVinculoCard = ({ item }: { item: Vinculo }) => (
    <View style={styles.card}>
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{item.paciente_nome || `Paciente #${item.paciente_id}`}</Text>
        <Text style={styles.cardEmail}>{item.paciente_email || ''}</Text>
        <Text style={styles.cardSubtitle}>
          Desde {extractDate(item.data_inicio)}
        </Text>
      </View>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDelete(item)}
        accessibilityLabel={`Remover vínculo com ${item.paciente_nome || 'paciente'}`}
        accessibilityRole="button"
      >
        <Text style={styles.deleteButtonText}>Remover</Text>
      </TouchableOpacity>
    </View>
  );

  if (isLoading) {
    return <LoadingState label="Carregando vínculos" />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={retry} />;
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <FlatList
        data={vinculos}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderVinculoCard}
        contentContainerStyle={
          vinculos.length === 0 ? styles.emptyContainer : styles.listContent
        }
        ListEmptyComponent={
          <EmptyState
            emoji="🔗"
            title="Nenhum vínculo ativo"
            subtitle="Associe-se a um paciente para gerenciar seus medicamentos."
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
        accessibilityLabel="Lista de vínculos"
      />

      {showForm && (
        <View style={styles.formContainer}>
          <Text style={styles.formTitle}>Novo Vínculo</Text>
          <Text style={styles.formHint}>
            Informe o e-mail do paciente que deseja associar
          </Text>

          <View style={styles.searchRow}>
            <TextInput
              style={styles.input}
              value={emailInput}
              onChangeText={(text) => {
                setEmailInput(text);
                setPacienteEncontrado(null);
                setSearchError(null);
              }}
              placeholder="email@do-paciente.com"
              placeholderTextColor={colors.onSurfaceVariant}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              accessibilityLabel="E-mail do paciente"
              editable={!creating}
            />
            <TouchableOpacity
              style={[styles.searchButton, searching && styles.buttonDisabled]}
              onPress={handleSearch}
              disabled={searching || creating}
              accessibilityLabel="Buscar paciente"
              accessibilityRole="button"
            >
              {searching ? (
                <ActivityIndicator size="small" color={colors.onPrimary} />
              ) : (
                <Text style={styles.searchButtonText}>Buscar</Text>
              )}
            </TouchableOpacity>
          </View>

          {searchError && (
            <Text style={styles.errorText}>{searchError}</Text>
          )}

          {pacienteEncontrado && (
            <View style={styles.resultCard}>
              <Text style={styles.resultName}>{pacienteEncontrado.nome}</Text>
              <Text style={styles.resultEmail}>{pacienteEncontrado.email}</Text>
              <TouchableOpacity
                style={[styles.confirmButton, creating && styles.buttonDisabled]}
                onPress={handleConfirmVinculo}
                disabled={creating}
                accessibilityLabel={`Vincular com ${pacienteEncontrado.nome}`}
                accessibilityRole="button"
              >
                {creating ? (
                  <ActivityIndicator size="small" color={colors.onPrimary} />
                ) : (
                  <Text style={styles.confirmButtonText}>Vincular</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleCancelForm}
            disabled={creating}
            accessibilityLabel="Cancelar"
            accessibilityRole="button"
          >
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      )}

      {!showForm && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => setShowForm(true)}
          accessibilityLabel="Adicionar novo vínculo"
          accessibilityRole="button"
        >
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      )}
    </KeyboardAvoidingView>
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
  card: {
    backgroundColor: colors.surfaceCard,
    borderRadius: borderRadius.md,
    padding: spacing.cardPadding,
    marginBottom: spacing.stackGap,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    ...typography.labelLg,
    color: colors.onSurface,
  },
  cardEmail: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    marginTop: 2,
  },
  cardSubtitle: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    marginTop: 4,
  },
  deleteButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: borderRadius.default,
    backgroundColor: colors.errorContainer,
  },
  deleteButtonText: {
    ...typography.labelMd,
    color: colors.error,
  },
  formContainer: {
    backgroundColor: colors.surfaceCard,
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
    padding: spacing.cardPadding,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    gap: 12,
  },
  formTitle: {
    ...typography.headlineMd,
    color: colors.onSurface,
  },
  formHint: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
  },
  searchRow: {
    flexDirection: 'row',
    gap: 8,
  },
  input: {
    ...typography.bodyMd,
    flex: 1,
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: colors.outline,
    borderRadius: borderRadius.default,
    paddingHorizontal: spacing.gutter,
    minHeight: spacing.touchTargetMin,
    color: colors.onSurface,
  },
  searchButton: {
    minHeight: spacing.touchTargetMin,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: borderRadius.default,
    backgroundColor: colors.primaryContainer,
  },
  searchButtonText: {
    ...typography.labelLg,
    color: colors.onPrimary,
  },
  errorText: {
    ...typography.bodyMd,
    color: colors.error,
  },
  resultCard: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: borderRadius.default,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.secondary,
    gap: 8,
  },
  resultName: {
    ...typography.labelLg,
    color: colors.onSurface,
  },
  resultEmail: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
  },
  confirmButton: {
    minHeight: spacing.touchTargetMin,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: borderRadius.default,
    backgroundColor: colors.secondary,
    marginTop: 4,
  },
  confirmButtonText: {
    ...typography.labelLg,
    color: colors.onSecondary,
  },
  cancelButton: {
    minHeight: spacing.touchTargetMin,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: borderRadius.default,
    borderWidth: 1,
    borderColor: colors.outline,
  },
  cancelButtonText: {
    ...typography.labelLg,
    color: colors.onSurfaceVariant,
  },
  buttonDisabled: {
    opacity: 0.7,
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
