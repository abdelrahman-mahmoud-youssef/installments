import { Injectable, NotFoundException } from '@nestjs/common';
import { InstallmentStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

const UPCOMING_INSTALLMENTS_LIMIT = 5;

export interface PublicUpcomingInstallment {
  dueDate: Date;
  remainingAmount: number;
}

export interface PublicContractSummary {
  productName: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  paidInstallmentsCount: number;
  upcomingInstallments: PublicUpcomingInstallment[];
}

export interface PublicCustomerResponse {
  name: string;
  contracts: PublicContractSummary[];
}

@Injectable()
export class PublicService {
  constructor(private readonly prisma: PrismaService) {}

  async getCustomerByPublicId(publicId: string): Promise<PublicCustomerResponse> {
    const customer = await this.prisma.customer.findUnique({
      where: { publicId },
      select: {
        name: true,
        contracts: {
          select: {
            productName: true,
            totalAmount: true,
            installments: {
              orderBy: { sequence: 'asc' },
              select: { dueDate: true, amount: true, paidAmount: true, status: true },
            },
          },
        },
      },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found.');
    }

    return { name: customer.name, contracts: customer.contracts.map((contract) => this.summarizeContract(contract)) };
  }

  private summarizeContract(contract: {
    productName: string;
    totalAmount: number;
    installments: { dueDate: Date; amount: number; paidAmount: number; status: InstallmentStatus }[];
  }): PublicContractSummary {
    const paidAmount = contract.installments.reduce((total, installment) => total + installment.paidAmount, 0);
    const upcomingInstallments = contract.installments
      .filter(
        (installment) =>
          installment.status === InstallmentStatus.PENDING ||
          installment.status === InstallmentStatus.PARTIALLY_PAID,
      )
      .slice(0, UPCOMING_INSTALLMENTS_LIMIT)
      .map((installment) => ({
        dueDate: installment.dueDate,
        remainingAmount: installment.amount - installment.paidAmount,
      }));

    return {
      productName: contract.productName,
      totalAmount: contract.totalAmount,
      paidAmount,
      remainingAmount: contract.totalAmount - paidAmount,
      paidInstallmentsCount: contract.installments.filter(
        (installment) => installment.status === InstallmentStatus.PAID,
      ).length,
      upcomingInstallments,
    };
  }
}
