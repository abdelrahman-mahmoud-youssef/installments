import { getTranslations } from 'next-intl/server';
import { LegalPageBody } from '@/components/marketing/legal-page-body';
import { MarketingFooter } from '@/components/marketing/marketing-footer';
import { MarketingHeader } from '@/components/marketing/marketing-header';

const SECTION_COUNT = 12;

export default async function TermsPage() {
  const t = await getTranslations('legal.terms');

  return (
    <div className="min-h-screen bg-background">
      <MarketingHeader />
      <main>
        <LegalPageBody t={t} sectionCount={SECTION_COUNT} />
      </main>
      <MarketingFooter />
    </div>
  );
}
