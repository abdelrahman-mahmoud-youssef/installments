import { Ionicons } from '@expo/vector-icons';
import { useRef } from 'react';
import { ScrollView, View } from 'react-native';
import { JameyaCycle, JameyaDetail, JameyaMember } from '@/api/jameyas';
import { AppText } from '@/components/ui/app-text';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { useI18n } from '@/i18n/i18n-context';
import { formatCalendarDate, formatMoney, formatNumber } from '@/lib/format';
import {
  dueCellKey,
  dueCellKind,
  duesByCell,
  hasReceivedAndIsLate,
  JAMEYA_DUE_CELL_KINDS,
  jameyaDueCellTone,
} from '@/lib/jameya';
import { useTheme } from '@/theme/theme-context';
import { radius, spacing } from '@/theme/tokens';
import { JameyaReminderButton } from './jameya-reminder-button';

const HEADER_HEIGHT = 52;
const ROW_HEIGHT = 64;
const NAME_COLUMN_WIDTH = 150;
const CYCLE_COLUMN_WIDTH = 104;

function MemberNameCell({ member }: { member: JameyaMember }) {
  const { t } = useI18n();
  const { colors } = useTheme();
  return (
    <View
      style={{
        height: ROW_HEIGHT,
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
        paddingHorizontal: spacing.md,
        borderTopWidth: 1,
        borderColor: colors.border,
      }}
    >
      <View style={{ flex: 1, gap: 2 }}>
        <AppText variant="caption" numberOfLines={1} style={{ fontWeight: '600' }}>
          {member.name}
        </AppText>
        {hasReceivedAndIsLate(member) ? (
          <AppText variant="label" tone="danger" numberOfLines={1}>
            {t('jameyas.grid.receivedAndLate')}
          </AppText>
        ) : null}
      </View>
      <JameyaReminderButton member={member} />
    </View>
  );
}

interface CycleColumnProps {
  jameya: JameyaDetail;
  cycle: JameyaCycle;
  dues: ReturnType<typeof duesByCell>;
}

function CycleColumn({ jameya, cycle, dues }: CycleColumnProps) {
  const { t, locale } = useI18n();
  const { colors } = useTheme();
  return (
    <View style={{ width: CYCLE_COLUMN_WIDTH }}>
      <View style={{ height: HEADER_HEIGHT, alignItems: 'center', justifyContent: 'center' }}>
        <AppText variant="caption" align="center" style={{ fontWeight: '600' }}>
          {t('jameyas.grid.turn', { sequence: formatNumber(cycle.sequence, locale) })}
        </AppText>
        <AppText variant="label" tone="muted" align="center">
          {formatCalendarDate(cycle.dueDate, locale)}
        </AppText>
      </View>
      {jameya.members.map((member) => {
        const due = dues.get(dueCellKey(cycle.id, member.customerId));
        const kind = due ? dueCellKind(due, cycle) : null;
        const isOwnTurn = member.turnSequences.includes(cycle.sequence);
        return (
          <View
            key={member.customerId}
            accessible={due !== undefined}
            accessibilityLabel={
              due
                ? t('jameyas.grid.cellTitle', {
                    paid: formatMoney(due.paidAmount, locale),
                    amount: formatMoney(due.amount, locale),
                  })
                : undefined
            }
            style={{
              height: ROW_HEIGHT,
              alignItems: 'center',
              justifyContent: 'center',
              borderTopWidth: 1,
              borderColor: colors.border,
            }}
          >
            {kind ? (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 2,
                  borderRadius: radius.full,
                  borderWidth: 2,
                  borderColor: isOwnTurn ? colors.primary : 'transparent',
                }}
              >
                {isOwnTurn ? (
                  <Ionicons
                    name="hand-left-outline"
                    size={14}
                    color={colors.primary}
                    accessibilityLabel={t('jameyas.grid.ownTurn')}
                    style={{ marginStart: spacing.xs }}
                  />
                ) : null}
                <Badge label={t(`jameyas.grid.cell.${kind}`)} tone={jameyaDueCellTone[kind]} />
              </View>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

function GridLegend() {
  const { t } = useI18n();
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: spacing.sm }}>
      {JAMEYA_DUE_CELL_KINDS.map((kind) => (
        <Badge key={kind} label={t(`jameyas.grid.cell.${kind}`)} tone={jameyaDueCellTone[kind]} />
      ))}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.xs,
          borderRadius: radius.full,
          borderWidth: 2,
          borderColor: colors.primary,
          paddingHorizontal: spacing.md,
          paddingVertical: 2,
        }}
      >
        <Ionicons name="hand-left-outline" size={14} color={colors.primary} />
        <AppText variant="label" tone="primary">
          {t('jameyas.grid.ownTurn')}
        </AppText>
      </View>
    </View>
  );
}

export function JameyaMembersGrid({ jameya }: { jameya: JameyaDetail }) {
  const { t, isRTL, direction } = useI18n();
  const { colors } = useTheme();
  const scrollRef = useRef<ScrollView>(null);
  const dues = duesByCell(jameya.dues);

  return (
    <View style={{ gap: spacing.md }}>
      <Card padded={false}>
        <View style={{ flexDirection: 'row' }}>
          <View style={{ width: NAME_COLUMN_WIDTH, borderEndWidth: 1, borderColor: colors.border }}>
            <View style={{ height: HEADER_HEIGHT, justifyContent: 'center', paddingHorizontal: spacing.md }}>
              <AppText variant="caption" tone="muted">
                {t('jameyas.grid.member')}
              </AppText>
            </View>
            {jameya.members.map((member) => (
              <MemberNameCell key={member.customerId} member={member} />
            ))}
          </View>
          <ScrollView
            key={direction}
            ref={scrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ flex: 1 }}
            onContentSizeChange={() => {
              if (isRTL) {
                scrollRef.current?.scrollToEnd({ animated: false });
              }
            }}
          >
            {jameya.cycles.map((cycle) => (
              <CycleColumn key={cycle.id} jameya={jameya} cycle={cycle} dues={dues} />
            ))}
          </ScrollView>
        </View>
      </Card>
      <GridLegend />
    </View>
  );
}
