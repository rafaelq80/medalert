import React, { useCallback, useState, useMemo } from 'react';
import {
  View,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Text,
  TextInput,
} from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMedicamentos } from '../../hooks/useMedicamentos';
import { MedicamentoCard } from '../../components/MedicamentoCard';
import { EmptyState } from '../../components/EmptyState';
import { ErrorState } from '../../components/ErrorState';
import { SelectDropdown } from '../../components/SelectDropdown';
import { ListSkeleton } from '../../components/SkeletonLoader';
import { BottomSheet } from '../../components/BottomSheet';
import { Medicamento } from '../../types';

import { MedicamentosStackParamList } from '../../navigation/MedicamentosNavigator';
import { api } from '../../services/api';

type NavigationProp = NativeStackNavigationProp<MedicamentosStackParamList, 'MedicamentosList'>;

export function MedicamentosScreen() {
  
  const navigation = useNavigation<NavigationProp>();
  const {
    medicamentos,
    pacienteId,
    pacientes,
    isLoading,
    isRefreshing,
    error,
    handleRefresh,
    handleDelete,
    handleSelectPaciente,
    retry,
  } = useMedicamentos();

  const [searchQuery, setSearchQuery] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Medicamento | null>(null);

  // Filter medicamentos by search query
  const filteredMedicamentos = useMemo(() => {
    if (!searchQuery.trim()) return medicamentos;
    const query = searchQuery.toLowerCase();
    return medicamentos.filter(
      (m) =>
        m.nome.toLowerCase().includes(query) ||
        m.dosagem.toLowerCase().includes(query) ||
        (m.categoria_nome && m.categoria_nome.toLowerCase().includes(query))
    );
  }, [medicamentos, searchQuery]);

  const handleAddMedicamento = useCallback(() => {
    if (!pacienteId) return;
    const paciente = pacientes.find((p) => p.id === pacienteId);
    navigation.navigate('MedicamentoForm', {
      pacienteId,
      pacienteNome: paciente?.label,
    });
  }, [navigation, pacienteId, pacientes]);

  const handleEditMedicamento = useCallback(
    (medicamento: Medicamento) => {
      if (!pacienteId) return;
      const paciente = pacientes.find((p) => p.id === pacienteId);
      navigation.navigate('MedicamentoForm', {
        pacienteId,
        pacienteNome: paciente?.label,
        medicamento,
      });
    },
    [navigation, pacienteId, pacientes]
  );

  const handleManageAgendas = useCallback(
    (medicamento: Medicamento) => {
      navigation.navigate('AgendaForm', {
        medicamentoId: medicamento.id,
        medicamentoNome: medicamento.nome,
      });
    },
    [navigation]
  );

  const handleConfirmDelete = useCallback(() => {
    if (deleteTarget) {
      handleDelete(deleteTarget);
      setDeleteTarget(null);
    }
  }, [deleteTarget, handleDelete]);

  if (isLoading && pacientes.length === 0) {
    return <ListSkeleton count={4} />;
  }

  if (error && pacientes.length === 0) {
    return <ErrorState message={error} onRetry={retry} />;
  }

  const pacienteNome = pacientes.length === 1 ? pacientes[0].label : undefined;

  return (
    <View style={styles.container}>
      {/* Section title + patient selector */}
      <View style={styles.pacienteSelectorContainer}>
        <Text style={styles.sectionTitle}>Medicamentos</Text>
        {pacientes.length > 1 ? (
          <SelectDropdown
            options={pacientes}
            selectedId={pacienteId}
            onSelect={handleSelectPaciente}
            placeholder="Selecione o paciente"
          />
        ) : pacienteNome ? (
          <Text style={styles.pacienteSubtitle}>{pacienteNome}</Text>
        ) : null}
      </View>

      {/* Search bar */}
      {medicamentos.length > 3 && (
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Buscar medicamento..."
            placeholderTextColor={styles.placeholderColor.color}
            accessibilityLabel="Buscar medicamento"
          />
        </View>
      )}

      {isLoading ? (
        <ListSkeleton count={3} />
      ) : error ? (
        <ErrorState message={error} onRetry={retry} />
      ) : (
        <FlatList
          data={filteredMedicamentos}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <MedicamentoCard
              medicamento={item}
              onPress={() => handleEditMedicamento(item)}
              onLongPress={() => setDeleteTarget(item)}
              onManageAgendas={() => handleManageAgendas(item)}
            />
          )}
          contentContainerStyle={
            filteredMedicamentos.length === 0 ? styles.emptyContainer : styles.listContent
          }
          ListEmptyComponent={
            <EmptyState
              emoji="💊"
              title={searchQuery ? 'Nenhum resultado' : 'Nenhum medicamento cadastrado'}
              subtitle={
                searchQuery
                  ? 'Tente buscar com outro termo.'
                  : 'Adicione medicamentos para começar a gerenciar o tratamento.'
              }
              actionLabel={!searchQuery ? 'Adicionar Medicamento' : undefined}
              onAction={!searchQuery ? handleAddMedicamento : undefined}
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
          accessibilityLabel="Lista de medicamentos"
        />
      )}

      <TouchableOpacity
        style={styles.fab}
        onPress={handleAddMedicamento}
        accessibilityLabel="Adicionar novo medicamento"
        accessibilityRole="button"
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {/* Delete confirmation bottom sheet */}
      <BottomSheet
        visible={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Inativar Medicamento"
        description={`Deseja realmente inativar "${deleteTarget?.nome}"? Esta ação pode ser revertida.`}
        icon="💊"
        actions={[
          {
            label: 'Inativar',
            variant: 'destructive',
            onPress: handleConfirmDelete,
          },
          {
            label: 'Cancelar',
            variant: 'cancel',
            onPress: () => setDeleteTarget(null),
          },
        ]}
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
    color: theme.onSurface,
  },
  pacienteSubtitle: {
    fontSize: 15,
    color: theme.onSurfaceVariant,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 4,
  },
  searchInput: {
    fontSize: 15,
    backgroundColor: theme.surfaceLow,
    borderWidth: 1,
    borderColor: theme.outline,
    borderRadius: 8,
    paddingHorizontal: 16,
    minHeight: 40,
    color: theme.onSurface,
  },
  listContent: {
    padding: 20,
    paddingBottom: 80,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.primaryContainer,
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
    color: theme.onPrimary,
    fontWeight: '600',
    lineHeight: 30,
  },
  placeholderColor: {
    color: theme.onSurfaceVariant,
  },
  refreshColor: {
    color: theme.primaryContainer,
  },
}));
