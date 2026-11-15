import { normalizeText } from '@/core/domain/text';
import type { Transaction } from './entities';

export interface FinancialSummary {
  saldo: number;
  receitas: number;
  despesas: number;
  porCategoria: Record<string, number>;
}

const toCents = (valor: number) => Math.round(valor * 100);

export function calculateSummary(transactions: readonly Transaction[]): FinancialSummary {
  let receitas = 0;
  let despesas = 0;
  const porCategoria: Record<string, number> = {};

  for (const transaction of transactions) {
    const cents = toCents(transaction.valor);
    if (transaction.tipo === 'deposito') receitas += cents;
    else despesas += cents;
    porCategoria[transaction.categoria] = (porCategoria[transaction.categoria] ?? 0) + cents;
  }

  for (const categoria of Object.keys(porCategoria)) {
    porCategoria[categoria] /= 100;
  }

  return {
    saldo: (receitas - despesas) / 100,
    receitas: receitas / 100,
    despesas: despesas / 100,
    porCategoria,
  };
}

export function searchTransactions(transactions: readonly Transaction[], term: string): readonly Transaction[] {
  const normalizedTerm = normalizeText(term);
  if (!normalizedTerm) return transactions;
  return transactions.filter((transaction) => normalizeText(transaction.descricao).includes(normalizedTerm));
}
