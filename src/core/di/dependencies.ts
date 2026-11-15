import type { LoginUser } from '@/modules/auth/domain/usecases/LoginUser';
import type { LogoutUser } from '@/modules/auth/domain/usecases/LogoutUser';
import type { ObserveAuthState } from '@/modules/auth/domain/usecases/ObserveAuthState';
import type { RegisterUser } from '@/modules/auth/domain/usecases/RegisterUser';
import type { AddTransaction } from '@/modules/transactions/domain/usecases/AddTransaction';
import type { DeleteTransaction } from '@/modules/transactions/domain/usecases/DeleteTransaction';
import type { ListTransactionsPage } from '@/modules/transactions/domain/usecases/ListTransactionsPage';
import type { ObserveRecentTransactions } from '@/modules/transactions/domain/usecases/ObserveRecentTransactions';
import type { UpdateTransaction } from '@/modules/transactions/domain/usecases/UpdateTransaction';

export interface AppDependencies {
  auth: {
    observeAuthState: ObserveAuthState;
    login: LoginUser;
    register: RegisterUser;
    logout: LogoutUser;
  };
  transactions: {
    list: ListTransactionsPage;
    observeRecent: ObserveRecentTransactions;
    add: AddTransaction;
    update: UpdateTransaction;
    remove: DeleteTransaction;
  };
  config: {
    pageSize: number;
    recentLimit: number;
  };
}
