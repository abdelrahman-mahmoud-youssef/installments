import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PaymentMethod, Prisma } from '@prisma/client';
import { getUtcToday, startOfUtcMonth } from '../../common/date/utc-date';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePaymentMethodDto } from './dto/create-payment-method.dto';
import { UpdatePaymentMethodDto } from './dto/update-payment-method.dto';

const PRESET_ALREADY_ADDED_ERROR = 'This payment method has already been added.';
const IN_USE_ERROR =
  'This payment method has payment or transaction history and can’t be deleted — deactivate it instead.';

export type PaymentMethodWithUsage = PaymentMethod & { monthToDateUsage: number };

@Injectable()
export class PaymentMethodsService {
  constructor(private readonly prisma: PrismaService) {}

  async listPaymentMethods(tenantId: string): Promise<PaymentMethodWithUsage[]> {
    const methods = await this.prisma.paymentMethod.findMany({
      where: { tenantId },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });

    const limitedMethodIds = methods.filter((method) => method.monthlyLimit != null).map((method) => method.id);
    if (limitedMethodIds.length === 0) {
      return methods.map((method) => ({ ...method, monthToDateUsage: 0 }));
    }

    const usageByMethodId = await this.getMonthToDateUsageByMethod(tenantId, limitedMethodIds);
    return methods.map((method) => ({ ...method, monthToDateUsage: usageByMethodId.get(method.id) ?? 0 }));
  }

  private async getMonthToDateUsageByMethod(
    tenantId: string,
    paymentMethodIds: string[],
  ): Promise<Map<string, number>> {
    const monthStart = startOfUtcMonth(getUtcToday());
    const monthEnd = startOfUtcMonth(monthStart, 1);

    const [paymentSums, transactionSums] = await Promise.all([
      this.prisma.payment.groupBy({
        by: ['paymentMethodId'],
        where: { tenantId, paymentMethodId: { in: paymentMethodIds }, paidAt: { gte: monthStart, lt: monthEnd } },
        _sum: { amount: true },
      }),
      this.prisma.paymentMethodTransaction.groupBy({
        by: ['paymentMethodId'],
        where: { tenantId, paymentMethodId: { in: paymentMethodIds }, occurredAt: { gte: monthStart, lt: monthEnd } },
        _sum: { amount: true },
      }),
    ]);

    const usageByMethodId = new Map<string, number>();
    for (const row of paymentSums) {
      if (row.paymentMethodId) {
        usageByMethodId.set(row.paymentMethodId, (usageByMethodId.get(row.paymentMethodId) ?? 0) + (row._sum.amount ?? 0));
      }
    }
    for (const row of transactionSums) {
      usageByMethodId.set(row.paymentMethodId, (usageByMethodId.get(row.paymentMethodId) ?? 0) + (row._sum.amount ?? 0));
    }
    return usageByMethodId;
  }

  async createPaymentMethod(tenantId: string, dto: CreatePaymentMethodDto): Promise<PaymentMethod> {
    const count = await this.prisma.paymentMethod.count({ where: { tenantId } });
    try {
      return await this.prisma.paymentMethod.create({
        data: {
          tenantId,
          label: dto.label,
          details: dto.details,
          presetKey: dto.presetKey,
          monthlyLimit: dto.monthlyLimit,
          sortOrder: count,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new BadRequestException(PRESET_ALREADY_ADDED_ERROR);
      }
      throw error;
    }
  }

  async updatePaymentMethod(
    tenantId: string,
    id: string,
    dto: UpdatePaymentMethodDto,
  ): Promise<PaymentMethod> {
    await this.findOwned(tenantId, id);
    return this.prisma.paymentMethod.update({
      where: { id },
      data: { label: dto.label, details: dto.details, isActive: dto.isActive, monthlyLimit: dto.monthlyLimit },
    });
  }

  async deletePaymentMethod(tenantId: string, id: string): Promise<void> {
    await this.findOwned(tenantId, id);
    try {
      await this.prisma.paymentMethod.delete({ where: { id } });
    } catch (error) {
      if (this.isForeignKeyRestrictionError(error)) {
        throw new BadRequestException(IN_USE_ERROR);
      }
      throw error;
    }
  }

  private isForeignKeyRestrictionError(error: unknown): boolean {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
      return true;
    }
    return error instanceof Prisma.PrismaClientUnknownRequestError && /foreign key constraint/i.test(error.message);
  }

  private async findOwned(tenantId: string, id: string): Promise<PaymentMethod> {
    const method = await this.prisma.paymentMethod.findFirst({ where: { id, tenantId } });
    if (!method) {
      throw new NotFoundException('Payment method not found.');
    }
    return method;
  }
}
