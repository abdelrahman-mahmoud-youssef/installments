import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Linking, RefreshControl, ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/app-text';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { ErrorState } from '@/components/ui/error-state';
import { MoneyText } from '@/components/ui/money-text';
import { PressableScale } from '@/components/ui/pressable-scale';
import { SectionHeader } from '@/components/ui/section-header';
import { SkeletonCardList } from '@/components/ui/skeleton';
import { useCustomer } from '@/hooks/queries';
import { useI18n } from '@/i18n/i18n-context';
import { formatDate } from '@/lib/format';
import { contractStatusTone } from '@/lib/statuses';
import { useTheme } from '@/theme/theme-context';
import { radius, spacing, touchTarget } from '@/theme/tokens';

export default function CustomerDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, locale } = useI18n();
  const { colors } = useTheme();
  const router = useRouter();
  const { data, isPending, isError, error, refetch, isRefetching } = useCustomer(id);

  return (
    <>
      <Stack.Screen options={{ title: data?.name ?? '' }} />
      <ScrollView
        style={{ backgroundColor: colors.background }}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ padding: spacing.xl, gap: spacing.xl, paddingBottom: spacing.xxxl }}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} tintColor={colors.textMuted} />
        }
      >
        {isPending ? (
          <SkeletonCardList count={3} />
        ) : isError ? (
          <ErrorState error={error} onRetry={() => void refetch()} />
        ) : data ? (
          <>
            <Card>
              <View style={{ alignItems: 'center', gap: spacing.md }}>
                <Avatar name={data.name} size={72} />
                <View style={{ alignItems: 'center', gap: 2 }}>
                  <AppText variant="title" align="center">
                    {data.name}
                  </AppText>
                  <AppText variant="caption" tone="muted">
                    {t('customers.memberSince', { date: formatDate(data.createdAt, locale) })}
                  </AppText>
                </View>
                <PressableScale
                  onPress={() => void Linking.openURL(`tel:${data.phone}`)}
                  accessibilityRole="button"
                  accessibilityLabel={t('customers.call')}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: spacing.sm,
                    backgroundColor: colors.primaryMuted,
                    borderRadius: radius.full,
                    paddingHorizontal: spacing.xl,
                    minHeight: touchTarget.minHeight,
                  }}
                >
                  <Ionicons name="call-outline" size={18} color={colors.primary} />
                  <AppText variant="bodyStrong" tone="primary">
                    {data.phone}
                  </AppText>
                </PressableScale>
              </View>
            </Card>

            {data.address || data.notes ? (
              <View style={{ gap: spacing.md }}>
                <SectionHeader title={t('customers.infoSection')} />
                <Card>
                  <View style={{ gap: spacing.md }}>
                    {data.address ? (
                      <View style={{ gap: 2 }}>
                        <AppText variant="label" tone="muted">
                          {t('customers.address')}
                        </AppText>
                        <AppText variant="caption">{data.address}</AppText>
                      </View>
                    ) : null}
                    {data.notes ? (
                      <View style={{ gap: 2 }}>
                        <AppText variant="label" tone="muted">
                          {t('customers.notes')}
                        </AppText>
                        <AppText variant="caption">{data.notes}</AppText>
                      </View>
                    ) : null}
                  </View>
                </Card>
              </View>
            ) : null}

            <View style={{ gap: spacing.md }}>
              <SectionHeader title={t('customers.contractsSection')} />
              {data.contracts.length === 0 ? (
                <Card>
                  <AppText variant="caption" tone="muted">
                    {t('customers.noContracts')}
                  </AppText>
                </Card>
              ) : (
                data.contracts.map((contract) => (
                  <PressableScale
                    key={contract.id}
                    onPress={() => router.push(`/contract/${contract.id}`)}
                    accessibilityRole="button"
                  >
                    <Card>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                        <View style={{ flex: 1, gap: spacing.xs }}>
                          <AppText variant="bodyStrong" numberOfLines={1}>
                            {contract.productName}
                          </AppText>
                          <MoneyText minorUnits={contract.totalAmount} variant="caption" tone="muted" />
                        </View>
                        <Badge
                          label={t(`status.contract.${contract.status}`)}
                          tone={contractStatusTone[contract.status]}
                        />
                      </View>
                    </Card>
                  </PressableScale>
                ))
              )}
            </View>
          </>
        ) : null}
      </ScrollView>
    </>
  );
}
