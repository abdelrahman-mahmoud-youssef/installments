import { getTranslations } from 'next-intl/server';
import { LegalPageBody } from '@/components/marketing/legal-page-body';
import { MarketingShell } from '@/components/marketing/marketing-shell';

const SECTION_COUNT = 11;

export default async function PrivacyPage() {
  const t = await getTranslations('legal.privacy');

  return (
    <MarketingShell>
      <LegalPageBody t={t} sectionCount={SECTION_COUNT} />
    </MarketingShell>
  );
}
