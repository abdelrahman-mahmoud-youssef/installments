import { Body, Controller, Get, Logger, Param, Patch, Post } from '@nestjs/common';
import {
  AuthenticatedPlatformAdmin,
  CurrentPlatformAdmin,
} from '../../../common/decorators/current-platform-admin.decorator';
import { PlatformRoute } from '../../../common/decorators/platform-route.decorator';
import { CreateSubscriptionOfferDto } from './dto/create-subscription-offer.dto';
import { UpdateSubscriptionOfferDto } from './dto/update-subscription-offer.dto';
import { SubscriptionOffersService } from './subscription-offers.service';

@PlatformRoute()
@Controller('platform/subscription-offers')
export class SubscriptionOffersController {
  private readonly logger = new Logger(SubscriptionOffersController.name);

  constructor(private readonly subscriptionOffersService: SubscriptionOffersService) {}

  @Get()
  findAll(@CurrentPlatformAdmin() _admin: AuthenticatedPlatformAdmin) {
    return this.subscriptionOffersService.findAll();
  }

  @Post()
  async create(@CurrentPlatformAdmin() admin: AuthenticatedPlatformAdmin, @Body() dto: CreateSubscriptionOfferDto) {
    const offer = await this.subscriptionOffersService.create(dto);
    this.logger.log(`Platform admin ${admin.email} created offer ${offer.id}`);
    return offer;
  }

  @Patch(':id')
  async update(
    @CurrentPlatformAdmin() admin: AuthenticatedPlatformAdmin,
    @Param('id') id: string,
    @Body() dto: UpdateSubscriptionOfferDto,
  ) {
    const offer = await this.subscriptionOffersService.update(id, dto);
    this.logger.log(`Platform admin ${admin.email} updated offer ${offer.id}`);
    return offer;
  }
}
