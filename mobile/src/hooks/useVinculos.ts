import { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../services/api';
import { isHttpStatus, getApiErrorMessage } from '../utils/errors';
import { Vinculo } from '../types';

export interface UseVinculosReturn {
  vinculos: Vinculo[];
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  handleRefresh: () => void;
  handleCreate: (pacienteId: number) => Promise<{ success: boolean; error?: string }>;
  handleDelete: (vinculo: Vinculo) => Promise<boolean>;
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

  const handleCreate = useCallback(async (pacienteId: number): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data } = await api.post<Vinculo>('/vinculos', { paciente_id: pacienteId });
      setVinculos((prev) => [...prev, data]);
      return { success: true };
    } catch (err) {
      if (isHttpStatus(err, 409)) {
        return { success: false, error: 'Já existe um vínculo ativo com este paciente.' };
      }
      if (isHttpStatus(err, 404)) {
        return { success: false, error: 'Paciente não encontrado.' };
      }
      return { success: false, error: getApiErrorMessage(err, 'Não foi possível criar o vínculo.') };
    }
  }, []);

  const handleDelete = useCallback(async (vinculo: Vinculo): Promise<boolean> => {
    try {
      await api.delete(`/vinculos/${vinculo.id}`);
      setVinculos((prev) => prev.filter((v) => v.id !== vinculo.id));
      return true;
    } catch {
      return false;
    }
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
