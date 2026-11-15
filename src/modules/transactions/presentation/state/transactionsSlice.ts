import { createEntityAdapter, createSlice, type EntityState, type PayloadAction } from '@reduxjs/toolkit';
import { createAppAsyncThunk } from '@/core/presentation/store/thunk';
import { getErrorMessage } from '@/core/presentation/errorMessage';
import type { Transaction, TransactionFilters } from '../../domain/entities';
import type { TransactionDraft } from '../../domain/validation';

export const transactionsAdapter = createEntityAdapter<Transaction>();

export type ListStatus = 'idle' | 'loading' | 'refreshing' | 'loadingMore';
export type RecentStatus = 'loading' | 'ready' | 'error';

export interface TransactionsState extends EntityState<Transaction, string> {
  status: ListStatus;
  hasMore: boolean;
  nextCursor: string | null;
  error: string | null;
  filters: TransactionFilters;
  search: string;
  activeRequestId: string | null;
  version: number;
  recent: Transaction[];
  recentStatus: RecentStatus;
  recentError: string | null;
}

const initialState: TransactionsState = transactionsAdapter.getInitialState({
  status: 'idle' as ListStatus,
  hasMore: true,
  nextCursor: null as string | null,
  error: null as string | null,
  filters: {} as TransactionFilters,
  search: '',
  activeRequestId: null as string | null,
  version: 0,
  recent: [] as Transaction[],
  recentStatus: 'loading' as RecentStatus,
  recentError: null as string | null,
});

export interface FetchFirstPageArg {
  mode?: 'initial' | 'refresh';
}

export const fetchFirstPage = createAppAsyncThunk(
  'transactions/fetchFirstPage',
  async (arg: FetchFirstPageArg | undefined, { getState, extra, rejectWithValue }) => {
    const { auth, transactions } = getState();
    if (!auth.user) return rejectWithValue('Usuário não autenticado.');

    try {
      return await extra.transactions.list.execute(
        auth.user.uid,
        { filters: transactions.filters, cursor: null, pageSize: extra.transactionsConfig.pageSize },
        { force: arg?.mode === 'refresh' }
      );
    } catch (error) {
      return rejectWithValue(
        getErrorMessage(error, 'Não foi possível carregar as transações. Verifique sua conexão e tente novamente.')
      );
    }
  }
);

export const fetchNextPage = createAppAsyncThunk(
  'transactions/fetchNextPage',
  async (_: void, { getState, extra, rejectWithValue }) => {
    const { auth, transactions } = getState();
    if (!auth.user) return rejectWithValue('Usuário não autenticado.');

    try {
      const page = await extra.transactions.list.execute(auth.user.uid, {
        filters: transactions.filters,
        cursor: transactions.nextCursor,
        pageSize: extra.transactionsConfig.pageSize,
      });
      return { page, version: transactions.version };
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, 'Não foi possível carregar mais transações.'));
    }
  },
  {
    condition: (_, { getState }) => {
      const { transactions } = getState();
      return transactions.status === 'idle' && transactions.hasMore && transactions.nextCursor !== null;
    },
  }
);

const signature = (transaction: Transaction) =>
  `${transaction.id}|${transaction.valor}|${transaction.tipo}|${transaction.categoria}|${transaction.data}|${transaction.descricao}`;

export const syncList = createAppAsyncThunk('transactions/sync', async (_: void, { getState, dispatch, extra }) => {
  const { transactions } = getState();
  if (transactions.status !== 'idle') return;

  const { tipo, categoria, dataInicio, dataFim } = transactions.filters;
  const hasFilters = Boolean(tipo || categoria || dataInicio || dataFim);

  if (!hasFilters) {
    const pageSize = extra.transactionsConfig.pageSize;
    const fromStream = transactions.recent.slice(0, pageSize).map(signature);
    const fromList = (transactions.ids as string[])
      .slice(0, pageSize)
      .map((id) => signature(transactions.entities[id] as Transaction));
    const inSync = fromStream.length === fromList.length && fromStream.every((item, index) => item === fromList[index]);
    if (inSync) return;
  }

  await dispatch(fetchFirstPage({ mode: 'refresh' }));
});

