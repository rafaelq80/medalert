import { z } from 'zod';

export const agendaSchema = z.object({
  horario: z.string().min(1, 'Horário é obrigatório').regex(/^\d{2}:\d{2}$/, 'Formato HH:MM'),
  frequencia: z.enum(['DIARIA', 'SEMANAL', 'PERSONALIZADA'], {
    error: 'Frequência é obrigatória',
  }),
  dias_semana: z.string().optional(),
  tolerancia_minutos: z.number().int().min(1).default(30),
  data_inicio: z
    .string()
    .min(1, 'Data de início é obrigatória')
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato inválido'),
  data_fim: z.string().optional(),
});

export type AgendaFormData = z.infer<typeof agendaSchema>;
