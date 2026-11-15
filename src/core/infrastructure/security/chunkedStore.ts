import type { KeyValueStore } from '../storage/KeyValueStore';

export interface ChunkedStoreOptions {
  prefix?: string;
  chunkSize?: number;
}

const INVALID_KEY_CHARACTERS = /[^A-Za-z0-9._-]/g;

function splitIntoChunks(value: string, size: number): string[] {
  if (value.length === 0) return [''];
  const chunks: string[] = [];
  for (let start = 0; start < value.length; start += size) {
    chunks.push(value.slice(start, start + size));
  }
  return chunks;
}

export function createChunkedStore(
  backend: KeyValueStore,
  { prefix = 'zbank', chunkSize = 1000 }: ChunkedStoreOptions = {}
): KeyValueStore {
  const baseKey = (key: string) => `${prefix}.${key.replace(INVALID_KEY_CHARACTERS, '_')}`;
  const countKey = (base: string) => `${base}.n`;
  const chunkKey = (base: string, index: number) => `${base}.${index}`;

  async function readCount(base: string): Promise<number> {
    const raw = await backend.getItem(countKey(base));
    const count = raw === null ? 0 : Number.parseInt(raw, 10);
    return Number.isFinite(count) && count > 0 ? count : 0;
  }

  return {
    async getItem(key) {
      const base = baseKey(key);
      const count = await readCount(base);
      if (count === 0) return null;

      const parts = await Promise.all(Array.from({ length: count }, (_, index) => backend.getItem(chunkKey(base, index))));
      return parts.some((part) => part === null) ? null : parts.join('');
    },

    async setItem(key, value) {
      const base = baseKey(key);
      const previousCount = await readCount(base);
      const chunks = splitIntoChunks(value, chunkSize);

      await Promise.all(chunks.map((chunk, index) => backend.setItem(chunkKey(base, index), chunk)));
      await backend.setItem(countKey(base), String(chunks.length));

      for (let index = chunks.length; index < previousCount; index += 1) {
        await backend.removeItem(chunkKey(base, index));
      }
    },

    async removeItem(key) {
      const base = baseKey(key);
      const count = await readCount(base);
      await Promise.all(Array.from({ length: count }, (_, index) => backend.removeItem(chunkKey(base, index))));
      await backend.removeItem(countKey(base));
    },
  };
}
