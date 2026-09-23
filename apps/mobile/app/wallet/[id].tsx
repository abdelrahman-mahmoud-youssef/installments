import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { PaymentMethodTransaction } from '@/api/payment-method-transactions';
import { PaymentMethod } from '@/api/payment-methods';
import { useAuth } from '@/auth/auth-context';
import { AppText } from '@/components/ui/app-text';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { DetailFallback } from '@/components/ui/detail-fallback';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { MonthSwitcher } from '@/components/ui/month-switcher';
import { PressableScale } from '@/components/ui/pressable-scale';
import { SectionHeader } from '@/components/ui/section-header';
import { SkeletonCardList } from '@/components/ui/skeleton';
import { LogTransactionSheet } from '@/components/wallets/log-transaction-sheet';
import { MaskedAccountDetails } from '@/components/wallets/masked-account-details';
import { TransactionRow } from '@/components/wallets/transaction-row';
import { WalletActions } from '@/components/wallets/wallet-actions';
import { WalletMonthSummary } from '@/components/wallets/wallet-month-summary';
import { usePaymentMethodMonthlySummary, usePaymentMethods, usePaymentMethodTransactions } from '@/hooks/queries';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useI18n } from '@/i18n/i18n-context';
import { currentMonthKey } from '@/lib/calendar';
import { formatDate, formatMoney } from '@/lib/format';
import { resolvePaymentMethodPreset } from '@/lib/payment-method-presets';
import { useTheme } from '@/theme/theme-context';
import { floatingActionClearance, radius, spacing, touchTarget } from '@/theme/tokens';

const HERO_ICON_SIZE = 56;

