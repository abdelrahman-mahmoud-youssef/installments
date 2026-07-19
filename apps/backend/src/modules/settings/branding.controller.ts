import { Body, Controller, Delete, Get, Patch, Post } from '@nestjs/common';
import { AuthenticatedUser, CurrentUser } from '../../common/decorators/current-user.decorator';
import { BrandingService, TenantBranding } from './branding.service';
import { UpdateBrandingDto } from './dto/update-branding.dto';
import { UploadLogoDto } from './dto/upload-logo.dto';

@Controller('settings/branding')
export class BrandingController {
  constructor(private readonly brandingService: BrandingService) {}

  @Get()
  getBranding(@CurrentUser() user: AuthenticatedUser): Promise<TenantBranding> {
    return this.brandingService.getBranding(user.tenantId);
  }

  @Patch()
  updateBranding(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateBrandingDto,
  ): Promise<TenantBranding> {
    return this.brandingService.updateBranding(user.tenantId, dto);
  }

  @Post('logo')
  uploadLogo(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UploadLogoDto,
  ): Promise<TenantBranding> {
    return this.brandingService.uploadLogo(user.tenantId, dto);
  }

  @Delete('logo')
  removeLogo(@CurrentUser() user: AuthenticatedUser): Promise<TenantBranding> {
    return this.brandingService.removeLogo(user.tenantId);
  }
}
