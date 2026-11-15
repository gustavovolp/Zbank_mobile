import type { AppDependencies } from '@/core/di/dependencies';
import type { Clock } from '@/core/domain/ports';
import { LoginUser } from '@/modules/auth/domain/usecases/LoginUser';
import { LogoutUser } from '@/modules/auth/domain/usecases/LogoutUser';
import { ObserveAuthState } from '@/modules/auth/domain/usecases/ObserveAuthState';
import { RegisterUser } from '@/modules/auth/domain/usecases/RegisterUser';
import { AddTransaction } from '@/modules/transactions/domain/usecases/AddTransaction';
import { DeleteTransaction } from '@/modules/transactions/domain/usecases/DeleteTransaction';
import { ListTransactionsPage } from '@/modules/transactions/domain/usecases/ListTransactionsPage';
import { ObserveRecentTransactions } from '@/modules/transactions/domain/usecases/ObserveRecentTransactions';
import { SeedDemoTransactions } from '@/modules/transactions/domain/usecases/SeedDemoTransactions';
import { UpdateTransaction } from '@/modules/transactions/domain/usecases/UpdateTransaction';
import { FakeAuthRepository } from './FakeAuthRepository';
import { InMemoryTransactionRepository } from './InMemoryTransactionRepository';

export const FIXED_NOW = new Date('2026-03-20T12:00:00.000Z');

export function createFakeDependencies(options: { pageSize?: number; recentLimit?: number } = {}) {
  const transactionRepository = new InMemoryTransactionRepository();
  const authRepository = new FakeAuthRepository();
  const clock: Clock = { now: () => FIXED_NOW };
  const seedDemo = new SeedDemoTransactions(transactionRepository, clock);
  const eraseCalls = { count: 0 };

  const dependencies: AppDependencies = {
    auth: {
      observeAuthState: new ObserveAuthState(authRepository),
      login: new LoginUser(authRepository),
      register: new RegisterUser(authRepository, { initialize: (uid) => seedDemo.execute(uid) }),
      logout: new LogoutUser(authRepository, {
        eraseAll: async () => {
          eraseCalls.count += 1;
        },
      }),
    },
    transactions: {
      list: new ListTransactionsPage(transactionRepository),
      observeRecent: new ObserveRecentTransactions(transactionRepository),
      add: new AddTransaction(transactionRepository),
      update: new UpdateTransaction(transactionRepository),
      remove: new DeleteTransaction(transactionRepository),
    },
    transactionsConfig: {
      pageSize: options.pageSize ?? 3,
      recentLimit: options.recentLimit ?? 300,
    },
  };

  return { dependencies, transactionRepository, authRepository, eraseCalls };
}
