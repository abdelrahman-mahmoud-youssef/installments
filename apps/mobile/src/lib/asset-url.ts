import { apiBaseUrl } from './config';

export function resolveAssetUrl(path: string): string {
  return path.startsWith('http') ? path : `${apiBaseUrl}${path}`;
}
