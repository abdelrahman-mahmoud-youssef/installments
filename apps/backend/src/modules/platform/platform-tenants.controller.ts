import { Controller, Get, HttpCode, HttpStatus, Param, Post, Query } from '@nestjs/common';
import {
  AuthenticatedPlatformAdmin,
  CurrentPlatformAdmin,
} from '../../common/decorators/current-platform-admin.decorator';
import { PlatformRoute } from '../../common/decorators/platform-route.decorator';
import { PlatformTenantQueryDto } from './dto/platform-tenant-query.dto';
import { PlatformTenantSubscriptionQueryDto } from './dto/platform-tenant-subscription-query.dto';
import { PlatformTenantsService } from './platform-tenants.service';

@PlatformRoute()
@Controller('platform/tenants')
export class PlatformTenantsController {
  constructor(private readonly platformTenantsService: PlatformTenantsService) {}

  @Get()
  findAll(@CurrentPlatformAdmin() _admin: AuthenticatedPlatformAdmin, @Query() query: PlatformTenantQueryDto) {
    return this.platformTenantsService.findAll(query);
  }

  @Post(':tenantId/activate')
  @HttpCode(HttpStatus.OK)
  activate(@CurrentPlatformAdmin() admin: AuthenticatedPlatformAdmin, @Param('tenantId') tenantId: string) {
    return this.platformTenantsService.activate(admin, tenantId);
  }

  @Post(':tenantId/deactivate')
  @HttpCode(HttpStatus.OK)
  deactivate(@CurrentPlatformAdmin() admin: AuthenticatedPlatformAdmin, @Param('tenantId') tenantId: string) {
    return this.platformTenantsService.deactivate(admin, tenantId);
  }

  @Get(':tenantId/subscriptions')
  findSubscriptions(
    @CurrentPlatformAdmin() _admin: AuthenticatedPlatformAdmin,
    @Param('tenantId') tenantId: string,
    @Query() query: PlatformTenantSubscriptionQueryDto,
  ) {
    return this.platformTenantsService.findSubscriptions(tenantId, query);
  }
}
