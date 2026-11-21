import { ApiError } from '@/api/client';

const FORBIDDEN_STATUS_CODE = 403;

export function jameyaForbiddenMessage(error: unknown): string | null {
  return error instanceof ApiError && error.statusCode === FORBIDDEN_STATUS_CODE ? error.message : null;
}
