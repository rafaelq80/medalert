import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import DateTimePicker, { DateTimePickerChangeEvent } from '@react-native-community/datetimepicker';
import { useForm, Controller } from 'react-hook-form';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors } from '../../constants/colors';
import { typography, spacing, borderRadius } from '../../constants/typography';
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
      Alert.alert('Erro', 'Selecione um horário.');
      return;
    }
    if (
      (data.frequencia === 'SEMANAL' || data.frequencia === 'PERSONALIZADA') &&
      !data.dias_semana
    ) {
      Alert.alert('Erro', 'Selecione os dias da semana.');
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
        <Text style={styles.title}>Horários de Tomada</Text>
        <Text style={styles.subtitle}>{medicamentoNome}</Text>

        {/* Existing agendas */}
        {isLoading ? (
          <ActivityIndicator size="small" color={colors.primaryContainer} />
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
              <View style={styles.freqSelector}>
                {FREQUENCIAS.map((item) => (
                  <TouchableOpacity
                    key={item.value}
                    style={[
                      styles.freqButton,
                      value === item.value && styles.freqButtonActive,
                    ]}
                    onPress={() => onChange(item.value)}
                    accessibilityLabel={`Frequência ${item.label}`}
                    accessibilityRole="button"
                    accessibilityState={{ selected: value === item.value }}
                  >
                    <Text
                      style={[
                        styles.freqButtonText,
                        value === item.value && styles.freqButtonTextActive,
                      ]}
                    >
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
              <ActivityIndicator color={colors.onPrimary} />
            ) : (
              <Text style={styles.buttonText}>Adicionar Horário</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: colors.backgroundApp },
  content: {
    paddingHorizontal: spacing.marginMobile,
    paddingTop: 24,
    paddingBottom: 40,
    gap: spacing.stackGap,
  },
  title: { ...typography.headlineMd, color: colors.primary },
  subtitle: { ...typography.bodyMd, color: colors.onSurfaceVariant, marginBottom: 8 },
  sectionTitle: { ...typography.labelLg, color: colors.onSurface, marginBottom: 8 },
  label: { ...typography.labelLg, color: colors.onSurface },
  agendasList: { marginBottom: 16 },
  agendaCard: {
    backgroundColor: colors.surfaceCard,
    borderRadius: borderRadius.default,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 1,
  },
  agendaContent: { flex: 1 },
  agendaTime: { ...typography.labelLg, color: colors.primary },
  agendaFreq: { ...typography.bodyMd, color: colors.onSurfaceVariant },
  deleteBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.errorContainer,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteBtnText: { color: colors.error, fontSize: 14, fontWeight: '700' },
  formSection: { gap: spacing.stackGap },
  timeInput: {
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: colors.outline,
    borderRadius: borderRadius.default,
    paddingHorizontal: spacing.gutter,
    minHeight: spacing.touchTargetMin,
    justifyContent: 'center',
  },
  inputError: { borderColor: colors.error },
  timeText: { ...typography.bodyMd, color: colors.onSurface },
  placeholder: { color: colors.onSurfaceVariant },
  fieldError: { ...typography.labelMd, color: colors.error, marginTop: 4 },
  doneButton: { alignSelf: 'flex-end', paddingVertical: 8, paddingHorizontal: 16 },
  doneButtonText: { ...typography.labelLg, color: colors.primaryContainer },
  freqSelector: { flexDirection: 'row', gap: 8 },
  freqButton: {
    flex: 1,
    minHeight: spacing.touchTargetMin,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.outline,
    borderRadius: borderRadius.default,
    backgroundColor: colors.surfaceContainerLow,
  },
  freqButtonActive: { backgroundColor: colors.primaryContainer, borderColor: colors.primaryContainer },
  freqButtonText: { ...typography.labelMd, color: colors.onSurfaceVariant },
  freqButtonTextActive: { color: colors.onPrimary, fontWeight: '600' },
  daysRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  dayChip: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.outline,
    backgroundColor: colors.surfaceContainerLow,
  },
  dayChipActive: { backgroundColor: colors.primaryContainer, borderColor: colors.primaryContainer },
  dayChipText: { ...typography.labelMd, color: colors.onSurfaceVariant },
  dayChipTextActive: { color: colors.onPrimary, fontWeight: '600' },
  errorText: { ...typography.bodyMd, color: colors.error },
  button: {
    backgroundColor: colors.primaryContainer,
    borderRadius: borderRadius.default,
    minHeight: spacing.touchTargetMin,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { ...typography.labelLg, color: colors.onPrimary },
});
