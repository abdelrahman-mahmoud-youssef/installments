import { apiBaseUrl } from './config';

const THUMBNAIL_PATH_PATTERN = /(\/assets\/(?:customer-photos|contact-photos|contracts|offer-images)\/[^?#]+)\.(?:jpg|png)$/;

export type ThumbnailWidth = 200 | 800;

export function resolveAssetUrl(path: string): string {
  return path.startsWith('http') ? path : `${apiBaseUrl}${path}`;
}

export function resolveThumbnailUrl(path: string, width: ThumbnailWidth): string {
  return resolveAssetUrl(path).replace(THUMBNAIL_PATH_PATTERN, `$1.w${width}.jpg`);
}
