import { describe, expect, it } from 'vitest';
import { applyFilters } from '@/modules/transactions/presentation/state/transactionsSlice';
import { createTestStore, sampleInput, TEST_USER } from '@/testing/createTestStore';
import { startUserSession } from './session';

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const FAST = { syncDebounceMs: 5 };

describe('startUserSession', () => {
  it('carrega a lista (pré-busca) e o resumo em tempo real assim que o usuário entra', async () => {
    const { store, seed, dependencies } = createTestStore({ pageSize: 3 });
    await seed(5);

    const stop = startUserSession(TEST_USER.uid, store.dispatch, dependencies, FAST);
    await flush();

    const { transactions } = store.getState();
    expect(transactions.recentStatus).toBe('ready');
    expect(transactions.recent).toHaveLength(5);
    expect(transactions.ids).toHaveLength(3);
    stop();
  });

  it('propaga mudanças feitas no repositório para o resumo sem novo pedido (reativo)', async () => {
    const { store, dependencies, transactionRepository } = createTestStore();
    const stop = startUserSession(TEST_USER.uid, store.dispatch, dependencies, FAST);
    await flush();

    await transactionRepository.add(TEST_USER.uid, sampleInput);

    expect(store.getState().transactions.recent).toHaveLength(1);
    stop();
  });

  it('sincroniza a lista paginada sozinha quando chegam dados novos (ex.: dados de exemplo do cadastro)', async () => {
    const { store, dependencies, transactionRepository } = createTestStore({ pageSize: 5 });
    const stop = startUserSession(TEST_USER.uid, store.dispatch, dependencies, FAST);
    await flush();
    expect(store.getState().transactions.ids).toHaveLength(0);

    await transactionRepository.add(TEST_USER.uid, sampleInput, 1);
    await transactionRepository.add(TEST_USER.uid, sampleInput, 2);
    await wait(40);

    expect(store.getState().transactions.ids).toHaveLength(2);
    stop();
  });

  it('não refaz a busca quando a primeira página já está em dia com o stream', async () => {
    const { store, seed, dependencies, transactionRepository } = createTestStore({ pageSize: 5 });
    await seed(3);
    const stop = startUserSession(TEST_USER.uid, store.dispatch, dependencies, FAST);
    await wait(40);
    const callsAfterStart = transactionRepository.listPageCalls;

    await transactionRepository.add(TEST_USER.uid, sampleInput, 9_999);
    await wait(40);
    const callsAfterRemoteChange = transactionRepository.listPageCalls;

    expect(callsAfterRemoteChange).toBe(callsAfterStart + 1);

    await wait(40);
    expect(transactionRepository.listPageCalls).toBe(callsAfterRemoteChange);
    stop();
  });

  it('com filtros ativos, uma mudança remota refaz a busca filtrada', async () => {
    const { store, seed, dependencies, transactionRepository } = createTestStore({ pageSize: 5 });
    await seed(2, { tipo: 'deposito', categoria: 'salario' });
    const stop = startUserSession(TEST_USER.uid, store.dispatch, dependencies, FAST);
    await wait(40);
    await store.dispatch(applyFilters({ tipo: 'deposito' }));
    expect(store.getState().transactions.ids).toHaveLength(2);

    await transactionRepository.add(TEST_USER.uid, { ...sampleInput, tipo: 'deposito', categoria: 'salario' }, 5_000);
    await wait(40);

    expect(store.getState().transactions.ids).toHaveLength(3);
    stop();
  });

  it('ao encerrar, cancela a assinatura e limpa o estado (logout)', async () => {
    const { store, seed, dependencies, transactionRepository } = createTestStore();
    await seed(2);
    const stop = startUserSession(TEST_USER.uid, store.dispatch, dependencies, FAST);
    await flush();

    stop();
    await transactionRepository.add(TEST_USER.uid, sampleInput);
    await wait(30);

    expect(store.getState().transactions.recent).toHaveLength(0);
    expect(store.getState().transactions.ids).toHaveLength(0);
  });

  it('marca erro no resumo quando o stream falha (ex.: permission-denied)', async () => {
    const { store, dependencies } = createTestStore();
    dependencies.transactions.observeRecent.execute = () =>
      new (class {
        subscribe(observer: { error: (error: unknown) => void }) {
          observer.error({ code: 'permission-denied' });
          return { unsubscribe: () => undefined };
        }
      })() as never;

    const stop = startUserSession(TEST_USER.uid, store.dispatch, dependencies, FAST);

    expect(store.getState().transactions.recentStatus).toBe('error');
    expect(store.getState().transactions.recentError).toMatch(/regras de segurança/);
    stop();
  });
});
