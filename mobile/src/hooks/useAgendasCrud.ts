import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { api } from '../services/api';
import { Agenda } from '../types';

export interface UseAgendasCrudReturn {
  agendas: Agenda[];
  isLoading: boolean;
  error: string | null;
  fetchAgendas: (medicamentoId: number) => void;
  createAgenda: (medicamentoId: number, data: Record<string, unknown>) => Promise<boolean>;
  deleteAgenda: (agenda: Agenda) => void;
  retry: (medicamentoId: number) => void;
}

export function useAgendasCrud(): UseAgendasCrudReturn {
  const [agendas, setAgendas] = useState<Agenda[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAgendas = useCallback(async (medicamentoId: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const { data } = await api.get<Agenda[]>(
        `/medicamentos/${medicamentoId}/agendas`
      );
      setAgendas(data.filter((a) => a.ativo));
    } catch {
      setError('Não foi possível carregar as agendas.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createAgenda = useCallback(
    async (medicamentoId: number, payload: Record<string, unknown>): Promise<boolean> => {
      try {
        const { data } = await api.post<Agenda>(
          `/medicamentos/${medicamentoId}/agendas`,
          payload
        );
        setAgendas((prev) => [...prev, data]);
        return true;
      } catch (err: unknown) {
        const axiosErr = err as { response?: { data?: { detail?: string } } };
        Alert.alert(
          'Erro',
          axiosErr.response?.data?.detail || 'Não foi possível criar a agenda.'
        );
        return false;
      }
    },
    []
  );

  const deleteAgenda = useCallback((agenda: Agenda) => {
    Alert.alert(
      'Remover horário',
      'Deseja realmente remover este horário de tomada?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/agendas/${agenda.id}`);
              setAgendas((prev) => prev.filter((a) => a.id !== agenda.id));
            } catch {
              Alert.alert('Erro', 'Não foi possível remover a agenda.');
            }
          },
        },
      ]
    );
  }, []);

  const retry = useCallback(
    (medicamentoId: number) => {
      fetchAgendas(medicamentoId);
    },
    [fetchAgendas]
  );

  return {
    agendas,
    isLoading,
    error,
    fetchAgendas,
    createAgenda,
    deleteAgenda,
    retry,
  };
}
