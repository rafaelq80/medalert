import React, { useState } from 'react';
import {
  View,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Text,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Ionicons } from '@expo/vector-icons';
import { useVinculos } from '../../hooks/useVinculos';

import { EmptyState } from '../../components/EmptyState';
import { ErrorState } from '../../components/ErrorState';
import { ListSkeleton } from '../../components/SkeletonLoader';
import { BottomSheet } from '../../components/BottomSheet';
import { Toast } from '../../components/Toast';
import { useToast } from '../../hooks/useToast';
import { UserBadge } from '../../components/UserBadge';
import { api } from '../../services/api';
import { Vinculo } from '../../types';
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
  const [deleteTarget, setDeleteTarget] = useState<Vinculo | null>(null);
  const { toast, showToast, hideToast } = useToast();

  const handleSearch = async () => {
    const email = emailInput.trim().toLowerCase();
    if (!email) {
      setSearchError('Informe o e-mail do paciente.');
      return;
    }
    setSearching(true);
    setSearchError(null);
    setPacienteEncontrado(null);
    try {
      const { data } = await api.get<PacienteBusca>('/usuarios/buscar', { params: { email } });
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
      showToast('Vínculo criado com sucesso.', 'success');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    handleDelete(deleteTarget);
    setDeleteTarget(null);
    showToast('Vínculo removido.', 'info');
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEmailInput('');
    setPacienteEncontrado(null);
    setSearchError(null);
  };

  const renderVinculoCard = ({ item }: { item: Vinculo }) => (
    <View style={styles.card}>
      <UserBadge nome={item.paciente_nome || `P${item.paciente_id}`} size={38} />
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{item.paciente_nome || `Paciente #${item.paciente_id}`}</Text>
        {item.paciente_email ? <Text style={styles.cardEmail}>{item.paciente_email}</Text> : null}
        <Text style={styles.cardSubtitle}>Desde {extractDate(item.data_inicio)}</Text>
      </View>
      <TouchableOpacity
        style={styles.deleteIconBtn}
        onPress={() => setDeleteTarget(item)}
        accessibilityLabel={`Remover vínculo com ${item.paciente_nome || 'paciente'}`}
      >
        <Ionicons name="trash-outline" size={18} color={styles.errorColor.color} />
      </TouchableOpacity>
    </View>
  );

  if (isLoading) {
    return <ListSkeleton count={3} />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={retry} />;
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Toast visible={toast.visible} message={toast.message} type={toast.type} onDismiss={hideToast} />

      {/* Section header */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Vínculos</Text>
        <Text style={styles.sectionCount}>{vinculos.length}</Text>
      </View>

      <FlatList
        data={vinculos}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderVinculoCard}
        contentContainerStyle={vinculos.length === 0 ? styles.emptyContainer : styles.listContent}
        ListEmptyComponent={
          <EmptyState
            emoji="🔗"
            title="Nenhum vínculo ativo"
            subtitle="Associe-se a um paciente para gerenciar seus medicamentos."
            actionLabel="Adicionar Vínculo"
            onAction={() => setShowForm(true)}
          />
        }
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} colors={[styles.refreshColor.color]} tintColor={styles.refreshColor.color} />
        }
      />

      {/* Add form */}
      {showForm && (
        <View style={styles.formContainer}>
          <View style={styles.formHeader}>
            <Text style={styles.formTitle}>Novo Vínculo</Text>
            <TouchableOpacity onPress={handleCancelForm} accessibilityLabel="Fechar">
              <Ionicons name="close" size={22} color={styles.onSurfaceVariantColor.color} />
            </TouchableOpacity>
          </View>
          <Text style={styles.formHint}>Informe o e-mail do paciente</Text>

          <View style={styles.searchRow}>
            <TextInput
              style={styles.input}
              value={emailInput}
              onChangeText={(text) => { setEmailInput(text); setPacienteEncontrado(null); setSearchError(null); }}
              placeholder="email@do-paciente.com"
              placeholderTextColor={styles.onSurfaceVariantColor.color}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!creating}
            />
            <TouchableOpacity
              style={[styles.searchBtn, searching && styles.btnDisabled]}
              onPress={handleSearch}
              disabled={searching || creating}
            >
              {searching ? (
                <ActivityIndicator size="small" color={styles.onPrimaryColor.color} />
              ) : (
                <Ionicons name="search" size={18} color={styles.onPrimaryColor.color} />
              )}
            </TouchableOpacity>
          </View>

          {searchError && <Text style={styles.errorText}>{searchError}</Text>}

          {pacienteEncontrado && (
            <View style={styles.resultCard}>
              <Ionicons name="person-circle-outline" size={32} color={styles.secondaryColor.color} />
              <View style={{ flex: 1 }}>
                <Text style={styles.resultName}>{pacienteEncontrado.nome}</Text>
                <Text style={styles.resultEmail}>{pacienteEncontrado.email}</Text>
              </View>
              <TouchableOpacity
                style={[styles.linkBtn, creating && styles.btnDisabled]}
                onPress={handleConfirmVinculo}
                disabled={creating}
              >
                {creating ? (
                  <ActivityIndicator size="small" color={styles.onSecondaryColor.color} />
                ) : (
                  <>
                    <Ionicons name="link" size={14} color={styles.onSecondaryColor.color} />
                    <Text style={styles.linkBtnText}>Vincular</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {!showForm && vinculos.length > 0 && (
        <TouchableOpacity style={styles.fab} onPress={() => setShowForm(true)} accessibilityLabel="Adicionar novo vínculo">
          <Ionicons name="add" size={26} color={styles.onPrimaryColor.color} />
        </TouchableOpacity>
      )}

      <BottomSheet
        visible={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Remover Vínculo"
        description={`Deseja remover o vínculo com ${deleteTarget?.paciente_nome || 'este paciente'}?`}
        icon="🔗"
        actions={[
          { label: 'Remover', variant: 'destructive', onPress: handleConfirmDelete },
          { label: 'Cancelar', variant: 'cancel', onPress: () => setDeleteTarget(null) },
        ]}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create(theme => ({
  container: { flex: 1, backgroundColor: theme.backgroundApp },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 14, paddingBottom: 6,
  },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: theme.screenTitleColor},
  sectionCount: {
    fontSize: 13, fontWeight: '500', color: theme.onSurfaceVariant,
    backgroundColor: theme.surfaceHigh, borderRadius: 9999,
    paddingHorizontal: 8, paddingVertical: 2, overflow: 'hidden',
  },
  listContent: { paddingHorizontal: 20, paddingBottom: 80 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
  card: {
    backgroundColor: theme.surfaceCard, borderRadius: 12,
    padding: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 12,
    borderWidth: 1, borderColor: theme.outlineVariant,
  },
  cardContent: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: '600', color: theme.onSurface },
  cardEmail: { fontSize: 13, fontWeight: '500', color: theme.onSurfaceVariant, marginTop: 1 },
  cardSubtitle: { fontSize: 12, fontWeight: '500', color: theme.outline, marginTop: 2 },
  deleteIconBtn: { padding: 8 },
  formContainer: {
    backgroundColor: theme.surfaceCard, borderTopLeftRadius: 16, borderTopRightRadius: 16,
    padding: 16, elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.15, shadowRadius: 6, gap: 10,
  },
  formHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  formTitle: { fontSize: 18, fontWeight: '600', color: theme.onSurface },
  formHint: { fontSize: 14, color: theme.onSurfaceVariant },
  searchRow: { flexDirection: 'row', gap: 8 },
  input: {
    fontSize: 15, flex: 1, backgroundColor: theme.inputBg,
    borderWidth: 1, borderColor: theme.outline, borderRadius: 8,
    paddingHorizontal: 12, minHeight: 42, color: theme.inputText,
  },
  searchBtn: {
    width: 42, height: 42, borderRadius: 8,
    backgroundColor: theme.primaryContainer, justifyContent: 'center', alignItems: 'center',
  },
  btnDisabled: { opacity: 0.6 },
  errorText: { fontSize: 13, fontWeight: '500', color: theme.error },
  resultCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: theme.surfaceLow, borderRadius: 8,
    padding: 12, borderWidth: 1, borderColor: theme.secondary,
  },
  resultName: { fontSize: 14, fontWeight: '600', color: theme.onSurface },
  resultEmail: { fontSize: 13, fontWeight: '500', color: theme.onSurfaceVariant },
  linkBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8,
    backgroundColor: theme.secondary,
  },
  linkBtnText: { fontSize: 13, fontWeight: '500', color: theme.onSecondary },
  fab: {
    position: 'absolute', bottom: 24, right: 24, width: 56, height: 56, borderRadius: 28,
    backgroundColor: theme.primaryContainer, justifyContent: 'center', alignItems: 'center',
    elevation: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.25, shadowRadius: 4,
  },
  errorColor: { color: theme.error },
  onSurfaceVariantColor: { color: theme.onSurfaceVariant },
  onPrimaryColor: { color: theme.onPrimary },
  secondaryColor: { color: theme.secondary },
  onSecondaryColor: { color: theme.onSecondary },
  refreshColor: { color: theme.primaryContainer },
}));
