export type TipoUsuario = 'PACIENTE' | 'RESPONSAVEL' | 'CUIDADOR' | 'ADMIN';
export type NivelAutonomia = 'TOTAL' | 'PARCIAL' | 'DEPENDENTE';
export type FrequenciaTomada = 'DIARIA' | 'SEMANAL' | 'PERSONALIZADA';
export type StatusTomada = 'PENDENTE' | 'CONFIRMADO' | 'ATRASADO' | 'IGNORADO';
export type TipoNotificacao = 'LEMBRETE' | 'FALHA_TOMADA' | 'RETORNO_MEDICO' | 'CONFIRMACAO';

export interface Usuario {
  id: number;
  nome: string;
  email: string;
  telefone?: string;
  tipo: TipoUsuario;
  ativo: boolean;
  criado_em: string;
  data_nascimento?: string;
  obs_medicas?: string;
  nivel_autonomia?: NivelAutonomia;
  grau_parentesco?: string;
  recebe_notificacoes?: boolean;
}

export interface Vinculo {
  id: number;
  responsavel_id: number;
  paciente_id: number;
  paciente_nome?: string;
  paciente_email?: string;
  data_inicio: string;
  data_fim?: string;
  ativo: boolean;
}

export interface Medicamento {
  id: number;
  paciente_id: number;
  categoria_id?: number;
  categoria_nome?: string;
  nome: string;
  dosagem: string;
  instrucoes: string;
  uso_continuo: boolean;
  necessita_retorno: boolean;
  intervalo_retorno_dias?: number;
  data_inicio_tratamento: string;
  data_proximo_retorno?: string;
  ativo: boolean;
  criado_em: string;
  criado_por: number;
  atualizado_em?: string;
  atualizado_por?: number;
}

export interface Agenda {
  id: number;
  medicamento_id: number;
  horario: string;
  frequencia: FrequenciaTomada;
  dias_semana?: string;
  tolerancia_minutos: number;
  data_inicio: string;
  data_fim?: string;
  ativo: boolean;
}

export interface RegistroTomada {
  id: number;
  agenda_id: number;
  paciente_id: number;
  data_hora_prevista: string;
  data_hora_confirmacao?: string;
  status: StatusTomada;
  usuario_confirmacao_id?: number;
  medicamento_nome?: string;
  medicamento_dosagem?: string;
  medicamento_instrucoes?: string;
  tolerancia_minutos?: number;
}

export interface Notificacao {
  id: number;
  usuario_id: number;
  registro_tomada_id?: number;
  tipo: TipoNotificacao;
  enviado_em: string;
  lido_em?: string;
  medicamento_nome?: string;
  paciente_nome?: string;
  horario_previsto?: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface Categoria {
  id: number;
  nome: string;
  descricao?: string;
}

export interface PacienteOption {
  id: number;
  label: string;
}
