import { Switch, View } from 'react-native';
import { StaffMember } from '@/api/staff';
import { AppText } from '@/components/ui/app-text';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { useI18n } from '@/i18n/i18n-context';
import { formatDate, isolateLtr } from '@/lib/format';
import { useTheme } from '@/theme/theme-context';
import { spacing } from '@/theme/tokens';

interface StaffCardProps {
  member: StaffMember;
  disabled: boolean;
  onToggleActive: (isActive: boolean) => void;
}

export function StaffCard({ member, disabled, onToggleActive }: StaffCardProps) {
  const { t, locale } = useI18n();
  const { colors } = useTheme();

  return (
    <Card>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
        <Avatar name={member.name} />
        <View style={{ flex: 1, gap: 2 }}>
          <AppText variant="bodyStrong" numberOfLines={1}>
            {member.name}
          </AppText>
          <AppText variant="caption" tone="muted" numberOfLines={1}>
            {isolateLtr(member.email)}
          </AppText>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.xs }}>
            <Badge
              label={member.isActive ? t('common.active') : t('common.inactive')}
              tone={member.isActive ? 'success' : 'neutral'}
            />
            <AppText variant="label" tone="faint" numberOfLines={1} style={{ flexShrink: 1 }}>
              {t('staff.addedOn', { date: formatDate(member.createdAt, locale) })}
            </AppText>
          </View>
        </View>
        <Switch
          value={member.isActive}
          disabled={disabled}
          onValueChange={onToggleActive}
          accessibilityLabel={member.isActive ? t('staff.deactivate') : t('staff.activate')}
          trackColor={{ true: colors.primary, false: colors.border }}
          thumbColor={colors.surface}
        />
      </View>
    </Card>
  );
}
