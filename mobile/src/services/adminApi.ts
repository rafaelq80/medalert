import { api } from './api';

// Types
export interface UsuarioAdmin {
  id: number;
  nome: string;
  email: string;
  tipo: 'PACIENTE' | 'RESPONSAVEL' | 'CUIDADOR' | 'ADMIN';
  ativo: boolean;
  criado_em: string;
}

export interface UsuarioDetalhe extends UsuarioAdmin {
  telefone: string | null;
  data_nascimento: string | null;
  obs_medicas: string | null;
  nivel_autonomia: string | null;
  grau_parentesco: string | null;
  recebe_notificacoes: boolean | null;
}

export interface PaginatedUsuarios {
  items: UsuarioAdmin[];
  total: number;
  page: number;
  size: number;
}

export interface Metricas {
  usuarios_por_tipo: Record<string, number>;
  usuarios_ativos: number;
  vinculos_ativos: number;
  taxa_adesao_30d: number;
  registros_atrasados_30d: number;
  registros_ignorados_30d: number;
}

export interface Categoria {
  id: number;
  nome: string;
  descricao: string | null;
}

export interface ForcarLogoutResponse {
  tokens_revogados: number;
}

// User Management
export const listarUsuarios = (params?: {
  page?: number;
  size?: number;
  tipo?: string;
  busca?: string;
}) => api.get<PaginatedUsuarios>('/admin/usuarios', { params });

export const obterUsuario = (id: number) =>
  api.get<UsuarioDetalhe>(`/admin/usuarios/${id}`);

export const ativarUsuario = (id: number) =>
  api.patch<UsuarioAdmin>(`/admin/usuarios/${id}/ativar`);

export const desativarUsuario = (id: number) =>
  api.patch<UsuarioAdmin>(`/admin/usuarios/${id}/desativar`);

export const alterarTipoUsuario = (id: number, novo_tipo: string) =>
  api.patch<UsuarioAdmin>(`/admin/usuarios/${id}/tipo`, { novo_tipo });

export const forcarLogout = (id: number) =>
  api.post<ForcarLogoutResponse>(`/admin/usuarios/${id}/forcar-logout`);

// Metrics
export const obterMetricas = () =>
  api.get<Metricas>('/admin/metricas');

// Categories
export const listarCategorias = () =>
  api.get<Categoria[]>('/categorias');

export const criarCategoria = (data: { nome: string; descricao?: string }) =>
  api.post<Categoria>('/admin/categorias', data);

export const atualizarCategoria = (id: number, data: { nome?: string; descricao?: string }) =>
  api.put<Categoria>(`/admin/categorias/${id}`, data);

export const excluirCategoria = (id: number) =>
  api.delete(`/admin/categorias/${id}`);
