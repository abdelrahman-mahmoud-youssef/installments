'use client';

import { FileWarning, HandCoins, PiggyBank, ShieldAlert, Wallet } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { BackLink } from '@/components/shared/back-link';
import { EmptyState } from '@/components/shared/empty-state';
import { MetricCard } from '@/components/shared/metric-card';
import { Money } from '@/components/shared/money';
import { FadeIn } from '@/components/shared/motion';
import { Section } from '@/components/shared/section';
import { StatusBadge } from '@/components/shared/status-badge';
import { Skeleton } from '@/components/ui/skeleton';
import { JameyaCurrentCyclePanel, JameyaCyclesList } from '@/components/jameyas/jameya-cycles';
import { JameyaEditDialog } from '@/components/jameyas/jameya-edit-dialog';
import { JameyaMembersGrid } from '@/components/jameyas/jameya-members-grid';
import { JameyaPayoutDialog } from '@/components/jameyas/jameya-payout-dialog';
import { JameyaPaymentsHistory } from '@/components/jameyas/jameya-payments-history';
import { useJameyaAccess } from '@/hooks/use-jameya-access';
import { useJameya } from '@/hooks/use-jameyas';
import { ApiError } from '@/lib/api/client';
import { JameyaCycle } from '@/lib/api/jameyas';
import { routes } from '@/lib/routes';

export default function JameyaDetailPage() {
  const t = useTranslations('jameyas.detail');
  const tNav = useTranslations('nav');
  const tRecurrence = useTranslations('recurrenceType');
  const { id } = useParams<{ id: string }>();
  const { data: jameya, isLoading, isError, error } = useJameya(id);
  const { canManageJameyas } = useJameyaAccess();
  const [payoutCycle, setPayoutCycle] = useState<JameyaCycle | null>(null);
  const [isPayoutOpen, setIsPayoutOpen] = useState(false);

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
              <StatusBadge status={jameya.status} />
            </div>
            <p className="text-sm text-muted-foreground">
              {t('summaryLine', {
                members: jameya.shareCount,
                recurrence: tRecurrence(jameya.recurrenceType),
              })}{' '}
              · <Money minorUnits={jameya.shareAmount} /> {t('perShare')}
            </p>
            {jameya.notes && <p className="text-sm whitespace-pre-line text-muted-foreground">{jameya.notes}</p>}
          </div>
          {canManageJameyas && <JameyaEditDialog jameya={jameya} />}
        </div>
      </FadeIn>

      <FadeIn delay={0.06}>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <MetricCard
            label={t('pot')}
            value={<Money minorUnits={jameya.potAmount} />}
            icon={PiggyBank}
            tone="primary"
          />
          <MetricCard
            label={t('collected')}
            value={<Money minorUnits={jameya.collectedAmount} />}
            icon={Wallet}
            tone="success"
          />
          <MetricCard
            label={t('paidOut')}
            value={<Money minorUnits={jameya.paidOutAmount} />}
            icon={HandCoins}
            tone="info"
          />
          <MetricCard
            label={t('shopCovered')}
            value={<Money minorUnits={jameya.exposureAmount} />}
            icon={ShieldAlert}
            tone={jameya.exposureAmount > 0 ? 'warning' : 'neutral'}
            hint={t('shopCoveredHint')}
          />
        </div>
      </FadeIn>

      <FadeIn delay={0.08}>
        <JameyaCurrentCyclePanel jameya={jameya} onHandOver={startPayout} />
      </FadeIn>

      <FadeIn delay={0.1} className="space-y-3">
        <h2 className="font-heading text-sm font-semibold">{t('grid')}</h2>
        <JameyaMembersGrid jameya={jameya} />
      </FadeIn>

      <FadeIn delay={0.12}>
        <JameyaCyclesList jameya={jameya} onHandOver={startPayout} />
      </FadeIn>

      <FadeIn delay={0.14}>
        <JameyaPaymentsHistory jameya={jameya} />
      </FadeIn>

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
