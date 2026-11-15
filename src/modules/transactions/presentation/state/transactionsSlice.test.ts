import { describe, expect, it } from 'vitest';
import type { RootState } from '@/shell/rootReducer';
import { createTestStore, sampleInput } from '@/testing/createTestStore';
import type { ListPageParams, TransactionPage } from '../../domain/entities';
import { selectSummary, selectTransactionById, selectVisibleTransactions } from './selectors';
import {
  addTransaction,
  applyFilters,
  fetchFirstPage,
  fetchNextPage,
  recentReceived,
  removeTransaction,
  searchChanged,
  sessionReset,
  updateTransaction,
} from './transactionsSlice';

const draft = {
  valor: 42,
  tipo: 'transferencia' as const,
  categoria: 'lazer',
  descricao: 'Novo lançamento',
  data: '2026-03-21',
};

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

const ids = (state: RootState) => state.transactions.ids;

describe('paginação', () => {
  it('carrega a primeira página e informa se há mais', async () => {
    const { store, seed } = createTestStore({ pageSize: 3 });
    await seed(7);

    await store.dispatch(fetchFirstPage({ mode: 'initial' }));

    const { transactions } = store.getState();
    expect(transactions.ids).toHaveLength(3);
    expect(transactions.hasMore).toBe(true);
    expect(transactions.status).toBe('idle');
    expect(transactions.entities[transactions.ids[0]]?.descricao).toBe('Transação 7');
  });

  it('acrescenta as próximas páginas até acabar', async () => {
    const { store, seed } = createTestStore({ pageSize: 3 });
    await seed(7);

    await store.dispatch(fetchFirstPage({ mode: 'initial' }));
    await store.dispatch(fetchNextPage());
    await store.dispatch(fetchNextPage());

    expect(ids(store.getState())).toHaveLength(7);
    expect(store.getState().transactions.hasMore).toBe(false);

    await store.dispatch(fetchNextPage());
    expect(ids(store.getState())).toHaveLength(7);
  });

  it('não dispara duas buscas de próxima página ao mesmo tempo', async () => {
    const { store, seed, transactionRepository } = createTestStore({ pageSize: 3 });
    await seed(9);
    await store.dispatch(fetchFirstPage({ mode: 'initial' }));
    const callsBefore = transactionRepository.listPageCalls;

    await Promise.all([store.dispatch(fetchNextPage()), store.dispatch(fetchNextPage())]);

    expect(transactionRepository.listPageCalls - callsBefore).toBe(1);
  });

  it('registra erro de carregamento sem perder o estado', async () => {
    const { store, transactionRepository } = createTestStore();
    transactionRepository.listPage = async () => {
      throw new Error('falha de rede');
    };

    await store.dispatch(fetchFirstPage({ mode: 'initial' }));

    expect(store.getState().transactions.error).toMatch(/Não foi possível carregar/);
    expect(store.getState().transactions.status).toBe('idle');
  });
});

describe('corridas de requisição', () => {
  it('uma resposta antiga não sobrescreve a mais recente (latest wins)', async () => {
    const { store, seed, transactionRepository } = createTestStore({ pageSize: 10 });
    await seed(2);
    await seed(2, { tipo: 'deposito', categoria: 'salario', descricao: 'Receita' });

    const slow = deferred<TransactionPage>();
    const original = transactionRepository.listPage.bind(transactionRepository);
    let call = 0;
    transactionRepository.listPage = async (uid: string, params: ListPageParams) => {
      call += 1;
      return call === 1 ? slow.promise : original(uid, params);
    };

    const first = store.dispatch(fetchFirstPage({ mode: 'initial' }));
    const second = store.dispatch(applyFilters({ tipo: 'deposito' }));
    await second;
    slow.resolve({ items: [], nextCursor: null });
    await first;

    const { transactions } = store.getState();
    expect(transactions.ids).toHaveLength(2);
    expect(Object.values(transactions.entities).every((t) => t?.tipo === 'deposito')).toBe(true);
  });

  it('a próxima página de uma consulta antiga é descartada quando os filtros mudam', async () => {
    const { store, seed, transactionRepository } = createTestStore({ pageSize: 2 });
    await seed(6);
    await store.dispatch(fetchFirstPage({ mode: 'initial' }));

    const slow = deferred<TransactionPage>();
    const original = transactionRepository.listPage.bind(transactionRepository);
    let intercept = true;
    transactionRepository.listPage = async (uid: string, params: ListPageParams) => {
      if (intercept && params.cursor !== null) {
        intercept = false;
        return slow.promise;
      }
      return original(uid, params);
    };

    const nextPage = store.dispatch(fetchNextPage());
    await store.dispatch(applyFilters({ tipo: 'deposito' }));
    slow.resolve({ items: [{ ...sampleInput, id: 'fantasma', criadoEm: 1 }], nextCursor: null });
    await nextPage;

    expect(store.getState().transactions.entities['fantasma']).toBeUndefined();
  });
});

