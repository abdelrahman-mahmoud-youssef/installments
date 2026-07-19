import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { promises as fs } from 'fs';
import { basename, dirname, join } from 'path';
import { getUploadsDir } from '../../config/uploads-dir';
import { StorageProvider } from './storage-provider.interface';

@Injectable()
export class LocalStorageProvider implements StorageProvider {
  private readonly uploadsDir: string;

  constructor(config: ConfigService) {
    this.uploadsDir = getUploadsDir(config);
  }

  async save(key: string, buffer: Buffer): Promise<string> {
    const filePath = join(this.uploadsDir, key);
    await fs.mkdir(dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, buffer);
    return `/uploads/${key}`;
  }

  async deleteByPrefix(prefix: string): Promise<void> {
    const dir = join(this.uploadsDir, dirname(prefix));
    const filePrefix = basename(prefix);
    let entries: string[];
    try {
      entries = await fs.readdir(dir);
    } catch {
      return;
    }
    const matches = entries.filter((entry) => entry.startsWith(filePrefix));
    await Promise.all(matches.map((entry) => fs.rm(join(dir, entry), { force: true })));
  }
}
