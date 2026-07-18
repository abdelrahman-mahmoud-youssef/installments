import { Injectable } from '@nestjs/common';
import { InstallmentStatus, Prisma } from '@prisma/client';
import { addUtcDays, getUtcToday } from '../../common/date/utc-date';
import { PrismaService } from '../../prisma/prisma.service';

const RECENT_PAYMENTS_LIMIT = 10;
const UPCOMING_WINDOW_DAYS = 7;

export interface DashboardInstallmentSummary {
  id: string;
  contractId: string;
  customerId: string;
  customerName: string;
  productName: string;
  sequence: number;
  dueDate: Date;
  amount: number;
  paidAmount: number;
}

export interface DashboardPaymentSummary {
  id: string;
  contractId: string;
  customerName: string;
  amount: number;
  paidAt: Date;
}

export interface DashboardResponse {
  dueToday: DashboardInstallmentSummary[];
  overdue: DashboardInstallmentSummary[];
  dueNext7Days: DashboardInstallmentSummary[];
  totalExpectedToday: number;
  recentPayments: DashboardPaymentSummary[];
}

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboard(tenantId: string): Promise<DashboardResponse> {
    const today = getUtcToday();
    const next7Days = addUtcDays(today, UPCOMING_WINDOW_DAYS);

    const [dueToday, overdue, dueNext7Days, recentPaymentRows] = await Promise.all([
      this.findOutstandingInstallments(tenantId, today),
      this.findOutstandingInstallments(tenantId, { lt: today }),
      this.findOutstandingInstallments(tenantId, { gt: today, lte: next7Days }),
      this.prisma.payment.findMany({
        where: { tenantId },
        orderBy: { paidAt: 'desc' },
        take: RECENT_PAYMENTS_LIMIT,
        select: {
          id: true,
          contractId: true,
          amount: true,
          paidAt: true,
          contract: { select: { customer: { select: { name: true } } } },
        },
      }),
    ]);

    return {
      dueToday,
      overdue,
      dueNext7Days,
      totalExpectedToday: dueToday.reduce((total, item) => total + (item.amount - item.paidAmount), 0),
      recentPayments: recentPaymentRows.map((payment) => ({
        id: payment.id,
        contractId: payment.contractId,
        customerName: payment.contract.customer.name,
        amount: payment.amount,
        paidAt: payment.paidAt,
      })),
    };
  }

  private async findOutstandingInstallments(
    tenantId: string,
    dueDateFilter: Prisma.InstallmentWhereInput['dueDate'],
  ): Promise<DashboardInstallmentSummary[]> {
    const rows = await this.prisma.installment.findMany({
      where: {
        tenantId,
        status: { in: [InstallmentStatus.PENDING, InstallmentStatus.PARTIALLY_PAID] },
        dueDate: dueDateFilter,
      },
      orderBy: { dueDate: 'asc' },
      select: {
        id: true,
        contractId: true,
        sequence: true,
        dueDate: true,
        amount: true,
        paidAmount: true,
        contract: {
          select: { productName: true, customerId: true, customer: { select: { name: true } } },
        },
      },
    });

    return rows.map((row) => ({
      id: row.id,
      contractId: row.contractId,
      customerId: row.contract.customerId,
      customerName: row.contract.customer.name,
      productName: row.contract.productName,
      sequence: row.sequence,
      dueDate: row.dueDate,
      amount: row.amount,
      paidAmount: row.paidAmount,
    }));
  }
}
