import { Subject, Subscription, debounceTime } from 'rxjs';
import type { AppDependencies, AppDispatch } from '@/core/presentation/store/registry';
import { getErrorMessage } from '@/core/presentation/errorMessage';
import {
  fetchFirstPage,
  recentFailed,
  recentReceived,
  recentStarted,
  sessionReset,
  syncList,
} from '@/modules/transactions';

export interface SessionOptions {
  syncDebounceMs?: number;
}

export function startUserSession(
  uid: string,
  dispatch: AppDispatch,
  dependencies: AppDependencies,
  { syncDebounceMs = 400 }: SessionOptions = {}
): () => void {
  const subscriptions = new Subscription();
  const changes$ = new Subject<void>();

  dispatch(recentStarted());

  subscriptions.add(
    changes$.pipe(debounceTime(syncDebounceMs)).subscribe(() => {
      void dispatch(syncList());
    })
  );

  subscriptions.add(
    dependencies.transactions.observeRecent.execute(uid, dependencies.transactionsConfig.recentLimit).subscribe({
      next: (transactions) => {
        dispatch(recentReceived(transactions));
        changes$.next();
      },
      error: (error) =>
        dispatch(recentFailed(getErrorMessage(error, 'Não foi possível sincronizar as transações em tempo real.'))),
    })
  );

  void dispatch(fetchFirstPage({ mode: 'initial' }));

  return () => {
    subscriptions.unsubscribe();
    dispatch(sessionReset());
  };
}
