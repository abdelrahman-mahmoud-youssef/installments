import { config } from '@/lib/config';

const THUMBNAIL_PATH_PATTERN = /(\/assets\/(?:customer-photos|contact-photos|contracts|offer-images)\/[^?#]+)\.(?:jpg|png)$/;

export type ThumbnailWidth = 200 | 800;

export function thumbnailUrl(url: string, width: ThumbnailWidth): string {
  return url.replace(THUMBNAIL_PATH_PATTERN, `$1.w${width}.jpg`);
}

export function resolveAssetUrl(path: string | null): string | null {
  if (!path) {
    return null;
  }
  return /^https?:\/\//i.test(path) ? path : `${config.publicBackendUrl}${path}`;
}
