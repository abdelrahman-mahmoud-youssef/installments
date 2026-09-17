import { ApiError, NetworkError } from '@/api/client';

type Translate = (key: string) => string;

export function resolveAuthErrorMessage(caught: unknown, t: Translate): string {
  if (caught instanceof NetworkError) {
    return t('common.networkError');
  }
  if (caught instanceof ApiError) {
    return caught.message;
  }
  return t('common.genericError');
}
