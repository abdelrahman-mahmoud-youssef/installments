export const APP_LOCK_GRACE_PERIOD_MS = 60_000;

export function shouldLockAfterBackground(backgroundedAt: number | null, now: number): boolean {
  return backgroundedAt !== null && now - backgroundedAt >= APP_LOCK_GRACE_PERIOD_MS;
}
