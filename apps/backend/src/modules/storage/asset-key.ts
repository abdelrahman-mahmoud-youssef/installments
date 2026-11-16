const STORED_ASSET_PATH_PATTERN = /^\/(?:assets|uploads)\/(.+)$/;

export function extractAssetKey(url: string | null | undefined): string | null {
  if (!url) {
    return null;
  }
  return STORED_ASSET_PATH_PATTERN.exec(url)?.[1] ?? null;
}
