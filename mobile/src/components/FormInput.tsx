import React from 'react';
import { View, Text, TextInput, KeyboardTypeOptions } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Controller, Control, FieldValues, Path } from 'react-hook-form';

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
            placeholderTextColor={styles.placeholderColor.color}
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
    color: theme.inputText,
  },
  textArea: {
    minHeight: 96,
    paddingTop: 12,
  },
  inputError: {
    borderColor: theme.error,
  },
  errorText: {
    fontSize: 13,
    fontWeight: '500',
    color: theme.error,
  },
  placeholderColor: { color: theme.inputPlaceholder },
}));
