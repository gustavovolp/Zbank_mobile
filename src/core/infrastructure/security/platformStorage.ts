import AsyncStorage from '@react-native-async-storage/async-storage';
import { getRandomBytes } from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import type { KeyValueStore } from '../storage/KeyValueStore';
import { createChunkedStore } from './chunkedStore';
import type { RandomBytes } from './encryption';

const SECURE_OPTIONS: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

const asyncStorageBackend: KeyValueStore = {
  getItem: (key) => AsyncStorage.getItem(key),
  setItem: (key, value) => AsyncStorage.setItem(key, value),
  removeItem: (key) => AsyncStorage.removeItem(key),
};

const secureStoreBackend: KeyValueStore = {
  getItem: (key) => SecureStore.getItemAsync(key, SECURE_OPTIONS),
  setItem: (key, value) => SecureStore.setItemAsync(key, value, SECURE_OPTIONS),
  removeItem: (key) => SecureStore.deleteItemAsync(key, SECURE_OPTIONS),
};

export const hasHardwareBackedStorage = Platform.OS !== 'web';

export const secureStorage: KeyValueStore = createChunkedStore(
  hasHardwareBackedStorage ? secureStoreBackend : asyncStorageBackend
);

export const localStorageBackend: KeyValueStore = asyncStorageBackend;

export const randomBytes: RandomBytes = (length) => getRandomBytes(length);
