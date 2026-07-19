import { config } from '@/lib/config';

export function resolveAssetUrl(path: string | null): string | null {
  if (!path) {
    return null;
  }
  return /^https?:\/\//i.test(path) ? path : `${config.publicBackendUrl}${path}`;
}
