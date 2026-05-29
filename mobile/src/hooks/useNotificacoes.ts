import { useState, useCallback, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Notificacao, Vinculo } from '../types';

export interface PacienteOption {
  id: number;
  label: string;
}

export interface UseNotificacoesReturn {
  notificacoes: Notificacao[];
  pacientes: PacienteOption[];
  selectedPacienteId: number | null;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  handleRefresh: () => void;
  handleMarkAsRead: (notificacao: Notificacao) => void;
  handleSelectPaciente: (id: number) => void;
  retry: () => void;
}

export function useNotificacoes(): UseNotificacoesReturn {
  const { user } = useAuth();
  const [allNotificacoes, setAllNotificacoes] = useState<Notificacao[]>([]);
  const [pacientes, setPacientes] = useState<PacienteOption[]>([]);
  const [selectedPacienteId, setSelectedPacienteId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const selectedIdRef = useRef<number | null>(null);

  const fetchNotificacoes = useCallback(async () => {
    if (!user) return;

    try {
      setError(null);

      // Fetch notifications
      const { data } = await api.get<Notificacao[]>('/notificacoes');
      const sorted = data.sort(
        (a, b) =>
          new Date(b.enviado_em).getTime() - new Date(a.enviado_em).getTime()
      );
      setAllNotificacoes(sorted);

      // For responsável/cuidador, fetch vínculos to build patient selector
      if (user.tipo === 'RESPONSAVEL' || user.tipo === 'CUIDADOR') {
        const { data: vinculos } = await api.get<Vinculo[]>('/vinculos');
        const activeVinculos = vinculos.filter((v) => v.ativo);

        if (activeVinculos.length > 1) {
          const options: PacienteOption[] = [
            { id: 0, label: 'Todos os pacientes' },
            ...activeVinculos.map((v) => ({
              id: v.paciente_id,
              label: v.paciente_nome || `Paciente #${v.paciente_id}`,
            })),
          ];
          setPacientes(options);

          // Keep current selection if still valid
          const currentValid =
            selectedIdRef.current !== null &&
            options.some((o) => o.id === selectedIdRef.current);
          if (!currentValid) {
            selectedIdRef.current = 0; // default: show all
            setSelectedPacienteId(0);
          }
        } else {
          setPacientes([]);
          selectedIdRef.current = null;
          setSelectedPacienteId(null);
        }
      } else {
        setPacientes([]);
        selectedIdRef.current = null;
        setSelectedPacienteId(null);
      }
    } catch {
      setError('Não foi possível carregar as notificações. Tente novamente.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      setIsLoading(true);
      fetchNotificacoes();
    }, [fetchNotificacoes])
  );

  // Filter notifications by selected patient
  const notificacoes =
    selectedPacienteId && selectedPacienteId !== 0
      ? allNotificacoes.filter((n) => {
          // Filter by paciente_nome matching the selected option
          const selected = pacientes.find((p) => p.id === selectedPacienteId);
          if (!selected) return true;
          return n.paciente_nome === selected.label;
        })
      : allNotificacoes;

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchNotificacoes();
  }, [fetchNotificacoes]);

  const handleMarkAsRead = useCallback(async (notificacao: Notificacao) => {
    if (notificacao.lido_em) return;

    try {
      await api.put(`/notificacoes/${notificacao.id}/lida`);
      setAllNotificacoes((prev) =>
        prev.map((n) =>
          n.id === notificacao.id
            ? { ...n, lido_em: new Date().toISOString() }
            : n
        )
      );
    } catch {
      // Silently fail — user can retry
    }
  }, []);

  const handleSelectPaciente = useCallback((id: number) => {
    selectedIdRef.current = id;
    setSelectedPacienteId(id);
  }, []);

  const retry = useCallback(() => {
    setIsLoading(true);
    fetchNotificacoes();
  }, [fetchNotificacoes]);

  return {
    notificacoes,
    pacientes,
    selectedPacienteId,
    isLoading,
    isRefreshing,
    error,
    handleRefresh,
    handleMarkAsRead,
    handleSelectPaciente,
    retry,
  };
}
