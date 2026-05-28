import { useState, useCallback, useMemo } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { subDays, format } from 'date-fns';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { colors } from '../constants/colors';
import { RegistroTomada, Vinculo } from '../types';

export interface UseHistoricoReturn {
  registros: RegistroTomada[];
  selectedPeriod: 7 | 15 | 30;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  adherencePercentage: number;
  adherenceColor: string;
  confirmedCount: number;
  totalCount: number;
  handleRefresh: () => void;
  handlePeriodChange: (days: 7 | 15 | 30) => void;
  retry: () => void;
}

export function useHistorico(): UseHistoricoReturn {
  const { user } = useAuth();
  const [registros, setRegistros] = useState<RegistroTomada[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<7 | 15 | 30>(7);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRegistros = useCallback(async () => {
    if (!user) return;

    try {
      setError(null);

      let targetPacienteId: number;

      if (user.tipo === 'PACIENTE') {
        targetPacienteId = user.id;
      } else {
        const { data: vinculos } = await api.get<Vinculo[]>('/vinculos');
        const activeVinculo = vinculos.find((v) => v.ativo);
        if (!activeVinculo) {
          setRegistros([]);
          setIsLoading(false);
          setIsRefreshing(false);
          return;
        }
        targetPacienteId = activeVinculo.paciente_id;
      }

      const today = new Date();
      const startDate = subDays(today, selectedPeriod);
      const dataInicio = format(startDate, 'yyyy-MM-dd');
      const dataFim = format(today, 'yyyy-MM-dd');

      const { data } = await api.get<{ registros: RegistroTomada[] }>(
        `/pacientes/${targetPacienteId}/registros-tomada`,
        { params: { data_inicio: dataInicio, data_fim: dataFim } }
      );

      const sorted = data.registros.sort(
        (a, b) =>
          new Date(b.data_hora_prevista).getTime() -
          new Date(a.data_hora_prevista).getTime()
      );

      setRegistros(sorted);
    } catch {
      setError('Não foi possível carregar o histórico. Tente novamente.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user, selectedPeriod]);

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

  const confirmedCount = useMemo(
    () => registros.filter((r) => r.status === 'CONFIRMADO').length,
    [registros]
  );

  const totalCount = registros.length;

  const adherencePercentage = useMemo(
    () => (totalCount > 0 ? Math.round((confirmedCount / totalCount) * 100) : 0),
    [confirmedCount, totalCount]
  );

  const adherenceColor =
    adherencePercentage >= 80 ? colors.statusConfirmed : colors.statusDelayed;

  const retry = useCallback(() => {
    setIsLoading(true);
    fetchRegistros();
  }, [fetchRegistros]);

  return {
    registros,
    selectedPeriod,
    isLoading,
    isRefreshing,
    error,
    adherencePercentage,
    adherenceColor,
    confirmedCount,
    totalCount,
    handleRefresh,
    handlePeriodChange,
    retry,
  };
}
