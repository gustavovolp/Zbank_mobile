import type { Observable } from 'rxjs';
import type { Transaction } from '../entities';
import type { TransactionRepository } from '../TransactionRepository';

export const MAX_RECENT_TRANSACTIONS = 500;

export class ObserveRecentTransactions {
  constructor(private readonly repository: TransactionRepository) {}

  execute(uid: string, max: number): Observable<Transaction[]> {
    const limit = Math.min(Math.max(Math.trunc(max) || 1, 1), MAX_RECENT_TRANSACTIONS);
    return this.repository.observeRecent(uid, limit);
  }
}
