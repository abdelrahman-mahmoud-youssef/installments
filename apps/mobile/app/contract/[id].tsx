import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/auth/auth-context';
import { ContractActions } from '@/components/contracts/contract-actions';
import { ContractDetailsCard } from '@/components/contracts/contract-details-card';
import { ContractPaymentsList } from '@/components/contracts/contract-payments-list';
import { ContractSummaryCard } from '@/components/contracts/contract-summary-card';
import { InstallmentScheduleList } from '@/components/contracts/installment-schedule-list';
import { RecordPaymentSheet } from '@/components/contracts/record-payment-sheet';
import { AppText } from '@/components/ui/app-text';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ErrorState } from '@/components/ui/error-state';
import { FloatingActionBar } from '@/components/ui/floating-action-bar';
import { PressableScale } from '@/components/ui/pressable-scale';
import { SectionHeader } from '@/components/ui/section-header';
import { SkeletonCardList } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/toast-context';
import { useContract, useRecordPayment } from '@/hooks/queries';
import { useI18n } from '@/i18n/i18n-context';
import { useTheme } from '@/theme/theme-context';
import { floatingActionClearance, spacing } from '@/theme/tokens';
import { isolateLtr } from '@/lib/format';

export default function ContractDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useI18n();
  const { colors } = useTheme();
  const { isAdmin } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();
  const { data, isPending, isError, error, refetch, isRefetching } = useContract(id);
  const recordPayment = useRecordPayment(id);
  const [isPaymentSheetOpen, setIsPaymentSheetOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <>
      <Stack.Screen
        options={{
          title: data?.productName ?? '',
          headerRight: data
            ? () => (
                <PressableScale
                  onPress={() => setIsMenuOpen(true)}
                  accessibilityRole="button"
                  accessibilityLabel={t('contractDetail.moreActions')}
                  hitSlop={spacing.sm}
                >
                  <Ionicons name="ellipsis-horizontal-circle" size={26} color={colors.primary} />
                </PressableScale>
              )
            : undefined,
        }}
      />
      <ScrollView
        style={{ backgroundColor: colors.background }}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ padding: spacing.xl, gap: spacing.xl, paddingBottom: spacing.xxxl + floatingActionClearance }}
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
            <ContractSummaryCard contract={data} />

            <View style={{ gap: spacing.md }}>
              <SectionHeader title={t('contracts.customerSection')} />
              <PressableScale onPress={() => router.push(`/customer/${data.customer.id}`)} accessibilityRole="button">
                <Card>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                    <Avatar name={data.customer.name} photoUrl={data.customer.photoUrl} />
                    <View style={{ flex: 1, gap: 2 }}>
                      <AppText variant="bodyStrong">{data.customer.name}</AppText>
                      <AppText variant="caption" tone="muted">
                        {isolateLtr(data.customer.phone)}
                      </AppText>
                    </View>
                  </View>
                </Card>
              </PressableScale>
            </View>

            <View style={{ gap: spacing.md }}>
              <SectionHeader title={t('contractDetail.detailsSection')} />
              <ContractDetailsCard contract={data} />
            </View>

            <View style={{ gap: spacing.md }}>
              <SectionHeader title={t('contracts.installmentsSection')} />
              <InstallmentScheduleList installments={data.installments} />
            </View>

            <View style={{ gap: spacing.md }}>
              <SectionHeader title={t('contracts.paymentsSection')} />
              <ContractPaymentsList payments={data.payments} canSeeWallets={isAdmin} />
            </View>
          </>
        ) : null}
      </ScrollView>

      {data?.status === 'ACTIVE' ? (
        <FloatingActionBar>
          <Button
            variant="glass"
            title={t('contracts.recordPayment')}
            icon="add-circle-outline"
            onPress={() => setIsPaymentSheetOpen(true)}
          />
        </FloatingActionBar>
      ) : null}

      {data ? <ContractActions contract={data} isMenuOpen={isMenuOpen} onMenuClose={() => setIsMenuOpen(false)} /> : null}

      <RecordPaymentSheet
        visible={isPaymentSheetOpen}
        contractId={id}
        installments={data?.installments ?? []}
        saving={recordPayment.isPending}
        onClose={() => setIsPaymentSheetOpen(false)}
        onSubmit={async (input) => {
          await recordPayment.mutateAsync(input);
          setIsPaymentSheetOpen(false);
          showToast(t('contracts.paymentRecorded'));
        }}
      />
    </>
  );
}
