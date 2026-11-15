import { describe, expect, it } from 'vitest';
import { buildDemoTransactions } from '../demoTransactions';
import { FIXED_NOW, createFakeDependencies } from '@/testing/createFakeDependencies';
import { validateTransactionDraft } from '../validation';

describe('dados de exemplo', () => {
  it('gera 10 transações válidas com datas relativas a "agora"', () => {
    const demo = buildDemoTransactions(FIXED_NOW);

    expect(demo).toHaveLength(10);
    for (const { input } of demo) {
      expect(validateTransactionDraft(input)).toEqual({});
      expect(input.data <= FIXED_NOW.toISOString().slice(0, 10)).toBe(true);
    }
  });

  it('mantém a ordem de criação coerente com a data (mais antigas primeiro)', () => {
    const demo = buildDemoTransactions(FIXED_NOW);
    const createdAt = demo.map((d) => d.createdAt);
    expect([...createdAt].sort((a, b) => a - b)).toEqual(createdAt);
  });

  it('SeedDemoTransactions grava todas as transações no repositório', async () => {
    const { transactionRepository } = createFakeDependencies();
    const { SeedDemoTransactions } = await import('./SeedDemoTransactions');
    await new SeedDemoTransactions(transactionRepository, { now: () => FIXED_NOW }).execute('u1');

    const page = await transactionRepository.listPage('u1', { filters: {}, cursor: null, pageSize: 50 });
    expect(page.items).toHaveLength(10);
    expect(page.items[0].descricao).toBe('Farmácia');
  });
});
