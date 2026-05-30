import { useState, useCallback } from 'react';
import { api } from '../services/api';
import { getApiErrorMessage } from '../utils/errors';
import { Agenda } from '../types';

export interface UseAgendasCrudReturn {
  agendas: Agenda[];
  isLoading: boolean;
  error: string | null;
  fetchAgendas: (medicamentoId: number) => void;
  createAgenda: (medicamentoId: number, data: Record<string, unknown>) => Promise<{ success: boolean; error?: string }>;
  deleteAgenda: (agenda: Agenda) => Promise<boolean>;
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
      const { data } = await api.get<Agenda[]>(`/medicamentos/${medicamentoId}/agendas`);
      setAgendas(data.filter((a) => a.ativo));
    } catch {
      setError('Não foi possível carregar as agendas.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createAgenda = useCallback(
    async (medicamentoId: number, payload: Record<string, unknown>): Promise<{ success: boolean; error?: string }> => {
      try {
        const { data } = await api.post<Agenda>(`/medicamentos/${medicamentoId}/agendas`, payload);
        setAgendas((prev) => [...prev, data]);
        return { success: true };
      } catch (err) {
        return { success: false, error: getApiErrorMessage(err, 'Não foi possível criar a agenda.') };
      }
    },
    []
  );

  const deleteAgenda = useCallback(async (agenda: Agenda): Promise<boolean> => {
    try {
      await api.delete(`/agendas/${agenda.id}`);
      setAgendas((prev) => prev.filter((a) => a.id !== agenda.id));
      return true;
    } catch {
      return false;
    }
  }, []);

  const retry = useCallback((medicamentoId: number) => {
    fetchAgendas(medicamentoId);
  }, [fetchAgendas]);

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
