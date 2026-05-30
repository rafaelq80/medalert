import { useState, useCallback, useMemo } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { subDays, format } from 'date-fns';
import { useUnistyles } from 'react-native-unistyles';
import { api } from '../services/api';
import { usePacienteSelector } from './usePacienteSelector';
import { RegistroTomada, PacienteOption } from '../types';

export interface UseHistoricoReturn {
  registros: RegistroTomada[];
  selectedPeriod: 7 | 15 | 30;
  pacienteNome: string | null;
  pacientes: PacienteOption[];
  selectedPacienteId: number | null;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  adherencePercentage: number;
  adherenceColor: string;
  confirmedCount: number;
  totalCount: number;
  handleRefresh: () => void;
  handlePeriodChange: (days: 7 | 15 | 30) => void;
  handleSelectPaciente: (id: number) => void;
  retry: () => void;
}

export function useHistorico(): UseHistoricoReturn {
  const { theme } = useUnistyles();
  const { pacientes, selectedPacienteId, pacienteNome, handleSelectPaciente, loadPacientes } = usePacienteSelector();
  const [registros, setRegistros] = useState<RegistroTomada[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<7 | 15 | 30>(7);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRegistrosForPaciente = useCallback(async (pacienteId: number, period: number) => {
    const today = new Date();
    const startDate = subDays(today, period);
    const { data } = await api.get<{ registros: RegistroTomada[] }>(
      `/pacientes/${pacienteId}/registros-tomada`,
      { params: { data_inicio: format(startDate, 'yyyy-MM-dd'), data_fim: format(today, 'yyyy-MM-dd') } }
    );
    return data.registros.sort(
      (a, b) => new Date(b.data_hora_prevista).getTime() - new Date(a.data_hora_prevista).getTime()
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
      const sorted = await fetchRegistrosForPaciente(targetId, selectedPeriod);
      setRegistros(sorted);
    } catch {
      setError('Não foi possível carregar o histórico. Tente novamente.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [loadPacientes, fetchRegistrosForPaciente, selectedPeriod]);

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

  const handlePeriodChange = useCallback((days: 7 | 15 | 30) => {
    setSelectedPeriod(days);
  }, []);

  const onSelectPaciente = useCallback(async (id: number) => {
    handleSelectPaciente(id);
    setIsLoading(true);
    try {
      const sorted = await fetchRegistrosForPaciente(id, selectedPeriod);
      setRegistros(sorted);
    } catch {
      setError('Não foi possível carregar o histórico.');
    } finally {
      setIsLoading(false);
    }
  }, [handleSelectPaciente, fetchRegistrosForPaciente, selectedPeriod]);

  const confirmedCount = useMemo(
    () => registros.filter((r) => r.status === 'CONFIRMADO').length,
    [registros]
  );
  const totalCount = registros.length;
  const adherencePercentage = useMemo(
    () => (totalCount > 0 ? Math.round((confirmedCount / totalCount) * 100) : 0),
    [confirmedCount, totalCount]
  );
  const adherenceColor = adherencePercentage >= 80 ? theme.statusConfirmed : theme.statusDelayed;

  const retry = useCallback(() => {
    setIsLoading(true);
    fetchRegistros();
  }, [fetchRegistros]);

  return {
    registros,
    selectedPeriod,
    pacienteNome,
    pacientes,
    selectedPacienteId,
    isLoading,
    isRefreshing,
    error,
    adherencePercentage,
    adherenceColor,
    confirmedCount,
    totalCount,
    handleRefresh,
    handlePeriodChange,
    handleSelectPaciente: onSelectPaciente,
    retry,
  };
}
