import { useState, useCallback, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Notificacao, Vinculo, PacienteOption } from '../types';

const PAGE_SIZE = 5;

export interface UseNotificacoesReturn {
  notificacoes: Notificacao[];
  pacientes: PacienteOption[];
  selectedPacienteId: number | null;
  isLoading: boolean;
  isRefreshing: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  error: string | null;
  handleRefresh: () => void;
  handleLoadMore: () => void;
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
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const selectedIdRef = useRef<number | null>(null);
  const pageRef = useRef(1);

  const fetchPage = useCallback(async (page: number): Promise<Notificacao[]> => {
    const { data } = await api.get<Notificacao[]>('/notificacoes', {
      params: { page, size: PAGE_SIZE },
    });
    return data;
  }, []);

  const fetchNotificacoes = useCallback(async () => {
    if (!user) return;

    try {
      setError(null);
      pageRef.current = 1;

      const data = await fetchPage(1);
      const sorted = data.sort(
        (a, b) => new Date(b.enviado_em).getTime() - new Date(a.enviado_em).getTime()
      );
      setAllNotificacoes(sorted);
      setHasMore(data.length >= PAGE_SIZE);

      // Build patient filter for responsável/cuidador
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

          const currentValid = selectedIdRef.current !== null && options.some((o) => o.id === selectedIdRef.current);
          if (!currentValid) {
            selectedIdRef.current = 0;
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
  }, [user, fetchPage]);

  useFocusEffect(
    useCallback(() => {
      setIsLoading(true);
      fetchNotificacoes();
    }, [fetchNotificacoes])
  );

  const handleLoadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);
    try {
      const nextPage = pageRef.current + 1;
      const data = await fetchPage(nextPage);

      if (data.length < PAGE_SIZE) {
        setHasMore(false);
      }

      if (data.length > 0) {
        pageRef.current = nextPage;
        setAllNotificacoes((prev) => [...prev, ...data]);
      }
    } catch {
      // Silent fail on load more
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, hasMore, fetchPage]);

  // Filter by selected patient
  const notificacoes = selectedPacienteId && selectedPacienteId !== 0
    ? allNotificacoes.filter((n) => {
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
        prev.map((n) => n.id === notificacao.id ? { ...n, lido_em: new Date().toISOString() } : n)
      );
    } catch {
      // Silent fail
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
    isLoadingMore,
    hasMore,
    error,
    handleRefresh,
    handleLoadMore,
    handleMarkAsRead,
    handleSelectPaciente,
    retry,
  };
}
