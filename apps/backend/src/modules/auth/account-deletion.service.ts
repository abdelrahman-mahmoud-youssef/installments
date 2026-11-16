import { BadRequestException, Injectable } from '@nestjs/common';
import { Role, User } from '@prisma/client';
import { getUtcToday } from '../../common/date/utc-date';
import { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { verifyPassword } from '../../common/password';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthService } from './auth.service';
import { DeleteAccountDto } from './dto/delete-account.dto';

@Injectable()
export class AccountDeletionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
  ) {}

  async deleteAccount(authenticatedUser: AuthenticatedUser, dto: DeleteAccountDto): Promise<void> {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: authenticatedUser.userId } });
    await this.verifyIdentity(user, dto);

    if (user.role === Role.ADMIN) {
      await this.deactivateShop(user.tenantId);
      return;
    }
    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id: user.id }, data: { isActive: false } }),
      this.prisma.pushDevice.deleteMany({ where: { userId: user.id } }),
    ]);
  }

  private async verifyIdentity(user: User, dto: DeleteAccountDto): Promise<void> {
    if (!(await verifyPassword(dto.password, user.passwordHash))) {
      throw new BadRequestException('Password is incorrect.');
    }
    if (!user.twoFactorEnabled) {
      return;
    }
    if (!dto.code) {
      throw new BadRequestException('A two-factor code is required.');
    }
    const resolution = await this.authService.resolveTwoFactorCode(user, dto.code);
    if (!resolution.valid) {
      throw new BadRequestException('Invalid or expired code.');
    }
  }

  private async deactivateShop(tenantId: string): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.user.updateMany({ where: { tenantId }, data: { isActive: false } }),
      this.prisma.pushDevice.deleteMany({ where: { tenantId } }),
      this.prisma.tenant.update({ where: { id: tenantId }, data: { subscriptionExpiresOn: getUtcToday() } }),
    ]);
  }
}
