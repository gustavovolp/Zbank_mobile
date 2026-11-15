import { ValidationError, type FieldErrors } from '@/core/domain/errors';
import { isCategoryOfType, type CategoriaValue } from './categories';
import type { TransactionFilters, TransactionInput, TransactionType } from './entities';

export const DESCRICAO_MIN_LENGTH = 3;
export const DESCRICAO_MAX_LENGTH = 120;
export const VALOR_MAX = 1_000_000_000;

export interface TransactionDraft {
  valor: number;
  tipo: TransactionType;
  categoria?: string;
  descricao: string;
  data: string;
}

export function isValidIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

export function validateTransactionDraft(draft: TransactionDraft): FieldErrors {
  const errors: FieldErrors = {};

  if (draft.tipo !== 'deposito' && draft.tipo !== 'transferencia') {
    errors.tipo = 'Selecione o tipo da transação.';
  }

  if (!Number.isFinite(draft.valor) || draft.valor <= 0) {
    errors.valor = 'Informe um valor numérico maior que zero.';
  } else if (draft.valor > VALOR_MAX) {
    errors.valor = 'O valor informado é alto demais.';
  }

  if (!draft.categoria) {
    errors.categoria = 'Selecione uma categoria.';
  } else if (!errors.tipo && !isCategoryOfType(draft.tipo, draft.categoria)) {
    errors.categoria = 'Categoria inválida para este tipo de transação.';
  }

  const descricao = draft.descricao.trim();
  if (descricao.length < DESCRICAO_MIN_LENGTH) {
    errors.descricao = `A descrição precisa ter pelo menos ${DESCRICAO_MIN_LENGTH} caracteres.`;
  } else if (descricao.length > DESCRICAO_MAX_LENGTH) {
    errors.descricao = `A descrição pode ter no máximo ${DESCRICAO_MAX_LENGTH} caracteres.`;
  }

  if (!isValidIsoDate(draft.data)) {
    errors.data = 'Informe uma data válida.';
  }

  return errors;
}

export function parseTransactionDraft(draft: TransactionDraft): TransactionInput {
  const errors = validateTransactionDraft(draft);
  if (Object.keys(errors).length > 0) {
    throw new ValidationError(errors);
  }

  return {
    valor: Math.round(draft.valor * 100) / 100,
    tipo: draft.tipo,
    data: draft.data,
    descricao: draft.descricao.trim(),
    categoria: draft.categoria as CategoriaValue,
  };
}

export function validateFilterRange(filters: Pick<TransactionFilters, 'dataInicio' | 'dataFim'>): FieldErrors {
  const errors: FieldErrors = {};
  const { dataInicio, dataFim } = filters;

  if (dataInicio && !isValidIsoDate(dataInicio)) {
    errors.dataInicio = 'Use o formato AAAA-MM-DD.';
  }
  if (dataFim && !isValidIsoDate(dataFim)) {
    errors.dataFim = 'Use o formato AAAA-MM-DD.';
  }
  if (!errors.dataInicio && !errors.dataFim && dataInicio && dataFim && dataInicio > dataFim) {
    errors.dataFim = 'A data final não pode ser anterior à inicial.';
  }

  return errors;
}
