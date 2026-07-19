import {
  DeleteObjectsCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StorageProvider } from './storage-provider.interface';

function contentTypeFor(key: string): string {
  return key.endsWith('.png') ? 'image/png' : 'image/jpeg';
}

@Injectable()
export class BackblazeStorageProvider implements StorageProvider {
  private readonly bucket: string;
  private readonly publicUrl: string;
  private readonly client: S3Client;

  constructor(config: ConfigService) {
    this.bucket = config.getOrThrow<string>('B2_BUCKET');
    this.publicUrl = config.getOrThrow<string>('B2_PUBLIC_URL').replace(/\/$/, '');
    this.client = new S3Client({
      region: config.getOrThrow<string>('B2_REGION'),
      endpoint: config.getOrThrow<string>('B2_ENDPOINT'),
      credentials: {
        accessKeyId: config.getOrThrow<string>('B2_KEY_ID'),
        secretAccessKey: config.getOrThrow<string>('B2_APPLICATION_KEY'),
      },
    });
  }

  async save(key: string, buffer: Buffer): Promise<string> {
    await this.client.send(
      new PutObjectCommand({ Bucket: this.bucket, Key: key, Body: buffer, ContentType: contentTypeFor(key) }),
    );
    return `${this.publicUrl}/${key}`;
  }

  async deleteByPrefix(prefix: string): Promise<void> {
    const listed = await this.client.send(new ListObjectsV2Command({ Bucket: this.bucket, Prefix: prefix }));
    const objects = (listed.Contents ?? []).flatMap((item) => (item.Key ? [{ Key: item.Key }] : []));
    if (objects.length === 0) {
      return;
    }
    await this.client.send(new DeleteObjectsCommand({ Bucket: this.bucket, Delete: { Objects: objects } }));
  }
}
