import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Linking, RefreshControl, View } from 'react-native';
import { Counterparty, CounterpartyHistoryItem } from '@/api/counterparties';
import { useAuth } from '@/auth/auth-context';
import { AdjustmentSheet } from '@/components/contacts/adjustment-sheet';
import { ContactFormSheet } from '@/components/contacts/contact-form-sheet';
import { useShareStatement } from '@/components/contacts/use-share-statement';
import { AppText } from '@/components/ui/app-text';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { DetailFallback } from '@/components/ui/detail-fallback';
import { ConfirmSheet } from '@/components/ui/confirm-sheet';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { FloatingActionBar } from '@/components/ui/floating-action-bar';
import { MoneyText } from '@/components/ui/money-text';
import { MonthSwitcher } from '@/components/ui/month-switcher';
import { QuickAction } from '@/components/ui/quick-action';
import { SectionHeader } from '@/components/ui/section-header';
import { SkeletonCardList } from '@/components/ui/skeleton';
import { StatCard } from '@/components/ui/stat-card';
import { useToast } from '@/components/ui/toast-context';
import { LogTransactionSheet } from '@/components/wallets/log-transaction-sheet';
import { TransactionRow } from '@/components/wallets/transaction-row';
import {
  useCounterparty,
  useCounterpartyHistory,
  useDeleteCounterparty,
  useUpdateCounterparty,
} from '@/hooks/queries';
import { useI18n } from '@/i18n/i18n-context';
import { currentMonthKey } from '@/lib/calendar';
import { balanceStatus, balanceTone } from '@/lib/counterparty-balance';
import { formatDate, formatMoney } from '@/lib/format';
import { useTheme } from '@/theme/theme-context';
import { floatingActionClearance, spacing, touchTarget } from '@/theme/tokens';

type OpenSheet = 'edit' | 'adjust' | 'log' | 'remove' | null;

const HERO_AVATAR_SIZE = 80;

