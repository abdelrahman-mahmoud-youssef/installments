import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '@/components/ui/app-text';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ErrorState } from '@/components/ui/error-state';
import { MoneyText } from '@/components/ui/money-text';
import { PressableScale } from '@/components/ui/pressable-scale';
import { ProgressBar } from '@/components/ui/progress-bar';
import { SectionHeader } from '@/components/ui/section-header';
import { SkeletonCardList } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/toast-context';
import { RecordPaymentSheet } from '@/components/contracts/record-payment-sheet';
import { useContract, useRecordPayment } from '@/hooks/queries';
import { useI18n } from '@/i18n/i18n-context';
import { formatDate, formatDateTime, formatNumber } from '@/lib/format';
import { contractStatusTone, deriveInstallmentStatus, installmentStatusTone } from '@/lib/statuses';
import { useTheme } from '@/theme/theme-context';
import { floatingActionClearance, spacing } from '@/theme/tokens';

export default function ContractDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, locale } = useI18n();
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  const { data, isPending, isError, error, refetch, isRefetching } = useContract(id);
  const recordPayment = useRecordPayment(id);
  const [paymentSheetVisible, setPaymentSheetVisible] = useState(false);

  const totals = useMemo(() => {
    if (!data) {
      return { scheduled: 0, paid: 0 };
    }
    const openInstallments = data.installments.filter((installment) => installment.status !== 'CANCELLED');
    return {
      scheduled: openInstallments.reduce((sum, installment) => sum + installment.amount, 0),
      paid: openInstallments.reduce((sum, installment) => sum + installment.paidAmount, 0),
    };
  }, [data]);

  return (
    <>
      <Stack.Screen options={{ title: data?.productName ?? '' }} />
      <ScrollView
        style={{ backgroundColor: colors.background }}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{
          padding: spacing.xl,
          gap: spacing.xl,
          paddingBottom: spacing.xxxl + floatingActionClearance,
        }}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} tintColor={colors.textMuted} />
        }
      >
        {isPending ? (
          <SkeletonCardList count={3} rows={3} />
        ) : isError ? (
          <ErrorState error={error} onRetry={() => void refetch()} />
        ) : data ? (
          <>
            <Card>
              <View style={{ gap: spacing.lg }}>
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md }}>
                  <View style={{ flex: 1, gap: spacing.xs }}>
                    <AppText variant="title">{data.productName}</AppText>
                    <AppText variant="caption" tone="muted">
                      {formatDate(data.createdAt, locale)}
                    </AppText>
                  </View>
                  <Badge label={t(`status.contract.${data.status}`)} tone={contractStatusTone[data.status]} />
                </View>

                <View style={{ gap: spacing.sm }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <AppText variant="caption" tone="muted">
                      {t('contracts.progress')}
                    </AppText>
                    <AppText variant="caption" tone="muted">
                      {t('contracts.paidOfTotal', {
                        paid: formatNumber(
                          totals.scheduled > 0 ? Math.round((totals.paid / totals.scheduled) * 100) : 0,
                          locale,
                        ) + '%',
                        total: '100%',
                      })}
                    </AppText>
                  </View>
                  <ProgressBar ratio={totals.scheduled > 0 ? totals.paid / totals.scheduled : 0} height={10} />
                </View>

                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.lg }}>
                  <View style={{ flex: 1, minWidth: 100, gap: 2 }}>
                    <AppText variant="label" tone="muted">
                      {t('contracts.total')}
                    </AppText>
                    <MoneyText minorUnits={data.totalAmount} variant="bodyStrong" />
                  </View>
                  <View style={{ flex: 1, minWidth: 100, gap: 2 }}>
                    <AppText variant="label" tone="muted">
                      {t('contracts.paid')}
                    </AppText>
                    <MoneyText minorUnits={totals.paid} variant="bodyStrong" tone="success" />
                  </View>
                  <View style={{ flex: 1, minWidth: 100, gap: 2 }}>
                    <AppText variant="label" tone="muted">
                      {t('contracts.remaining')}
                    </AppText>
                    <MoneyText
                      minorUnits={Math.max(0, totals.scheduled - totals.paid)}
                      variant="bodyStrong"
                      tone={totals.scheduled - totals.paid > 0 ? 'warning' : 'success'}
                    />
                  </View>
                </View>

                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.lg }}>
                  <View style={{ flex: 1, minWidth: 100, gap: 2 }}>
                    <AppText variant="label" tone="muted">
                      {t('contracts.productPrice')}
                    </AppText>
                    <MoneyText minorUnits={data.productPrice} variant="caption" />
                  </View>
                  <View style={{ flex: 1, minWidth: 100, gap: 2 }}>
                    <AppText variant="label" tone="muted">
                      {t('contracts.downPayment')}
                    </AppText>
                    <MoneyText minorUnits={data.downPayment} variant="caption" />
                  </View>
                  <View style={{ flex: 1, minWidth: 100, gap: 2 }}>
                    <AppText variant="label" tone="muted">
                      {t('contracts.installmentsSection')}
                    </AppText>
                    <AppText variant="caption">{formatNumber(data.installmentCount, locale)}</AppText>
                  </View>
                </View>
              </View>
            </Card>

            <View style={{ gap: spacing.md }}>
              <SectionHeader title={t('contracts.customerSection')} />
              <PressableScale
                onPress={() => router.push(`/customer/${data.customer.id}`)}
                accessibilityRole="button"
              >
                <Card>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                    <Avatar name={data.customer.name} />
                    <View style={{ flex: 1, gap: 2 }}>
                      <AppText variant="bodyStrong">{data.customer.name}</AppText>
                      <AppText variant="caption" tone="muted">
                        {data.customer.phone}
                      </AppText>
                    </View>
                  </View>
                </Card>
              </PressableScale>
            </View>

            <View style={{ gap: spacing.md }}>
              <SectionHeader title={t('contracts.installmentsSection')} />
              <Card>
                {data.installments.map((installment, index) => {
                  const derivedStatus = deriveInstallmentStatus(installment);
                  return (
                    <View
                      key={installment.id}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: spacing.md,
                        paddingVertical: spacing.md,
                        borderBottomWidth: index === data.installments.length - 1 ? 0 : 1,
                        borderBottomColor: colors.border,
                      }}
                    >
                      <View style={{ flex: 1, gap: 2 }}>
                        <AppText variant="bodyStrong">
                          {t('contracts.installmentNumber', {
                            sequence: formatNumber(installment.sequence, locale),
                          })}
                        </AppText>
                        <AppText variant="label" tone="faint">
                          {t('contracts.dueOn', { date: formatDate(installment.dueDate, locale) })}
                        </AppText>
                      </View>
                      <View style={{ alignItems: 'flex-end', gap: spacing.xs }}>
                        <MoneyText minorUnits={installment.amount} variant="bodyStrong" />
                        <Badge
                          label={t(`status.installment.${derivedStatus}`)}
                          tone={installmentStatusTone[derivedStatus]}
                        />
                      </View>
                    </View>
                  );
                })}
              </Card>
            </View>

            <View style={{ gap: spacing.md }}>
              <SectionHeader title={t('contracts.paymentsSection')} />
              <Card>
                {data.payments.length === 0 ? (
                  <AppText variant="caption" tone="muted">
                    {t('contracts.noPayments')}
                  </AppText>
                ) : (
                  data.payments.map((payment, index) => (
                    <View
                      key={payment.id}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: spacing.md,
                        paddingVertical: spacing.md,
                        borderBottomWidth: index === data.payments.length - 1 ? 0 : 1,
                        borderBottomColor: colors.border,
                      }}
                    >
                      <View style={{ flex: 1, gap: 2 }}>
                        <AppText variant="caption" tone="muted">
                          {formatDateTime(payment.paidAt, locale)}
                        </AppText>
                        {payment.note ? (
                          <AppText variant="label" tone="faint" numberOfLines={1}>
                            {payment.note}
                          </AppText>
                        ) : null}
                      </View>
                      <MoneyText minorUnits={payment.amount} variant="bodyStrong" tone="success" />
                    </View>
                  ))
                )}
              </Card>
            </View>
          </>
        ) : null}
      </ScrollView>

      {data?.status === 'ACTIVE' ? (
        <View
          pointerEvents="box-none"
          style={{
            position: 'absolute',
            left: spacing.xl,
            right: spacing.xl,
            bottom: insets.bottom + spacing.lg,
          }}
        >
          <Button
            variant="glass"
            title={t('contracts.recordPayment')}
            icon="add-circle-outline"
            onPress={() => setPaymentSheetVisible(true)}
          />
        </View>
      ) : null}

      <RecordPaymentSheet
        visible={paymentSheetVisible}
        contractId={id}
        saving={recordPayment.isPending}
        onClose={() => setPaymentSheetVisible(false)}
        onSubmit={async (input) => {
          await recordPayment.mutateAsync(input);
          setPaymentSheetVisible(false);
          showToast(t('contracts.paymentRecorded'));
        }}
      />
    </>
  );
}
