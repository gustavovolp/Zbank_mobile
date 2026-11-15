import { createAppStore } from '@/shell/store';
import { authStateChanged } from '@/modules/auth/presentation/state/authSlice';
import type { TransactionInput } from '@/modules/transactions/domain/entities';
import { createFakeDependencies } from './createFakeDependencies';

export const TEST_USER = { uid: 'u1', email: 'ana@zbank.com', displayName: 'Ana' };

export const sampleInput: TransactionInput = {
  valor: 10,
  tipo: 'transferencia',
  data: '2026-03-20',
  descricao: 'Transação de teste',
  categoria: 'lazer',
};

export function createTestStore(options: { pageSize?: number; signedIn?: boolean } = {}) {
  const fakes = createFakeDependencies({ pageSize: options.pageSize });
  const store = createAppStore(fakes.dependencies);

  if (options.signedIn !== false) {
    store.dispatch(authStateChanged(TEST_USER));
  }

  async function seed(count: number, overrides: Partial<TransactionInput> = {}) {
    for (let index = 0; index < count; index += 1) {
      await fakes.transactionRepository.add(
        TEST_USER.uid,
        { ...sampleInput, descricao: `Transação ${index + 1}`, ...overrides },
        1_000 + index
      );
    }
  }

  return { store, seed, ...fakes };
}
