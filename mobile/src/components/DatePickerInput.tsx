import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import DateTimePicker, { DateTimePickerChangeEvent } from '@react-native-community/datetimepicker';
import { Controller, Control, FieldValues, Path } from 'react-hook-form';
import { format, parse, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DatePickerInputProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  label: string;
  placeholder?: string;
  maximumDate?: Date;
  minimumDate?: Date;
}

export function DatePickerInput<T extends FieldValues>({
  control,
  name,
  label,
  placeholder = 'Selecione uma data',
  maximumDate,
  minimumDate,
}: DatePickerInputProps<T>) {
  const [showPicker, setShowPicker] = useState(false);

  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, value }, fieldState: { error } }) => {
        const dateValue = value
          ? parse(value as string, 'yyyy-MM-dd', new Date())
          : undefined;
        const displayValue =
          dateValue && isValid(dateValue)
            ? format(dateValue, 'dd/MM/yyyy', { locale: ptBR })
            : '';

        const handleValueChange = (_event: DateTimePickerChangeEvent, selectedDate: Date) => {
          if (Platform.OS === 'android') {
            setShowPicker(false);
          }
          onChange(format(selectedDate, 'yyyy-MM-dd'));
        };

        const handleDismiss = () => {
          setShowPicker(false);
        };

        return (
          <View style={styles.container}>
            <Text style={styles.label}>{label}</Text>
            <TouchableOpacity
              style={[styles.input, error && styles.inputError]}
              onPress={() => setShowPicker(true)}
              accessibilityLabel={label}
              accessibilityRole="button"
              accessibilityHint="Toque para selecionar uma data"
            >
              <Text style={[styles.inputText, !displayValue && styles.placeholder]}>
                {displayValue || placeholder}
              </Text>
            </TouchableOpacity>
            {error?.message && (
              <Text style={styles.errorText}>{error.message}</Text>
            )}
            {showPicker && (
              <DateTimePicker
                value={dateValue && isValid(dateValue) ? dateValue : new Date()}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onValueChange={handleValueChange}
                onDismiss={handleDismiss}
                maximumDate={maximumDate}
                minimumDate={minimumDate}
                locale="pt-BR"
              />
            )}
            {Platform.OS === 'ios' && showPicker && (
              <TouchableOpacity
                style={styles.doneButton}
                onPress={() => setShowPicker(false)}
                accessibilityLabel="Confirmar data"
                accessibilityRole="button"
              >
                <Text style={styles.doneButtonText}>Confirmar</Text>
              </TouchableOpacity>
            )}
          </View>
        );
      }}
    />
  );
}

const styles = StyleSheet.create(theme => ({
  container: {
    gap: 4,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.onSurface,
  },
  input: {
    fontSize: 15,
    backgroundColor: theme.inputBg,
    borderWidth: 1,
    borderColor: theme.outline,
    borderRadius: 8,
    paddingHorizontal: 16,
    minHeight: 48,
    justifyContent: 'center',
  },
  inputError: {
    borderColor: theme.error,
  },
  inputText: {
    fontSize: 15,
    color: theme.inputText,
  },
  placeholder: {
    color: theme.inputPlaceholder,
  },
  errorText: {
    fontSize: 13,
    fontWeight: '500',
    color: theme.error,
  },
  doneButton: {
    alignSelf: 'flex-end',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  doneButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.primaryContainer,
  },
}));
