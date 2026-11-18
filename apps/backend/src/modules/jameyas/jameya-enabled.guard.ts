import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { AuthenticatedUser } from '../../common/decorators/current-user.decorator';

@Injectable()
export class JameyaEnabledGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const { user } = context.switchToHttp().getRequest<{ user: AuthenticatedUser }>();
    if (!user.jameyaEnabled) {
      throw new ForbiddenException('Jameya is not enabled for this shop.');
    }
    return true;
  }
}
