import { useState, useCallback, useMemo } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { subDays, format } from 'date-fns';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { colors } from '../constants/colors';
import { RegistroTomada, Vinculo } from '../types';

export interface PacienteOption {
  id: number;
  label: string;
}

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
  const { user } = useAuth();
  const [registros, setRegistros] = useState<RegistroTomada[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<7 | 15 | 30>(7);
  const [pacienteNome, setPacienteNome] = useState<string | null>(null);
  const [pacientes, setPacientes] = useState<PacienteOption[]>([]);
  const [selectedPacienteId, setSelectedPacienteId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRegistrosForPaciente = useCallback(async (pacienteId: number) => {
    const today = new Date();
    const startDate = subDays(today, selectedPeriod);
    const dataInicio = format(startDate, 'yyyy-MM-dd');
    const dataFim = format(today, 'yyyy-MM-dd');

    const { data } = await api.get<{ registros: RegistroTomada[] }>(
      `/pacientes/${pacienteId}/registros-tomada`,
      { params: { data_inicio: dataInicio, data_fim: dataFim } }
    );

    const sorted = data.registros.sort(
      (a, b) =>
        new Date(b.data_hora_prevista).getTime() -
        new Date(a.data_hora_prevista).getTime()
    );

    setRegistros(sorted);
  }, [selectedPeriod]);

  const fetchRegistros = useCallback(async () => {
    if (!user) return;

    try {
      setError(null);

      if (user.tipo === 'PACIENTE') {
        setSelectedPacienteId(user.id);
        setPacienteNome(null);
        setPacientes([]);
        await fetchRegistrosForPaciente(user.id);
      } else {
        const { data: vinculos } = await api.get<Vinculo[]>('/vinculos');
        const activeVinculos = vinculos.filter((v) => v.ativo);

        if (activeVinculos.length === 0) {
          setRegistros([]);
          setPacienteNome(null);
          setPacientes([]);
          setSelectedPacienteId(null);
          setIsLoading(false);
          setIsRefreshing(false);
          return;
        }

        const options: PacienteOption[] = activeVinculos.map((v) => ({
          id: v.paciente_id,
          label: v.paciente_nome || `Paciente #${v.paciente_id}`,
        }));
        setPacientes(options);

        // Keep current selection if still valid
        const currentValid = selectedPacienteId && options.some((o) => o.id === selectedPacienteId);
        const targetId = currentValid ? selectedPacienteId! : options[0].id;
        setSelectedPacienteId(targetId);

        const selected = options.find((o) => o.id === targetId);
        setPacienteNome(selected?.label || null);

        await fetchRegistrosForPaciente(targetId);
      }
    } catch {
      setError('Não foi possível carregar o histórico. Tente novamente.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user, selectedPeriod, selectedPacienteId, fetchRegistrosForPaciente]);

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

  const handleSelectPaciente = useCallback(async (id: number) => {
    setSelectedPacienteId(id);
    const selected = pacientes.find((p) => p.id === id);
    setPacienteNome(selected?.label || null);
    setIsLoading(true);
    try {
      await fetchRegistrosForPaciente(id);
    } catch {
      setError('Não foi possível carregar o histórico.');
    } finally {
      setIsLoading(false);
    }
  }, [pacientes, fetchRegistrosForPaciente]);

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
    handleSelectPaciente,
    retry,
  };
}
