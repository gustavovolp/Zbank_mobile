import { createAsyncThunk } from '@reduxjs/toolkit';
import type { AppDependencies, RootState } from './registry';

export const createAppAsyncThunk = createAsyncThunk.withTypes<{
  state: RootState;
  extra: AppDependencies;
  rejectValue: string;
}>();
