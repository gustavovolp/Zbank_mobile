import type { KeyValueStore } from '@/core/infrastructure/storage/KeyValueStore';

export interface MemoryStoreLimits {
  maxValueLength?: number;
  keyPattern?: RegExp;
}

export class MemoryKeyValueStore implements KeyValueStore {
  readonly data = new Map<string, string>();

  constructor(private readonly limits: MemoryStoreLimits = {}) {}

  async getItem(key: string): Promise<string | null> {
    return this.data.get(key) ?? null;
  }

  async setItem(key: string, value: string): Promise<void> {
    if (this.limits.keyPattern && !this.limits.keyPattern.test(key)) {
      throw new Error(`Chave inválida para o armazenamento: ${key}`);
    }
    if (this.limits.maxValueLength !== undefined && value.length > this.limits.maxValueLength) {
      throw new Error(`Valor acima do limite (${value.length} > ${this.limits.maxValueLength})`);
    }
    this.data.set(key, value);
  }

  async removeItem(key: string): Promise<void> {
    this.data.delete(key);
  }
}