export default function ContactDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, locale } = useI18n();
  const { colors } = useTheme();
  const { isAdmin } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const shareStatement = useShareStatement();
  const [month, setMonth] = useState(currentMonthKey());
  const [openSheet, setOpenSheet] = useState<OpenSheet>(null);

  const contactQuery = useCounterparty(id, isAdmin);
  const historyQuery = useCounterpartyHistory(id, { month }, isAdmin && contactQuery.data !== undefined);
  const updateMutation = useUpdateCounterparty();
  const deleteMutation = useDeleteCounterparty();

  const history = useMemo(() => historyQuery.data?.pages.flatMap((page) => page.data) ?? [], [historyQuery.data]);
  const totals = historyQuery.data?.pages[0];
  const contact = contactQuery.data;
  const closeSheet = () => setOpenSheet(null);

  const describe = (item: CounterpartyHistoryItem) => {
    const isOutgoing = item.direction === 'OUT';
    const subtitle = [formatDate(item.occurredAt, locale), item.note].filter(Boolean).join(' · ');
    if (item.kind === 'ADJUSTMENT') {
      return {
        title: t(isOutgoing ? 'contacts.increase' : 'contacts.decrease'),
        subtitle,
        tag: t('transactions.adjustmentTag'),
      };
    }
    return {
      title: item.paymentMethodLabel ?? t(isOutgoing ? 'transactions.sent' : 'transactions.received'),
      subtitle,
    };
  };

  const removeContact = async () => {
    closeSheet();
    router.back();
    try {
      await deleteMutation.mutateAsync(id);
      showToast(t('contacts.removed'));
    } catch {
      showToast(t('common.genericError'), 'error');
    }
  };

  if (!isAdmin || !contact) {
    return (
      <DetailFallback
        isAllowed={isAdmin}
        notAllowedMessage={t('wallets.adminOnly')}
        isPending={contactQuery.isPending}
        error={contactQuery.error}
        onRetry={() => void contactQuery.refetch()}
        notFoundIcon="person-outline"
        notFoundTitle={t('contacts.notFound')}
      />
    );
  }

  const header = (
    <View style={{ gap: spacing.xl, paddingHorizontal: spacing.xl, paddingBottom: spacing.sm }}>
      <ContactHero
        contact={contact}
        onCall={contact.phone ? () => void Linking.openURL(`tel:${contact.phone}`) : undefined}
        onShare={() => void shareStatement(contact)}
        onAdjust={() => setOpenSheet('adjust')}
        onEdit={() => setOpenSheet('edit')}
      />
      <MonthSwitcher month={month} onChange={setMonth} />
      <View style={{ flexDirection: 'row', gap: spacing.md }}>
        <StatCard
          icon="arrow-down"
          label={t('wallets.received')}
          value={formatMoney(totals?.totalIn ?? 0, locale)}
          tone="success"
        />
        <StatCard
          icon="arrow-up"
          label={t('wallets.sent')}
          value={formatMoney(totals?.totalOut ?? 0, locale)}
          tone="danger"
        />
      </View>
      <SectionHeader title={t('contacts.history')} />
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Stack.Screen options={{ title: contact.name }} />
      <FlatList
        data={history}
        keyExtractor={(item) => `${item.kind}-${item.id}`}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ paddingTop: spacing.md, paddingBottom: spacing.xxxl + floatingActionClearance }}
        onEndReachedThreshold={0.4}
        onEndReached={() => {
          if (historyQuery.hasNextPage && !historyQuery.isFetchingNextPage) {
            void historyQuery.fetchNextPage();
          }
        }}
        refreshControl={
          <RefreshControl
            refreshing={contactQuery.isRefetching || historyQuery.isRefetching}
            onRefresh={() => {
              void contactQuery.refetch();
              void historyQuery.refetch();
            }}
            tintColor={colors.textMuted}
          />
        }
        ListHeaderComponent={header}
        ListEmptyComponent={
          <View style={{ paddingHorizontal: spacing.xl }}>
            {historyQuery.isPending ? (
              <SkeletonCardList count={3} />
            ) : historyQuery.isError ? (
              <ErrorState error={historyQuery.error} onRetry={() => void historyQuery.refetch()} />
            ) : (
              <EmptyState icon="time-outline" title={t('contacts.emptyHistory')} />
            )}
          </View>
        }
        ItemSeparatorComponent={() => (
          <View style={{ height: 1, backgroundColor: colors.border, marginStart: spacing.xl + touchTarget.minHeight }} />
        )}
        ListFooterComponent={
          <View style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.xl, gap: spacing.lg }}>
            {historyQuery.isFetchingNextPage ? <ActivityIndicator color={colors.textMuted} /> : null}
            <Button
              title={t('contacts.removeAction')}
              variant="destructive"
              icon="trash-outline"
              onPress={() => setOpenSheet('remove')}
            />
          </View>
        }
        renderItem={({ item }) => (
          <View style={{ paddingHorizontal: spacing.xl }}>
            <TransactionRow direction={item.direction} amount={item.amount} receiptUrl={item.receiptUrl} {...describe(item)} />
          </View>
        )}
      />

      <FloatingActionBar>
        <Button variant="glass" title={t('transactions.log')} icon="swap-vertical" onPress={() => setOpenSheet('log')} />
      </FloatingActionBar>

      <LogTransactionSheet visible={openSheet === 'log'} counterparty={contact} onClose={closeSheet} />
      <AdjustmentSheet
        visible={openSheet === 'adjust'}
        counterpartyId={contact.id}
        currentBalance={contact.balance}
        onClose={closeSheet}
      />
      <ContactFormSheet
        visible={openSheet === 'edit'}
        contact={contact}
        saving={updateMutation.isPending}
        onClose={closeSheet}
        onSubmit={async (input) => {
          await updateMutation.mutateAsync({ id: contact.id, input });
          closeSheet();
          showToast(t('contacts.updated'));
        }}
      />
      <ConfirmSheet
        visible={openSheet === 'remove'}
        title={t('contacts.removeTitle')}
        message={t('contacts.removeConfirm', { name: contact.name })}
        confirmTitle={t('common.remove')}
        destructive
        loading={deleteMutation.isPending}
        onConfirm={() => void removeContact()}
        onCancel={closeSheet}
      />
    </View>
  );
}

interface ContactHeroProps {
  contact: Counterparty;
  onCall?: () => void;
  onShare: () => void;
  onAdjust: () => void;
  onEdit: () => void;
}

function ContactHero({ contact, onCall, onShare, onAdjust, onEdit }: ContactHeroProps) {
  const { t } = useI18n();
  const status = balanceStatus(contact.balance);

  return (
    <Card>
      <View style={{ alignItems: 'center', gap: spacing.lg }}>
        <Avatar name={contact.name} photoUrl={contact.photoUrl} size={HERO_AVATAR_SIZE} />
        <View style={{ alignItems: 'center', gap: 2 }}>
          <AppText variant="title" align="center">
            {contact.name}
          </AppText>
          {contact.phone ? (
            <AppText variant="caption" tone="muted">
              {contact.phone}
            </AppText>
          ) : null}
        </View>
        <View style={{ alignItems: 'center', gap: 2 }}>
          <MoneyText minorUnits={Math.abs(contact.balance)} variant="largeTitle" tone={balanceTone[status]} />
          <AppText variant="caption" tone="muted">
            {t(`contacts.${status}`)}
          </AppText>
        </View>
        {contact.notes ? (
          <AppText variant="caption" tone="muted" align="center">
            {contact.notes}
          </AppText>
        ) : null}
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: spacing.lg }}>
          {onCall ? <QuickAction icon="call" label={t('contacts.call')} onPress={onCall} /> : null}
          <QuickAction icon="share-outline" label={t('contacts.share')} onPress={onShare} />
          <QuickAction icon="scale-outline" label={t('contacts.adjust')} onPress={onAdjust} />
          <QuickAction icon="create-outline" label={t('contacts.edit')} onPress={onEdit} />
        </View>
      </View>
    </Card>
  );
}
