import { z } from 'zod';

const baseSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  email: z.string().min(1, 'E-mail é obrigatório').email('E-mail inválido'),
  senha: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  telefone: z.string().optional(),
});

const pacienteSchema = baseSchema.extend({
  tipo: z.literal('PACIENTE'),
  data_nascimento: z
    .string()
    .min(1, 'Data de nascimento é obrigatória')
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato deve ser AAAA-MM-DD'),
  obs_medicas: z.string().min(1, 'Observações médicas são obrigatórias para pacientes'),
  nivel_autonomia: z.enum(['TOTAL', 'PARCIAL', 'DEPENDENTE'], {
    error: 'Nível de autonomia é obrigatório',
  }),
});

const responsavelSchema = baseSchema.extend({
  tipo: z.literal('RESPONSAVEL'),
  grau_parentesco: z.string().min(1, 'Grau de parentesco é obrigatório'),
  recebe_notificacoes: z.boolean(),
});

const cuidadorSchema = baseSchema.extend({
  tipo: z.literal('CUIDADOR'),
  grau_parentesco: z.string().min(1, 'Grau de parentesco é obrigatório'),
  recebe_notificacoes: z.boolean(),
});

export const registerSchema = z.discriminatedUnion('tipo', [
  pacienteSchema,
  responsavelSchema,
  cuidadorSchema,
]);

export type RegisterFormData = z.infer<typeof registerSchema>;
