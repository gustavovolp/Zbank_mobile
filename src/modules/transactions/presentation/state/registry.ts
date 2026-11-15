import type { AddTransaction } from '../../domain/usecases/AddTransaction';
import type { DeleteTransaction } from '../../domain/usecases/DeleteTransaction';
import type { ListTransactionsPage } from '../../domain/usecases/ListTransactionsPage';
import type { ObserveRecentTransactions } from '../../domain/usecases/ObserveRecentTransactions';
import type { UpdateTransaction } from '../../domain/usecases/UpdateTransaction';
import type { TransactionsState } from './transactionsSlice';

export interface TransactionsDependencies {
  transactions: {
    list: ListTransactionsPage;
    observeRecent: ObserveRecentTransactions;
    add: AddTransaction;
    update: UpdateTransaction;
    remove: DeleteTransaction;
  };
  transactionsConfig: {
    pageSize: number;
    recentLimit: number;
  };
}

declare module '@/core/presentation/store/registry' {
  interface StateRegistry {
    transactions: TransactionsState;
  }

  interface DependenciesRegistry extends TransactionsDependencies {}
}
