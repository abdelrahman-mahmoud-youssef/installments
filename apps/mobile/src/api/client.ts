import { apiBaseUrl } from '@/lib/config';

export interface ApiErrorBody {
  statusCode: number;
  message: string | string[];
  error: string;
}

export class ApiError extends Error {
  readonly statusCode: number;
  readonly details: string[];

  constructor(body: ApiErrorBody) {
    const details = Array.isArray(body.message) ? body.message : [body.message];
    super(details.join(' '));
    this.name = 'ApiError';
    this.statusCode = body.statusCode;
    this.details = details;
  }
}

export class NetworkError extends Error {
  constructor() {
    super('Network request failed');
    this.name = 'NetworkError';
  }
}

let authToken: string | null = null;
let unauthorizedHandler: (() => void) | null = null;

export function setAuthToken(token: string | null): void {
  authToken = token;
}

export function setUnauthorizedHandler(handler: (() => void) | null): void {
  unauthorizedHandler = handler;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${apiBaseUrl}/${path}`, {
      ...init,
      headers: {
        ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        ...init?.headers,
      },
    });
  } catch {
    throw new NetworkError();
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const body: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    if (response.status === 401 && authToken) {
      unauthorizedHandler?.();
    }
    throw new ApiError(
      (body as ApiErrorBody) ?? {
        statusCode: response.status,
        message: 'Request failed',
        error: 'Error',
      },
    );
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
