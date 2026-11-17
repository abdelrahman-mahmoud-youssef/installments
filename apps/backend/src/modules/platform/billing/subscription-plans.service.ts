import { Injectable, NotFoundException } from '@nestjs/common';
import { SubscriptionPlan } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateSubscriptionPlanDto } from './dto/create-subscription-plan.dto';
import { UpdateSubscriptionPlanDto } from './dto/update-subscription-plan.dto';

@Injectable()
export class SubscriptionPlansService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(): Promise<SubscriptionPlan[]> {
    return this.prisma.subscriptionPlan.findMany({ orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] });
  }

  async create(dto: CreateSubscriptionPlanDto): Promise<SubscriptionPlan> {
    const sortOrder = dto.sortOrder ?? (await this.prisma.subscriptionPlan.count());
    return this.prisma.subscriptionPlan.create({ data: { ...dto, sortOrder } });
  }

  async update(id: string, dto: UpdateSubscriptionPlanDto): Promise<SubscriptionPlan> {
    await this.findOwned(id);
    return this.prisma.subscriptionPlan.update({ where: { id }, data: dto });
  }

  private async findOwned(id: string): Promise<SubscriptionPlan> {
    const plan = await this.prisma.subscriptionPlan.findUnique({ where: { id } });
    if (!plan) {
      throw new NotFoundException('Plan not found.');
    }
    return plan;
  }
}
