import { describe, expect, it } from 'vitest';
import { MemoryKeyValueStore } from '@/testing/MemoryKeyValueStore';
import { createChunkedStore } from './chunkedStore';

const SECURE_STORE_LIKE = { maxValueLength: 2048, keyPattern: /^[A-Za-z0-9._-]+$/ };

describe('createChunkedStore', () => {
  it('guarda valores maiores que o limite do backend dividindo em partes', async () => {
    const backend = new MemoryKeyValueStore(SECURE_STORE_LIKE);
    const store = createChunkedStore(backend, { chunkSize: 500 });
    const value = JSON.stringify({ token: 'x'.repeat(5000) });

    await store.setItem('session', value);

    expect(await store.getItem('session')).toBe(value);
    expect([...backend.data.values()].every((part) => part.length <= 2048)).toBe(true);
  });

  it('sanitiza chaves com caracteres que o SecureStore não aceita (ex.: as do Firebase Auth)', async () => {
    const backend = new MemoryKeyValueStore(SECURE_STORE_LIKE);
    const store = createChunkedStore(backend);

    await store.setItem('firebase:authUser:AIzaKey:[DEFAULT]', 'usuario');

    expect(await store.getItem('firebase:authUser:AIzaKey:[DEFAULT]')).toBe('usuario');
  });

  it('remove partes antigas quando o novo valor é menor', async () => {
    const backend = new MemoryKeyValueStore();
    const store = createChunkedStore(backend, { chunkSize: 10 });

    await store.setItem('k', 'a'.repeat(100));
    const sizeBefore = backend.data.size;
    await store.setItem('k', 'curto');

    expect(await store.getItem('k')).toBe('curto');
    expect(backend.data.size).toBeLessThan(sizeBefore);
  });

  it('removeItem apaga todas as partes e retorna null depois', async () => {
    const backend = new MemoryKeyValueStore();
    const store = createChunkedStore(backend, { chunkSize: 10 });

    await store.setItem('k', 'a'.repeat(95));
    await store.removeItem('k');

    expect(await store.getItem('k')).toBeNull();
    expect(backend.data.size).toBe(0);
  });

  it('retorna null quando alguma parte está faltando', async () => {
    const backend = new MemoryKeyValueStore();
    const store = createChunkedStore(backend, { chunkSize: 10 });

    await store.setItem('k', 'a'.repeat(50));
    backend.data.delete('zbank.k.2');

    expect(await store.getItem('k')).toBeNull();
  });

  it('suporta string vazia', async () => {
    const store = createChunkedStore(new MemoryKeyValueStore());
    await store.setItem('k', '');
    expect(await store.getItem('k')).toBe('');
  });
});
