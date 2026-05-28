import React from 'react';
import { View, Text, TextInput, StyleSheet, KeyboardTypeOptions } from 'react-native';
import { Controller, Control, FieldValues, Path } from 'react-hook-form';
import { colors } from '../constants/colors';
import { typography, spacing, borderRadius } from '../constants/typography';

interface FormInputProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  label: string;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: 'none' | 'sentences' | 'words';
  multiline?: boolean;
  numberOfLines?: number;
}

export function FormInput<T extends FieldValues>({
  control,
  name,
  label,
  placeholder,
  secureTextEntry,
  keyboardType,
  autoCapitalize,
  multiline,
  numberOfLines,
}: FormInputProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
        <View style={styles.container}>
          <Text style={styles.label}>{label}</Text>
          <TextInput
            style={[
              styles.input,
              multiline && styles.textArea,
              error && styles.inputError,
            ]}
            value={value ?? ''}
            onChangeText={onChange}
            onBlur={onBlur}
            placeholder={placeholder}
            placeholderTextColor={colors.onSurfaceVariant}
            secureTextEntry={secureTextEntry}
            keyboardType={keyboardType}
            autoCapitalize={autoCapitalize}
            multiline={multiline}
            numberOfLines={numberOfLines}
            textAlignVertical={multiline ? 'top' : 'center'}
            accessibilityLabel={label}
          />
          {error?.message && (
            <Text style={styles.errorText}>{error.message}</Text>
          )}
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 4,
  },
  label: {
    ...typography.labelLg,
    color: colors.onSurface,
  },
  input: {
    ...typography.bodyMd,
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: colors.outline,
    borderRadius: borderRadius.default,
    paddingHorizontal: spacing.gutter,
    minHeight: spacing.touchTargetMin,
    color: colors.onSurface,
  },
  textArea: {
    minHeight: 96,
    paddingTop: 12,
  },
  inputError: {
    borderColor: colors.error,
  },
  errorText: {
    ...typography.labelMd,
    color: colors.error,
  },
});
