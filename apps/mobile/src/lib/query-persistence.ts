import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { DehydrateOptions, Query } from '@tanstack/react-query';
import { persistQueryClientRestore, persistQueryClientSubscribe } from '@tanstack/react-query-persist-client';
import Constants from 'expo-constants';
import { decryptText, discardCacheKey, encryptText } from './cache-encryption';
import { CACHE_MAX_AGE_MS, queryClient } from './query-client';

const CACHE_STORAGE_KEY = 'qistak.query-cache';
const MAX_PERSISTED_CHARACTERS = 1_500_000;
const PERSIST_THROTTLE_MS = 5_000;
const PERSISTED_QUERY_ROOTS: ReadonlySet<string> = new Set([
  'dashboard',
  'customers',
  'contracts',
  'payment-methods',
  'branding',
  'reports',
]);
const NEVER_PERSISTED_SECOND_KEYS: ReadonlySet<string> = new Set(['notifications']);
const SAME_DAY_QUERY_ROOTS: ReadonlySet<string> = new Set(['dashboard', 'reports']);

interface InfiniteData {
  pages: unknown[];
  pageParams: unknown[];
}

let isWritingEnabled = false;
let stopSubscription: (() => void) | null = null;

function isInfiniteData(data: unknown): data is InfiniteData {
  return typeof data === 'object' && data !== null && Array.isArray((data as InfiniteData).pages);
}

function keepFirstPageOnly(data: unknown): unknown {
  if (!isInfiniteData(data)) {
    return data;
  }
  return { pages: data.pages.slice(0, 1), pageParams: data.pageParams.slice(0, 1) };
}

function isPersistable(query: Query): boolean {
  const [root, secondKey] = query.queryKey;
  return (
    query.state.status === 'success' &&
    PERSISTED_QUERY_ROOTS.has(String(root)) &&
    !NEVER_PERSISTED_SECOND_KEYS.has(String(secondKey))
  );
}

const dehydrateOptions: DehydrateOptions = {
  shouldDehydrateQuery: isPersistable,
  shouldDehydrateMutation: () => false,
  serializeData: keepFirstPageOnly,
};

const encryptedStorage = {
  getItem: async (key: string): Promise<string | null> => {
    const stored = await AsyncStorage.getItem(key);
    return stored ? decryptText(stored) : null;
  },
  setItem: async (key: string, value: string): Promise<void> => {
    if (!isWritingEnabled) {
      return;
    }
    if (value.length > MAX_PERSISTED_CHARACTERS) {
      await AsyncStorage.removeItem(key);
      return;
    }
    await AsyncStorage.setItem(key, await encryptText(value));
  },
  removeItem: (key: string): Promise<void> => AsyncStorage.removeItem(key),
};

const persister = createAsyncStoragePersister({
  storage: encryptedStorage,
  key: CACHE_STORAGE_KEY,
  throttleTime: PERSIST_THROTTLE_MS,
});

function buildBuster(userKey: string): string {
  return `${Constants.expoConfig?.version ?? 'development'}:${userKey}`;
}

function utcDayOf(timestamp: number): string {
  return new Date(timestamp).toISOString().slice(0, 10);
}

function dropSameDayQueriesFromEarlierDays(): void {
  const today = utcDayOf(Date.now());
  queryClient.removeQueries({
    predicate: (query) =>
      SAME_DAY_QUERY_ROOTS.has(String(query.queryKey[0])) && utcDayOf(query.state.dataUpdatedAt) !== today,
  });
}

export async function restoreQueryCache(userKey: string): Promise<void> {
  try {
    await persistQueryClientRestore({
      queryClient,
      persister,
      maxAge: CACHE_MAX_AGE_MS,
      buster: buildBuster(userKey),
    });
    dropSameDayQueriesFromEarlierDays();
  } catch (error) {
    console.warn('Could not restore the saved data', error);
  }
}

export function startQueryCachePersistence(userKey: string): void {
  stopSubscription?.();
  isWritingEnabled = true;
  stopSubscription = persistQueryClientSubscribe({
    queryClient,
    persister,
    buster: buildBuster(userKey),
    dehydrateOptions,
  });
}

export async function stopQueryCachePersistence(): Promise<void> {
  isWritingEnabled = false;
  stopSubscription?.();
  stopSubscription = null;
  await persister.removeClient();
  await discardCacheKey();
}
