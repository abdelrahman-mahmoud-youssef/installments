import * as SecureStore from 'expo-secure-store';
import { CurrentUser } from '@/api/auth';

const USER_SNAPSHOT_KEY = 'qistak.user-snapshot';

function isCurrentUser(value: unknown): value is CurrentUser {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const candidate = value as Partial<CurrentUser>;
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.tenantId === 'string' &&
    typeof candidate.role === 'string' &&
    typeof candidate.tenant === 'object' &&
    candidate.tenant !== null &&
    typeof candidate.subscription === 'object' &&
    candidate.subscription !== null
  );
}

async function read(): Promise<CurrentUser | null> {
  const stored = await SecureStore.getItemAsync(USER_SNAPSHOT_KEY);
  if (!stored) {
    return null;
  }
  try {
    const parsed: unknown = JSON.parse(stored);
    return isCurrentUser(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export const userSnapshotStorage = {
  get: read,
  set: async (user: CurrentUser): Promise<void> => {
    try {
      await SecureStore.setItemAsync(USER_SNAPSHOT_KEY, JSON.stringify(user));
    } catch (error) {
      console.warn('Could not save the signed-in user snapshot', error);
    }
  },
  clear: (): Promise<void> => SecureStore.deleteItemAsync(USER_SNAPSHOT_KEY),
};
