import { useTranslations } from 'next-intl';
import { JameyaDetail, JameyaMember } from '@/lib/api/jameyas';
import { formatDate, todayIso } from '@/lib/format';
import { dueKindOf, JameyaDueKind } from '@/lib/jameya-turns';

export type JameyaStatementTone = 'success' | 'danger' | 'muted';

export interface JameyaStatementFigure {
  label: string;
  amount: number;
  tone: JameyaStatementTone;
}

export interface JameyaStatementRow {
  key: string;
  turn: string;
  date: string;
  due: number;
  paid: number;
  status: string;
  tone: JameyaStatementTone;
  isOwnTurn: boolean;
}

export interface JameyaStatementContent {
  documentLabel: string;
  title: string;
  issuedOn: string;
  details: { label: string; value: string }[];
  perTurn: { label: string; amount: number };
  totals: JameyaStatementFigure[];
  columns: { turn: string; date: string; due: string; paid: string; status: string };
  rows: JameyaStatementRow[];
  ownTurnLabel: string;
  footerPrefix: string;
}

const STATUS_TONE: Record<JameyaDueKind, JameyaStatementTone> = {
  paid: 'success',
  partial: 'muted',
  late: 'danger',
  due: 'muted',
  upcoming: 'muted',
};

export function useJameyaMemberStatement(jameya: JameyaDetail) {
  const t = useTranslations('jameyas.statement');
  const tReceipt = useTranslations('jameyas.receipt');

  function buildStatement(member: JameyaMember): JameyaStatementContent {
    const memberDues = jameya.dues.filter((due) => due.customerId === member.customerId);
    const perTurnAmount = memberDues[0]?.amount ?? 0;
    const rows = jameya.cycles.flatMap((cycle) => {
      const due = memberDues.find((item) => item.cycleId === cycle.id);
      if (!due) {
        return [];
      }
      const kind = dueKindOf(due, cycle);
      return [
        {
          key: cycle.id,
          turn: String(cycle.sequence),
          date: formatDate(cycle.dueDate),
          due: due.amount,
          paid: due.paidAmount,
          status: t(`status.${kind}`),
          tone: STATUS_TONE[kind],
          isOwnTurn: member.turnSequences.includes(cycle.sequence),
        },
      ];
    });

    return {
      documentLabel: t('documentLabel'),
      title: t('title'),
      issuedOn: tReceipt('issuedOn', { date: formatDate(todayIso()) }),
      details: [
        { label: t('member'), value: member.name },
        { label: t('jameya'), value: jameya.name },
        { label: t('shares'), value: String(member.turnSequences.length) },
        { label: t('payoutTurns'), value: member.turnSequences.join(t('sequenceSeparator')) },
      ],
      perTurn: { label: t(`perTurn.${jameya.recurrenceType}`), amount: perTurnAmount },
      totals: [
        { label: t('totalPaid'), amount: member.paidAmount, tone: 'success' },
        { label: t('overdue'), amount: member.lateAmount, tone: member.lateAmount > 0 ? 'danger' : 'muted' },
        { label: t('remaining'), amount: member.remainingAmount, tone: 'muted' },
        { label: t('received'), amount: member.receivedAmount, tone: 'muted' },
      ],
      columns: {
        turn: t('columns.turn'),
        date: t('columns.date'),
        due: t('columns.due'),
        paid: t('columns.paid'),
        status: t('columns.status'),
      },
      rows,
      ownTurnLabel: t('ownTurn'),
      footerPrefix: tReceipt('footerPrefix'),
    };
  }

  return { buildStatement };
}
