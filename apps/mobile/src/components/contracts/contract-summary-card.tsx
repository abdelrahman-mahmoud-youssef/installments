import { ReactNode } from 'react';
import { View } from 'react-native';
import { ContractDetail } from '@/api/contracts';
import { AppText } from '@/components/ui/app-text';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { ImageThumbnail } from '@/components/ui/image-thumbnail';
import { MoneyText } from '@/components/ui/money-text';
import { ProgressBar } from '@/components/ui/progress-bar';
import { useI18n } from '@/i18n/i18n-context';
import { formatDate, formatNumber, formatPercent } from '@/lib/format';
import { outstandingInstallments } from '@/lib/installment-balance';
import { contractStatusTone } from '@/lib/statuses';
import { spacing } from '@/theme/tokens';

const IMAGE_SIZE = 64;
const STAT_MIN_WIDTH = 96;

interface ContractSummaryCardProps {
  contract: ContractDetail;
}

function Stat({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View style={{ flex: 1, minWidth: STAT_MIN_WIDTH, gap: 2 }}>
      <AppText variant="label" tone="muted">
        {label}
      </AppText>
      {children}
    </View>
  );
}

export function ContractSummaryCard({ contract }: ContractSummaryCardProps) {
  const { t, locale } = useI18n();
  const scheduled = contract.installments.filter((installment) => installment.status !== 'CANCELLED');
  const scheduledTotal = scheduled.reduce((sum, installment) => sum + installment.amount, 0);
  const paidTotal = scheduled.reduce((sum, installment) => sum + installment.paidAmount, 0);
  const paidCount = scheduled.filter((installment) => installment.status === 'PAID').length;
  const ratio = scheduledTotal > 0 ? paidTotal / scheduledTotal : 0;
  const nextDue = outstandingInstallments(contract.installments)[0];

  return (
    <Card>
      <View style={{ gap: spacing.lg }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md }}>
          {contract.imageUrl ? (
            <ImageThumbnail path={contract.imageUrl} label={t('contractDetail.viewImage')} size={IMAGE_SIZE} />
          ) : null}
          <View style={{ flex: 1, gap: spacing.xs }}>
            <AppText variant="title">{contract.productName}</AppText>
            <AppText variant="caption" tone="muted">
              {formatDate(contract.createdAt, locale)}
            </AppText>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
              <Badge label={t(`status.contract.${contract.status}`)} tone={contractStatusTone[contract.status]} />
              {contract.tag ? <Badge label={contract.tag} tone="info" /> : null}
            </View>
          </View>
        </View>

        <View style={{ gap: spacing.sm }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <AppText variant="caption" tone="muted">
              {t('contractDetail.paidInstallments', {
                paid: formatNumber(paidCount, locale),
                total: formatNumber(scheduled.length, locale),
              })}
            </AppText>
            <AppText variant="caption" tone="primary">
              {formatPercent(ratio, locale)}
            </AppText>
          </View>
          <ProgressBar ratio={ratio} height={10} />
        </View>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.lg }}>
          <Stat label={t('contracts.total')}>
            <MoneyText minorUnits={contract.totalAmount} variant="bodyStrong" />
          </Stat>
          <Stat label={t('contracts.paid')}>
            <MoneyText minorUnits={paidTotal} variant="bodyStrong" tone="success" />
          </Stat>
          <Stat label={t('contracts.remaining')}>
            <MoneyText
              minorUnits={Math.max(0, scheduledTotal - paidTotal)}
              variant="bodyStrong"
              tone={scheduledTotal - paidTotal > 0 ? 'warning' : 'success'}
            />
          </Stat>
        </View>

        {nextDue ? (
          <AppText variant="caption" tone="muted">
            {t('contractDetail.nextDue', { date: formatDate(nextDue.dueDate, locale) })}
          </AppText>
        ) : null}
      </View>
    </Card>
  );
}
