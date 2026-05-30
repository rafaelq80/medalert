import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Switch,
  Modal,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Toast } from '../../components/Toast';
import { StyleSheet } from 'react-native-unistyles';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { api } from '../../services/api';
import { FormInput } from '../../components/FormInput';
import { DatePickerInput } from '../../components/DatePickerInput';
import { medicamentoSchema, MedicamentoFormData } from '../../schemas/medicamentoSchema';
import { Categoria } from '../../types';
import { MedicamentosStackParamList } from '../../navigation/MedicamentosNavigator';

type Props = NativeStackScreenProps<MedicamentosStackParamList, 'MedicamentoForm'>;

export function MedicamentoFormScreen({ route, navigation }: Props) {
  const { pacienteId, pacienteNome, medicamento } = route.params;
  const isEditing = !!medicamento;

  const [toast, setToast] = useState({ visible: false, message: '', type: 'info' as 'success' | 'error' | 'info' });
  const showToast = (message: string, type: 'success' | 'error' | 'info') => setToast({ visible: true, message, type });

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
        showToast('Medicamento atualizado com sucesso.', 'success');
        setTimeout(() => navigation.goBack(), 1500);
      } else {
        await api.post(`/pacientes/${pacienteId}/medicamentos`, payload);
        showToast('Medicamento cadastrado com sucesso.', 'success');
        setTimeout(() => navigation.goBack(), 1500);
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } } };
      const message = axiosErr.response?.data?.detail || 'Não foi possível salvar o medicamento.';
      showToast(message, 'error');
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
        <Toast visible={toast.visible} message={toast.message} type={toast.type} onDismiss={() => setToast(t => ({ ...t, visible: false }))} />
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
            <ActivityIndicator size="small" color={styles.primaryContainerColor.color} />
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
                trackColor={{ false: styles.outlineVariantColor.color, true: styles.primaryContainerColor.color }}
                thumbColor={value ? styles.onPrimaryColor.color : styles.surfaceHighColor.color}
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
                trackColor={{ false: styles.outlineVariantColor.color, true: styles.primaryContainerColor.color }}
                thumbColor={value ? styles.onPrimaryColor.color : styles.surfaceHighColor.color}
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
            <ActivityIndicator color={styles.onPrimaryColor.color} />
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

const styles = StyleSheet.create(theme => ({
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: theme.backgroundApp,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
    gap: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 28,
    color: theme.primary,
    marginBottom: 4,
  },
  pacienteInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.surfaceLow,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  pacienteLabel: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
    color: theme.onSurfaceVariant,
  },
  pacienteValue: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
    color: theme.primary,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
    color: theme.onSurface,
  },
  categoriaButton: {
    backgroundColor: theme.inputBg,
    borderWidth: 1,
    borderColor: theme.outline,
    borderRadius: 8,
    paddingHorizontal: 12,
    minHeight: 48,
    justifyContent: 'center',
  },
  categoriaButtonText: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
    color: theme.inputText,
  },
  categoriaButtonPlaceholder: {
    color: theme.inputPlaceholder,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 48,
    paddingHorizontal: 4,
  },
  switchLabel: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
    color: theme.onSurface,
  },
  button: {
    backgroundColor: theme.primaryContainer,
    borderRadius: 8,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
    color: theme.onPrimary,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.surfaceCard,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    maxHeight: '60%',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 28,
    color: theme.onSurface,
    marginBottom: 16,
  },
  modalList: {
    flexGrow: 0,
  },
  modalItem: {
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 4,
  },
  modalItemActive: {
    backgroundColor: theme.primaryContainer,
  },
  modalItemText: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
    color: theme.onSurface,
  },
  modalItemTextActive: {
    color: theme.onPrimary,
  },
  modalItemDesc: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
    color: theme.onSurfaceVariant,
    marginTop: 2,
  },
  modalCloseButton: {
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.outline,
    marginTop: 12,
  },
  modalCloseText: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
    color: theme.onSurfaceVariant,
  },
  // Color tokens for dynamic usage
  onPrimaryColor: { color: theme.onPrimary },
  outlineVariantColor: { color: theme.outlineVariant },
  primaryContainerColor: { color: theme.primaryContainer },
  surfaceHighColor: { color: theme.surfaceHigh },
}));
