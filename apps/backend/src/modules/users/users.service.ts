import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, Role, WalletAccess } from '@prisma/client';
import { hashPassword } from '../../common/password';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { UpdateStaffWalletAccessDto } from './dto/update-staff-wallet-access.dto';

export interface StaffMember {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  walletAccess: WalletAccess;
  paymentMethodIds: string[];
  createdAt: Date;
}

const EMAIL_TAKEN_ERROR = 'This email is already in use.';
const UNKNOWN_WALLET_ERROR = 'One or more selected wallets no longer exist.';

const STAFF_SELECT = {
  id: true,
  name: true,
  email: true,
  isActive: true,
  walletAccess: true,
  createdAt: true,
  walletGrants: { select: { paymentMethodId: true }, orderBy: { createdAt: 'asc' } },
} as const satisfies Prisma.UserSelect;

type StaffRecord = Prisma.UserGetPayload<{ select: typeof STAFF_SELECT }>;

function toStaffMember(user: StaffRecord): StaffMember {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    isActive: user.isActive,
    walletAccess: user.walletAccess,
    paymentMethodIds: user.walletGrants.map((grant) => grant.paymentMethodId),
    createdAt: user.createdAt,
  };
}

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async listStaff(tenantId: string): Promise<StaffMember[]> {
    const staff = await this.prisma.user.findMany({
      where: { tenantId, role: Role.STAFF },
      orderBy: { createdAt: 'desc' },
      select: STAFF_SELECT,
    });
    return staff.map(toStaffMember);
  }

  async createStaff(tenantId: string, dto: CreateStaffDto): Promise<StaffMember> {
    const passwordHash = await hashPassword(dto.password);
    try {
      const user = await this.prisma.user.create({
        data: { tenantId, name: dto.name, email: dto.email, passwordHash, role: Role.STAFF },
        select: STAFF_SELECT,
      });
      return toStaffMember(user);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new BadRequestException(EMAIL_TAKEN_ERROR);
      }
      throw error;
    }
  }

  async updateStaff(
    tenantId: string,
    requestingUserId: string,
    id: string,
    dto: UpdateStaffDto,
  ): Promise<StaffMember> {
    const target = await this.findManagedStaff(tenantId, requestingUserId, id);
    const user = await this.prisma.user.update({
      where: { id },
      data: { isActive: dto.isActive, deactivatedAt: dto.isActive ? null : (target.deactivatedAt ?? new Date()) },
      select: STAFF_SELECT,
    });
    return toStaffMember(user);
  }

  async updateStaffWalletAccess(
    tenantId: string,
    requestingUserId: string,
    id: string,
    dto: UpdateStaffWalletAccessDto,
  ): Promise<StaffMember> {
    await this.findManagedStaff(tenantId, requestingUserId, id);
    const paymentMethodIds = dto.walletAccess === WalletAccess.SELECTED ? dto.paymentMethodIds : [];
    const ownedWalletCount = await this.prisma.paymentMethod.count({
      where: { tenantId, id: { in: paymentMethodIds } },
    });
    if (ownedWalletCount !== paymentMethodIds.length) {
      throw new BadRequestException(UNKNOWN_WALLET_ERROR);
    }

    const [, , user] = await this.prisma.$transaction([
      this.prisma.staffWalletGrant.deleteMany({ where: { tenantId, userId: id } }),
      this.prisma.staffWalletGrant.createMany({
        data: paymentMethodIds.map((paymentMethodId) => ({ tenantId, userId: id, paymentMethodId })),
      }),
      this.prisma.user.update({ where: { id }, data: { walletAccess: dto.walletAccess }, select: STAFF_SELECT }),
    ]);
    return toStaffMember(user);
  }

  private async findManagedStaff(tenantId: string, requestingUserId: string, id: string) {
    if (id === requestingUserId) {
      throw new BadRequestException('You cannot change your own account here.');
    }

    const target = await this.prisma.user.findFirst({ where: { id, tenantId } });
    if (!target) {
      throw new NotFoundException('Staff account not found.');
    }
    if (target.role !== Role.STAFF) {
      throw new BadRequestException('Admin accounts cannot be managed here.');
    }
    return target;
  }
}
