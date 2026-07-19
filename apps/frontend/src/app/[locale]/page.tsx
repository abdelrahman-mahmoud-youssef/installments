import { cookies } from 'next/headers';
import { getLocale } from 'next-intl/server';
import { FaqSection } from '@/components/marketing/faq-section';
import { FeatureGridSection } from '@/components/marketing/feature-grid-section';
import { FinalCtaSection } from '@/components/marketing/final-cta-section';
import { HeroSection } from '@/components/marketing/hero-section';
import { HowItWorksSection } from '@/components/marketing/how-it-works-section';
import { MarketingFooter } from '@/components/marketing/marketing-footer';
import { MarketingHeader } from '@/components/marketing/marketing-header';
import { ProblemSolutionSection } from '@/components/marketing/problem-solution-section';
import { TrustSection } from '@/components/marketing/trust-section';
import { redirect } from '@/i18n/navigation';
import { config } from '@/lib/config';
import { routes } from '@/lib/routes';

export default async function RootPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(config.authCookieName)?.value;

  if (token) {
    const locale = await getLocale();
    redirect({ href: routes.dashboard, locale });
  }

  return (
    <div className="min-h-screen bg-background">
      <MarketingHeader />
      <main>
        <HeroSection />
        <ProblemSolutionSection />
        <FeatureGridSection />
        <HowItWorksSection />
        <TrustSection />
        <FaqSection />
        <FinalCtaSection />
      </main>
      <MarketingFooter />
    </div>
  );
}
