import { BrandColor } from '@prisma/client';

const PLACEHOLDER_BASE_URL = 'https://placehold.co';
const PORTRAIT_BASE_URL = 'https://randomuser.me/api/portraits';
const PORTRAIT_VARIANT_COUNT = 90;
const PRODUCT_IMAGE_SIZE = '800x600';
const PROMOTION_IMAGE_SIZE = '1000x600';
const ID_CARD_IMAGE_SIZE = '800x500';
const SCREENSHOT_IMAGE_SIZE = '540x960';
const LOGO_IMAGE_SIZE = '400x400';
const RECEIPT_IMAGE_SIZE = '600x800';
const IMAGE_TEXT_COLOR = 'ffffff';

const BRAND_COLOR_HEX: Record<BrandColor, string> = {
  emerald: '10b981',
  teal: '14b8a6',
  blue: '3b82f6',
  indigo: '6366f1',
  violet: '8b5cf6',
  rose: 'f43f5e',
  amber: 'f59e0b',
  yellow: 'eab308',
  slate: '64748b',
};

export type PortraitGender = 'men' | 'women';

function placeholderUrl(size: string, background: string, text: string): string {
  return `${PLACEHOLDER_BASE_URL}/${size}/${background}/${IMAGE_TEXT_COLOR}/png?text=${encodeURIComponent(text)}`;
}

export function portraitUrl(gender: PortraitGender, seedIndex: number): string {
  return `${PORTRAIT_BASE_URL}/${gender}/${(seedIndex * 7 + 3) % PORTRAIT_VARIANT_COUNT}.jpg`;
}

export function productImageUrl(label: string, brandColor: BrandColor): string {
  return placeholderUrl(PRODUCT_IMAGE_SIZE, BRAND_COLOR_HEX[brandColor], label);
}

export function promotionImageUrl(label: string, brandColor: BrandColor): string {
  return placeholderUrl(PROMOTION_IMAGE_SIZE, BRAND_COLOR_HEX[brandColor], label);
}

export function logoImageUrl(initials: string, brandColor: BrandColor): string {
  return placeholderUrl(LOGO_IMAGE_SIZE, BRAND_COLOR_HEX[brandColor], initials);
}

export function idCardImageUrl(side: 'Front' | 'Back'): string {
  return placeholderUrl(ID_CARD_IMAGE_SIZE, BRAND_COLOR_HEX.slate, `National ID - ${side}`);
}

export function transferScreenshotUrl(walletLabel: string): string {
  return placeholderUrl(SCREENSHOT_IMAGE_SIZE, BRAND_COLOR_HEX.teal, `${walletLabel} transfer`);
}

export function receiptImageUrl(label: string): string {
  return placeholderUrl(RECEIPT_IMAGE_SIZE, BRAND_COLOR_HEX.slate, label);
}
