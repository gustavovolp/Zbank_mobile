import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@/core/presentation/store/registry';
import { calculateSummary, searchTransactions } from '../../domain/summary';
import { transactionsAdapter } from './transactionsSlice';

const entitySelectors = transactionsAdapter.getSelectors((state: RootState) => state.transactions);

const selectSearch = (state: RootState) => state.transactions.search;
const selectRecent = (state: RootState) => state.transactions.recent;

export const selectVisibleTransactions = createSelector(
  [entitySelectors.selectAll, selectSearch],
  (transactions, search) => searchTransactions(transactions, search)
);

export const selectSummary = createSelector([selectRecent], (recent) => calculateSummary(recent));

export function selectTransactionById(state: RootState, id: string | undefined) {
  if (!id) return undefined;
  return entitySelectors.selectById(state, id) ?? state.transactions.recent.find((transaction) => transaction.id === id);
}
