import type { TransactionInput } from './entities';

interface DemoTemplate extends Omit<TransactionInput, 'data'> {
  diasAtras: number;
}

export interface DemoTransaction {
  input: TransactionInput;
  createdAt: number;
}

const TEMPLATES: DemoTemplate[] = [
  { tipo: 'deposito', categoria: 'salario', valor: 3200, descricao: 'Salário', diasAtras: 12 },
  { tipo: 'transferencia', categoria: 'moradia', valor: 950, descricao: 'Aluguel', diasAtras: 11 },
  { tipo: 'transferencia', categoria: 'alimentacao', valor: 62.9, descricao: 'Supermercado', diasAtras: 9 },
  { tipo: 'transferencia', categoria: 'transporte', valor: 28, descricao: 'Uber', diasAtras: 8 },
  { tipo: 'deposito', categoria: 'freelance', valor: 450, descricao: 'Freelance de design', diasAtras: 7 },
  { tipo: 'transferencia', categoria: 'lazer', valor: 80, descricao: 'Cinema com amigos', diasAtras: 6 },
  { tipo: 'transferencia', categoria: 'contas', valor: 145, descricao: 'Conta de energia', diasAtras: 5 },
  { tipo: 'transferencia', categoria: 'assinaturas', valor: 39.9, descricao: 'Assinatura de streaming', diasAtras: 4 },
  { tipo: 'deposito', categoria: 'reembolso', valor: 120, descricao: 'Reembolso da faculdade', diasAtras: 3 },
  { tipo: 'transferencia', categoria: 'saude', valor: 90, descricao: 'Farmácia', diasAtras: 1 },
];

function toIsoDate(base: Date, daysAgo: number): string {
  const date = new Date(base);
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().slice(0, 10);
}

export function buildDemoTransactions(now: Date): DemoTransaction[] {
  return TEMPLATES.map(({ diasAtras, ...rest }, index) => ({
    input: { ...rest, data: toIsoDate(now, diasAtras) },
    createdAt: now.getTime() - (TEMPLATES.length - index) * 1000,
  }));
}
