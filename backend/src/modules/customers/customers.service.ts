import { Injectable, NotFoundException } from '@nestjs/common';
import { Customer, Prisma } from '@prisma/client';
import { buildPaginatedResult, PaginatedResult } from '../../common/pagination/paginated-result.interface';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { CustomerQueryDto } from './dto/customer-query.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, createCustomerDto: CreateCustomerDto): Promise<Customer> {
    return this.prisma.customer.create({ data: { ...createCustomerDto, tenantId } });
  }

  async findAll(tenantId: string, query: CustomerQueryDto): Promise<PaginatedResult<Customer>> {
    const where: Prisma.CustomerWhereInput = {
      tenantId,
      ...(query.q && {
        OR: [
          { name: { contains: query.q, mode: 'insensitive' } },
          { phone: { contains: query.q } },
        ],
      }),
    };

    const [data, total] = await Promise.all([
      this.prisma.customer.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.customer.count({ where }),
    ]);

    return buildPaginatedResult(data, total, query.page, query.limit);
  }

  async findOne(
    tenantId: string,
    id: string,
  ): Promise<Prisma.CustomerGetPayload<{ include: { contracts: true } }>> {
    const customer = await this.prisma.customer.findFirst({
      where: { id, tenantId },
      include: { contracts: true },
    });
    if (!customer) {
      throw new NotFoundException('Customer not found.');
    }
    return customer;
  }

  async update(tenantId: string, id: string, updateCustomerDto: UpdateCustomerDto): Promise<Customer> {
    await this.ensureExists(tenantId, id);
    return this.prisma.customer.update({ where: { id }, data: updateCustomerDto });
  }

  async remove(tenantId: string, id: string): Promise<void> {
    await this.ensureExists(tenantId, id);
    await this.prisma.customer.delete({ where: { id } });
  }

  private async ensureExists(tenantId: string, id: string): Promise<void> {
    const customer = await this.prisma.customer.findFirst({ where: { id, tenantId } });
    if (!customer) {
      throw new NotFoundException('Customer not found.');
    }
  }
}
