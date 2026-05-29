import { useState } from 'react';
import { Alert } from 'react-native';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '../contexts/AuthContext';
import { loginSchema, LoginFormData } from '../schemas/loginSchema';

export interface UseLoginReturn {
  control: ReturnType<typeof useForm<LoginFormData>>['control'];
  handleSubmit: ReturnType<typeof useForm<LoginFormData>>['handleSubmit'];
  loading: boolean;
  onSubmit: (data: LoginFormData) => Promise<void>;
}

export function useLogin(): UseLoginReturn {
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);

  const { control, handleSubmit } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: 'onBlur',
    defaultValues: {
      email: '',
      senha: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setLoading(true);
    try {
      await login(data.email.trim(), data.senha);
    } catch {
      Alert.alert('Erro', 'E-mail ou senha inválidos');
    } finally {
      setLoading(false);
    }
  };

  return {
    control,
    handleSubmit,
    loading,
    onSubmit,
  };
}
