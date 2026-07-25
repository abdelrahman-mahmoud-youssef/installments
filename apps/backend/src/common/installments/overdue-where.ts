import { InstallmentStatus, Prisma } from '@prisma/client';

export function overdueInstallmentWhere(today: Date): Prisma.InstallmentWhereInput {
  return {
    status: { in: [InstallmentStatus.PENDING, InstallmentStatus.PARTIALLY_PAID] },
    dueDate: { lt: today },
  };
}
