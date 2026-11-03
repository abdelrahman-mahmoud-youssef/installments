import {
  calculateFailedLoginState,
  computeLockoutSeconds,
  formatLockoutMessage,
  secondsUntilUnlock,
} from './login-lockout';

describe('computeLockoutSeconds', () => {
  it('locks for 60s at the threshold', () => {
    expect(computeLockoutSeconds(3)).toBe(60);
  });

  it('doubles for each attempt past the threshold', () => {
    expect(computeLockoutSeconds(4)).toBe(120);
    expect(computeLockoutSeconds(5)).toBe(240);
    expect(computeLockoutSeconds(6)).toBe(480);
  });

  it('caps at 30 minutes', () => {
    expect(computeLockoutSeconds(10)).toBe(1800);
    expect(computeLockoutSeconds(20)).toBe(1800);
  });
});

describe('formatLockoutMessage', () => {
  it('formats sub-minute waits in seconds', () => {
    expect(formatLockoutMessage(1)).toBe('Too many failed attempts. Try again in 1 second.');
    expect(formatLockoutMessage(45)).toBe('Too many failed attempts. Try again in 45 seconds.');
  });

  it('formats minute-plus waits in minutes, rounded up', () => {
    expect(formatLockoutMessage(60)).toBe('Too many failed attempts. Try again in 1 minute.');
    expect(formatLockoutMessage(90)).toBe('Too many failed attempts. Try again in 2 minutes.');
    expect(formatLockoutMessage(1800)).toBe('Too many failed attempts. Try again in 30 minutes.');
  });
});

describe('calculateFailedLoginState', () => {
  const now = new Date('2026-11-03T10:00:00.000Z');

  it('counts the attempt without locking below the threshold', () => {
    expect(calculateFailedLoginState(1, now)).toEqual({ failedLoginAttempts: 2, lockedUntil: null });
  });

  it('locks the account once the threshold is reached', () => {
    expect(calculateFailedLoginState(2, now)).toEqual({
      failedLoginAttempts: 3,
      lockedUntil: new Date('2026-11-03T10:01:00.000Z'),
    });
  });
});

describe('secondsUntilUnlock', () => {
  const now = new Date('2026-11-03T10:00:00.000Z');

  it('is zero when the account was never locked or the lock has passed', () => {
    expect(secondsUntilUnlock(null, now)).toBe(0);
    expect(secondsUntilUnlock(new Date('2026-11-03T09:59:00.000Z'), now)).toBe(0);
  });

  it('rounds the remaining lock up to whole seconds', () => {
    expect(secondsUntilUnlock(new Date('2026-11-03T10:00:01.500Z'), now)).toBe(2);
  });
});
