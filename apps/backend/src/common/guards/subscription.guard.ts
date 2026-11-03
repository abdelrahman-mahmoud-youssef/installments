import { CanActivate, ExecutionContext, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SUBSCRIPTION_INACTIVE_ERROR_CODE } from '../constants';
import { getUtcToday } from '../date/utc-date';
import { ALLOW_WITHOUT_SUBSCRIPTION_KEY } from '../decorators/allow-without-subscription.decorator';
import { AuthenticatedUser } from '../decorators/current-user.decorator';
import { IS_PLATFORM_ROUTE_KEY } from '../decorators/platform-route.decorator';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { isSubscriptionActive } from '../subscription/subscription';

const READ_ONLY_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

const EXEMPT_ROUTE_KEYS = [IS_PUBLIC_KEY, IS_PLATFORM_ROUTE_KEY, ALLOW_WITHOUT_SUBSCRIPTION_KEY];

@Injectable()
export class SubscriptionGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    if (this.isExemptRoute(context)) {
      return true;
    }

    const { method, user } = context.switchToHttp().getRequest<{ method: string; user: AuthenticatedUser }>();
    if (READ_ONLY_METHODS.has(method) || isSubscriptionActive(user.subscriptionExpiresOn, getUtcToday())) {
      return true;
    }

    throw new HttpException(
      {
        statusCode: HttpStatus.PAYMENT_REQUIRED,
        error: 'Payment Required',
        message: 'Your subscription has expired. Renew it to keep making changes.',
        code: SUBSCRIPTION_INACTIVE_ERROR_CODE,
      },
      HttpStatus.PAYMENT_REQUIRED,
    );
  }

  private isExemptRoute(context: ExecutionContext): boolean {
    const targets = [context.getHandler(), context.getClass()];
    return EXEMPT_ROUTE_KEYS.some((key) => this.reflector.getAllAndOverride<boolean>(key, targets) === true);
  }
}