describe('mutações', () => {
  it('addTransaction persiste e atualiza a lista (o novo item aparece primeiro)', async () => {
    const { store, seed } = createTestStore({ pageSize: 5 });
    await seed(2);
    await store.dispatch(fetchFirstPage({ mode: 'initial' }));

    const result = await store.dispatch(addTransaction(draft));
    await store.dispatch(fetchFirstPage({ mode: 'refresh' }));

    expect(result.type).toBe('transactions/add/fulfilled');
    const { transactions } = store.getState();
    expect(transactions.ids).toHaveLength(3);
    expect(transactions.entities[transactions.ids[0]]?.descricao).toBe('Novo lançamento');
  });

  it('addTransaction rejeita dados inválidos sem chamar o repositório', async () => {
    const { store, transactionRepository } = createTestStore();

    const result = await store.dispatch(addTransaction({ ...draft, valor: 0 }));

    expect(result.type).toBe('transactions/add/rejected');
    expect(result.payload).toBe('Informe um valor numérico maior que zero.');
    expect(transactionRepository.addCalls).toBe(0);
  });

  it('updateTransaction altera o item e removeTransaction o exclui', async () => {
    const { store, seed } = createTestStore({ pageSize: 5 });
    await seed(2);
    await store.dispatch(fetchFirstPage({ mode: 'initial' }));
    const [firstId] = store.getState().transactions.ids as string[];

    await store.dispatch(updateTransaction({ id: firstId, draft: { ...draft, descricao: 'Editada' } }));
    await store.dispatch(fetchFirstPage({ mode: 'refresh' }));
    expect(store.getState().transactions.entities[firstId]?.descricao).toBe('Editada');

    await store.dispatch(removeTransaction(firstId));
    await store.dispatch(fetchFirstPage({ mode: 'refresh' }));
    expect(store.getState().transactions.entities[firstId]).toBeUndefined();
  });

  it('exige usuário autenticado', async () => {
    const { store } = createTestStore({ signedIn: false });
    const result = await store.dispatch(addTransaction(draft));
    expect(result.payload).toBe('Usuário não autenticado.');
  });
});

describe('filtros, busca e resumo', () => {
  it('applyFilters guarda os filtros e recarrega a lista filtrada no servidor', async () => {
    const { store, seed } = createTestStore({ pageSize: 10 });
    await seed(3);
    await seed(2, { tipo: 'deposito', categoria: 'salario' });

    await store.dispatch(applyFilters({ tipo: 'deposito' }));

    expect(store.getState().transactions.filters).toEqual({ tipo: 'deposito' });
    expect(store.getState().transactions.ids).toHaveLength(2);
  });

  it('rejeita filtro com intervalo de datas inválido', async () => {
    const { store } = createTestStore();

    await store.dispatch(applyFilters({ dataInicio: '2026-05-01', dataFim: '2026-01-01' }));

    expect(store.getState().transactions.error).toMatch(/data final/);
  });

  it('selectVisibleTransactions aplica a busca em memória (sem novas requisições)', async () => {
    const { store, seed, transactionRepository } = createTestStore({ pageSize: 10 });
    await seed(1, { descricao: 'Supermercado' });
    await seed(1, { descricao: 'Uber' });
    await store.dispatch(fetchFirstPage({ mode: 'initial' }));
    const callsBefore = transactionRepository.listPageCalls;

    store.dispatch(searchChanged('super'));

    expect(selectVisibleTransactions(store.getState()).map((t) => t.descricao)).toEqual(['Supermercado']);
    expect(transactionRepository.listPageCalls).toBe(callsBefore);
  });

  it('selectors memoizados devolvem a mesma referência enquanto nada muda', async () => {
    const { store, seed } = createTestStore({ pageSize: 10 });
    await seed(2);
    await store.dispatch(fetchFirstPage({ mode: 'initial' }));

    const first = selectVisibleTransactions(store.getState());
    const second = selectVisibleTransactions(store.getState());

    expect(second).toBe(first);
  });

  it('selectSummary calcula o saldo a partir do stream em tempo real', () => {
    const { store } = createTestStore();

    store.dispatch(
      recentReceived([
        { ...sampleInput, id: 'a', valor: 100, tipo: 'deposito', categoria: 'salario', criadoEm: 1 },
        { ...sampleInput, id: 'b', valor: 30, criadoEm: 2 },
      ])
    );

    expect(selectSummary(store.getState())).toMatchObject({ saldo: 70, receitas: 100, despesas: 30 });
    expect(selectTransactionById(store.getState(), 'b')?.valor).toBe(30);
    expect(selectTransactionById(store.getState(), 'inexistente')).toBeUndefined();
  });

  it('sessionReset limpa tudo (usado no logout)', async () => {
    const { store, seed } = createTestStore();
    await seed(2);
    await store.dispatch(fetchFirstPage({ mode: 'initial' }));
    store.dispatch(searchChanged('abc'));

    store.dispatch(sessionReset());

    expect(store.getState().transactions.ids).toHaveLength(0);
    expect(store.getState().transactions.search).toBe('');
  });
});
