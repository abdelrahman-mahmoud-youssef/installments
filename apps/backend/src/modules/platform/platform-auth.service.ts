import { HttpException, HttpStatus, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PlatformAdmin } from '@prisma/client';
import { PLATFORM_TOKEN_SCOPE } from '../../common/decorators/current-platform-admin.decorator';
import {
  calculateFailedLoginState,
  formatLockoutMessage,
  secondsUntilUnlock,
} from '../../common/login-lockout';
import { verifyPassword } from '../../common/password';
import { PrismaService } from '../../prisma/prisma.service';
import { LoginDto } from '../auth/dto/login.dto';
import { PlatformJwtPayload } from './platform-jwt.strategy';

export interface PlatformLoginResult {
  accessToken: string;
}

export interface PlatformAdminProfile {
  id: string;
  name: string;
  email: string;
}

const INVALID_CREDENTIALS_MESSAGE = 'Invalid email or password.';

@Injectable()
export class PlatformAuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(dto: LoginDto): Promise<PlatformLoginResult> {
    const admin = await this.prisma.platformAdmin.findUnique({ where: { email: dto.email } });
    if (!admin) {
      throw new UnauthorizedException(INVALID_CREDENTIALS_MESSAGE);
    }

    const secondsRemaining = secondsUntilUnlock(admin.lockedUntil, new Date());
    if (secondsRemaining > 0) {
      throw new HttpException(formatLockoutMessage(secondsRemaining), HttpStatus.TOO_MANY_REQUESTS);
    }

    if (!(await verifyPassword(dto.password, admin.passwordHash))) {
      await this.prisma.platformAdmin.update({
        where: { id: admin.id },
        data: calculateFailedLoginState(admin.failedLoginAttempts, new Date()),
      });
      throw new UnauthorizedException(INVALID_CREDENTIALS_MESSAGE);
    }

    if (admin.failedLoginAttempts > 0 || admin.lockedUntil) {
      await this.prisma.platformAdmin.update({
        where: { id: admin.id },
        data: { failedLoginAttempts: 0, lockedUntil: null },
      });
    }

    return { accessToken: await this.issueToken(admin) };
  }

  async getProfile(platformAdminId: string): Promise<PlatformAdminProfile> {
    return this.prisma.platformAdmin.findUniqueOrThrow({
      where: { id: platformAdminId },
      select: { id: true, name: true, email: true },
    });
  }

  private issueToken(admin: PlatformAdmin): Promise<string> {
    const payload: PlatformJwtPayload = {
      sub: admin.id,
      scope: PLATFORM_TOKEN_SCOPE,
      email: admin.email,
      name: admin.name,
    };
    return this.jwtService.signAsync(payload);
  }
}
