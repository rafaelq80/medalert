import { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../services/api';
import { usePacienteSelector } from './usePacienteSelector';
import { RegistroTomada, PacienteOption } from '../types';

export interface UseAgendaReturn {
  registros: RegistroTomada[];
  pacienteNome: string | null;
  pacientes: PacienteOption[];
  selectedPacienteId: number | null;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  confirmingId: number | null;
  confirmError: string | null;
  handleRefresh: () => void;
  handleConfirm: (registroId: number) => void;
  handleSelectPaciente: (id: number) => void;
  retry: () => void;
}

export function useAgenda(): UseAgendaReturn {
  const { pacientes, selectedPacienteId, pacienteNome, handleSelectPaciente, loadPacientes } = usePacienteSelector();
  const [registros, setRegistros] = useState<RegistroTomada[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<number | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  const fetchRegistrosForPaciente = useCallback(async (pacienteId: number) => {
    const today = new Date().toISOString().split('T')[0];
    const { data } = await api.get<{ registros: RegistroTomada[] }>(
      `/pacientes/${pacienteId}/registros-tomada`,
      { params: { data_inicio: today, data_fim: today } }
    );
    return data.registros.sort(
      (a, b) => new Date(a.data_hora_prevista).getTime() - new Date(b.data_hora_prevista).getTime()
    );
  }, []);

  const fetchRegistros = useCallback(async () => {
    try {
      setError(null);
      const targetId = await loadPacientes();
      if (!targetId) {
        setRegistros([]);
        return;
      }
      const sorted = await fetchRegistrosForPaciente(targetId);
      setRegistros(sorted);
    } catch {
      setError('Não foi possível carregar a agenda. Tente novamente.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [loadPacientes, fetchRegistrosForPaciente]);

  useFocusEffect(
    useCallback(() => {
      setIsLoading(true);
      fetchRegistros();
    }, [fetchRegistros])
  );

  const onSelectPaciente = useCallback(async (id: number) => {
    handleSelectPaciente(id);
    setIsLoading(true);
    try {
      const sorted = await fetchRegistrosForPaciente(id);
      setRegistros(sorted);
    } catch {
      setError('Não foi possível carregar a agenda.');
    } finally {
      setIsLoading(false);
    }
  }, [handleSelectPaciente, fetchRegistrosForPaciente]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchRegistros();
  }, [fetchRegistros]);

  const handleConfirm = useCallback(async (registroId: number) => {
    setConfirmingId(registroId);
    setConfirmError(null);

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
      // Rollback
      setRegistros((prev) =>
        prev.map((r) =>
          r.id === registroId
            ? { ...r, status: originalStatus ?? 'PENDENTE', data_hora_confirmacao: undefined }
            : r
        )
      );
      setConfirmError('Não foi possível confirmar a tomada.');
    } finally {
      setConfirmingId(null);
    }
  }, [registros]);

  const retry = useCallback(() => {
    setIsLoading(true);
    fetchRegistros();
  }, [fetchRegistros]);

  return {
    registros,
    pacienteNome,
    pacientes,
    selectedPacienteId,
    isLoading,
    isRefreshing,
    error,
    confirmingId,
    confirmError,
    handleRefresh,
    handleConfirm,
    handleSelectPaciente: onSelectPaciente,
    retry,
  };
}
