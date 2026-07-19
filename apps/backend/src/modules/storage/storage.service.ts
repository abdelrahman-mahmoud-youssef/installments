import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { promises as fs } from 'fs';
import { join } from 'path';
import { getUploadsDir } from '../../config/uploads-dir';

@Injectable()
export class StorageService {
  private readonly logosDir: string;

  constructor(config: ConfigService) {
    this.logosDir = join(getUploadsDir(config), 'logos');
  }

  async saveLogo(tenantId: string, buffer: Buffer, extension: string): Promise<string> {
    await fs.mkdir(this.logosDir, { recursive: true });
    await this.deleteLogo(tenantId);
    const fileName = `${tenantId}.${extension}`;
    await fs.writeFile(join(this.logosDir, fileName), buffer);
    return `/uploads/logos/${fileName}`;
  }

  async deleteLogo(tenantId: string): Promise<void> {
    let entries: string[];
    try {
      entries = await fs.readdir(this.logosDir);
    } catch {
      return;
    }
    const matches = entries.filter((entry) => entry.startsWith(`${tenantId}.`));
    await Promise.all(matches.map((entry) => fs.rm(join(this.logosDir, entry), { force: true })));
  }
}
