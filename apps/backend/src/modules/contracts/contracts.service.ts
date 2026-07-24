import { randomUUID } from 'node:crypto';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InstallmentStatus, Prisma } from '@prisma/client';
import { MAX_CONTRACT_IMAGE_UPLOAD_BYTES } from '../../common/constants';
import { decodeImageUpload } from '../../common/decode-image-upload';
import { buildPaginatedResult, PaginatedResult } from '../../common/pagination/paginated-result.interface';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { ContractQueryDto } from './dto/contract-query.dto';
import { CreateContractDto } from './dto/create-contract.dto';
import { generateDueDates } from './installments/recurrence';
import { calculateInstallmentSchedule } from './installments/schedule';

type ContractListItem = Prisma.ContractGetPayload<{
  include: { customer: { select: { id: true; name: true; phone: true } } };
}>;

type ContractDetail = Prisma.ContractGetPayload<{
  include: {
    customer: true;
    installments: true;
    payments: { include: { allocations: true } };
  };
}>;

@Injectable()
export class ContractsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  async create(tenantId: string, createContractDto: CreateContractDto): Promise<ContractDetail> {
    const customer = await this.prisma.customer.findFirst({
      where: { id: createContractDto.customerId, tenantId },
    });
    if (!customer) {
      throw new NotFoundException('Customer not found.');
    }

    const imageUrl = createContractDto.image
      ? await this.saveContractImage(tenantId, createContractDto.image)
      : undefined;

    const schedule = calculateInstallmentSchedule({
      calculationMethod: createContractDto.calculationMethod,
      productPrice: createContractDto.productPrice,
      downPayment: createContractDto.downPayment,
      markupPercent: createContractDto.markupPercent,
      installmentCount: createContractDto.installmentCount,
      fixedInstallmentAmount: createContractDto.fixedInstallmentAmount,
    });

    const dueDates = generateDueDates({
      firstPaymentDate: new Date(createContractDto.firstPaymentDate),
      recurrenceType: createContractDto.recurrenceType,
      installmentCount: schedule.installmentAmounts.length,
      intervalDays: createContractDto.intervalDays,
    });

    const contractId = await this.prisma.$transaction(async (tx) => {
      const contract = await tx.contract.create({
        data: {
          tenantId,
          customerId: createContractDto.customerId,
          productName: createContractDto.productName,
          productPrice: createContractDto.productPrice,
          downPayment: createContractDto.downPayment,
          totalAmount: schedule.totalAmount,
          calculationMethod: createContractDto.calculationMethod,
          markupPercent: createContractDto.markupPercent,
          installmentCount: schedule.installmentAmounts.length,
          recurrenceType: createContractDto.recurrenceType,
          intervalDays: createContractDto.intervalDays,
          startDate: new Date(createContractDto.startDate),
          firstPaymentDate: new Date(createContractDto.firstPaymentDate),
          imageUrl,
        },
      });

      await tx.installment.createMany({
        data: schedule.installmentAmounts.map((amount, index) => ({
          tenantId,
          contractId: contract.id,
          sequence: index + 1,
          dueDate: dueDates[index],
          amount,
        })),
      });

      return contract.id;
    });

    return this.findOne(tenantId, contractId);
  }

  async findAll(
    tenantId: string,
    query: ContractQueryDto,
  ): Promise<PaginatedResult<ContractListItem>> {
    const where: Prisma.ContractWhereInput = {
      tenantId,
      ...(query.status && { status: query.status }),
      ...(query.customerId && { customerId: query.customerId }),
    };

    const [data, total] = await Promise.all([
      this.prisma.contract.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        include: { customer: { select: { id: true, name: true, phone: true } } },
      }),
      this.prisma.contract.count({ where }),
    ]);

    return buildPaginatedResult(data, total, query.page, query.limit);
  }

  async findOne(tenantId: string, id: string): Promise<ContractDetail> {
    const contract = await this.prisma.contract.findFirst({
      where: { id, tenantId },
      include: {
        customer: true,
        installments: { orderBy: { sequence: 'asc' } },
        payments: { orderBy: { paidAt: 'desc' }, include: { allocations: true } },
      },
    });
    if (!contract) {
      throw new NotFoundException('Contract not found.');
    }
    return contract;
  }

  async cancel(tenantId: string, id: string): Promise<ContractDetail> {
    const contract = await this.prisma.contract.findFirst({ where: { id, tenantId } });
    if (!contract) {
      throw new NotFoundException('Contract not found.');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.installment.updateMany({
        where: {
          contractId: id,
          status: { in: [InstallmentStatus.PENDING, InstallmentStatus.PARTIALLY_PAID] },
        },
        data: { status: InstallmentStatus.CANCELLED },
      });
      await tx.contract.update({ where: { id }, data: { status: 'CANCELLED' } });
    });

    return this.findOne(tenantId, id);
  }

  private async saveContractImage(tenantId: string, image: string): Promise<string> {
    const { buffer, extension } = decodeImageUpload(image, MAX_CONTRACT_IMAGE_UPLOAD_BYTES);
    return this.storage.saveKeyedImage(`contracts/${tenantId}/${randomUUID()}.${extension}`, buffer);
  }
}
