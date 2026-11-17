import { applyDecorators, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { Roles } from '../../../common/decorators/roles.decorator';
import { WalletAccessGuard } from './wallet-access.guard';

export const WalletRoute = (): MethodDecorator & ClassDecorator =>
  applyDecorators(Roles(Role.ADMIN, Role.STAFF), UseGuards(WalletAccessGuard));
