import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../services/api';
import { Vinculo } from '../types';

export interface UseVinculosReturn {
  vinculos: Vinculo[];
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  handleRefresh: () => void;
  handleCreate: (pacienteId: number) => Promise<boolean>;
  handleDelete: (vinculo: Vinculo) => void;
  retry: () => void;
}

export function useVinculos(): UseVinculosReturn {
  const [vinculos, setVinculos] = useState<Vinculo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchVinculos = useCallback(async () => {
    try {
      setError(null);
      const { data } = await api.get<Vinculo[]>('/vinculos');
      setVinculos(data.filter((v) => v.ativo));
    } catch {
      setError('Não foi possível carregar os vínculos. Tente novamente.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setIsLoading(true);
      fetchVinculos();
    }, [fetchVinculos])
  );

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchVinculos();
  }, [fetchVinculos]);

  const handleCreate = useCallback(async (pacienteId: number): Promise<boolean> => {
    try {
      const { data } = await api.post<Vinculo>('/vinculos', {
        paciente_id: pacienteId,
      });
      setVinculos((prev) => [...prev, data]);
      return true;
    } catch (err: unknown) {
      const axiosErr = err as { response?: { status?: number; data?: { detail?: string } } };
      if (axiosErr.response?.status === 409) {
        Alert.alert('Erro', 'Já existe um vínculo ativo com este paciente.');
      } else if (axiosErr.response?.status === 404) {
        Alert.alert('Erro', 'Paciente não encontrado. Verifique o ID informado.');
      } else {
        Alert.alert('Erro', axiosErr.response?.data?.detail || 'Não foi possível criar o vínculo.');
      }
      return false;
    }
  }, []);

  const handleDelete = useCallback((vinculo: Vinculo) => {
    const nome = vinculo.paciente_nome || `paciente #${vinculo.paciente_id}`;
    Alert.alert(
      'Remover vínculo',
      `Deseja realmente remover o vínculo com ${nome}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/vinculos/${vinculo.id}`);
              setVinculos((prev) => prev.filter((v) => v.id !== vinculo.id));
            } catch {
              Alert.alert('Erro', 'Não foi possível remover o vínculo.');
            }
          },
        },
      ]
    );
  }, []);

  const retry = useCallback(() => {
    setIsLoading(true);
    fetchVinculos();
  }, [fetchVinculos]);

  return {
    vinculos,
    isLoading,
    isRefreshing,
    error,
    handleRefresh,
    handleCreate,
    handleDelete,
    retry,
  };
}
