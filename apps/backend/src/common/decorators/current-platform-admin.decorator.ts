import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common';

export const PLATFORM_TOKEN_SCOPE = 'platform';

export interface AuthenticatedPlatformAdmin {
  scope: typeof PLATFORM_TOKEN_SCOPE;
  platformAdminId: string;
  email: string;
  name: string;
}

function isPlatformAdmin(principal: unknown): principal is AuthenticatedPlatformAdmin {
  return (
    typeof principal === 'object' &&
    principal !== null &&
    (principal as { scope?: unknown }).scope === PLATFORM_TOKEN_SCOPE
  );
}

export const CurrentPlatformAdmin = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthenticatedPlatformAdmin => {
    const { user } = context.switchToHttp().getRequest<{ user: unknown }>();
    if (!isPlatformAdmin(user)) {
      throw new UnauthorizedException('Platform access required.');
    }
    return user;
  },
);
