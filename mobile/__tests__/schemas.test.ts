import { loginSchema } from '../src/schemas/loginSchema';
import { medicamentoSchema } from '../src/schemas/medicamentoSchema';
import { agendaSchema } from '../src/schemas/agendaSchema';

describe('loginSchema', () => {
  it('validates correct data', () => {
    const result = loginSchema.safeParse({ email: 'test@email.com', senha: '123456' });
    expect(result.success).toBe(true);
  });

  it('rejects empty email', () => {
    const result = loginSchema.safeParse({ email: '', senha: '123456' });
    expect(result.success).toBe(false);
  });

  it('rejects invalid email', () => {
    const result = loginSchema.safeParse({ email: 'invalid', senha: '123456' });
    expect(result.success).toBe(false);
  });

  it('rejects short password', () => {
    const result = loginSchema.safeParse({ email: 'test@email.com', senha: '123' });
    expect(result.success).toBe(false);
  });
});

describe('medicamentoSchema', () => {
  const validData = {
    nome: 'Losartana',
    dosagem: '50mg',
    instrucoes: 'Tomar em jejum',
    uso_continuo: true,
    necessita_retorno: false,
    data_inicio_tratamento: '2024-01-15',
  };

  it('validates correct data', () => {
    const result = medicamentoSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('rejects empty nome', () => {
    const result = medicamentoSchema.safeParse({ ...validData, nome: '' });
    expect(result.success).toBe(false);
  });

  it('rejects invalid date format', () => {
    const result = medicamentoSchema.safeParse({ ...validData, data_inicio_tratamento: '15/01/2024' });
    expect(result.success).toBe(false);
  });

  it('accepts optional categoria_id', () => {
    const result = medicamentoSchema.safeParse({ ...validData, categoria_id: 5 });
    expect(result.success).toBe(true);
  });
});

describe('agendaSchema', () => {
  const validData = {
    horario: '08:00',
    frequencia: 'DIARIA' as const,
    tolerancia_minutos: 30,
    data_inicio: '2024-01-15',
  };

  it('validates correct data', () => {
    const result = agendaSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('rejects invalid horario format', () => {
    const result = agendaSchema.safeParse({ ...validData, horario: '8:00' });
    expect(result.success).toBe(false);
  });

  it('rejects invalid frequencia', () => {
    const result = agendaSchema.safeParse({ ...validData, frequencia: 'MENSAL' });
    expect(result.success).toBe(false);
  });
});
