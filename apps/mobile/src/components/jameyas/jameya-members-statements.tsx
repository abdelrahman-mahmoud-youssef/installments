import { View } from 'react-native';
import { JameyaDetail } from '@/api/jameyas';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PressableScale } from '@/components/ui/pressable-scale';
import { useI18n } from '@/i18n/i18n-context';
import { formatNumber } from '@/lib/format';
import { spacing } from '@/theme/tokens';
import { useShareJameyaStatement } from './use-share-jameya-statement';

interface JameyaMembersStatementsProps {
  jameya: JameyaDetail;
  onOpenMember: (customerId: string) => void;
}

export function JameyaMembersStatements({ jameya, onOpenMember }: JameyaMembersStatementsProps) {
  const { t, locale } = useI18n();
  const { shareStatement, sharingMemberId, canShare } = useShareJameyaStatement(jameya);

  return (
    <Card>
      <View style={{ gap: spacing.md }}>
        {jameya.members.map((member) => (
          <View key={member.customerId} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
            <PressableScale
              onPress={() => onOpenMember(member.customerId)}
              accessibilityRole="button"
              style={{ flex: 1, gap: 2 }}
            >
              <AppText variant="bodyStrong" numberOfLines={1}>
                {member.name}
              </AppText>
              <AppText variant="caption" tone="muted">
                {member.turnSequences.length > 1
                  ? t('jameyas.customerSection.turnsValue', {
                      sequences: member.turnSequences
                        .map((sequence) => formatNumber(sequence, locale))
                        .join(t('jameyas.customerSection.sequenceSeparator')),
                    })
                  : t('jameyas.customerSection.turnValue', { sequence: formatNumber(member.turnSequences[0], locale) })}
              </AppText>
            </PressableScale>
            <Button
              variant="secondary"
              icon="document-text-outline"
              title={t('jameyas.statement.button')}
              loading={sharingMemberId === member.customerId}
              disabled={!canShare}
              onPress={() => void shareStatement(member)}
            />
          </View>
        ))}
      </View>
    </Card>
  );
}
