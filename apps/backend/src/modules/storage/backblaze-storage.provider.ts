import {
  DeleteObjectsCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StorageProvider } from './storage-provider.interface';

const DEFAULT_REGION = 'us-west-004';

function contentTypeFor(key: string): string {
  return key.endsWith('.png') ? 'image/png' : 'image/jpeg';
}

interface B2Config {
  bucket: string;
  publicUrl: string;
  client: S3Client;
}

@Injectable()
export class BackblazeStorageProvider implements StorageProvider {
  private resolved: B2Config | null = null;

  constructor(private readonly config: ConfigService) {}

  private resolve(): B2Config {
    if (this.resolved) {
      return this.resolved;
    }

    const keyId = this.config.get<string>('B2_KEY_ID');
    const applicationKey = this.config.get<string>('B2_APPLICATION_KEY');
    const endpoint = this.config.get<string>('B2_ENDPOINT');
    const bucket = this.config.get<string>('B2_BUCKET');
    const publicUrl = this.config.get<string>('B2_PUBLIC_URL');

    if (!keyId || !applicationKey || !endpoint || !bucket || !publicUrl) {
      throw new Error(
        'Backblaze B2 storage is not configured. Set B2_KEY_ID, B2_APPLICATION_KEY, B2_ENDPOINT, B2_BUCKET and B2_PUBLIC_URL, or set STORAGE_PROVIDER=local.',
      );
    }

    this.resolved = {
      bucket,
      publicUrl: publicUrl.replace(/\/$/, ''),
      client: new S3Client({
        region: this.config.get<string>('B2_REGION') ?? DEFAULT_REGION,
        endpoint,
        credentials: { accessKeyId: keyId, secretAccessKey: applicationKey },
      }),
    };
    return this.resolved;
  }

  async save(key: string, buffer: Buffer): Promise<string> {
    const { bucket, publicUrl, client } = this.resolve();
    await client.send(
      new PutObjectCommand({ Bucket: bucket, Key: key, Body: buffer, ContentType: contentTypeFor(key) }),
    );
    return `${publicUrl}/${key}`;
  }

  async deleteByPrefix(prefix: string): Promise<void> {
    const { bucket, client } = this.resolve();
    const listed = await client.send(new ListObjectsV2Command({ Bucket: bucket, Prefix: prefix }));
    const objects = (listed.Contents ?? []).flatMap((item) => (item.Key ? [{ Key: item.Key }] : []));
    if (objects.length === 0) {
      return;
    }
    await client.send(new DeleteObjectsCommand({ Bucket: bucket, Delete: { Objects: objects } }));
  }
}
