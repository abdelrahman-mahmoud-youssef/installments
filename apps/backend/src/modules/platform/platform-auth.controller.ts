import { Body, Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  AuthenticatedPlatformAdmin,
  CurrentPlatformAdmin,
} from '../../common/decorators/current-platform-admin.decorator';
import { PlatformRoute } from '../../common/decorators/platform-route.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { LoginDto } from '../auth/dto/login.dto';
import { PlatformAdminProfile, PlatformAuthService, PlatformLoginResult } from './platform-auth.service';

@PlatformRoute()
@Controller('platform/auth')
export class PlatformAuthController {
  constructor(private readonly platformAuthService: PlatformAuthService) {}

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto): Promise<PlatformLoginResult> {
    return this.platformAuthService.login(dto);
  }

  @Get('me')
  getProfile(@CurrentPlatformAdmin() admin: AuthenticatedPlatformAdmin): Promise<PlatformAdminProfile> {
    return this.platformAuthService.getProfile(admin.platformAdminId);
  }
}
