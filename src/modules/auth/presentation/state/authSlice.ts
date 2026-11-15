import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { createAppAsyncThunk } from '@/core/presentation/store/thunk';
import { getErrorMessage } from '@/core/presentation/errorMessage';
import type { AuthUser, RegisterData } from '../../domain/entities';

export type AuthStatus = 'initializing' | 'authenticated' | 'unauthenticated';

export interface AuthState {
  status: AuthStatus;
  user: AuthUser | null;
}

const initialState: AuthState = {
  status: 'initializing',
  user: null,
};

export const login = createAppAsyncThunk(
  'auth/login',
  async (credentials: { email: string; password: string }, { extra, rejectWithValue }) => {
    try {
      await extra.auth.login.execute(credentials.email, credentials.password);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const register = createAppAsyncThunk(
  'auth/register',
  async (data: RegisterData, { extra, rejectWithValue }) => {
    try {
      return await extra.auth.register.execute(data);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const logout = createAppAsyncThunk('auth/logout', async (_: void, { extra }) => {
  await extra.auth.logout.execute();
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    authStateChanged(state, action: PayloadAction<AuthUser | null>) {
      state.user = action.payload;
      state.status = action.payload ? 'authenticated' : 'unauthenticated';
    },
  },
  extraReducers: (builder) => {
    builder.addCase(register.fulfilled, (state, action) => {
      state.user = action.payload;
      state.status = 'authenticated';
    });
  },
});

export const { authStateChanged } = authSlice.actions;
export const authReducer = authSlice.reducer;
