import {
  DeleteObjectsCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Readable } from 'node:stream';
import { StorageProvider } from './storage-provider.interface';

const SIGNED_URL_EXPIRY_SECONDS = 300;

function contentTypeFor(key: string): string {
  return key.endsWith('.png') ? 'image/png' : 'image/jpeg';
}

async function streamToBuffer(stream: Readable): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

@Injectable()
export class BackblazeStorageProvider implements StorageProvider {
  private readonly bucket: string;
  private readonly client: S3Client;

  constructor(config: ConfigService) {
    this.bucket = config.getOrThrow<string>('B2_BUCKET');
    this.client = new S3Client({
      region: config.getOrThrow<string>('B2_REGION'),
      endpoint: config.getOrThrow<string>('B2_ENDPOINT'),
      forcePathStyle: true,
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
    return `/assets/${key}`;
  }

  async getAssetUrl(key: string): Promise<string> {
    const command = new GetObjectCommand({ Bucket: this.bucket, Key: key });
    return getSignedUrl(this.client, command, { expiresIn: SIGNED_URL_EXPIRY_SECONDS });
  }

  async getAssetBytes(key: string): Promise<{ buffer: Buffer; contentType: string }> {
    const response = await this.client.send(new GetObjectCommand({ Bucket: this.bucket, Key: key }));
    const buffer = await streamToBuffer(response.Body as Readable);
    return { buffer, contentType: contentTypeFor(key) };
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
