import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  Switch,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { api } from '../../services/api';
import { colors } from '../../constants/colors';
import { typography, spacing, borderRadius } from '../../constants/typography';
import { AuthStackParamList } from '../../navigation/AppNavigator';
import { TipoUsuario, NivelAutonomia } from '../../types';
import { registerSchema, RegisterFormData } from '../../schemas/registerSchema';
import { FormInput } from '../../components/FormInput';

type RegisterNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Register'>;

const TIPOS_USUARIO: { label: string; value: TipoUsuario }[] = [
  { label: 'Paciente', value: 'PACIENTE' },
  { label: 'Responsável', value: 'RESPONSAVEL' },
  { label: 'Cuidador', value: 'CUIDADOR' },
];

const NIVEIS_AUTONOMIA: { label: string; value: NivelAutonomia }[] = [
  { label: 'Total', value: 'TOTAL' },
  { label: 'Parcial', value: 'PARCIAL' },
  { label: 'Dependente', value: 'DEPENDENTE' },
];

export function RegisterScreen() {
  const navigation = useNavigation<RegisterNavigationProp>();
  const [loading, setLoading] = useState(false);

  const { control, handleSubmit, watch, setValue } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    mode: 'onBlur',
    defaultValues: {
      tipo: 'PACIENTE',
      nome: '',
      email: '',
      senha: '',
      telefone: '',
      data_nascimento: '',
      obs_medicas: '',
      nivel_autonomia: 'TOTAL',
    } as RegisterFormData,
  });

  const tipo = watch('tipo');

  const handleTipoChange = (newTipo: TipoUsuario) => {
    if (newTipo === 'PACIENTE') {
      setValue('tipo', 'PACIENTE');
      (setValue as (name: string, value: unknown) => void)('data_nascimento', '');
      (setValue as (name: string, value: unknown) => void)('obs_medicas', '');
      (setValue as (name: string, value: unknown) => void)('nivel_autonomia', 'TOTAL');
    } else if (newTipo === 'RESPONSAVEL') {
      setValue('tipo', 'RESPONSAVEL');
      (setValue as (name: string, value: unknown) => void)('grau_parentesco', '');
      (setValue as (name: string, value: unknown) => void)('recebe_notificacoes', true);
    } else {
      setValue('tipo', 'CUIDADOR');
      (setValue as (name: string, value: unknown) => void)('grau_parentesco', '');
      (setValue as (name: string, value: unknown) => void)('recebe_notificacoes', true);
    }
  };

  const onSubmit = async (data: RegisterFormData) => {
    setLoading(true);
    try {
      const payload: Record<string, unknown> = {
        nome: data.nome.trim(),
        email: data.email.trim(),
        senha: data.senha,
        tipo: data.tipo,
      };

      if (data.telefone?.trim()) {
        payload.telefone = data.telefone.trim();
      }

      if (data.tipo === 'PACIENTE') {
        payload.data_nascimento = data.data_nascimento.trim();
        if (data.obs_medicas?.trim()) {
          payload.obs_medicas = data.obs_medicas.trim();
        }
        payload.nivel_autonomia = data.nivel_autonomia;
      }

      if (data.tipo === 'RESPONSAVEL' || data.tipo === 'CUIDADOR') {
        payload.grau_parentesco = data.grau_parentesco.trim();
        payload.recebe_notificacoes = data.recebe_notificacoes;
      }

      await api.post('/usuarios', payload);

      Alert.alert('Sucesso', 'Conta criada com sucesso! Faça login para continuar.', [
        { text: 'OK', onPress: () => navigation.navigate('Login') },
      ]);
    } catch (err: unknown) {
      if (isAxiosError(err)) {
        if (err.response?.status === 409) {
          Alert.alert('Erro', 'E-mail já cadastrado');
        } else if (err.response?.status === 422) {
          const detail = err.response?.data?.detail;
          const message = typeof detail === 'string' ? detail : 'Dados inválidos. Verifique os campos.';
          Alert.alert('Erro de validação', message);
        } else {
          Alert.alert('Erro', 'Não foi possível criar a conta. Tente novamente.');
        }
      } else {
        Alert.alert('Erro', 'Não foi possível criar a conta. Tente novamente.');
      }
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
        <Text style={styles.title}>Criar Conta</Text>
        <Text style={styles.subtitle}>Preencha seus dados para se cadastrar</Text>

        {/* Type selector */}
        <Text style={styles.label}>Tipo de usuário</Text>
        <View style={styles.typeSelector}>
          {TIPOS_USUARIO.map((item) => (
            <TouchableOpacity
              key={item.value}
              style={[
                styles.typeButton,
                tipo === item.value && styles.typeButtonActive,
              ]}
              onPress={() => handleTipoChange(item.value)}
              accessibilityLabel={`Tipo ${item.label}`}
              accessibilityRole="button"
              accessibilityState={{ selected: tipo === item.value }}
            >
              <Text
                style={[
                  styles.typeButtonText,
                  tipo === item.value && styles.typeButtonTextActive,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Common fields */}
        <FormInput
          control={control}
          name="nome"
          label="Nome *"
          placeholder="Seu nome completo"
          autoCapitalize="words"
        />

        <FormInput
          control={control}
          name="email"
          label="E-mail *"
          placeholder="seu@email.com"
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <FormInput
          control={control}
          name="telefone"
          label="Telefone"
          placeholder="(00) 00000-0000"
          keyboardType="phone-pad"
        />

        <FormInput
          control={control}
          name="senha"
          label="Senha *"
          placeholder="Mínimo 6 caracteres"
          secureTextEntry
        />

        {/* Paciente-specific fields */}
        {tipo === 'PACIENTE' && (
          <>
            <FormInput
              control={control}
              name={'data_nascimento' as keyof RegisterFormData}
              label="Data de nascimento *"
              placeholder="AAAA-MM-DD"
              keyboardType="numbers-and-punctuation"
            />

            <FormInput
              control={control}
              name={'obs_medicas' as keyof RegisterFormData}
              label="Observações médicas"
              placeholder="Alergias, condições, etc."
              multiline
              numberOfLines={3}
            />

            <Text style={styles.label}>Nível de autonomia *</Text>
            <Controller
              control={control}
              name={'nivel_autonomia' as keyof RegisterFormData}
              render={({ field: { value, onChange } }) => (
                <View style={styles.typeSelector}>
                  {NIVEIS_AUTONOMIA.map((item) => (
                    <TouchableOpacity
                      key={item.value}
                      style={[
                        styles.typeButton,
                        value === item.value && styles.typeButtonActive,
                      ]}
                      onPress={() => onChange(item.value)}
                      accessibilityLabel={`Nível ${item.label}`}
                      accessibilityRole="button"
                      accessibilityState={{ selected: value === item.value }}
                    >
                      <Text
                        style={[
                          styles.typeButtonText,
                          value === item.value && styles.typeButtonTextActive,
                        ]}
                      >
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            />
          </>
        )}

        {/* Responsavel/Cuidador-specific fields */}
        {(tipo === 'RESPONSAVEL' || tipo === 'CUIDADOR') && (
          <>
            <FormInput
              control={control}
              name={'grau_parentesco' as keyof RegisterFormData}
              label="Grau de parentesco *"
              placeholder="Ex: Filho(a), Neto(a), Enfermeiro(a)"
            />

            <Controller
              control={control}
              name={'recebe_notificacoes' as keyof RegisterFormData}
              render={({ field: { value, onChange } }) => (
                <View style={styles.switchRow}>
                  <Text style={styles.switchLabel}>Receber notificações</Text>
                  <Switch
                    value={!!value}
                    onValueChange={onChange}
                    trackColor={{ false: colors.outlineVariant, true: colors.primaryContainer }}
                    thumbColor={value ? colors.onPrimary : colors.surfaceContainerHigh}
                    accessibilityLabel="Ativar recebimento de notificações"
                    accessibilityRole="switch"
                  />
                </View>
              )}
            />
          </>
        )}

        {/* Submit button */}
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSubmit(onSubmit)}
          disabled={loading}
          accessibilityLabel="Cadastrar"
          accessibilityRole="button"
        >
          {loading ? (
            <ActivityIndicator color={colors.onPrimary} />
          ) : (
            <Text style={styles.buttonText}>Cadastrar</Text>
          )}
        </TouchableOpacity>

        {/* Back to login */}
        <TouchableOpacity
          style={styles.loginLink}
          onPress={() => navigation.navigate('Login')}
          accessibilityLabel="Voltar para login"
          accessibilityRole="button"
        >
          <Text style={styles.loginText}>Já tem conta? Faça login</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function isAxiosError(error: unknown): error is { response?: { status?: number; data?: { detail?: string } } } {
  return typeof error === 'object' && error !== null && 'response' in error;
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
    paddingTop: 60,
    paddingBottom: 40,
    gap: spacing.stackGap,
  },
  title: {
    ...typography.headlineMd,
    color: colors.primary,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    marginBottom: 12,
  },
  label: {
    ...typography.labelLg,
    color: colors.onSurface,
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  typeButton: {
    flex: 1,
    minHeight: spacing.touchTargetMin,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.outline,
    borderRadius: borderRadius.default,
    backgroundColor: colors.surfaceContainerLow,
  },
  typeButtonActive: {
    backgroundColor: colors.primaryContainer,
    borderColor: colors.primaryContainer,
  },
  typeButtonText: {
    ...typography.labelMd,
    color: colors.onSurfaceVariant,
  },
  typeButtonTextActive: {
    color: colors.onPrimary,
    fontWeight: '600',
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
  loginLink: {
    alignItems: 'center',
    minHeight: spacing.touchTargetMin,
    justifyContent: 'center',
  },
  loginText: {
    ...typography.bodyMd,
    color: colors.primaryContainer,
  },
});
