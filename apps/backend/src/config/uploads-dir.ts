import { ConfigService } from '@nestjs/config';
import { join } from 'path';

export function getUploadsDir(config: ConfigService): string {
  return config.get<string>('UPLOADS_DIR') ?? join(process.cwd(), 'uploads');
}
