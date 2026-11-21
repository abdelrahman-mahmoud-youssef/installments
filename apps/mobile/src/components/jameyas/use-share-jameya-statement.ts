import { useCallback, useState } from 'react';
import { JameyaDetail, JameyaMember } from '@/api/jameyas';
import { STATEMENT_PAGE_SIZE } from '@/components/contacts/contact-statement-html';
import { loadStatementFontFaces } from '@/components/contacts/statement-fonts';
import { formatStatementDate } from '@/components/contacts/statement-format';
import { useToast } from '@/components/ui/toast-context';
import { useBranding } from '@/hooks/queries';
import { useI18n } from '@/i18n/i18n-context';
import { resolveAssetUrl } from '@/lib/asset-url';
import { BRAND_COLOR_HEX } from '@/lib/brand-colors';
import { formatMoney, formatNumber, todayIsoDate } from '@/lib/format';
import { dueCellKind, JameyaDueCellKind } from '@/lib/jameya';
import { sharePdf } from '@/lib/share-pdf';
import { buildJameyaMemberStatementHtml, JameyaStatementRow, JameyaStatementTone } from './jameya-member-statement-html';

const STATEMENT_FALLBACK_FILE_NAME = 'statement';

const STATUS_TONE: Record<JameyaDueCellKind, JameyaStatementTone> = {
  paid: 'success',
  partial: 'muted',
  late: 'danger',
  due: 'muted',
  upcoming: 'muted',
};

export function useShareJameyaStatement(jameya: JameyaDetail) {
  const { t, locale, isRTL } = useI18n();
  const { showToast } = useToast();
  const branding = useBranding();
  const [sharingMemberId, setSharingMemberId] = useState<string | null>(null);

  const shareStatement = useCallback(
    async (member: JameyaMember) => {
      if (!branding.data || sharingMemberId) {
        return;
      }
      const shop = branding.data;
      const money = (minorUnits: number) => formatMoney(minorUnits, locale);
      const memberDues = jameya.dues.filter((due) => due.customerId === member.customerId);
      const rows: JameyaStatementRow[] = jameya.cycles.flatMap((cycle) => {
        const due = memberDues.find((item) => item.cycleId === cycle.id);
        if (!due) {
          return [];
        }
        const kind = dueCellKind(due, cycle);
        return [
          {
            turn: formatNumber(cycle.sequence, locale),
            date: formatStatementDate(cycle.dueDate),
            due: money(due.amount),
            paid: money(due.paidAmount),
            status: t(`jameyas.statement.status.${kind}`),
            tone: STATUS_TONE[kind],
            isOwnTurn: member.turnSequences.includes(cycle.sequence),
          },
        ];
      });
      setSharingMemberId(member.customerId);
      try {
        const html = buildJameyaMemberStatementHtml({
          isRTL,
          fontFaces: await loadStatementFontFaces(isRTL),
          documentLabel: t('jameyas.receipt.documentLabel'),
          title: t('jameyas.statement.title'),
          issuedOn: t('jameyas.receipt.issuedOn', { date: formatStatementDate(todayIsoDate()) }),
          details: [
            { label: t('jameyas.statement.member'), value: member.name },
            { label: t('jameyas.statement.jameya'), value: jameya.name },
            { label: t('jameyas.statement.shares'), value: formatNumber(member.turnSequences.length, locale) },
            {
              label: t('jameyas.statement.payoutTurns'),
              value: member.turnSequences
                .map((sequence) => formatNumber(sequence, locale))
                .join(t('jameyas.statement.sequenceSeparator')),
            },
            {
              label: t(`jameyas.statement.perTurn.${jameya.recurrenceType}`),
              value: money(memberDues[0]?.amount ?? 0),
            },
          ],
          totals: [
            { label: t('jameyas.statement.totalPaid'), value: money(member.paidAmount), tone: 'success' },
            {
              label: t('jameyas.statement.overdue'),
              value: money(member.lateAmount),
              tone: member.lateAmount > 0 ? 'danger' : 'muted',
            },
            { label: t('jameyas.statement.remaining'), value: money(member.remainingAmount), tone: 'muted' },
            { label: t('jameyas.statement.received'), value: money(member.receivedAmount), tone: 'muted' },
          ],
          columns: {
            turn: t('jameyas.statement.columns.turn'),
            date: t('jameyas.statement.columns.date'),
            due: t('jameyas.statement.columns.due'),
            paid: t('jameyas.statement.columns.paid'),
            status: t('jameyas.statement.columns.status'),
          },
          rows,
          ownTurnLabel: t('jameyas.statement.ownTurn'),
          footerPrefix: t('jameyas.receipt.footerPrefix'),
          shop: {
            name: shop.displayName,
            phone: shop.phone,
            logoUrl: shop.logoUrl ? resolveAssetUrl(shop.logoUrl) : null,
            accentColor: BRAND_COLOR_HEX[shop.brandColor],
          },
        });
        await sharePdf({
          html,
          pageSize: STATEMENT_PAGE_SIZE,
          fileName: `${jameya.name} ${member.name}`,
          fallbackFileName: STATEMENT_FALLBACK_FILE_NAME,
          dialogTitle: t('jameyas.statement.title'),
        });
      } catch {
        showToast(t('jameyas.receipt.shareError'), 'error');
      } finally {
        setSharingMemberId(null);
      }
    },
    [branding.data, isRTL, jameya, locale, sharingMemberId, showToast, t],
  );

  return { shareStatement, sharingMemberId, canShare: Boolean(branding.data) && sharingMemberId === null };
}
