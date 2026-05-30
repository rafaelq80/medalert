import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { Toast } from '../../components/Toast';
import { useToast } from '../../hooks/useToast';
import { StyleSheet } from 'react-native-unistyles';
import DateTimePicker, { DateTimePickerChangeEvent } from '@react-native-community/datetimepicker';
import { useForm, Controller } from 'react-hook-form';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { FormInput } from '../../components/FormInput';
import { DatePickerInput } from '../../components/DatePickerInput';
import { useAgendasCrud } from '../../hooks/useAgendasCrud';
import { Agenda } from '../../types';
import { MedicamentosStackParamList } from '../../navigation/MedicamentosNavigator';

type Props = NativeStackScreenProps<MedicamentosStackParamList, 'AgendaForm'>;

interface AgendaFormValues {
  horario: string;
  frequencia: 'DIARIA' | 'SEMANAL' | 'PERSONALIZADA';
  dias_semana: string;
  tolerancia_minutos: number;
  data_inicio: string;
  data_fim: string;
}

const FREQUENCIAS: { label: string; value: 'DIARIA' | 'SEMANAL' | 'PERSONALIZADA' }[] = [
  { label: 'Diária', value: 'DIARIA' },
  { label: 'Semanal', value: 'SEMANAL' },
  { label: 'Personalizada', value: 'PERSONALIZADA' },
];

const DIAS_SEMANA = [
  { label: 'Seg', value: '1' },
  { label: 'Ter', value: '2' },
  { label: 'Qua', value: '3' },
  { label: 'Qui', value: '4' },
  { label: 'Sex', value: '5' },
  { label: 'Sáb', value: '6' },
  { label: 'Dom', value: '7' },
];

