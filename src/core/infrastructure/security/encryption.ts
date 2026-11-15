import { gcm } from '@noble/ciphers/aes.js';
import { bytesToHex, bytesToUtf8, hexToBytes, utf8ToBytes } from '@noble/ciphers/utils.js';
import type { KeyValueStore } from '../storage/KeyValueStore';

export const KEY_LENGTH = 32;
export const NONCE_LENGTH = 12;

const PAYLOAD_VERSION = 'v1';
const KEY_NAME = 'cache-encryption-key';

export type RandomBytes = (length: number) => Uint8Array;

export interface Encryptor {
  encrypt(plaintext: string): string;
  decrypt(payload: string): string;
}

export function createAesGcmEncryptor(key: Uint8Array, randomBytes: RandomBytes): Encryptor {
  if (key.length !== KEY_LENGTH) {
    throw new Error('A chave de criptografia deve ter 32 bytes (AES-256).');
  }

  return {
    encrypt(plaintext) {
      const nonce = randomBytes(NONCE_LENGTH);
      const ciphertext = gcm(key, nonce).encrypt(utf8ToBytes(plaintext));
      return `${PAYLOAD_VERSION}.${bytesToHex(nonce)}.${bytesToHex(ciphertext)}`;
    },

    decrypt(payload) {
      const [version, nonceHex, ciphertextHex] = payload.split('.');
      if (version !== PAYLOAD_VERSION || !nonceHex || !ciphertextHex) {
        throw new Error('Payload criptografado inválido.');
      }
      return bytesToUtf8(gcm(key, hexToBytes(nonceHex)).decrypt(hexToBytes(ciphertextHex)));
    },
  };
}

function tryHexToBytes(hex: string): Uint8Array | null {
  try {
    return hexToBytes(hex);
  } catch {
    return null;
  }
}

export async function loadOrCreateEncryptionKey(store: KeyValueStore, randomBytes: RandomBytes): Promise<Uint8Array> {
  const stored = await store.getItem(KEY_NAME);
  const storedKey = stored ? tryHexToBytes(stored) : null;
  if (storedKey?.length === KEY_LENGTH) return storedKey;

  const key = randomBytes(KEY_LENGTH);
  await store.setItem(KEY_NAME, bytesToHex(key));
  return key;
}

export function createEncryptorProvider(store: KeyValueStore, randomBytes: RandomBytes): () => Promise<Encryptor> {
  let pending: Promise<Encryptor> | null = null;

  return () => {
    pending ??= loadOrCreateEncryptionKey(store, randomBytes).then((key) => createAesGcmEncryptor(key, randomBytes));
    return pending;
  };
}
