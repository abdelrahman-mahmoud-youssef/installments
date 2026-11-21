'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';
import { Section } from '@/components/shared/section';
import { Button } from '@/components/ui/button';
import { JameyaDetail } from '@/lib/api/jameyas';
import { formatMoney } from '@/lib/format';
import { JameyaWhatsappButton } from './jameya-whatsapp-button';

const VISIBLE_UNPAID_MEMBERS = 5;

export function JameyaUnpaidMembers({
  jameya,
  onOpenMember,
}: {
  jameya: JameyaDetail;
  onOpenMember: (customerId: string) => void;
}) {
  const t = useTranslations('jameyas.detail');
  const locale = useLocale();
  const [showAll, setShowAll] = useState(false);
  const unpaid = jameya.members
    .filter((member) => member.dueNowAmount > 0)
    .sort((first, second) => second.dueNowAmount - first.dueNowAmount);
  const visible = showAll ? unpaid : unpaid.slice(0, VISIBLE_UNPAID_MEMBERS);

  return (
    <Section title={t('unpaidTitle')}>
      {unpaid.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t('everyonePaid')}</p>
      ) : (
        <div className="space-y-2">
          <ul className="divide-y divide-border">
            {visible.map((member) => (
              <li key={member.customerId} className="flex items-center gap-3 py-2">
                <button
                  type="button"
                  onClick={() => onOpenMember(member.customerId)}
                  className="min-w-0 flex-1 truncate text-start text-sm font-medium hover:underline"
                >
                  {member.name}
                </button>
                <span className="shrink-0 text-sm font-semibold text-danger">
                  {t('owes', { amount: formatMoney(member.dueNowAmount, locale, { hideWholeDecimals: true }) })}
                </span>
                <JameyaWhatsappButton member={member} />
              </li>
            ))}
          </ul>
          {unpaid.length > VISIBLE_UNPAID_MEMBERS && (
            <Button variant="ghost" size="sm" onClick={() => setShowAll((current) => !current)}>
              {showAll ? t('showLess') : t('showAll')}
            </Button>
          )}
        </div>
      )}
    </Section>
  );
}
