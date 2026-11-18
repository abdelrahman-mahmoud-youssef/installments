import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Role, WalletAccess } from '@prisma/client';

export interface AuthenticatedUser {
  userId: string;
  tenantId: string;
  role: Role;
  email: string;
  name: string;
  walletAccess: WalletAccess;
  subscriptionExpiresOn: Date;
  jameyaEnabled: boolean;
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthenticatedUser => {
    const request = context.switchToHttp().getRequest<{ user: AuthenticatedUser }>();
    return request.user;
  },
);
