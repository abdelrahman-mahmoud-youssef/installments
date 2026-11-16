import { cookies } from 'next/headers';
import { getLocale } from 'next-intl/server';
import { FeaturesSection } from '@/components/marketing/features-section';
import { FinalCtaSection } from '@/components/marketing/final-cta-section';
import { HeroSection } from '@/components/marketing/hero-section';
import { HowItWorksSection } from '@/components/marketing/how-it-works-section';
import { MarketingShell } from '@/components/marketing/marketing-shell';
import { ProductSection } from '@/components/marketing/product-section';
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
    <MarketingShell>
      <HeroSection />
      <FeaturesSection />
      <ProductSection />
      <HowItWorksSection />
      <FinalCtaSection />
    </MarketingShell>
  );
}
