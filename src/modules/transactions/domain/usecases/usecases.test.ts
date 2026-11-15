import { describe, expect, it } from 'vitest';
import { ValidationError } from '@/core/domain/errors';
import { createFakeDependencies } from '@/testing/createFakeDependencies';

const draft = {
  valor: 25.5,
  tipo: 'transferencia' as const,
  categoria: 'transporte',
  descricao: 'Uber para o trabalho',
  data: '2026-03-20',
};

describe('use cases de transações', () => {
  it('AddTransaction valida o rascunho e persiste os dados normalizados', async () => {
    const { dependencies, transactionRepository } = createFakeDependencies();

    const created = await dependencies.transactions.add.execute('u1', { ...draft, descricao: '  Uber  ' });

    expect(created.descricao).toBe('Uber');
    expect(transactionRepository.addCalls).toBe(1);
  });

  it('AddTransaction não chega ao repositório quando há erro de validação', async () => {
    const { dependencies, transactionRepository } = createFakeDependencies();

    await expect(dependencies.transactions.add.execute('u1', { ...draft, valor: 0 })).rejects.toBeInstanceOf(
      ValidationError
    );
    expect(transactionRepository.addCalls).toBe(0);
  });

  it('UpdateTransaction altera a transação mantendo id e criadoEm', async () => {
    const { dependencies, transactionRepository } = createFakeDependencies();
    const created = await dependencies.transactions.add.execute('u1', draft);

    await dependencies.transactions.update.execute('u1', created.id, { ...draft, valor: 99 });

    const page = await transactionRepository.listPage('u1', { filters: {}, cursor: null, pageSize: 10 });
    expect(page.items[0]).toMatchObject({ id: created.id, valor: 99, criadoEm: created.criadoEm });
  });

  it('DeleteTransaction remove a transação', async () => {
    const { dependencies, transactionRepository } = createFakeDependencies();
    const created = await dependencies.transactions.add.execute('u1', draft);

    await dependencies.transactions.remove.execute('u1', created.id);

    const page = await transactionRepository.listPage('u1', { filters: {}, cursor: null, pageSize: 10 });
    expect(page.items).toHaveLength(0);
  });

  it('ListTransactionsPage pagina com cursor e rejeita intervalo de datas inválido', async () => {
    const { dependencies } = createFakeDependencies({ pageSize: 2 });
    for (let i = 0; i < 5; i += 1) {
      await dependencies.transactions.add.execute('u1', { ...draft, descricao: `Transação ${i}` });
    }

    const first = await dependencies.transactions.list.execute('u1', { filters: {}, cursor: null, pageSize: 2 });
    const second = await dependencies.transactions.list.execute('u1', {
      filters: {},
      cursor: first.nextCursor,
      pageSize: 2,
    });
    const third = await dependencies.transactions.list.execute('u1', {
      filters: {},
      cursor: second.nextCursor,
      pageSize: 2,
    });

    expect([first.items.length, second.items.length, third.items.length]).toEqual([2, 2, 1]);
    expect(third.nextCursor).toBeNull();

    await expect(
      dependencies.transactions.list.execute('u1', {
        filters: { dataInicio: '2026-05-01', dataFim: '2026-01-01' },
        cursor: null,
        pageSize: 2,
      })
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it('ObserveRecentTransactions emite o estado atual e as mudanças seguintes', async () => {
    const { dependencies } = createFakeDependencies();
    const emissions: number[] = [];

    const subscription = dependencies.transactions.observeRecent.execute('u1', 300).subscribe((items) => {
      emissions.push(items.length);
    });
    await dependencies.transactions.add.execute('u1', draft);
    subscription.unsubscribe();
    await dependencies.transactions.add.execute('u1', draft);

    expect(emissions).toEqual([0, 1]);
  });
});
