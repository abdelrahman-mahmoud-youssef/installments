import { View } from 'react-native';
import { JameyaPreview } from '@/api/jameyas';
import { AppText } from '@/components/ui/app-text';
import { Card } from '@/components/ui/card';
import { MoneyText } from '@/components/ui/money-text';
import { useI18n } from '@/i18n/i18n-context';
import { formatCalendarDate, formatMoney, formatNumber } from '@/lib/format';
import { useTheme } from '@/theme/theme-context';
import { spacing } from '@/theme/tokens';
import { JameyaFormMember } from './use-jameya-form';

interface JameyaReviewStepProps {
  preview: JameyaPreview;
  members: JameyaFormMember[];
}

function ReviewFigure({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flex: 1, gap: 2 }}>
      <AppText variant="label" tone="muted">
        {label}
      </AppText>
      <AppText variant="heading">{value}</AppText>
    </View>
  );
}

export function JameyaReviewStep({ preview, members }: JameyaReviewStepProps) {
  const { t, locale } = useI18n();
  const { colors } = useTheme();
  const nameOf = (customerId: string) => members.find((member) => member.id === customerId)?.name ?? '';
  const perMemberAmounts = [...new Set(preview.dueAmounts.map((due) => due.amount))];

  return (
    <View style={{ gap: spacing.lg }}>
      <Card>
        <View style={{ flexDirection: 'row', gap: spacing.md }}>
          <ReviewFigure label={t('jameyas.new.review.pot')} value={formatMoney(preview.potAmount, locale)} />
          <ReviewFigure
            label={t('jameyas.new.review.perMember')}
            value={perMemberAmounts.map((amount) => formatMoney(amount, locale)).join(' / ')}
          />
          <ReviewFigure label={t('jameyas.new.review.cycles')} value={formatNumber(preview.cycles.length, locale)} />
        </View>
      </Card>
      <Card>
        <View>
          {preview.cycles.map((cycle, index) => (
            <View
              key={cycle.sequence}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.md,
                paddingVertical: spacing.md,
                borderTopWidth: index === 0 ? 0 : 1,
                borderColor: colors.border,
              }}
            >
              <AppText variant="caption" tone="muted" style={{ minWidth: 28 }}>
                {formatNumber(cycle.sequence, locale)}
              </AppText>
              <View style={{ flex: 1, gap: 2 }}>
                <AppText variant="bodyStrong" numberOfLines={1}>
                  {cycle.holders.map((holder) => nameOf(holder.customerId)).join(' · ')}
                </AppText>
                <AppText variant="caption" tone="muted">
                  {`${t('jameyas.new.review.dueDate')}: ${formatCalendarDate(cycle.dueDate, locale)}`}
                </AppText>
                <AppText variant="caption" tone="muted">
                  {`${t('jameyas.new.review.lateAfter')}: ${formatCalendarDate(cycle.lateAfter, locale)}`}
                </AppText>
              </View>
              <MoneyText
                minorUnits={cycle.holders.reduce((total, holder) => total + holder.entitlementAmount, 0)}
                variant="bodyStrong"
              />
            </View>
          ))}
        </View>
      </Card>
    </View>
  );
}