export default function WalletDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, locale } = useI18n();
  const { colors } = useTheme();
  const { isAdmin } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [month, setMonth] = useState(currentMonthKey());
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search.trim());
  const [isActionsOpen, setIsActionsOpen] = useState(false);
  const [isLogOpen, setIsLogOpen] = useState(false);

  const methodsQuery = usePaymentMethods();
  const method = methodsQuery.data?.find((item) => item.id === id);
  const isEnabled = isAdmin && method !== undefined;
  const summaryQuery = usePaymentMethodMonthlySummary(id, month, isEnabled);
  const transactionsQuery = usePaymentMethodTransactions(id, { month, q: debouncedSearch || undefined }, isEnabled);

  const transactions = useMemo(
    () => transactionsQuery.data?.pages.flatMap((page) => page.data) ?? [],
    [transactionsQuery.data],
  );
  const totals = transactionsQuery.data?.pages[0];

  const describe = (transaction: PaymentMethodTransaction) => {
    const isOutgoing = transaction.direction === 'OUT';
    const title = transaction.counterpartyName
      ? t(isOutgoing ? 'transactions.toName' : 'transactions.fromName', { name: transaction.counterpartyName })
      : t(isOutgoing ? 'transactions.sent' : 'transactions.received');
    const subtitle = [formatDate(transaction.occurredAt, locale), transaction.counterpartyPhone, transaction.note]
      .filter(Boolean)
      .join(' · ');
    return { title, subtitle };
  };

  const refresh = () => {
    void methodsQuery.refetch();
    void summaryQuery.refetch();
    void transactionsQuery.refetch();
  };

  if (!isAdmin || methodsQuery.isPending || methodsQuery.isError || !method) {
    return (
      <DetailFallback
        isAllowed={isAdmin}
        notAllowedMessage={t('wallets.adminOnly')}
        isPending={methodsQuery.isPending}
        error={methodsQuery.error}
        onRetry={() => void methodsQuery.refetch()}
        notFoundIcon="wallet-outline"
        notFoundTitle={t('wallets.notFound')}
      />
    );
  }

  const header = (
    <View style={{ gap: spacing.xl, paddingHorizontal: spacing.xl, paddingBottom: spacing.sm }}>
      <WalletHero method={method} />
      <MonthSwitcher month={month} onChange={setMonth} />
      {summaryQuery.data ? (
        <WalletMonthSummary summary={summaryQuery.data} />
      ) : summaryQuery.isError ? (
        <ErrorState error={summaryQuery.error} onRetry={() => void summaryQuery.refetch()} />
      ) : (
        <SkeletonCardList count={1} />
      )}
      <View style={{ gap: spacing.sm }}>
        <SectionHeader title={t('transactions.title')} />
        {debouncedSearch && totals ? (
          <AppText variant="caption" tone="muted">
            {t('transactions.matchesTotals', {
              received: formatMoney(totals.totalIn, locale),
              sent: formatMoney(totals.totalOut, locale),
            })}
          </AppText>
        ) : null}
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Stack.Screen
        options={{
          title: method.label,
          headerSearchBarOptions: {
            placeholder: t('transactions.searchPlaceholder'),
            cancelButtonText: t('common.cancel'),
            autoCapitalize: 'none',
            onChangeText: (event) => setSearch(event.nativeEvent.text),
          },
          headerRight: () => (
            <PressableScale
              onPress={() => setIsActionsOpen(true)}
              accessibilityRole="button"
              accessibilityLabel={t('wallets.moreActions')}
              hitSlop={spacing.sm}
            >
              <Ionicons name="ellipsis-horizontal-circle" size={26} color={colors.primary} />
            </PressableScale>
          ),
        }}
      />
      <FlatList
        data={transactions}
        keyExtractor={(transaction) => transaction.id}
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingTop: spacing.md, paddingBottom: spacing.xxxl + floatingActionClearance }}
        onEndReachedThreshold={0.4}
        onEndReached={() => {
          if (transactionsQuery.hasNextPage && !transactionsQuery.isFetchingNextPage) {
            void transactionsQuery.fetchNextPage();
          }
        }}
        refreshControl={
          <RefreshControl
            refreshing={methodsQuery.isRefetching || transactionsQuery.isRefetching}
            onRefresh={refresh}
            tintColor={colors.textMuted}
          />
        }
        ListHeaderComponent={header}
        ListEmptyComponent={
          <View style={{ paddingHorizontal: spacing.xl }}>
            {transactionsQuery.isPending ? (
              <SkeletonCardList count={3} />
            ) : transactionsQuery.isError ? (
              <ErrorState error={transactionsQuery.error} onRetry={() => void transactionsQuery.refetch()} />
            ) : (
              <EmptyState
                icon={debouncedSearch ? 'search-outline' : 'swap-vertical-outline'}
                title={debouncedSearch ? t('transactions.emptySearch') : t('transactions.empty')}
              />
            )}
          </View>
        }
        ItemSeparatorComponent={() => (
          <View style={{ height: 1, backgroundColor: colors.border, marginStart: spacing.xl + touchTarget.minHeight }} />
        )}
        ListFooterComponent={
          transactionsQuery.isFetchingNextPage ? (
            <ActivityIndicator color={colors.textMuted} style={{ paddingVertical: spacing.lg }} />
          ) : null
        }
        renderItem={({ item }) => (
          <View style={{ paddingHorizontal: spacing.xl }}>
            <TransactionRow
              direction={item.direction}
              amount={item.amount}
              receiptUrl={item.receiptUrl}
              {...describe(item)}
            />
          </View>
        )}
      />

      {method.isActive ? (
        <View
          pointerEvents="box-none"
          style={{ position: 'absolute', left: spacing.xl, right: spacing.xl, bottom: insets.bottom + spacing.lg }}
        >
          <Button variant="glass" title={t('transactions.log')} icon="swap-vertical" onPress={() => setIsLogOpen(true)} />
        </View>
      ) : null}

      <WalletActions
        method={isActionsOpen ? method : null}
        onClose={() => setIsActionsOpen(false)}
        onRemoved={() => router.back()}
      />
      <LogTransactionSheet visible={isLogOpen} paymentMethodId={method.id} onClose={() => setIsLogOpen(false)} />
    </View>
  );
}

function WalletHero({ method }: { method: PaymentMethod }) {
  const { t } = useI18n();
  const preset = resolvePaymentMethodPreset(method.presetKey);

  return (
    <Card>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.lg }}>
        <View
          style={{
            width: HERO_ICON_SIZE,
            height: HERO_ICON_SIZE,
            borderRadius: radius.lg,
            backgroundColor: `${preset.color}1f`,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name={preset.icon} size={28} color={preset.color} />
        </View>
        <View style={{ flex: 1, gap: spacing.xs }}>
          <AppText variant="heading" numberOfLines={1}>
            {method.label}
          </AppText>
          <MaskedAccountDetails details={method.details} />
        </View>
        <Badge
          label={method.isActive ? t('common.active') : t('common.inactive')}
          tone={method.isActive ? 'success' : 'neutral'}
        />
      </View>
    </Card>
  );
}
