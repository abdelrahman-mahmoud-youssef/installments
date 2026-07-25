import { ConfigService } from '@nestjs/config';

export function getFrontendOrigin(config: ConfigService): string {
  const [first] = config
    .get<string>('FRONTEND_URL', '')
    .split(',')
    .map((url) => url.trim())
    .filter(Boolean);
  return first ?? 'http://localhost:3000';
}
