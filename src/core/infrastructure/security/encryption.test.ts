import { describe, expect, it } from 'vitest';
import { MemoryKeyValueStore } from '@/testing/MemoryKeyValueStore';
import {
  KEY_LENGTH,
  createAesGcmEncryptor,
  createEncryptorProvider,
  loadOrCreateEncryptionKey,
  type RandomBytes,
} from './encryption';

const randomBytes: RandomBytes = (length) => globalThis.crypto.getRandomValues(new Uint8Array(length));
const newKey = () => randomBytes(KEY_LENGTH);

describe('createAesGcmEncryptor', () => {
  it('descriptografa o que foi criptografado (incluindo acentos e emojis)', () => {
    const encryptor = createAesGcmEncryptor(newKey(), randomBytes);
    const text = JSON.stringify({ descricao: 'Salário de março 💸', valor: 3200.5 });

    expect(encryptor.decrypt(encryptor.encrypt(text))).toBe(text);
  });

  it('não expõe o texto original e usa um nonce novo a cada chamada', () => {
    const encryptor = createAesGcmEncryptor(newKey(), randomBytes);
    const first = encryptor.encrypt('Salário');
    const second = encryptor.encrypt('Salário');

    expect(first).not.toContain('Sal');
    expect(first).not.toBe(second);
  });

  it('detecta adulteração do conteúdo (GCM autentica o payload)', () => {
    const encryptor = createAesGcmEncryptor(newKey(), randomBytes);
    const payload = encryptor.encrypt('dados sensíveis');
    const [version, nonce, ciphertext] = payload.split('.');
    const flipped = (ciphertext[0] === '0' ? '1' : '0') + ciphertext.slice(1);

    expect(() => encryptor.decrypt(`${version}.${nonce}.${flipped}`)).toThrow();
  });

  it('não descriptografa com outra chave', () => {
    const payload = createAesGcmEncryptor(newKey(), randomBytes).encrypt('segredo');
    expect(() => createAesGcmEncryptor(newKey(), randomBytes).decrypt(payload)).toThrow();
  });

  it('rejeita payload malformado e chave com tamanho errado', () => {
    const encryptor = createAesGcmEncryptor(newKey(), randomBytes);
    expect(() => encryptor.decrypt('lixo')).toThrow(/inválido/);
    expect(() => createAesGcmEncryptor(new Uint8Array(16), randomBytes)).toThrow(/32 bytes/);
  });
});

describe('chave de criptografia', () => {
  it('gera a chave uma única vez e a reutiliza nas próximas leituras', async () => {
    const store = new MemoryKeyValueStore();

    const first = await loadOrCreateEncryptionKey(store, randomBytes);
    const second = await loadOrCreateEncryptionKey(store, randomBytes);

    expect(first).toHaveLength(KEY_LENGTH);
    expect(second).toEqual(first);
  });

  it('gera uma nova chave se a armazenada estiver corrompida', async () => {
    const store = new MemoryKeyValueStore();
    await store.setItem('cache-encryption-key', 'nao-e-hex');

    const key = await loadOrCreateEncryptionKey(store, randomBytes);

    expect(key).toHaveLength(KEY_LENGTH);
  });

  it('createEncryptorProvider memoiza e evita criar duas chaves em chamadas concorrentes', async () => {
    const store = new MemoryKeyValueStore();
    const getEncryptor = createEncryptorProvider(store, randomBytes);

    const [a, b] = await Promise.all([getEncryptor(), getEncryptor()]);

    expect(a).toBe(b);
    expect(b.decrypt(a.encrypt('ok'))).toBe('ok');
  });
});
