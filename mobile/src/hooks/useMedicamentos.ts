import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Medicamento, Vinculo } from '../types';

export interface UseMedicamentosReturn {
  medicamentos: Medicamento[];
  pacienteId: number | null;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  handleRefresh: () => void;
  handleDelete: (medicamento: Medicamento) => void;
  retry: () => void;
}

export function useMedicamentos(): UseMedicamentosReturn {
  const { user } = useAuth();
  const [medicamentos, setMedicamentos] = useState<Medicamento[]>([]);
  const [pacienteId, setPacienteId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMedicamentos = useCallback(async () => {
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
          setMedicamentos([]);
          setIsLoading(false);
          setIsRefreshing(false);
          return;
        }
        targetPacienteId = activeVinculo.paciente_id;
      }

      setPacienteId(targetPacienteId);

      const { data } = await api.get<Medicamento[]>(
        `/pacientes/${targetPacienteId}/medicamentos`
      );

      setMedicamentos(data);
    } catch {
      setError('Não foi possível carregar os medicamentos. Tente novamente.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      setIsLoading(true);
      fetchMedicamentos();
    }, [fetchMedicamentos])
  );

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
    isLoading,
    isRefreshing,
    error,
    handleRefresh,
    handleDelete,
    retry,
  };
}
