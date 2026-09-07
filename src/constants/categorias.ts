import type { TransactionType } from '../types/transaction';

export interface CategoriaOption {
  value: string;
  label: string;
}

export const CATEGORIAS_POR_TIPO = {
  deposito: [
    { value: 'salario', label: 'Salário' },
    { value: 'freelance', label: 'Freelance' },
    { value: 'investimentos', label: 'Investimentos' },
    { value: 'presente', label: 'Presente / Doação' },
    { value: 'reembolso', label: 'Reembolso' },
    { value: 'outros_receita', label: 'Outros (Receita)' },
  ],
  transferencia: [
    { value: 'alimentacao', label: 'Alimentação' },
    { value: 'transporte', label: 'Transporte' },
    { value: 'moradia', label: 'Moradia' },
    { value: 'saude', label: 'Saúde' },
    { value: 'educacao', label: 'Educação' },
    { value: 'lazer', label: 'Lazer' },
    { value: 'assinaturas', label: 'Assinaturas' },
    { value: 'compras', label: 'Compras' },
    { value: 'contas', label: 'Contas e Utilidades' },
    { value: 'outros_despesa', label: 'Outros (Despesa)' },
  ],
} as const satisfies Record<TransactionType, CategoriaOption[]>;

export type CategoriaValue = (typeof CATEGORIAS_POR_TIPO)[TransactionType][number]['value'];

export const CATEGORIA_PADRAO: Record<TransactionType, CategoriaValue> = {
  deposito: 'outros_receita',
  transferencia: 'outros_despesa',
};

interface RegraSugestao {
  categoria: CategoriaValue;
  palavrasChave: string[];
}

const SUGESTOES_POR_TIPO: Record<TransactionType, RegraSugestao[]> = {
  transferencia: [
    { categoria: 'alimentacao', palavrasChave: ['mercado', 'supermercado', 'restaurante', 'ifood', 'padaria', 'lanchonete'] },
    { categoria: 'transporte', palavrasChave: ['uber', '99', 'combustivel', 'gasolina', 'onibus', 'metro', 'taxi'] },
    { categoria: 'moradia', palavrasChave: ['aluguel', 'condominio', 'iptu'] },
    { categoria: 'assinaturas', palavrasChave: ['netflix', 'streaming', 'spotify', 'assinatura', 'prime video'] },
    { categoria: 'saude', palavrasChave: ['farmacia', 'consulta', 'plano de saude', 'hospital', 'remedio'] },
    { categoria: 'educacao', palavrasChave: ['curso', 'faculdade', 'escola', 'mensalidade', 'livro'] },
    { categoria: 'contas', palavrasChave: ['energia', 'agua', 'internet', 'telefone', 'luz', 'conta de'] },
    { categoria: 'lazer', palavrasChave: ['cinema', 'show', 'viagem', 'jogo', 'bar'] },
    { categoria: 'compras', palavrasChave: ['loja', 'shopping', 'roupa', 'compra'] },
  ],
  deposito: [
    { categoria: 'salario', palavrasChave: ['salario', 'folha de pagamento'] },
    { categoria: 'freelance', palavrasChave: ['freelance', 'freela'] },
    { categoria: 'investimentos', palavrasChave: ['dividendo', 'rendimento', 'investimento'] },
    { categoria: 'presente', palavrasChave: ['presente', 'doacao'] },
    { categoria: 'reembolso', palavrasChave: ['reembolso', 'estorno'] },
  ],
};

const INICIO_DIACRITICOS = String.fromCharCode(0x0300);
const FIM_DIACRITICOS = String.fromCharCode(0x036f);
const DIACRITICOS = new RegExp('[' + INICIO_DIACRITICOS + '-' + FIM_DIACRITICOS + ']', 'g');

function normalizar(texto: string): string {
  return texto.trim().toLowerCase().normalize('NFD').replace(DIACRITICOS, '');
}

export function sugerirCategoria(descricao: string, tipo: TransactionType): CategoriaValue | null {
  const texto = normalizar(descricao);
  if (!texto) return null;

  const match = SUGESTOES_POR_TIPO[tipo].find((regra) =>
    regra.palavrasChave.some((palavra) => texto.includes(palavra))
  );

  return match?.categoria ?? null;
}

export function obterLabelCategoria(tipo: TransactionType, categoria: CategoriaValue): string {
  return CATEGORIAS_POR_TIPO[tipo].find((c) => c.value === categoria)?.label ?? categoria;
}
