'use client';

import { useLocale, useTranslations } from 'next-intl';
import { InviteLinkField } from '@/components/referrals/invite-link-field';
import { Section } from '@/components/shared/section';
import { Skeleton } from '@/components/ui/skeleton';
import { useCurrentUser } from '@/hooks/use-current-user';
import { formatMoney } from '@/lib/format';

export function InviteSection() {
  const t = useTranslations('referral');
  const locale = useLocale();
  const { data: currentUser } = useCurrentUser();

  return (
    <Section
      title={t('sectionTitle')}
      description={
        currentUser
          ? t('sectionDescription', { price: formatMoney(currentUser.subscription.referralMonthlyPrice, locale) })
          : undefined
      }
    >
      {currentUser ? <InviteLinkField shopSlug={currentUser.tenant.slug} /> : <Skeleton className="h-14 w-full" />}
    </Section>
  );
}
