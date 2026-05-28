import { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../services/api';
import { Notificacao } from '../types';

export interface UseNotificacoesReturn {
  notificacoes: Notificacao[];
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  handleRefresh: () => void;
  handleMarkAsRead: (notificacao: Notificacao) => void;
  retry: () => void;
}

export function useNotificacoes(): UseNotificacoesReturn {
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNotificacoes = useCallback(async () => {
    try {
      setError(null);
      const { data } = await api.get<Notificacao[]>('/notificacoes');
      const sorted = data.sort(
        (a, b) =>
          new Date(b.enviado_em).getTime() - new Date(a.enviado_em).getTime()
      );
      setNotificacoes(sorted);
    } catch {
      setError('Não foi possível carregar as notificações. Tente novamente.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setIsLoading(true);
      fetchNotificacoes();
    }, [fetchNotificacoes])
  );

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchNotificacoes();
  }, [fetchNotificacoes]);

  const handleMarkAsRead = useCallback(async (notificacao: Notificacao) => {
    if (notificacao.lido_em) return;

    try {
      await api.put(`/notificacoes/${notificacao.id}/lida`);
      setNotificacoes((prev) =>
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

  const retry = useCallback(() => {
    setIsLoading(true);
    fetchNotificacoes();
  }, [fetchNotificacoes]);

  return {
    notificacoes,
    isLoading,
    isRefreshing,
    error,
    handleRefresh,
    handleMarkAsRead,
    retry,
  };
}
