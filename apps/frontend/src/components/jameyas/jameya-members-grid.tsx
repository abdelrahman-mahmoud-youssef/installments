'use client';

import { HandCoins } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { FaWhatsapp } from 'react-icons/fa6';
import { DateText } from '@/components/shared/date-text';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { JameyaCycle, JameyaDetail, JameyaDue } from '@/lib/api/jameyas';
import { formatMoney } from '@/lib/format';
import { toWhatsappNumber } from '@/lib/phone';
import { cn } from '@/lib/utils';

type CellKind = 'paid' | 'partial' | 'late' | 'due' | 'upcoming';

const CELL_TONE: Record<CellKind, string> = {
  paid: 'bg-success-soft text-success',
  partial: 'bg-warning-soft text-warning',
  late: 'bg-danger-soft text-danger',
  due: 'bg-info-soft text-info',
  upcoming: 'bg-muted text-muted-foreground',
};

const LEGEND: CellKind[] = ['paid', 'partial', 'late', 'due', 'upcoming'];

function cellKindOf(due: JameyaDue, cycle: JameyaCycle): CellKind {
  if (due.status === 'PAID') {
    return 'paid';
  }
  if (due.isLate) {
    return 'late';
  }
  if (due.status === 'PARTIALLY_PAID') {
    return 'partial';
  }
  return cycle.state === 'UPCOMING' ? 'upcoming' : 'due';
}

export function hasReceivedAndIsLate(member: { receivedAmount: number; lateAmount: number }): boolean {
  return member.receivedAmount > 0 && member.lateAmount > 0;
}

export function JameyaMembersGrid({ jameya }: { jameya: JameyaDetail }) {
  const t = useTranslations('jameyas.grid');
  const locale = useLocale();
  const duesByCell = new Map(jameya.dues.map((due) => [`${due.cycleId}:${due.customerId}`, due]));

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-xs">
        <table className="w-max min-w-full border-separate border-spacing-0 text-sm">
          <thead>
            <tr>
              <th
                scope="col"
                className="sticky start-0 z-10 border-b border-e border-border bg-card px-4 py-3 text-start font-medium text-muted-foreground"
              >
                {t('member')}
              </th>
              {jameya.cycles.map((cycle) => (
                <th
                  key={cycle.id}
                  scope="col"
                  className="border-b border-border px-2 py-3 text-center font-medium whitespace-nowrap text-muted-foreground"
                >
                  <span className="block text-foreground">{t('turn', { sequence: cycle.sequence })}</span>
                  <DateText value={cycle.dueDate} className="text-xs" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {jameya.members.map((member) => (
              <tr key={member.customerId}>
                <th
                  scope="row"
                  className="sticky start-0 z-10 border-b border-e border-border bg-card px-4 py-2.5 text-start font-medium"
                >
                  <span className="flex min-w-40 items-start justify-between gap-2">
                    <span className="flex min-w-0 flex-col gap-1">
                      <span className="truncate">{member.name}</span>
                      {hasReceivedAndIsLate(member) && (
                        <Badge variant="destructive" className="w-fit">
                          {t('receivedAndLate')}
                        </Badge>
                      )}
                    </span>
                    {member.reminderMessage && (
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={t('sendReminder', { name: member.name })}
                        title={t('sendReminder', { name: member.name })}
                        render={
                          <a
                            href={`https://wa.me/${toWhatsappNumber(member.phone)}?text=${encodeURIComponent(member.reminderMessage)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          />
                        }
                      >
                        <FaWhatsapp className="size-4 text-success" />
                      </Button>
                    )}
                  </span>
                </th>
                {jameya.cycles.map((cycle) => {
                  const due = duesByCell.get(`${cycle.id}:${member.customerId}`);
                  if (!due) {
                    return <td key={cycle.id} className="border-b border-border" />;
                  }
                  const kind = cellKindOf(due, cycle);
                  const isOwnTurn = member.turnSequences.includes(cycle.sequence);
                  return (
                    <td key={cycle.id} className="border-b border-border px-1.5 py-2 text-center">
                      <span
                        title={t('cellTitle', {
                          paid: formatMoney(due.paidAmount, locale),
                          amount: formatMoney(due.amount, locale),
                        })}
                        className={cn(
                          'inline-flex min-w-20 items-center justify-center gap-1 rounded-md px-2 py-1 text-xs font-medium whitespace-nowrap',
                          CELL_TONE[kind],
                          isOwnTurn && 'ring-2 ring-primary ring-offset-1 ring-offset-card',
                        )}
                      >
                        {isOwnTurn && <HandCoins className="size-3.5" aria-label={t('ownTurn')} />}
                        {t(`cell.${kind}`)}
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        {LEGEND.map((kind) => (
          <span key={kind} className={cn('rounded-md px-2 py-0.5 font-medium', CELL_TONE[kind])}>
            {t(`cell.${kind}`)}
          </span>
        ))}
        <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 ring-2 ring-primary">
          <HandCoins className="size-3.5" />
          {t('ownTurn')}
        </span>
      </div>
    </div>
  );
}
