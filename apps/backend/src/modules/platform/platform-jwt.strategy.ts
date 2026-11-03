import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import {
  AuthenticatedPlatformAdmin,
  PLATFORM_TOKEN_SCOPE,
} from '../../common/decorators/current-platform-admin.decorator';
import { PrismaService } from '../../prisma/prisma.service';

export const PLATFORM_JWT_STRATEGY = 'platform-jwt';

export interface PlatformJwtPayload {
  sub: string;
  scope: typeof PLATFORM_TOKEN_SCOPE;
  email: string;
  name: string;
}

@Injectable()
export class PlatformJwtStrategy extends PassportStrategy(Strategy, PLATFORM_JWT_STRATEGY) {
  constructor(
    config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_SECRET'),
    });
  }

  async validate(payload: Partial<PlatformJwtPayload>): Promise<AuthenticatedPlatformAdmin> {
    if (payload.scope !== PLATFORM_TOKEN_SCOPE || !payload.sub) {
      throw new UnauthorizedException('Invalid token.');
    }
    const admin = await this.prisma.platformAdmin.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, name: true },
    });
    if (!admin) {
      throw new UnauthorizedException('Invalid token.');
    }
    return { scope: PLATFORM_TOKEN_SCOPE, platformAdminId: admin.id, email: admin.email, name: admin.name };
  }
}
