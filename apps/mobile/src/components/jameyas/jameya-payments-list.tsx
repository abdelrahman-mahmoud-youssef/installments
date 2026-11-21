import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { View } from 'react-native';
import { JameyaDetail } from '@/api/jameyas';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ErrorState } from '@/components/ui/error-state';
import { ImageThumbnail } from '@/components/ui/image-thumbnail';
import { MoneyText } from '@/components/ui/money-text';
import { SkeletonCardList } from '@/components/ui/skeleton';
import { useJameyaPayments } from '@/hooks/queries';
import { useI18n } from '@/i18n/i18n-context';
import { formatCalendarDate } from '@/lib/format';
import { jameyaMemberName } from '@/lib/jameya';
import { useTheme } from '@/theme/theme-context';
import { radius, spacing } from '@/theme/tokens';
import { JameyaReceiptIconButton } from './jameya-receipt-icon-button';
import { useShareJameyaReceipt } from './use-share-jameya-receipt';

const RECEIPT_THUMBNAIL_SIZE = 36;

export function JameyaPaymentsList({ jameya }: { jameya: JameyaDetail }) {
  const { t, locale } = useI18n();
  const { colors } = useTheme();
  const query = useJameyaPayments(jameya.id);
  const { sharePaymentReceipt, canShare } = useShareJameyaReceipt(jameya.name);
  const payments = useMemo(() => query.data?.pages.flatMap((page) => page.data) ?? [], [query.data]);

  if (query.isPending) {
    return <SkeletonCardList count={2} rows={2} />;
  }
  if (!query.data) {
    return <ErrorState error={query.error} onRetry={() => void query.refetch()} />;
  }
  if (payments.length === 0) {
    return (
      <Card>
        <AppText variant="caption" tone="muted">
          {t('jameyas.detail.noPayments')}
        </AppText>
      </Card>
    );
  }

  return (
    <Card>
      <View style={{ gap: spacing.md }}>
        {payments.map((payment) => {
          const memberName = jameyaMemberName(jameya, payment.customerId);
          return (
            <View key={payment.id} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: radius.full,
                  backgroundColor: colors.successMuted,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="receipt-outline" size={18} color={colors.success} />
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <AppText variant="bodyStrong" numberOfLines={1}>
                  {memberName}
                </AppText>
                <AppText variant="caption" tone="muted">
                  {formatCalendarDate(payment.paidAt, locale)}
                </AppText>
                {payment.note ? (
                  <AppText variant="caption" tone="muted">
                    {payment.note}
                  </AppText>
                ) : null}
              </View>
              <MoneyText minorUnits={payment.amount} variant="bodyStrong" tone="success" />
              {payment.receiptUrl ? (
                <ImageThumbnail path={payment.receiptUrl} label={t('jameyas.detail.viewReceipt')} size={RECEIPT_THUMBNAIL_SIZE} />
              ) : null}
              <JameyaReceiptIconButton
                disabled={!canShare}
                onPress={() =>
                  void sharePaymentReceipt({
                    memberName,
                    amount: payment.amount,
                    paidAt: payment.paidAt,
                    note: payment.note,
                    balanceAfter: payment.balanceAfter,
                  })
                }
              />
            </View>
          );
        })}
        {query.hasNextPage ? (
          <Button
            title={t('common.loadMore')}
            variant="ghost"
            loading={query.isFetchingNextPage}
            onPress={() => void query.fetchNextPage()}
          />
        ) : null}
      </View>
    </Card>
  );
}
