import { describe, expect, it } from 'vitest';
import { MemoryKeyValueStore } from '@/testing/MemoryKeyValueStore';
import { KEY_LENGTH, createAesGcmEncryptor, type RandomBytes } from '../security/encryption';
import { SecureLocalCache } from './EncryptedCache';

const randomBytes: RandomBytes = (length) => globalThis.crypto.getRandomValues(new Uint8Array(length));

function createCache() {
  const storage = new MemoryKeyValueStore();
  const encryptor = createAesGcmEncryptor(randomBytes(KEY_LENGTH), randomBytes);
  const time = { value: 1_000_000 };
  const cache = new SecureLocalCache(storage, async () => encryptor, { now: () => new Date(time.value) });
  return { cache, storage, time };
}

describe('SecureLocalCache', () => {
  it('guarda e devolve objetos', async () => {
    const { cache } = createCache();

    await cache.set('recent:u1', [{ id: 'a', valor: 10 }]);

    expect(await cache.get('recent:u1')).toEqual([{ id: 'a', valor: 10 }]);
  });

  it('retorna null para chave inexistente', async () => {
    const { cache } = createCache();
    expect(await cache.get('nada')).toBeNull();
  });

  it('guarda os dados criptografados em disco (nada legível)', async () => {
    const { cache, storage } = createCache();

    await cache.set('recent:u1', { descricao: 'Salário confidencial', valor: 3200 });

    const stored = [...storage.data.values()].join('');
    expect(stored).not.toContain('Salário');
    expect(stored).not.toContain('confidencial');
    expect(stored).not.toContain('descricao');
    expect(stored).not.toContain('valor');
  });

  it('respeita a idade máxima informada na leitura', async () => {
    const { cache, time } = createCache();
    await cache.set('k', { ok: true });

    time.value += 5_000;

    expect(await cache.get('k', 10_000)).toEqual({ ok: true });
    expect(await cache.get('k', 1_000)).toBeNull();
  });

  it('descarta registro adulterado e o remove do armazenamento', async () => {
    const { cache, storage } = createCache();
    await cache.set('k', { ok: true });

    const storageKey = 'zbank.cache.k';
    const record = JSON.parse(storage.data.get(storageKey) as string) as { t: number; d: string };
    const lastChar = record.d.slice(-1);
    const flippedChar = lastChar === '0' ? '1' : '0';
    storage.data.set(storageKey, JSON.stringify({ ...record, d: record.d.slice(0, -1) + flippedChar }));

    expect(await cache.get('k')).toBeNull();
    expect(storage.data.has(storageKey)).toBe(false);
  });

  it('clearAll apaga tudo que foi gravado, inclusive o índice', async () => {
    const { cache, storage } = createCache();
    await Promise.all([cache.set('a', 1), cache.set('b', 2), cache.set('c', 3)]);

    await cache.clearAll();

    expect(await cache.get('a')).toBeNull();
    expect(await cache.get('b')).toBeNull();
    expect(storage.data.size).toBe(0);
  });

  it('remove apaga somente a chave informada', async () => {
    const { cache } = createCache();
    await cache.set('a', 1);
    await cache.set('b', 2);

    await cache.remove('a');

    expect(await cache.get('a')).toBeNull();
    expect(await cache.get('b')).toBe(2);
  });
});
