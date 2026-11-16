import { apiBaseUrl } from '@/lib/config';
import {
  computeRetryDelay,
  isReadMethod,
  isRetryableStatus,
  MAX_READ_ATTEMPTS,
  READ_TIMEOUT_MS,
  waitFor,
  WRITE_TIMEOUT_MS,
} from './request-policy';

const SUBSCRIPTION_INACTIVE_ERROR_CODE = 'SUBSCRIPTION_INACTIVE';

export interface ApiErrorBody {
  statusCode: number;
  message: string | string[];
  error: string;
  code?: string;
}

export class ApiError extends Error {
  readonly statusCode: number;
  readonly details: string[];
  readonly code: string | null;

  constructor(body: ApiErrorBody) {
    const details = Array.isArray(body.message) ? body.message : [body.message];
    super(details.join(' '));
    this.name = 'ApiError';
    this.statusCode = body.statusCode;
    this.details = details;
    this.code = body.code ?? null;
  }
}

export class NetworkError extends Error {
  constructor() {
    super('Network request failed');
    this.name = 'NetworkError';
  }
}

export class RequestTimeoutError extends NetworkError {
  constructor() {
    super();
    this.name = 'RequestTimeoutError';
  }
}

let authToken: string | null = null;
let unauthorizedHandler: (() => void) | null = null;
let subscriptionInactiveHandler: (() => void) | null = null;

export function setAuthToken(token: string | null): void {
  authToken = token;
}

export function setUnauthorizedHandler(handler: (() => void) | null): void {
  unauthorizedHandler = handler;
}

export function setSubscriptionInactiveHandler(handler: (() => void) | null): void {
  subscriptionInactiveHandler = handler;
}

async function requestOnce<T>(path: string, init: RequestInit | undefined, timeoutMs: number): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    let response: Response;
    try {
      response = await fetch(`${apiBaseUrl}/${path}`, {
        ...init,
        signal: controller.signal,
        headers: {
          ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
          ...init?.headers,
        },
      });
    } catch {
      throw controller.signal.aborted ? new RequestTimeoutError() : new NetworkError();
    }

    if (response.status === 204) {
      return undefined as T;
    }

    const body: unknown = await response.json().catch(() => {
      if (controller.signal.aborted) {
        throw new RequestTimeoutError();
      }
      return null;
    });

    if (!response.ok) {
      if (response.status === 401 && authToken) {
        unauthorizedHandler?.();
      }
      const error = new ApiError(
        (body as ApiErrorBody) ?? {
          statusCode: response.status,
          message: 'Request failed',
          error: 'Error',
        },
      );
      if (error.code === SUBSCRIPTION_INACTIVE_ERROR_CODE) {
        subscriptionInactiveHandler?.();
      }
      throw error;
    }

    return body as T;
  } finally {
    clearTimeout(timeout);
  }
}

function isRetryable(error: unknown): boolean {
  return error instanceof NetworkError || (error instanceof ApiError && isRetryableStatus(error.statusCode));
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const isRead = isReadMethod(init?.method);
  const timeoutMs = isRead ? READ_TIMEOUT_MS : WRITE_TIMEOUT_MS;
  const maxAttempts = isRead ? MAX_READ_ATTEMPTS : 1;

  for (let attempt = 1; ; attempt += 1) {
    try {
      return await requestOnce<T>(path, init, timeoutMs);
    } catch (error) {
      if (attempt >= maxAttempts || !isRetryable(error)) {
        throw error;
      }
      await waitFor(computeRetryDelay(attempt, Math.random()));
    }
  }
}

export const apiClient = {
  get: <T>(path: string): Promise<T> => request<T>(path),
  post: <T>(path: string, data?: unknown): Promise<T> =>
    request<T>(path, { method: 'POST', body: data ? JSON.stringify(data) : undefined }),
  patch: <T>(path: string, data?: unknown): Promise<T> =>
    request<T>(path, { method: 'PATCH', body: data ? JSON.stringify(data) : undefined }),
  delete: <T>(path: string, data?: unknown): Promise<T> =>
    request<T>(path, { method: 'DELETE', body: data ? JSON.stringify(data) : undefined }),
};

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export function buildQuery(params: Record<string, string | number | boolean | undefined>): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') {
      query.set(key, String(value));
    }
  }
  const queryString = query.toString();
  return queryString ? `?${queryString}` : '';
}