export const applyFilters = createAppAsyncThunk(
  'transactions/applyFilters',
  async (filters: TransactionFilters, { dispatch }) => {
    dispatch(transactionsSlice.actions.filtersChanged(filters));
    await dispatch(fetchFirstPage({ mode: 'initial' }));
  }
);

export const addTransaction = createAppAsyncThunk(
  'transactions/add',
  async (draft: TransactionDraft, { getState, extra, dispatch, rejectWithValue }) => {
    const { user } = getState().auth;
    if (!user) return rejectWithValue('Usuário não autenticado.');

    try {
      const created = await extra.transactions.add.execute(user.uid, draft);
      void dispatch(fetchFirstPage({ mode: 'refresh' }));
      return created;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const updateTransaction = createAppAsyncThunk(
  'transactions/update',
  async (arg: { id: string; draft: TransactionDraft }, { getState, extra, dispatch, rejectWithValue }) => {
    const { user } = getState().auth;
    if (!user) return rejectWithValue('Usuário não autenticado.');

    try {
      await extra.transactions.update.execute(user.uid, arg.id, arg.draft);
      void dispatch(fetchFirstPage({ mode: 'refresh' }));
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const removeTransaction = createAppAsyncThunk(
  'transactions/remove',
  async (id: string, { getState, extra, dispatch, rejectWithValue }) => {
    const { user } = getState().auth;
    if (!user) return rejectWithValue('Usuário não autenticado.');

    try {
      await extra.transactions.remove.execute(user.uid, id);
      void dispatch(fetchFirstPage({ mode: 'refresh' }));
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

const transactionsSlice = createSlice({
  name: 'transactions',
  initialState,
  reducers: {
    filtersChanged(state, action: PayloadAction<TransactionFilters>) {
      state.filters = action.payload;
    },
    searchChanged(state, action: PayloadAction<string>) {
      state.search = action.payload;
    },
    recentStarted(state) {
      state.recentStatus = 'loading';
      state.recentError = null;
    },
    recentReceived(state, action: PayloadAction<Transaction[]>) {
      state.recent = action.payload;
      state.recentStatus = 'ready';
      state.recentError = null;
    },
    recentFailed(state, action: PayloadAction<string>) {
      state.recentStatus = 'error';
      state.recentError = action.payload;
    },
    sessionReset: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchFirstPage.pending, (state, action) => {
        state.activeRequestId = action.meta.requestId;
        state.status = action.meta.arg?.mode === 'refresh' ? 'refreshing' : 'loading';
        state.error = null;
        state.version += 1;
      })
      .addCase(fetchFirstPage.fulfilled, (state, action) => {
        if (state.activeRequestId !== action.meta.requestId) return;
        transactionsAdapter.setAll(state, action.payload.items);
        state.nextCursor = action.payload.nextCursor;
        state.hasMore = action.payload.nextCursor !== null;
        state.status = 'idle';
        state.activeRequestId = null;
      })
      .addCase(fetchFirstPage.rejected, (state, action) => {
        if (state.activeRequestId !== action.meta.requestId) return;
        state.status = 'idle';
        state.activeRequestId = null;
        state.error = action.payload ?? 'Não foi possível carregar as transações.';
      })
      .addCase(fetchNextPage.pending, (state) => {
        state.status = 'loadingMore';
      })
      .addCase(fetchNextPage.fulfilled, (state, action) => {
        if (action.payload.version !== state.version) return;
        transactionsAdapter.addMany(state, action.payload.page.items);
        state.nextCursor = action.payload.page.nextCursor;
        state.hasMore = action.payload.page.nextCursor !== null;
        state.status = 'idle';
      })
      .addCase(fetchNextPage.rejected, (state, action) => {
        if (state.status !== 'loadingMore') return;
        state.status = 'idle';
        state.error = action.payload ?? 'Não foi possível carregar mais transações.';
      });
  },
});

export const { filtersChanged, searchChanged, recentStarted, recentReceived, recentFailed, sessionReset } =
  transactionsSlice.actions;
export const transactionsReducer = transactionsSlice.reducer;
