import { config } from '@/lib/config';

export function resolveAssetUrl(path: string | null): string | null {
  return path ? `${config.publicBackendUrl}${path}` : null;
}
