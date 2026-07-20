import { Controller, Get, HttpStatus, Req, Res } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Request, Response } from 'express';
import { Public } from '../../common/decorators/public.decorator';
import { StorageService } from './storage.service';

const ASSETS_PREFIX = '/assets/';

@Public()
@Throttle({ default: { limit: 60, ttl: 60_000 } })
@Controller('assets')
export class AssetsController {
  constructor(private readonly storage: StorageService) {}

  @Get('*splat')
  async redirectToAsset(@Req() req: Request, @Res() res: Response): Promise<void> {
    const key = req.path.slice(ASSETS_PREFIX.length);
    const url = await this.storage.getAssetUrl(key);
    res.redirect(HttpStatus.FOUND, url);
  }
}
