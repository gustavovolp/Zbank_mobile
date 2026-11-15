import { Observable } from 'rxjs';
import type { Clock, LocalDataEraser } from '@/core/domain/ports';
import type { EncryptedCache } from '@/core/infrastructure/cache/EncryptedCache';
import type { ListPageParams, Transaction, TransactionInput, TransactionPage } from '../domain/entities';
import type { ListPageOptions, TransactionRepository } from '../domain/TransactionRepository';

export interface CacheOptions {
  pageTtlMs: number;
  recentMaxAgeMs: number;
}

const DEFAULT_OPTIONS: CacheOptions = {
  pageTtlMs: 60_000,
  recentMaxAgeMs: 7 * 24 * 60 * 60 * 1000,
};

interface PageEntry {
  page: TransactionPage;
  storedAt: number;
}

export class CachedTransactionRepository implements TransactionRepository, LocalDataEraser {
  private readonly pages = new Map<string, PageEntry>();
  private readonly generations = new Map<string, number>();
  private readonly options: CacheOptions;

  constructor(
    private readonly inner: TransactionRepository,
    private readonly cache: EncryptedCache,
    private readonly clock: Clock,
    options: Partial<CacheOptions> = {}
  ) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  private pageKey(uid: string, params: ListPageParams): string {
    const { tipo, categoria, dataInicio, dataFim } = params.filters;
    return `${uid}|${params.pageSize}|${tipo ?? ''}|${categoria ?? ''}|${dataInicio ?? ''}|${dataFim ?? ''}`;
  }

  private generation(uid: string): number {
    return this.generations.get(uid) ?? 0;
  }

  private invalidate(uid: string): void {
    this.generations.set(uid, this.generation(uid) + 1);
    for (const key of this.pages.keys()) {
      if (key.startsWith(`${uid}|`)) this.pages.delete(key);
    }
  }

  async listPage(uid: string, params: ListPageParams, options?: ListPageOptions): Promise<TransactionPage> {
    const cacheable = params.cursor === null;
    const key = this.pageKey(uid, params);
    const now = this.clock.now().getTime();

    if (cacheable && !options?.force) {
      const entry = this.pages.get(key);
      if (entry && now - entry.storedAt < this.options.pageTtlMs) return entry.page;
    }

    const generationAtStart = this.generation(uid);
    const page = await this.inner.listPage(uid, params, options);

    if (cacheable && generationAtStart === this.generation(uid)) {
      this.pages.set(key, { page, storedAt: this.clock.now().getTime() });
    }
    return page;
  }

  observeRecent(uid: string, max: number): Observable<Transaction[]> {
    const cacheKey = `recent.${uid}`;

    return new Observable<Transaction[]>((subscriber) => {
      let closed = false;
      let liveReceived = false;

      this.cache
        .get<Transaction[]>(cacheKey, this.options.recentMaxAgeMs)
        .then((cached) => {
          if (!closed && !liveReceived && cached) subscriber.next(cached);
        })
        .catch(() => undefined);

      const subscription = this.inner.observeRecent(uid, max).subscribe({
        next: (items) => {
          liveReceived = true;
          subscriber.next(items);
          this.cache.set(cacheKey, items).catch(() => undefined);
        },
        error: (error) => subscriber.error(error),
        complete: () => subscriber.complete(),
      });

      return () => {
        closed = true;
        subscription.unsubscribe();
      };
    });
  }

  async add(uid: string, input: TransactionInput, createdAt?: number): Promise<Transaction> {
    try {
      return await this.inner.add(uid, input, createdAt);
    } finally {
      this.invalidate(uid);
    }
  }

  async update(uid: string, id: string, input: TransactionInput): Promise<void> {
    try {
      await this.inner.update(uid, id, input);
    } finally {
      this.invalidate(uid);
    }
  }

  async remove(uid: string, id: string): Promise<void> {
    try {
      await this.inner.remove(uid, id);
    } finally {
      this.invalidate(uid);
    }
  }

  async eraseAll(): Promise<void> {
    this.pages.clear();
    this.generations.clear();
    await this.cache.clearAll();
  }
}
