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

export interface FailedLoginState {
  failedLoginAttempts: number;
  lockedUntil: Date | null;
}

export function calculateFailedLoginState(previousFailedAttempts: number, now: Date): FailedLoginState {
  const failedLoginAttempts = previousFailedAttempts + 1;
  const lockedUntil =
    failedLoginAttempts >= LOGIN_LOCKOUT_THRESHOLD
      ? new Date(now.getTime() + computeLockoutSeconds(failedLoginAttempts) * 1000)
      : null;
  return { failedLoginAttempts, lockedUntil };
}

export function secondsUntilUnlock(lockedUntil: Date | null, now: Date): number {
  if (!lockedUntil || lockedUntil <= now) {
    return 0;
  }
  return Math.ceil((lockedUntil.getTime() - now.getTime()) / 1000);
}
