'use client';

import { useTranslations } from 'next-intl';
import { StaffMember } from '@/lib/api/staff';

export function StaffWalletAccessSummary({ member }: { member: StaffMember }) {
  const t = useTranslations('staff');

  const summaryByAccess = {
    NONE: t('walletAccessSummaryNone'),
    ALL: t('walletAccessSummaryAll'),
    SELECTED: t('walletAccessSummarySelected', { count: member.paymentMethodIds.length }),
  };

  return <p className="text-xs text-muted-foreground">{summaryByAccess[member.walletAccess]}</p>;
}
