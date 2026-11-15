import type { CategoriaValue } from './categories';

export type TransactionType = 'deposito' | 'transferencia';

export interface Transaction {
  id: string;
  valor: number;
  tipo: TransactionType;
  data: string;
  descricao: string;
  categoria: CategoriaValue;
  criadoEm: number;
}

export interface TransactionInput {
  valor: number;
  tipo: TransactionType;
  data: string;
  descricao: string;
  categoria: CategoriaValue;
}

export interface TransactionFilters {
  tipo?: TransactionType;
  categoria?: CategoriaValue;
  dataInicio?: string;
  dataFim?: string;
}

export interface ListPageParams {
  filters: TransactionFilters;
  cursor: string | null;
  pageSize: number;
}

export interface TransactionPage {
  items: Transaction[];
  nextCursor: string | null;
}
