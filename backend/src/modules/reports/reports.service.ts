import { Injectable } from '@nestjs/common';
import { InstallmentStatus } from '@prisma/client';
import { addUtcDays, getUtcToday, startOfUtcMonth } from '../../common/date/utc-date';
import { PrismaService } from '../../prisma/prisma.service';
import { ReportQueryDto } from './dto/report-query.dto';

interface OverdueInstallmentRow {
  amount: number;
  paidAmount: number;
  contract: { customerId: string; customer: { name: string; phone: string } };
}

export interface OverdueCustomerSummary {
  customerId: string;
  customerName: string;
  customerPhone: string;
  overdueBalance: number;
  overdueInstallmentCount: number;
}

export interface ReportsResponse {
  todayCollections: number;
  monthlyCollections: number;
  overdueBalance: number;
  overdueCustomers: OverdueCustomerSummary[];
}

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async getReports(tenantId: string, query: ReportQueryDto): Promise<ReportsResponse> {
    const today = getUtcToday();
    const tomorrow = addUtcDays(today, 1);
    const monthStart = this.resolveMonthStart(query.month, today);
    const monthEnd = startOfUtcMonth(monthStart, 1);

    const [todayPayments, monthlyPayments, overdueInstallments] = await Promise.all([
      this.prisma.payment.aggregate({
        where: { tenantId, paidAt: { gte: today, lt: tomorrow } },
        _sum: { amount: true },
      }),
      this.prisma.payment.aggregate({
        where: { tenantId, paidAt: { gte: monthStart, lt: monthEnd } },
        _sum: { amount: true },
      }),
      this.prisma.installment.findMany({
        where: {
          tenantId,
          status: { in: [InstallmentStatus.PENDING, InstallmentStatus.PARTIALLY_PAID] },
          dueDate: { lt: today },
        },
        select: {
          amount: true,
          paidAmount: true,
          contract: { select: { customerId: true, customer: { select: { name: true, phone: true } } } },
        },
      }),
    ]);

    return {
      todayCollections: todayPayments._sum.amount ?? 0,
      monthlyCollections: monthlyPayments._sum.amount ?? 0,
      overdueBalance: overdueInstallments.reduce((total, row) => total + (row.amount - row.paidAmount), 0),
      overdueCustomers: this.groupOverdueByCustomer(overdueInstallments),
    };
  }

  private resolveMonthStart(month: string | undefined, today: Date): Date {
    if (!month) {
      return startOfUtcMonth(today);
    }
    const [year, monthNumber] = month.split('-').map(Number);
    return new Date(Date.UTC(year, monthNumber - 1, 1));
  }

  private groupOverdueByCustomer(overdueInstallments: OverdueInstallmentRow[]): OverdueCustomerSummary[] {
    const balanceByCustomer = new Map<string, OverdueCustomerSummary>();

    for (const installment of overdueInstallments) {
      const balance = installment.amount - installment.paidAmount;
      const existing = balanceByCustomer.get(installment.contract.customerId);

      if (existing) {
        existing.overdueBalance += balance;
        existing.overdueInstallmentCount += 1;
        continue;
      }

      balanceByCustomer.set(installment.contract.customerId, {
        customerId: installment.contract.customerId,
        customerName: installment.contract.customer.name,
        customerPhone: installment.contract.customer.phone,
        overdueBalance: balance,
        overdueInstallmentCount: 1,
      });
    }

    return Array.from(balanceByCustomer.values()).sort((a, b) => b.overdueBalance - a.overdueBalance);
  }
}
