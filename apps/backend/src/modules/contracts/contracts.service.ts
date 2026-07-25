import { randomUUID } from 'node:crypto';
import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InstallmentStatus, NotificationLanguage, Prisma } from '@prisma/client';
import { getUtcToday } from '../../common/date/utc-date';
import { MAX_CONTRACT_IMAGE_UPLOAD_BYTES } from '../../common/constants';
import { decodeImageUpload } from '../../common/decode-image-upload';
import { overdueInstallmentWhere } from '../../common/installments/overdue-where';
import { buildPaginatedResult, PaginatedResult } from '../../common/pagination/paginated-result.interface';
import { TenantLocation } from '../../common/tenant-branding';
import { PrismaService } from '../../prisma/prisma.service';
import { ShareLinksService } from '../share-links/share-links.service';
import { StorageService } from '../storage/storage.service';
import { formatContractReminderMessage } from './contract-reminder-message';
import { ContractQueryDto } from './dto/contract-query.dto';
import { CreateContractDto } from './dto/create-contract.dto';
import { generateDueDates } from './installments/recurrence';
import { calculateInstallmentSchedule } from './installments/schedule';

type ContractListItem = Prisma.ContractGetPayload<{
  include: { customer: { select: { id: true; name: true; phone: true } } };
}> & { hasOverdue: boolean };

type ContractDetail = Prisma.ContractGetPayload<{
  include: {
    customer: true;
    installments: true;
    payments: { include: { allocations: true } };
  };
}> & { reminderMessage: string | null };

@Injectable()
export class ContractsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly config: ConfigService,
    private readonly shareLinks: ShareLinksService,
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
          costPrice: createContractDto.costPrice,
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
      ...(query.delayedOnly && { installments: { some: overdueInstallmentWhere(getUtcToday()) } }),
    };

    const [data, total] = await Promise.all([
      this.prisma.contract.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        include: {
          customer: { select: { id: true, name: true, phone: true } },
          installments: { where: overdueInstallmentWhere(getUtcToday()), select: { id: true }, take: 1 },
        },
      }),
      this.prisma.contract.count({ where }),
    ]);

    const items = data.map(({ installments, ...rest }) => ({ ...rest, hasOverdue: installments.length > 0 }));

    return buildPaginatedResult(items, total, query.page, query.limit);
  }

  async findOne(tenantId: string, id: string): Promise<ContractDetail> {
    const contract = await this.prisma.contract.findFirst({
      where: { id, tenantId },
      include: {
        customer: true,
        installments: { orderBy: { sequence: 'asc' } },
        payments: { orderBy: { paidAt: 'desc' }, include: { allocations: true } },
        tenant: { select: { name: true, slug: true, locations: true } },
      },
    });
    if (!contract) {
      throw new NotFoundException('Contract not found.');
    }
    return { ...contract, reminderMessage: await this.buildReminderMessage(contract) };
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

  private async buildReminderMessage(
    contract: Prisma.ContractGetPayload<{
      include: {
        customer: true;
        installments: true;
        tenant: { select: { name: true; slug: true; locations: true } };
      };
    }>,
  ): Promise<string | null> {
    const today = getUtcToday();
    const overdueInstallments = contract.installments
      .filter(
        (installment) =>
          (installment.status === InstallmentStatus.PENDING ||
            installment.status === InstallmentStatus.PARTIALLY_PAID) &&
          installment.dueDate < today,
      )
      .map((installment) => ({
        sequence: installment.sequence,
        remainingAmount: installment.amount - installment.paidAmount,
        dueDate: installment.dueDate,
      }));

    const paidInstallments = contract.installments.filter(
      (installment) => installment.status === InstallmentStatus.PAID,
    ).length;
    const totalRemainingAmount = contract.installments.reduce(
      (sum, installment) => sum + (installment.amount - installment.paidAmount),
      0,
    );

    const locations = (contract.tenant.locations as TenantLocation[] | null) ?? [];
    const location = locations[0] ? { name: locations[0].name, address: locations[0].address, mapUrl: locations[0].mapUrl } : null;

    const localePrefix = contract.customer.notificationLanguage === NotificationLanguage.EN ? '/en' : '';
    const payPath = `${localePrefix}/customer/${contract.customer.publicId}/contracts/${contract.publicId}/pay`;

    const rootDomain = this.config.get<string>('ROOT_DOMAIN');
    const frontendUrl = this.config
      .get<string>('FRONTEND_URL')
      ?.split(',')
      .map((url) => url.trim())
      .filter(Boolean)[0];

    let payUrl: string | null = null;
    if (rootDomain) {
      const { code } = await this.shareLinks.getOrCreate(contract.tenantId, payPath);
      payUrl = `https://${contract.tenant.slug}.${rootDomain}/p/${code}`;
    } else if (frontendUrl) {
      payUrl = `${frontendUrl}${payPath}`;
    }

    return formatContractReminderMessage(
      {
        customerName: contract.customer.name,
        businessName: contract.tenant.name,
        productName: contract.productName,
        paidInstallments,
        totalInstallments: contract.installments.length,
        totalRemainingAmount,
        overdueInstallments,
        location,
        payUrl,
      },
      contract.customer.notificationLanguage,
    );
  }
}
