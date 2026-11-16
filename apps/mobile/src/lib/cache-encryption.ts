import { gcm } from '@noble/ciphers/aes.js';
import { bytesToHex, bytesToUtf8, hexToBytes, utf8ToBytes } from '@noble/ciphers/utils.js';
import { getRandomBytes } from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';

const CACHE_KEY_STORAGE_KEY = 'qistak.cache-key';
const KEY_BYTE_LENGTH = 32;
const NONCE_BYTE_LENGTH = 12;
const NONCE_HEX_LENGTH = NONCE_BYTE_LENGTH * 2;

let memoizedKey: Uint8Array | null = null;

async function loadOrCreateKey(): Promise<Uint8Array> {
  if (memoizedKey) {
    return memoizedKey;
  }
  const stored = await SecureStore.getItemAsync(CACHE_KEY_STORAGE_KEY);
  if (stored) {
    memoizedKey = hexToBytes(stored);
    return memoizedKey;
  }
  const created = getRandomBytes(KEY_BYTE_LENGTH);
  await SecureStore.setItemAsync(CACHE_KEY_STORAGE_KEY, bytesToHex(created));
  memoizedKey = created;
  return created;
}

export async function encryptText(plainText: string): Promise<string> {
  const key = await loadOrCreateKey();
  const nonce = getRandomBytes(NONCE_BYTE_LENGTH);
  const sealed = gcm(key, nonce).encrypt(utf8ToBytes(plainText));
  return bytesToHex(nonce) + bytesToHex(sealed);
}

export async function decryptText(payload: string): Promise<string | null> {
  try {
    const key = await loadOrCreateKey();
    const nonce = hexToBytes(payload.slice(0, NONCE_HEX_LENGTH));
    const sealed = hexToBytes(payload.slice(NONCE_HEX_LENGTH));
    return bytesToUtf8(gcm(key, nonce).decrypt(sealed));
  } catch {
    return null;
  }
}

export async function discardCacheKey(): Promise<void> {
  memoizedKey = null;
  await SecureStore.deleteItemAsync(CACHE_KEY_STORAGE_KEY);
}
