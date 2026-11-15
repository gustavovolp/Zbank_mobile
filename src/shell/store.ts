import { configureStore } from '@reduxjs/toolkit';
import type { AppDependencies } from '@/core/di/dependencies';
import { rootReducer } from './rootReducer';

export function createAppStore(dependencies: AppDependencies) {
  return configureStore({
    reducer: rootReducer,
    middleware: (getDefaultMiddleware) => getDefaultMiddleware({ thunk: { extraArgument: dependencies } }),
  });
}

export type AppStore = ReturnType<typeof createAppStore>;
export type AppDispatch = AppStore['dispatch'];
