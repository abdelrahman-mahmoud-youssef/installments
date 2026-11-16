import { getTranslations } from 'next-intl/server';
import { LegalPageBody } from '@/components/marketing/legal-page-body';
import { MarketingShell } from '@/components/marketing/marketing-shell';

const SECTION_COUNT = 12;

export default async function TermsPage() {
  const t = await getTranslations('legal.terms');

  return (
    <MarketingShell>
      <LegalPageBody t={t} sectionCount={SECTION_COUNT} />
    </MarketingShell>
  );
}
