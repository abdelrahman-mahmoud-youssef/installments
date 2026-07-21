import { Injectable, NotFoundException } from '@nestjs/common';
import { PaymentMethod } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePaymentMethodDto } from './dto/create-payment-method.dto';
import { UpdatePaymentMethodDto } from './dto/update-payment-method.dto';

@Injectable()
export class PaymentMethodsService {
  constructor(private readonly prisma: PrismaService) {}

  listPaymentMethods(tenantId: string): Promise<PaymentMethod[]> {
    return this.prisma.paymentMethod.findMany({
      where: { tenantId },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
  }

  async createPaymentMethod(tenantId: string, dto: CreatePaymentMethodDto): Promise<PaymentMethod> {
    const count = await this.prisma.paymentMethod.count({ where: { tenantId } });
    return this.prisma.paymentMethod.create({
      data: {
        tenantId,
        label: dto.label,
        details: dto.details,
        presetKey: dto.presetKey,
        sortOrder: count,
      },
    });
  }

  async updatePaymentMethod(
    tenantId: string,
    id: string,
    dto: UpdatePaymentMethodDto,
  ): Promise<PaymentMethod> {
    await this.findOwned(tenantId, id);
    return this.prisma.paymentMethod.update({
      where: { id },
      data: { label: dto.label, details: dto.details, isActive: dto.isActive },
    });
  }

  async deletePaymentMethod(tenantId: string, id: string): Promise<void> {
    await this.findOwned(tenantId, id);
    await this.prisma.paymentMethod.delete({ where: { id } });
  }

  private async findOwned(tenantId: string, id: string): Promise<PaymentMethod> {
    const method = await this.prisma.paymentMethod.findFirst({ where: { id, tenantId } });
    if (!method) {
      throw new NotFoundException('Payment method not found.');
    }
    return method;
  }
}
