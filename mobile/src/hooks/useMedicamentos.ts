import { useState, useCallback, useRef } from 'react';
import { Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Medicamento, Vinculo } from '../types';

export interface PacienteOption {
  id: number;
  label: string;
}

export interface UseMedicamentosReturn {
  medicamentos: Medicamento[];
  pacienteId: number | null;
  pacientes: PacienteOption[];
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  handleRefresh: () => void;
  handleDelete: (medicamento: Medicamento) => void;
  handleSelectPaciente: (id: number) => void;
  retry: () => void;
}

export function useMedicamentos(): UseMedicamentosReturn {
  const { user } = useAuth();
  const [medicamentos, setMedicamentos] = useState<Medicamento[]>([]);
  const [pacienteId, setPacienteId] = useState<number | null>(null);
  const [pacientes, setPacientes] = useState<PacienteOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const selectedIdRef = useRef<number | null>(null);

  const fetchMedicamentosForPaciente = useCallback(async (targetId: number) => {
    const { data } = await api.get<Medicamento[]>(
      `/pacientes/${targetId}/medicamentos`
    );
    setMedicamentos(data);
  }, []);

  const fetchMedicamentos = useCallback(async () => {
    if (!user) return;

    try {
      setError(null);

      if (user.tipo === 'PACIENTE') {
        selectedIdRef.current = user.id;
        setPacienteId(user.id);
        setPacientes([{ id: user.id, label: user.nome }]);
        await fetchMedicamentosForPaciente(user.id);
      } else {
        const { data: vinculos } = await api.get<Vinculo[]>('/vinculos');
        const activeVinculos = vinculos.filter((v) => v.ativo);

        if (activeVinculos.length === 0) {
          setMedicamentos([]);
          setPacientes([]);
          setPacienteId(null);
          selectedIdRef.current = null;
          return;
        }

        const options: PacienteOption[] = activeVinculos.map((v) => ({
          id: v.paciente_id,
          label: v.paciente_nome || `Paciente #${v.paciente_id}`,
        }));
        setPacientes(options);

        // Keep current selection if still valid, otherwise pick first
        const currentValid = selectedIdRef.current && options.some((o) => o.id === selectedIdRef.current);
        const targetId = currentValid ? selectedIdRef.current! : options[0].id;
        selectedIdRef.current = targetId;
        setPacienteId(targetId);

        await fetchMedicamentosForPaciente(targetId);
      }
    } catch {
      setError('Não foi possível carregar os medicamentos. Tente novamente.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user, fetchMedicamentosForPaciente]);

  useFocusEffect(
    useCallback(() => {
      setIsLoading(true);
      fetchMedicamentos();
    }, [fetchMedicamentos])
  );

  const handleSelectPaciente = useCallback(async (id: number) => {
    selectedIdRef.current = id;
    setPacienteId(id);
    setIsLoading(true);
    try {
      await fetchMedicamentosForPaciente(id);
    } catch {
      setError('Não foi possível carregar os medicamentos.');
    } finally {
      setIsLoading(false);
    }
  }, [fetchMedicamentosForPaciente]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchMedicamentos();
  }, [fetchMedicamentos]);

  const handleDelete = useCallback((medicamento: Medicamento) => {
    Alert.alert(
      'Inativar medicamento',
      `Deseja realmente inativar "${medicamento.nome}"? Esta ação pode ser revertida.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Inativar',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/medicamentos/${medicamento.id}`);
              setMedicamentos((prev) => prev.filter((m) => m.id !== medicamento.id));
            } catch {
              Alert.alert('Erro', 'Não foi possível inativar o medicamento.');
            }
          },
        },
      ]
    );
  }, []);

  const retry = useCallback(() => {
    setIsLoading(true);
    fetchMedicamentos();
  }, [fetchMedicamentos]);

  return {
    medicamentos,
    pacienteId,
    pacientes,
    isLoading,
    isRefreshing,
    error,
    handleRefresh,
    handleDelete,
    handleSelectPaciente,
    retry,
  };
}
