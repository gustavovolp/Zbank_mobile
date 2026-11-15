import { combineReducers } from '@reduxjs/toolkit';
import { authReducer } from '@/modules/auth/presentation/state/authSlice';
import { transactionsReducer } from '@/modules/transactions/presentation/state/transactionsSlice';

export const rootReducer = combineReducers({
  auth: authReducer,
  transactions: transactionsReducer,
});

export type RootState = ReturnType<typeof rootReducer>;
