import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PressableScale } from '@/components/ui/pressable-scale';
import { useI18n } from '@/i18n/i18n-context';
import { formatNumber, isolateLtr } from '@/lib/format';
import { useTheme } from '@/theme/theme-context';
import { spacing } from '@/theme/tokens';
import { JAMEYA_MAX_MEMBERS, JAMEYA_MIN_MEMBERS } from '../jameya-limits';
import { JameyaFormMember } from './use-jameya-form';

interface JameyaMembersStepProps {
  members: JameyaFormMember[];
  onAddMember: () => void;
  onRemoveMember: (memberId: string) => void;
}

export function JameyaMembersStep({ members, onAddMember, onRemoveMember }: JameyaMembersStepProps) {
  const { t, locale } = useI18n();
  const { colors } = useTheme();
  return (
    <View style={{ gap: spacing.lg }}>
      <AppText variant="caption" tone="muted">
        {t('jameyas.new.membersHint', {
          min: formatNumber(JAMEYA_MIN_MEMBERS, locale),
          max: formatNumber(JAMEYA_MAX_MEMBERS, locale),
        })}
      </AppText>
      <Button variant="secondary" icon="person-add-outline" title={t('jameyas.new.addMember')} onPress={onAddMember} />
      <Card>
        {members.length === 0 ? (
          <AppText variant="caption" tone="muted">
            {t('jameyas.new.noMembers')}
          </AppText>
        ) : (
          <View style={{ gap: spacing.md }}>
            {members.map((member) => (
              <View key={member.id} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                <View style={{ flex: 1, gap: 2 }}>
                  <AppText variant="bodyStrong" numberOfLines={1}>
                    {member.name}
                  </AppText>
                  <AppText variant="caption" tone="muted">
                    {isolateLtr(member.phone)}
                  </AppText>
                </View>
                <PressableScale
                  onPress={() => onRemoveMember(member.id)}
                  accessibilityRole="button"
                  accessibilityLabel={t('jameyas.new.removeMember', { name: member.name })}
                  hitSlop={spacing.sm}
                >
                  <Ionicons name="close-circle" size={22} color={colors.textFaint} />
                </PressableScale>
              </View>
            ))}
          </View>
        )}
      </Card>
      <AppText variant="caption" tone="muted">
        {t('jameyas.new.memberCount', { count: formatNumber(members.length, locale) })}
      </AppText>
    </View>
  );
}
