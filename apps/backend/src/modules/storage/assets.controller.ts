import { Controller, Get, HttpStatus, Req, Res } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Request, Response } from 'express';
import { Public } from '../../common/decorators/public.decorator';
import { StorageService } from './storage.service';

const ASSETS_PREFIX = '/assets/';
const LOGO_CACHE_CONTROL = 'public, max-age=3600';
const ABOUT_IMAGE_CACHE_CONTROL = 'public, max-age=31536000, immutable';

export function cacheControlFor(key: string): string | null {
  if (key.startsWith('logos/')) {
    return LOGO_CACHE_CONTROL;
  }
  if (key.startsWith('about-images/') || key.startsWith('offer-images/')) {
    return ABOUT_IMAGE_CACHE_CONTROL;
  }
  return null;
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
      const { buffer, contentType } = await this.storage.getAssetBytes(key);
      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', cacheControl);
      res.send(buffer);
      return;
    }

    const url = await this.storage.getAssetUrl(key);
    res.redirect(HttpStatus.FOUND, url);
  }
}
