'use client';

import { FileWarning, HandCoins, ListChecks, type LucideIcon, Receipt } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { BackLink } from '@/components/shared/back-link';
import { EmptyState } from '@/components/shared/empty-state';
import { FadeIn } from '@/components/shared/motion';
import { Section } from '@/components/shared/section';
import { StatusBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { JameyaCurrentTurnCard } from '@/components/jameyas/jameya-current-turn-card';
import { JameyaEditDialog } from '@/components/jameyas/jameya-edit-dialog';
import { JameyaMemberSheet } from '@/components/jameyas/jameya-member-sheet';
import { JameyaMoreViews } from '@/components/jameyas/jameya-more-views';
import { JameyaPayoutDialog } from '@/components/jameyas/jameya-payout-dialog';
import { JameyaTurnMembers } from '@/components/jameyas/jameya-turn-members';
import { JameyaTurnsList } from '@/components/jameyas/jameya-turns-list';
import { JameyaUnpaidMembers } from '@/components/jameyas/jameya-unpaid-members';
import { RecordJameyaPaymentDialog } from '@/components/jameyas/record-jameya-payment-dialog';
import { useJameyaAccess } from '@/hooks/use-jameya-access';
import { useJameya } from '@/hooks/use-jameyas';
import { ApiError } from '@/lib/api/client';
import { JameyaCycle } from '@/lib/api/jameyas';
import { formatMoney } from '@/lib/format';
import { findCurrentTurn } from '@/lib/jameya-turns';
import { routes } from '@/lib/routes';

const DETAIL_TABS = ['current', 'details'] as const;
type DetailTab = (typeof DETAIL_TABS)[number];

const DETAIL_TAB_ICONS: Record<DetailTab, LucideIcon> = {
  current: HandCoins,
  details: ListChecks,
};

export default function JameyaDetailPage() {
  const t = useTranslations('jameyas.detail');
  const tNav = useTranslations('nav');
  const locale = useLocale();
  const { id } = useParams<{ id: string }>();
  const { data: jameya, isLoading, isError, error } = useJameya(id);
  const { canManageJameyas } = useJameyaAccess();
  const [payoutCycle, setPayoutCycle] = useState<JameyaCycle | null>(null);
  const [isPayoutOpen, setIsPayoutOpen] = useState(false);
  const [memberId, setMemberId] = useState<string | null>(null);
  const [tab, setTab] = useState<DetailTab>('current');

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-5 w-28" />
        <Skeleton className="h-28 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  if (isError || !jameya) {
    return (
      <Section>
        <EmptyState
          icon={FileWarning}
          title={t('notFound')}
          description={error instanceof ApiError ? error.message : undefined}
        />
      </Section>
    );
  }

  function startPayout(cycle: JameyaCycle) {
    setPayoutCycle(cycle);
    setIsPayoutOpen(true);
  }

  const currentTurn = findCurrentTurn(jameya);
  const money = (minorUnits: number) => formatMoney(minorUnits, locale, { hideWholeDecimals: true });

  return (
    <div className="space-y-6">
      <FadeIn>
        <BackLink href={routes.jameyas} label={tNav('jameyas')} />
      </FadeIn>

      <FadeIn delay={0.04}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-1.5">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-heading text-2xl font-semibold tracking-tight">{jameya.name}</h1>
              {jameya.status !== 'ACTIVE' && <StatusBadge status={jameya.status} />}
            </div>
            <p className="text-sm text-muted-foreground">
              {t('headerLine', {
                members: jameya.members.length,
                share: money(jameya.shareAmount),
                period: t(`period.${jameya.recurrenceType}`),
                pot: money(jameya.potAmount),
              })}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {canManageJameyas && <JameyaEditDialog jameya={jameya} />}
            {jameya.status === 'ACTIVE' && (
              <RecordJameyaPaymentDialog
                jameya={jameya}
                trigger={
                  <Button>
                    <Receipt className="size-4" />
                    {t('recordPayment')}
                  </Button>
                }
              />
            )}
          </div>
        </div>
      </FadeIn>

      <FadeIn delay={0.06}>
        <Tabs value={tab} onValueChange={(value) => setTab(value as DetailTab)}>
          <TabsList className="w-full">
            {DETAIL_TABS.map((value) => {
              const Icon = DETAIL_TAB_ICONS[value];
              return (
                <TabsTrigger key={value} value={value} className="flex-1 gap-1.5">
                  <Icon className="size-4" />
                  {t(`tabs.${value}`)}
                </TabsTrigger>
              );
            })}
          </TabsList>
        </Tabs>
      </FadeIn>

      {tab === 'current' ? (
        <>
          <JameyaCurrentTurnCard jameya={jameya} onHandOver={startPayout} />
          {currentTurn && (
            <Section title={t('turnMembersTitle')}>
              <JameyaTurnMembers
                jameya={jameya}
                cycle={currentTurn}
                canRecord={jameya.status === 'ACTIVE'}
                onOpenMember={setMemberId}
              />
            </Section>
          )}
        </>
      ) : (
        <>
          <JameyaUnpaidMembers jameya={jameya} onOpenMember={setMemberId} />
          <JameyaTurnsList jameya={jameya} onHandOver={startPayout} onOpenMember={setMemberId} />
          <JameyaMoreViews jameya={jameya} />
        </>
      )}

      <JameyaMemberSheet jameya={jameya} customerId={memberId} onClose={() => setMemberId(null)} />
      {canManageJameyas && (
        <JameyaPayoutDialog
          jameya={jameya}
          cycle={payoutCycle}
          open={isPayoutOpen}
          onOpenChange={setIsPayoutOpen}
        />
      )}
    </div>
  );
}
