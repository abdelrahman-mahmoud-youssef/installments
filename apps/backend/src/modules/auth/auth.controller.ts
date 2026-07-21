import { Body, Controller, Get, HttpCode, HttpStatus, Patch, Post } from '@nestjs/common';
import { Role } from '@prisma/client';
import { AuthenticatedUser, CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Audit } from '../../common/decorators/audit.decorator';
import {
  AuthService,
  EnableTwoFactorResult,
  LoginResult,
  SetupTwoFactorResult,
} from './auth.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { DisableTwoFactorDto } from './dto/disable-two-factor.dto';
import { EnableTwoFactorDto } from './dto/enable-two-factor.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { VerifyTwoFactorDto } from './dto/verify-two-factor.dto';

export interface CurrentUserResponse {
  id: string;
  name: string;
  email: string;
  tenantId: string;
  role: Role;
  twoFactorEnabled: boolean;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() loginDto: LoginDto): Promise<LoginResult> {
    return this.authService.login(loginDto);
  }

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  register(@Body() registerDto: RegisterDto): Promise<LoginResult> {
    return this.authService.register(registerDto);
  }

  @Get('me')
  getMe(@CurrentUser() user: AuthenticatedUser): Promise<CurrentUserResponse> {
    return this.authService.getCurrentUser(user);
  }

  @Patch('password')
  @HttpCode(HttpStatus.NO_CONTENT)
  changePassword(
    @CurrentUser() user: AuthenticatedUser,
    @Body() changePasswordDto: ChangePasswordDto,
  ): Promise<void> {
    return this.authService.changePassword(user.userId, changePasswordDto);
  }

  @Public()
  @Post('2fa/verify')
  @HttpCode(HttpStatus.OK)
  verifyTwoFactor(@Body() dto: VerifyTwoFactorDto) {
    return this.authService.verifyTwoFactorChallenge(dto);
  }

  @Post('2fa/setup')
  setupTwoFactor(@CurrentUser() user: AuthenticatedUser): Promise<SetupTwoFactorResult> {
    return this.authService.setupTwoFactor(user.userId, user.email);
  }

  @Post('2fa/enable')
  @Audit('auth.2fa_enable', 'User')
  enableTwoFactor(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: EnableTwoFactorDto,
  ): Promise<EnableTwoFactorResult> {
    return this.authService.enableTwoFactor(user.userId, dto);
  }

  @Post('2fa/disable')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Audit('auth.2fa_disable', 'User')
  disableTwoFactor(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: DisableTwoFactorDto,
  ): Promise<void> {
    return this.authService.disableTwoFactor(user.userId, dto);
  }
}
