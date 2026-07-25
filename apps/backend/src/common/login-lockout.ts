import {
  LOGIN_LOCKOUT_BASE_SECONDS,
  LOGIN_LOCKOUT_MAX_SECONDS,
  LOGIN_LOCKOUT_THRESHOLD,
} from './constants';

export function computeLockoutSeconds(failedAttempts: number): number {
  const overThreshold = failedAttempts - LOGIN_LOCKOUT_THRESHOLD;
  return Math.min(LOGIN_LOCKOUT_BASE_SECONDS * 2 ** overThreshold, LOGIN_LOCKOUT_MAX_SECONDS);
}

export function formatLockoutMessage(secondsRemaining: number): string {
  if (secondsRemaining < 60) {
    return `Too many failed attempts. Try again in ${secondsRemaining} second${secondsRemaining === 1 ? '' : 's'}.`;
  }
  const minutes = Math.ceil(secondsRemaining / 60);
  return `Too many failed attempts. Try again in ${minutes} minute${minutes === 1 ? '' : 's'}.`;
}
