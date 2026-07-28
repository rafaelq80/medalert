import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '../contexts/AuthContext';
import { loginSchema, LoginFormData } from '../schemas/loginSchema';

export interface UseLoginReturn {
  control: ReturnType<typeof useForm<LoginFormData>>['control'];
  handleSubmit: ReturnType<typeof useForm<LoginFormData>>['handleSubmit'];
  loading: boolean;
  error: string | null;
  clearError: () => void;
  onSubmit: (data: LoginFormData) => Promise<void>;
}

export function useLogin(): UseLoginReturn {
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { control, handleSubmit } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: 'onBlur',
    defaultValues: {
      email: '',
      senha: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    console.log('[LOGIN DEBUG]', JSON.stringify(data.email), JSON.stringify(data.senha), data.senha.length);
    setLoading(true);
    setError(null);
    try {
      await login(data.email.trim().toLowerCase(), data.senha);
    } catch {
      setError('E-mail ou senha inválidos');
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => setError(null);

  return {
    control,
    handleSubmit,
    loading,
    error,
    clearError,
    onSubmit,
  };
}
