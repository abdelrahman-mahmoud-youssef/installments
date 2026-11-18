import { JameyaDueStatus, Prisma } from '@prisma/client';

export const OUTSTANDING_JAMEYA_DUE_STATUSES: JameyaDueStatus[] = [
  JameyaDueStatus.PENDING,
  JameyaDueStatus.PARTIALLY_PAID,
];

export function lateJameyaDueWhere(today: Date): Prisma.JameyaDueWhereInput {
  return {
    status: { in: OUTSTANDING_JAMEYA_DUE_STATUSES },
    cycle: { lateAfter: { lt: today } },
  };
}

export function isJameyaDueLate(status: JameyaDueStatus, lateAfter: Date, today: Date): boolean {
  return OUTSTANDING_JAMEYA_DUE_STATUSES.includes(status) && lateAfter < today;
}
