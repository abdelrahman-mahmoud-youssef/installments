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

export function isSubscriptionInactiveError(error: unknown): boolean {
  return error instanceof ApiError && error.code === SUBSCRIPTION_INACTIVE_ERROR_CODE;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api/backend/${path}`, {
    ...init,
    headers: {
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...init?.headers,
    },
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const body: unknown = await response.json();

  if (!response.ok) {
    if (response.status === 401 && typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    throw new ApiError(body as ApiErrorBody);
  }

  return body as T;
}

export const apiClient = {
  get: <T>(path: string): Promise<T> => request<T>(path),
  post: <T>(path: string, data?: unknown): Promise<T> =>
    request<T>(path, { method: 'POST', body: data ? JSON.stringify(data) : undefined }),
  patch: <T>(path: string, data?: unknown): Promise<T> =>
    request<T>(path, { method: 'PATCH', body: data ? JSON.stringify(data) : undefined }),
  delete: <T>(path: string): Promise<T> => request<T>(path, { method: 'DELETE' }),
};
