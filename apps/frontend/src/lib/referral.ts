import { config } from '@/lib/config';
import { routes } from '@/lib/routes';

export const REFERRAL_QUERY_PARAM = 'ref';

export const REFERRAL_COOKIE_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;

export const REFERRAL_CODE_MAX_LENGTH = 100;

export function buildInviteUrl(shopSlug: string): string {
  return `${config.siteUrl}${routes.register}?${REFERRAL_QUERY_PARAM}=${encodeURIComponent(shopSlug)}`;
}
