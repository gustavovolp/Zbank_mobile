import { SecureLocalCache } from '@/core/infrastructure/cache/EncryptedCache';
import { KEY_LENGTH, createAesGcmEncryptor, type RandomBytes } from '@/core/infrastructure/security/encryption';
import { InMemoryTransactionRepository } from '@/testing/InMemoryTransactionRepository';
import { MemoryKeyValueStore } from '@/testing/MemoryKeyValueStore';
import { describeTransactionRepositoryContract } from '@/testing/transactionRepositoryContract';
import { CachedTransactionRepository } from './CachedTransactionRepository';

const randomBytes: RandomBytes = (length) => globalThis.crypto.getRandomValues(new Uint8Array(length));

describeTransactionRepositoryContract('InMemoryTransactionRepository', () => new InMemoryTransactionRepository());

describeTransactionRepositoryContract('CachedTransactionRepository (sobre o repositório em memória)', () => {
  const clock = { now: () => new Date() };
  const encryptor = createAesGcmEncryptor(randomBytes(KEY_LENGTH), randomBytes);
  const cache = new SecureLocalCache(new MemoryKeyValueStore(), async () => encryptor, clock);
  return new CachedTransactionRepository(new InMemoryTransactionRepository(), cache, clock);
});
