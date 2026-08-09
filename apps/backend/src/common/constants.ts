import { BrandColor } from '@prisma/client';

export const BRAND_COLOR_PRESETS = Object.values(BrandColor);

export type BrandColorPreset = BrandColor;

export const MAX_LOGO_UPLOAD_BYTES = 2 * 1024 * 1024;

export const MAX_ABOUT_IMAGE_UPLOAD_BYTES = 2 * 1024 * 1024;

export const MAX_PAYMENT_PROOF_UPLOAD_BYTES = 4 * 1024 * 1024;

export const MAX_CUSTOMER_ID_UPLOAD_BYTES = 5 * 1024 * 1024;

export const MAX_CUSTOMER_PHOTO_UPLOAD_BYTES = 5 * 1024 * 1024;

export const MAX_CONTRACT_IMAGE_UPLOAD_BYTES = 5 * 1024 * 1024;

export const MAX_PAYMENT_METHOD_TRANSACTION_IMAGE_UPLOAD_BYTES = 5 * 1024 * 1024;

export const MAX_OFFER_IMAGE_UPLOAD_BYTES = 5 * 1024 * 1024;

export const MAX_OFFERS = 20;

export const MAX_OFFER_IMAGES = 6;

export const ABOUT_MAX_LENGTH = 20_000;

export const RESERVED_SUBDOMAINS = ['www', 'app', 'api', 'admin'];

export const APP_NAME = 'Qistak';

export const LOGIN_LOCKOUT_THRESHOLD = 3;

export const LOGIN_LOCKOUT_BASE_SECONDS = 60;

export const LOGIN_LOCKOUT_MAX_SECONDS = 1800;

export const PASSWORD_RESET_TOKEN_TTL_MINUTES = 30;

export const SHARE_LINK_TARGET_PATH_PATTERN = /^(\/(en|ar))?\/customer\/[^/]+(\/contracts\/[^/]+(\/pay)?)?$/;
