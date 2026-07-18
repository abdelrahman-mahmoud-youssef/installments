export const config = {
  get backendUrl(): string {
    const value = process.env.BACKEND_URL;
    if (!value) {
      throw new Error('Missing required environment variable: BACKEND_URL');
    }
    return value;
  },
  authCookieName: 'installment_token',
} as const;
