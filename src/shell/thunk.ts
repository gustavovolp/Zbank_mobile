import { createAsyncThunk } from '@reduxjs/toolkit';
import type { AppDependencies } from '@/core/di/dependencies';
import type { AuthState } from '@/modules/auth/presentation/state/authSlice';
import type { TransactionsState } from '@/modules/transactions/presentation/state/transactionsSlice';

export interface ThunkState {
  auth: AuthState;
  transactions: TransactionsState;
}

export const createAppAsyncThunk = createAsyncThunk.withTypes<{
  state: ThunkState;
  extra: AppDependencies;
  rejectValue: string;
}>();
