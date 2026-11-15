import { Observable, Subject } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { SecureLocalCache } from '@/core/infrastructure/cache/EncryptedCache';
import { KEY_LENGTH, createAesGcmEncryptor, type RandomBytes } from '@/core/infrastructure/security/encryption';
import { InMemoryTransactionRepository } from '@/testing/InMemoryTransactionRepository';
import { MemoryKeyValueStore } from '@/testing/MemoryKeyValueStore';
import type { ListPageParams, Transaction, TransactionInput } from '../domain/entities';
import type { TransactionRepository } from '../domain/TransactionRepository';
import { CachedTransactionRepository } from './CachedTransactionRepository';

const randomBytes: RandomBytes = (length) => globalThis.crypto.getRandomValues(new Uint8Array(length));

const input: TransactionInput = {
  valor: 10,
  tipo: 'transferencia',
  data: '2026-03-20',
  descricao: 'Teste',
  categoria: 'lazer',
};

const params = (overrides: Partial<ListPageParams> = {}): ListPageParams => ({
  filters: {},
  cursor: null,
  pageSize: 10,
  ...overrides,
});

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

function setup(options?: { pageTtlMs?: number; recentMaxAgeMs?: number }) {
  const storage = new MemoryKeyValueStore();
  const encryptor = createAesGcmEncryptor(randomBytes(KEY_LENGTH), randomBytes);
  const time = { value: 1_000_000 };
  const clock = { now: () => new Date(time.value) };
  const cache = new SecureLocalCache(storage, async () => encryptor, clock);
  const inner = new InMemoryTransactionRepository();
  const repository = new CachedTransactionRepository(inner, cache, clock, options);
  return { repository, inner, cache, storage, time, clock };
}

describe('CachedTransactionRepository.listPage', () => {
  it('reaproveita a primeira página dentro do TTL (evita requisição repetida)', async () => {
    const { repository, inner } = setup();
    await inner.add('u1', input);

    await repository.listPage('u1', params());
    await repository.listPage('u1', params());

    expect(inner.listPageCalls).toBe(1);
  });

  it('não compartilha cache entre filtros diferentes nem entre usuários', async () => {
    const { repository, inner } = setup();

    await repository.listPage('u1', params());
    await repository.listPage('u1', params({ filters: { tipo: 'deposito' } }));
    await repository.listPage('u2', params());

    expect(inner.listPageCalls).toBe(3);
  });

  it('busca de novo depois que o TTL expira', async () => {
    const { repository, inner, time } = setup({ pageTtlMs: 1_000 });

    await repository.listPage('u1', params());
    time.value += 2_000;
    await repository.listPage('u1', params());

    expect(inner.listPageCalls).toBe(2);
  });

  it('ignora o cache com force (pull-to-refresh)', async () => {
    const { repository, inner } = setup();

    await repository.listPage('u1', params());
    await repository.listPage('u1', params(), { force: true });

    expect(inner.listPageCalls).toBe(2);
  });

  it('não faz cache de páginas seguintes (com cursor)', async () => {
    const { repository, inner } = setup();

    await repository.listPage('u1', params({ cursor: 'abc' }));
    await repository.listPage('u1', params({ cursor: 'abc' }));

    expect(inner.listPageCalls).toBe(2);
  });

  it.each([
    ['add', (r: CachedTransactionRepository) => r.add('u1', input)],
    ['update', async (r: CachedTransactionRepository) => r.update('u1', 't1', input)],
    ['remove', (r: CachedTransactionRepository) => r.remove('u1', 't1')],
  ])('invalida o cache após %s', async (_name, mutate) => {
    const { repository, inner } = setup();
    await inner.add('u1', input);
    await repository.listPage('u1', params());

    await mutate(repository);
    await repository.listPage('u1', params());

    expect(inner.listPageCalls).toBe(2);
  });

  it('não guarda resposta que começou antes de uma mutação (evita dado velho)', async () => {
    const { repository, inner } = setup();
    let release: () => void = () => undefined;
    const original = inner.listPage.bind(inner);
    inner.listPage = async (uid, listParams) => {
      const page = await original(uid, listParams);
      await new Promise<void>((resolve) => {
        release = resolve;
      });
      return page;
    };

    const slow = repository.listPage('u1', params());
    await flush();
    await repository.add('u1', input);
    release();
    await slow;

    inner.listPage = original;
    await repository.listPage('u1', params());

    expect(inner.listPageCalls).toBe(2);
  });
});

describe('CachedTransactionRepository.observeRecent', () => {
  function stubInner() {
    const live = new Subject<Transaction[]>();
    const inner = {
      observeRecent: () => live as Observable<Transaction[]>,
    } as unknown as TransactionRepository;
    return { live, inner };
  }

  const tx = (id: string): Transaction => ({ ...input, id, criadoEm: 1 });

  it('na partida a frio emite o snapshot em cache antes do dado ao vivo (stale-while-revalidate)', async () => {
    const { cache, clock } = setup();
    const first = stubInner();
    const sessionOne = new CachedTransactionRepository(first.inner, cache, clock);
    const stop = sessionOne.observeRecent('u1', 300).subscribe();
    first.live.next([tx('a')]);
    await flush();
    stop.unsubscribe();

    const second = stubInner();
    const sessionTwo = new CachedTransactionRepository(second.inner, cache, clock);
    const emissions: string[][] = [];
    sessionTwo.observeRecent('u1', 300).subscribe((items) => emissions.push(items.map((t) => t.id)));
    await flush();
    second.live.next([tx('a'), tx('b')]);

    expect(emissions).toEqual([['a'], ['a', 'b']]);
  });

  it('ignora o cache se o dado ao vivo chegar primeiro', async () => {
    const { cache, clock } = setup();
    await cache.set('recent.u1', [tx('velho')]);
    const { live, inner } = stubInner();
    const repository = new CachedTransactionRepository(inner, cache, clock);
    const emissions: string[][] = [];

    repository.observeRecent('u1', 300).subscribe((items) => emissions.push(items.map((t) => t.id)));
    live.next([tx('novo')]);
    await flush();

    expect(emissions).toEqual([['novo']]);
  });

  it('não usa cache mais velho que o limite configurado', async () => {
    const { cache, clock, time } = setup();
    await cache.set('recent.u1', [tx('velho')]);
    time.value += 10_000;
    const { inner } = stubInner();
    const repository = new CachedTransactionRepository(inner, cache, clock, { recentMaxAgeMs: 5_000 });
    const emissions: string[][] = [];

    repository.observeRecent('u1', 300).subscribe((items) => emissions.push(items.map((t) => t.id)));
    await flush();

    expect(emissions).toEqual([]);
  });

  it('isola o cache por usuário', async () => {
    const { cache, clock } = setup();
    await cache.set('recent.u1', [tx('do-u1')]);
    const { inner } = stubInner();
    const repository = new CachedTransactionRepository(inner, cache, clock);
    const emissions: string[][] = [];

    repository.observeRecent('u2', 300).subscribe((items) => emissions.push(items.map((t) => t.id)));
    await flush();

    expect(emissions).toEqual([]);
  });

  it('eraseAll apaga o cache persistido e o de páginas (logout)', async () => {
    const { repository, inner, cache, storage } = setup();
    await inner.add('u1', input);
    await cache.set('recent.u1', [tx('a')]);
    await repository.listPage('u1', params());

    await repository.eraseAll();
    await repository.listPage('u1', params());

    expect(inner.listPageCalls).toBe(2);
    expect(storage.data.size).toBe(0);
  });
});
