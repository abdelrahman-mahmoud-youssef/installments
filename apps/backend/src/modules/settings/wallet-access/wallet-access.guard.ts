import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { AuthenticatedUser } from '../../../common/decorators/current-user.decorator';
import { canViewWallets } from './wallet-access';

@Injectable()
export class WalletAccessGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const { user } = context.switchToHttp().getRequest<{ user: AuthenticatedUser }>();
    if (!canViewWallets(user)) {
      throw new ForbiddenException('You do not have access to wallets.');
    }
    return true;
  }
}
