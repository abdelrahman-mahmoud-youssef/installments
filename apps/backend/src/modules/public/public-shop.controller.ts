import { Controller, Get, Param } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../../common/decorators/public.decorator';
import { TenantBranding } from '../../common/tenant-branding';
import { OffersService, PublicOffer } from '../offers/offers.service';
import { PublicService } from './public.service';

@Public()
@Throttle({ default: { limit: 30, ttl: 60_000 } })
@Controller('public/shops')
export class PublicShopController {
  constructor(
    private readonly publicService: PublicService,
    private readonly offersService: OffersService,
  ) {}

  @Get(':slug')
  getShop(@Param('slug') slug: string): Promise<TenantBranding> {
    return this.publicService.getShopBySlug(slug);
  }

  @Get(':slug/offers')
  getOffers(@Param('slug') slug: string): Promise<PublicOffer[]> {
    return this.offersService.findPublicActive(slug);
  }
}
