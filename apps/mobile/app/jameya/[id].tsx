import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { JameyaCycle } from '@/api/jameyas';
import { useAuth } from '@/auth/auth-context';
import { jameyaForbiddenMessage } from '@/components/jameyas/jameya-access';
import { JameyaCurrentCycleCard } from '@/components/jameyas/jameya-current-cycle-card';
import { JameyaCyclesList } from '@/components/jameyas/jameya-cycles-list';
import { JameyaEditSheet } from '@/components/jameyas/jameya-edit-sheet';
import { JameyaMembersGrid } from '@/components/jameyas/jameya-members-grid';
import { JameyaPaymentSheet } from '@/components/jameyas/jameya-payment-sheet';
import { JameyaPaymentsList } from '@/components/jameyas/jameya-payments-list';
import { JameyaPayoutSheet } from '@/components/jameyas/jameya-payout-sheet';
import { JameyaSummary } from '@/components/jameyas/jameya-summary';
import { Button } from '@/components/ui/button';
import { DataFreshness } from '@/components/ui/data-freshness';
import { DetailFallback } from '@/components/ui/detail-fallback';
import { FloatingActionBar } from '@/components/ui/floating-action-bar';
import { PressableScale } from '@/components/ui/pressable-scale';
import { SectionHeader } from '@/components/ui/section-header';
import { useJameya } from '@/hooks/queries';
import { useI18n } from '@/i18n/i18n-context';
import { useTheme } from '@/theme/theme-context';
import { floatingActionClearance, spacing } from '@/theme/tokens';

type OpenSheet = 'payment' | 'payout' | 'edit' | null;

export default function JameyaDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useI18n();
  const { colors } = useTheme();
  const { isAdmin, canUseJameyas } = useAuth();
  const { data, dataUpdatedAt, isPending, isError, error, refetch, isRefetching } = useJameya(id, canUseJameyas);
  const [openSheet, setOpenSheet] = useState<OpenSheet>(null);
  const [paymentCustomerId, setPaymentCustomerId] = useState<string | null>(null);
  const [payoutCycle, setPayoutCycle] = useState<JameyaCycle | null>(null);
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

  const isActive = data.status === 'ACTIVE';
  const canRecordPayment = isActive && data.members.some((member) => member.remainingAmount > 0);

  const startPayment = (customerId: string | null) => {
    setPaymentCustomerId(customerId);
    setOpenSheet('payment');
  };

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
        <JameyaSummary jameya={data} />

        <View style={{ gap: spacing.md }}>
          <SectionHeader title={t('jameyas.detail.currentCycle')} />
          <JameyaCurrentCycleCard
            jameya={data}
            canManage={isAdmin}
            onRecordPayment={startPayment}
            onHandOver={startPayout}
          />
        </View>

        <View style={{ gap: spacing.md }}>
          <SectionHeader title={t('jameyas.detail.grid')} />
          <JameyaMembersGrid jameya={data} />
        </View>

        <View style={{ gap: spacing.md }}>
          <SectionHeader title={t('jameyas.detail.cycles')} />
          <JameyaCyclesList jameya={data} canManage={isAdmin} onHandOver={startPayout} />
        </View>

        <View style={{ gap: spacing.md }}>
          <SectionHeader title={t('jameyas.detail.paymentHistory')} />
          <JameyaPaymentsList jameya={data} />
        </View>
      </ScrollView>

      {canRecordPayment ? (
        <FloatingActionBar>
          <Button
            variant="glass"
            title={t('jameyas.detail.recordPayment')}
            icon="add-circle-outline"
            onPress={() => startPayment(null)}
          />
        </FloatingActionBar>
      ) : null}

      <JameyaPaymentSheet
        visible={openSheet === 'payment'}
        jameya={data}
        defaultCustomerId={paymentCustomerId}
        onClose={closeSheet}
      />
      {isAdmin ? (
        <>
          <JameyaPayoutSheet visible={openSheet === 'payout'} jameya={data} cycle={payoutCycle} onClose={closeSheet} />
          <JameyaEditSheet visible={openSheet === 'edit'} jameya={data} onClose={closeSheet} />
        </>
      ) : null}
    </>
  );
}
