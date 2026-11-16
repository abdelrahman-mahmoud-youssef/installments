import { Controller, Get, HttpStatus, Req, Res } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Request, Response } from 'express';
import { Public } from '../../common/decorators/public.decorator';
import { StorageService } from './storage.service';

const ASSETS_PREFIX = '/assets/';
const PUBLIC_SHORT_CACHE_CONTROL = 'public, max-age=3600';
const PUBLIC_IMMUTABLE_CACHE_CONTROL = 'public, max-age=31536000, immutable';
const PRIVATE_IMMUTABLE_CACHE_CONTROL = 'private, max-age=31536000, immutable';
const PRIVATE_DAILY_CACHE_CONTROL = 'private, max-age=86400';
const FALLBACK_CACHE_CONTROL = 'private, max-age=300';

const CACHE_CONTROL_BY_KEY_PREFIX: readonly { prefix: string; cacheControl: string }[] = [
  { prefix: 'logos/', cacheControl: PUBLIC_SHORT_CACHE_CONTROL },
  { prefix: 'about-images/', cacheControl: PUBLIC_IMMUTABLE_CACHE_CONTROL },
  { prefix: 'offer-images/', cacheControl: PUBLIC_IMMUTABLE_CACHE_CONTROL },
  { prefix: 'customer-photos/', cacheControl: PRIVATE_IMMUTABLE_CACHE_CONTROL },
  { prefix: 'contact-photos/', cacheControl: PRIVATE_IMMUTABLE_CACHE_CONTROL },
  { prefix: 'contracts/', cacheControl: PRIVATE_IMMUTABLE_CACHE_CONTROL },
  { prefix: 'payment-claims/', cacheControl: PRIVATE_DAILY_CACHE_CONTROL },
  { prefix: 'payment-method-transactions/', cacheControl: PRIVATE_DAILY_CACHE_CONTROL },
  { prefix: 'support-images/', cacheControl: PRIVATE_DAILY_CACHE_CONTROL },
];

export function cacheControlFor(key: string): string | null {
  return CACHE_CONTROL_BY_KEY_PREFIX.find(({ prefix }) => key.startsWith(prefix))?.cacheControl ?? null;
}

@Public()
@Throttle({ default: { limit: 60, ttl: 60_000 } })
@Controller('assets')
export class AssetsController {
  constructor(private readonly storage: StorageService) {}

  @Get('*splat')
  async serveAsset(@Req() req: Request, @Res() res: Response): Promise<void> {
    const key = req.path.slice(ASSETS_PREFIX.length);
    const cacheControl = cacheControlFor(key);

    if (cacheControl) {
      const { buffer, contentType, isFallback } = await this.storage.getAssetBytes(key);
      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', isFallback ? FALLBACK_CACHE_CONTROL : cacheControl);
      res.send(buffer);
      return;
    }

    const url = await this.storage.getAssetUrl(key);
    res.redirect(HttpStatus.FOUND, url);
  }
}
