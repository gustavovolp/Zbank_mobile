import { combineReducers, type Reducer } from '@reduxjs/toolkit';
import type { RootState } from '@/core/presentation/store/registry';
import { authReducer } from '@/modules/auth';
import { transactionsReducer } from '@/modules/transactions';

export const rootReducer: Reducer<RootState> = combineReducers({
  auth: authReducer,
  transactions: transactionsReducer,
});
