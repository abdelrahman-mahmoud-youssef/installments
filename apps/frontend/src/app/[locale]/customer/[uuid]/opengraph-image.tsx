import { getTranslations } from 'next-intl/server';
import { getPublicCustomer } from '@/lib/api/public';
import { resolveAssetUrl } from '@/lib/assets';
import { OG_IMAGE_SIZE, renderOgImageResponse } from '@/lib/render-og-image';

export const size = OG_IMAGE_SIZE;
export const contentType = 'image/png';

export default async function Image({
  params,
}: {
  params: Promise<{ locale: string; uuid: string }>;
}) {
  const { locale, uuid } = await params;
  const [customer, t] = await Promise.all([
    getPublicCustomer(uuid),
    getTranslations({ locale, namespace: 'publicCustomer' }),
  ]);

  if (!customer) {
    return renderOgImageResponse({ logoUrl: null, brandColor: 'emerald', title: t('welcome') });
  }

  return renderOgImageResponse({
    logoUrl: resolveAssetUrl(customer.branding.logoUrl),
    brandColor: customer.branding.brandColor,
    title: customer.name,
    subtitle: t('ogCustomerSubtitle', { shop: customer.branding.displayName }),
  });
}
