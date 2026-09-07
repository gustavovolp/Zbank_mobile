import type { CategoriaValue } from '../constants/categorias';
import type { TipoArquivoPermitido } from '../utils/anexoUtils';

export type TransactionType = 'deposito' | 'transferencia';

export interface Anexo {
  nome: string;
  tipoArquivo: TipoArquivoPermitido;
  tamanho: number;
  url: string;
}

export interface Transaction {
  id: string;
  valor: number;
  tipo: TransactionType;
  data: string; // ISO date (yyyy-MM-dd)
  descricao: string;
  categoria: CategoriaValue;
  anexo?: Anexo | null;
  criadoEm: number; // epoch ms, usado como cursor estável de paginação
}

export interface TransactionInput {
  valor: number;
  tipo: TransactionType;
  data: string;
  descricao: string;
  categoria: CategoriaValue;
  anexo?: Anexo | null;
}

export interface TransactionFilters {
  tipo?: TransactionType;
  categoria?: CategoriaValue;
  dataInicio?: string;
  dataFim?: string;
  busca?: string;
}
