import { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../services/api';
import { usePacienteSelector } from './usePacienteSelector';
import { Medicamento, PacienteOption } from '../types';

export interface UseMedicamentosReturn {
  medicamentos: Medicamento[];
  pacienteId: number | null;
  pacientes: PacienteOption[];
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  handleRefresh: () => void;
  handleDelete: (medicamento: Medicamento) => Promise<boolean>;
  handleSelectPaciente: (id: number) => void;
  retry: () => void;
}

export function useMedicamentos(): UseMedicamentosReturn {
  const { pacientes, selectedPacienteId, handleSelectPaciente, loadPacientes } = usePacienteSelector();
  const [medicamentos, setMedicamentos] = useState<Medicamento[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMedicamentosForPaciente = useCallback(async (targetId: number) => {
    const { data } = await api.get<Medicamento[]>(`/pacientes/${targetId}/medicamentos`);
    return data;
  }, []);

  const fetchMedicamentos = useCallback(async () => {
    try {
      setError(null);
      const targetId = await loadPacientes();
      if (!targetId) {
        setMedicamentos([]);
        return;
      }
      const data = await fetchMedicamentosForPaciente(targetId);
      setMedicamentos(data);
    } catch {
      setError('Não foi possível carregar os medicamentos. Tente novamente.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [loadPacientes, fetchMedicamentosForPaciente]);

  useFocusEffect(
    useCallback(() => {
      setIsLoading(true);
      fetchMedicamentos();
    }, [fetchMedicamentos])
  );

  const onSelectPaciente = useCallback(async (id: number) => {
    handleSelectPaciente(id);
    setIsLoading(true);
    try {
      const data = await fetchMedicamentosForPaciente(id);
      setMedicamentos(data);
    } catch {
      setError('Não foi possível carregar os medicamentos.');
    } finally {
      setIsLoading(false);
    }
  }, [handleSelectPaciente, fetchMedicamentosForPaciente]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchMedicamentos();
  }, [fetchMedicamentos]);

  const handleDelete = useCallback(async (medicamento: Medicamento): Promise<boolean> => {
    try {
      await api.delete(`/medicamentos/${medicamento.id}`);
      setMedicamentos((prev) => prev.filter((m) => m.id !== medicamento.id));
      return true;
    } catch {
      return false;
    }
  }, []);

  const retry = useCallback(() => {
    setIsLoading(true);
    fetchMedicamentos();
  }, [fetchMedicamentos]);

  return {
    medicamentos,
    pacienteId: selectedPacienteId,
    pacientes,
    isLoading,
    isRefreshing,
    error,
    handleRefresh,
    handleDelete,
    handleSelectPaciente: onSelectPaciente,
    retry,
  };
}
