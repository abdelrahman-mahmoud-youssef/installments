import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BackblazeStorageProvider } from './backblaze-storage.provider';
import { LocalStorageProvider } from './local-storage.provider';
import { STORAGE_PROVIDER, StorageProvider } from './storage-provider.interface';
import { StorageService } from './storage.service';

@Module({
  providers: [
    StorageService,
    {
      provide: STORAGE_PROVIDER,
      useFactory: (config: ConfigService): StorageProvider =>
        config.get<string>('STORAGE_PROVIDER') === 'local'
          ? new LocalStorageProvider(config)
          : new BackblazeStorageProvider(config),
      inject: [ConfigService],
    },
  ],
  exports: [StorageService],
})
export class StorageModule {}
