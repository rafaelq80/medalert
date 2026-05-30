import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { api } from '../services/api';
import { isApiError, isHttpStatus, getApiErrorMessage } from '../utils/errors';
import { TipoUsuario } from '../types';
import { registerSchema, RegisterFormData } from '../schemas/registerSchema';

export interface UseRegisterReturn {
  control: ReturnType<typeof useForm<RegisterFormData>>['control'];
  handleSubmit: ReturnType<typeof useForm<RegisterFormData>>['handleSubmit'];
  watch: ReturnType<typeof useForm<RegisterFormData>>['watch'];
  setValue: ReturnType<typeof useForm<RegisterFormData>>['setValue'];
  loading: boolean;
  error: string | null;
  clearError: () => void;
  tipo: TipoUsuario;
  handleTipoChange: (newTipo: TipoUsuario) => void;
  onSubmit: (data: RegisterFormData) => Promise<boolean>;
}

export function useRegister(): UseRegisterReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    // Reset form with type-specific defaults
    const baseValues = {
      nome: watch('nome'),
      email: watch('email'),
      senha: watch('senha'),
      telefone: watch('telefone'),
    };

    if (newTipo === 'PACIENTE') {
      setValue('tipo', 'PACIENTE');
      setValue('data_nascimento' as keyof RegisterFormData, '');
      setValue('obs_medicas' as keyof RegisterFormData, '');
      setValue('nivel_autonomia' as keyof RegisterFormData, 'TOTAL');
    } else if (newTipo === 'RESPONSAVEL') {
      setValue('tipo', 'RESPONSAVEL');
      setValue('grau_parentesco' as keyof RegisterFormData, '');
      setValue('recebe_notificacoes' as keyof RegisterFormData, true as never);
    } else {
      setValue('tipo', 'CUIDADOR');
      setValue('grau_parentesco' as keyof RegisterFormData, '');
      setValue('recebe_notificacoes' as keyof RegisterFormData, true as never);
    }
  };

  const onSubmit = async (data: RegisterFormData): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const payload: Record<string, unknown> = {
        nome: data.nome.trim(),
        email: data.email.trim().toLowerCase(),
        senha: data.senha,
        tipo: data.tipo,
      };

      if (data.telefone?.trim()) {
        payload.telefone = data.telefone.trim();
      }

      if (data.tipo === 'PACIENTE') {
        payload.data_nascimento = data.data_nascimento.trim();
        payload.obs_medicas = data.obs_medicas.trim();
        payload.nivel_autonomia = data.nivel_autonomia;
      }

      if (data.tipo === 'RESPONSAVEL' || data.tipo === 'CUIDADOR') {
        payload.grau_parentesco = data.grau_parentesco.trim();
        payload.recebe_notificacoes = data.recebe_notificacoes;
      }

      await api.post('/usuarios', payload);
      return true;
    } catch (err: unknown) {
      if (isHttpStatus(err, 409)) {
        setError('E-mail já cadastrado.');
      } else if (isHttpStatus(err, 422)) {
        setError(getApiErrorMessage(err, 'Dados inválidos. Verifique os campos.'));
      } else {
        setError(getApiErrorMessage(err, 'Não foi possível criar a conta. Tente novamente.'));
      }
      return false;
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => setError(null);

  return {
    control,
    handleSubmit,
    watch,
    setValue,
    loading,
    error,
    clearError,
    tipo: tipo as TipoUsuario,
    handleTipoChange,
    onSubmit,
  };
}
