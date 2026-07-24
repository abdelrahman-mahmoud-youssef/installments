import { BrandColor } from '@prisma/client';

export const BRAND_COLOR_PRESETS = Object.values(BrandColor);

export type BrandColorPreset = BrandColor;

export const MAX_LOGO_UPLOAD_BYTES = 2 * 1024 * 1024;

export const MAX_ABOUT_IMAGE_UPLOAD_BYTES = 2 * 1024 * 1024;

export const MAX_PAYMENT_PROOF_UPLOAD_BYTES = 4 * 1024 * 1024;

export const MAX_CUSTOMER_ID_UPLOAD_BYTES = 5 * 1024 * 1024;

export const MAX_CONTRACT_IMAGE_UPLOAD_BYTES = 5 * 1024 * 1024;

export const ABOUT_MAX_LENGTH = 20_000;
