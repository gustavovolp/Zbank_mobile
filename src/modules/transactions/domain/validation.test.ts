import { describe, expect, it } from 'vitest';
import { ValidationError } from '@/core/domain/errors';
import {
  DESCRICAO_MAX_LENGTH,
  isValidIsoDate,
  parseTransactionDraft,
  validateFilterRange,
  validateTransactionDraft,
  type TransactionDraft,
} from './validation';

const validDraft: TransactionDraft = {
  valor: 50,
  tipo: 'transferencia',
  categoria: 'alimentacao',
  descricao: 'Supermercado',
  data: '2026-03-20',
};

describe('validateTransactionDraft', () => {
  it('não retorna erros para um rascunho válido', () => {
    expect(validateTransactionDraft(validDraft)).toEqual({});
  });

  it.each([0, -5, Number.NaN, Number.POSITIVE_INFINITY])('rejeita valor inválido (%s)', (valor) => {
    expect(validateTransactionDraft({ ...validDraft, valor }).valor).toBeDefined();
  });

  it('exige categoria e que ela pertença ao tipo', () => {
    expect(validateTransactionDraft({ ...validDraft, categoria: undefined }).categoria).toMatch(/Selecione/);
    expect(validateTransactionDraft({ ...validDraft, categoria: 'salario' }).categoria).toMatch(/inválida/);
  });

  it('valida o tamanho da descrição', () => {
    expect(validateTransactionDraft({ ...validDraft, descricao: ' ab ' }).descricao).toBeDefined();
    expect(
      validateTransactionDraft({ ...validDraft, descricao: 'a'.repeat(DESCRICAO_MAX_LENGTH + 1) }).descricao
    ).toBeDefined();
  });

  it('valida a data', () => {
    expect(validateTransactionDraft({ ...validDraft, data: '2026-02-30' }).data).toBeDefined();
    expect(validateTransactionDraft({ ...validDraft, data: '20/03/2026' }).data).toBeDefined();
  });
});

describe('parseTransactionDraft', () => {
  it('normaliza valor (2 casas) e descrição (sem espaços nas pontas)', () => {
    const input = parseTransactionDraft({ ...validDraft, valor: 10.126, descricao: '  Mercado  ' });
    expect(input.valor).toBe(10.13);
    expect(input.descricao).toBe('Mercado');
  });

  it('lança ValidationError com os erros por campo', () => {
    try {
      parseTransactionDraft({ ...validDraft, valor: 0, descricao: '' });
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(ValidationError);
      expect(Object.keys((error as ValidationError).fieldErrors).sort()).toEqual(['descricao', 'valor']);
    }
  });
});

describe('datas e filtros', () => {
  it('isValidIsoDate reconhece datas reais do calendário', () => {
    expect(isValidIsoDate('2024-02-29')).toBe(true);
    expect(isValidIsoDate('2025-02-29')).toBe(false);
    expect(isValidIsoDate('2025-13-01')).toBe(false);
  });

  it('validateFilterRange detecta formato inválido e intervalo invertido', () => {
    expect(validateFilterRange({})).toEqual({});
    expect(validateFilterRange({ dataInicio: '2026-01-01', dataFim: '2026-01-31' })).toEqual({});
    expect(validateFilterRange({ dataInicio: 'ontem' }).dataInicio).toBeDefined();
    expect(validateFilterRange({ dataInicio: '2026-02-01', dataFim: '2026-01-01' }).dataFim).toBeDefined();
  });
});
