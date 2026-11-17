import { Body, Controller, Get, Logger, Param, Patch, Post } from '@nestjs/common';
import {
  AuthenticatedPlatformAdmin,
  CurrentPlatformAdmin,
} from '../../../common/decorators/current-platform-admin.decorator';
import { PlatformRoute } from '../../../common/decorators/platform-route.decorator';
import { CreateSubscriptionPlanDto } from './dto/create-subscription-plan.dto';
import { UpdateSubscriptionPlanDto } from './dto/update-subscription-plan.dto';
import { SubscriptionPlansService } from './subscription-plans.service';

@PlatformRoute()
@Controller('platform/subscription-plans')
export class SubscriptionPlansController {
  private readonly logger = new Logger(SubscriptionPlansController.name);

  constructor(private readonly subscriptionPlansService: SubscriptionPlansService) {}

  @Get()
  findAll(@CurrentPlatformAdmin() _admin: AuthenticatedPlatformAdmin) {
    return this.subscriptionPlansService.findAll();
  }

  @Post()
  async create(@CurrentPlatformAdmin() admin: AuthenticatedPlatformAdmin, @Body() dto: CreateSubscriptionPlanDto) {
    const plan = await this.subscriptionPlansService.create(dto);
    this.logger.log(`Platform admin ${admin.email} created plan ${plan.id}`);
    return plan;
  }

  @Patch(':id')
  async update(
    @CurrentPlatformAdmin() admin: AuthenticatedPlatformAdmin,
    @Param('id') id: string,
    @Body() dto: UpdateSubscriptionPlanDto,
  ) {
    const plan = await this.subscriptionPlansService.update(id, dto);
    this.logger.log(`Platform admin ${admin.email} updated plan ${plan.id}`);
    return plan;
  }
}
