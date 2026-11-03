'use client';

import { useTranslations } from 'next-intl';
import { CopyableValue } from '@/components/shared/copyable-value';
import { buildInviteUrl } from '@/lib/referral';

export function InviteLinkField({ shopSlug }: { shopSlug: string }) {
  const t = useTranslations('referral');

  return (
    <CopyableValue
      label={t('inviteLink')}
      value={buildInviteUrl(shopSlug)}
      copyLabel={t('copyInviteLink')}
      copiedMessage={t('inviteLinkCopied')}
    />
  );
}
