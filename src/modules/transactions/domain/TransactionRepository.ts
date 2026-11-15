import type { Observable } from 'rxjs';
import type { ListPageParams, Transaction, TransactionInput, TransactionPage } from './entities';

export interface ListPageOptions {
  force?: boolean;
}

export interface TransactionRepository {
  listPage(uid: string, params: ListPageParams, options?: ListPageOptions): Promise<TransactionPage>;
  observeRecent(uid: string, max: number): Observable<Transaction[]>;
  add(uid: string, input: TransactionInput, createdAt?: number): Promise<Transaction>;
  update(uid: string, id: string, input: TransactionInput): Promise<void>;
  remove(uid: string, id: string): Promise<void>;
}
