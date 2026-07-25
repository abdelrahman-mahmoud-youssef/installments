import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../../common/decorators/public.decorator';
import { ResolvedShareLink, ShareLinksService } from '../share-links/share-links.service';

@Public()
@Throttle({ default: { limit: 30, ttl: 60_000 } })
@Controller('public/share-links')
export class PublicShareLinkController {
  constructor(private readonly shareLinksService: ShareLinksService) {}

  @Get(':code')
  async resolve(@Param('code') code: string): Promise<ResolvedShareLink> {
    const resolved = await this.shareLinksService.resolve(code);
    if (!resolved) {
      throw new NotFoundException('Link not found.');
    }
    return resolved;
  }
}
