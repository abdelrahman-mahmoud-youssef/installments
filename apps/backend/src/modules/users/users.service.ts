import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import { hashPassword } from '../../common/password';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';

export interface StaffMember {
  id: string;
  email: string;
  isActive: boolean;
  createdAt: Date;
}

const EMAIL_TAKEN_ERROR = 'This email is already in use.';

function toStaffMember(user: { id: string; email: string; isActive: boolean; createdAt: Date }): StaffMember {
  return { id: user.id, email: user.email, isActive: user.isActive, createdAt: user.createdAt };
}

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async listStaff(tenantId: string): Promise<StaffMember[]> {
    const staff = await this.prisma.user.findMany({
      where: { tenantId, role: Role.STAFF },
      orderBy: { createdAt: 'desc' },
      select: { id: true, email: true, isActive: true, createdAt: true },
    });
    return staff.map(toStaffMember);
  }

  async createStaff(tenantId: string, dto: CreateStaffDto): Promise<StaffMember> {
    const passwordHash = await hashPassword(dto.password);
    try {
      const user = await this.prisma.user.create({
        data: { tenantId, email: dto.email, passwordHash, role: Role.STAFF },
        select: { id: true, email: true, isActive: true, createdAt: true },
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

    const user = await this.prisma.user.update({
      where: { id },
      data: { isActive: dto.isActive },
      select: { id: true, email: true, isActive: true, createdAt: true },
    });
    return toStaffMember(user);
  }
}
