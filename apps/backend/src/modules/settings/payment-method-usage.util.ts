import { PaymentDirection } from '@prisma/client';
import { startOfUtcMonth } from '../../common/date/utc-date';
import { PrismaService } from '../../prisma/prisma.service';

export interface PaymentMethodMonthlyUsage {
  paymentTotal: number;
  receivedTotal: number;
  sentTotal: number;
  total: number;
}

export async function getPaymentMethodMonthlyUsage(
  prisma: PrismaService,
  tenantId: string,
  paymentMethodId: string,
  monthStart: Date,
): Promise<PaymentMethodMonthlyUsage> {
  const monthEnd = startOfUtcMonth(monthStart, 1);

  const [paymentSum, receivedSum, sentSum] = await Promise.all([
    prisma.payment.aggregate({
      where: { tenantId, paymentMethodId, paidAt: { gte: monthStart, lt: monthEnd } },
      _sum: { amount: true },
    }),
    prisma.paymentMethodTransaction.aggregate({
      where: {
        tenantId,
        paymentMethodId,
        direction: PaymentDirection.IN,
        occurredAt: { gte: monthStart, lt: monthEnd },
      },
      _sum: { amount: true },
    }),
    prisma.paymentMethodTransaction.aggregate({
      where: {
        tenantId,
        paymentMethodId,
        direction: PaymentDirection.OUT,
        occurredAt: { gte: monthStart, lt: monthEnd },
      },
      _sum: { amount: true },
    }),
  ]);

  const paymentTotal = paymentSum._sum.amount ?? 0;
  const receivedTotal = receivedSum._sum.amount ?? 0;
  const sentTotal = sentSum._sum.amount ?? 0;

  return { paymentTotal, receivedTotal, sentTotal, total: paymentTotal + receivedTotal + sentTotal };
}
