export const config = {
  get backendUrl(): string {
    const value = process.env.BACKEND_URL;
    if (!value) {
      throw new Error('Missing required environment variable: BACKEND_URL');
    }
    return value;
  },
  get publicBackendUrl(): string {
    const value = process.env.NEXT_PUBLIC_BACKEND_URL;
    if (!value) {
      throw new Error('Missing required environment variable: NEXT_PUBLIC_BACKEND_URL');
    }
    return value;
  },
  get siteUrl(): string {
    return process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
  },
  authCookieName: 'installment_token',
} as const;
