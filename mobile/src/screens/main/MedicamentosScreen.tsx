import React, { useCallback } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Text,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMedicamentos } from '../../hooks/useMedicamentos';
import { MedicamentoCard } from '../../components/MedicamentoCard';
import { EmptyState } from '../../components/EmptyState';
import { ErrorState } from '../../components/ErrorState';
import { LoadingState } from '../../components/LoadingState';
import { SelectDropdown } from '../../components/SelectDropdown';
import { Medicamento } from '../../types';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/typography';
import { MedicamentosStackParamList } from '../../navigation/MedicamentosNavigator';

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

  const insets = useSafeAreaInsets();

  if (isLoading && pacientes.length === 0) {
    return <LoadingState label="Carregando medicamentos" />;
  }

  if (error && pacientes.length === 0) {
    return <ErrorState message={error} onRetry={retry} />;
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Patient selector — only shown when multiple vinculos */}
      {pacientes.length > 1 && (
        <View style={styles.pacienteSelectorContainer}>
          <SelectDropdown
            options={pacientes}
            selectedId={pacienteId}
            onSelect={handleSelectPaciente}
            label="Paciente"
            placeholder="Selecione o paciente"
          />
        </View>
      )}

      {isLoading ? (
        <LoadingState label="Carregando medicamentos" />
      ) : error ? (
        <ErrorState message={error} onRetry={retry} />
      ) : (
        <FlatList
          data={medicamentos}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <MedicamentoCard
              medicamento={item}
              onPress={() => handleEditMedicamento(item)}
              onLongPress={() => handleDelete(item)}
              onManageAgendas={() => handleManageAgendas(item)}
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
      )}

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
  pacienteSelectorContainer: {
    paddingHorizontal: spacing.marginMobile,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: colors.surfaceCard,
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
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
