import { Inject, Injectable } from '@nestjs/common';
import { STORAGE_PROVIDER, StorageProvider } from './storage-provider.interface';

@Injectable()
export class StorageService {
  constructor(@Inject(STORAGE_PROVIDER) private readonly provider: StorageProvider) {}

  async saveLogo(tenantId: string, buffer: Buffer, extension: string): Promise<string> {
    await this.deleteLogo(tenantId);
    return this.provider.save(`logos/${tenantId}.${extension}`, buffer);
  }

  saveKeyedImage(key: string, buffer: Buffer): Promise<string> {
    return this.provider.save(key, buffer);
  }

  deleteLogo(tenantId: string): Promise<void> {
    return this.provider.deleteByPrefix(`logos/${tenantId}.`);
  }

  getAssetUrl(key: string): Promise<string> {
    return this.provider.getAssetUrl(key);
  }
}
