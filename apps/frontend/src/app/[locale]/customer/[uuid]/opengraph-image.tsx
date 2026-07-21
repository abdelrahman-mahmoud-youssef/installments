import { getPublicCustomer } from '@/lib/api/public';
import { resolveAssetUrl } from '@/lib/assets';
import { ogMessage } from '@/lib/og-messages';
import { OG_IMAGE_SIZE, renderOgImageResponse } from '@/lib/render-og-image';

export const size = OG_IMAGE_SIZE;
export const contentType = 'image/png';

export default async function Image({
  params,
}: {
  params: Promise<{ locale: string; uuid: string }>;
}) {
  const { locale, uuid } = await params;
  const customer = await getPublicCustomer(uuid);

  if (!customer) {
    return renderOgImageResponse({
      logoUrl: null,
      brandColor: 'emerald',
      title: ogMessage(locale, 'publicCustomer', 'welcome'),
    });
  }

  return renderOgImageResponse({
    logoUrl: resolveAssetUrl(customer.branding.logoUrl),
    brandColor: customer.branding.brandColor,
    title: customer.name,
    subtitle: ogMessage(locale, 'publicCustomer', 'ogCustomerSubtitle', { shop: customer.branding.displayName }),
  });
}
