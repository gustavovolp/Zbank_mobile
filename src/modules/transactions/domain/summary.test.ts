import { describe, expect, it } from 'vitest';
import type { Transaction } from './entities';
import { calculateSummary, searchTransactions } from './summary';

function tx(partial: Partial<Transaction> & Pick<Transaction, 'id' | 'valor' | 'tipo' | 'categoria'>): Transaction {
  return { data: '2026-03-20', descricao: 'x', criadoEm: 0, ...partial };
}

describe('calculateSummary', () => {
  it('retorna zeros para lista vazia', () => {
    expect(calculateSummary([])).toEqual({
      saldo: 0,
      receitas: 0,
      despesas: 0,
      porCategoria: {},
      despesasPorCategoria: {},
    });
  });

  it('soma receitas, despesas e agrupa por categoria', () => {
    const summary = calculateSummary([
      tx({ id: '1', valor: 1000, tipo: 'deposito', categoria: 'salario' }),
      tx({ id: '2', valor: 200, tipo: 'transferencia', categoria: 'alimentacao' }),
      tx({ id: '3', valor: 50, tipo: 'transferencia', categoria: 'alimentacao' }),
    ]);

    expect(summary.receitas).toBe(1000);
    expect(summary.despesas).toBe(250);
    expect(summary.saldo).toBe(750);
    expect(summary.porCategoria).toEqual({ salario: 1000, alimentacao: 250 });
  });

  it('separa as categorias de despesa (regra de negócio usada pelo gráfico de gastos)', () => {
    const summary = calculateSummary([
      tx({ id: '1', valor: 1000, tipo: 'deposito', categoria: 'salario' }),
      tx({ id: '2', valor: 200, tipo: 'transferencia', categoria: 'alimentacao' }),
      tx({ id: '3', valor: 50, tipo: 'transferencia', categoria: 'alimentacao' }),
      tx({ id: '4', valor: 30, tipo: 'transferencia', categoria: 'lazer' }),
    ]);

    expect(summary.despesasPorCategoria).toEqual({ alimentacao: 250, lazer: 30 });
  });

  it('evita erro de ponto flutuante somando em centavos', () => {
    const summary = calculateSummary([
      tx({ id: '1', valor: 0.1, tipo: 'deposito', categoria: 'salario' }),
      tx({ id: '2', valor: 0.2, tipo: 'deposito', categoria: 'salario' }),
    ]);
    expect(summary.receitas).toBe(0.3);
  });

  it('permite saldo negativo', () => {
    expect(calculateSummary([tx({ id: '1', valor: 10, tipo: 'transferencia', categoria: 'lazer' })]).saldo).toBe(-10);
  });
});

describe('searchTransactions', () => {
  const items = [
    tx({ id: '1', valor: 1, tipo: 'deposito', categoria: 'salario', descricao: 'Salário de março' }),
    tx({ id: '2', valor: 1, tipo: 'transferencia', categoria: 'transporte', descricao: 'Uber' }),
  ];

  it('retorna tudo quando o termo é vazio', () => {
    expect(searchTransactions(items, '  ')).toHaveLength(2);
  });

  it('ignora acentos e caixa', () => {
    expect(searchTransactions(items, 'SALARIO').map((t) => t.id)).toEqual(['1']);
  });
});
