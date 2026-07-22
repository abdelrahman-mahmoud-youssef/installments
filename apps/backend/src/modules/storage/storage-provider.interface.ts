export const STORAGE_PROVIDER = Symbol('STORAGE_PROVIDER');

export interface StorageProvider {
  save(key: string, buffer: Buffer): Promise<string>;
  deleteByPrefix(prefix: string): Promise<void>;
  getAssetUrl(key: string): Promise<string>;
  getAssetBytes(key: string): Promise<{ buffer: Buffer; contentType: string }>;
}
