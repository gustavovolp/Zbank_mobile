import { systemClock } from '@/core/domain/ports';
import { SecureLocalCache } from '@/core/infrastructure/cache/EncryptedCache';
import { auth, db } from '@/core/infrastructure/firebase/firebaseClient';
import { createEncryptorProvider } from '@/core/infrastructure/security/encryption';
import {
  localStorageBackend,
  randomBytes,
  secureStorage,
} from '@/core/infrastructure/security/platformStorage';
import { LoginUser } from '@/modules/auth/domain/usecases/LoginUser';
import { LogoutUser } from '@/modules/auth/domain/usecases/LogoutUser';
import { ObserveAuthState } from '@/modules/auth/domain/usecases/ObserveAuthState';
import { RegisterUser } from '@/modules/auth/domain/usecases/RegisterUser';
import { FirebaseAuthRepository } from '@/modules/auth/infrastructure/FirebaseAuthRepository';
import { AddTransaction } from '@/modules/transactions/domain/usecases/AddTransaction';
import { DeleteTransaction } from '@/modules/transactions/domain/usecases/DeleteTransaction';
import { ListTransactionsPage } from '@/modules/transactions/domain/usecases/ListTransactionsPage';
import { ObserveRecentTransactions } from '@/modules/transactions/domain/usecases/ObserveRecentTransactions';
import { SeedDemoTransactions } from '@/modules/transactions/domain/usecases/SeedDemoTransactions';
import { UpdateTransaction } from '@/modules/transactions/domain/usecases/UpdateTransaction';
import { CachedTransactionRepository } from '@/modules/transactions/infrastructure/CachedTransactionRepository';
import { FirestoreTransactionRepository } from '@/modules/transactions/infrastructure/FirestoreTransactionRepository';
import type { AppDependencies } from './dependencies';

const encryptedCache = new SecureLocalCache(
  localStorageBackend,
  createEncryptorProvider(secureStorage, randomBytes),
  systemClock
);

const authRepository = new FirebaseAuthRepository(auth);
const transactionRepository = new CachedTransactionRepository(
  new FirestoreTransactionRepository(db),
  encryptedCache,
  systemClock
);

const seedDemoTransactions = new SeedDemoTransactions(transactionRepository, systemClock);

export const container: AppDependencies = {
  auth: {
    observeAuthState: new ObserveAuthState(authRepository),
    login: new LoginUser(authRepository),
    register: new RegisterUser(authRepository, {
      initialize: (uid) => seedDemoTransactions.execute(uid),
    }),
    logout: new LogoutUser(authRepository, transactionRepository),
  },
  transactions: {
    list: new ListTransactionsPage(transactionRepository),
    observeRecent: new ObserveRecentTransactions(transactionRepository),
    add: new AddTransaction(transactionRepository),
    update: new UpdateTransaction(transactionRepository),
    remove: new DeleteTransaction(transactionRepository),
  },
  config: {
    pageSize: 15,
    recentLimit: 300,
  },
};