export function AgendaFormScreen({ route, navigation }: Props) {
  const { medicamentoId, medicamentoNome } = route.params;
  const { agendas, isLoading, error, fetchAgendas, createAgenda, deleteAgenda } =
    useAgendasCrud();

  const [showTimePicker, setShowTimePicker] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { toast, showToast, hideToast } = useToast();

  const { control, handleSubmit, watch, setValue, reset } = useForm<AgendaFormValues>({
    mode: 'onBlur',
    defaultValues: {
      horario: '',
      frequencia: 'DIARIA',
      dias_semana: '',
      tolerancia_minutos: 30,
      data_inicio: new Date().toISOString().split('T')[0],
      data_fim: '',
    },
  });

  const frequencia = watch('frequencia');

  useEffect(() => {
    fetchAgendas(medicamentoId);
  }, [medicamentoId, fetchAgendas]);

  const onSubmit = async (data: AgendaFormValues) => {
    if (!data.horario) {
      showToast('Selecione um horário.', 'error');
      return;
    }
    if (
      (data.frequencia === 'SEMANAL' || data.frequencia === 'PERSONALIZADA') &&
      !data.dias_semana
    ) {
      showToast('Selecione os dias da semana.', 'error');
      return;
    }

    setSubmitting(true);
    const payload: Record<string, unknown> = {
      horario: data.horario + ':00',
      frequencia: data.frequencia,
      tolerancia_minutos: data.tolerancia_minutos,
      data_inicio: data.data_inicio,
    };

    if (data.dias_semana) {
      payload.dias_semana = data.dias_semana;
    }
    if (data.data_fim) {
      payload.data_fim = data.data_fim;
    }

    const success = await createAgenda(medicamentoId, payload);
    setSubmitting(false);

    if (success) {
      reset({
        horario: '',
        frequencia: 'DIARIA',
        dias_semana: '',
        tolerancia_minutos: 30,
        data_inicio: new Date().toISOString().split('T')[0],
        data_fim: '',
      });
    }
  };

  const handleTimeChange = (_event: DateTimePickerChangeEvent, selectedDate: Date) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }
    const hours = selectedDate.getHours().toString().padStart(2, '0');
    const mins = selectedDate.getMinutes().toString().padStart(2, '0');
    setValue('horario', `${hours}:${mins}`);
  };

  const handleTimeDismiss = () => {
    setShowTimePicker(false);
  };

  const renderAgendaItem = ({ item }: { item: Agenda }) => (
    <View style={styles.agendaCard}>
      <View style={styles.agendaContent}>
        <Text style={styles.agendaTime}>{item.horario.slice(0, 5)}</Text>
        <Text style={styles.agendaFreq}>
          {item.frequencia === 'DIARIA'
            ? 'Diária'
            : item.frequencia === 'SEMANAL'
            ? 'Semanal'
            : 'Personalizada'}
          {item.dias_semana ? ` (${item.dias_semana})` : ''}
        </Text>
      </View>
      <TouchableOpacity
        style={styles.deleteBtn}
        onPress={() => deleteAgenda(item)}
        accessibilityLabel="Remover horário"
        accessibilityRole="button"
      >
        <Text style={styles.deleteBtnText}>✕</Text>
      </TouchableOpacity>
    </View>
  );

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
        <Toast visible={toast.visible} message={toast.message} type={toast.type} onDismiss={hideToast} />
        <Text style={styles.title}>Horários de Tomada</Text>
        <Text style={styles.subtitle}>{medicamentoNome}</Text>

        {/* Existing agendas */}
        {isLoading ? (
          <ActivityIndicator size="small" color={styles.primaryContainerColor.color} />
        ) : error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : agendas.length > 0 ? (
          <View style={styles.agendasList}>
            <Text style={styles.sectionTitle}>Horários cadastrados</Text>
            {agendas.map((item) => (
              <View key={item.id}>
                {renderAgendaItem({ item })}
              </View>
            ))}
          </View>
        ) : null}

        {/* New agenda form */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Adicionar horário</Text>

          {/* Time picker */}
          <Text style={styles.label}>Horário *</Text>
          <Controller
            control={control}
            name="horario"
            render={({ field: { value }, fieldState: { error: fieldError } }) => (
              <View>
                <TouchableOpacity
                  style={[styles.timeInput, fieldError && styles.inputError]}
                  onPress={() => setShowTimePicker(true)}
                  accessibilityLabel="Selecionar horário"
                  accessibilityRole="button"
                >
                  <Text
                    style={[styles.timeText, !value && styles.placeholder]}
                  >
                    {value || 'Toque para selecionar'}
                  </Text>
                </TouchableOpacity>
                {fieldError?.message && (
                  <Text style={styles.fieldError}>{fieldError.message}</Text>
                )}
              </View>
            )}
          />
          {showTimePicker && (
            <>
              <DateTimePicker
                value={new Date()}
                mode="time"
                is24Hour
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onValueChange={handleTimeChange}
                onDismiss={handleTimeDismiss}
                locale="pt-BR"
              />
              {Platform.OS === 'ios' && (
                <TouchableOpacity
                  style={styles.doneButton}
                  onPress={() => setShowTimePicker(false)}
                >
                  <Text style={styles.doneButtonText}>Confirmar</Text>
                </TouchableOpacity>
              )}
            </>
          )}

          {/* Frequência */}
          <Text style={styles.label}>Frequência *</Text>
          <Controller
            control={control}
            name="frequencia"
            render={({ field: { value, onChange } }) => (
              <View style={styles.freqOptions}>
                {FREQUENCIAS.map((item) => (
                  <TouchableOpacity
                    key={item.value}
                    style={[styles.freqOption, value === item.value && styles.freqOptionActive]}
                    onPress={() => onChange(item.value)}
                    accessibilityLabel={`Frequência ${item.label}`}
                    accessibilityRole="button"
                    accessibilityState={{ selected: value === item.value }}
                  >
                    <Text style={[styles.freqOptionText, value === item.value && styles.freqOptionTextActive]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          />

          {/* Dias da semana */}
          {(frequencia === 'SEMANAL' || frequencia === 'PERSONALIZADA') && (
            <>
              <Text style={styles.label}>Dias da semana *</Text>
              <Controller
                control={control}
                name="dias_semana"
                render={({ field: { value, onChange }, fieldState: { error: fieldError } }) => {
                  const selectedDays = value ? value.split(',') : [];
                  const toggleDay = (day: string) => {
                    const newDays = selectedDays.includes(day)
                      ? selectedDays.filter((d) => d !== day)
                      : [...selectedDays, day].sort();
                    onChange(newDays.join(','));
                  };
                  return (
                    <View>
                      <View style={styles.daysRow}>
                        {DIAS_SEMANA.map((dia) => (
                          <TouchableOpacity
                            key={dia.value}
                            style={[
                              styles.dayChip,
                              selectedDays.includes(dia.value) && styles.dayChipActive,
                            ]}
                            onPress={() => toggleDay(dia.value)}
                            accessibilityLabel={dia.label}
                            accessibilityRole="button"
                            accessibilityState={{ selected: selectedDays.includes(dia.value) }}
                          >
                            <Text
                              style={[
                                styles.dayChipText,
                                selectedDays.includes(dia.value) && styles.dayChipTextActive,
                              ]}
                            >
                              {dia.label}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                      {fieldError?.message && (
                        <Text style={styles.fieldError}>{fieldError.message}</Text>
                      )}
                    </View>
                  );
                }}
              />
            </>
          )}

          <DatePickerInput
            control={control}
            name="data_inicio"
            label="Data de início *"
            placeholder="Selecione a data de início"
          />

          <DatePickerInput
            control={control}
            name="data_fim"
            label="Data de fim (opcional)"
            placeholder="Sem data de fim"
          />

          <FormInput
            control={control}
            name="tolerancia_minutos"
            label="Tolerância (minutos)"
            placeholder="30"
            keyboardType="number-pad"
          />

          <TouchableOpacity
            style={[styles.button, submitting && styles.buttonDisabled]}
            onPress={handleSubmit(onSubmit)}
            disabled={submitting}
            accessibilityLabel="Adicionar horário"
            accessibilityRole="button"
          >
            {submitting ? (
              <ActivityIndicator color={styles.onPrimaryColor.color} />
            ) : (
              <Text style={styles.buttonText}>Adicionar Horário</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create(theme => ({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: theme.backgroundApp },
  content: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
    gap: 16,
  },
  title: { fontSize: 18, fontWeight: '600', color: theme.screenTitleColor },
  subtitle: { fontSize: 14, fontWeight: '400', lineHeight: 20, color: theme.onSurfaceVariant, marginBottom: 8 },
  sectionTitle: { fontSize: 14, fontWeight: '600', lineHeight: 20, color: theme.onSurface, marginBottom: 8 },
  label: { fontSize: 14, fontWeight: '600', lineHeight: 20, color: theme.onSurface },
  agendasList: { marginBottom: 16 },
  agendaCard: {
    backgroundColor: theme.surfaceCard,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 1,
  },
  agendaContent: { flex: 1 },
  agendaTime: { fontSize: 14, fontWeight: '600', lineHeight: 20, color: theme.primary },
  agendaFreq: { fontSize: 14, fontWeight: '400', lineHeight: 20, color: theme.onSurfaceVariant },
  deleteBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.errorContainer,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteBtnText: { color: theme.error, fontSize: 14, fontWeight: '700' },
  formSection: { gap: 16 },
  timeInput: {
    backgroundColor: theme.inputBg,
    borderWidth: 1,
    borderColor: theme.outline,
    borderRadius: 8,
    paddingHorizontal: 12,
    minHeight: 48,
    justifyContent: 'center',
  },
  inputError: { borderColor: theme.error },
  timeText: { fontSize: 14, fontWeight: '400', lineHeight: 20, color: theme.inputText },
  placeholder: { color: theme.inputPlaceholder },
  fieldError: { fontSize: 12, fontWeight: '500', lineHeight: 16, color: theme.error, marginTop: 4 },
  doneButton: { alignSelf: 'flex-end', paddingVertical: 8, paddingHorizontal: 16 },
  doneButtonText: { fontSize: 14, fontWeight: '600', lineHeight: 20, color: theme.primaryContainer },
  freqOptions: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  freqOption: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: theme.outline,
    backgroundColor: theme.inputBg,
  },
  freqOptionActive: { backgroundColor: theme.primaryContainer, borderColor: theme.primaryContainer },
  freqOptionText: { fontSize: 13, fontWeight: '500', color: theme.inputText },
  freqOptionTextActive: { color: theme.onPrimary, fontWeight: '600' },
  daysRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  dayChip: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.outline,
    backgroundColor: theme.surfaceLow,
  },
  dayChipActive: { backgroundColor: theme.primaryContainer, borderColor: theme.primaryContainer },
  dayChipText: { fontSize: 12, fontWeight: '500', lineHeight: 16, color: theme.onSurfaceVariant },
  dayChipTextActive: { color: theme.onPrimary, fontWeight: '600' },
  errorText: { fontSize: 14, fontWeight: '400', lineHeight: 20, color: theme.error },
  button: {
    backgroundColor: theme.primaryContainer,
    borderRadius: 8,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { fontSize: 14, fontWeight: '600', lineHeight: 20, color: theme.onPrimary },
  // Color tokens for dynamic usage
  onPrimaryColor: { color: theme.onPrimary },
  primaryContainerColor: { color: theme.primaryContainer },
}));
