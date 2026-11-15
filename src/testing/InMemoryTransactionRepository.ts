import { Observable, Subject } from 'rxjs';
import type {
  ListPageParams,
  Transaction,
  TransactionInput,
  TransactionPage,
} from '@/modules/transactions/domain/entities';
import type { TransactionRepository } from '@/modules/transactions/domain/TransactionRepository';

export class InMemoryTransactionRepository implements TransactionRepository {
  listPageCalls = 0;
  addCalls = 0;

  private readonly data = new Map<string, Transaction[]>();
  private readonly changes = new Subject<string>();
  private sequence = 0;

  private all(uid: string): Transaction[] {
    return this.data.get(uid) ?? [];
  }

  private sorted(uid: string): Transaction[] {
    return [...this.all(uid)].sort((a, b) => b.criadoEm - a.criadoEm);
  }

  seed(uid: string, transactions: Transaction[]): void {
    this.data.set(uid, [...transactions]);
    this.changes.next(uid);
  }

  async listPage(uid: string, params: ListPageParams): Promise<TransactionPage> {
    this.listPageCalls += 1;
    const { tipo, categoria, dataInicio, dataFim } = params.filters;

    const filtered = this.sorted(uid).filter(
      (t) =>
        (!tipo || t.tipo === tipo) &&
        (!categoria || t.categoria === categoria) &&
        (!dataInicio || t.data >= dataInicio) &&
        (!dataFim || t.data <= dataFim)
    );

    const start = params.cursor ? filtered.findIndex((t) => t.id === params.cursor) + 1 : 0;
    const items = filtered.slice(start, start + params.pageSize);
    const nextCursor = items.length === params.pageSize ? items[items.length - 1].id : null;

    return { items, nextCursor };
  }

  observeRecent(uid: string, max: number): Observable<Transaction[]> {
    return new Observable((subscriber) => {
      const emit = () => subscriber.next(this.sorted(uid).slice(0, max));
      emit();
      const subscription = this.changes.subscribe((changedUid) => {
        if (changedUid === uid) emit();
      });
      return () => subscription.unsubscribe();
    });
  }

  async add(uid: string, input: TransactionInput, createdAt: number = Date.now()): Promise<Transaction> {
    this.addCalls += 1;
    this.sequence += 1;
    const transaction: Transaction = { ...input, id: `t${this.sequence}`, criadoEm: createdAt };
    this.data.set(uid, [...this.all(uid), transaction]);
    this.changes.next(uid);
    return transaction;
  }

  async update(uid: string, id: string, input: TransactionInput): Promise<void> {
    const current = this.all(uid);
    const index = current.findIndex((t) => t.id === id);
    if (index < 0) throw new Error('not-found');
    const next = [...current];
    next[index] = { ...input, id, criadoEm: current[index].criadoEm };
    this.data.set(uid, next);
    this.changes.next(uid);
  }

  async remove(uid: string, id: string): Promise<void> {
    this.data.set(
      uid,
      this.all(uid).filter((t) => t.id !== id)
    );
    this.changes.next(uid);
  }
}
