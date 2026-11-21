import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { View } from 'react-native';
import { JameyaListItem } from '@/api/jameyas';
import { useAuth } from '@/auth/auth-context';
import { AppText } from '@/components/ui/app-text';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PressableScale } from '@/components/ui/pressable-scale';
import { SectionHeader } from '@/components/ui/section-header';
import { SkeletonCardList } from '@/components/ui/skeleton';
import { useJameyas } from '@/hooks/queries';
import { useI18n } from '@/i18n/i18n-context';
import { formatMoney, formatNumber } from '@/lib/format';
import { jameyaStatusTone } from '@/lib/jameya';
import { spacing } from '@/theme/tokens';
import { jameyaForbiddenMessage } from './jameya-access';
import { JameyaFigures } from './jameya-figures';

function CustomerJameyaCard({ jameya }: { jameya: JameyaListItem }) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const member = jameya.member;

  return (
    <PressableScale onPress={() => router.push(`/jameya/${jameya.id}`)} accessibilityRole="button">
      <Card>
        <View style={{ gap: spacing.md }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
            <View style={{ flex: 1, gap: 2 }}>
              <AppText variant="bodyStrong" numberOfLines={1}>
                {jameya.name}
              </AppText>
              {member ? (
                <AppText variant="caption" tone="muted">
                  {member.turnSequences.length > 1
                    ? t('jameyas.customerSection.turnsValue', {
                        sequences: member.turnSequences
                          .map((sequence) => formatNumber(sequence, locale))
                          .join(t('jameyas.customerSection.sequenceSeparator')),
                      })
                    : t('jameyas.customerSection.turnValue', {
                        sequence: formatNumber(member.turnSequences[0], locale),
                      })}
                </AppText>
              ) : null}
            </View>
            <Badge label={t(`jameyas.status.${jameya.status}`)} tone={jameyaStatusTone[jameya.status]} />
          </View>
          {member && member.lateAmount > 0 ? (
            <Badge
              label={`${t('jameyas.customerSection.late')} ${formatMoney(member.lateAmount, locale)}`}
              tone="danger"
            />
          ) : null}
          {member ? (
            <JameyaFigures
              figures={[
                { label: t('jameyas.customerSection.owes'), minorUnits: member.remainingAmount },
                { label: t('jameyas.customerSection.received'), minorUnits: member.receivedAmount },
              ]}
            />
          ) : null}
        </View>
      </Card>
    </PressableScale>
  );
}

function CustomerJameyasList({ customerId }: { customerId: string }) {
  const { t } = useI18n();
  const query = useJameyas({ customerId });
  const jameyas = useMemo(() => query.data?.pages.flatMap((page) => page.data) ?? [], [query.data]);
  const forbiddenMessage = jameyaForbiddenMessage(query.error);

  return (
    <View style={{ gap: spacing.md }}>
      <SectionHeader title={t('jameyas.customerSection.title')} />
      {query.isPending ? (
        <SkeletonCardList count={1} rows={2} />
      ) : jameyas.length === 0 ? (
        <Card>
          <AppText variant="caption" tone="muted">
            {forbiddenMessage ??
              (query.data ? t('jameyas.customerSection.empty') : t('jameyas.list.loadError'))}
          </AppText>
        </Card>
      ) : (
        jameyas.map((jameya) => <CustomerJameyaCard key={jameya.id} jameya={jameya} />)
      )}
      {query.hasNextPage ? (
        <Button
          title={t('common.loadMore')}
          variant="ghost"
          loading={query.isFetchingNextPage}
          onPress={() => void query.fetchNextPage()}
        />
      ) : null}
    </View>
  );
}

export function CustomerJameyasSection({ customerId }: { customerId: string }) {
  const { canUseJameyas } = useAuth();
  return canUseJameyas ? <CustomerJameyasList customerId={customerId} /> : null;
}
