import { Inject, Injectable, Logger } from '@nestjs/common';
import { originalKeyCandidates, parseVariantKey, THUMBNAIL_WIDTHS, variantKeyFor } from './image-variants';
import { STORAGE_PROVIDER, StorageProvider } from './storage-provider.interface';
import { renderThumbnail } from './thumbnail-renderer';

export interface AssetBytes {
  buffer: Buffer;
  contentType: string;
  isFallback: boolean;
}

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);

  constructor(@Inject(STORAGE_PROVIDER) private readonly provider: StorageProvider) {}

  async saveLogo(tenantId: string, buffer: Buffer, extension: string): Promise<string> {
    await this.deleteLogo(tenantId);
    return this.provider.save(`logos/${tenantId}.${extension}`, buffer);
  }

  saveKeyedImage(key: string, buffer: Buffer): Promise<string> {
    return this.provider.save(key, buffer);
  }

  async saveImageWithThumbnails(key: string, buffer: Buffer): Promise<string> {
    const url = await this.provider.save(key, buffer);
    await this.saveThumbnails(key, buffer);
    return url;
  }

  async regenerateThumbnails(key: string): Promise<void> {
    const { buffer } = await this.provider.getAssetBytes(key);
    await this.saveThumbnails(key, buffer);
  }

  deleteLogo(tenantId: string): Promise<void> {
    return this.provider.deleteByPrefix(`logos/${tenantId}.`);
  }

  getAssetUrl(key: string): Promise<string> {
    return this.provider.getAssetUrl(key);
  }

  async getAssetBytes(key: string): Promise<AssetBytes> {
    try {
      return { ...(await this.provider.getAssetBytes(key)), isFallback: false };
    } catch (error) {
      const variant = parseVariantKey(key);
      if (!variant) {
        throw error;
      }
      return this.getFirstAvailableOriginal(originalKeyCandidates(variant.baseKey), error);
    }
  }

  private async getFirstAvailableOriginal(candidateKeys: string[], originalError: unknown): Promise<AssetBytes> {
    for (const candidateKey of candidateKeys) {
      try {
        return { ...(await this.provider.getAssetBytes(candidateKey)), isFallback: true };
      } catch {
        continue;
      }
    }
    throw originalError;
  }

  private async saveThumbnails(originalKey: string, original: Buffer): Promise<void> {
    try {
      await Promise.all(
        THUMBNAIL_WIDTHS.map(async (width) =>
          this.provider.save(variantKeyFor(originalKey, width), await renderThumbnail(original, width)),
        ),
      );
    } catch (error) {
      this.logger.warn(
        `Could not create thumbnails for ${originalKey}: ${error instanceof Error ? error.message : 'unknown error'}`,
      );
    }
  }
}
