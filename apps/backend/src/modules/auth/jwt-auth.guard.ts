import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PLATFORM_ROUTE_KEY } from '../../common/decorators/platform-route.decorator';
import { IS_PUBLIC_KEY } from '../../common/decorators/public.decorator';
import { PLATFORM_JWT_STRATEGY } from '../platform/platform-jwt.strategy';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly platformJwtGuard = new (AuthGuard(PLATFORM_JWT_STRATEGY))();

  constructor(private readonly reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    if (this.hasRouteFlag(IS_PUBLIC_KEY, context)) {
      return true;
    }
    if (this.hasRouteFlag(IS_PLATFORM_ROUTE_KEY, context)) {
      return this.platformJwtGuard.canActivate(context);
    }
    return super.canActivate(context);
  }

  private hasRouteFlag(key: string, context: ExecutionContext): boolean {
    return this.reflector.getAllAndOverride<boolean>(key, [context.getHandler(), context.getClass()]) === true;
  }
}
