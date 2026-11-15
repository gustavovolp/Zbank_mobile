import type { Clock } from '@/core/domain/ports';
import type { Encryptor } from '../security/encryption';
import type { KeyValueStore } from '../storage/KeyValueStore';

export interface EncryptedCache {
  get<T>(key: string, maxAgeMs?: number): Promise<T | null>;
  set<T>(key: string, value: T): Promise<void>;
  remove(key: string): Promise<void>;
  clearAll(): Promise<void>;
}

interface CacheRecord {
  t: number;
  d: string;
}

export class SecureLocalCache implements EncryptedCache {
  private indexQueue: Promise<unknown> = Promise.resolve();

  constructor(
    private readonly storage: KeyValueStore,
    private readonly getEncryptor: () => Promise<Encryptor>,
    private readonly clock: Clock,
    private readonly prefix = 'zbank.cache.'
  ) {}

  private storageKey(key: string): string {
    return `${this.prefix}${key}`;
  }

  private get indexKey(): string {
    return `${this.prefix}__index`;
  }

  private enqueue<T>(task: () => Promise<T>): Promise<T> {
    const run = this.indexQueue.then(task, task);
    this.indexQueue = run.catch(() => undefined);
    return run;
  }

  private async readIndex(): Promise<string[]> {
    const raw = await this.storage.getItem(this.indexKey);
    if (!raw) return [];
    try {
      const parsed: unknown = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
    } catch {
      return [];
    }
  }

  async get<T>(key: string, maxAgeMs?: number): Promise<T | null> {
    const raw = await this.storage.getItem(this.storageKey(key));
    if (!raw) return null;

    try {
      const record = JSON.parse(raw) as CacheRecord;
      if (maxAgeMs !== undefined && this.clock.now().getTime() - record.t > maxAgeMs) return null;

      const encryptor = await this.getEncryptor();
      return JSON.parse(encryptor.decrypt(record.d)) as T;
    } catch {
      await this.remove(key).catch(() => undefined);
      return null;
    }
  }

  async set<T>(key: string, value: T): Promise<void> {
    const encryptor = await this.getEncryptor();
    const record: CacheRecord = { t: this.clock.now().getTime(), d: encryptor.encrypt(JSON.stringify(value)) };

    await this.storage.setItem(this.storageKey(key), JSON.stringify(record));
    await this.enqueue(async () => {
      const keys = await this.readIndex();
      if (!keys.includes(key)) {
        await this.storage.setItem(this.indexKey, JSON.stringify([...keys, key]));
      }
    });
  }

  async remove(key: string): Promise<void> {
    await this.storage.removeItem(this.storageKey(key));
    await this.enqueue(async () => {
      const keys = await this.readIndex();
      if (keys.includes(key)) {
        await this.storage.setItem(this.indexKey, JSON.stringify(keys.filter((item) => item !== key)));
      }
    });
  }

  async clearAll(): Promise<void> {
    await this.enqueue(async () => {
      const keys = await this.readIndex();
      await Promise.all(keys.map((key) => this.storage.removeItem(this.storageKey(key))));
      await this.storage.removeItem(this.indexKey);
    });
  }
}
