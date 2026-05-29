import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../../constants/colors';
import { typography, spacing, borderRadius } from '../../constants/typography';
import { AuthStackParamList } from '../../navigation/AppNavigator';
import { FormInput } from '../../components/FormInput';
import { useLogin } from '../../hooks/useLogin';

type LoginNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

export function LoginScreen() {
  const navigation = useNavigation<LoginNavigationProp>();
  const { control, handleSubmit, loading, onSubmit } = useLogin();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Image
          source={require('../../../assets/images/logo.png')}
          style={styles.logo}
          resizeMode="contain"
          accessibilityLabel="Logo MedAlert"
        />
        <Text style={styles.subtitle}>Controle de medicamentos</Text>
      </View>

      <View style={styles.form}>
        <FormInput
          control={control}
          name="email"
          label="E-mail"
          placeholder="seu@email.com"
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <FormInput
          control={control}
          name="senha"
          label="Senha"
          placeholder="Sua senha"
          secureTextEntry
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSubmit(onSubmit)}
          disabled={loading}
          accessibilityLabel="Entrar"
          accessibilityRole="button"
        >
          {loading ? (
            <ActivityIndicator color={colors.onPrimary} />
          ) : (
            <Text style={styles.buttonText}>Entrar</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.registerLink}
          onPress={() => navigation.navigate('Register')}
          accessibilityLabel="Criar conta"
          accessibilityRole="button"
        >
          <Text style={styles.registerText}>Não tem conta? Cadastre-se</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundApp,
    paddingHorizontal: spacing.marginMobile,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 160,
    height: 160,
    marginBottom: 16,
  },
  subtitle: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    marginTop: 8,
  },
  form: {
    gap: spacing.stackGap,
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
  registerLink: {
    alignItems: 'center',
    minHeight: spacing.touchTargetMin,
    justifyContent: 'center',
  },
  registerText: {
    ...typography.bodyMd,
    color: colors.primaryContainer,
  },
});
