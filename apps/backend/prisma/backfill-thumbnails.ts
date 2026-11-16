import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';
import { BackblazeStorageProvider } from '../src/modules/storage/backblaze-storage.provider';
import { extractAssetKey } from '../src/modules/storage/asset-key';
import { LocalStorageProvider } from '../src/modules/storage/local-storage.provider';
import { StorageProvider } from '../src/modules/storage/storage-provider.interface';
import { StorageService } from '../src/modules/storage/storage.service';

const CONCURRENCY = 4;
const isDryRun = process.argv.includes('--dry-run');

const prisma = new PrismaClient();
const config = new ConfigService();

function createStorageProvider(): StorageProvider {
  return config.getOrThrow<string>('STORAGE_PROVIDER') === 'local'
    ? new LocalStorageProvider(config)
    : new BackblazeStorageProvider(config);
}

async function collectPhotoKeys(): Promise<string[]> {
  const [customers, contracts, offers, counterparties] = await Promise.all([
    prisma.customer.findMany({ where: { photoUrl: { not: null } }, select: { photoUrl: true } }),
    prisma.contract.findMany({ where: { imageUrl: { not: null } }, select: { imageUrl: true } }),
    prisma.offer.findMany({ select: { images: true } }),
    prisma.counterparty.findMany({ where: { photoUrl: { not: null } }, select: { photoUrl: true } }),
  ]);
  const urls = [
    ...customers.map((row) => row.photoUrl),
    ...contracts.map((row) => row.imageUrl),
    ...offers.flatMap((row) => row.images),
    ...counterparties.map((row) => row.photoUrl),
  ];
  const keys = urls.map(extractAssetKey).filter((key): key is string => key !== null);
  return [...new Set(keys)];
}

async function backfill(): Promise<void> {
  const storage = new StorageService(createStorageProvider());
  const keys = await collectPhotoKeys();
  console.log(`${keys.length} stored photos found${isDryRun ? ' (dry run, nothing will be written)' : ''}.`);
  if (isDryRun) {
    return;
  }

  let created = 0;
  let failed = 0;
  for (let index = 0; index < keys.length; index += CONCURRENCY) {
    const batch = keys.slice(index, index + CONCURRENCY);
    const results = await Promise.allSettled(batch.map((key) => storage.regenerateThumbnails(key)));
    results.forEach((result, position) => {
      if (result.status === 'fulfilled') {
        created += 1;
        return;
      }
      failed += 1;
      console.warn(`Failed for ${batch[position]}: ${result.reason instanceof Error ? result.reason.message : result.reason}`);
    });
  }
  console.log(`Thumbnails processed for ${created} photos, ${failed} failed.`);
}

backfill()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
