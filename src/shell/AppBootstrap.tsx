import { useEffect, type ReactNode } from 'react';
import type { AppDependencies } from '@/core/di/dependencies';
import { authStateChanged } from '@/modules/auth';
import { useAppDispatch, useAppSelector } from '@/core/presentation/store/hooks';
import { startUserSession } from './session';

interface AppBootstrapProps {
  dependencies: AppDependencies;
  children: ReactNode;
}

export function AppBootstrap({ dependencies, children }: AppBootstrapProps) {
  const dispatch = useAppDispatch();
  const uid = useAppSelector((state) => state.auth.user?.uid);

  useEffect(() => {
    const subscription = dependencies.auth.observeAuthState.execute().subscribe((user) => {
      dispatch(authStateChanged(user));
    });
    return () => subscription.unsubscribe();
  }, [dependencies, dispatch]);

  useEffect(() => {
    if (!uid) return undefined;
    return startUserSession(uid, dispatch, dependencies);
  }, [uid, dependencies, dispatch]);

  return children;
}
