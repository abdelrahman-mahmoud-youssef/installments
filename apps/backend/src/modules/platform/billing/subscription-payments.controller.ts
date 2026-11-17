import { Controller, Get, Query } from '@nestjs/common';
import {
  AuthenticatedPlatformAdmin,
  CurrentPlatformAdmin,
} from '../../../common/decorators/current-platform-admin.decorator';
import { PlatformRoute } from '../../../common/decorators/platform-route.decorator';
import { PlatformPaymentQueryDto } from './dto/platform-payment-query.dto';
import { SubscriptionPaymentsService } from './subscription-payments.service';

@PlatformRoute()
@Controller('platform/payments')
export class SubscriptionPaymentsController {
  constructor(private readonly subscriptionPaymentsService: SubscriptionPaymentsService) {}

  @Get()
  findAll(@CurrentPlatformAdmin() _admin: AuthenticatedPlatformAdmin, @Query() query: PlatformPaymentQueryDto) {
    return this.subscriptionPaymentsService.findAll(query);
  }
}
