import { getPublicContractDetail } from '@/lib/api/public';
import { resolveAssetUrl } from '@/lib/assets';
import { ogMessage } from '@/lib/og-messages';
import { OG_IMAGE_SIZE, renderOgImageResponse } from '@/lib/render-og-image';

export const size = OG_IMAGE_SIZE;
export const contentType = 'image/png';

export default async function Image({
  params,
}: {
  params: Promise<{ locale: string; uuid: string; contractId: string }>;
}) {
  const { locale, uuid, contractId } = await params;
  const contract = await getPublicContractDetail(uuid, contractId);

  if (!contract) {
    return renderOgImageResponse({
      logoUrl: null,
      brandColor: 'emerald',
      title: ogMessage(locale, 'publicCustomer', 'back'),
    });
  }

  return renderOgImageResponse({
    logoUrl: resolveAssetUrl(contract.branding.logoUrl),
    brandColor: contract.branding.brandColor,
    title: contract.productName,
    subtitle: ogMessage(locale, 'publicCustomer', 'ogContractSubtitle', { shop: contract.branding.displayName }),
  });
}
