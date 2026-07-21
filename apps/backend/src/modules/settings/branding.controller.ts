import { Body, Controller, Delete, Get, Patch, Post } from '@nestjs/common';
import { Role } from '@prisma/client';
import { Audit } from '../../common/decorators/audit.decorator';
import { AuthenticatedUser, CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { BrandingService, TenantBranding } from './branding.service';
import { UpdateBrandingDto } from './dto/update-branding.dto';
import { UploadLogoDto } from './dto/upload-logo.dto';

@Controller('settings/branding')
@Roles(Role.ADMIN)
export class BrandingController {
  constructor(private readonly brandingService: BrandingService) {}

  @Get()
  getBranding(@CurrentUser() user: AuthenticatedUser): Promise<TenantBranding> {
    return this.brandingService.getBranding(user.tenantId);
  }

  @Patch()
  @Audit('settings.branding.update', 'Tenant')
  updateBranding(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateBrandingDto,
  ): Promise<TenantBranding> {
    return this.brandingService.updateBranding(user.tenantId, dto);
  }

  @Post('logo')
  @Audit('settings.branding.logo_upload', 'Tenant')
  uploadLogo(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UploadLogoDto,
  ): Promise<TenantBranding> {
    return this.brandingService.uploadLogo(user.tenantId, dto);
  }

  @Delete('logo')
  @Audit('settings.branding.logo_remove', 'Tenant')
  removeLogo(@CurrentUser() user: AuthenticatedUser): Promise<TenantBranding> {
    return this.brandingService.removeLogo(user.tenantId);
  }
}
