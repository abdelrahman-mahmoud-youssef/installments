import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { JameyaCycle } from '@/api/jameyas';
import { useAuth } from '@/auth/auth-context';
import { jameyaForbiddenMessage } from '@/components/jameyas/jameya-access';
import { JameyaCurrentTurnCard } from '@/components/jameyas/jameya-current-turn-card';
import { JameyaEditSheet } from '@/components/jameyas/jameya-edit-sheet';
import { JameyaMemberSheet } from '@/components/jameyas/jameya-member-sheet';
import { JameyaMembersGrid } from '@/components/jameyas/jameya-members-grid';
import { JameyaPaymentSheet } from '@/components/jameyas/jameya-payment-sheet';
import { JameyaPaymentsList } from '@/components/jameyas/jameya-payments-list';
import { JameyaPayoutSheet } from '@/components/jameyas/jameya-payout-sheet';
import { JameyaTurnsList } from '@/components/jameyas/jameya-turns-list';
import { JameyaUnpaidMembers } from '@/components/jameyas/jameya-unpaid-members';
import { AppText } from '@/components/ui/app-text';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import { DataFreshness } from '@/components/ui/data-freshness';
import { DetailFallback } from '@/components/ui/detail-fallback';
import { FloatingActionBar } from '@/components/ui/floating-action-bar';
import { PressableScale } from '@/components/ui/pressable-scale';
import { SectionHeader } from '@/components/ui/section-header';
import { useJameya } from '@/hooks/queries';
import { useI18n } from '@/i18n/i18n-context';
import { formatMoney, formatNumber } from '@/lib/format';
import { useTheme } from '@/theme/theme-context';
import { floatingActionClearance, spacing } from '@/theme/tokens';

type OpenSheet = 'payment' | 'payout' | 'edit' | 'grid' | 'payments' | null;

export default function JameyaDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, locale } = useI18n();
  const { colors } = useTheme();
  const { isAdmin, canUseJameyas } = useAuth();
  const { data, dataUpdatedAt, isPending, isError, error, refetch, isRefetching } = useJameya(id, canUseJameyas);
  const [openSheet, setOpenSheet] = useState<OpenSheet>(null);
  const [payoutCycle, setPayoutCycle] = useState<JameyaCycle | null>(null);
  const [memberId, setMemberId] = useState<string | null>(null);
  const forbiddenMessage = jameyaForbiddenMessage(error);
  const closeSheet = () => setOpenSheet(null);

  if (!canUseJameyas || forbiddenMessage || !data) {
    return (
      <DetailFallback
        isAllowed={canUseJameyas && !forbiddenMessage}
        notAllowedMessage={forbiddenMessage ?? t('jameyas.notEnabled')}
        isPending={isPending}
        error={error}
        onRetry={() => void refetch()}
        notFoundIcon="people-circle-outline"
        notFoundTitle={t('jameyas.detail.notFound')}
      />
    );
  }

  const canRecordPayment = data.status === 'ACTIVE' && data.members.some((member) => member.remainingAmount > 0);

  const startPayout = (cycle: JameyaCycle) => {
    setPayoutCycle(cycle);
    setOpenSheet('payout');
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: data.name,
          headerRight: isAdmin
            ? () => (
                <PressableScale
                  onPress={() => setOpenSheet('edit')}
                  accessibilityRole="button"
                  accessibilityLabel={t('jameyas.editDialog.trigger')}
                  hitSlop={spacing.sm}
                >
                  <Ionicons name="create-outline" size={24} color={colors.primary} />
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
        <DataFreshness updatedAt={dataUpdatedAt} hasRefreshFailed={isError} />
        <AppText variant="caption" tone="muted">
          {t('jameyas.detail.headerLine', {
            members: formatNumber(data.members.length, locale),
            share: formatMoney(data.shareAmount, locale),
            period: t(`jameyas.detail.period.${data.recurrenceType}`),
            pot: formatMoney(data.potAmount, locale),
          })}
        </AppText>

        <View style={{ gap: spacing.md }}>
          <SectionHeader title={t(`jameyas.detail.currentTitle.${data.recurrenceType}`)} />
          <JameyaCurrentTurnCard jameya={data} canManage={isAdmin} onHandOver={startPayout} />
        </View>

        <View style={{ gap: spacing.md }}>
          <SectionHeader title={t('jameyas.detail.unpaidTitle')} />
          <JameyaUnpaidMembers jameya={data} onOpenMember={setMemberId} />
        </View>

        <View style={{ gap: spacing.md }}>
          <SectionHeader title={t('jameyas.detail.turnsTitle')} />
          <JameyaTurnsList jameya={data} canManage={isAdmin} onHandOver={startPayout} onOpenMember={setMemberId} />
        </View>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          <Button
            variant="ghost"
            icon="grid-outline"
            title={t('jameyas.detail.fullTable')}
            onPress={() => setOpenSheet('grid')}
          />
          <Button
            variant="ghost"
            icon="receipt-outline"
            title={t('jameyas.detail.allPayments')}
            onPress={() => setOpenSheet('payments')}
          />
        </View>
      </ScrollView>

      {canRecordPayment ? (
        <FloatingActionBar>
          <Button
            variant="glass"
            title={t('jameyas.detail.recordPayment')}
            icon="add-circle-outline"
            onPress={() => setOpenSheet('payment')}
          />
        </FloatingActionBar>
      ) : null}

      <BottomSheet visible={openSheet === 'grid'} onClose={closeSheet} title={t('jameyas.detail.fullTable')}>
        <JameyaMembersGrid jameya={data} />
      </BottomSheet>
      <BottomSheet visible={openSheet === 'payments'} onClose={closeSheet} title={t('jameyas.detail.allPayments')}>
        <JameyaPaymentsList jameya={data} />
      </BottomSheet>
      <JameyaMemberSheet jameya={data} customerId={memberId} onClose={() => setMemberId(null)} />
      <JameyaPaymentSheet visible={openSheet === 'payment'} jameya={data} onClose={closeSheet} />
      {isAdmin ? (
        <>
          <JameyaPayoutSheet visible={openSheet === 'payout'} jameya={data} cycle={payoutCycle} onClose={closeSheet} />
          <JameyaEditSheet visible={openSheet === 'edit'} jameya={data} onClose={closeSheet} />
        </>
      ) : null}
    </>
  );
}
