import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { format, parseISO, isToday } from 'date-fns';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { RegistroTomada } from '../types';

export interface UseAgendaReturn {
  registros: RegistroTomada[];
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  confirmingId: number | null;
  handleRefresh: () => void;
  handleConfirm: (registroId: number) => void;
  retry: () => void;
}

export function useAgenda(): UseAgendaReturn {
  const { user } = useAuth();
  const [registros, setRegistros] = useState<RegistroTomada[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<number | null>(null);

  const fetchRegistros = useCallback(async () => {
    if (!user) return;

    try {
      setError(null);
      const today = format(new Date(), 'yyyy-MM-dd');
      const { data } = await api.get<{ registros: RegistroTomada[] }>(
        `/pacientes/${user.id}/registros-tomada`,
        { params: { data_inicio: today, data_fim: today } }
      );

      const todayRegistros = data.registros
        .filter((r) => isToday(parseISO(r.data_hora_prevista)))
        .sort(
          (a, b) =>
            new Date(a.data_hora_prevista).getTime() -
            new Date(b.data_hora_prevista).getTime()
        );

      setRegistros(todayRegistros);
    } catch {
      setError('Não foi possível carregar a agenda. Tente novamente.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      setIsLoading(true);
      fetchRegistros();
    }, [fetchRegistros])
  );

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchRegistros();
  }, [fetchRegistros]);

  const handleConfirm = useCallback(
    async (registroId: number) => {
      setConfirmingId(registroId);

      const originalRegistro = registros.find((r) => r.id === registroId);
      const originalStatus = originalRegistro?.status;

      // Optimistic update
      setRegistros((prev) =>
        prev.map((r) =>
          r.id === registroId
            ? { ...r, status: 'CONFIRMADO' as const, data_hora_confirmacao: new Date().toISOString() }
            : r
        )
      );

      try {
        await api.put(`/registros-tomada/${registroId}/confirmar`);
      } catch {
        // Rollback on failure
        setRegistros((prev) =>
          prev.map((r) =>
            r.id === registroId
              ? { ...r, status: originalStatus ?? 'PENDENTE', data_hora_confirmacao: undefined }
              : r
          )
        );
        Alert.alert(
          'Erro ao confirmar',
          'Não foi possível confirmar a tomada. Verifique sua conexão e tente novamente.'
        );
      } finally {
        setConfirmingId(null);
      }
    },
    [registros]
  );

  const retry = useCallback(() => {
    setIsLoading(true);
    fetchRegistros();
  }, [fetchRegistros]);

  return {
    registros,
    isLoading,
    isRefreshing,
    error,
    confirmingId,
    handleRefresh,
    handleConfirm,
    retry,
  };
}
