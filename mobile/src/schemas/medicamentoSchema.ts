import { z } from 'zod';

export const medicamentoSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  dosagem: z.string().min(1, 'Dosagem é obrigatória'),
  instrucoes: z.string().min(1, 'Instruções são obrigatórias'),
  uso_continuo: z.boolean(),
  necessita_retorno: z.boolean(),
  intervalo_retorno_dias: z.string().optional(),
  categoria_id: z.number().int().positive().optional(),
  data_inicio_tratamento: z
    .string()
    .min(1, 'Data de início é obrigatória')
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato inválido'),
});

export type MedicamentoFormData = z.infer<typeof medicamentoSchema>;
