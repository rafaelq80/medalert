/**
 * Centralized query key factory for @tanstack/react-query.
 * Ensures consistent cache invalidation across the app.
 */
export const queryKeys = {
  // Vínculos
  vinculos: ['vinculos'] as const,

  // Medicamentos
  medicamentos: (pacienteId: number) => ['medicamentos', pacienteId] as const,

  // Agendas
  agendas: (medicamentoId: number) => ['agendas', medicamentoId] as const,

  // Registros de tomada (agenda do dia)
  registrosDia: (pacienteId: number) => ['registros-dia', pacienteId] as const,

  // Histórico
  historico: (pacienteId: number, period: number) => ['historico', pacienteId, period] as const,

  // Notificações
  notificacoes: ['notificacoes'] as const,

  // Admin
  adminMetricas: ['admin', 'metricas'] as const,
  adminUsuarios: (params?: Record<string, unknown>) => ['admin', 'usuarios', params] as const,
  adminUsuario: (id: number) => ['admin', 'usuario', id] as const,
  categorias: ['categorias'] as const,
} as const;
