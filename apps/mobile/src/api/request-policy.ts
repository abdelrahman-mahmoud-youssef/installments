export const READ_TIMEOUT_MS = 20_000;
export const WRITE_TIMEOUT_MS = 60_000;
export const MAX_READ_ATTEMPTS = 3;

const RETRY_BASE_DELAY_MS = 800;
const RETRY_JITTER_MS = 250;
const RETRYABLE_STATUS_CODES: ReadonlySet<number> = new Set([502, 503, 504]);

export function isReadMethod(method: string | undefined): boolean {
  return (method ?? 'GET').toUpperCase() === 'GET';
}

export function isRetryableStatus(statusCode: number): boolean {
  return RETRYABLE_STATUS_CODES.has(statusCode);
}

export function computeRetryDelay(attempt: number, randomValue: number): number {
  return RETRY_BASE_DELAY_MS * 2 ** (attempt - 1) + Math.round(randomValue * RETRY_JITTER_MS);
}

export function waitFor(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}
