import { ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { SUBSCRIPTION_INACTIVE_ERROR_CODE } from '../constants';
import { addUtcDays, getUtcToday } from '../date/utc-date';
import { ALLOW_WITHOUT_SUBSCRIPTION_KEY } from '../decorators/allow-without-subscription.decorator';
import { AuthenticatedUser } from '../decorators/current-user.decorator';
import { IS_PLATFORM_ROUTE_KEY } from '../decorators/platform-route.decorator';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { SubscriptionGuard } from './subscription.guard';

function buildUser(subscriptionExpiresOn: Date): AuthenticatedUser {
  return {
    userId: 'user-1',
    tenantId: 'tenant-1',
    role: Role.ADMIN,
    email: 'admin@shop.test',
    name: 'Admin',
    subscriptionExpiresOn,
  };
}

function buildContext(method: string, user?: AuthenticatedUser): ExecutionContext {
  return {
    getHandler: () => function handler() {},
    getClass: () => class Controller {},
    switchToHttp: () => ({ getRequest: () => ({ method, user }) }),
  } as unknown as ExecutionContext;
}

function buildGuard(flaggedKeys: string[] = []): SubscriptionGuard {
  const reflector = {
    getAllAndOverride: (key: string) => flaggedKeys.includes(key),
  } as unknown as Reflector;
  return new SubscriptionGuard(reflector);
}

describe('SubscriptionGuard', () => {
  const expiredUser = buildUser(getUtcToday());
  const activeUser = buildUser(addUtcDays(getUtcToday(), 1));

  it('lets an active shop make changes', () => {
    expect(buildGuard().canActivate(buildContext('POST', activeUser))).toBe(true);
  });

  it('still lets an expired shop read its data', () => {
    expect(buildGuard().canActivate(buildContext('GET', expiredUser))).toBe(true);
  });

  it.each(['POST', 'PATCH', 'PUT', 'DELETE'])('blocks %s from an expired shop with a payment-required code', (method) => {
    try {
      buildGuard().canActivate(buildContext(method, expiredUser));
      throw new Error('Expected the guard to reject the request.');
    } catch (error) {
      expect(error).toBeInstanceOf(HttpException);
      expect((error as HttpException).getStatus()).toBe(HttpStatus.PAYMENT_REQUIRED);
      expect((error as HttpException).getResponse()).toMatchObject({ code: SUBSCRIPTION_INACTIVE_ERROR_CODE });
    }
  });

  it.each([IS_PUBLIC_KEY, IS_PLATFORM_ROUTE_KEY, ALLOW_WITHOUT_SUBSCRIPTION_KEY])(
    'skips routes flagged with %s',
    (key) => {
      expect(buildGuard([key]).canActivate(buildContext('POST'))).toBe(true);
    },
  );
});
