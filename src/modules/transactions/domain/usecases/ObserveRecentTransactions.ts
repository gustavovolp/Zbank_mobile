import type { Observable } from 'rxjs';
import type { Transaction } from '../entities';
import type { TransactionRepository } from '../TransactionRepository';

export class ObserveRecentTransactions {
  constructor(private readonly repository: TransactionRepository) {}

  execute(uid: string, max: number): Observable<Transaction[]> {
    return this.repository.observeRecent(uid, max);
  }
}
