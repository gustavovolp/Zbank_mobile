import type { CategoriaValue } from '../constants/categorias';

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
  busca?: string;
}
