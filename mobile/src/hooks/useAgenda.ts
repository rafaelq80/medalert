import { useState, useCallback, useRef } from 'react';
import { Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { RegistroTomada, Vinculo } from '../types';

export interface PacienteOption {
  id: number;
  label: string;
}

export interface UseAgendaReturn {
  registros: RegistroTomada[];
  pacienteNome: string | null;
  pacientes: PacienteOption[];
  selectedPacienteId: number | null;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  confirmingId: number | null;
  handleRefresh: () => void;
  handleConfirm: (registroId: number) => void;
  handleSelectPaciente: (id: number) => void;
  retry: () => void;
}

export function useAgenda(): UseAgendaReturn {
  const { user } = useAuth();
  const [registros, setRegistros] = useState<RegistroTomada[]>([]);
  const [pacienteNome, setPacienteNome] = useState<string | null>(null);
  const [pacientes, setPacientes] = useState<PacienteOption[]>([]);
  const [selectedPacienteId, setSelectedPacienteId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<number | null>(null);
  const selectedIdRef = useRef<number | null>(null);

  const fetchRegistrosForPaciente = useCallback(async (pacienteId: number) => {
    const today = new Date().toISOString().split('T')[0];
    const { data } = await api.get<{ registros: RegistroTomada[] }>(
      `/pacientes/${pacienteId}/registros-tomada`,
      { params: { data_inicio: today, data_fim: today } }
    );

    const sortedRegistros = data.registros.sort(
      (a, b) =>
        new Date(a.data_hora_prevista).getTime() -
        new Date(b.data_hora_prevista).getTime()
    );

    setRegistros(sortedRegistros);
  }, []);

  const fetchRegistros = useCallback(async () => {
    if (!user) return;

    try {
      setError(null);

      if (user.tipo === 'PACIENTE') {
        selectedIdRef.current = user.id;
        setSelectedPacienteId(user.id);
        setPacientes([]);
        setPacienteNome(null);
        await fetchRegistrosForPaciente(user.id);
      } else {
        // Cuidador/Responsável — buscar pacientes vinculados
        const { data: vinculos } = await api.get<Vinculo[]>('/vinculos');
        const activeVinculos = vinculos.filter((v) => v.ativo);

        if (activeVinculos.length === 0) {
          setRegistros([]);
          setPacientes([]);
          setPacienteNome(null);
          setSelectedPacienteId(null);
          selectedIdRef.current = null;
          return;
        }

        const options: PacienteOption[] = activeVinculos.map((v) => ({
          id: v.paciente_id,
          label: v.paciente_nome || `Paciente #${v.paciente_id}`,
        }));
        setPacientes(options);

        const currentValid = selectedIdRef.current && options.some((o) => o.id === selectedIdRef.current);
        const targetId = currentValid ? selectedIdRef.current! : options[0].id;
        selectedIdRef.current = targetId;
        setSelectedPacienteId(targetId);

        const selected = options.find((o) => o.id === targetId);
        setPacienteNome(selected?.label || null);

        await fetchRegistrosForPaciente(targetId);
      }
    } catch {
      setError('Não foi possível carregar a agenda. Tente novamente.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user, fetchRegistrosForPaciente]);

  useFocusEffect(
    useCallback(() => {
      setIsLoading(true);
      fetchRegistros();
    }, [fetchRegistros])
  );

  const handleSelectPaciente = useCallback(async (id: number) => {
    selectedIdRef.current = id;
    setSelectedPacienteId(id);
    const selected = pacientes.find((p) => p.id === id);
    setPacienteNome(selected?.label || null);
    setIsLoading(true);
    try {
      await fetchRegistrosForPaciente(id);
    } catch {
      setError('Não foi possível carregar a agenda.');
    } finally {
      setIsLoading(false);
    }
  }, [pacientes, fetchRegistrosForPaciente]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchRegistros();
  }, [fetchRegistros]);

  const handleConfirm = useCallback(
    async (registroId: number) => {
      setConfirmingId(registroId);

      const originalRegistro = registros.find((r) => r.id === registroId);
      const originalStatus = originalRegistro?.status;

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
    pacienteNome,
    pacientes,
    selectedPacienteId,
    isLoading,
    isRefreshing,
    error,
    confirmingId,
    handleRefresh,
    handleConfirm,
    handleSelectPaciente,
    retry,
  };
}
