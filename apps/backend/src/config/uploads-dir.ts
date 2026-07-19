import { ConfigService } from '@nestjs/config';

export function getUploadsDir(config: ConfigService): string {
  return config.getOrThrow<string>('UPLOADS_DIR');
}
