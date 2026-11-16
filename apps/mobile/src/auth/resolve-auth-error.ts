import { ApiError, NetworkError } from '@/api/client';

type Translate = (key: string) => string;

const DEACTIVATED_ACCOUNT_MESSAGE = 'This account has been deactivated. You can contact support.';

export function resolveAuthErrorMessage(caught: unknown, t: Translate): string {
  if (caught instanceof NetworkError) {
    return t('common.networkError');
  }
  if (caught instanceof ApiError) {
    return caught.message === DEACTIVATED_ACCOUNT_MESSAGE ? t('auth.accountDeactivated') : caught.message;
  }
  return t('common.genericError');
}
