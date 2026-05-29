import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  Switch,
  Modal,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { api } from '../../services/api';
import { colors } from '../../constants/colors';
import { typography, spacing, borderRadius } from '../../constants/typography';
import { FormInput } from '../../components/FormInput';
import { DatePickerInput } from '../../components/DatePickerInput';
import { medicamentoSchema, MedicamentoFormData } from '../../schemas/medicamentoSchema';
import { Categoria } from '../../types';
import { MedicamentosStackParamList } from '../../navigation/MedicamentosNavigator';

type Props = NativeStackScreenProps<MedicamentosStackParamList, 'MedicamentoForm'>;

export function MedicamentoFormScreen({ route, navigation }: Props) {
  const { pacienteId, pacienteNome, medicamento } = route.params;
  const isEditing = !!medicamento;

  const [loading, setLoading] = useState(false);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loadingCategorias, setLoadingCategorias] = useState(true);
  const [showCategoriaModal, setShowCategoriaModal] = useState(false);

  const { control, handleSubmit, watch, setValue } = useForm<MedicamentoFormData>({
    resolver: zodResolver(medicamentoSchema),
    mode: 'onBlur',
    defaultValues: {
      nome: medicamento?.nome ?? '',
      dosagem: medicamento?.dosagem ?? '',
      instrucoes: medicamento?.instrucoes ?? '',
      uso_continuo: medicamento?.uso_continuo ?? false,
      necessita_retorno: medicamento?.necessita_retorno ?? false,
      intervalo_retorno_dias: medicamento?.intervalo_retorno_dias?.toString() ?? '',
      categoria_id: medicamento?.categoria_id ?? undefined,
      data_inicio_tratamento: medicamento?.data_inicio_tratamento ?? '',
    },
  });

  const necessitaRetorno = watch('necessita_retorno');
  const categoriaId = watch('categoria_id');

  const selectedCategoria = categorias.find((c) => c.id === categoriaId);

  useEffect(() => {
    fetchCategorias();
  }, []);

  const fetchCategorias = async () => {
    try {
      const { data } = await api.get<Categoria[]>('/categorias');
      setCategorias(data);
    } catch {
      // Categorias are optional, don't block the form
    } finally {
      setLoadingCategorias(false);
    }
  };

  const onSubmit = async (data: MedicamentoFormData) => {
    setLoading(true);
    try {
      const payload: Record<string, unknown> = {
        nome: data.nome.trim(),
        dosagem: data.dosagem.trim(),
        instrucoes: data.instrucoes.trim(),
        uso_continuo: data.uso_continuo,
        necessita_retorno: data.necessita_retorno,
        data_inicio_tratamento: data.data_inicio_tratamento,
      };

      if (data.necessita_retorno && data.intervalo_retorno_dias) {
        const dias = parseInt(data.intervalo_retorno_dias, 10);
        if (!isNaN(dias) && dias > 0) {
          payload.intervalo_retorno_dias = dias;
        }
      }

      if (data.categoria_id) {
        payload.categoria_id = data.categoria_id;
      }

      if (isEditing) {
        await api.put(`/medicamentos/${medicamento!.id}`, payload);
        Alert.alert('Sucesso', 'Medicamento atualizado com sucesso.', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        await api.post(`/pacientes/${pacienteId}/medicamentos`, payload);
        Alert.alert('Sucesso', 'Medicamento cadastrado com sucesso.', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } } };
      const message = axiosErr.response?.data?.detail || 'Não foi possível salvar o medicamento.';
      Alert.alert('Erro', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>
          {isEditing ? 'Editar Medicamento' : 'Novo Medicamento'}
        </Text>

        <View style={styles.pacienteInfo}>
          <Text style={styles.pacienteLabel}>Paciente:</Text>
          <Text style={styles.pacienteValue}>{pacienteNome || `#${pacienteId}`}</Text>
        </View>

        <FormInput
          control={control}
          name="nome"
          label="Nome do medicamento *"
          placeholder="Ex: Losartana"
        />

        <FormInput
          control={control}
          name="dosagem"
          label="Dosagem *"
          placeholder="Ex: 50mg"
        />

        <FormInput
          control={control}
          name="instrucoes"
          label="Instruções *"
          placeholder="Ex: Tomar em jejum com água"
          multiline
          numberOfLines={3}
        />

        <DatePickerInput
          control={control}
          name="data_inicio_tratamento"
          label="Data de início do tratamento *"
          placeholder="Selecione a data de início"
        />

        {/* Categoria — botão que abre modal */}
        <Text style={styles.label}>Categoria</Text>
        <TouchableOpacity
          style={styles.categoriaButton}
          onPress={() => setShowCategoriaModal(true)}
          disabled={loadingCategorias}
          accessibilityLabel="Selecionar categoria"
          accessibilityRole="button"
        >
          {loadingCategorias ? (
            <ActivityIndicator size="small" color={colors.primaryContainer} />
          ) : (
            <Text
              style={[
                styles.categoriaButtonText,
                !selectedCategoria && styles.categoriaButtonPlaceholder,
              ]}
            >
              {selectedCategoria ? selectedCategoria.nome : 'Toque para selecionar'}
            </Text>
          )}
        </TouchableOpacity>

        {/* Switches */}
        <Controller
          control={control}
          name="uso_continuo"
          render={({ field: { value, onChange } }) => (
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Uso contínuo</Text>
              <Switch
                value={value}
                onValueChange={onChange}
                trackColor={{ false: colors.outlineVariant, true: colors.primaryContainer }}
                thumbColor={value ? colors.onPrimary : colors.surfaceContainerHigh}
                accessibilityLabel="Uso contínuo"
                accessibilityRole="switch"
              />
            </View>
          )}
        />

        <Controller
          control={control}
          name="necessita_retorno"
          render={({ field: { value, onChange } }) => (
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Necessita retorno médico</Text>
              <Switch
                value={value}
                onValueChange={onChange}
                trackColor={{ false: colors.outlineVariant, true: colors.primaryContainer }}
                thumbColor={value ? colors.onPrimary : colors.surfaceContainerHigh}
                accessibilityLabel="Necessita retorno médico"
                accessibilityRole="switch"
              />
            </View>
          )}
        />

        {necessitaRetorno && (
          <FormInput
            control={control}
            name="intervalo_retorno_dias"
            label="Intervalo de retorno (dias)"
            placeholder="Ex: 30"
            keyboardType="number-pad"
          />
        )}

        {/* Submit */}
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSubmit(onSubmit)}
          disabled={loading}
          accessibilityLabel={isEditing ? 'Salvar alterações' : 'Cadastrar medicamento'}
          accessibilityRole="button"
        >
          {loading ? (
            <ActivityIndicator color={colors.onPrimary} />
          ) : (
            <Text style={styles.buttonText}>
              {isEditing ? 'Salvar Alterações' : 'Cadastrar'}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Categoria Modal */}
      <Modal
        visible={showCategoriaModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowCategoriaModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Selecionar Categoria</Text>

            <FlatList
              data={[{ id: undefined as number | undefined, nome: 'Nenhuma', descricao: 'Sem categoria' }, ...categorias]}
              keyExtractor={(item) => String(item.id ?? 'none')}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.modalItem,
                    categoriaId === item.id && styles.modalItemActive,
                  ]}
                  onPress={() => {
                    setValue('categoria_id', item.id);
                    setShowCategoriaModal(false);
                  }}
                  accessibilityLabel={item.nome}
                  accessibilityRole="button"
                  accessibilityState={{ selected: categoriaId === item.id }}
                >
                  <Text
                    style={[
                      styles.modalItemText,
                      categoriaId === item.id && styles.modalItemTextActive,
                    ]}
                  >
                    {item.nome}
                  </Text>
                  {item.descricao && (
                    <Text style={styles.modalItemDesc}>{item.descricao}</Text>
                  )}
                </TouchableOpacity>
              )}
              style={styles.modalList}
            />

            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowCategoriaModal(false)}
              accessibilityLabel="Fechar"
              accessibilityRole="button"
            >
              <Text style={styles.modalCloseText}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: colors.backgroundApp,
  },
  content: {
    paddingHorizontal: spacing.marginMobile,
    paddingTop: 24,
    paddingBottom: 40,
    gap: spacing.stackGap,
  },
  title: {
    ...typography.headlineMd,
    color: colors.primary,
    marginBottom: 4,
  },
  pacienteInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: borderRadius.default,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  pacienteLabel: {
    ...typography.labelMd,
    color: colors.onSurfaceVariant,
  },
  pacienteValue: {
    ...typography.labelLg,
    color: colors.primary,
  },
  label: {
    ...typography.labelLg,
    color: colors.onSurface,
  },
  categoriaButton: {
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: colors.outline,
    borderRadius: borderRadius.default,
    paddingHorizontal: spacing.gutter,
    minHeight: spacing.touchTargetMin,
    justifyContent: 'center',
  },
  categoriaButtonText: {
    ...typography.bodyMd,
    color: colors.onSurface,
  },
  categoriaButtonPlaceholder: {
    color: colors.onSurfaceVariant,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: spacing.touchTargetMin,
    paddingHorizontal: 4,
  },
  switchLabel: {
    ...typography.bodyMd,
    color: colors.onSurface,
  },
  button: {
    backgroundColor: colors.primaryContainer,
    borderRadius: borderRadius.default,
    minHeight: spacing.touchTargetMin,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    ...typography.labelLg,
    color: colors.onPrimary,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surfaceCard,
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
    padding: spacing.cardPadding,
    maxHeight: '60%',
  },
  modalTitle: {
    ...typography.headlineMd,
    color: colors.onSurface,
    marginBottom: 16,
  },
  modalList: {
    flexGrow: 0,
  },
  modalItem: {
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: borderRadius.default,
    marginBottom: 4,
  },
  modalItemActive: {
    backgroundColor: colors.primaryContainer,
  },
  modalItemText: {
    ...typography.labelLg,
    color: colors.onSurface,
  },
  modalItemTextActive: {
    color: colors.onPrimary,
  },
  modalItemDesc: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    marginTop: 2,
  },
  modalCloseButton: {
    minHeight: spacing.touchTargetMin,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: borderRadius.default,
    borderWidth: 1,
    borderColor: colors.outline,
    marginTop: 12,
  },
  modalCloseText: {
    ...typography.labelLg,
    color: colors.onSurfaceVariant,
  },
});
