import { useState } from 'react';
import { Alert } from 'react-native';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { api } from '../services/api';
import { TipoUsuario } from '../types';
import { registerSchema, RegisterFormData } from '../schemas/registerSchema';

export interface UseRegisterReturn {
  control: ReturnType<typeof useForm<RegisterFormData>>['control'];
  handleSubmit: ReturnType<typeof useForm<RegisterFormData>>['handleSubmit'];
  watch: ReturnType<typeof useForm<RegisterFormData>>['watch'];
  setValue: ReturnType<typeof useForm<RegisterFormData>>['setValue'];
  loading: boolean;
  tipo: TipoUsuario;
  handleTipoChange: (newTipo: TipoUsuario) => void;
  onSubmit: (data: RegisterFormData) => Promise<boolean>;
}

export function useRegister(): UseRegisterReturn {
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

  const onSubmit = async (data: RegisterFormData): Promise<boolean> => {
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
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    control,
    handleSubmit,
    watch,
    setValue,
    loading,
    tipo: tipo as TipoUsuario,
    handleTipoChange,
    onSubmit,
  };
}

function isAxiosError(error: unknown): error is { response?: { status?: number; data?: { detail?: string } } } {
  return typeof error === 'object' && error !== null && 'response' in error;
}
