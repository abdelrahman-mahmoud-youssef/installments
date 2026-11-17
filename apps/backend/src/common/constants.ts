import { BrandColor } from '@prisma/client';

export const BRAND_COLOR_PRESETS = Object.values(BrandColor);

export type BrandColorPreset = BrandColor;

export const MAX_LOGO_UPLOAD_BYTES = 2 * 1024 * 1024;

export const MAX_ABOUT_IMAGE_UPLOAD_BYTES = 2 * 1024 * 1024;

export const MAX_PAYMENT_PROOF_UPLOAD_BYTES = 4 * 1024 * 1024;

export const MAX_SUPPORT_IMAGE_UPLOAD_BYTES = 4 * 1024 * 1024;

export const SUPPORT_MESSAGE_MAX_LENGTH = 2000;

export const MAX_CUSTOMER_ID_UPLOAD_BYTES = 5 * 1024 * 1024;

export const MAX_CUSTOMER_PHOTO_UPLOAD_BYTES = 5 * 1024 * 1024;

export const MAX_CONTACT_PHOTO_UPLOAD_BYTES = 5 * 1024 * 1024;

export const MAX_CONTRACT_IMAGE_UPLOAD_BYTES = 5 * 1024 * 1024;

export const MAX_PAYMENT_METHOD_TRANSACTION_IMAGE_UPLOAD_BYTES = 5 * 1024 * 1024;

export const MAX_OFFER_IMAGE_UPLOAD_BYTES = 5 * 1024 * 1024;

export const MAX_OFFERS = 20;

export const MAX_OFFER_IMAGES = 6;

export const MAX_STAFF_WALLET_GRANTS = 100;

export const ABOUT_MAX_LENGTH = 20_000;

export const RESERVED_SUBDOMAINS = ['www', 'app', 'api', 'admin'];

export const APP_NAME = 'Qistak';

export const LOGIN_LOCKOUT_THRESHOLD = 3;

export const LOGIN_LOCKOUT_BASE_SECONDS = 60;

export const LOGIN_LOCKOUT_MAX_SECONDS = 1800;

export const PASSWORD_RESET_TOKEN_TTL_MINUTES = 30;

export const SHARE_LINK_TARGET_PATH_PATTERN = /^(\/(en|ar))?\/customer\/[^/]+(\/contracts\/[^/]+(\/pay)?)?$/;

export const PAYMENT_METHOD_ICON_KEYS = [
  'wallet',
  'card',
  'cash',
  'bank',
  'phone',
  'gift',
  'cart',
  'store',
  'briefcase',
  'globe',
] as const;

export const SUBSCRIPTION_MONTHLY_PRICE = 20_000;

export const SUBSCRIPTION_REFERRAL_MONTHLY_PRICE = 30_000;

export const SUBSCRIPTION_TRIAL_DAYS = 14;

export const SUBSCRIPTION_MAX_MONTHS = 36;

export const SUBSCRIPTION_MAX_PRICE = 10_000_000;

export const SUBSCRIPTION_NAME_MAX_LENGTH = 60;

export const SUBSCRIPTION_REFERENCE_MAX_LENGTH = 100;

export const SUBSCRIPTION_NOTE_MAX_LENGTH = 500;

export const PLATFORM_EXPIRING_SOON_DAYS = 7;

export const SUBSCRIPTION_RENEWAL_NOTICE_DAYS = 5;

export const SUBSCRIPTION_PUSH_DAYS_BEFORE_EXPIRY = 3;

export const SUBSCRIPTION_PUSH_DAYS_AFTER_EXPIRY = 1;

export const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

export const EXPO_PUSH_BATCH_SIZE = 100;

export const PUSH_TITLE_MAX_LENGTH = 100;

export const PUSH_BODY_MAX_LENGTH = 300;

export const SUBSCRIPTION_PAYMENT_PHONE = '01122662426';

export const SUBSCRIPTION_INACTIVE_ERROR_CODE = 'SUBSCRIPTION_INACTIVE';

export const DEACTIVATED_ACCOUNT_MESSAGE = 'This account has been deactivated. You can contact support.';
